import type { AdminService, AnalyticsService, ArticleService, FileService } from '../contracts';
import type { OrderStatus } from '@/types/domain';
import { delay, getDb, mutate, resetDb, slugify, uid } from './db';

export const ArticleServiceMock: ArticleService = {
  async list(opts = {}) {
    let items = [...getDb().articles];
    if (opts.publicOnly) {
      const t = Date.now();
      // artigos agendados aparecem automaticamente quando a data chega
      items = items.filter((a) => a.status !== 'rascunho' && new Date(a.publishAt).getTime() <= t);
    }
    return delay(items.sort((a, b) => b.publishAt.localeCompare(a.publishAt)));
  },
  async get(idOrSlug) {
    return delay(getDb().articles.find((a) => a.id === idOrSlug || a.slug === idOrSlug) ?? null);
  },
  async create(input) {
    const a = mutate((d) => {
      const art = { ...input, id: uid('art'), slug: slugify(input.slug || input.title) };
      d.articles.push(art);
      return art;
    });
    return delay(a);
  },
  async update(id, patch) {
    const a = mutate((d) => {
      const i = d.articles.findIndex((x) => x.id === id);
      d.articles[i] = { ...d.articles[i], ...patch, id };
      return d.articles[i];
    });
    return delay(a);
  },
  async remove(id) {
    mutate((d) => (d.articles = d.articles.filter((a) => a.id !== id)));
    return delay(undefined);
  },
};

export const AdminServiceMock: AdminService = {
  async listUsers() {
    return delay(getDb().admins);
  },
  async createUser(input) {
    const u = mutate((d) => {
      const user = { ...input, id: uid('adm') };
      d.admins.push(user);
      return user;
    });
    return delay(u);
  },
  async updateUser(id, patch) {
    const u = mutate((d) => {
      const i = d.admins.findIndex((x) => x.id === id);
      d.admins[i] = { ...d.admins[i], ...patch, id };
      return d.admins[i];
    });
    return delay(u);
  },
  async removeUser(id) {
    mutate((d) => (d.admins = d.admins.filter((a) => a.id !== id)));
    return delay(undefined);
  },
  async resetDemo() {
    resetDb();
    await clearUploads();
    return delay(undefined, 500);
  },
};

// ---------- Arquivos enviados (IndexedDB local) ----------
const IDB = 'casa-ambar-uploads';
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const dbx = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = dbx.transaction('files', mode);
    const req = fn(tx.objectStore('files'));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}
async function clearUploads() {
  try {
    await idb('readwrite', (s) => s.clear());
  } catch {
    /* ignore */
  }
  urlCache.clear();
}
const urlCache = new Map<string, string>();

export const FileServiceMock: FileService = {
  async upload(file) {
    const id = uid('file');
    await idb('readwrite', (s) => s.put(file, id));
    const ref = `upload:${id}`;
    urlCache.set(ref, URL.createObjectURL(file));
    return { ref, meta: { id, name: file.name, type: file.type, size: file.size, createdAt: new Date().toISOString() } };
  },
  async resolve(ref) {
    if (!ref.startsWith('upload:')) return null;
    if (urlCache.has(ref)) return urlCache.get(ref)!;
    try {
      const blob = await idb<Blob | undefined>('readonly', (s) => s.get(ref.slice(7)));
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      urlCache.set(ref, url);
      return url;
    } catch {
      return null;
    }
  },
  async remove(ref) {
    if (!ref.startsWith('upload:')) return;
    try {
      await idb('readwrite', (s) => s.delete(ref.slice(7)));
    } catch {
      /* ignore */
    }
    const u = urlCache.get(ref);
    if (u) URL.revokeObjectURL(u);
    urlCache.delete(ref);
  },
};

// ---------- Indicadores derivados dos mesmos dados mockados ----------
const PAID: OrderStatus[] = ['pago', 'em-separacao', 'enviado', 'entregue'];

export const AnalyticsServiceMock: AnalyticsService = {
  async snapshot() {
    const d = getDb();
    const t = Date.now();
    const paid = d.orders.filter((o) => PAID.includes(o.status));
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const months: { month: string; revenue: number; orders: number }[] = [];
    const base = new Date();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const inMonth = paid.filter((o) => {
        const od = new Date(o.payment.paidAt ?? o.createdAt);
        return `${od.getFullYear()}-${od.getMonth()}` === key;
      });
      months.push({ month: dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), revenue: inMonth.reduce((s, o) => s + o.total, 0), orders: inMonth.length });
    }
    const statuses: OrderStatus[] = ['aguardando-pagamento', 'pago', 'em-separacao', 'enviado', 'entregue', 'cancelado'];
    const catRev = new Map<string, { count: number; revenue: number }>();
    const recentSold: { product: (typeof d.products)[number]; soldAt: string; orderCode: string }[] = [];
    for (const o of paid) {
      for (const i of o.items) {
        const p = d.products.find((x) => x.id === i.productId);
        const cat = d.categories.find((c) => c.id === p?.categoryId)?.name ?? 'Sem categoria';
        const cur = catRev.get(cat) ?? { count: 0, revenue: 0 };
        catRev.set(cat, { count: cur.count + 1, revenue: cur.revenue + i.price });
        if (p) recentSold.push({ product: p, soldAt: o.payment.paidAt ?? o.createdAt, orderCode: o.code });
      }
    }
    const activeRes = d.reservations.filter((r) => r.status === 'ativa' && new Date(r.expiresAt).getTime() > t);
    return delay({
      revenue,
      salesCount: paid.length,
      ordersPending: d.orders.filter((o) => o.status === 'aguardando-pagamento').length,
      productsAvailable: d.products.filter((p) => p.status === 'disponivel' && !activeRes.some((r) => r.productId === p.id)).length,
      productsSold: d.products.filter((p) => p.status === 'vendido').length,
      activeReservations: activeRes.length,
      averageTicket: paid.length ? revenue / paid.length : 0,
      revenueByMonth: months,
      ordersByStatus: statuses.map((s) => ({ status: s, count: d.orders.filter((o) => o.status === s).length })),
      mostViewed: [...d.products].sort((a, b) => b.views - a.views).slice(0, 6).map((p) => ({ product: p, views: p.views })),
      bestSellingCategories: [...catRev.entries()].map(([category, v]) => ({ category, ...v })).sort((a, b) => b.revenue - a.revenue),
      recentSold: recentSold.sort((a, b) => b.soldAt.localeCompare(a.soldAt)).slice(0, 6),
    }, 350);
  },
};
