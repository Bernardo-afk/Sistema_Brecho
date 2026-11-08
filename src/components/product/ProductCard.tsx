import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Check, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';
import type { Product } from '@/types/domain';
import { Badge, Button, Img, Price, ProductStatusBadge } from '@/design-system';
import { useCart } from '@/store/cart';
import { toast } from '@/store/toast';
import { conservationLabel } from '@/utils/format';

/** Badge de status que reconhece a reserva feita pelo próprio visitante (peça no carrinho). */
export function StatusBadgeFor({ product, className }: { product: Product; className?: string }) {
  const mine = useCart((s) => s.items.some((i) => i.productId === product.id));
  if (mine && product.status === 'reservado') return <Badge tone="brass" className={className}>Reservada para você</Badge>;
  return <ProductStatusBadge status={product.status} className={className} />;
}

export function AddToCartButton({ product, size = 'md', block, className }: { product: Product; size?: 'sm' | 'md' | 'lg'; block?: boolean; className?: string }) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.some((i) => i.productId === product.id));
  const setOpen = useCart((s) => s.setOpen);
  const [loading, setLoading] = useState(false);
  if (inCart)
    return (
      <Button size={size} block={block} variant="secondary" icon={<Check className="h-4 w-4" />} onClick={() => setOpen(true)} className={className}>
        No seu carrinho
      </Button>
    );
  if (product.status === 'vendido')
    return (
      <Button size={size} block={block} variant="secondary" disabled className={className}>
        Peça vendida
      </Button>
    );
  if (product.status === 'reservado')
    return (
      <Button size={size} block={block} variant="secondary" disabled className={className} title="Outro cliente está finalizando a compra desta peça.">
        Reservada por outro cliente
      </Button>
    );
  if (product.status === 'arquivado')
    return (
      <Button size={size} block={block} variant="secondary" disabled className={className}>
        Indisponível
      </Button>
    );
  return (
    <Button
      size={size}
      block={block}
      loading={loading}
      className={className}
      icon={<ShoppingBag className="h-4 w-4" />}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        try {
          await add(product.id);
          toast.success('Peça reservada por 15 minutos', product.name);
        } catch (err) {
          toast.error('Não foi possível adicionar', (err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      Adicionar ao carrinho
    </Button>
  );
}

export function ProductCard({ product, categoryName, className, priority }: { product: Product; categoryName?: string; className?: string; priority?: boolean }) {
  const [hover, setHover] = useState(false);
  const sold = product.status === 'vendido';
  return (
    <article className={clsx('group relative', className)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Link to={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-200">
          <Img src={product.photos[0]} alt={product.name} eager={priority} className={clsx('absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]', sold && 'grayscale-[.5]')} />
          {product.photos[1] && <Img src={product.photos[1]} alt="" className={clsx('absolute inset-0 transition-opacity duration-500', hover ? 'opacity-100' : 'opacity-0')} />}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.isNew && product.status === 'disponivel' && <Badge tone="brass" className="bg-cream-50/90 backdrop-blur">Novidade</Badge>}
            {product.status !== 'disponivel' && <StatusBadgeFor product={product} className="backdrop-blur" />}
          </div>
          {product.model3d && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-espresso/70 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-cream backdrop-blur" title="Visualização 3D disponível">
              <Box className="h-3 w-3" /> 3D
            </span>
          )}
          {product.status === 'disponivel' && (
            <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
              <AddToCartButton product={product} size="sm" block className="bg-cream-50/95 !text-walnut hover:!bg-cream-50 backdrop-blur" />
            </div>
          )}
        </div>
        <div className="mt-3.5 px-0.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[.18em] text-tobacco">
            {[categoryName, product.era].filter(Boolean).join(' · ')}
          </p>
          <h3 className="mt-1 font-serif text-[1.3rem] leading-snug text-walnut group-hover:underline group-hover:decoration-brass/50 group-hover:underline-offset-4">{product.name}</h3>
          <div className="mt-1 flex items-center justify-between gap-2">
            <Price value={product.price} compareAt={product.compareAtPrice} className={clsx('text-[15px]', sold && 'opacity-60')} />
            <span className="text-[11.5px] text-tobacco">{conservationLabel[product.conservation]}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-cream-200" />
          <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-cream-200" />
          <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-cream-200" />
        </div>
      ))}
    </div>
  );
}
