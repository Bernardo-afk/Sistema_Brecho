// Especificação dos assets demonstrativos.
// - products: id do produto (igual ao de src/data/products.ts) -> modelo procedural
//   exportGlb=false simula um produto que ainda não tem modelo 3D (testa o fallback).
// - rooms: ambientes panorâmicos montados com os mesmos modelos; os hotspots são
//   calculados automaticamente a partir da posição de cada peça.

export const products = {
  'poltrona-bergere-veludo-mostarda': { type: 'armchair', params: { fabric: '#9c7430', wood: '#4a2c18' }, exportGlb: true },
  'poltrona-club-couro-conhaque': { type: 'armchair', params: { fabric: '#7a4224', wood: '#2e1a0e', kind: 'leather' }, exportGlb: true },
  'mesa-lateral-jacaranda': { type: 'sideTable', params: { wood: '#3d1f12' }, exportGlb: true },
  'abajur-ceramica-turquesa': { type: 'tableLamp', params: { base: '#2f6b6b' }, exportGlb: true },
  'espelho-veneziano-oval': { type: 'mirror', params: { shape: 'oval' }, exportGlb: false },
  'estante-imbuia-livros': { type: 'bookcase', params: { wood: '#4b2a14' }, exportGlb: true },
  'escrivaninha-imbuia-anos-50': { type: 'desk', params: { wood: '#4b2c17' }, exportGlb: true },
  'cadeira-palhinha-torneada': { type: 'chair', params: { wood: '#3e2414' }, exportGlb: true },
  'luminaria-banqueiro-verde': { type: 'deskLamp', params: { glass: '#2f6b45' }, exportGlb: true },
  'relogio-parede-romanos': { type: 'wallClock', params: { wood: '#4a2a14' }, exportGlb: true },
  'comoda-tres-gavetas-cerejeira': { type: 'dresser', params: { wood: '#7a4422', rows: 3 }, exportGlb: true },
  'criado-mudo-torneado': { type: 'nightstand', params: { wood: '#5e3a1e' }, exportGlb: true },
  'bau-viagem-couro': { type: 'trunk', params: { leather: '#6a3a1e' }, exportGlb: true },
  'retrato-oleo-dama': { type: 'frame', params: { kind: 'portrait', w: 0.5, h: 0.66 }, exportGlb: false },
  'jarro-bacia-porcelana': { type: 'jugBasin', params: { ink: '#5a7a4a' }, exportGlb: true },
  'espelho-bisotado-retangular': { type: 'mirror', params: { shape: 'rect', w: 0.55, h: 0.8 }, exportGlb: false },
  'mesa-jantar-redonda-pe-central': { type: 'table', params: { shape: 'round', size: 1.15, wood: '#5a361e' }, exportGlb: true },
  'mesa-retangular-pes-torneados': { type: 'table', params: { shape: 'rect', size: 1.6, wood: '#6b4024' }, exportGlb: true },
  'bule-porcelana-azul-cobalto': { type: 'teapot', params: { ink: '#2b4c8c' }, exportGlb: true },
  'vaso-ceramica-esmaltada-verde': { type: 'vase', params: { color: '#3d6b52', h: 0.5 }, exportGlb: true },
  'quadro-paisagem-oleo': { type: 'frame', params: { kind: 'landscape', w: 0.8, h: 0.58 }, exportGlb: false },
  'vitrola-corneta-bordo': { type: 'gramophone', params: { horn: '#7a1f1a' }, exportGlb: true },
  'relogio-carrilhao-pe': { type: 'grandfatherClock', params: { wood: '#4a2512' }, exportGlb: true },
  'par-castical-bronze': { type: 'candlestick', params: {}, exportGlb: false },
  'natureza-morta-oleo': { type: 'frame', params: { kind: 'still', w: 0.6, h: 0.46, frame: 'wood' }, exportGlb: false },
  // Modelo GLB fornecido pelo cliente como exemplo (arquivo já existente, não é exportado).
  'peca-decorativa-demonstrativa': { external: 'assets/models/peca-demo.glb', size: 0.7, exportGlb: false },
};

const views = (name, list) => list.map((v) => ({ ...v, name: `${name}-${v.name}` }));

export const rooms = [
  {
    id: 'escritorio',
    style: { floor: '#6e4526', wall: '#d7c9a8', ink: '#a8946a', pattern: 'stripes', wainscot: '#4b2c17', trim: '#efe7d6', rug: [3.2, 2.2], rugAt: [0, -0.9], rugColors: ['#2c3e33', '#c9a24a', '#5a1f1a'] },
    window: { wall: 'east', t: 0.2 },
    doors: [{ wall: 'south', t: 1.6, to: 'sala-de-estar', label: 'Ir para a Sala de estar' }],
    items: [
      { product: 'escrivaninha-imbuia-anos-50', at: [0, 0, -1.95] },
      { product: 'cadeira-palhinha-torneada', at: [0.05, 0, -1.25], rot: Math.PI + 0.15 },
      { product: 'luminaria-banqueiro-verde', at: [0.42, 0.79, -2.05], rot: -0.3 },
      { product: 'relogio-parede-romanos', wall: 'north', t: 0, y: 2.1 },
      { product: 'estante-imbuia-livros', at: [-2.8, 0, -0.9], rot: Math.PI / 2 },
      { product: 'peca-decorativa-demonstrativa', at: [-2.2, 0, 1.3], rot: 0.9 },
      { decor: 'plant', at: [2.55, 0, -2.05] },
      { decor: 'plant', at: [-2.5, 0, -2.1], params: { pot: '#6a4a3a' } },
    ],
    views: views('escritorio', [
      { name: 'capa', from: [1.6, 1.45, 1.9], to: [-0.6, 0.9, -1.8], size: [1600, 1000], fov: 52 },
      { name: 'detalhe', from: [0.9, 1.15, -0.9], to: [0.25, 0.85, -2.05], size: [1200, 1500], fov: 45 },
    ]),
  },
  {
    id: 'sala-de-estar',
    style: { floor: '#7a4e2c', wall: '#e0d2b4', ink: '#b8a07a', pattern: 'damask', wainscot: '#5a3418', trim: '#efe7d6', rug: [3.4, 2.4], rugAt: [0, -0.8], rugColors: ['#7e3428', '#d4b67c', '#2e2a3e'] },
    window: { wall: 'west', t: -0.6 },
    doors: [
      { wall: 'south', t: -1.6, to: 'escritorio', label: 'Ir para o Escritório' },
      { wall: 'south', t: 1.6, to: 'dormitorio', label: 'Ir para o Dormitório' },
    ],
    items: [
      { product: 'poltrona-bergere-veludo-mostarda', at: [-0.95, 0, -1.35], rot: 0.45 },
      { product: 'poltrona-club-couro-conhaque', at: [0.95, 0, -1.35], rot: -0.45 },
      { product: 'mesa-lateral-jacaranda', at: [0, 0, -1.75] },
      { product: 'abajur-ceramica-turquesa', at: [0, 0.615, -1.75] },
      { product: 'espelho-veneziano-oval', wall: 'north', t: 0, y: 1.85 },
      { product: 'relogio-carrilhao-pe', at: [-2.6, 0, -2.1], rot: Math.PI / 4 },
      { decor: 'console', at: [2.72, 0, -0.7], rot: -Math.PI / 2 },
      { product: 'vitrola-corneta-bordo', at: [2.72, 0.76, -0.55], rot: -Math.PI / 2 - 0.4 },
      { product: 'quadro-paisagem-oleo', wall: 'east', t: -0.7, y: 1.85 },
      { product: 'vaso-ceramica-esmaltada-verde', at: [2.6, 0, 1.0] },
      { decor: 'plant', at: [-2.55, 0, 1.6] },
    ],
    views: views('sala', [
      { name: 'hero', from: [0.2, 1.35, 2.15], to: [0, 0.95, -1.8], size: [1920, 1080], fov: 55 },
      { name: 'capa', from: [-1.8, 1.4, 1.6], to: [0.8, 0.9, -1.6], size: [1600, 1000], fov: 52 },
      { name: 'vitrola', from: [1.4, 1.25, 0.6], to: [2.7, 1.0, -0.6], size: [1200, 1500], fov: 42 },
      { name: 'sobre', from: [1.8, 1.5, 1.8], to: [-1.4, 0.8, -1.8], size: [1600, 1100], fov: 55 },
    ]),
  },
  {
    id: 'dormitorio',
    style: { floor: '#8a5a34', wall: '#e4d8c0', ink: '#a98f78', pattern: 'floral', wainscot: '#6a4426', trim: '#f2ebdc', rug: [2.4, 1.6], rugAt: [0.3, 0.6], rugColors: ['#5a3a4a', '#d8c08a', '#2a2a3a'] },
    window: { wall: 'south', t: -0.8 },
    doors: [{ wall: 'west', t: 1.5, to: 'sala-de-estar', label: 'Voltar para a Sala de estar' }],
    items: [
      { decor: 'bed', at: [0.3, 0, -1.45] },
      { product: 'criado-mudo-torneado', at: [-0.8, 0, -2.2] },
      { product: 'par-castical-bronze', at: [-0.8, 0.69, -2.2] },
      { product: 'comoda-tres-gavetas-cerejeira', at: [2.72, 0, 0.3], rot: -Math.PI / 2 },
      { product: 'jarro-bacia-porcelana', at: [2.72, 0.875, 0.3] },
      { product: 'espelho-bisotado-retangular', wall: 'east', t: 0.3, y: 1.65 },
      { product: 'bau-viagem-couro', at: [0.3, 0, 0.0] },
      { product: 'retrato-oleo-dama', wall: 'west', t: -0.8, y: 1.7 },
      { product: 'natureza-morta-oleo', wall: 'north', t: 1.7, y: 1.75 },
    ],
    views: views('dormitorio', [
      { name: 'capa', from: [-1.6, 1.5, 1.9], to: [1.0, 0.8, -1.4], size: [1600, 1000], fov: 55 },
    ]),
  },
];

// Composições de estúdio extras (capas de categorias sem ambiente e editoriais)
export const extraShots = [];
