import { useEffect } from 'react';
import { services } from '@/services';
import { useSession } from '@/store/session';
import { useCart } from '@/store/cart';
import { toast } from '@/store/toast';

/**
 * Varre reservas vencidas a cada segundo (no mock, o "servidor" é o próprio navegador).
 * Na versão definitiva isso será responsabilidade do backend (job/TTL no banco).
 */
export function ReservationWatcher() {
  useEffect(() => {
    const id = setInterval(async () => {
      const expired = await services.reservations.sweep();
      const mine = expired.filter((r) => r.sessionId === useSession.getState().sessionId && useCart.getState().has(r.productId));
      for (const r of mine) {
        const p = await services.products.get(r.productId);
        toast.info('Reserva expirada', `${p?.name ?? 'Uma peça'} foi liberada para outros clientes. Você pode reservá-la novamente se ainda estiver disponível.`);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
