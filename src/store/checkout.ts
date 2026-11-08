import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Address, ShippingQuote } from '@/types/domain';

interface CheckoutState {
  mode: 'visitante' | 'conta-demo' | null;
  buyer: { name: string; email: string; phone: string; cpf: string };
  address: Address;
  cep: string;
  shipping: ShippingQuote | null;
  set: (patch: Partial<Omit<CheckoutState, 'set' | 'reset'>>) => void;
  reset: () => void;
}
const empty = {
  mode: null,
  buyer: { name: '', email: '', phone: '', cpf: '' },
  address: { cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
  cep: '',
  shipping: null,
};
export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      ...empty,
      set: (patch) => set(patch),
      reset: () => set(empty),
    }),
    { name: 'casa-ambar:checkout', storage: { getItem: (k) => JSON.parse(sessionStorage.getItem(k) || 'null'), setItem: (k, v) => sessionStorage.setItem(k, JSON.stringify(v)), removeItem: (k) => sessionStorage.removeItem(k) } },
  ),
);
