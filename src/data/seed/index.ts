// Dados demonstrativos iniciais. Todos os números do painel são derivados destes registros
// (nenhum indicador é inventado de forma independente na interface).
import type { AdminUser, Article, Category, Coupon, Customer, Order, OrderStatus, Panorama, Product, Reservation } from '@/types/domain';
import manifest from '../generated/assets-manifest.json';
import { buildSeedProducts } from './products';

export interface DemoDatabase {
  version: number;
  seededAt: string;
  products: Product[];
  categories: Category[];
  panoramas: Panorama[];
  customers: Customer[];
  orders: Order[];
  coupons: Coupon[];
  reservations: Reservation[];
  articles: Article[];
  admins: AdminUser[];
}

export const DB_VERSION = 3;

type RoomManifest = {
  image: string;
  imageMobile: string;
  hotspots: { productId: string; yaw: number; pitch: number }[];
  navPoints: { target: string; label: string; yaw: number; pitch: number }[];
  views: Record<string, string>;
};
const rooms = (manifest as unknown as { rooms: Record<string, RoomManifest> }).rooms;
const scene = (name: string) => `assets/scenes/${name}.jpg`;
const photo = (id: string, n = 1) => `assets/products/${id}/${n}.jpg`;

// Ajustes finos de hotspots que ficariam sobrepostos (posição calculada automaticamente pelo gerador).
const hotspotOverrides: Record<string, Partial<{ yaw: number; pitch: number }>> = {
  'escritorio:escrivaninha-imbuia-anos-50': { yaw: -101, pitch: -24 },
  'sala-de-estar:mesa-lateral-jacaranda': { pitch: -33 },
};

function buildPanoramas(): Panorama[] {
  const meta: Record<string, { name: string; description: string; cover: string; initialYaw: number }> = {
    escritorio: { name: 'Escritório do colecionador', description: 'Escrivaninha, estante e iluminação de leitura em um gabinete clássico.', cover: scene('escritorio-capa'), initialYaw: -90 },
    'sala-de-estar': { name: 'Sala de estar Âmbar', description: 'Poltronas, espelho dourado, relógio carrilhão e gramofone em uma sala acolhedora.', cover: scene('sala-capa'), initialYaw: -90 },
    dormitorio: { name: 'Dormitório de família', description: 'Cômoda, criado-mudo, baú e retratos em um quarto de fazenda.', cover: scene('dormitorio-capa'), initialYaw: -60 },
  };
  return Object.entries(meta).map(([id, m]) => {
    const r = rooms[id];
    return {
      id,
      ...m,
      image: r.image,
      imageMobile: r.imageMobile,
      hotspots: r.hotspots.map((h, i) => ({ id: `${id}-h${i + 1}`, productId: h.productId, yaw: h.yaw, pitch: h.pitch, ...hotspotOverrides[`${id}:${h.productId}`] })),
      navPoints: r.navPoints.map((n, i) => ({ id: `${id}-n${i + 1}`, targetPanoramaId: n.target, label: n.label, yaw: n.yaw, pitch: n.pitch })),
    };
  });
}

const categories: Category[] = [
  { id: 'sala-de-estar', slug: 'sala-de-estar', name: 'Sala de estar', tagline: 'Poltronas, espelhos e peças de presença', description: 'Peças para receber bem: poltronas restauradas, mesas de apoio, iluminação e espelhos com história.', image: scene('sala-capa'), panoramaId: 'sala-de-estar', order: 1, showInMenu: true },
  { id: 'sala-de-jantar', slug: 'sala-de-jantar', name: 'Sala', tagline: 'Mesas e arte para a sala de jantar', description: 'Mesas de família, cadeiras e quadros para a sala de jantar, onde as histórias se encontram.', image: photo('mesa-jantar-redonda-pe-central'), panoramaId: null, order: 2, showInMenu: true },
  { id: 'escritorio', slug: 'escritorio', name: 'Escritório', tagline: 'Gabinetes, estantes e luz de leitura', description: 'Escrivaninhas, estantes e luminárias para quem trabalha cercado de boas histórias.', image: scene('escritorio-capa'), panoramaId: 'escritorio', order: 3, showInMenu: true },
  { id: 'dormitorio', slug: 'dormitorio', name: 'Dormitório', tagline: 'Cômodas, baús e criados-mudos', description: 'Móveis de quarto com o aconchego das casas de fazenda e dos sobrados antigos.', image: scene('dormitorio-capa'), panoramaId: 'dormitorio', order: 4, showInMenu: true },
  { id: 'banheiro', slug: 'banheiro', name: 'Banheiro', tagline: 'Lavatórios, espelhos e porcelanas', description: 'Porcelanas de lavatório, espelhos bisotados e detalhes para banheiros e lavabos com charme.', image: photo('jarro-bacia-porcelana'), panoramaId: null, order: 5, showInMenu: true },
  { id: 'artigos-para-casa', slug: 'artigos-para-casa', name: 'Artigos para casa', tagline: 'Vasos, porcelanas e quadros', description: 'Objetos decorativos, cerâmicas, porcelanas e arte para completar cada ambiente.', image: photo('vaso-ceramica-esmaltada-verde'), panoramaId: null, order: 6, showInMenu: true },
  { id: 'reliquias', slug: 'reliquias', name: 'Relíquias', tagline: 'Peças raras e colecionáveis', description: 'Relógios, gramofones e objetos raros, selecionados pela curadoria da casa.', image: scene('sala-vitrola'), panoramaId: null, order: 7, showInMenu: true },
];

const customers: Customer[] = [
  { id: 'cli-helena', name: 'Helena Duarte', email: 'helena.duarte@exemplo.com', phone: '(11) 90000-0101', city: 'São Paulo, SP', createdAt: '' },
  { id: 'cli-rafael', name: 'Rafael Monteiro', email: 'rafael.monteiro@exemplo.com', phone: '(21) 90000-0202', city: 'Rio de Janeiro, RJ', createdAt: '' },
  { id: 'cli-marina', name: 'Marina Lopes', email: 'marina.lopes@exemplo.com', phone: '(31) 90000-0303', city: 'Belo Horizonte, MG', createdAt: '' },
  { id: 'cli-beatriz', name: 'Beatriz Siqueira', email: 'beatriz.siqueira@exemplo.com', phone: '(41) 90000-0404', city: 'Curitiba, PR', createdAt: '' },
  { id: 'cli-joaquim', name: 'Joaquim Albuquerque', email: 'joaquim.albuquerque@exemplo.com', phone: '(19) 90000-0505', city: 'Campinas, SP', createdAt: '' },
  {
    id: 'cli-demo',
    name: 'Lúcia Ferraz (conta demo)',
    email: 'demo@casaambar.exemplo',
    phone: '(11) 90000-0000',
    city: 'São Paulo, SP',
    createdAt: '',
    isDemoAccount: true,
    address: { cep: '01310-000', street: 'Rua Fictícia das Antiguidades', number: '100', complement: 'Apto 12', district: 'Bela Vista', city: 'São Paulo', state: 'SP' },
  },
];

function buildOrders(products: Product[], now: number): Order[] {
  const p = (id: string) => products.find((x) => x.id === id)!;
  const day = 86400000;
  const flow: OrderStatus[] = ['aguardando-pagamento', 'pago', 'em-separacao', 'enviado', 'entregue'];
  const notes: Record<OrderStatus, string> = {
    'aguardando-pagamento': 'Pedido criado, aguardando pagamento PIX (simulado).',
    pago: 'Pagamento confirmado (simulação).',
    'em-separacao': 'Peça em separação e embalagem.',
    enviado: 'Pedido entregue à transportadora (simulação).',
    entregue: 'Entrega confirmada pelo cliente.',
    cancelado: 'Pedido cancelado.',
  };
  const mk = (code: string, customerId: string, ids: string[], daysAgo: number, finalStatus: OrderStatus, ship: { m: Order['shippingMethod']; label: string; price: number }, coupon?: { code: string; discount: number }): Order => {
    const c = customers.find((x) => x.id === customerId)!;
    const items = ids.map((id) => ({ productId: id, name: p(id).name, price: p(id).price, photo: p(id).photos[0] }));
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    const discount = coupon?.discount ?? 0;
    const created = now - daysAgo * day;
    const steps = finalStatus === 'cancelado' ? (['aguardando-pagamento', 'cancelado'] as OrderStatus[]) : flow.slice(0, flow.indexOf(finalStatus) + 1);
    const history = steps.map((s, i) => ({ at: new Date(created + i * day * 1.3).toISOString(), status: s, note: notes[s], by: i === 0 ? 'Sistema' : 'Ana Ribeiro' }));
    const paid = steps.includes('pago');
    return {
      id: code.toLowerCase(),
      code,
      customerId,
      buyer: { name: c.name, email: c.email, phone: c.phone },
      items,
      subtotal,
      discount,
      shipping: ship.price,
      total: subtotal - discount + ship.price,
      couponCode: coupon?.code,
      shippingMethod: ship.m,
      shippingLabel: ship.label,
      address: { cep: '00000-000', street: 'Endereço fictício', number: 's/n', district: 'Centro', city: c.city.split(',')[0], state: c.city.split(', ')[1] ?? 'SP' },
      payment: {
        method: 'pix-simulado',
        status: finalStatus === 'cancelado' ? 'expirado' : paid ? 'aprovado' : 'pendente',
        pixCode: 'DEMONSTRACAO-SEM-VALOR-' + code,
        expiresAt: new Date(created + 30 * 60000).toISOString(),
        paidAt: paid ? history[1].at : undefined,
      },
      status: finalStatus,
      history,
      createdAt: new Date(created).toISOString(),
    };
  };
  const transp = { m: 'transportadora' as const, label: 'Transportadora especializada em móveis', price: 380 };
  const correios = { m: 'correios' as const, label: 'Correios (embalagem reforçada)', price: 68 };
  const retirada = { m: 'retirada' as const, label: 'Retirada no ateliê', price: 0 };
  return [
    mk('PED-1001', 'cli-helena', ['mesa-retangular-pes-torneados'], 150, 'entregue', transp),
    mk('PED-1002', 'cli-rafael', ['natureza-morta-oleo'], 120, 'entregue', correios, { code: 'BEMVINDO10', discount: 185 }),
    mk('PED-1003', 'cli-marina', ['espelho-bisotado-retangular'], 88, 'entregue', retirada),
    mk('PED-1004', 'cli-beatriz', ['cadeira-palhinha-torneada'], 61, 'cancelado', correios),
    mk('PED-1005', 'cli-joaquim', ['par-castical-bronze', 'retrato-oleo-dama'], 27, 'enviado', transp),
    mk('PED-1006', 'cli-helena', ['bule-porcelana-azul-cobalto'], 0.02, 'aguardando-pagamento', correios),
  ];
}

const coupons = (now: number): Coupon[] => [
  { id: 'cup-1', code: 'BEMVINDO10', description: '10% de desconto na primeira compra', type: 'percentual', value: 10, minSubtotal: 0, validUntil: new Date(now + 120 * 86400000).toISOString().slice(0, 10), usageLimit: 200, used: 1, active: true },
  { id: 'cup-2', code: 'FRETEGRATIS', description: 'Frete grátis acima de R$ 1.500', type: 'frete-gratis', value: 0, minSubtotal: 1500, validUntil: new Date(now + 60 * 86400000).toISOString().slice(0, 10), usageLimit: 50, used: 0, active: true },
  { id: 'cup-3', code: 'ANTIQUARIO300', description: 'R$ 300 de desconto acima de R$ 4.000', type: 'valor-fixo', value: 300, minSubtotal: 4000, validUntil: new Date(now + 30 * 86400000).toISOString().slice(0, 10), usageLimit: 20, used: 0, active: true },
  { id: 'cup-4', code: 'INVERNO2025', description: 'Campanha encerrada (demonstra cupom expirado)', type: 'percentual', value: 15, minSubtotal: 0, validUntil: '2025-08-31', usageLimit: 100, used: 37, active: true },
];

const articles = (now: number): Article[] => [
  {
    id: 'art-1',
    slug: 'como-identificar-madeira-de-lei',
    title: 'Como identificar uma madeira de lei em móveis antigos',
    excerpt: 'Peso, veios, encaixes e cheiro: o que observar antes de levar uma peça para casa.',
    body: 'Quem visita um antiquário pela primeira vez costuma se perguntar como saber se uma peça é de madeira maciça. A resposta começa pelas mãos: madeiras de lei como imbuia, jacarandá e peroba são densas e pesadas, e transmitem uma sensação de solidez imediata.\n\nOs veios contam o resto da história. Em uma peça maciça, o desenho da madeira continua nas bordas e nas laterais, sem a linha reta típica das lâminas coladas sobre aglomerado. Observe também os encaixes: rabo-de-andorinha nas gavetas e cavilhas de madeira são sinais de marcenaria tradicional.\n\nPor fim, abra as gavetas e sinta o cheiro. Madeiras antigas exalam um aroma seco, às vezes adocicado, muito diferente do odor de cola dos móveis industrializados. Na Casa Âmbar, toda peça vem acompanhada de uma ficha com material, época e procedência.',
    cover: scene('escritorio-detalhe'),
    author: 'Ana Ribeiro',
    status: 'publicado',
    publishAt: new Date(now - 20 * 86400000).toISOString(),
    seoTitle: 'Como identificar madeira de lei em móveis antigos | Casa Âmbar',
    seoDescription: 'Guia prático para reconhecer imbuia, jacarandá e peroba em móveis antigos.',
    tags: ['guia', 'madeira'],
  },
  {
    id: 'art-2',
    slug: 'gramofones-uma-breve-historia',
    title: 'Gramofones: a música que atravessou um século',
    excerpt: 'Da manivela à corneta, como funcionam e como cuidar de um gramofone de corda.',
    body: 'Antes da eletricidade chegar às salas de estar, a música vinha de uma manivela. O gramofone de corda transformava as vibrações de uma agulha em som, amplificado pela corneta metálica que se tornou o símbolo de uma época.\n\nPara quem deseja ter um em casa, alguns cuidados são essenciais: troque a agulha com frequência, nunca force a corda além do ponto de resistência e mantenha a peça longe de umidade. Discos de 78 rotações são frágeis e devem ser guardados na vertical.\n\nMais do que um aparelho, o gramofone é uma peça de conversa, daquelas que fazem os visitantes pararem e perguntarem de onde veio.',
    cover: scene('sala-vitrola'),
    author: 'Júlia Campos',
    status: 'publicado',
    publishAt: new Date(now - 8 * 86400000).toISOString(),
    seoTitle: 'Gramofones: história e cuidados | Casa Âmbar',
    seoDescription: 'Conheça a história dos gramofones de corda e saiba como conservar o seu.',
    tags: ['história', 'música'],
  },
  {
    id: 'art-3',
    slug: 'misturando-antigo-e-contemporaneo',
    title: 'Misturando o antigo e o contemporâneo sem errar',
    excerpt: 'Três princípios de curadoria para integrar peças de época em casas atuais.',
    body: 'A casa contemporânea ganha alma quando recebe uma peça com passado. O segredo está no equilíbrio: escolha uma peça protagonista por ambiente, como uma poltrona restaurada ou um espelho dourado, e deixe que o restante da decoração respire ao redor dela.\n\nO segundo princípio é a repetição de materiais. Se a peça antiga é de madeira escura, repita esse tom em um porta-retratos ou em uma bandeja. O terceiro é a escala: móveis antigos costumam ter proporções generosas e pedem espaço livre ao redor.\n\nNo nosso tour panorâmico você pode explorar ambientes montados pela curadoria e ver como essas combinações funcionam na prática.',
    cover: scene('sala-sobre'),
    author: 'Ana Ribeiro',
    status: 'publicado',
    publishAt: new Date(now - 2 * 86400000).toISOString(),
    seoTitle: 'Como misturar móveis antigos e contemporâneos | Casa Âmbar',
    seoDescription: 'Princípios de curadoria para combinar antiguidades com decoração atual.',
    tags: ['decoração', 'curadoria'],
  },
  {
    id: 'art-4',
    slug: 'cuidados-com-couro-antigo',
    title: 'Cuidados com couro antigo: hidratação e pátina',
    excerpt: 'Como preservar a pátina sem ressecar o couro de poltronas e baús.',
    body: 'O couro envelhece bem quando é cuidado. Hidrate a cada seis meses com produtos neutros e mantenha a peça longe da luz solar direta.',
    cover: photo('poltrona-club-couro-conhaque', 2),
    author: 'Júlia Campos',
    status: 'agendado',
    publishAt: new Date(now + 5 * 86400000).toISOString(),
    seoTitle: 'Cuidados com couro antigo | Casa Âmbar',
    seoDescription: 'Aprenda a hidratar e preservar couro antigo em móveis.',
    tags: ['guia', 'couro'],
  },
];

const admins: AdminUser[] = [
  { id: 'adm-ana', name: 'Ana Ribeiro', email: 'ana@casaambar.exemplo', role: 'admin', avatarColor: '#7a2e22', active: true },
  { id: 'adm-carlos', name: 'Carlos Menezes', email: 'carlos@casaambar.exemplo', role: 'gerente', avatarColor: '#4a2f1d', active: true },
  { id: 'adm-bruno', name: 'Bruno Tavares', email: 'bruno@casaambar.exemplo', role: 'estoque', avatarColor: '#6f7a5c', active: true },
  { id: 'adm-julia', name: 'Júlia Campos', email: 'julia@casaambar.exemplo', role: 'editor', avatarColor: '#b08a40', active: true },
];

export function createSeed(): DemoDatabase {
  const now = Date.now();
  const products = buildSeedProducts(now);
  const custs = customers.map((c, i) => ({ ...c, createdAt: new Date(now - (200 - i * 25) * 86400000).toISOString() }));
  const orders = buildOrders(products, now);
  // a reserva do bule acompanha o pedido pendente PED-1006 (outro cliente)
  const pending = orders.find((o) => o.code === 'PED-1006')!;
  const reservations: Reservation[] = [
    { id: 'res-seed-1', productId: 'bule-porcelana-azul-cobalto', sessionId: 'sessao-de-outro-cliente', createdAt: pending.createdAt, expiresAt: new Date(now + 28 * 60000).toISOString(), status: 'ativa' },
  ];
  return {
    version: DB_VERSION,
    seededAt: new Date(now).toISOString(),
    products,
    categories,
    panoramas: buildPanoramas(),
    customers: custs,
    orders,
    coupons: coupons(now),
    reservations,
    articles: articles(now),
    admins,
  };
}
