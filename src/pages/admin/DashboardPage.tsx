import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, DollarSign, Eye, Package, PackageCheck, ShoppingCart, Timer, TrendingUp } from 'lucide-react';
import { services } from '@/services';
import { useQuery } from '@/hooks/useQuery';
import { Card, Img, OrderStatusBadge, Skeleton } from '@/design-system';
import { brl, dateTime, orderStatusLabel } from '@/utils/format';
import { PageHeader } from './AdminApp';

function Kpi({ label, value, hint, icon, to }: { label: string; value: string | number; hint?: string; icon: React.ReactNode; to?: string }) {
  const body = (
    <Card className="h-full !p-5 transition hover:shadow-lift">
      <div className="flex items-start justify-between">
        <p className="text-[11.5px] font-semibold uppercase tracking-[.12em] text-tobacco">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/15 text-[#7a5a1e]">{icon}</span>
      </div>
      <p className="mt-3 font-serif text-[2rem] leading-none text-walnut">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-tobacco">{hint}</p>}
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

const COLORS = ['#4a2f1d', '#b08a40', '#6f7a5c', '#7a2e22', '#8a6a4a', '#2b4c8c'];

export function DashboardPage() {
  const { data: s } = useQuery(() => services.analytics.snapshot(), []);
  const { data: orders } = useQuery(() => services.orders.list(), []);
  if (!s)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  return (
    <div className="space-y-6">
      <PageHeader title="Visão geral" description="Indicadores calculados a partir dos pedidos, produtos e reservas da demonstração. Faça uma compra na loja e veja os números mudarem." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento" value={brl(s.revenue)} hint={`Ticket médio ${brl(s.averageTicket)}`} icon={<DollarSign className="h-4 w-4" />} to="/admin/pedidos" />
        <Kpi label="Vendas" value={s.salesCount} hint="Pedidos pagos (todas as etapas)" icon={<TrendingUp className="h-4 w-4" />} to="/admin/pedidos" />
        <Kpi label="Pedidos pendentes" value={s.ordersPending} hint="Aguardando pagamento PIX" icon={<Clock className="h-4 w-4" />} to="/admin/pedidos" />
        <Kpi label="Reservas ativas" value={s.activeReservations} hint="Carrinhos e PIX em aberto" icon={<Timer className="h-4 w-4" />} />
        <Kpi label="Produtos disponíveis" value={s.productsAvailable} icon={<Package className="h-4 w-4" />} to="/admin/produtos" />
        <Kpi label="Produtos vendidos" value={s.productsSold} icon={<PackageCheck className="h-4 w-4" />} to="/admin/produtos" />
        <Kpi label="Visualizações (top 6)" value={s.mostViewed.reduce((a, b) => a + b.views, 0).toLocaleString('pt-BR')} icon={<Eye className="h-4 w-4" />} />
        <Kpi label="Pedidos no total" value={orders?.length ?? 0} icon={<ShoppingCart className="h-4 w-4" />} to="/admin/pedidos" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <p className="font-serif text-xl text-walnut">Faturamento por mês</p>
          <p className="text-[12.5px] text-tobacco">Últimos 6 meses · pedidos pagos</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={s.revenueByMonth} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b08a40" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#b08a40" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e0d3bc" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#8a6a4a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fill: '#8a6a4a', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 12, border: '1px solid #d9c9ad', background: '#fbf8f2' }} />
                <Area type="monotone" dataKey="revenue" name="Faturamento" stroke="#4a2f1d" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <p className="font-serif text-xl text-walnut">Pedidos por status</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={s.ordersByStatus.map((o) => ({ ...o, label: orderStatusLabel[o.status] }))} layout="vertical" margin={{ left: 10, right: 16 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#8a6a4a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={130} tick={{ fill: '#4a2f1d', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d9c9ad', background: '#fbf8f2' }} />
                <Bar dataKey="count" name="Pedidos" radius={[0, 6, 6, 0]}>
                  {s.ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <p className="mb-3 font-serif text-xl text-walnut">Mais visualizados</p>
          <ul className="space-y-3">
            {s.mostViewed.map(({ product, views }, i) => (
              <li key={product.id} className="flex items-center gap-3">
                <span className="w-4 text-sm text-tobacco">{i + 1}</span>
                <Img src={product.photos[0]} alt="" className="h-10 w-10 rounded-lg" />
                <Link to={`/admin/produtos/${product.id}`} className="min-w-0 flex-1 truncate text-sm text-walnut hover:underline">
                  {product.name}
                </Link>
                <span className="text-[12.5px] tabular-nums text-tobacco">{views.toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="mb-1 font-serif text-xl text-walnut">Mais vendidos por categoria</p>
          <p className="mb-3 text-[12.5px] text-tobacco">Cada peça é única: o ranking agrupa vendas por categoria.</p>
          <ul className="space-y-3">
            {s.bestSellingCategories.map((c) => {
              const max = s.bestSellingCategories[0]?.revenue || 1;
              return (
                <li key={c.category}>
                  <div className="flex justify-between text-sm">
                    <span className="text-walnut">{c.category}</span>
                    <span className="text-tobacco">{c.count} · {brl(c.revenue)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-cream-200">
                    <div className="h-full rounded-full bg-brass" style={{ width: `${(c.revenue / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <p className="mb-3 font-serif text-xl text-walnut">Últimas peças vendidas</p>
          <ul className="space-y-3">
            {s.recentSold.map((r) => (
              <li key={r.product.id + r.orderCode} className="flex items-center gap-3">
                <Img src={r.product.photos[0]} alt="" className="h-10 w-10 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-walnut">{r.product.name}</p>
                  <p className="text-[11.5px] text-tobacco">{r.orderCode} · {dateTime(r.soldAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-serif text-xl text-walnut">Pedidos recentes</p>
          <Link to="/admin/pedidos" className="text-sm font-semibold text-walnut hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-sand/60">
          {orders?.slice(0, 5).map((o) => (
            <Link key={o.id} to={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:bg-cream-200/40">
              <span className="w-24 font-semibold text-walnut">{o.code}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-tobacco">{o.buyer.name}</span>
              <OrderStatusBadge status={o.status} />
              <span className="w-28 text-right font-semibold tabular-nums text-walnut">{brl(o.total)}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
