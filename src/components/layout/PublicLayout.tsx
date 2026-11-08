import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, FlaskConical, Home, Info, LayoutDashboard, Menu, Search, ShoppingBag, User, X, Compass, ScrollText, Shield, Store } from 'lucide-react';
import clsx from 'clsx';
import { services } from '@/services';
import { useQuery } from '@/hooks/useQuery';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { Drawer, IconButton } from '@/design-system';
import { CartDrawer } from '../cart/CartDrawer';

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="Casa Âmbar, página inicial">
      <span className={clsx('flex h-9 w-9 items-center justify-center rounded-full border font-serif text-xl transition group-hover:rotate-[8deg]', light ? 'border-brass-light/60 text-brass-light' : 'border-walnut/30 text-walnut')}>Â</span>
      {!compact && (
        <span className="leading-none">
          <span className={clsx('block font-serif text-[1.45rem] font-medium tracking-wide', light ? 'text-cream' : 'text-walnut')}>Casa Âmbar</span>
          <span className={clsx('mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[.32em]', light ? 'text-brass-light' : 'text-brass')}>Antiquário & Brechó</span>
        </span>
      )}
    </Link>
  );
}

function DemoBar() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="relative z-40 bg-espresso px-4 py-2 text-center text-[12px] text-cream/85">
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <FlaskConical className="h-3.5 w-3.5 text-brass-light" />
        <strong className="font-semibold text-cream">Protótipo demonstrativo.</strong>
        <span className="hidden sm:inline">Dados fictícios, pagamentos e fretes simulados, nenhuma cobrança real.</span>
        <span className="sm:hidden">Dados e pagamentos simulados.</span>
        <Link to="/admin" className="font-semibold text-brass-light underline-offset-2 hover:underline">
          <span className="hidden sm:inline">Abrir painel administrativo →</span>
          <span className="sm:hidden">Painel →</span>
        </Link>
      </span>
      <button onClick={() => setHidden(true)} aria-label="Ocultar aviso" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cream/60 hover:text-cream">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories } = useQuery(() => services.categories.list(), []);
  const [expanded, setExpanded] = useState<string | null>('cats');
  const menuCats = (categories ?? []).filter((c) => c.showInMenu);
  const link = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-walnut transition hover:bg-walnut/5';
  const active = 'bg-walnut/[.06] font-semibold';
  return (
    <Drawer open={open} onClose={onClose} side="left" width="max-w-sm" title={<Logo />}>
      <nav className="flex flex-col gap-1 p-4" aria-label="Menu principal">
        <NavLink to="/" end onClick={onClose} className={({ isActive }) => clsx(link, isActive && active)}>
          <Home className="h-4 w-4 text-tobacco" /> Início
        </NavLink>
        <NavLink to="/loja" onClick={onClose} className={({ isActive }) => clsx(link, isActive && active)}>
          <Store className="h-4 w-4 text-tobacco" /> Todas as peças
        </NavLink>
        <div>
          <button className={clsx(link, 'w-full justify-between')} aria-expanded={expanded === 'cats'} onClick={() => setExpanded((e) => (e === 'cats' ? null : 'cats'))}>
            <span className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-tobacco" /> Categorias
            </span>
            <ChevronDown className={clsx('h-4 w-4 transition', expanded === 'cats' && 'rotate-180')} />
          </button>
          {expanded === 'cats' && (
            <div className="ml-5 mt-1 flex animate-fadeIn flex-col border-l border-sand pl-3">
              {menuCats.map((c) => (
                <NavLink key={c.id} to={`/categoria/${c.slug}`} onClick={onClose} className={({ isActive }) => clsx('flex items-center justify-between rounded-md px-3 py-2 text-[14.5px] text-walnut hover:bg-walnut/5', isActive && 'font-semibold')}>
                  {c.name}
                  {c.panoramaId && <span className="rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7a5a1e]">360°</span>}
                </NavLink>
              ))}
              <NavLink to="/loja" onClick={onClose} className="rounded-md px-3 py-2 text-[14.5px] italic text-tobacco hover:bg-walnut/5">
                Outras categorias e busca
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/ambientes" onClick={onClose} className={({ isActive }) => clsx(link, isActive && active)}>
          <Compass className="h-4 w-4 text-tobacco" /> Ambientes 360°
        </NavLink>
        <NavLink to="/editorial" onClick={onClose} className={({ isActive }) => clsx(link, isActive && active)}>
          <ScrollText className="h-4 w-4 text-tobacco" /> Conteúdo editorial
        </NavLink>
        <NavLink to="/quem-somos" onClick={onClose} className={({ isActive }) => clsx(link, isActive && active)}>
          <Info className="h-4 w-4 text-tobacco" /> Quem somos
        </NavLink>
        <div className="my-3 border-t border-sand/70" />
        <NavLink to="/conta" onClick={onClose} className={({ isActive }) => clsx(link, isActive && active)}>
          <User className="h-4 w-4 text-tobacco" /> Minha conta
        </NavLink>
        <NavLink to="/termos" onClick={onClose} className={({ isActive }) => clsx(link, 'text-[14px]', isActive && active)}>
          <ScrollText className="h-4 w-4 text-tobacco" /> Termos de uso
        </NavLink>
        <NavLink to="/privacidade" onClick={onClose} className={({ isActive }) => clsx(link, 'text-[14px]', isActive && active)}>
          <Shield className="h-4 w-4 text-tobacco" /> Política de privacidade
        </NavLink>
        <Link to="/admin" onClick={onClose} className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-walnut/25 px-3 py-3 text-[14px] text-walnut hover:bg-walnut/5">
          <LayoutDashboard className="h-4 w-4 text-brass" />
          <span>
            Painel administrativo
            <span className="block text-[11.5px] text-tobacco">Área demonstrativa da equipe</span>
          </span>
        </Link>
      </nav>
    </Drawer>
  );
}

function Header() {
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const count = useCart((s) => s.items.length);
  const setOpen = useCart((s) => s.setOpen);
  const customer = useSession((s) => s.customer);
  const nav = useNavigate();
  const { data: categories } = useQuery(() => services.categories.list(), []);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav(`/loja?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };
  return (
    <>
      <header className={clsx('sticky top-0 z-30 border-b transition-all duration-300', scrolled ? 'border-sand/70 bg-cream/90 shadow-soft backdrop-blur-md' : 'border-transparent bg-cream')}>
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center gap-2 px-4 sm:px-6 lg:px-10">
          <IconButton label="Abrir menu" onClick={() => setMenu(true)} className="-ml-2">
            <Menu className="h-5 w-5" />
          </IconButton>
          <div className="flex-1 lg:flex-none">
            <Logo />
          </div>
          <nav className="mx-auto hidden items-center gap-6 lg:flex" aria-label="Categorias">
            {(categories ?? []).filter((c) => c.showInMenu).slice(0, 6).map((c) => (
              <NavLink key={c.id} to={`/categoria/${c.slug}`} className={({ isActive }) => clsx('relative text-[13.5px] font-medium tracking-wide text-walnut/80 transition hover:text-walnut', isActive && 'text-walnut after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:bg-brass')}>
                {c.name}
              </NavLink>
            ))}
            <NavLink to="/ambientes" className="text-[13.5px] font-semibold tracking-wide text-brass hover:text-walnut">
              Tour 360°
            </NavLink>
          </nav>
          <div className="flex items-center">
            <IconButton label="Buscar peças" onClick={() => setSearchOpen((v) => !v)}>
              <Search className="h-5 w-5" />
            </IconButton>
            <Link to="/conta" aria-label="Minha conta" title={customer ? customer.name : 'Minha conta'} className="hidden h-10 w-10 items-center justify-center rounded-full text-walnut hover:bg-walnut/5 sm:inline-flex">
              <User className="h-5 w-5" />
            </Link>
            <button onClick={() => setOpen(true)} aria-label={`Abrir carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-walnut hover:bg-walnut/5">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-oxblood px-1 text-[10.5px] font-bold text-cream">{count}</span>}
            </button>
          </div>
        </div>
        {searchOpen && (
          <form onSubmit={submit} className="animate-fadeIn border-t border-sand/60 bg-cream-50">
            <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
              <Search className="h-5 w-5 text-tobacco" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por peça, material, época ou fabricante…" className="h-10 flex-1 bg-transparent font-serif text-xl text-walnut placeholder:text-tobacco/50 focus:outline-none" aria-label="Termo de busca" />
              <button type="submit" className="rounded-full bg-walnut px-4 py-2 text-sm font-medium text-cream">
                Buscar
              </button>
            </div>
          </form>
        )}
      </header>
      <SideMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}

function Footer() {
  const { data: categories } = useQuery(() => services.categories.list(), []);
  return (
    <footer className="mt-24 bg-walnut-800 text-cream/80">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm font-serif text-xl italic leading-snug text-cream/90">Peças com passado, escolhidas para continuar contando histórias.</p>
          <p className="mt-4 text-sm text-cream/60">Rua Fictícia das Antiguidades, 100 · São Paulo (endereço ilustrativo)</p>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[.22em] text-brass-light">Categorias</h4>
          <ul className="space-y-2 text-sm">
            {(categories ?? []).map((c) => (
              <li key={c.id}>
                <Link to={`/categoria/${c.slug}`} className="hover:text-cream">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[.22em] text-brass-light">A casa</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/quem-somos" className="hover:text-cream">Quem somos</Link></li>
            <li><Link to="/ambientes" className="hover:text-cream">Ambientes 360°</Link></li>
            <li><Link to="/editorial" className="hover:text-cream">Conteúdo editorial</Link></li>
            <li><Link to="/conta" className="hover:text-cream">Minha conta</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[.22em] text-brass-light">Institucional</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/termos" className="hover:text-cream">Termos de uso</Link></li>
            <li><Link to="/privacidade" className="hover:text-cream">Política de privacidade</Link></li>
            <li><Link to="/admin" className="hover:text-cream">Painel administrativo (demo)</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 text-[12px] text-cream/50 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
          <span>© {new Date().getFullYear()} Casa Âmbar · marca fictícia criada para demonstração.</span>
          <span>Protótipo navegável: não processa pedidos, pagamentos ou entregas reais.</span>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
