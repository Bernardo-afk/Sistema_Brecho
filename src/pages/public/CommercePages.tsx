import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCircle2, Copy, Loader2, MapPin, Package, ShoppingBag, Tag, Truck, User, X, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { services, PIX_MINUTES } from '@/services';
import type { CouponValidation } from '@/services';
import type { Coupon, Order, ShippingQuote } from '@/types/domain';
import { useDocumentTitle, useNow, useQuery } from '@/hooks/useQuery';
import { useCartDetails } from '@/hooks/useCartDetails';
import { useCart } from '@/store/cart';
import { useCheckout } from '@/store/checkout';
import { useSession } from '@/store/session';
import { toast } from '@/store/toast';
import { Breadcrumbs, Button, Card, DemoNotice, DemoTag, EmptyState, Field, Img, Input, OrderStatusBadge, Spinner } from '@/design-system';
import { CartLineRow } from '@/components/cart/CartDrawer';
import { brl, dateTime, maskCep, maskCpf, maskPhone, mmss, orderStatusLabel } from '@/utils/format';
import { NotFoundPage } from './InstitutionalPages';

// ---------- Cupom e totais compartilhados ----------
function useCouponState(subtotal: number) {
  const code = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const [validation, setValidation] = useState<CouponValidation | null>(null);
  useEffect(() => {
    let alive = true;
    if (!code) return setValidation(null);
    services.coupons.validate(code, subtotal).then((v) => alive && setValidation(v));
    return () => {
      alive = false;
    };
  }, [code, subtotal]);
  return { code, setCoupon, validation, coupon: validation?.ok ? validation.coupon : undefined };
}

function computeTotals(subtotal: number, shipping: ShippingQuote | null, coupon?: Coupon) {
  const ship = shipping?.price ?? 0;
  let discount = 0;
  let freeShipping = false;
  if (coupon) {
    const c = services.coupons.computeDiscount(coupon, subtotal, ship);
    freeShipping = c.freeShipping;
    discount = c.freeShipping ? 0 : c.discount;
  }
  const shippingFinal = freeShipping ? 0 : ship;
  return { subtotal, discount, shipping: shippingFinal, freeShipping, total: Math.max(0, subtotal - discount + shippingFinal) };
}

function CouponBox({ subtotal }: { subtotal: number }) {
  const { code, setCoupon, validation } = useCouponState(subtotal);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    const v = await services.coupons.validate(value, subtotal);
    setLoading(false);
    if (v.ok) {
      setCoupon(v.coupon!.code);
      setValue('');
      toast.success('Cupom aplicado', v.message);
    } else toast.error('Cupom não aplicado', v.message);
  };
  return (
    <div>
      {code ? (
        <div className={clsx('flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm', validation?.ok === false ? 'border-oxblood/40 bg-oxblood/5' : 'border-sage/40 bg-sage/10')}>
          <span className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-sage" />
            <span>
              <strong className="font-semibold text-walnut">{code}</strong>
              <span className="block text-[12px] text-tobacco">{validation?.message ?? 'Validando…'}</span>
            </span>
          </span>
          <button onClick={() => setCoupon(null)} aria-label="Remover cupom" className="rounded-full p-1 text-tobacco hover:text-oxblood">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={apply} className="flex gap-2">
          <Input value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} placeholder="Cupom de desconto" aria-label="Código do cupom" className="!h-10 uppercase" />
          <Button type="submit" variant="secondary" size="sm" loading={loading} className="!h-10">
            Aplicar
          </Button>
        </form>
      )}
      <p className="mt-1.5 text-[11.5px] text-tobacco">Experimente: BEMVINDO10, FRETEGRATIS, ANTIQUARIO300 ou INVERNO2025 (expirado).</p>
    </div>
  );
}

function ShippingPicker({ products, compact }: { products: Parameters<typeof services.shipping.quote>[1]; compact?: boolean }) {
  const { cep, shipping, set } = useCheckout();
  const [value, setValue] = useState(cep);
  const [quotes, setQuotes] = useState<ShippingQuote[] | null>(null);
  const [loading, setLoading] = useState(false);
  const calc = async (c = value) => {
    if (c.replace(/\D/g, '').length !== 8) return toast.error('CEP inválido', 'Informe os 8 dígitos do CEP.');
    setLoading(true);
    const q = await services.shipping.quote(c, products);
    setQuotes(q);
    setLoading(false);
    set({ cep: c });
    const keep = shipping && q.find((x) => x.method === shipping.method && x.available);
    set({ shipping: keep ?? q.find((x) => x.available && x.method !== 'retirada') ?? q[0] });
  };
  useEffect(() => {
    if (cep && products.length) calc(cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.map((p) => p.id).join(',')]);
  return (
    <div>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(maskCep(e.target.value))} placeholder="00000-000" inputMode="numeric" aria-label="CEP para calcular o frete" className="!h-10" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), calc())} />
        <Button type="button" variant="secondary" size="sm" className="!h-10" loading={loading} onClick={() => calc()}>
          Calcular
        </Button>
      </div>
      {loading && <p className="mt-2 flex items-center gap-2 text-[12.5px] text-tobacco"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando modalidades (simulação)…</p>}
      {quotes && !loading && (
        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Modalidade de entrega">
          {quotes.map((q) => (
            <label key={q.method} className={clsx('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition', !q.available && 'cursor-not-allowed opacity-50', shipping?.method === q.method ? 'border-walnut bg-walnut/[.04]' : 'border-sand hover:border-tobacco')}>
              <input type="radio" name="frete" className="mt-1 accent-walnut" disabled={!q.available} checked={shipping?.method === q.method} onChange={() => set({ shipping: q })} />
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2 text-sm font-semibold text-walnut">
                  {q.label}
                  <span>{q.price === 0 ? 'Grátis' : brl(q.price)}</span>
                </span>
                {!compact && <span className="block text-[12px] text-tobacco">{q.available ? q.description : q.unavailableReason}</span>}
                {q.available && <span className="block text-[12px] text-tobacco">{q.method === 'retirada' ? `Disponível em ${q.days[0]} a ${q.days[1]} dias úteis` : `Entrega estimada: ${q.days[0]} a ${q.days[1]} dias úteis`}</span>}
              </span>
            </label>
          ))}
          <DemoTag>Frete simulado · valores fictícios</DemoTag>
        </div>
      )}
    </div>
  );
}

function Totals({ t, couponCode }: { t: ReturnType<typeof computeTotals>; couponCode?: string }) {
  const shipping = useCheckout((s) => s.shipping);
  return (
    <dl className="space-y-2 text-[14px]">
      <div className="flex justify-between"><dt className="text-tobacco">Subtotal</dt><dd className="text-walnut">{brl(t.subtotal)}</dd></div>
      {t.discount > 0 && <div className="flex justify-between text-sage"><dt>Desconto {couponCode && `(${couponCode})`}</dt><dd>− {brl(t.discount)}</dd></div>}
      <div className="flex justify-between"><dt className="text-tobacco">Frete {shipping && <span className="text-[12px]">· {shipping.label}</span>}</dt><dd className="text-walnut">{!shipping ? 'Calcule abaixo' : t.freeShipping ? <span className="text-sage">Grátis (cupom)</span> : t.shipping === 0 ? 'Grátis' : brl(t.shipping)}</dd></div>
      <div className="flex items-baseline justify-between border-t border-sand pt-3"><dt className="font-semibold text-walnut">Total</dt><dd className="font-serif text-[1.8rem] text-walnut">{brl(t.total)}</dd></div>
    </dl>
  );
}

// ---------- Carrinho ----------
export function CartPage() {
  useDocumentTitle('Carrinho');
  const { lines, purchasable, subtotal, loading, isEmpty } = useCartDetails();
  const { coupon } = useCouponState(subtotal);
  const shipping = useCheckout((s) => s.shipping);
  const t = computeTotals(subtotal, shipping, coupon);
  const nav = useNavigate();
  if (loading) return <Spinner />;
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Carrinho' }]} />
      <h1 className="mb-8 mt-4 font-serif text-[2.6rem] leading-none text-walnut">Seu carrinho</h1>
      {isEmpty ? (
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Nenhuma peça por aqui ainda" action={<Link to="/loja"><Button>Explorar o acervo</Button></Link>}>
          Ao adicionar uma peça, ela fica reservada para você por 15 minutos.
        </EmptyState>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <DemoNotice title="Reservas temporárias (simulação local)">
              Cada peça adicionada fica reservada por 15 minutos neste navegador. No protótipo, a reserva não garante exclusividade entre dispositivos; na versão definitiva ela será controlada pelo servidor.
            </DemoNotice>
            <div className="divide-y divide-sand/70 rounded-2xl border border-sand/60 bg-cream-50 px-5">
              {lines.map((l) => (
                <div key={l.product.id} className="py-5">
                  <CartLineRow line={l} />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="space-y-6">
              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.14em] text-tobacco">Cupom</p>
                <CouponBox subtotal={subtotal} />
              </div>
              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.14em] text-tobacco">Simular frete</p>
                <ShippingPicker products={purchasable.map((l) => l.product)} compact />
              </div>
              <Totals t={t} couponCode={coupon?.code} />
              <Button block size="lg" disabled={!purchasable.length} onClick={() => nav('/checkout')}>
                Finalizar compra ({purchasable.length})
              </Button>
              {!purchasable.length && <p className="text-center text-[12.5px] text-oxblood">Selecione ao menos uma peça com reserva ativa.</p>}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Checkout ----------
const STEPS = [
  { id: 1, label: 'Revisão', icon: ShoppingBag },
  { id: 2, label: 'Seus dados', icon: User },
  { id: 3, label: 'Endereço', icon: MapPin },
  { id: 4, label: 'Entrega', icon: Truck },
  { id: 5, label: 'Resumo', icon: Package },
];

export function CheckoutPage() {
  useDocumentTitle('Finalizar compra');
  const nav = useNavigate();
  const { lines, purchasable, subtotal, loading, isEmpty } = useCartDetails();
  const { coupon, code } = useCouponState(subtotal);
  const ck = useCheckout();
  const session = useSession();
  const clearPurchased = useCart((s) => s.clearPurchased);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const t = computeTotals(subtotal, ck.shipping, coupon);
  const isPickup = ck.shipping?.method === 'retirada';

  useEffect(() => {
    if (session.customer && ck.mode === null) connectDemoAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner />;
  if (isEmpty || (!purchasable.length && !placing))
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Não há peças reservadas para finalizar" action={<Link to="/carrinho"><Button>Voltar ao carrinho</Button></Link>}>
          {lines.length ? 'As reservas das peças do seu carrinho expiraram. Reserve-as novamente no carrinho.' : 'Adicione peças ao carrinho para continuar.'}
        </EmptyState>
      </div>
    );

  async function connectDemoAccount() {
    const c = await services.customers.demoAccount();
    session.setCustomer(c);
    ck.set({ mode: 'conta-demo', buyer: { name: c.name.replace(' (conta demo)', ''), email: c.email, phone: c.phone, cpf: '000.000.000-00' }, address: c.address ?? ck.address, cep: c.address?.cep ?? ck.cep });
    toast.success('Conta demonstrativa conectada', 'Dados preenchidos automaticamente. Nenhuma senha é necessária no protótipo.');
  }

  const validateBuyer = () => {
    const e: Record<string, string> = {};
    if (ck.buyer.name.trim().split(' ').length < 2) e.name = 'Informe nome e sobrenome.';
    if (!/^\S+@\S+\.\S+$/.test(ck.buyer.email)) e.email = 'E-mail inválido.';
    if (ck.buyer.phone.replace(/\D/g, '').length < 10) e.phone = 'Telefone incompleto.';
    if (ck.buyer.cpf && ck.buyer.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF incompleto (use dados fictícios).';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validateAddress = () => {
    const a = ck.address;
    const e: Record<string, string> = {};
    if (a.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP inválido.';
    if (!a.street) e.street = 'Informe a rua.';
    if (!a.number) e.number = 'Informe o número.';
    if (!a.city) e.city = 'Informe a cidade.';
    if (!a.state) e.state = 'UF';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const next = () => {
    if (step === 2 && !validateBuyer()) return;
    if (step === 3 && !validateAddress()) return;
    if (step === 4 && !ck.shipping) return toast.error('Escolha a entrega', 'Calcule o frete e selecione uma modalidade.');
    setStep((s) => Math.min(5, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const lookup = async (cep: string) => {
    ck.set({ address: { ...ck.address, cep } });
    if (cep.replace(/\D/g, '').length === 8) {
      setCepLoading(true);
      const r = await services.shipping.lookupCep(cep);
      setCepLoading(false);
      if (r) ck.set({ address: { ...useCheckout.getState().address, ...r, number: useCheckout.getState().address.number }, cep });
    }
  };
  const place = async () => {
    setPlacing(true);
    try {
      const customer = ck.mode === 'conta-demo' && session.customer ? session.customer : await services.customers.upsertGuest(ck.buyer, `${ck.address.city}, ${ck.address.state}`);
      const order = await services.orders.create({
        sessionId: session.sessionId,
        customerId: customer.id,
        buyer: ck.buyer,
        address: isPickup ? undefined : ck.address,
        productIds: purchasable.map((l) => l.product.id),
        shipping: ck.shipping!,
        couponCode: code ?? undefined,
      });
      clearPurchased(order.items.map((i) => i.productId));
      nav(`/pedido/${order.code}/pagamento`);
    } catch (e) {
      toast.error('Não foi possível criar o pedido', (e as Error).message);
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Carrinho', to: '/carrinho' }, { label: 'Finalizar compra' }]} />
      <h1 className="mt-4 font-serif text-[2.4rem] leading-none text-walnut">Finalizar compra</h1>
      <ol className="mt-8 flex gap-1 overflow-x-auto pb-2" aria-label="Etapas do checkout">
        {[...STEPS, { id: 6, label: 'Pagamento', icon: Check }].map((s) => (
          <li key={s.id} className="flex min-w-fit flex-1 items-center gap-2">
            <button disabled={s.id >= step || s.id === 6} onClick={() => setStep(s.id)} className={clsx('flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium transition', s.id === step ? 'bg-walnut text-cream' : s.id < step ? 'bg-sage/15 text-[#45502f] hover:bg-sage/25' : 'text-tobacco')}>
              {s.id < step ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              {s.label}
            </button>
            {s.id < 6 && <span className="h-px min-w-4 flex-1 bg-sand" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="animate-fadeIn" key={step}>
          {step === 1 && (
            <Card>
              <h2 className="mb-5 font-serif text-2xl text-walnut">Revise as peças</h2>
              <div className="divide-y divide-sand/70">
                {lines.map((l) => (
                  <div key={l.product.id} className="py-4">
                    <CartLineRow line={l} />
                  </div>
                ))}
              </div>
            </Card>
          )}
          {step === 2 && (
            <Card className="space-y-6">
              <h2 className="font-serif text-2xl text-walnut">Como deseja continuar?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => ck.set({ mode: 'visitante' })} className={clsx('rounded-2xl border p-4 text-left transition', ck.mode === 'visitante' ? 'border-walnut bg-walnut/[.04]' : 'border-sand hover:border-tobacco')}>
                  <p className="font-semibold text-walnut">Comprar como visitante</p>
                  <p className="mt-1 text-[13px] text-tobacco">Sem cadastro: informe apenas os dados para contato.</p>
                </button>
                <button onClick={connectDemoAccount} className={clsx('rounded-2xl border p-4 text-left transition', ck.mode === 'conta-demo' ? 'border-walnut bg-walnut/[.04]' : 'border-sand hover:border-tobacco')}>
                  <p className="font-semibold text-walnut">Usar conta demonstrativa</p>
                  <p className="mt-1 text-[13px] text-tobacco">Entra como “Lúcia Ferraz” (fictícia), com dados já preenchidos.</p>
                </button>
              </div>
              {ck.mode && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo" required error={errors.name} className="sm:col-span-2">
                    <Input value={ck.buyer.name} onChange={(e) => ck.set({ buyer: { ...ck.buyer, name: e.target.value } })} autoComplete="off" />
                  </Field>
                  <Field label="E-mail" required error={errors.email}>
                    <Input type="email" value={ck.buyer.email} onChange={(e) => ck.set({ buyer: { ...ck.buyer, email: e.target.value } })} autoComplete="off" />
                  </Field>
                  <Field label="Telefone" required error={errors.phone}>
                    <Input value={ck.buyer.phone} inputMode="tel" onChange={(e) => ck.set({ buyer: { ...ck.buyer, phone: maskPhone(e.target.value) } })} autoComplete="off" />
                  </Field>
                  <Field label="CPF (opcional)" error={errors.cpf} hint="Use um número fictício: nenhum dado é enviado." className="sm:col-span-2">
                    <Input value={ck.buyer.cpf} inputMode="numeric" onChange={(e) => ck.set({ buyer: { ...ck.buyer, cpf: maskCpf(e.target.value) } })} autoComplete="off" />
                  </Field>
                </div>
              )}
              <DemoNotice title="Não use dados pessoais reais">Os dados ficam apenas no armazenamento local deste navegador e podem ser apagados em “Restaurar demonstração”.</DemoNotice>
            </Card>
          )}
          {step === 3 && (
            <Card className="space-y-5">
              <h2 className="font-serif text-2xl text-walnut">Endereço de entrega</h2>
              <div className="grid gap-4 sm:grid-cols-6">
                <Field label="CEP" required error={errors.cep} className="sm:col-span-2" hint={cepLoading ? 'Buscando endereço (simulado)…' : 'Preenchimento automático simulado'}>
                  <Input value={ck.address.cep} inputMode="numeric" onChange={(e) => lookup(maskCep(e.target.value))} />
                </Field>
                <Field label="Rua" required error={errors.street} className="sm:col-span-4">
                  <Input value={ck.address.street} onChange={(e) => ck.set({ address: { ...ck.address, street: e.target.value } })} />
                </Field>
                <Field label="Número" required error={errors.number} className="sm:col-span-2">
                  <Input value={ck.address.number} onChange={(e) => ck.set({ address: { ...ck.address, number: e.target.value } })} />
                </Field>
                <Field label="Complemento" className="sm:col-span-4">
                  <Input value={ck.address.complement ?? ''} onChange={(e) => ck.set({ address: { ...ck.address, complement: e.target.value } })} />
                </Field>
                <Field label="Bairro" className="sm:col-span-2">
                  <Input value={ck.address.district} onChange={(e) => ck.set({ address: { ...ck.address, district: e.target.value } })} />
                </Field>
                <Field label="Cidade" required error={errors.city} className="sm:col-span-3">
                  <Input value={ck.address.city} onChange={(e) => ck.set({ address: { ...ck.address, city: e.target.value } })} />
                </Field>
                <Field label="UF" required error={errors.state} className="sm:col-span-1">
                  <Input value={ck.address.state} maxLength={2} onChange={(e) => ck.set({ address: { ...ck.address, state: e.target.value.toUpperCase() } })} />
                </Field>
              </div>
            </Card>
          )}
          {step === 4 && (
            <Card className="space-y-4">
              <h2 className="font-serif text-2xl text-walnut">Modalidade de entrega</h2>
              <p className="text-sm text-tobacco">Cálculo simulado para o CEP informado. Móveis grandes seguem por transportadora especializada.</p>
              <ShippingPickerAuto cep={ck.address.cep} products={purchasable.map((l) => l.product)} />
            </Card>
          )}
          {step === 5 && (
            <Card className="space-y-6">
              <h2 className="font-serif text-2xl text-walnut">Resumo do pedido</h2>
              <div className="grid gap-4 text-[14px] sm:grid-cols-2">
                <div className="rounded-xl bg-cream-200/60 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-tobacco">Comprador</p>
                  <p className="text-walnut">{ck.buyer.name}</p>
                  <p className="text-tobacco">{ck.buyer.email} · {ck.buyer.phone}</p>
                  <p className="mt-1 text-[12px] text-tobacco">{ck.mode === 'conta-demo' ? 'Conta demonstrativa' : 'Compra como visitante'}</p>
                </div>
                <div className="rounded-xl bg-cream-200/60 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-tobacco">{isPickup ? 'Retirada' : 'Entrega'}</p>
                  <p className="text-walnut">{ck.shipping?.label}</p>
                  <p className="text-tobacco">{isPickup ? ck.shipping?.description : `${ck.address.street}, ${ck.address.number} · ${ck.address.city}/${ck.address.state}`}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.14em] text-tobacco">Cupom de desconto</p>
                <CouponBox subtotal={subtotal} />
              </div>
              <div className="divide-y divide-sand/70">
                {purchasable.map((l) => (
                  <div key={l.product.id} className="flex items-center gap-3 py-3">
                    <Img src={l.product.photos[0]} alt="" className="h-14 w-14 rounded-lg" />
                    <span className="flex-1 font-serif text-lg leading-tight text-walnut">{l.product.name}</span>
                    <span className="text-sm font-semibold text-walnut">{brl(l.product.price)}</span>
                  </div>
                ))}
              </div>
              <DemoNotice title="Pagamento demonstrativo">Na próxima tela será exibido um PIX ilustrativo. Nenhuma cobrança real é gerada e o código exibido não pode ser pago.</DemoNotice>
            </Card>
          )}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => (step === 1 ? nav('/carrinho') : setStep(step - 1))}>
              ← {step === 1 ? 'Carrinho' : 'Voltar'}
            </Button>
            {step < 5 ? (
              <Button onClick={next} disabled={step === 2 && !ck.mode} size="lg">
                Continuar
              </Button>
            ) : (
              <Button size="lg" variant="brass" loading={placing} onClick={place}>
                Ir para o pagamento PIX
              </Button>
            )}
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4">
            <p className="font-serif text-xl text-walnut">Seu pedido</p>
            <ul className="space-y-1 text-[13.5px]">
              {purchasable.map((l) => (
                <li key={l.product.id} className="flex justify-between gap-3">
                  <span className="truncate text-walnut">{l.product.name}</span>
                  <span className="shrink-0 tabular-nums text-tobacco">{mmss(l.remainingMs)}</span>
                </li>
              ))}
            </ul>
            <Totals t={t} couponCode={coupon?.code} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ShippingPickerAuto({ cep, products }: { cep: string; products: Parameters<typeof services.shipping.quote>[1] }) {
  const set = useCheckout((s) => s.set);
  useEffect(() => {
    set({ cep });
  }, [cep, set]);
  return <ShippingPicker key={cep} products={products} />;
}

// ---------- PIX simulado ----------
function IllustrativeQr({ seed }: { seed: string }) {
  // padrão decorativo gerado a partir do código: NÃO é um QR Code válido
  const cells = useMemo(() => {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const out: boolean[] = [];
    for (let i = 0; i < 25 * 25; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      out.push((h >> 16) % 3 === 0);
    }
    return out;
  }, [seed]);
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [18, 0], [0, 18]]) if (inBox(ox, oy)) {
      const dx = x - ox, dy = y - oy;
      return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
    }
    return -1;
  };
  return (
    <div className="relative">
      <svg viewBox="0 0 29 29" className="h-56 w-56 rounded-xl bg-white p-2" role="img" aria-label="QR Code ilustrativo, sem validade para pagamento">
        {cells.map((on, i) => {
          const x = i % 25, y = Math.floor(i / 25);
          const f = finder(x, y);
          const fill = f === -1 ? on : f === 1;
          return fill ? <rect key={i} x={x + 2} y={y + 2} width="1" height="1" fill="#22160f" /> : null;
        })}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="rotate-[-12deg] rounded-md border-2 border-oxblood bg-cream-50/90 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-oxblood">Ilustrativo</span>
      </span>
    </div>
  );
}

export function PaymentPage() {
  const { code = '' } = useParams();
  const nav = useNavigate();
  const { data: order, loading } = useQuery(() => services.orders.get(code), [code]);
  const [pix, setPix] = useState<{ code: string; expiresAt: string; amount: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const now = useNow(1000);
  useDocumentTitle(`Pagamento ${code}`);
  useEffect(() => {
    if (order?.status === 'aguardando-pagamento' && !pix) services.payments.createPixCharge(order.id).then(setPix);
  }, [order, pix]);
  if (loading && !order) return <Spinner />;
  if (!order) return <NotFoundPage />;
  if (order.status !== 'aguardando-pagamento' && order.payment.status === 'aprovado') {
    return <OrderConfirmation order={order} />;
  }
  const remaining = new Date(order.payment.expiresAt ?? 0).getTime() - now;
  const expired = order.status === 'cancelado' || remaining <= 0;
  const simulate = async () => {
    setPaying(true);
    try {
      await services.payments.simulateApproval(order.id);
      toast.success('Pagamento aprovado (simulação)', `Pedido ${order.code} confirmado.`);
      nav(`/pedido/${order.code}`, { replace: true });
    } catch (e) {
      toast.error('Falha na simulação', (e as Error).message);
      setPaying(false);
    }
  };
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-[2.3rem] leading-none text-walnut">Pagamento via PIX</h1>
        <DemoTag>Simulação · sem cobrança real</DemoTag>
      </div>
      <Card className="overflow-hidden !p-0">
        <div className="grid sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center gap-3 bg-cream-200/70 p-6">
            {expired ? (
              <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl bg-cream-50 text-center text-tobacco">
                <AlertCircle className="h-8 w-8 text-oxblood" />
                <p className="mt-2 font-serif text-xl text-walnut">PIX expirado</p>
              </div>
            ) : pix ? (
              <IllustrativeQr seed={pix.code} />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-tobacco" /></div>
            )}
            <p className="max-w-[14rem] text-center text-[11.5px] text-tobacco">QR Code meramente ilustrativo. Não aponte a câmera do seu banco: não há cobrança vinculada.</p>
          </div>
          <div className="min-w-0 space-y-5 p-6">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[.14em] text-tobacco">Pedido</span>
              <span className="font-semibold text-walnut">{order.code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[.14em] text-tobacco">Valor</span>
              <span className="font-serif text-3xl text-walnut">{brl(order.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[.14em] text-tobacco">Status</span>
              {expired ? <OrderStatusBadge status="cancelado" /> : <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a5a0e]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Pagamento pendente</span>}
            </div>
            {!expired && (
              <div className="flex items-center justify-between rounded-xl bg-brass/10 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-walnut"><Clock className="h-4 w-4 text-brass" /> Expira em</span>
                <span className="font-mono text-xl font-semibold tabular-nums text-walnut">{mmss(remaining)}</span>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[.14em] text-tobacco">Código PIX fictício</p>
              <div className="flex gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-dashed border-sand bg-cream-50 px-3 py-2.5 text-[12.5px] text-tobacco">{pix?.code ?? 'Gerando…'}</code>
                <Button variant="secondary" size="sm" className="!h-10" icon={<Copy className="h-4 w-4" />} disabled={!pix} onClick={() => navigator.clipboard?.writeText(pix!.code).then(() => toast.info('Código copiado', 'Lembre-se: é um código de demonstração, sem validade.'))}>
                  Copiar
                </Button>
              </div>
            </div>
            {expired ? (
              <div className="space-y-2">
                <p className="text-sm text-tobacco">O prazo de {PIX_MINUTES} minutos terminou e as peças foram liberadas.</p>
                <Link to="/loja"><Button block variant="secondary">Voltar ao acervo</Button></Link>
              </div>
            ) : (
              <Button block size="lg" variant="brass" loading={paying} onClick={simulate} icon={<CheckCircle2 className="h-4 w-4" />}>
                Simular pagamento aprovado
              </Button>
            )}
          </div>
        </div>
      </Card>
      <DemoNotice title="Como funcionará na versão definitiva" className="mt-6">
        O pedido será registrado no servidor, um provedor PIX gerará a cobrança real e a confirmação chegará por webhook. Aqui, o botão acima apenas simula essa confirmação.
      </DemoNotice>
    </div>
  );
}

export function OrderConfirmation({ order }: { order: Order }) {
  const customer = useSession((s) => s.customer);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/15 text-sage"><CheckCircle2 className="h-8 w-8" /></span>
        <p className="mt-5 text-[11.5px] font-semibold uppercase tracking-[.22em] text-brass">Pedido {order.code}</p>
        <h1 className="mt-2 font-serif text-[2.6rem] leading-tight text-walnut">{order.status === 'cancelado' ? 'Pedido cancelado' : 'Obrigado pela sua compra!'}</h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-tobacco">
          {order.status === 'cancelado' ? 'Este pedido foi cancelado e as peças voltaram ao acervo.' : 'Esta é uma confirmação de demonstração. Em produção você receberia um e-mail e uma mensagem com o acompanhamento.'}
        </p>
        <DemoTag className="mt-3">E-mail e WhatsApp não são enviados no protótipo</DemoTag>
      </div>
      <Card className="mt-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-serif text-xl text-walnut">Situação</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <ol className="relative space-y-4 border-l border-sand pl-5">
          {order.history.map((h, i) => (
            <li key={i}>
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brass" />
              <p className="text-sm font-semibold text-walnut">{orderStatusLabel[h.status]}</p>
              <p className="text-[13px] text-tobacco">{h.note}</p>
              <p className="text-[11.5px] text-tobacco/70">{dateTime(h.at)}</p>
            </li>
          ))}
        </ol>
        <div className="divide-y divide-sand/70 border-t border-sand/70">
          {order.items.map((i) => (
            <div key={i.productId} className="flex items-center gap-3 py-3">
              <Img src={i.photo} alt="" className="h-14 w-14 rounded-lg" />
              <Link to={`/produto/${i.productId}`} className="flex-1 font-serif text-lg leading-tight text-walnut hover:underline">{i.name}</Link>
              <span className="text-sm font-semibold">{brl(i.price)}</span>
            </div>
          ))}
        </div>
        <dl className="space-y-1.5 border-t border-sand/70 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-tobacco">Subtotal</dt><dd>{brl(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-sage"><dt>Desconto ({order.couponCode})</dt><dd>− {brl(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-tobacco">{order.shippingLabel}</dt><dd>{order.shipping ? brl(order.shipping) : 'Grátis'}</dd></div>
          <div className="flex justify-between pt-2 font-semibold"><dt>Total pago (simulado)</dt><dd className="font-serif text-2xl">{brl(order.total)}</dd></div>
        </dl>
      </Card>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/loja"><Button variant="secondary">Continuar explorando</Button></Link>
        {customer && <Link to="/conta"><Button variant="secondary">Meus pedidos</Button></Link>}
        <Link to={`/admin/pedidos/${order.id}`}><Button variant="ghost">Ver no painel administrativo →</Button></Link>
      </div>
    </div>
  );
}

export function OrderPage() {
  const { code = '' } = useParams();
  const { data: order, loading } = useQuery(() => services.orders.get(code), [code]);
  useDocumentTitle(`Pedido ${code}`);
  if (loading && !order) return <Spinner />;
  if (!order) return <NotFoundPage />;
  if (order.status === 'aguardando-pagamento') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-serif text-3xl text-walnut">Pedido {order.code} aguardando pagamento</p>
        <Link to={`/pedido/${order.code}/pagamento`} className="mt-6 inline-block"><Button>Ir para o pagamento</Button></Link>
      </div>
    );
  }
  return <OrderConfirmation order={order} />;
}

// ---------- Conta ----------
export function AccountPage() {
  useDocumentTitle('Minha conta');
  const { customer, setCustomer } = useSession();
  const { data: orders } = useQuery(async () => (customer ? services.orders.byCustomer(customer.id) : []), [customer?.id]);
  const [lookup, setLookup] = useState('');
  const nav = useNavigate();
  const login = async () => {
    const c = await services.customers.demoAccount();
    setCustomer(c);
    toast.success('Você entrou na conta demonstrativa', 'Nenhuma senha é necessária no protótipo.');
  };
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Minha conta' }]} />
      <h1 className="mb-8 mt-4 font-serif text-[2.6rem] leading-none text-walnut">Minha conta</h1>
      {!customer ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="font-serif text-2xl text-walnut">Entrar</h2>
            <p className="text-sm text-tobacco">O protótipo não possui autenticação real. Use a conta demonstrativa para ver pedidos e preencher o checkout automaticamente.</p>
            <Button onClick={login} icon={<User className="h-4 w-4" />}>Entrar com a conta demonstrativa</Button>
            <DemoTag>Login simulado</DemoTag>
          </Card>
          <Card className="space-y-4">
            <h2 className="font-serif text-2xl text-walnut">Consultar pedido</h2>
            <p className="text-sm text-tobacco">Comprou como visitante? Informe o código do pedido (ex.: PED-1006).</p>
            <form onSubmit={(e) => (e.preventDefault(), nav(`/pedido/${lookup.trim().toUpperCase()}`))} className="flex gap-2">
              <Input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="PED-0000" />
              <Button type="submit" variant="secondary">Consultar</Button>
            </form>
          </Card>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <Card className="space-y-3 self-start">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-walnut font-serif text-2xl text-cream">{customer.name[0]}</span>
            <p className="font-serif text-2xl text-walnut">{customer.name}</p>
            <p className="text-sm text-tobacco">{customer.email}<br />{customer.phone}<br />{customer.city}</p>
            <Button variant="secondary" size="sm" onClick={() => (setCustomer(null), useCheckout.getState().reset(), toast.info('Você saiu da conta demonstrativa'))}>Sair</Button>
          </Card>
          <div>
            <h2 className="mb-4 font-serif text-2xl text-walnut">Meus pedidos</h2>
            {!orders?.length ? (
              <EmptyState icon={<Package className="h-6 w-6" />} title="Nenhum pedido ainda" action={<Link to="/loja"><Button>Explorar o acervo</Button></Link>}>Finalize uma compra demonstrativa para vê-la aqui.</EmptyState>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <Link key={o.id} to={o.status === 'aguardando-pagamento' ? `/pedido/${o.code}/pagamento` : `/pedido/${o.code}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-sand/60 bg-cream-50 p-4 transition hover:border-walnut">
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 3).map((i) => <Img key={i.productId} src={i.photo} alt="" className="h-12 w-12 rounded-full border-2 border-cream-50" />)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-walnut">{o.code}</p>
                      <p className="text-[12.5px] text-tobacco">{dateTime(o.createdAt)} · {o.items.length} {o.items.length === 1 ? 'peça' : 'peças'}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <span className="font-serif text-xl text-walnut">{brl(o.total)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
