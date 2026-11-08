import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Mail, MapPin, Package, Phone, Search, Truck, User, Users } from 'lucide-react';
import { services } from '@/services';
import type { Customer, OrderStatus } from '@/types/domain';
import { useQuery } from '@/hooks/useQuery';
import { toast } from '@/store/toast';
import { Badge, Button, Card, confirm, DemoNotice, DemoTag, Drawer, EmptyState, Field, Img, Input, OrderStatusBadge, Select, Skeleton, Tabs, Textarea } from '@/design-system';
import { brl, dateTime, orderStatusLabel } from '@/utils/format';
import { PageHeader, useAdminUser } from './AdminApp';

const STATUS_FLOW: OrderStatus[] = ['aguardando-pagamento', 'pago', 'em-separacao', 'enviado', 'entregue', 'cancelado'];

export function OrdersPage() {
  const { data: orders, loading } = useQuery(() => services.orders.list(), []);
  const [tab, setTab] = useState<'todos' | OrderStatus>('todos');
  const [q, setQ] = useState('');
  const list = (orders ?? []).filter((o) => (tab === 'todos' || o.status === tab) && (!q || `${o.code} ${o.buyer.name} ${o.buyer.email}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <PageHeader title="Pedidos" description="Pedidos fictícios e pedidos criados por você na loja durante a demonstração." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'todos', label: `Todos (${orders?.length ?? 0})` }, ...STATUS_FLOW.map((s) => ({ value: s, label: `${orderStatusLabel[s]} (${orders?.filter((o) => o.status === s).length ?? 0})` }))]} className="lg:flex-1" />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tobacco" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código, cliente ou e-mail" className="!h-10 pl-9" aria-label="Buscar pedidos" />
        </div>
      </div>
      {loading && !orders ? (
        <Skeleton className="h-64" />
      ) : !list.length ? (
        <EmptyState icon={<Package className="h-6 w-6" />} title="Nenhum pedido encontrado" />
      ) : (
        <Card padded={false} className="divide-y divide-sand/60 overflow-hidden">
          {list.map((o) => (
            <Link key={o.id} to={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 transition hover:bg-cream-200/40">
              <div className="flex -space-x-3">
                {o.items.slice(0, 3).map((i) => <Img key={i.productId} src={i.photo} alt="" className="h-11 w-11 rounded-full border-2 border-cream-50" />)}
              </div>
              <div className="min-w-[140px] flex-1">
                <p className="font-semibold text-walnut">{o.code}</p>
                <p className="text-[12.5px] text-tobacco">{o.buyer.name} · {dateTime(o.createdAt)}</p>
              </div>
              <span className="hidden text-[12.5px] text-tobacco md:block">{o.shippingLabel}</span>
              <OrderStatusBadge status={o.status} />
              <span className="w-28 text-right font-semibold tabular-nums text-walnut">{brl(o.total)}</span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: order, loading } = useQuery(() => services.orders.get(id), [id]);
  const { data: customer } = useQuery(async () => (order ? services.customers.get(order.customerId) : null), [order?.customerId]);
  const admin = useAdminUser();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  if (loading && !order) return <Skeleton className="h-96" />;
  if (!order) return <EmptyState title="Pedido não encontrado" action={<Link to="/admin/pedidos"><Button>Voltar</Button></Link>} />;

  const apply = async () => {
    if (!status || status === order.status) return;
    if (status === 'cancelado' && !(await confirm({ title: 'Cancelar pedido?', message: 'As reservas serão liberadas e peças vendidas voltam ao estoque. Em pagamentos aprovados, o estorno é apenas simulado.', danger: true, confirmLabel: 'Cancelar pedido' }))) return;
    setSaving(true);
    await services.orders.updateStatus(order.id, status, note, admin?.name ?? 'Equipe');
    setSaving(false);
    setNote('');
    setStatus('');
    toast.success('Status atualizado', `${order.code}: ${orderStatusLabel[status]}. Notificação ao cliente simulada.`);
  };

  return (
    <div>
      <Link to="/admin/pedidos" className="mb-3 inline-flex items-center gap-1.5 text-sm text-tobacco hover:text-walnut"><ArrowLeft className="h-4 w-4" /> Pedidos</Link>
      <PageHeader title={`Pedido ${order.code}`} description={`Criado em ${dateTime(order.createdAt)}`} actions={<OrderStatusBadge status={order.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <p className="mb-3 flex items-center gap-2 font-serif text-xl text-walnut"><Package className="h-4 w-4 text-brass" /> Produtos</p>
            <div className="divide-y divide-sand/60">
              {order.items.map((i) => (
                <div key={i.productId} className="flex items-center gap-3 py-3">
                  <Img src={i.photo} alt="" className="h-14 w-14 rounded-lg" />
                  <Link to={`/admin/produtos/${i.productId}`} className="flex-1 text-walnut hover:underline">{i.name}</Link>
                  <span className="font-semibold">{brl(i.price)}</span>
                </div>
              ))}
            </div>
            <dl className="mt-3 space-y-1 border-t border-sand/60 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-tobacco">Subtotal</dt><dd>{brl(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-sage"><dt>Desconto {order.couponCode}</dt><dd>− {brl(order.discount)}</dd></div>}
              {order.couponCode && order.discount === 0 && <div className="flex justify-between text-sage"><dt>Cupom {order.couponCode}</dt><dd>frete grátis</dd></div>}
              <div className="flex justify-between"><dt className="text-tobacco">Frete</dt><dd>{order.shipping ? brl(order.shipping) : 'Grátis'}</dd></div>
              <div className="flex justify-between pt-1 font-semibold"><dt>Total</dt><dd className="font-serif text-2xl">{brl(order.total)}</dd></div>
            </dl>
          </Card>
          <Card>
            <p className="mb-4 font-serif text-xl text-walnut">Histórico</p>
            <ol className="relative space-y-4 border-l border-sand pl-5">
              {order.history.map((h, i) => (
                <li key={i}>
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brass" />
                  <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={h.status} /><span className="text-[12px] text-tobacco">{dateTime(h.at)} · {h.by}</span></div>
                  <p className="mt-1 text-sm text-walnut">{h.note}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="font-serif text-xl text-walnut">Alterar status</p>
            <Field label="Novo status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                <option value="">Selecione…</option>
                {STATUS_FLOW.filter((s) => s !== order.status).map((s) => <option key={s} value={s}>{orderStatusLabel[s]}</option>)}
              </Select>
            </Field>
            <Field label="Observação (histórico)"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: código de rastreio fictício BR123…" /></Field>
            <Button block loading={saving} disabled={!status} onClick={apply}>Atualizar status</Button>
            <DemoTag>Notificação ao cliente simulada</DemoTag>
          </Card>
          <Card className="space-y-2 text-sm">
            <p className="flex items-center gap-2 font-serif text-xl text-walnut"><User className="h-4 w-4 text-brass" /> Comprador</p>
            <p className="text-walnut">{order.buyer.name}</p>
            <p className="flex items-center gap-2 text-tobacco"><Mail className="h-3.5 w-3.5" /> {order.buyer.email}</p>
            <p className="flex items-center gap-2 text-tobacco"><Phone className="h-3.5 w-3.5" /> {order.buyer.phone}</p>
            {customer ? <p className="text-[12.5px] text-tobacco">Cliente desde {dateTime(customer.createdAt)}</p> : <Badge>Visitante</Badge>}
          </Card>
          <Card className="space-y-2 text-sm">
            <p className="flex items-center gap-2 font-serif text-xl text-walnut"><Truck className="h-4 w-4 text-brass" /> Entrega</p>
            <p className="text-walnut">{order.shippingLabel}</p>
            {order.address ? (
              <p className="flex gap-2 text-tobacco"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.address.street}, {order.address.number} {order.address.complement} · {order.address.district} · {order.address.city}/{order.address.state} · {order.address.cep}</p>
            ) : (
              <p className="text-tobacco">Retirada no ateliê</p>
            )}
          </Card>
          <Card className="space-y-2 text-sm">
            <p className="flex items-center gap-2 font-serif text-xl text-walnut"><CreditCard className="h-4 w-4 text-brass" /> Pagamento</p>
            <p className="text-walnut">PIX (simulado) · <strong>{order.payment.status}</strong></p>
            {order.payment.paidAt && <p className="text-tobacco">Aprovado em {dateTime(order.payment.paidAt)}</p>}
            {order.payment.pixCode && <code className="block truncate rounded bg-cream-200 px-2 py-1 text-[11.5px] text-tobacco">{order.payment.pixCode}</code>}
            {order.status === 'aguardando-pagamento' && <Link to={`/pedido/${order.code}/pagamento`} target="_blank" className="text-[12.5px] font-semibold text-walnut underline">Abrir tela de pagamento do cliente</Link>}
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const { data: customers } = useQuery(() => services.customers.list(), []);
  const { data: orders } = useQuery(() => services.orders.list(), []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Customer | null>(null);
  const paid = (cid: string) => (orders ?? []).filter((o) => o.customerId === cid && ['pago', 'em-separacao', 'enviado', 'entregue'].includes(o.status));
  const list = (customers ?? []).filter((c) => !q || `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Clientes" description="Clientes fictícios. Visitantes que compram na demonstração também aparecem aqui." />
      <DemoNotice title="Dados fictícios" className="mb-4">Nomes, e-mails e telefones são inventados. O protótipo não armazena dados pessoais reais.</DemoNotice>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tobacco" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" className="!h-10 pl-9" />
      </div>
      {!list.length ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum cliente encontrado" />
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream-200/60 text-[11px] uppercase tracking-[.12em] text-tobacco">
              <tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Telefone</th><th className="px-4 py-3">Cidade</th><th className="px-4 py-3 text-right">Compras</th><th className="px-4 py-3 text-right">Total gasto</th></tr>
            </thead>
            <tbody className="divide-y divide-sand/60">
              {list.map((c) => {
                const p = paid(c.id);
                return (
                  <tr key={c.id} className="cursor-pointer hover:bg-cream-200/40" onClick={() => setOpen(c)}>
                    <td className="px-4 py-3"><p className="font-medium text-walnut">{c.name}</p><p className="text-[12px] text-tobacco">{c.email}</p></td>
                    <td className="px-4 py-3 text-tobacco">{c.phone}</td>
                    <td className="px-4 py-3 text-tobacco">{c.city}</td>
                    <td className="px-4 py-3 text-right font-semibold">{p.length}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{brl(p.reduce((s, o) => s + o.total, 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <div className="space-y-5 p-5 text-sm">
            <div className="space-y-1 text-tobacco">
              <p>{open.email}</p>
              <p>{open.phone}</p>
              <p>{open.city}</p>
              <p className="text-[12px]">Cliente desde {dateTime(open.createdAt)}</p>
            </div>
            <div>
              <p className="mb-2 font-serif text-xl text-walnut">Histórico de pedidos</p>
              {(orders ?? []).filter((o) => o.customerId === open.id).map((o) => (
                <Link key={o.id} to={`/admin/pedidos/${o.id}`} onClick={() => setOpen(null)} className="mb-2 flex items-center justify-between rounded-xl border border-sand/60 p-3 hover:border-walnut">
                  <span><strong className="text-walnut">{o.code}</strong><span className="block text-[12px] text-tobacco">{dateTime(o.createdAt)}</span></span>
                  <span className="text-right"><OrderStatusBadge status={o.status} /><span className="block font-semibold">{brl(o.total)}</span></span>
                </Link>
              ))}
              {!(orders ?? []).some((o) => o.customerId === open.id) && <p className="text-tobacco">Nenhum pedido.</p>}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
