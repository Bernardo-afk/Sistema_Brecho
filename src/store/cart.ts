import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/domain';
import { services } from '@/services';
import { useSession } from './session';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  open: boolean;
  setOpen: (o: boolean) => void;
  /** Adiciona e reserva a peça por 15 minutos (peça única: no máximo 1 unidade). */
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  renew: (productId: string) => Promise<void>;
  toggle: (productId: string) => void;
  setCoupon: (code: string | null) => void;
  clearPurchased: (productIds: string[]) => void;
  has: (productId: string) => boolean;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      open: false,
      setOpen: (open) => set({ open }),
      has: (id) => get().items.some((i) => i.productId === id),
      async add(productId) {
        if (get().has(productId)) {
          set({ open: true });
          throw new Error('Esta peça já está no seu carrinho. Cada peça é única.');
        }
        await services.reservations.reserve(productId, useSession.getState().sessionId);
        set((s) => ({ items: [...s.items, { productId, addedAt: new Date().toISOString(), selected: true }], open: true }));
      },
      async renew(productId) {
        await services.reservations.reserve(productId, useSession.getState().sessionId);
      },
      async remove(productId) {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
        await services.reservations.release(productId, useSession.getState().sessionId);
      },
      toggle: (productId) => set((s) => ({ items: s.items.map((i) => (i.productId === productId ? { ...i, selected: !i.selected } : i)) })),
      setCoupon: (couponCode) => set({ couponCode }),
      clearPurchased: (ids) => set((s) => ({ items: s.items.filter((i) => !ids.includes(i.productId)), couponCode: null })),
    }),
    { name: 'casa-ambar:cart', partialize: (s) => ({ items: s.items, couponCode: s.couponCode }) },
  ),
);
