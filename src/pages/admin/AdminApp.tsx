import { useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BarChart3, Compass, FileText, FolderTree, LayoutDashboard, Lock, Menu, Package, Settings, ShoppingCart, Store, Tag, Users, UserCog } from 'lucide-react';
import clsx from 'clsx';
import { services } from '@/services';
import { useQuery } from '@/hooks/useQuery';
import { useSession } from '@/store/session';
import { toast } from '@/store/toast';
import { DemoTag, Drawer, EmptyState, Select } from '@/design-system';
import type { AdminRole, AdminUser } from '@/types/domain';
import { roleLabel } from '@/utils/format';
import { Logo } from '@/components/layout/PublicLayout';
import { DashboardPage } from './DashboardPage';
import { ProductFormPage, ProductsPage } from './ProductsPages';
import { CategoriesPage, CouponsPage } from './CatalogAdminPages';
import { PanoramaEditorPage } from './PanoramaEditorPage';
import { CustomersPage, OrderDetailPage, OrdersPage } from './OrdersPages';
import { ArticlesPage, SettingsPage, UsersPage } from './ContentAdminPages';

type Area = 'dashboard' | 'produtos' | 'categorias' | 'panoramas' | 'pedidos' | 'clientes' | 'cupons' | 'conteudo' | 'usuarios' | 'configuracoes';

/** Autorização SIMULADA por perfil local. Em produção, validar no servidor. */
export const PERMISSIONS: Record<AdminRole, Area[] | '*'> = {
  admin: '*',
  gerente: ['dashboard', 'produtos', 'categorias', 'panoramas', 'pedidos', 'clientes', 'cupons', 'conteudo', 'configuracoes'],
  estoque: ['dashboard', 'produtos', 'categorias', 'panoramas', 'pedidos'],
  editor: ['dashboard', 'conteudo', 'panoramas'],
};
export const can = (role: AdminRole | undefined, area: Area) => !!role && (PERMISSIONS[role] === '*' || (PERMISSIONS[role] as Area[]).includes(area));

const NAV: { to: string; label: string; icon: typeof Package; area: Area }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, area: 'dashboard' },
  { to: '/admin/produtos', label: 'Produtos', icon: Package, area: 'produtos' },
  { to: '/admin/categorias', label: 'Categorias', icon: FolderTree, area: 'categorias' },
  { to: '/admin/panoramas', label: 'Editor panorâmico', icon: Compass, area: 'panoramas' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart, area: 'pedidos' },
  { to: '/admin/clientes', label: 'Clientes', icon: Users, area: 'clientes' },
  { to: '/admin/cupons', label: 'Cupons', icon: Tag, area: 'cupons' },
  { to: '/admin/conteudo', label: 'Conteúdo editorial', icon: FileText, area: 'conteudo' },
  { to: '/admin/usuarios', label: 'Usuários', icon: UserCog, area: 'usuarios' },
  { to: '/admin/configuracoes', label: 'Demonstração', icon: Settings, area: 'configuracoes' },
];

export function useAdminUser(): AdminUser | undefined {
  const id = useSession((s) => s.adminUserId);
  const { data } = useQuery(() => services.admin.listUsers(), []);
  return data?.find((u) => u.id === id) ?? data?.[0];
}

function Guard({ area, children }: { area: Area; children: ReactNode }) {
  const user = useAdminUser();
  if (!user) return null;
  if (!can(user.role, area))
    return (
      <EmptyState icon={<Lock className="h-6 w-6" />} title="Acesso restrito para este perfil">
        O perfil <strong>{roleLabel[user.role]}</strong> não tem permissão para esta área. Troque o usuário no topo da página para testar outros níveis de acesso.
      </EmptyState>
    );
  return <>{children}</>;
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAdminUser();
  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Menu do painel">
      {NAV.map((n) => {
        const allowed = can(user?.role, n.area);
        return (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) => clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition', isActive ? 'bg-cream/10 font-semibold text-cream' : 'text-cream/70 hover:bg-cream/5 hover:text-cream', !allowed && 'opacity-45')}
          >
            <n.icon className="h-4 w-4" />
            <span className="flex-1">{n.label}</span>
            {!allowed && <Lock className="h-3.5 w-3.5" />}
          </NavLink>
        );
      })}
      <div className="my-3 border-t border-cream/10" />
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-brass-light hover:bg-cream/5">
        <Store className="h-4 w-4" /> Ver loja pública
      </Link>
    </nav>
  );
}

export default function AdminApp() {
  const [menu, setMenu] = useState(false);
  const user = useAdminUser();
  const { data: users } = useQuery(() => services.admin.listUsers(), []);
  const setAdminUser = useSession((s) => s.setAdminUser);
  const { pathname } = useLocation();
  const current = NAV.slice().reverse().find((n) => pathname.startsWith(n.to));
  return (
    <div className="min-h-screen bg-[#f3eee4]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-walnut-800 lg:flex">
        <div className="border-b border-cream/10 px-5 py-5">
          <Logo light />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[.2em] text-cream/50">Painel administrativo</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <div className="border-t border-cream/10 p-4 text-[11.5px] text-cream/50">Ambiente de demonstração · dados locais</div>
      </aside>
      <Drawer open={menu} onClose={() => setMenu(false)} side="left" width="max-w-[280px]" title={<span className="text-base">Painel</span>}>
        <div className="min-h-full bg-walnut-800">
          <Sidebar onNavigate={() => setMenu(false)} />
        </div>
      </Drawer>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-sand/70 bg-cream-50/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-full p-2 text-walnut lg:hidden" aria-label="Abrir menu do painel" onClick={() => setMenu(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BarChart3 className="hidden h-4 w-4 text-brass sm:block" />
            <span className="truncate font-serif text-xl text-walnut">{current?.label ?? 'Painel'}</span>
            <DemoTag className="hidden sm:inline-flex">Demo</DemoTag>
          </div>
          {user && users && (
            <label className="flex items-center gap-2">
              <span className="hidden h-8 w-8 items-center justify-center rounded-full font-serif text-cream sm:flex" style={{ background: user.avatarColor }}>
                {user.name[0]}
              </span>
              <span className="sr-only">Perfil ativo (simulado)</span>
              <Select
                value={user.id}
                onChange={(e) => {
                  setAdminUser(e.target.value);
                  const u = users.find((x) => x.id === e.target.value)!;
                  toast.info(`Perfil alterado para ${u.name}`, `${roleLabel[u.role]} · autorização simulada`);
                }}
                className="!h-9 w-[160px] !text-[13px] sm:w-[300px]"
                title="Troca de perfil simulada para testar níveis de acesso"
              >
                {users.filter((u) => u.active).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {roleLabel[u.role]}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
          <Routes>
            <Route index element={<Guard area="dashboard"><DashboardPage /></Guard>} />
            <Route path="produtos" element={<Guard area="produtos"><ProductsPage /></Guard>} />
            <Route path="produtos/novo" element={<Guard area="produtos"><ProductFormPage /></Guard>} />
            <Route path="produtos/:id" element={<Guard area="produtos"><ProductFormPage /></Guard>} />
            <Route path="categorias" element={<Guard area="categorias"><CategoriesPage /></Guard>} />
            <Route path="panoramas" element={<Guard area="panoramas"><PanoramaEditorPage /></Guard>} />
            <Route path="pedidos" element={<Guard area="pedidos"><OrdersPage /></Guard>} />
            <Route path="pedidos/:id" element={<Guard area="pedidos"><OrderDetailPage /></Guard>} />
            <Route path="clientes" element={<Guard area="clientes"><CustomersPage /></Guard>} />
            <Route path="cupons" element={<Guard area="cupons"><CouponsPage /></Guard>} />
            <Route path="conteudo" element={<Guard area="conteudo"><ArticlesPage /></Guard>} />
            <Route path="usuarios" element={<Guard area="usuarios"><UsersPage /></Guard>} />
            <Route path="configuracoes" element={<Guard area="configuracoes"><SettingsPage /></Guard>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[2rem] leading-tight text-walnut">{title}</h1>
        {description && <p className="mt-1 text-sm text-tobacco">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
