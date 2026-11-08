import { Link, useNavigate } from 'react-router-dom';
import { Clock, ShoppingBag, Trash2, TimerReset, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { Button, Checkbox, Drawer, EmptyState, Img, Skeleton } from '@/design-system';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { toast } from '@/store/toast';
import { services } from '@/services';
import { useCartDetails, type CartLine } from '@/hooks/useCartDetails';
import { brl, mmss } from '@/utils/format';

export function ReservationChip({ line }: { line: CartLine }) {
  if (line.state === 'reservado') {
    const urgent = line.remainingMs < 120000;
    return (
      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums', urgent ? 'bg-oxblood/10 text-oxblood' : 'bg-brass/15 text-[#7a5a1e]')}>
        <Clock className="h-3 w-3" /> Reservada para você · {mmss(line.remainingMs)}
      </span>
    );
  }
  const label = { expirado: 'Reserva expirada · peça liberada', indisponivel: 'Reservada por outro cliente', vendido: 'Peça vendida' }[line.state];
  return <span className="inline-flex items-center gap-1 rounded-full bg-cream-300 px-2 py-0.5 text-[11.5px] font-semibold text-tobacco">{label}</span>;
}

export function CartLineRow({ line, compact }: { line: CartLine; compact?: boolean }) {
  const { remove, toggle, renew } = useCart();
  const sessionId = useSession((s) => s.sessionId);
  const p = line.product;
  return (
    <div className={clsx('flex gap-4', line.state !== 'reservado' && 'opacity-80')}>
      <Link to={`/produto/${p.slug}`} className="shrink-0">
        <Img src={p.photos[0]} alt={p.name} className={clsx('rounded-xl', compact ? 'h-20 w-20' : 'h-28 w-28')} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/produto/${p.slug}`} className="font-serif text-lg leading-tight text-walnut hover:underline">
            {p.name}
          </Link>
          <button onClick={() => remove(p.id).then(() => toast.info('Peça removida', 'A reserva foi liberada.'))} aria-label={`Remover ${p.name}`} className="rounded-full p-1.5 text-tobacco hover:bg-walnut/5 hover:text-oxblood">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-0.5 text-sm font-semibold text-walnut">{brl(p.price)}</p>
        <p className="text-[11.5px] text-tobacco">Peça única · quantidade 1</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ReservationChip line={line} />
          {line.state === 'reservado' && (
            <button title="Recurso de demonstração: faz a reserva expirar em 10 segundos" onClick={() => services.reservations.fastForward(p.id, sessionId, 10).then(() => toast.info('Simulação ativada', 'A reserva expira em 10 segundos.'))} className="inline-flex items-center gap-1 text-[11.5px] text-tobacco underline decoration-dotted underline-offset-2 hover:text-oxblood">
              <TimerReset className="h-3 w-3" /> simular expiração
            </button>
          )}
          {line.state === 'expirado' && (
            <button
              onClick={() =>
                renew(p.id)
                  .then(() => toast.success('Reservada novamente', 'Você tem mais 15 minutos.'))
                  .catch((e) => toast.error('Não foi possível reservar', e.message))
              }
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-walnut underline underline-offset-2"
            >
              <RefreshCw className="h-3 w-3" /> Reservar novamente
            </button>
          )}
        </div>
        {line.state === 'reservado' && !compact && <Checkbox className="mt-3" checked={line.selected} onChange={() => toggle(p.id)} label="Incluir nesta compra" />}
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { open, setOpen } = useCart();
  const { lines, subtotal, purchasable, loading, isEmpty } = useCartDetails();
  const nav = useNavigate();
  const go = (to: string) => {
    setOpen(false);
    nav(to);
  };
  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title={
        <span className="flex items-center gap-2">
          Seu carrinho <span className="font-sans text-sm text-tobacco">({lines.length})</span>
        </span>
      }
      footer={
        !isEmpty && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-tobacco">Subtotal ({purchasable.length} {purchasable.length === 1 ? 'peça' : 'peças'})</span>
              <span className="font-serif text-2xl text-walnut">{brl(subtotal)}</span>
            </div>
            <p className="text-[12px] text-tobacco">Frete e cupons calculados no carrinho. Reservas expiram em 15 minutos.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => go('/carrinho')}>
                Ver carrinho
              </Button>
              <Button onClick={() => go('/checkout')} disabled={!purchasable.length}>
                Finalizar
              </Button>
            </div>
          </div>
        )
      }
    >
      <div className="p-5">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-20" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Seu carrinho está vazio" action={<Button onClick={() => go('/loja')}>Explorar peças</Button>}>
            Cada peça da Casa Âmbar é única. Ao adicioná-la, ela fica reservada para você por 15 minutos.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {lines.map((l) => (
              <CartLineRow key={l.product.id} line={l} compact />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
