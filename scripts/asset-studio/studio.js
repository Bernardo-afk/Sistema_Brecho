// Estúdio de renderização executado dentro do Chromium headless pelo script
// scripts/generate-assets.mjs. Expõe window.Studio com funções assíncronas.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { build } from './models.js';
import * as T from './textures.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const loader = new GLTFLoader();
async function loadExternal(url, targetSize) {
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  const b = new THREE.Box3().setFromObject(root);
  const size = b.getSize(new THREE.Vector3());
  const s = targetSize / Math.max(size.x, size.y, size.z);
  root.scale.setScalar(s);
  const b2 = new THREE.Box3().setFromObject(root);
  const c = b2.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -b2.min.y, -c.z);
  const g = new THREE.Group();
  g.add(root);
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

async function makeObject(spec) {
  if (spec.external) return loadExternal(spec.external, spec.size || 0.6);
  return build(spec.type, spec.params);
}

function jpeg(q = 0.86) {
  return renderer.domElement.toDataURL('image/jpeg', q);
}

// ---------- Fotografias de estúdio ----------
function studioScene(isWall) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9e0cf');
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#e6dcc8', roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  if (isWall) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ map: T.wallpaperTexture('#ddd0b6', '#cbbb9a', 'stripes'), roughness: 0.95 }));
    wall.material.map.repeat.set(20, 10);
    wall.position.set(0, 0, -0.001);
    wall.receiveShadow = true;
    scene.add(wall);
  } else {
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: '#e9e0cf', roughness: 1 }));
    back.position.set(0, 10, -6);
    scene.add(back);
  }
  const key = new THREE.DirectionalLight('#fff3e0', 2.6);
  key.position.set(-3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 8;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0004;
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -3;
  sc.right = sc.top = 3;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffe2b8', 1.1);
  rim.position.set(4, 3, -3);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#fff8ec', '#8a7356', 0.6));
  return scene;
}

async function renderProduct(spec) {
  const obj = await makeObject(spec);
  const isWall = !!obj.userData.wall;
  const scene = studioScene(isWall);
  const holder = new THREE.Group();
  holder.add(obj);
  scene.add(holder);
  const box = new THREE.Box3().setFromObject(obj);
  if (isWall) {
    // objeto de parede: centraliza à altura de 1.4 m encostado na parede (z = 0)
    holder.position.set(0, 1.4 - (box.min.y + box.max.y) / 2, -box.min.z + 0.002);
  }
  const b = new THREE.Box3().setFromObject(holder);
  const center = b.getCenter(new THREE.Vector3());
  const size = b.getSize(new THREE.Vector3());
  const radius = size.length() / 2;
  const size_px = spec.photoSize || 1000;
  renderer.setSize(size_px, size_px, false);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  const shots = isWall
    ? [[0, 0.02, 1], [-0.45, 0.05, 1.05], [0.3, -0.1, 0.62]]
    : [[0.62, 0.32, 1], [0, 0.18, 1], [-0.95, 0.45, 0.7]];
  const photos = [];
  for (const [az, el, zoom] of shots) {
    const dist = (radius / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2))) * 0.92 * zoom;
    cam.position.set(center.x + Math.sin(az) * Math.cos(el) * dist, center.y + Math.sin(el) * dist, center.z + Math.cos(az) * Math.cos(el) * dist);
    cam.lookAt(center.x, center.y - size.y * 0.03, center.z);
    renderer.render(scene, cam);
    photos.push(jpeg(0.84));
  }
  let glb = null;
  if (spec.exportGlb) {
    const res = await new GLTFExporter().parseAsync(obj, { binary: true, maxTextureSize: 1024 });
    glb = arrayBufferToBase64(res);
  }
  return { photos, glb, dims: size.toArray() };
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// ---------- Ambientes ----------
const ROOM = { w: 6, d: 5, h: 3 };

function std(o) {
  return new THREE.MeshStandardMaterial(o);
}

function addMesh(scene, geo, mat, pos, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

const WALLS = {
  north: { pos: (t, y) => [t, y, -ROOM.d / 2], rot: 0, len: ROOM.w },
  south: { pos: (t, y) => [t, y, ROOM.d / 2], rot: Math.PI, len: ROOM.w },
  west: { pos: (t, y) => [-ROOM.w / 2, y, t], rot: Math.PI / 2, len: ROOM.d },
  east: { pos: (t, y) => [ROOM.w / 2, y, t], rot: -Math.PI / 2, len: ROOM.d },
};

function wallOffset(wall, t, y, out) {
  const W = WALLS[wall];
  const p = new THREE.Vector3(...W.pos(t, y));
  const n = new THREE.Vector3(Math.sin(W.rot), 0, Math.cos(W.rot));
  return p.addScaledVector(n, out);
}

function buildShell(scene, style) {
  const { w, d, h } = ROOM;
  const floor = addMesh(scene, new THREE.PlaneGeometry(w, d), std({ map: T.floorTexture(style.floor), roughness: 0.55 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  floor.material.map.repeat.set(3.6, 3);
  addMesh(scene, new THREE.PlaneGeometry(w, d), std({ color: '#f1ead9', roughness: 1 }), [0, h, 0], [Math.PI / 2, 0, 0]);
  const wp = T.wallpaperTexture(style.wall, style.ink, style.pattern);
  const wain = std({ map: T.woodTexture(style.wainscot, { rings: 30 }), roughness: 0.6 });
  const trim = std({ color: style.trim, roughness: 0.5 });
  for (const [name, W] of Object.entries(WALLS)) {
    const mat = std({ map: wp.clone(), roughness: 0.92 });
    mat.map.needsUpdate = true;
    mat.map.repeat.set(W.len * 1.1, 1.6);
    addMesh(scene, new THREE.PlaneGeometry(W.len, h), mat, W.pos(0, h / 2), [0, W.rot, 0]);
    // lambri inferior com painéis
    const base = wallOffset(name, 0, 0.47, 0.012);
    addMesh(scene, new THREE.BoxGeometry(W.len, 0.94, 0.024), wain, base.toArray(), [0, W.rot, 0]);
    const panels = Math.floor(W.len / 0.75);
    for (let i = 0; i < panels; i++) {
      const t = -W.len / 2 + (W.len / panels) * (i + 0.5);
      addMesh(scene, new RoundedBoxGeometry(W.len / panels - 0.16, 0.56, 0.02, 2, 0.006), wain, wallOffset(name, t, 0.5, 0.03).toArray(), [0, W.rot, 0]);
    }
    addMesh(scene, new THREE.BoxGeometry(W.len, 0.05, 0.05), trim, wallOffset(name, 0, 0.95, 0.025).toArray(), [0, W.rot, 0]);
    addMesh(scene, new THREE.BoxGeometry(W.len, 0.14, 0.03), trim, wallOffset(name, 0, 0.07, 0.035).toArray(), [0, W.rot, 0]);
    addMesh(scene, new THREE.BoxGeometry(W.len, 0.12, 0.1), trim, wallOffset(name, 0, h - 0.06, 0.05).toArray(), [0, W.rot, 0]);
  }
  // lustre central
  addMesh(scene, new THREE.CylinderGeometry(0.008, 0.008, 0.5, 8), std({ color: '#b08a40', metalness: 1, roughness: 0.3 }), [0, h - 0.25, 0]);
  const globe = addMesh(scene, new THREE.SphereGeometry(0.16, 32, 20), std({ color: '#fff4dc', emissive: '#ffe2b0', emissiveIntensity: 2.2, roughness: 0.3 }), [0, h - 0.62, 0]);
  globe.castShadow = false;
  const pl = new THREE.PointLight('#ffd9a8', 9, 9, 1.6);
  pl.position.set(0, h - 0.8, 0);
  scene.add(pl);
  // tapete
  const rug = addMesh(scene, new THREE.PlaneGeometry(style.rug[0], style.rug[1]), std({ map: T.rugTexture(...style.rugColors), roughness: 1 }), [style.rugAt[0], 0.004, style.rugAt[1]], [-Math.PI / 2, 0, style.rugRot || 0]);
  rug.castShadow = false;
}

function curtain(scene, pos, rotY, h, color) {
  const geo = new THREE.PlaneGeometry(0.5, h, 40, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.035);
  geo.computeVertexNormals();
  const m = addMesh(scene, geo, std({ map: T.fabricTexture(color), side: THREE.DoubleSide, roughness: 0.95 }), pos, [0, rotY, 0]);
  return m;
}

function addWindow(scene, wall, t) {
  const W = WALLS[wall];
  const ww = 1.3, wh = 1.6, y = 1.65;
  const sky = document.createElement('canvas');
  sky.width = 64;
  sky.height = 256;
  const g = sky.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#bcd2df');
  grd.addColorStop(0.55, '#f6ead0');
  grd.addColorStop(0.75, '#c7c09a');
  grd.addColorStop(1, '#8c9a6a');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(sky);
  tex.colorSpace = THREE.SRGBColorSpace;
  const glass = addMesh(scene, new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: '#ffffff' }), wallOffset(wall, t, y, 0.006).toArray(), [0, W.rot, 0]);
  glass.castShadow = false;
  const fm = std({ color: '#efe7d6', roughness: 0.5 });
  for (const [dt, dy, bw, bh] of [[0, wh / 2, ww + 0.12, 0.08], [0, -wh / 2, ww + 0.2, 0.1], [ww / 2, 0, 0.08, wh], [-ww / 2, 0, 0.08, wh], [0, 0, 0.04, wh], [0, wh / 6, ww, 0.035], [0, -wh / 6, ww, 0.035]]) {
    const m = addMesh(scene, new THREE.BoxGeometry(bw, bh, 0.06), fm, wallOffset(wall, t + dt, y + dy, 0.03).toArray(), [0, W.rot, 0]);
    m.castShadow = false;
  }
  for (const s of [-1, 1]) curtain(scene, wallOffset(wall, t + s * (ww / 2 + 0.22), 1.45, 0.12).toArray(), W.rot, 2.75, '#8a3b2a');
  addMesh(scene, new THREE.CylinderGeometry(0.015, 0.015, ww + 1.2, 8), std({ color: '#b08a40', metalness: 1, roughness: 0.3 }), wallOffset(wall, t, 2.85, 0.14).toArray(), [0, W.rot, Math.PI / 2]);
  // luz do dia entrando pela janela
  const n = new THREE.Vector3(Math.sin(W.rot), 0, Math.cos(W.rot));
  const sun = new THREE.DirectionalLight('#ffe8c4', 2.2);
  const from = wallOffset(wall, t, 4.5, -3).addScaledVector(n, 0);
  sun.position.copy(from);
  sun.target.position.copy(wallOffset(wall, t * 0.3, 0, 3));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  const c = sun.shadow.camera;
  c.left = c.bottom = -5;
  c.right = c.top = 5;
  c.far = 20;
  scene.add(sun, sun.target);
}

function addDoor(scene, wall, t) {
  const W = WALLS[wall];
  const wood = std({ map: T.woodTexture('#5a3418', { rings: 40 }), roughness: 0.5 });
  const dw = 0.95, dh = 2.15;
  addMesh(scene, new THREE.BoxGeometry(dw, dh, 0.05), wood, wallOffset(wall, t, dh / 2, 0.026).toArray(), [0, W.rot, 0]);
  for (const [dy, ph] of [[0.55, 0.75], [1.5, 0.95]]) {
    for (const s of [-1, 1]) addMesh(scene, new RoundedBoxGeometry(0.34, ph, 0.03, 2, 0.008), wood, wallOffset(wall, t + s * 0.21, dy, 0.06).toArray(), [0, W.rot, 0]);
  }
  const trim = std({ color: '#efe7d6', roughness: 0.5 });
  for (const [dt, dy, bw, bh] of [[0, dh + 0.05, dw + 0.24, 0.1], [dw / 2 + 0.06, dh / 2, 0.1, dh], [-dw / 2 - 0.06, dh / 2, 0.1, dh]]) addMesh(scene, new THREE.BoxGeometry(bw, bh, 0.07), trim, wallOffset(wall, t + dt, dy, 0.035).toArray(), [0, W.rot, 0]);
  addMesh(scene, new THREE.SphereGeometry(0.035, 16, 12), std({ color: '#c9a050', metalness: 1, roughness: 0.3 }), wallOffset(wall, t + 0.36, 1.0, 0.09).toArray());
  return wallOffset(wall, t, 1.3, 0.1);
}

async function placeItem(scene, item, specs) {
  const spec = item.product ? specs[item.product] : { type: item.decor, params: item.params };
  const obj = await makeObject(spec);
  let pos;
  if (item.wall) {
    pos = wallOffset(item.wall, item.t, item.y, 0.004);
    obj.rotation.y = WALLS[item.wall].rot;
  } else {
    pos = new THREE.Vector3(...item.at);
    obj.rotation.y = item.rot || 0;
  }
  obj.position.copy(pos);
  if (item.scale) obj.scale.setScalar(item.scale);
  scene.add(obj);
  if (obj.userData.light) {
    const l = new THREE.PointLight(obj.userData.light.color, 2.2, 4, 1.8);
    l.position.copy(pos).add(new THREE.Vector3(0, obj.userData.light.y, 0));
    scene.add(l);
  }
  return obj;
}

function dirToYawPitch(v) {
  const d = v.clone().normalize();
  return {
    yaw: +THREE.MathUtils.radToDeg(Math.atan2(d.z, d.x)).toFixed(2),
    pitch: +THREE.MathUtils.radToDeg(Math.asin(d.y)).toFixed(2),
  };
}

const quadScene = new THREE.Scene();
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const equiMat = new THREE.ShaderMaterial({
  uniforms: { cube: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform samplerCube cube; varying vec2 vUv;
    void main(){
      float lon = (vUv.x - 0.5) * 6.283185307;
      float lat = (vUv.y - 0.5) * 3.141592653;
      vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
      gl_FragColor = textureCube(cube, d);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  toneMapped: true,
});
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), equiMat));

async function renderRoom(room, specs) {
  T.reseed(99);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f1ead9');
  scene.environment = envTex;
  scene.environmentIntensity = 0.32;
  scene.add(new THREE.HemisphereLight('#fff6e6', '#6b5238', 0.55));
  buildShell(scene, room.style);
  addWindow(scene, room.window.wall, room.window.t);
  const nav = [];
  for (const d of room.doors) {
    const p = addDoor(scene, d.wall, d.t);
    nav.push({ target: d.to, label: d.label, p });
  }
  const placed = [];
  for (const item of room.items) {
    const obj = await placeItem(scene, item, specs);
    if (item.product) placed.push({ id: item.product, obj });
  }
  const eye = new THREE.Vector3(0, 1.55, 0);
  scene.updateMatrixWorld(true);
  const hotspots = placed.map(({ id, obj }) => {
    const b = new THREE.Box3().setFromObject(obj);
    const c = b.getCenter(new THREE.Vector3());
    return { productId: id, ...dirToYawPitch(c.sub(eye)) };
  });
  const navPoints = nav.map((n) => ({ target: n.target, label: n.label, ...dirToYawPitch(n.p.clone().sub(eye)) }));

  const rt = new THREE.WebGLCubeRenderTarget(2048, { type: THREE.HalfFloatType });
  const cc = new THREE.CubeCamera(0.05, 50, rt);
  cc.position.copy(eye);
  scene.add(cc);
  cc.update(renderer, scene);
  equiMat.uniforms.cube.value = rt.texture;
  const out = {};
  for (const [k, w] of [['hi', 4096], ['lo', 2048]]) {
    renderer.setSize(w, w / 2, false);
    renderer.render(quadScene, quadCam);
    out[k] = jpeg(0.85);
  }
  // vistas em perspectiva (capa, editoriais)
  const views = {};
  for (const v of room.views || []) {
    renderer.setSize(v.size[0], v.size[1], false);
    const cam = new THREE.PerspectiveCamera(v.fov || 50, v.size[0] / v.size[1], 0.05, 50);
    cam.position.set(...v.from);
    cam.lookAt(...v.to);
    renderer.render(scene, cam);
    views[v.name] = jpeg(0.86);
  }
  rt.dispose();
  return { pano: out, hotspots, navPoints, views };
}

window.Studio = { renderProduct, renderRoom, ready: true };
