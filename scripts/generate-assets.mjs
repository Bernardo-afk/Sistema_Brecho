// Gera os assets demonstrativos (fotos, GLB, panoramas e hotspots) renderizando
// cenas procedurais Three.js no Chromium headless.
//
// Uso: npm run assets            (gera tudo)
//      npm run assets -- --only=rooms|products
//
// Requer Playwright + Chromium disponíveis na máquina (apenas para desenvolvedores;
// os arquivos gerados já estão versionados em public/assets).
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, rooms } from './asset-spec.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
const filter = process.argv.find((a) => a.startsWith('--id='))?.split('=')[1];

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(require.resolve('playwright', { paths: ['/usr/lib/node_modules', '/usr/local/lib/node_modules'] }));
}

const bundle = await build({
  entryPoints: [path.join(root, 'scripts/asset-studio/studio.js')],
  bundle: true,
  write: false,
  format: 'iife',
  minify: false,
});
const js = bundle.outputFiles[0].text;

const browser = await playwright.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('console', (m) => m.type() === 'error' && console.error('[browser]', m.text()));
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.route('http://studio.local/**', async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><body style="margin:0;background:#222"></body>' });
  if (url.pathname === '/studio.js') return route.fulfill({ contentType: 'text/javascript', body: js });
  const file = path.join(pub, decodeURIComponent(url.pathname));
  try {
    return route.fulfill({ body: await fs.readFile(file) });
  } catch {
    return route.fulfill({ status: 404, body: '' });
  }
});
await page.goto('http://studio.local/');
await page.addScriptTag({ url: 'http://studio.local/studio.js' });
await page.waitForFunction(() => window.Studio?.ready);

const dataUrlToBuf = (d) => Buffer.from(d.split(',')[1], 'base64');
async function write(rel, buf) {
  const f = path.join(pub, rel);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, buf);
}

const manifest = { products: {}, rooms: {} };
const manifestPath = path.join(root, 'src/data/generated/assets-manifest.json');
try {
  Object.assign(manifest, JSON.parse(await fs.readFile(manifestPath, 'utf8')));
} catch {}

if (!only || only === 'products') {
  for (const [id, spec] of Object.entries(products)) {
    if (filter && id !== filter) continue;
    const t0 = Date.now();
    const res = await page.evaluate((s) => window.Studio.renderProduct(s), spec);
    const photos = [];
    for (let i = 0; i < res.photos.length; i++) {
      const rel = `assets/products/${id}/${i + 1}.jpg`;
      await write(rel, dataUrlToBuf(res.photos[i]));
      photos.push(rel);
    }
    let model = null;
    if (res.glb) {
      model = `assets/models/${id}.glb`;
      await write(model, Buffer.from(res.glb, 'base64'));
    } else if (spec.external) model = spec.external;
    manifest.products[id] = { photos, model };
    console.log(`produto ${id}: ${photos.length} fotos${model ? ' + 3D' : ''} (${Date.now() - t0} ms)`);
  }
}

if (!only || only === 'rooms') {
  for (const room of rooms) {
    if (filter && room.id !== filter) continue;
    const t0 = Date.now();
    const res = await page.evaluate(([r, s]) => window.Studio.renderRoom(r, s), [room, products]);
    await write(`assets/panoramas/${room.id}.jpg`, dataUrlToBuf(res.pano.hi));
    await write(`assets/panoramas/${room.id}-mobile.jpg`, dataUrlToBuf(res.pano.lo));
    const views = {};
    for (const [name, d] of Object.entries(res.views)) {
      const rel = `assets/scenes/${name}.jpg`;
      await write(rel, dataUrlToBuf(d));
      views[name] = rel;
    }
    manifest.rooms[room.id] = {
      image: `assets/panoramas/${room.id}.jpg`,
      imageMobile: `assets/panoramas/${room.id}-mobile.jpg`,
      hotspots: res.hotspots,
      navPoints: res.navPoints,
      views,
    };
    console.log(`ambiente ${room.id}: ${res.hotspots.length} hotspots (${Date.now() - t0} ms)`);
  }
}

await fs.mkdir(path.dirname(manifestPath), { recursive: true });
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
await browser.close();
console.log('manifest salvo em', path.relative(root, manifestPath));
