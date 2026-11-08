import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Peças vistas recentemente (base das recomendações da home). */
export const useRecent = create<{ ids: string[]; push: (id: string) => void }>()(
  persist((set) => ({ ids: [], push: (id) => set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 12) })) }), { name: 'casa-ambar:recent' }),
);
