import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Gem, Hammer, ScrollText, Truck } from 'lucide-react';
import { services } from '@/services';
import { useQuery, useDocumentTitle } from '@/hooks/useQuery';
import { useRecent } from '@/store/recent';
import { Button, Img, SectionHeading } from '@/design-system';
import { ProductCard, ProductGridSkeleton } from '@/components/product/ProductCard';
import { assetUrl } from '@/utils/assets';
import { brl, date } from '@/utils/format';

export function HomePage() {
  useDocumentTitle('Antiquário & Brechó');
  const { data: products } = useQuery(() => services.products.list({ sort: 'populares' }), []);
  const { data: categories } = useQuery(() => services.categories.list(), []);
  const { data: panoramas } = useQuery(() => services.panoramas.list(), []);
  const { data: articles } = useQuery(() => services.articles.list({ publicOnly: true }), []);
  const recentIds = useRecent((s) => s.ids);
  const catName = (id: string) => categories?.find((c) => c.id === id)?.name;

  const available = (products ?? []).filter((p) => p.status !== 'vendido');
  const featured = available.filter((p) => p.featured).slice(0, 8);
  const news = [...available].filter((p) => p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const heroProduct = products?.find((p) => p.id === 'poltrona-bergere-veludo-mostarda');

  // recomendações: mesmas categorias das peças vistas recentemente; sem histórico, as mais procuradas
  const recentCats = new Set(recentIds.map((id) => products?.find((p) => p.id === id)?.categoryId).filter(Boolean));
  const recommendations = (recentCats.size ? available.filter((p) => recentCats.has(p.categoryId) && !recentIds.includes(p.id)) : available).slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[78vh] min-h-[540px] max-h-[860px] overflow-hidden bg-walnut-800">
          <img src={assetUrl('assets/scenes/sala-hero.jpg')} alt="Sala de estar com poltronas restauradas, relógio carrilhão e espelho dourado" className="absolute inset-0 h-full w-full animate-fadeIn object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-espresso/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/60 via-transparent to-transparent" />
          <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-4 pb-14 sm:px-6 lg:px-10 lg:pb-20">
            <p className="mb-4 animate-fadeUp text-[11.5px] font-semibold uppercase tracking-[.3em] text-brass-light">Acervo de inverno · {available.filter((p) => p.status === 'disponivel').length} peças disponíveis</p>
            <h1 className="max-w-3xl animate-fadeUp font-serif text-[2.9rem] font-medium leading-[0.98] text-cream [animation-delay:.08s] sm:text-[4.2rem] lg:text-[5.4rem]">
              Peças com passado
              <br />
              <em className="font-normal text-brass-light">para casas com alma.</em>
            </h1>
            <p className="mt-5 max-w-xl animate-fadeUp text-[15.5px] leading-relaxed text-cream/85 [animation-delay:.16s]">Móveis, objetos e relíquias selecionados, restaurados com respeito e apresentados em ambientes que você pode explorar em 360°.</p>
            <div className="mt-8 flex animate-fadeUp flex-wrap gap-3 [animation-delay:.24s]">
              <Link to="/categoria/sala-de-estar">
                <Button variant="brass" size="lg" icon={<Compass className="h-4 w-4" />}>
                  Entrar na sala em 360°
                </Button>
              </Link>
              <Link to="/loja">
                <Button size="lg" variant="secondary" className="border-cream/40 !text-cream hover:!bg-cream/10">
                  Ver o acervo
                </Button>
              </Link>
            </div>
          </div>
          {heroProduct && (
            <Link to={`/produto/${heroProduct.slug}`} className="absolute bottom-10 right-10 hidden w-72 animate-fadeUp items-center gap-3 rounded-2xl bg-cream-50/90 p-3 shadow-lift backdrop-blur transition hover:-translate-y-0.5 [animation-delay:.4s] lg:flex">
              <Img src={heroProduct.photos[0]} alt="" className="h-16 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-brass">Em destaque na cena</p>
                <p className="truncate font-serif text-lg leading-tight text-walnut">{heroProduct.name}</p>
                <p className="text-sm font-semibold text-walnut">{brl(heroProduct.price)}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* PILARES */}
      <section className="border-b border-sand/60 bg-cream-50">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-10">
          {[
            { i: <Gem className="h-5 w-5" />, t: 'Curadoria autoral', d: 'Cada peça é avaliada, fotografada e documentada.' },
            { i: <Hammer className="h-5 w-5" />, t: 'Restauro responsável', d: 'Intervenções mínimas que preservam a história.' },
            { i: <ScrollText className="h-5 w-5" />, t: 'Procedência informada', d: 'Época, fabricante e origem sempre que possível.' },
            { i: <Truck className="h-5 w-5" />, t: 'Entrega especializada', d: 'Embalagem para móveis e objetos frágeis.' },
          ].map((x) => (
            <div key={x.t} className="flex gap-3">
              <span className="mt-0.5 text-brass">{x.i}</span>
              <div>
                <p className="font-serif text-lg leading-tight text-walnut">{x.t}</p>
                <p className="mt-1 text-[13px] leading-snug text-tobacco">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* APRESENTAÇÃO */}
      <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-28">
        <div className="relative">
          <Img src="assets/scenes/sala-sobre.jpg" alt="Ambiente da Casa Âmbar" className="aspect-[4/3.2] rounded-3xl shadow-lift" />
          <div className="absolute -bottom-6 -right-2 rounded-2xl bg-walnut px-6 py-5 text-cream shadow-lift sm:-right-6">
            <p className="font-serif text-4xl text-brass-light">1987</p>
            <p className="text-[11px] uppercase tracking-[.2em] text-cream/70">desde (história fictícia)</p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[.22em] text-brass">A casa</p>
          <h2 className="font-serif text-[2.4rem] leading-[1.02] text-walnut sm:text-[3.1rem]">Um antiquário contemporâneo, aberto 24 horas por dia.</h2>
          <p className="mt-6 text-[16px] leading-relaxed text-tobacco">A Casa Âmbar nasceu do encontro entre uma família de marceneiros e a paixão por objetos que atravessam gerações. Hoje, o ateliê se estende ao digital: você percorre nossos ambientes, examina cada peça em três dimensões e conhece sua procedência antes de levá-la para casa.</p>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-sand pt-6">
            <div>
              <dt className="text-[11px] uppercase tracking-[.16em] text-tobacco">Peças no acervo</dt>
              <dd className="font-serif text-3xl text-walnut">{products?.length ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[.16em] text-tobacco">Ambientes 360°</dt>
              <dd className="font-serif text-3xl text-walnut">{panoramas?.length ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[.16em] text-tobacco">Com modelo 3D</dt>
              <dd className="font-serif text-3xl text-walnut">{products?.filter((p) => p.model3d).length ?? '—'}</dd>
            </div>
          </dl>
          <Link to="/quem-somos" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-walnut underline decoration-brass underline-offset-4">
            Conheça nossa história <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Seleção da curadoria"
          title="Peças em destaque"
          action={
            <Link to="/loja" className="inline-flex items-center gap-2 text-sm font-semibold text-walnut hover:underline">
              Ver todo o acervo <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          Escolhidas pela história que carregam e pelo cuidado com que foram preservadas.
        </SectionHeading>
        {products ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} categoryName={catName(p.categoryId)} priority={i < 4} />
            ))}
          </div>
        ) : (
          <ProductGridSkeleton />
        )}
      </section>

      {/* AMBIENTES */}
      <section className="mt-24 bg-walnut-800 py-20 text-cream lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.22em] text-brass-light">Experiência imersiva</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.05] sm:text-[2.9rem]">Caminhe pelos nossos ambientes</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-cream/70">Gire a câmera, aproxime-se e toque nos pontos luminosos para conhecer cada peça no lugar onde ela ganha vida.</p>
            </div>
            <Link to="/ambientes" className="inline-flex items-center gap-2 text-sm font-semibold text-brass-light hover:underline">
              Todos os ambientes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {(panoramas ?? []).map((p, i) => (
              <Link key={p.id} to={`/ambientes/${p.id}`} className={`group relative block overflow-hidden rounded-3xl ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                <Img src={p.cover} alt={p.name} className={`${i === 0 ? 'aspect-[4/3] md:aspect-auto md:h-full' : 'aspect-[4/3]'} transition-transform duration-700 group-hover:scale-105`} />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-cream/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[.16em] backdrop-blur">
                    <Compass className="h-3 w-3" /> 360° · {p.hotspots.length} peças
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl">{p.name}</h3>
                  <p className="mt-1 max-w-md text-sm text-cream/75">{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHeading eyebrow="Explore por ambiente" title="Categorias" />
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {(categories ?? []).map((c, i) => (
            <Link key={c.id} to={`/categoria/${c.slug}`} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <Img src={c.image} alt={c.name} className={`${i === 0 ? 'aspect-square' : 'aspect-[4/5]'} transition-transform duration-700 group-hover:scale-105`} />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-cream sm:p-5">
                <h3 className={`font-serif ${i === 0 ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>{c.name}</h3>
                <p className="mt-0.5 text-[12.5px] text-cream/75">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NOVIDADES */}
      {news.length > 0 && (
        <section className="bg-cream-200/60 py-20">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
            <SectionHeading eyebrow="Acabaram de chegar" title="Novidades no acervo">
              Peças recém-catalogadas, ainda com cheiro de ateliê.
            </SectionHeading>
            <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
              {news.map((p) => (
                <ProductCard key={p.id} product={p} categoryName={catName(p.categoryId)} className="w-[68vw] shrink-0 snap-start sm:w-[300px]" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECOMENDAÇÕES */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10">
        <SectionHeading eyebrow={recentCats.size ? 'Com base no que você viu' : 'Mais procuradas'} title="Recomendações para você" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {recommendations.map((p) => (
            <ProductCard key={p.id} product={p} categoryName={catName(p.categoryId)} />
          ))}
        </div>
      </section>

      {/* EDITORIAL */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Diário do antiquário"
          title="Conteúdo editorial"
          action={
            <Link to="/editorial" className="inline-flex items-center gap-2 text-sm font-semibold text-walnut hover:underline">
              Ler todos <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-8 md:grid-cols-3">
          {(articles ?? []).slice(0, 3).map((a) => (
            <Link key={a.id} to={`/editorial/${a.slug}`} className="group">
              <Img src={a.cover} alt={a.title} className="aspect-[4/3] rounded-2xl transition group-hover:opacity-90" />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.18em] text-tobacco">
                {date(a.publishAt)} · {a.author}
              </p>
              <h3 className="mt-1.5 font-serif text-2xl leading-tight text-walnut group-hover:underline group-hover:decoration-brass/50 group-hover:underline-offset-4">{a.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-tobacco">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
