import { Link, useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { services } from '@/services';
import { useDocumentTitle, useQuery } from '@/hooks/useQuery';
import { Breadcrumbs, Button, DemoNotice, Img, Spinner } from '@/design-system';
import { date } from '@/utils/format';

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada');
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-serif text-[6rem] leading-none text-brass">404</p>
      <h1 className="mt-2 font-serif text-3xl text-walnut">Esta peça não está no acervo</h1>
      <p className="mt-3 text-tobacco">A página pode ter sido removida, vendida ou o endereço está incorreto.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/"><Button>Voltar ao início</Button></Link>
        <Link to="/loja"><Button variant="secondary">Ver o acervo</Button></Link>
      </div>
    </div>
  );
}

function Prose({ title, crumbs, children }: { title: string; crumbs: string; children: React.ReactNode }) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: crumbs }]} />
      <h1 className="mb-8 mt-4 font-serif text-[2.6rem] leading-none text-walnut sm:text-[3.2rem]">{title}</h1>
      <div className="space-y-5 text-[16px] leading-[1.8] text-walnut/90 [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-walnut">{children}</div>
    </div>
  );
}

export function AboutPage() {
  useDocumentTitle('Quem somos');
  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Quem somos' }]} />
        <div className="mt-6 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[.22em] text-brass">Quem somos</p>
            <h1 className="font-serif text-[2.8rem] leading-[1.02] text-walnut sm:text-[3.8rem]">Três gerações cuidando do que merece ficar.</h1>
            <p className="mt-6 text-[16px] leading-relaxed text-tobacco">A Casa Âmbar é uma marca fictícia criada para esta demonstração. Sua história ilustra o tom de voz pensado para o projeto: uma família de marceneiros que transformou a oficina em antiquário e passou a buscar, restaurar e documentar peças com passado.</p>
            <p className="mt-4 text-[16px] leading-relaxed text-tobacco">Nosso compromisso é a transparência: cada peça traz medidas, materiais, época, procedência e, principalmente, as marcas do tempo que ela carrega. Nada de retoques escondidos.</p>
            <Link to="/ambientes" className="mt-8 inline-block"><Button icon={<Compass className="h-4 w-4" />}>Visite nossos ambientes</Button></Link>
          </div>
          <Img src="assets/scenes/escritorio-detalhe.jpg" alt="Detalhe de escrivaninha com luminária de banqueiro" className="aspect-[4/5] rounded-3xl shadow-lift" />
        </div>
      </section>
      <section className="mx-auto mt-20 grid max-w-[1400px] gap-8 px-4 sm:px-6 md:grid-cols-3 lg:px-10">
        {[
          ['Busca', 'Visitamos casas, fazendas e espólios em busca de peças com qualidade construtiva e boa história.'],
          ['Restauro', 'Intervimos o mínimo necessário, com técnicas reversíveis e materiais compatíveis com a época.'],
          ['Documentação', 'Fotografamos, medimos, digitalizamos em 3D e registramos a procedência de cada peça.'],
        ].map(([t, d], i) => (
          <div key={t} className="border-t border-sand pt-6">
            <p className="font-serif text-5xl text-brass/70">0{i + 1}</p>
            <h2 className="mt-3 font-serif text-2xl text-walnut">{t}</h2>
            <p className="mt-2 text-[15px] text-tobacco">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function TermsPage() {
  return (
    <Prose title="Termos de uso" crumbs="Termos de uso">
      <DemoNotice title="Texto demonstrativo">Este conteúdo é um modelo ilustrativo para o protótipo e não tem validade jurídica. A versão definitiva deve ser redigida e revisada por assessoria jurídica.</DemoNotice>
      <h2>1. Sobre a plataforma</h2>
      <p>A Casa Âmbar apresenta peças únicas de antiquário e brechó. As fotografias, modelos 3D e ambientes panorâmicos têm finalidade ilustrativa; pequenas variações de cor podem ocorrer conforme a tela utilizada.</p>
      <h2>2. Reservas e peças únicas</h2>
      <p>Cada peça possui uma única unidade. Ao adicioná-la ao carrinho, ela fica reservada por 15 minutos. Encerrado o prazo sem pagamento, a peça volta a ficar disponível.</p>
      <h2>3. Pagamentos e entregas</h2>
      <p>Na versão definitiva, pagamentos serão processados por instituição autorizada e as entregas, por transportadoras parceiras. Neste protótipo, todos esses processos são simulados.</p>
      <h2>4. Trocas e devoluções</h2>
      <p>O consumidor poderá exercer o direito de arrependimento em até 7 dias após o recebimento, conforme o Código de Defesa do Consumidor, com a peça nas mesmas condições em que foi entregue.</p>
    </Prose>
  );
}

export function PrivacyPage() {
  return (
    <Prose title="Política de privacidade" crumbs="Política de privacidade">
      <DemoNotice title="Como o protótipo trata dados">Nenhum dado sai do seu navegador. Informações digitadas no checkout ficam no armazenamento local (localStorage/IndexedDB) e são apagadas ao restaurar a demonstração. Não informe dados pessoais reais.</DemoNotice>
      <h2>Dados coletados (versão definitiva)</h2>
      <p>Nome, e-mail, telefone, CPF e endereço para emissão de nota fiscal e entrega; histórico de pedidos; dados de navegação para melhoria da experiência.</p>
      <h2>Finalidade e base legal</h2>
      <p>Os dados serão tratados para execução do contrato de compra e venda, cumprimento de obrigações legais e, mediante consentimento, comunicações de marketing, conforme a LGPD (Lei 13.709/2018).</p>
      <h2>Direitos do titular</h2>
      <p>Acesso, correção, portabilidade e exclusão dos dados poderão ser solicitados pelo canal de atendimento a ser definido na versão definitiva.</p>
    </Prose>
  );
}

export function JournalPage() {
  useDocumentTitle('Conteúdo editorial');
  const { data: articles, loading } = useQuery(() => services.articles.list({ publicOnly: true }), []);
  if (loading && !articles) return <Spinner />;
  const [first, ...rest] = articles ?? [];
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Conteúdo editorial' }]} />
      <h1 className="mb-10 mt-4 font-serif text-[2.6rem] leading-none text-walnut sm:text-[3.4rem]">Diário do antiquário</h1>
      {first && (
        <Link to={`/editorial/${first.slug}`} className="group grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Img src={first.cover} alt={first.title} className="aspect-[16/10] rounded-3xl" eager />
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[.18em] text-tobacco">{date(first.publishAt)} · {first.author}</p>
            <h2 className="mt-2 font-serif text-[2.2rem] leading-tight text-walnut group-hover:underline group-hover:decoration-brass/50">{first.title}</h2>
            <p className="mt-3 text-[16px] text-tobacco">{first.excerpt}</p>
          </div>
        </Link>
      )}
      <div className="mt-16 grid gap-10 md:grid-cols-3">
        {rest.map((a) => (
          <Link key={a.id} to={`/editorial/${a.slug}`} className="group">
            <Img src={a.cover} alt={a.title} className="aspect-[4/3] rounded-2xl" />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.18em] text-tobacco">{date(a.publishAt)}</p>
            <h3 className="mt-1 font-serif text-2xl leading-tight text-walnut group-hover:underline">{a.title}</h3>
            <p className="mt-2 text-sm text-tobacco">{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ArticlePage() {
  const { slug = '' } = useParams();
  const { data: a, loading } = useQuery(() => services.articles.get(slug), [slug]);
  useDocumentTitle(a?.seoTitle?.replace(' | Casa Âmbar', '') ?? a?.title);
  if (loading && !a) return <Spinner />;
  if (!a || (a.status !== 'publicado' && new Date(a.publishAt) > new Date()) || a.status === 'rascunho') return <NotFoundPage />;
  return (
    <article className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Editorial', to: '/editorial' }, { label: a.title }]} />
      <p className="mt-8 text-[11.5px] font-semibold uppercase tracking-[.18em] text-brass">{date(a.publishAt)} · por {a.author}</p>
      <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.04] text-walnut sm:text-[3.4rem]">{a.title}</h1>
      <p className="mt-4 font-serif text-xl italic text-tobacco">{a.excerpt}</p>
      <Img src={a.cover} alt={a.title} className="mt-10 aspect-[16/10] rounded-3xl" eager />
      <div className="mt-10 space-y-6 text-[17px] leading-[1.85] text-walnut/90 first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.9] first-letter:text-brass">
        {a.body.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="mt-10 flex flex-wrap gap-2">{a.tags.map((t) => <span key={t} className="rounded-full bg-cream-200 px-3 py-1 text-[12px] text-walnut">#{t}</span>)}</div>
      <div className="mt-12 border-t border-sand pt-8"><Link to="/editorial" className="text-sm font-semibold text-walnut hover:underline">← Mais artigos</Link></div>
    </article>
  );
}
