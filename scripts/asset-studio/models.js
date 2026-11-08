// Construtores procedurais de móveis e objetos. Cada função devolve um THREE.Group
// com origem no centro da base (y = 0 é o chão) e frente voltada para +Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

const std = (opts) => new THREE.MeshStandardMaterial(opts);
const mats = {
  wood: (c = '#5b3a22', rings) => std({ map: T.woodTexture(c, { rings }), roughness: 0.55, metalness: 0 }),
  brass: () => std({ color: '#c9a050', metalness: 1, roughness: 0.32 }),
  bronze: () => std({ color: '#8a6232', metalness: 1, roughness: 0.4 }),
  gold: () => std({ color: '#d4af5a', metalness: 1, roughness: 0.28 }),
  black: () => std({ color: '#181512', roughness: 0.4, metalness: 0.2 }),
  porcelain: (ink) => std({ map: T.porcelainTexture(ink), roughness: 0.18, metalness: 0 }),
  glaze: (c) => std({ map: T.glazeTexture(c), roughness: 0.22, metalness: 0 }),
  fabric: (c) => std({ map: T.fabricTexture(c), roughness: 0.9 }),
  velvet: (c) => new THREE.MeshPhysicalMaterial({ map: T.fabricTexture(c, { weave: false }), roughness: 0.85, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(c).offsetHSL(0, 0, 0.25) }),
  leather: (c) => std({ map: T.leatherTexture(c), roughness: 0.48 }),
  mirror: () => std({ color: '#c9d2d0', metalness: 0.35, roughness: 0.12, emissive: '#5a6462', emissiveIntensity: 0.35 }),
  glass: (c = '#2f6b45') => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, metalness: 0, transmission: 0, emissive: c, emissiveIntensity: 0.35 }),
};

function mesh(geo, mat, [x, y, z] = [0, 0, 0], parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d, r = 0.008) => (r ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1)) : new THREE.BoxGeometry(w, h, d));
const cyl = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);
const lathe = (pts, s = 48) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), s);

function turnedLeg(h, r, mat) {
  return mesh(lathe([[0, 0], [r * 0.7, 0], [r * 0.8, h * 0.08], [r * 0.6, h * 0.15], [r, h * 0.35], [r * 0.7, h * 0.55], [r * 1.1, h * 0.75], [r * 0.8, h * 0.82], [r * 1.25, h * 0.88], [r * 1.25, h], [0, h]], 16), mat);
}

function knob(parent, pos, mat) {
  mesh(new THREE.SphereGeometry(0.014, 12, 10), mat, pos, parent);
}

function drawerBank(g, { x, y, w, h, z, rows, wood, metal, cols = 1 }) {
  const rh = h / rows;
  const cw = w / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x - w / 2 + cw * (c + 0.5);
      const cy = y + rh * (r + 0.5);
      mesh(box(cw - 0.02, rh - 0.02, 0.02, 0.004), wood, [cx, cy, z], g);
      if (cw > 0.35) {
        knob(g, [cx - cw * 0.25, cy, z + 0.02], metal);
        knob(g, [cx + cw * 0.25, cy, z + 0.02], metal);
      } else knob(g, [cx, cy, z + 0.02], metal);
    }
  }
}

export const builders = {
  armchair({ fabric = '#b08a3c', wood = '#4a2c18', kind = 'velvet' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    const up = kind === 'leather' ? mats.leather(fabric) : mats.velvet(fabric);
    for (const [x, z] of [[-0.3, 0.26], [0.3, 0.26], [-0.3, -0.26], [0.3, -0.26]]) {
      const leg = mesh(cyl(0.026, 0.017, 0.3, 14), w, [x, 0.15, z], g);
      leg.rotation.z = x > 0 ? -0.08 : 0.08;
    }
    mesh(box(0.72, 0.1, 0.64, 0.02), w, [0, 0.33, 0], g);
    mesh(box(0.6, 0.14, 0.56, 0.05), up, [0, 0.44, 0.03], g);
    const back = mesh(box(0.66, 0.58, 0.12, 0.05), up, [0, 0.75, -0.27], g);
    back.rotation.x = -0.14;
    for (const s of [-1, 1]) {
      mesh(box(0.09, 0.22, 0.58, 0.04), up, [s * 0.33, 0.52, 0], g);
      mesh(box(0.1, 0.035, 0.6, 0.015), w, [s * 0.33, 0.645, 0.01], g);
      mesh(new THREE.SphereGeometry(0.035, 14, 10), w, [s * 0.33, 0.63, 0.3], g);
    }
    return g;
  },

  chair({ wood = '#3e2414' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    for (const [x, z] of [[-0.2, 0.19], [0.2, 0.19]]) mesh(cyl(0.018, 0.016, 0.46, 12), w, [x, 0.23, z], g);
    for (const x of [-0.19, 0.19]) {
      const post = mesh(cyl(0.017, 0.018, 0.95, 12), w, [x, 0.475, -0.19], g);
      post.rotation.x = -0.06;
    }
    mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 30, Math.PI), w, [0, 0.9, -0.215], g);
    mesh(box(0.44, 0.04, 0.42, 0.01), w, [0, 0.46, 0], g);
    mesh(box(0.38, 0.012, 0.36), std({ map: T.caneTexture(), roughness: 0.8 }), [0, 0.483, 0], g);
    for (const y of [0.62, 0.74]) mesh(box(0.38, 0.03, 0.02, 0.006), w, [0, y, -0.205], g);
    const ring = mesh(new THREE.TorusGeometry(0.2, 0.01, 6, 30), w, [0, 0.15, 0], g);
    ring.rotation.x = Math.PI / 2;
    return g;
  },

  table({ wood = '#5a361e', shape = 'round', size = 1.1 } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    if (shape === 'round') {
      mesh(cyl(size / 2, size / 2 - 0.01, 0.04, 64), w, [0, 0.76, 0], g);
      mesh(cyl(size / 2 - 0.04, size / 2 - 0.04, 0.07, 48), w, [0, 0.71, 0], g);
      mesh(lathe([[0, 0], [0.09, 0], [0.11, 0.06], [0.06, 0.12], [0.12, 0.3], [0.05, 0.5], [0.07, 0.6], [0.05, 0.68], [0, 0.68]]), w, [0, 0, 0], g);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const foot = mesh(box(0.42, 0.06, 0.07, 0.02), w, [Math.cos(a) * 0.2, 0.05, Math.sin(a) * 0.2], g);
        foot.rotation.y = -a;
      }
    } else {
      mesh(box(size, 0.045, size * 0.55, 0.01), w, [0, 0.76, 0], g);
      mesh(box(size - 0.12, 0.1, size * 0.55 - 0.12, 0.005), w, [0, 0.69, 0], g);
      for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const leg = turnedLeg(0.74, 0.035, w);
        leg.position.set((x * (size - 0.16)) / 2, 0, (z * (size * 0.55 - 0.16)) / 2);
        g.add(leg);
      }
    }
    return g;
  },

  desk({ wood = '#4b2c17' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    const m = mats.brass();
    mesh(box(1.32, 0.04, 0.68, 0.012), w, [0, 0.76, 0], g);
    mesh(box(1.14, 0.012, 0.5), mats.leather('#2f4a33'), [0, 0.785, 0.02], g);
    for (const s of [-1, 1]) {
      mesh(box(0.42, 0.68, 0.62, 0.006), w, [s * 0.43, 0.38, 0], g);
      drawerBank(g, { x: s * 0.43, y: 0.08, w: 0.38, h: 0.64, z: 0.315, rows: 3, wood: w, metal: m });
      mesh(box(0.44, 0.06, 0.64, 0.01), w, [s * 0.43, 0.03, 0], g);
    }
    mesh(box(0.44, 0.5, 0.02), w, [0, 0.48, -0.28], g);
    drawerBank(g, { x: 0, y: 0.64, w: 0.42, h: 0.1, z: 0.315, rows: 1, wood: w, metal: m });
    return g;
  },

  dresser({ wood = '#6a3f20', rows = 3 } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    for (const [x, z] of [[-0.5, 0.2], [0.5, 0.2], [-0.5, -0.2], [0.5, -0.2]]) mesh(lathe([[0, 0], [0.025, 0], [0.04, 0.06], [0.03, 0.12], [0, 0.12]], 16), w, [x, 0, z], g);
    mesh(box(1.1, 0.72, 0.48, 0.01), w, [0, 0.48, 0], g);
    mesh(box(1.16, 0.035, 0.52, 0.012), w, [0, 0.855, 0], g);
    drawerBank(g, { x: 0, y: 0.15, w: 1.04, h: 0.66, z: 0.245, rows, wood: w, metal: mats.brass() });
    return g;
  },

  nightstand({ wood = '#5e3a1e' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    for (const [x, z] of [[-0.2, 0.17], [0.2, 0.17], [-0.2, -0.17], [0.2, -0.17]]) {
      const leg = turnedLeg(0.24, 0.018, w);
      leg.position.set(x, 0, z);
      g.add(leg);
    }
    mesh(box(0.46, 0.42, 0.4, 0.008), w, [0, 0.45, 0], g);
    mesh(box(0.38, 0.16, 0.38, 0.002), std({ color: '#1d130b', roughness: 0.9 }), [0, 0.38, 0.02], g);
    mesh(box(0.5, 0.03, 0.44, 0.01), w, [0, 0.675, 0], g);
    drawerBank(g, { x: 0, y: 0.48, w: 0.42, h: 0.16, z: 0.2, rows: 1, wood: w, metal: mats.brass() });
    return g;
  },

  trunk({ leather = '#6a3a1e', wood = '#3a2414' } = {}) {
    const g = new THREE.Group();
    const l = mats.leather(leather);
    const w = mats.wood(wood);
    const b = mats.brass();
    mesh(box(0.9, 0.42, 0.5, 0.01), l, [0, 0.21, 0], g);
    const lid = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 32, 1, false, 0, Math.PI), l, [0, 0.42, 0], g);
    lid.rotation.z = Math.PI / 2;
    lid.scale.set(1, 1, 0.4);
    lid.rotation.y = 0;
    for (const x of [-0.3, 0.3]) {
      mesh(box(0.05, 0.43, 0.51, 0.004), w, [x, 0.215, 0], g);
      const strap = mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.05, 32, 1, true, 0, Math.PI), w, [x, 0.42, 0], g);
      strap.rotation.z = Math.PI / 2;
      strap.scale.set(1, 1, 0.42);
    }
    for (const [x, z] of [[-0.44, 0.24], [0.44, 0.24], [-0.44, -0.24], [0.44, -0.24]]) mesh(box(0.05, 0.05, 0.05, 0.006), b, [x, 0.03, z], g);
    mesh(box(0.08, 0.1, 0.02, 0.004), b, [0, 0.38, 0.255], g);
    return g;
  },

  bookcase({ wood = '#4b2a14' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    const W = 0.95, H = 1.9, D = 0.34;
    mesh(box(W, H, 0.02), w, [0, H / 2, -D / 2 + 0.01], g);
    for (const s of [-1, 1]) mesh(box(0.03, H, D, 0.004), w, [(s * (W - 0.03)) / 2, H / 2, 0], g);
    mesh(box(W + 0.06, 0.06, D + 0.04, 0.01), w, [0, H + 0.03, 0], g);
    mesh(box(W, 0.1, D, 0.004), w, [0, 0.05, 0], g);
    const cols = ['#5a1f1a', '#1f3a2a', '#2a2a44', '#6a4a22', '#3a1c14', '#45352a', '#20303a'];
    for (let s = 0; s < 4; s++) {
      const y = 0.1 + s * 0.45;
      mesh(box(W - 0.05, 0.025, D - 0.02, 0.003), w, [0, y, 0], g);
      let x = -W / 2 + 0.05;
      while (x < W / 2 - 0.12) {
        const bw = 0.025 + T.rand() * 0.03;
        const bh = 0.24 + T.rand() * 0.1;
        if (T.rand() > 0.85) { x += 0.08; continue; }
        const col = cols[Math.floor(T.rand() * cols.length)];
        const bookMat = [std({ color: col, roughness: 0.7 }), std({ color: col, roughness: 0.7 }), std({ color: '#e8dcc0' }), std({ color: col }), std({ map: T.bookSpineTexture(col), roughness: 0.6 }), std({ color: col })];
        mesh(new THREE.BoxGeometry(bw, bh, 0.22), bookMat, [x + bw / 2, y + 0.0125 + bh / 2, 0.01], g);
        x += bw + 0.003;
      }
    }
    return g;
  },

  sideTable({ wood = '#3d1f12' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    mesh(cyl(0.27, 0.26, 0.03, 48), w, [0, 0.6, 0], g);
    mesh(lathe([[0, 0.12], [0.04, 0.12], [0.05, 0.2], [0.025, 0.3], [0.045, 0.42], [0.025, 0.52], [0.05, 0.58], [0, 0.58]], 24), w, [0, 0, 0], g);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = mesh(box(0.24, 0.035, 0.04, 0.01), w, [Math.cos(a) * 0.11, 0.07, Math.sin(a) * 0.11], g);
      leg.rotation.y = -a;
      leg.rotation.z = 0.45 * (1);
      leg.rotation.order = 'YZX';
    }
    return g;
  },

  tableLamp({ base = '#2f6b6b', shade = '#efe2c4' } = {}) {
    const g = new THREE.Group();
    mesh(lathe([[0, 0], [0.08, 0], [0.1, 0.05], [0.13, 0.14], [0.12, 0.22], [0.06, 0.3], [0.03, 0.33], [0, 0.33]]), mats.glaze(base), [0, 0, 0], g);
    mesh(cyl(0.008, 0.008, 0.18, 10), mats.brass(), [0, 0.42, 0], g);
    const sh = mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.24, 40, 1, true), new THREE.MeshStandardMaterial({ map: T.fabricTexture(shade), side: THREE.DoubleSide, emissive: '#ffcf8a', emissiveIntensity: 0.55, roughness: 0.9 }), [0, 0.52, 0], g);
    sh.castShadow = false;
    g.userData.light = { y: 0.48, color: '#ffc98a' };
    return g;
  },

  deskLamp({ glass = '#2f6b45' } = {}) {
    const g = new THREE.Group();
    const b = mats.brass();
    const base = mesh(cyl(0.11, 0.12, 0.03, 40), b, [0, 0.015, 0], g);
    base.scale.z = 0.65;
    mesh(cyl(0.012, 0.012, 0.3, 12), b, [0, 0.18, -0.03], g);
    const arm = mesh(cyl(0.008, 0.008, 0.18, 10), b, [0, 0.33, 0.02], g);
    arm.rotation.x = Math.PI / 2;
    const shade = mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.36, 32, 1, true, Math.PI / 2, Math.PI), new THREE.MeshPhysicalMaterial({ color: glass, roughness: 0.12, emissive: glass, emissiveIntensity: 0.25, side: THREE.DoubleSide, clearcoat: 1 }), [0, 0.33, 0.06], g);
    shade.rotation.z = Math.PI / 2;
    shade.scale.set(1, 1, 0.75);
    g.userData.light = { y: 0.28, color: '#ffd9a0' };
    return g;
  },

  wallClock({ wood = '#4a2a14' } = {}) {
    const g = new THREE.Group();
    const face = mesh(new THREE.CircleGeometry(0.2, 64), std({ map: T.clockFaceTexture(), roughness: 0.6 }), [0, 0, 0.031], g);
    face.castShadow = false;
    const rim = mesh(new THREE.TorusGeometry(0.215, 0.03, 14, 64), mats.wood(wood), [0, 0, 0.025], g);
    rim.scale.z = 0.8;
    mesh(cyl(0.22, 0.22, 0.05, 64), mats.wood(wood), [0, 0, 0], g).rotation.x = Math.PI / 2;
    const glassM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.02 });
    mesh(new THREE.CircleGeometry(0.2, 64), glassM, [0, 0, 0.05], g).castShadow = false;
    const handM = std({ color: '#1a1410', roughness: 0.5 });
    const h1 = mesh(box(0.012, 0.12, 0.004, 0), handM, [0, 0.05, 0.036], g);
    h1.geometry.translate(0, 0, 0);
    h1.rotation.z = -0.9;
    h1.position.set(0.045, 0.035, 0.036);
    const h2 = mesh(box(0.008, 0.17, 0.004, 0), handM, [-0.03, 0.075, 0.038], g);
    h2.rotation.z = 0.4;
    g.userData.wall = true;
    g.userData.center = 0.0;
    return g;
  },

  grandfatherClock({ wood = '#4a2512' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    mesh(box(0.56, 0.36, 0.36, 0.01), w, [0, 0.18, 0], g);
    mesh(box(0.46, 1.1, 0.28, 0.008), w, [0, 0.9, 0], g);
    mesh(box(0.56, 0.5, 0.34, 0.01), w, [0, 1.7, 0], g);
    const top = mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.36, 32, 1, false, 0, Math.PI), w, [0, 1.95, 0], g);
    top.rotation.z = Math.PI / 2;
    top.rotation.y = Math.PI / 2;
    top.scale.set(1, 1, 0.4);
    mesh(new THREE.CircleGeometry(0.16, 48), std({ map: T.clockFaceTexture('#e9dcbc'), roughness: 0.5 }), [0, 1.7, 0.172], g).castShadow = false;
    mesh(new THREE.TorusGeometry(0.17, 0.012, 10, 48), mats.gold(), [0, 1.7, 0.172], g);
    mesh(box(0.3, 0.8, 0.01, 0.003), std({ color: '#1a1008', roughness: 0.4 }), [0, 0.92, 0.141], g);
    mesh(cyl(0.006, 0.006, 0.55, 8), mats.brass(), [0, 1.0, 0.15], g);
    mesh(cyl(0.08, 0.08, 0.015, 32), mats.gold(), [0, 0.7, 0.152], g).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.03, 12, 10), mats.gold(), [s * 0.24, 2.0, 0.1], g);
    return g;
  },

  frame({ kind = 'landscape', w = 0.7, h = 0.52, frame = 'gold' } = {}) {
    const g = new THREE.Group();
    const fm = frame === 'gold' ? mats.gold() : mats.wood('#2a170c');
    mesh(new THREE.PlaneGeometry(w, h), std({ map: T.paintingTexture(kind), roughness: 0.75 }), [0, 0, 0.012], g).castShadow = false;
    const t = 0.06;
    for (const [x, y, ww, hh] of [[0, h / 2 + t / 2, w + 2 * t, t], [0, -h / 2 - t / 2, w + 2 * t, t], [w / 2 + t / 2, 0, t, h], [-w / 2 - t / 2, 0, t, h]]) {
      mesh(box(ww, hh, 0.05, 0.015), fm, [x, y, 0.02], g);
    }
    g.userData.wall = true;
    return g;
  },

  mirror({ shape = 'oval', w = 0.6, h = 0.85 } = {}) {
    const g = new THREE.Group();
    if (shape === 'oval') {
      const m = mesh(new THREE.CircleGeometry(0.5, 64), mats.mirror(), [0, 0, 0.012], g);
      m.scale.set(w, h, 1);
      const r = mesh(new THREE.TorusGeometry(0.5, 0.045, 16, 80), mats.gold(), [0, 0, 0.015], g);
      r.scale.set(w, h, 1);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        mesh(new THREE.SphereGeometry(0.018, 10, 8), mats.gold(), [Math.cos(a) * w * 0.5, Math.sin(a) * h * 0.5, 0.05], g);
      }
      mesh(new THREE.SphereGeometry(0.05, 16, 12), mats.gold(), [0, h * 0.5 + 0.05, 0.03], g).scale.set(1.4, 1, 0.6);
    } else {
      mesh(new THREE.PlaneGeometry(w, h), mats.mirror(), [0, 0, 0.015], g);
      const t = 0.05;
      const fm = mats.wood('#3a2212');
      for (const [x, y, ww, hh] of [[0, h / 2 + t / 2, w + 2 * t, t], [0, -h / 2 - t / 2, w + 2 * t, t], [w / 2 + t / 2, 0, t, h], [-w / 2 - t / 2, 0, t, h]]) mesh(box(ww, hh, 0.04, 0.01), fm, [x, y, 0.02], g);
    }
    g.userData.wall = true;
    return g;
  },

  vase({ color = '#2f6b6b', h = 0.42 } = {}) {
    const g = new THREE.Group();
    const s = h / 0.42;
    mesh(lathe([[0, 0], [0.06 * s, 0], [0.07 * s, 0.02 * s], [0.13 * s, 0.14 * s], [0.12 * s, 0.24 * s], [0.06 * s, 0.34 * s], [0.045 * s, 0.38 * s], [0.06 * s, 0.42 * s], [0.055 * s, 0.42 * s], [0.04 * s, 0.38 * s], [0, 0.36 * s]], 64), mats.glaze(color), [0, 0, 0], g);
    return g;
  },

  teapot({ ink = '#2b4c8c' } = {}) {
    const g = new THREE.Group();
    const p = mats.porcelain(ink);
    mesh(lathe([[0, 0], [0.06, 0], [0.065, 0.01], [0.1, 0.05], [0.11, 0.1], [0.09, 0.16], [0.06, 0.18], [0, 0.18]]), p, [0, 0, 0], g);
    mesh(lathe([[0, 0.24], [0.012, 0.24], [0.02, 0.22], [0.012, 0.21], [0.05, 0.195], [0.065, 0.18], [0, 0.18]]), p, [0, 0, 0], g);
    const spout = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.09, 0.06, 0), new THREE.Vector3(0.15, 0.1, 0), new THREE.Vector3(0.18, 0.17, 0)]), 16, 0.016, 10);
    mesh(spout, p, [0, 0, 0], g);
    const handle = mesh(new THREE.TorusGeometry(0.05, 0.011, 10, 24, Math.PI * 1.3), p, [-0.11, 0.1, 0], g);
    handle.rotation.z = Math.PI * 0.35;
    g.rotation.y = -0.6;
    const outer = new THREE.Group();
    outer.add(g);
    return outer;
  },

  jugBasin({ ink = '#5a7a4a' } = {}) {
    const g = new THREE.Group();
    const p = mats.porcelain(ink);
    mesh(lathe([[0, 0], [0.1, 0], [0.11, 0.015], [0.2, 0.08], [0.21, 0.11], [0.205, 0.115], [0.19, 0.09], [0.1, 0.03], [0, 0.03]], 64), p, [0, 0, 0], g);
    mesh(lathe([[0, 0.03], [0.06, 0.03], [0.095, 0.1], [0.09, 0.18], [0.06, 0.24], [0.065, 0.3], [0.08, 0.32], [0.075, 0.325], [0.055, 0.3], [0, 0.29]], 48), p, [0, 0, 0], g);
    const h = mesh(new THREE.TorusGeometry(0.07, 0.012, 10, 24, Math.PI * 1.2), p, [-0.09, 0.22, 0], g);
    h.rotation.z = Math.PI * 0.4;
    return g;
  },

  gramophone({ horn = '#7a1f1a', wood = '#4a2512' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    mesh(box(0.34, 0.14, 0.34, 0.01), w, [0, 0.07, 0], g);
    mesh(box(0.37, 0.02, 0.37, 0.006), w, [0, 0.15, 0], g);
    mesh(cyl(0.14, 0.14, 0.01, 48), std({ color: '#121010', roughness: 0.35 }), [0, 0.165, 0], g);
    mesh(cyl(0.045, 0.045, 0.012, 32), std({ color: '#b03a2a' }), [0, 0.168, 0], g);
    const crank = mesh(cyl(0.006, 0.006, 0.12, 8), mats.brass(), [0.2, 0.08, 0], g);
    crank.rotation.z = Math.PI / 2;
    const b = mats.brass();
    mesh(cyl(0.012, 0.012, 0.16, 12), b, [0.13, 0.23, -0.12], g);
    const arm = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.13, 0.3, -0.12), new THREE.Vector3(0.05, 0.36, -0.16), new THREE.Vector3(-0.05, 0.42, -0.2)]), 20, 0.018, 12);
    mesh(arm, b, [0, 0, 0], g);
    const hornG = lathe([[0.02, 0], [0.028, 0.15], [0.05, 0.3], [0.1, 0.42], [0.2, 0.5], [0.28, 0.53]], 48);
    const hm = new THREE.MeshStandardMaterial({ color: horn, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide });
    const hornM = mesh(hornG, hm, [-0.05, 0.42, -0.2], g);
    hornM.rotation.x = Math.PI / 2.6;
    return g;
  },

  candlestick({ h = 0.32 } = {}) {
    const g = new THREE.Group();
    const b = mats.bronze();
    mesh(lathe([[0, 0], [0.07, 0], [0.07, 0.015], [0.04, 0.03], [0.015, 0.06], [0.025, 0.1], [0.012, 0.16], [0.02, 0.2], [0.012, h - 0.06], [0.03, h - 0.04], [0.025, h - 0.02], [0, h - 0.02]]), b, [0, 0, 0], g);
    mesh(cyl(0.012, 0.012, 0.14, 16), std({ color: '#efe6d2', roughness: 0.6 }), [0, h + 0.05, 0], g);
    return g;
  },

  bed({ wood = '#4a2a16', cover = '#c9b48a' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    mesh(box(1.5, 1.25, 0.08, 0.02), w, [0, 0.62, -1.0], g);
    mesh(new THREE.TorusGeometry(0.7, 0.04, 10, 40, Math.PI), w, [0, 1.12, -1.0], g).scale.set(1, 0.22, 1);
    mesh(box(1.5, 0.55, 0.06, 0.02), w, [0, 0.3, 1.0], g);
    mesh(box(1.44, 0.22, 1.98, 0.02), w, [0, 0.27, 0], g);
    mesh(box(1.4, 0.2, 1.9, 0.06), std({ color: '#efe8da', roughness: 0.9 }), [0, 0.47, 0], g);
    mesh(box(1.46, 0.08, 1.4, 0.04), mats.fabric(cover), [0, 0.6, 0.28], g);
    for (const x of [-0.36, 0.36]) mesh(box(0.56, 0.14, 0.36, 0.07), std({ color: '#f4efe4', roughness: 0.95 }), [x, 0.64, -0.7], g);
    return g;
  },

  console({ wood = '#3a2212' } = {}) {
    const g = new THREE.Group();
    const w = mats.wood(wood);
    for (const [x, z] of [[-0.55, 0.15], [0.55, 0.15], [-0.55, -0.15], [0.55, -0.15]]) {
      const leg = turnedLeg(0.72, 0.022, w);
      leg.position.set(x, 0, z);
      g.add(leg);
    }
    mesh(box(1.25, 0.04, 0.42, 0.01), w, [0, 0.74, 0], g);
    mesh(box(1.15, 0.12, 0.36, 0.005), w, [0, 0.66, 0], g);
    mesh(box(1.1, 0.02, 0.32), w, [0, 0.16, 0], g);
    return g;
  },

  plant({ pot = '#9a5a3a' } = {}) {
    const g = new THREE.Group();
    mesh(lathe([[0, 0], [0.11, 0], [0.15, 0.28], [0.16, 0.3], [0, 0.3]]), std({ color: pot, roughness: 0.85 }), [0, 0, 0], g);
    const leaf = std({ color: '#3f5a2e', roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 26; i++) {
      const l = mesh(new THREE.SphereGeometry(0.1, 8, 6), leaf, [0, 0.3, 0], g);
      const a = T.rand() * Math.PI * 2;
      const r = 0.05 + T.rand() * 0.25;
      l.position.set(Math.cos(a) * r, 0.35 + T.rand() * 0.6, Math.sin(a) * r);
      l.scale.set(1.2, 0.18, 0.5);
      l.rotation.set(T.rand(), a, T.rand() - 0.5);
    }
    return g;
  },
};

export function build(type, params) {
  T.reseed(4242 + type.length * 7);
  const g = builders[type](params || {});
  g.name = type;
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.castShadow !== false;
      o.receiveShadow = true;
    }
  });
  return g;
}
