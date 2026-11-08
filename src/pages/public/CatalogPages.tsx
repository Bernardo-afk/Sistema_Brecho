import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Compass, SlidersHorizontal, X, Search } from 'lucide-react';
import { services } from '@/services';
import type { ProductFilters } from '@/services';
import { useDocumentTitle, useQuery } from '@/hooks/useQuery';
import { Breadcrumbs, Button, Drawer, EmptyState, Img, Select, Spinner } from '@/design-system';
import { ProductCard, ProductGridSkeleton } from '@/components/product/ProductCard';
import { PanoramaExplorer } from '@/components/PanoramaExplorer';
import { conservationLabel } from '@/utils/format';
import type { Conservation } from '@/types/domain';
import { NotFoundPage } from './InstitutionalPages';

const PRICE_RANGES = [
  { v: '', l: 'Qualquer preço' },
  { v: '0-1000', l: 'Até R$ 1.000' },
  { v: '1000-3000', l: 'R$ 1.000 a R$ 3.000' },
  { v: '3000-6000', l: 'R$ 3.000 a R$ 6.000' },
  { v: '6000-999999', l: 'Acima de R$ 6.000' },
];

function useFiltersFromUrl(base: ProductFilters = {}) {
  const [sp, setSp] = useSearchParams();
  const price = sp.get('preco') ?? '';
  const [min, max] = price ? price.split('-').map(Number) : [undefined, undefined];
  const filters: ProductFilters = {
    ...base,
    search: sp.get('q') ?? undefined,
    categoryId: base.categoryId ?? (sp.get('categoria') || undefined),
    era: sp.get('epoca') || undefined,
    conservation: sp.get('estado') || undefined,
    status: (sp.get('status') as ProductFilters['status']) || 'ativos',
    sort: (sp.get('ordem') as ProductFilters['sort']) || 'recentes',
    minPrice: min,
    maxPrice: max,
  };
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  const clear = () => setSp(new URLSearchParams(sp.get('q') ? { q: sp.get('q')! } : {}), { replace: true });
  return { filters, set, clear, sp, price };
}

function FilterPanel({ f, eras, showCategory }: { f: ReturnType<typeof useFiltersFromUrl>; eras: string[]; showCategory: boolean }) {
  const { data: categories } = useQuery(() => services.categories.list(), []);
  return (
    <div className="space-y-5">
      {showCategory && (
        <label className="block">
          <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[.12em] text-tobacco">Categoria</span>
          <Select value={f.sp.get('categoria') ?? ''} onChange={(e) => f.set('categoria', e.target.value)}>
            <option value="">Todas</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[.12em] text-tobacco">Preço</span>
        <Select value={f.price} onChange={(e) => f.set('preco', e.target.value)}>
          {PRICE_RANGES.map((r) => (
            <option key={r.v} value={r.v}>
              {r.l}
            </option>
          ))}
        </Select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[.12em] text-tobacco">Época</span>
        <Select value={f.sp.get('epoca') ?? ''} onChange={(e) => f.set('epoca', e.target.value)}>
          <option value="">Todas as épocas</option>
          {eras.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </Select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[.12em] text-tobacco">Estado de conservação</span>
        <Select value={f.sp.get('estado') ?? ''} onChange={(e) => f.set('estado', e.target.value)}>
          <option value="">Todos</option>
          {(Object.keys(conservationLabel) as Conservation[]).map((k) => (
            <option key={k} value={k}>
              {conservationLabel[k]}
            </option>
          ))}
        </Select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[.12em] text-tobacco">Disponibilidade</span>
        <Select value={f.sp.get('status') ?? ''} onChange={(e) => f.set('status', e.target.value)}>
          <option value="">Disponíveis, reservadas e vendidas</option>
          <option value="disponivel">Somente disponíveis</option>
          <option value="reservado">Reservadas</option>
          <option value="vendido">Vendidas</option>
        </Select>
      </label>
      <Button variant="link" onClick={f.clear}>
        Limpar filtros
      </Button>
    </div>
  );
}

function ProductResults({ base, showCategory }: { base?: ProductFilters; showCategory?: boolean }) {
  const f = useFiltersFromUrl(base);
  const [drawer, setDrawer] = useState(false);
  const { data, loading } = useQuery(() => services.products.list(f.filters), [f.filters]);
  const { data: all } = useQuery(() => services.products.list({ status: 'todos' }), []);
  const { data: categories } = useQuery(() => services.categories.list(), []);
  const eras = useMemo(() => [...new Set((all ?? []).map((p) => p.era))].sort(), [all]);
  const activeCount = ['categoria', 'preco', 'epoca', 'estado', 'status'].filter((k) => f.sp.get(k) && !(k === 'categoria' && base?.categoryId)).length;

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-4 font-serif text-xl text-walnut">Refinar</p>
          <FilterPanel f={f} eras={eras} showCategory={!!showCategory} />
        </div>
      </aside>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-tobacco" aria-live="polite">
            {loading ? 'Buscando…' : `${data?.length ?? 0} ${data?.length === 1 ? 'peça encontrada' : 'peças encontradas'}`}
            {f.filters.search && (
              <>
                {' '}
                para <strong className="text-walnut">“{f.filters.search}”</strong>{' '}
                <button onClick={() => f.set('q', '')} className="ml-1 inline-flex items-center text-oxblood" aria-label="Limpar busca">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="lg:hidden" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setDrawer(true)}>
              Filtros {activeCount > 0 && `(${activeCount})`}
            </Button>
            <Select aria-label="Ordenar" value={f.sp.get('ordem') ?? 'recentes'} onChange={(e) => f.set('ordem', e.target.value)} className="!h-9 w-auto !text-[13px]">
              <option value="recentes">Mais recentes</option>
              <option value="populares">Mais procuradas</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
              <option value="nome">Nome (A–Z)</option>
            </Select>
          </div>
        </div>
        {loading && !data ? (
          <ProductGridSkeleton n={6} />
        ) : data && data.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
            {data.map((p, i) => (
              <ProductCard key={p.id} product={p} categoryName={categories?.find((c) => c.id === p.categoryId)?.name} priority={i < 3} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Search className="h-6 w-6" />} title="Nenhuma peça encontrada" action={<Button variant="secondary" onClick={f.clear}>Limpar filtros</Button>}>
            Tente outros termos ou remova alguns filtros. Nosso acervo muda toda semana.
          </EmptyState>
        )}
      </div>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filtros" side="right" footer={<Button block onClick={() => setDrawer(false)}>Ver {data?.length ?? 0} peças</Button>}>
        <div className="p-5">
          <FilterPanel f={f} eras={eras} showCategory={!!showCategory} />
        </div>
      </Drawer>
    </div>
  );
}

export function CatalogPage() {
  useDocumentTitle('Acervo');
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Acervo' }]} />
      <h1 className="mb-10 mt-4 font-serif text-[2.6rem] leading-none text-walnut sm:text-[3.4rem]">Todo o acervo</h1>
      <ProductResults showCategory />
    </div>
  );
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const nav = useNavigate();
  const { data: category, loading } = useQuery(() => services.categories.get(slug), [slug]);
  const { data: panoramas } = useQuery(() => services.panoramas.list(), []);
  const { data: products } = useQuery(() => services.products.list({ status: 'todos' }), []);
  useDocumentTitle(category?.name);
  if (loading && !category) return <Spinner />;
  if (!category) return <NotFoundPage />;
  const pano = panoramas?.find((p) => p.id === category.panoramaId);
  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Categorias', to: '/loja' }, { label: category.name }]} />
        <div className="mt-4 grid items-end gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.22em] text-brass">{category.tagline}</p>
            <h1 className="font-serif text-[2.8rem] leading-none text-walnut sm:text-[4rem]">{category.name}</h1>
          </div>
          <p className="text-[15px] leading-relaxed text-tobacco">{category.description}</p>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {pano && products ? (
          <>
            <div className="mb-3 flex items-center gap-2 text-sm text-tobacco">
              <Compass className="h-4 w-4 text-brass" /> Ambiente panorâmico desta categoria: arraste para explorar e toque nos pontos.
            </div>
            <PanoramaExplorer panorama={pano} products={products} panoramas={panoramas ?? []} onNavigate={(id) => nav(`/ambientes/${id}`)} />
          </>
        ) : (
          <div className="relative overflow-hidden rounded-3xl">
            <Img src={category.image} alt={category.name} className="aspect-[16/7] max-h-[440px] w-full" eager />
            <div className="absolute inset-0 bg-gradient-to-r from-espresso/70 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-end p-6 text-cream sm:p-10">
              <p className="font-serif text-2xl italic sm:text-3xl">“Cada peça guarda uma casa inteira dentro dela.”</p>
              <Link to="/ambientes" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brass-light hover:underline">
                <Compass className="h-4 w-4" /> Explore nossos ambientes em 360°
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <h2 className="mb-8 font-serif text-3xl text-walnut">Peças de {category.name.toLowerCase()}</h2>
        <ProductResults base={{ categoryId: category.id }} />
      </section>
    </div>
  );
}

export function AmbientesPage() {
  useDocumentTitle('Ambientes 360°');
  const { data: panoramas } = useQuery(() => services.panoramas.list(), []);
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Ambientes 360°' }]} />
      <h1 className="mt-4 font-serif text-[2.6rem] leading-none text-walnut sm:text-[3.4rem]">Ambientes em 360°</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-tobacco">Cenários montados pela curadoria com peças reais do acervo. Gire, aproxime e toque nos pontos para ver detalhes, preços e disponibilidade.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {(panoramas ?? []).map((p) => (
          <Link key={p.id} to={`/ambientes/${p.id}`} className="group">
            <Img src={p.cover} alt={p.name} className="aspect-[4/3] rounded-2xl transition group-hover:opacity-90" />
            <h2 className="mt-4 font-serif text-2xl text-walnut group-hover:underline">{p.name}</h2>
            <p className="mt-1 text-sm text-tobacco">{p.description}</p>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-[.14em] text-brass">{p.hotspots.length} peças · entrar no ambiente →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AmbientePage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data: panoramas, loading } = useQuery(() => services.panoramas.list(), []);
  const { data: products } = useQuery(() => services.products.list({ status: 'todos' }), []);
  const pano = panoramas?.find((p) => p.id === id);
  useDocumentTitle(pano?.name);
  if (loading && !panoramas) return <Spinner />;
  if (!pano) return <NotFoundPage />;
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Ambientes 360°', to: '/ambientes' }, { label: pano.name }]} />
      <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[2.4rem] leading-none text-walnut sm:text-[3rem]">{pano.name}</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-tobacco">{pano.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {panoramas!.filter((p) => p.id !== pano.id).map((p) => (
            <Button key={p.id} variant="secondary" size="sm" onClick={() => nav(`/ambientes/${p.id}`)}>
              {p.name}
            </Button>
          ))}
        </div>
      </div>
      {products ? <PanoramaExplorer panorama={pano} products={products} panoramas={panoramas!} onNavigate={(t) => nav(`/ambientes/${t}`)} /> : <Spinner />}
    </div>
  );
}
