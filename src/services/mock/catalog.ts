import type { CategoryService, PanoramaService, ProductService, ProductFilters } from '../contracts';
import type { Product, ProductStatus, Reservation } from '@/types/domain';
import { delay, getDb, mutate, slugify, uid } from './db';

const now = () => new Date().toISOString();

function activeReservations(): Reservation[] {
  const t = Date.now();
  return getDb().reservations.filter((r) => r.status === 'ativa' && new Date(r.expiresAt).getTime() > t);
}

function effective(p: Product, res: Reservation[]): ProductStatus {
  if (p.status === 'vendido' || p.status === 'arquivado') return p.status;
  return res.some((r) => r.productId === p.id) ? 'reservado' : 'disponivel';
}

export const ProductServiceMock: ProductService = {
  effectiveStatus: effective,

  async list(f: ProductFilters = {}) {
    const res = activeReservations();
    let items = getDb().products.map((p) => ({ ...p, status: effective(p, res) }));
    const status = f.status ?? 'ativos';
    if (status === 'ativos') items = items.filter((p) => p.status !== 'arquivado');
    else if (status !== 'todos') items = items.filter((p) => p.status === status);
    if (f.categoryId) items = items.filter((p) => p.categoryId === f.categoryId);
    if (f.featured) items = items.filter((p) => p.featured);
    if (f.isNew) items = items.filter((p) => p.isNew);
    if (f.era) items = items.filter((p) => p.era === f.era);
    if (f.conservation) items = items.filter((p) => p.conservation === f.conservation);
    if (f.minPrice != null) items = items.filter((p) => p.price >= f.minPrice!);
    if (f.maxPrice != null) items = items.filter((p) => p.price <= f.maxPrice!);
    if (f.search) {
      const q = slugify(f.search).replace(/-/g, ' ');
      items = items.filter((p) => slugify([p.name, p.material, p.era, p.maker, p.tags.join(' '), p.shortDescription].join(' ')).replace(/-/g, ' ').includes(q));
    }
    const sorters: Record<string, (a: Product, b: Product) => number> = {
      recentes: (a, b) => b.createdAt.localeCompare(a.createdAt),
      'preco-asc': (a, b) => a.price - b.price,
      'preco-desc': (a, b) => b.price - a.price,
      nome: (a, b) => a.name.localeCompare(b.name),
      populares: (a, b) => b.views - a.views,
    };
    items.sort(sorters[f.sort ?? 'recentes']);
    // peças vendidas vão para o fim da vitrine
    if (status === 'ativos') items.sort((a, b) => Number(a.status === 'vendido') - Number(b.status === 'vendido'));
    return delay(items);
  },

  async get(idOrSlug) {
    const p = getDb().products.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
    return delay(p ? { ...p, status: effective(p, activeReservations()) } : null);
  },

  async related(productId, limit = 4) {
    const all = getDb().products;
    const p = all.find((x) => x.id === productId);
    if (!p) return delay([]);
    const res = activeReservations();
    const pool = all
      .filter((x) => x.id !== p.id && x.status !== 'arquivado')
      .map((x) => ({ x, score: (x.categoryId === p.categoryId ? 3 : 0) + x.tags.filter((t) => p.tags.includes(t)).length + (x.status === 'vendido' ? -5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ x }) => ({ ...x, status: effective(x, res) }));
    return delay(pool);
  },

  async create(input) {
    const p = mutate((d) => {
      let slug = slugify(input.slug || input.name) || uid('produto');
      if (d.products.some((x) => x.slug === slug)) slug = `${slug}-${uid('').slice(1, 5)}`;
      const prod: Product = { ...input, id: slug, slug, views: 0, createdAt: now(), updatedAt: now() };
      d.products.unshift(prod);
      return prod;
    });
    return delay(p);
  },

  async update(id, patch) {
    const p = mutate((d) => {
      const i = d.products.findIndex((x) => x.id === id);
      if (i < 0) throw new Error('Produto não encontrado');
      d.products[i] = { ...d.products[i], ...patch, id, updatedAt: now() };
      return d.products[i];
    });
    return delay(p);
  },

  async remove(id) {
    mutate((d) => {
      d.products = d.products.filter((x) => x.id !== id);
      d.panoramas.forEach((pn) => (pn.hotspots = pn.hotspots.filter((h) => h.productId !== id)));
      d.reservations = d.reservations.filter((r) => r.productId !== id);
    });
    return delay(undefined);
  },

  async setStatus(id, status) {
    return this.update(id, { status: status === 'reservado' ? 'disponivel' : status });
  },

  async registerView(id) {
    mutate((d) => {
      const p = d.products.find((x) => x.id === id);
      if (p) p.views += 1;
    });
  },
};

export const CategoryServiceMock: CategoryService = {
  async list() {
    return delay([...getDb().categories].sort((a, b) => a.order - b.order), 60);
  },
  async get(idOrSlug) {
    return delay(getDb().categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug) ?? null, 60);
  },
  async create(input) {
    const c = mutate((d) => {
      const slug = slugify(input.slug || input.name);
      const cat = { ...input, id: slug, slug };
      if (d.categories.some((x) => x.id === slug)) throw new Error('Já existe uma categoria com este nome.');
      d.categories.push(cat);
      return cat;
    });
    return delay(c);
  },
  async update(id, patch) {
    const c = mutate((d) => {
      const i = d.categories.findIndex((x) => x.id === id);
      d.categories[i] = { ...d.categories[i], ...patch, id };
      return d.categories[i];
    });
    return delay(c);
  },
  async remove(id) {
    const count = getDb().products.filter((p) => p.categoryId === id).length;
    if (count > 0) return delay({ ok: false, reason: `Existem ${count} produto(s) nesta categoria. Mova-os antes de excluir.` });
    mutate((d) => (d.categories = d.categories.filter((c) => c.id !== id)));
    return delay({ ok: true });
  },
};

export const PanoramaServiceMock: PanoramaService = {
  async list() {
    return delay(getDb().panoramas, 60);
  },
  async get(id) {
    return delay(getDb().panoramas.find((p) => p.id === id) ?? null, 60);
  },
  async saveHotspots(id, hotspots) {
    const p = mutate((d) => {
      const pn = d.panoramas.find((x) => x.id === id)!;
      pn.hotspots = hotspots;
      return pn;
    });
    return delay(p, 300);
  },
  async update(id, patch) {
    const p = mutate((d) => {
      const i = d.panoramas.findIndex((x) => x.id === id);
      d.panoramas[i] = { ...d.panoramas[i], ...patch, id };
      return d.panoramas[i];
    });
    return delay(p);
  },
};
