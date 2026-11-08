import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Box, List, X } from 'lucide-react';
import clsx from 'clsx';
import type { Panorama, Product } from '@/types/domain';
import { PanoramaViewer, type PanoMarker } from '@/viewers';
import { Img, Price } from '@/design-system';
import { AddToCartButton, StatusBadgeFor } from './product/ProductCard';
import { dims, productStatusLabel } from '@/utils/format';

export function PanoramaExplorer({ panorama, products, panoramas, onNavigate, height = 'h-[62vh] min-h-[420px] lg:h-[74vh]' }: { panorama: Panorama; products: Product[]; panoramas: Panorama[]; onNavigate: (id: string) => void; height?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ yaw: number; pitch: number; key: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const spots = panorama.hotspots.filter((h) => byId.has(h.productId));
  const markers: PanoMarker[] = [
    ...spots.map((h) => {
      const p = byId.get(h.productId)!;
      return { id: h.id, yaw: h.yaw, pitch: h.pitch, kind: 'product' as const, label: p.name, sublabel: p.status === 'disponivel' ? undefined : productStatusLabel[p.status], dimmed: p.status === 'vendido' };
    }),
    ...panorama.navPoints.map((n) => ({ id: n.id, yaw: n.yaw, pitch: n.pitch, kind: 'nav' as const, label: n.label })),
  ];
  const activeSpot = spots.find((h) => h.id === active);
  const activeProduct = activeSpot ? byId.get(activeSpot.productId) : undefined;

  const select = (hotspotId: string) => {
    const h = spots.find((x) => x.id === hotspotId);
    if (!h) return;
    setActive(hotspotId);
    setFocus({ yaw: h.yaw, pitch: h.pitch, key: Date.now() });
    setListOpen(false);
  };

  const list = (
    <ul className="divide-y divide-sand/60">
      {spots.map((h) => {
        const p = byId.get(h.productId)!;
        return (
          <li key={h.id}>
            <button onClick={() => select(h.id)} className={clsx('flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-walnut/5', active === h.id && 'bg-brass/10')}>
              <Img src={p.photos[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[1.05rem] leading-tight text-walnut">{p.name}</span>
                <span className="mt-0.5 flex items-center gap-2 text-[12.5px]">
                  <Price value={p.price} />
                  {p.status !== 'disponivel' && <StatusBadgeFor product={p} />}
                </span>
              </span>
              {p.model3d && <Box className="h-4 w-4 shrink-0 text-tobacco" aria-label="Com 3D" />}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="grid gap-0 overflow-hidden rounded-3xl border border-sand/60 bg-cream-50 shadow-soft lg:grid-cols-[1fr_340px]">
      <PanoramaViewer
        key={panorama.id}
        image={panorama.image}
        imageMobile={panorama.imageMobile}
        initialYaw={panorama.initialYaw}
        markers={markers}
        activeMarkerId={active}
        focus={focus}
        className={height}
        onMarkerClick={(m) => {
          if (m.kind === 'nav') {
            const n = panorama.navPoints.find((x) => x.id === m.id);
            if (n) onNavigate(n.targetPanoramaId);
          } else select(m.id);
        }}
      >
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-espresso/65 px-3 py-1.5 font-serif text-[15px] text-cream backdrop-blur">{panorama.name}</span>
          <span className="rounded-full bg-cream/85 px-2.5 py-1 text-[11px] font-semibold text-walnut">{spots.length} peças neste ambiente</span>
        </div>
        <button onClick={() => setListOpen(true)} onPointerDown={(e) => e.stopPropagation()} className="absolute bottom-3 left-3 z-[55] inline-flex items-center gap-2 rounded-full bg-cream-50/95 px-4 py-2.5 text-sm font-semibold text-walnut shadow-lift lg:hidden">
          <List className="h-4 w-4" /> Peças ({spots.length})
        </button>
        {activeProduct && (
          <div onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} className="absolute inset-x-3 bottom-3 z-[60] animate-fadeUp rounded-2xl bg-cream-50/95 p-3 shadow-lift backdrop-blur sm:inset-x-auto sm:left-3 sm:w-[380px] sm:p-4">
            <button onClick={() => setActive(null)} aria-label="Fechar ficha" className="absolute right-2 top-2 rounded-full p-1.5 text-tobacco hover:bg-walnut/5">
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-3">
              <Img src={activeProduct.photos[0]} alt={activeProduct.name} className="h-24 w-24 shrink-0 rounded-xl" />
              <div className="min-w-0 pr-6">
                <p className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-tobacco">{activeProduct.era}</p>
                <h3 className="font-serif text-xl leading-tight text-walnut">{activeProduct.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Price value={activeProduct.price} compareAt={activeProduct.compareAtPrice} />
                  <StatusBadgeFor product={activeProduct} />
                </div>
                <p className="mt-1 text-[12px] text-tobacco">{dims(activeProduct.dimensions)} · {activeProduct.material}</p>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] text-tobacco">{activeProduct.shortDescription}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to={`/produto/${activeProduct.slug}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-walnut/30 text-[13px] font-medium text-walnut hover:bg-walnut/5">
                Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <AddToCartButton product={activeProduct} size="sm" />
            </div>
          </div>
        )}
      </PanoramaViewer>

      <aside className="hidden max-h-[74vh] flex-col border-l border-sand/60 lg:flex">
        <div className="border-b border-sand/60 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-brass">Neste ambiente</p>
          <p className="mt-1 text-[13px] text-tobacco">Toque em uma peça para localizá-la no panorama.</p>
        </div>
        <div className="flex-1 overflow-y-auto">{list}</div>
        {panorama.navPoints.length > 0 && (
          <div className="border-t border-sand/60 p-3">
            <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-tobacco">Outros ambientes</p>
            <div className="flex flex-wrap gap-2">
              {panoramas.filter((p) => p.id !== panorama.id).map((p) => (
                <button key={p.id} onClick={() => onNavigate(p.id)} className="rounded-full border border-sand px-3 py-1.5 text-[12.5px] text-walnut hover:border-walnut">
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {listOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Peças neste ambiente">
          <div className="absolute inset-0 bg-espresso/45" onClick={() => setListOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] animate-fadeUp overflow-y-auto rounded-t-3xl bg-cream-50 pb-6">
            <div className="sticky top-0 flex items-center justify-between border-b border-sand/60 bg-cream-50 px-4 py-3">
              <span className="font-serif text-xl text-walnut">Peças neste ambiente</span>
              <button onClick={() => setListOpen(false)} aria-label="Fechar" className="rounded-full p-2 text-walnut">
                <X className="h-5 w-5" />
              </button>
            </div>
            {list}
          </div>
        </div>
      )}
    </div>
  );
}
