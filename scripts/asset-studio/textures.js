// Texturas procedurais desenhadas em <canvas>. Usadas apenas pelo gerador de assets.
import * as THREE from 'three';

let seed = 1337;
export function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
export function reseed(s) {
  seed = s;
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.userData.mimeType = 'image/jpeg';
  return t;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt)));
  return '#' + c.getHexString();
}

const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

export function woodTexture(base = '#6b4226', { size = 512, rings = 60, repeat = [1, 1] } = {}) {
  return cached(`wood${base}${size}${rings}${repeat}`, () => {
    const [c, g] = canvas(size);
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    for (let i = 0; i < rings; i++) {
      const y0 = rand() * size;
      const amp = 4 + rand() * 14;
      const freq = 0.004 + rand() * 0.01;
      const ph = rand() * 10;
      g.strokeStyle = shade(base, (rand() - 0.6) * 0.18);
      g.globalAlpha = 0.25 + rand() * 0.45;
      g.lineWidth = 0.6 + rand() * 2.4;
      g.beginPath();
      for (let x = 0; x <= size; x += 4) {
        const y = y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 0.08;
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = rand() > 0.5 ? '#000' : '#fff';
      g.fillRect(rand() * size, rand() * size, 1 + rand() * 6, 1);
    }
    g.globalAlpha = 1;
    return toTexture(c, { repeat });
  });
}

export function fabricTexture(base = '#a33', { size = 256, weave = true, repeat = [2, 2] } = {}) {
  return cached(`fab${base}${size}${weave}${repeat}`, () => {
    const [c, g] = canvas(size);
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    const img = g.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const x = (i / 4) % size;
      const y = Math.floor(i / 4 / size);
      let n = (rand() - 0.5) * 18;
      if (weave) n += ((x % 4 < 2) !== (y % 4 < 2) ? 8 : -8);
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    return toTexture(c, { repeat });
  });
}

export function leatherTexture(base = '#5a3220') {
  return cached(`lea${base}`, () => {
    const [c, g] = canvas(512);
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 260; i++) {
      const r = 10 + rand() * 60;
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
      const col = shade(base, (rand() - 0.5) * 0.05);
      grd.addColorStop(0, col);
      grd.addColorStop(1, col + '00');
      g.save();
      g.translate(rand() * 512, rand() * 512);
      g.fillStyle = grd;
      g.fillRect(-r, -r, r * 2, r * 2);
      g.restore();
    }
    g.globalAlpha = 0.15;
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = '#000';
      g.fillRect(rand() * 512, rand() * 512, 1, 1);
    }
    g.globalAlpha = 1;
    return toTexture(c, { repeat: [1.5, 1.5] });
  });
}

export function caneTexture() {
  return cached('cane', () => {
    const [c, g] = canvas(256);
    g.fillStyle = '#3b2a1c';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#d8b878';
    g.lineWidth = 3;
    for (let i = -256; i < 512; i += 16) {
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        g.beginPath();
        if (dx && !dy) { g.moveTo(0, i); g.lineTo(256, i); }
        else if (dy && !dx) { g.moveTo(i, 0); g.lineTo(i, 256); }
        else if (dy > 0) { g.moveTo(i, 0); g.lineTo(i + 256, 256); }
        else { g.moveTo(i, 256); g.lineTo(i + 256, 0); }
        g.stroke();
      }
    }
    return toTexture(c, { repeat: [3, 3] });
  });
}

export function wallpaperTexture(base = '#d9cbb0', ink = '#b59f7a', style = 'damask') {
  return cached(`wp${base}${ink}${style}`, () => {
    const [c, g] = canvas(512);
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = ink;
    g.strokeStyle = ink;
    if (style === 'stripes') {
      for (let x = 0; x < 512; x += 64) {
        g.globalAlpha = 0.55;
        g.fillRect(x, 0, 22, 512);
        g.globalAlpha = 0.3;
        g.fillRect(x + 30, 0, 4, 512);
      }
    } else if (style === 'floral') {
      for (let y = 0; y < 512; y += 128) {
        for (let x = (y / 128) % 2 ? 64 : 0; x < 576; x += 128) {
          g.globalAlpha = 0.5;
          for (let p = 0; p < 6; p++) {
            g.beginPath();
            const a = (p / 6) * Math.PI * 2;
            g.ellipse(x + Math.cos(a) * 14, y + Math.sin(a) * 14, 12, 6, a, 0, Math.PI * 2);
            g.fill();
          }
          g.globalAlpha = 0.35;
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(x, y + 20);
          g.quadraticCurveTo(x + 30, y + 60, x + 10, y + 100);
          g.stroke();
        }
      }
    } else {
      g.globalAlpha = 0.45;
      for (let y = 0; y < 512; y += 256) {
        for (const x of [0, 256, 512]) {
          for (const [ox, oy] of [[0, 0], [128, 128]]) {
            const cx = x + ox - (y / 256) * 0;
            const cy = y + oy;
            g.beginPath();
            g.moveTo(cx, cy - 90);
            g.bezierCurveTo(cx + 70, cy - 60, cx + 40, cy + 10, cx, cy + 90);
            g.bezierCurveTo(cx - 40, cy + 10, cx - 70, cy - 60, cx, cy - 90);
            g.fill();
            g.globalAlpha = 0.25;
            g.beginPath();
            g.arc(cx, cy - 10, 18, 0, Math.PI * 2);
            g.fillStyle = base;
            g.fill();
            g.fillStyle = ink;
            g.globalAlpha = 0.45;
          }
        }
      }
    }
    g.globalAlpha = 1;
    return toTexture(c, { repeat: [4, 2] });
  });
}

export function floorTexture(base = '#7a4e2c') {
  return cached(`floor${base}`, () => {
    const [c, g] = canvas(1024);
    const plankW = 1024 / 8;
    for (let i = 0; i < 8; i++) {
      let y = -rand() * 400;
      while (y < 1024) {
        const len = 300 + rand() * 500;
        g.fillStyle = shade(base, (rand() - 0.5) * 0.05);
        g.fillRect(i * plankW, y, plankW, len);
        for (let k = 0; k < 14; k++) {
          g.strokeStyle = shade(base, -0.05 - rand() * 0.05);
          g.globalAlpha = 0.22;
          g.lineWidth = 1 + rand() * 2;
          const x = i * plankW + rand() * plankW;
          g.beginPath();
          g.moveTo(x, y);
          g.bezierCurveTo(x + (rand() - 0.5) * 30, y + len * 0.3, x + (rand() - 0.5) * 30, y + len * 0.6, x, y + len);
          g.stroke();
        }
        g.globalAlpha = 0.9;
        g.fillStyle = shade(base, -0.22);
        g.fillRect(i * plankW, y, plankW, 3);
        g.globalAlpha = 1;
        y += len;
      }
      g.fillStyle = shade(base, -0.25);
      g.fillRect(i * plankW, 0, 3, 1024);
    }
    return toTexture(c, { repeat: [3, 3] });
  });
}

export function rugTexture(main = '#7b2a22', accent = '#d8b878', dark = '#2a2440') {
  return cached(`rug${main}`, () => {
    const [c, g] = canvas(1024);
    g.fillStyle = main;
    g.fillRect(0, 0, 1024, 1024);
    g.fillStyle = dark;
    g.fillRect(40, 40, 944, 944);
    g.fillStyle = main;
    g.fillRect(110, 110, 804, 804);
    g.strokeStyle = accent;
    g.lineWidth = 6;
    g.strokeRect(60, 60, 904, 904);
    g.strokeRect(95, 95, 834, 834);
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * 834 + 95;
      g.fillStyle = accent;
      g.beginPath();
      for (const [x, y] of [[t, 77], [t, 947], [77, t], [947, t]]) {
        g.moveTo(x, y - 9);
        g.lineTo(x + 9, y);
        g.lineTo(x, y + 9);
        g.lineTo(x - 9, y);
      }
      g.fill();
    }
    g.save();
    g.translate(512, 512);
    for (let r = 0; r < 4; r++) {
      g.fillStyle = [accent, dark, accent, main][r];
      g.beginPath();
      const s = 300 - r * 70;
      g.moveTo(0, -s);
      g.lineTo(s * 0.8, 0);
      g.lineTo(0, s);
      g.lineTo(-s * 0.8, 0);
      g.fill();
    }
    g.restore();
    for (let k = 0; k < 4; k++) {
      g.save();
      g.translate(k % 2 ? 260 : 764, k < 2 ? 260 : 764);
      g.fillStyle = accent;
      g.globalAlpha = 0.8;
      for (let p = 0; p < 8; p++) {
        g.rotate(Math.PI / 4);
        g.beginPath();
        g.ellipse(0, 40, 14, 40, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
    const img = g.getImageData(0, 0, 1024, 1024);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rand() - 0.5) * 26;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    return toTexture(c, { repeat: [1, 1] });
  });
}

export function paintingTexture(kind = 'landscape', palette = {}) {
  return cached(`paint${kind}${JSON.stringify(palette)}`, () => {
    const [c, g] = canvas(512, 384);
    const sky = palette.sky || ['#e9c98f', '#9fb4b8'];
    const grd = g.createLinearGradient(0, 0, 0, 384);
    grd.addColorStop(0, sky[1]);
    grd.addColorStop(0.6, sky[0]);
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 384);
    const dab = (x, y, r, col, a = 0.6) => {
      g.globalAlpha = a;
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x, y, r, r * (0.4 + rand() * 0.5), rand() * 3, 0, Math.PI * 2);
      g.fill();
    };
    if (kind === 'still') {
      g.fillStyle = '#3a2a1e';
      g.fillRect(0, 0, 512, 384);
      g.fillStyle = '#6b4a2e';
      g.fillRect(0, 260, 512, 124);
      for (let i = 0; i < 200; i++) dab(250 + (rand() - 0.5) * 90, 190 + (rand() - 0.5) * 120, 8, rand() > 0.5 ? '#c9a24a' : '#8a5a2a', 0.5);
      for (const [x, col] of [[150, '#a8322a'], [190, '#c74b2a'], [330, '#d7b04a'], [370, '#7a8a3a']]) {
        for (let i = 0; i < 40; i++) dab(x + (rand() - 0.5) * 30, 255 + (rand() - 0.5) * 25, 7, col, 0.7);
      }
    } else if (kind === 'portrait') {
      g.fillStyle = '#2e3328';
      g.fillRect(0, 0, 512, 384);
      for (let i = 0; i < 300; i++) dab(256 + (rand() - 0.5) * 120, 160 + (rand() - 0.5) * 120, 10, rand() > 0.3 ? '#d6b08c' : '#b88a66', 0.4);
      for (let i = 0; i < 300; i++) dab(256 + (rand() - 0.5) * 260, 340 + (rand() - 0.5) * 90, 14, rand() > 0.5 ? '#1e2a3a' : '#2c3a4e', 0.5);
      for (let i = 0; i < 160; i++) dab(256 + (rand() - 0.5) * 140, 100 + (rand() - 0.5) * 60, 9, '#3a2618', 0.5);
    } else {
      for (let i = 0; i < 400; i++) dab(rand() * 512, 200 + rand() * 60, 18, rand() > 0.5 ? '#6f7f5a' : '#56664a', 0.5);
      for (let i = 0; i < 600; i++) dab(rand() * 512, 270 + rand() * 120, 16, rand() > 0.5 ? '#8a8a4e' : '#b29a5a', 0.5);
      for (let t = 0; t < 5; t++) {
        const tx = 40 + rand() * 430;
        for (let i = 0; i < 70; i++) dab(tx + (rand() - 0.5) * 50, 170 + (rand() - 0.5) * 70, 10, rand() > 0.5 ? '#3e4e30' : '#2f3c26', 0.6);
      }
      for (let i = 0; i < 120; i++) dab(rand() * 512, rand() * 120, 22, '#f2e2c0', 0.18);
    }
    g.globalAlpha = 1;
    return toTexture(c);
  });
}

export function clockFaceTexture(bg = '#efe6d0') {
  return cached(`clock${bg}`, () => {
    const [c, g] = canvas(512);
    g.fillStyle = bg;
    g.beginPath();
    g.arc(256, 256, 256, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2a2018';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(256, 256, 236, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(256, 256, 200, 0, Math.PI * 2);
    g.stroke();
    const nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    g.fillStyle = '#2a2018';
    g.font = 'bold 40px Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    nums.forEach((n, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      g.save();
      g.translate(256 + Math.cos(a) * 172, 256 + Math.sin(a) * 172);
      g.rotate(a + Math.PI / 2);
      g.fillText(n, 0, 0);
      g.restore();
    });
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      g.beginPath();
      g.moveTo(256 + Math.cos(a) * 222, 256 + Math.sin(a) * 222);
      g.lineTo(256 + Math.cos(a) * (i % 5 ? 214 : 204), 256 + Math.sin(a) * (i % 5 ? 214 : 204));
      g.lineWidth = i % 5 ? 2 : 4;
      g.stroke();
    }
    g.font = 'italic 22px Georgia, serif';
    g.fillText('Ambar & Filhos', 256, 330);
    return toTexture(c);
  });
}

export function porcelainTexture(ink = '#2b4c8c', base = '#f4f1ea') {
  return cached(`porc${ink}`, () => {
    const [c, g] = canvas(512);
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = ink;
    g.strokeStyle = ink;
    g.fillRect(0, 60, 512, 10);
    g.fillRect(0, 440, 512, 8);
    for (let x = 0; x < 512; x += 64) {
      g.globalAlpha = 0.85;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x, 300);
      g.bezierCurveTo(x + 20, 220, x + 44, 220, x + 64, 300);
      g.stroke();
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        g.beginPath();
        g.ellipse(x + 32 + Math.cos(a) * 12, 200 + Math.sin(a) * 12, 10, 5, a, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.arc(x + 32, 360, 6, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    return toTexture(c);
  });
}

export function glazeTexture(base = '#2f6b6b') {
  return cached(`glz${base}`, () => {
    const [c, g] = canvas(512);
    const grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, shade(base, 0.12));
    grd.addColorStop(0.5, base);
    grd.addColorStop(1, shade(base, -0.12));
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 160; i++) {
      g.globalAlpha = 0.15;
      g.strokeStyle = shade(base, (rand() - 0.5) * 0.3);
      g.lineWidth = 2 + rand() * 6;
      const x = rand() * 512;
      g.beginPath();
      g.moveTo(x, 0);
      g.bezierCurveTo(x + 10, 150, x - 10, 300, x + 4, 512);
      g.stroke();
    }
    g.globalAlpha = 1;
    return toTexture(c);
  });
}

export function bookSpineTexture(col) {
  return cached(`book${col}`, () => {
    const [c, g] = canvas(64, 256);
    g.fillStyle = col;
    g.fillRect(0, 0, 64, 256);
    g.fillStyle = '#d8b878';
    g.fillRect(0, 30, 64, 4);
    g.fillRect(0, 40, 64, 2);
    g.fillRect(0, 210, 64, 4);
    g.fillRect(14, 90, 36, 50);
    return toTexture(c);
  });
}
