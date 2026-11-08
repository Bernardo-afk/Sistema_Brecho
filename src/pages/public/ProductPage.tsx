import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Camera, Clock, Compass, Eye, Ruler, ShieldCheck, Truck } from 'lucide-react';
import clsx from 'clsx';
import { services } from '@/services';
import { useDocumentTitle, useQuery } from '@/hooks/useQuery';
import { useRecent } from '@/store/recent';
import { Breadcrumbs, Img, Price, Spinner } from '@/design-system';
import { AddToCartButton, ProductCard, StatusBadgeFor } from '@/components/product/ProductCard';
import { useCart } from '@/store/cart';
import { Model3DViewer, PhotoAngleViewer } from '@/viewers';
import { conservationLabel, dims, installments } from '@/utils/format';
import { NotFoundPage } from './InstitutionalPages';

export function ProductPage() {
  const { slug = '' } = useParams();
  const { data: product, loading } = useQuery(() => services.products.get(slug), [slug]);
  const { data: category } = useQuery(async () => (product ? services.categories.get(product.categoryId) : null), [product?.categoryId]);
  const { data: related } = useQuery(async () => (product ? services.products.related(product.id, 4) : []), [product?.id]);
  const { data: panoramas } = useQuery(() => services.panoramas.list(), []);
  const push = useRecent((s) => s.push);
  const [mode, setMode] = useState<'fotos' | '3d'>('fotos');
  const mine = useCart((s) => s.items.some((i) => i.productId === slug || i.productId === product?.id));
  const [photo, setPhoto] = useState(0);
  useDocumentTitle(product?.name);

  useEffect(() => {
    if (product?.id) {
      services.products.registerView(product.id);
      push(product.id);
      setPhoto(0);
      setMode('fotos');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (loading && !product) return <Spinner label="Abrindo a ficha da peça…" />;
  if (!product) return <NotFoundPage />;
  const inPanorama = panoramas?.find((p) => p.hotspots.some((h) => h.productId === product.id));

  const specs: [string, string][] = [
    ['Medidas (A × L × P)', dims(product.dimensions)],
    ['Peso', `${product.weightKg.toLocaleString('pt-BR')} kg`],
    ['Material', product.material],
    ['Estado de conservação', conservationLabel[product.conservation]],
    ['Época aproximada', product.era],
    ['Fabricante', product.maker],
    ['Procedência', product.provenance],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, ...(category ? [{ label: category.name, to: `/categoria/${category.slug}` }] : []), { label: product.name }]} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        {/* MÍDIA */}
        <div>
          <div className="mb-3 inline-flex rounded-full bg-cream-200 p-1" role="tablist" aria-label="Modo de visualização">
            <button role="tab" aria-selected={mode === 'fotos'} onClick={() => setMode('fotos')} className={clsx('inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium', mode === 'fotos' ? 'bg-cream-50 text-walnut shadow-soft' : 'text-tobacco')}>
              <Camera className="h-4 w-4" /> Fotografias
            </button>
            <button role="tab" aria-selected={mode === '3d'} onClick={() => setMode('3d')} className={clsx('inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium', mode === '3d' ? 'bg-cream-50 text-walnut shadow-soft' : 'text-tobacco')}>
              <Box className="h-4 w-4" /> {product.model3d ? 'Visualizar em 3D' : 'Vista 360° por ângulos'}
            </button>
          </div>
          {mode === 'fotos' ? (
            <div className="grid gap-3 sm:grid-cols-[76px_1fr]">
              <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
                {product.photos.map((ph, i) => (
                  <button key={ph + i} onClick={() => setPhoto(i)} aria-label={`Foto ${i + 1}`} className={clsx('shrink-0 overflow-hidden rounded-xl border-2 transition', i === photo ? 'border-walnut' : 'border-transparent opacity-70 hover:opacity-100')}>
                    <Img src={ph} alt="" className="h-[70px] w-[70px]" />
                  </button>
                ))}
                <button onClick={() => setMode('3d')} className="flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand text-[11px] font-semibold text-walnut hover:border-walnut">
                  <Box className="h-5 w-5 text-brass" /> {product.model3d ? '3D' : '360°'}
                </button>
              </div>
              <div className="order-1 sm:order-2">
                <Img src={product.photos[photo]} alt={`${product.name}, foto ${photo + 1}`} className="aspect-square rounded-3xl" eager />
              </div>
            </div>
          ) : product.model3d ? (
            <Model3DViewer src={product.model3d} poster={product.photos[0]} title={product.name} className="aspect-square rounded-3xl" />
          ) : (
            <div>
              <PhotoAngleViewer photos={product.photos} title={product.name} className="aspect-square rounded-3xl" />
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-cream-200/70 p-3 text-[13px] text-tobacco">
                <Box className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                Esta peça ainda não tem modelo 3D digitalizado. Arraste a imagem para alternar entre os ângulos fotografados e passe o mouse para ampliar detalhes.
              </p>
            </div>
          )}
        </div>

        {/* INFORMAÇÕES */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadgeFor product={product} />
            {product.isNew && <span className="text-[11px] font-semibold uppercase tracking-[.16em] text-brass">Novidade</span>}
            <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-tobacco">
              <Eye className="h-3.5 w-3.5" /> {product.views.toLocaleString('pt-BR')} visualizações
            </span>
          </div>
          <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-[.2em] text-tobacco">{product.era}</p>
          <h1 className="mt-1 font-serif text-[2.3rem] leading-[1.02] text-walnut sm:text-[2.9rem]">{product.name}</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-tobacco">{product.shortDescription}</p>
          <div className="mt-6">
            <Price value={product.price} compareAt={product.compareAtPrice} className="text-[1.9rem] [&>span:first-child]:font-serif [&>span:first-child]:font-medium" />
            <p className="text-[13px] text-tobacco">{installments(product.price)}</p>
          </div>
          <div className="mt-6 space-y-3">
            <AddToCartButton product={product} size="lg" block />
            {product.status === 'disponivel' && (
              <p className="flex items-center gap-2 text-[12.5px] text-tobacco">
                <Clock className="h-3.5 w-3.5 text-brass" /> Peça única: ao adicionar, ela fica reservada para você por 15 minutos.
              </p>
            )}
            {mine && product.status === 'reservado' && <p className="text-[13px] text-tobacco">Esta peça está reservada para você. Finalize a compra antes que a reserva expire.</p>}
            {!mine && product.status === 'reservado' && <p className="text-[13px] text-tobacco">Outro cliente está finalizando a compra. Se a reserva expirar, a peça volta a ficar disponível automaticamente.</p>}
            {inPanorama && (
              <Link to={`/ambientes/${inPanorama.id}`} className="flex items-center gap-2 rounded-xl border border-sand px-4 py-3 text-[13.5px] text-walnut transition hover:border-walnut">
                <Compass className="h-4 w-4 text-brass" /> Veja esta peça no ambiente <strong className="font-semibold">{inPanorama.name}</strong> em 360°
              </Link>
            )}
          </div>

          <dl className="mt-8 divide-y divide-sand/70 border-y border-sand/70">
            {specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[150px_1fr] gap-3 py-3 text-[14px]">
                <dt className="text-tobacco">{k}</dt>
                <dd className="text-walnut">{v}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[150px_1fr] gap-3 py-3 text-[14px]">
              <dt className="text-tobacco">Disponibilidade</dt>
              <dd className="text-walnut">{product.status === 'disponivel' ? 'Pronta para envio · 1 unidade' : product.status === 'reservado' ? (mine ? 'Reservada para você' : 'Reservada temporariamente') : product.status === 'vendido' ? 'Vendida' : 'Indisponível'}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-2xl bg-cream-200/60 p-5">
            <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[.16em] text-oxblood">
              <Ruler className="h-3.5 w-3.5" /> Observações sobre desgastes
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-walnut">{product.wearNotes}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-[12.5px] text-tobacco">
            <p className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-sage" /> Autenticidade e procedência documentadas</p>
            <p className="flex items-start gap-2"><Truck className="h-4 w-4 shrink-0 text-sage" /> Entrega especializada (simulação de frete no carrinho)</p>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div>
          <h2 className="font-serif text-3xl text-walnut">Sobre a peça</h2>
          <p className="mt-4 whitespace-pre-line text-[16px] leading-[1.8] text-walnut/90">{product.description}</p>
        </div>
      </section>

      {related && related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-serif text-3xl text-walnut">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
