import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types/domain';

// Sessão demonstrativa. NÃO é autenticação: apenas perfis locais para navegar.
interface SessionState {
  sessionId: string;
  customer: Customer | null;
  adminUserId: string;
  setCustomer: (c: Customer | null) => void;
  setAdminUser: (id: string) => void;
}
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: 'sessao-' + Math.random().toString(36).slice(2, 10),
      customer: null,
      adminUserId: 'adm-ana',
      setCustomer: (customer) => set({ customer }),
      setAdminUser: (adminUserId) => set({ adminUserId }),
    }),
    { name: 'casa-ambar:session' },
  ),
);
