import { useMemo } from 'react';
import { services } from '@/services';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import type { Product, Reservation } from '@/types/domain';
import { useNow, useQuery } from './useQuery';

export type CartLineState = 'reservado' | 'expirado' | 'indisponivel' | 'vendido';
export interface CartLine {
  product: Product;
  selected: boolean;
  reservation?: Reservation;
  remainingMs: number;
  state: CartLineState;
}

/** Junta itens do carrinho, produtos e reservas da sessão em um modelo pronto para a interface. */
export function useCartDetails() {
  const items = useCart((s) => s.items);
  const sessionId = useSession((s) => s.sessionId);
  const now = useNow(1000);
  const ids = items.map((i) => i.productId);
  const { data: products, loading } = useQuery(async () => {
    const all = await Promise.all(ids.map((id) => services.products.get(id)));
    return all.filter(Boolean) as Product[];
  }, [ids.join(',')]);
  const { data: reservations } = useQuery(() => services.reservations.forSession(sessionId), [sessionId]);

  const lines: CartLine[] = useMemo(() => {
    if (!products) return [];
    return items
      .map((it) => {
        const product = products.find((p) => p.id === it.productId);
        if (!product) return null;
        const res = (reservations ?? [])
          .filter((r) => r.productId === it.productId && r.status === 'ativa')
          .sort((a, b) => b.expiresAt.localeCompare(a.expiresAt))[0];
        const remainingMs = res ? new Date(res.expiresAt).getTime() - now : 0;
        let state: CartLineState = 'reservado';
        if (product.status === 'vendido' || product.status === 'arquivado') state = 'vendido';
        else if (!res || remainingMs <= 0) state = product.status === 'reservado' ? 'indisponivel' : 'expirado';
        return { product, selected: it.selected, reservation: res, remainingMs, state } as CartLine;
      })
      .filter(Boolean) as CartLine[];
  }, [items, products, reservations, now]);

  const purchasable = lines.filter((l) => l.selected && l.state === 'reservado');
  const subtotal = purchasable.reduce((s, l) => s + l.product.price, 0);
  return { lines, purchasable, subtotal, loading: loading && items.length > 0, isEmpty: items.length === 0 };
}
