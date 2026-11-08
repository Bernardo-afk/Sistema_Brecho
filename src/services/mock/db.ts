// "Banco de dados" da demonstração: um único objeto em memória, persistido no
// localStorage do navegador. Substituir por API/banco real na versão definitiva.
import { createSeed, DB_VERSION, type DemoDatabase } from '@/data/seed';

const KEY = 'casa-ambar:demo-db';
let db: DemoDatabase | null = null;
const listeners = new Set<() => void>();
let revision = 0;

function load(): DemoDatabase {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDatabase;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* armazenamento indisponível: segue em memória */
  }
  const seed = createSeed();
  persist(seed);
  return seed;
}

function persist(data: DemoDatabase) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* modo privado ou cota excedida: mantém só em memória */
  }
}

export function getDb(): DemoDatabase {
  if (!db) db = load();
  return db;
}

/** Aplica uma mutação, persiste e notifica a interface. */
export function mutate<T>(fn: (d: DemoDatabase) => T): T {
  const d = getDb();
  const result = fn(d);
  persist(d);
  revision++;
  listeners.forEach((l) => l());
  return result;
}

export function resetDb() {
  db = createSeed();
  persist(db);
  revision++;
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getRevision = () => revision;

// sincroniza entre abas do mesmo navegador
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      db = null;
      revision++;
      listeners.forEach((l) => l());
    }
  });
}

/** Latência artificial para simular chamadas de rede e exibir estados de carregamento. */
export function delay<T>(value: T, ms = 120 + Math.random() * 180): Promise<T> {
  return new Promise((r) => setTimeout(() => r(structuredClone(value)), ms));
}

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
