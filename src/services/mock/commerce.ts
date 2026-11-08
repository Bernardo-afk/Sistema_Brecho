import type { CouponService, CustomerService, OrderService, PaymentService, ReservationService, ShippingService } from '../contracts';
import type { Coupon, Order, OrderStatus, Product, Reservation, ShippingQuote } from '@/types/domain';
import { delay, getDb, mutate, uid } from './db';

export const RESERVATION_MINUTES = 15;
export const PIX_MINUTES = 30;

const nowIso = () => new Date().toISOString();
const isActive = (r: Reservation, t = Date.now()) => r.status === 'ativa' && new Date(r.expiresAt).getTime() > t;

function cancelOrder(o: Order, note: string) {
  o.status = 'cancelado';
  o.payment.status = o.payment.status === 'pendente' ? 'expirado' : o.payment.status;
  o.history.push({ at: nowIso(), status: 'cancelado', note, by: 'Sistema' });
}

export const ReservationServiceMock: ReservationService = {
  async reserve(productId, sessionId) {
    const r = mutate((d) => {
      const p = d.products.find((x) => x.id === productId);
      if (!p) throw new Error('Produto não encontrado.');
      if (p.status === 'vendido') throw new Error('Esta peça já foi vendida.');
      if (p.status === 'arquivado') throw new Error('Esta peça não está mais disponível.');
      const t = Date.now();
      const existing = d.reservations.find((x) => x.productId === productId && isActive(x, t));
      if (existing && existing.sessionId !== sessionId) throw new Error('Esta peça está reservada por outro cliente no momento.');
      if (existing) return existing;
      const res: Reservation = {
        id: uid('res'),
        productId,
        sessionId,
        createdAt: new Date(t).toISOString(),
        expiresAt: new Date(t + RESERVATION_MINUTES * 60000).toISOString(),
        status: 'ativa',
      };
      d.reservations.push(res);
      return res;
    });
    return delay(r, 200);
  },

  async release(productId, sessionId) {
    mutate((d) => {
      d.reservations.forEach((r) => {
        if (r.productId === productId && r.sessionId === sessionId && r.status === 'ativa') r.status = 'cancelada';
      });
    });
    return delay(undefined, 80);
  },

  async listActive() {
    const t = Date.now();
    return delay(getDb().reservations.filter((r) => isActive(r, t)), 40);
  },

  async forSession(sessionId) {
    return delay(getDb().reservations.filter((r) => r.sessionId === sessionId), 40);
  },

  async sweep() {
    const t = Date.now();
    const due = getDb().reservations.filter((r) => r.status === 'ativa' && new Date(r.expiresAt).getTime() <= t);
    if (!due.length) return [];
    const expired = mutate((d) => {
      const out: Reservation[] = [];
      for (const r of d.reservations) {
        if (r.status === 'ativa' && new Date(r.expiresAt).getTime() <= t) {
          r.status = 'expirada';
          out.push({ ...r });
          // pedido pendente vinculado à reserva: PIX expirou, pedido cancelado e peça liberada
          d.orders
            .filter((o) => o.status === 'aguardando-pagamento' && o.items.some((i) => i.productId === r.productId))
            .forEach((o) => cancelOrder(o, 'PIX expirado (simulação). Peça liberada automaticamente.'));
        }
      }
      return out;
    });
    return expired;
  },

  async fastForward(productId, sessionId, secondsLeft) {
    mutate((d) => {
      d.reservations.forEach((r) => {
        if (r.productId === productId && r.sessionId === sessionId && r.status === 'ativa') r.expiresAt = new Date(Date.now() + secondsLeft * 1000).toISOString();
      });
    });
  },
};

export const CouponServiceMock: CouponService = {
  async list() {
    return delay(getDb().coupons);
  },
  async validate(code, subtotal) {
    const c = getDb().coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
    let result: { ok: boolean; coupon?: Coupon; message: string };
    if (!c) result = { ok: false, message: 'Cupom não encontrado.' };
    else if (!c.active) result = { ok: false, message: 'Este cupom está desativado.' };
    else if (new Date(c.validUntil + 'T23:59:59') < new Date()) result = { ok: false, message: `Cupom expirado em ${new Date(c.validUntil + 'T12:00:00').toLocaleDateString('pt-BR')}.` };
    else if (c.used >= c.usageLimit) result = { ok: false, message: 'Limite de utilização deste cupom foi atingido.' };
    else if (subtotal < c.minSubtotal) result = { ok: false, message: `Válido para compras a partir de ${c.minSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.` };
    else result = { ok: true, coupon: c, message: c.description };
    return delay(result, 350);
  },
  computeDiscount(coupon, subtotal, shipping) {
    if (coupon.type === 'percentual') return { discount: Math.round(subtotal * coupon.value) / 100, freeShipping: false };
    if (coupon.type === 'valor-fixo') return { discount: Math.min(coupon.value, subtotal), freeShipping: false };
    return { discount: shipping, freeShipping: true };
  },
  async create(input) {
    const c = mutate((d) => {
      if (d.coupons.some((x) => x.code.toUpperCase() === input.code.toUpperCase())) throw new Error('Já existe um cupom com este código.');
      const coupon = { ...input, code: input.code.toUpperCase(), id: uid('cup'), used: 0 };
      d.coupons.push(coupon);
      return coupon;
    });
    return delay(c);
  },
  async update(id, patch) {
    const c = mutate((d) => {
      const i = d.coupons.findIndex((x) => x.id === id);
      d.coupons[i] = { ...d.coupons[i], ...patch, id, code: (patch.code ?? d.coupons[i].code).toUpperCase() };
      return d.coupons[i];
    });
    return delay(c);
  },
  async remove(id) {
    mutate((d) => (d.coupons = d.coupons.filter((c) => c.id !== id)));
    return delay(undefined);
  },
};

const REGIONS: Record<string, { uf: string; city: string; factor: number; days: number }> = {
  '0': { uf: 'SP', city: 'São Paulo', factor: 1, days: 2 },
  '1': { uf: 'SP', city: 'Campinas', factor: 1.1, days: 3 },
  '2': { uf: 'RJ', city: 'Rio de Janeiro', factor: 1.35, days: 4 },
  '3': { uf: 'MG', city: 'Belo Horizonte', factor: 1.4, days: 4 },
  '4': { uf: 'BA', city: 'Salvador', factor: 1.9, days: 7 },
  '5': { uf: 'PE', city: 'Recife', factor: 2.1, days: 8 },
  '6': { uf: 'CE', city: 'Fortaleza', factor: 2.3, days: 9 },
  '7': { uf: 'DF', city: 'Brasília', factor: 1.7, days: 6 },
  '8': { uf: 'PR', city: 'Curitiba', factor: 1.45, days: 4 },
  '9': { uf: 'RS', city: 'Porto Alegre', factor: 1.6, days: 5 },
};

export const ShippingServiceMock: ShippingService = {
  async lookupCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return delay(null, 200);
    const r = REGIONS[digits[0]];
    return delay({ cep: `${digits.slice(0, 5)}-${digits.slice(5)}`, city: r.city, state: r.uf, district: 'Bairro (preenchido pela simulação)', street: 'Rua (preenchida pela simulação)' }, 450);
  },
  async quote(cep, products: Product[]) {
    const digits = cep.replace(/\D/g, '');
    const r = REGIONS[digits[0] ?? '0'] ?? REGIONS['0'];
    const weight = products.reduce((s, p) => s + p.weightKg, 0);
    const bulky = products.some((p) => p.weightKg > 25 || p.dimensions.height + p.dimensions.width + p.dimensions.depth > 200);
    const quotes: ShippingQuote[] = [
      { method: 'retirada', label: 'Retirada no ateliê', description: 'Rua Fictícia das Antiguidades, 100 · São Paulo (agendar horário)', price: 0, days: [1, 2], available: true },
      {
        method: 'transportadora',
        label: 'Transportadora especializada em móveis',
        description: 'Embalagem com manta, entrega com montagem simples e seguro (simulado).',
        price: Math.round((160 + weight * 4.2) * r.factor),
        days: [r.days + 2, r.days + 6],
        available: true,
      },
      {
        method: 'correios',
        label: 'Correios (embalagem reforçada)',
        description: 'Para peças pequenas e médias.',
        price: Math.round((32 + weight * 6.5) * r.factor),
        days: [r.days, r.days + 3],
        available: !bulky && weight <= 30,
        unavailableReason: 'Indisponível para móveis grandes ou acima de 30 kg.',
      },
    ];
    return delay(quotes, 600);
  },
};

function nextCode(orders: Order[]) {
  const max = orders.reduce((m, o) => Math.max(m, Number(o.code.replace(/\D/g, '')) || 0), 1000);
  return `PED-${max + 1}`;
}

export const OrderServiceMock: OrderService = {
  async list() {
    return delay([...getDb().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async get(idOrCode) {
    return delay(getDb().orders.find((o) => o.id === idOrCode || o.code === idOrCode) ?? null);
  },
  async byCustomer(customerId) {
    return delay(getDb().orders.filter((o) => o.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async create(input) {
    let coupon: Coupon | undefined;
    const db = getDb();
    const products = input.productIds.map((id) => db.products.find((p) => p.id === id)).filter(Boolean) as Product[];
    if (!products.length) throw new Error('Nenhuma peça selecionada.');
    const t = Date.now();
    for (const p of products) {
      if (p.status !== 'disponivel') throw new Error(`"${p.name}" não está mais disponível.`);
      const other = db.reservations.find((r) => r.productId === p.id && isActive(r, t) && r.sessionId !== input.sessionId);
      if (other) throw new Error(`"${p.name}" está reservada por outro cliente.`);
    }
    const subtotal = products.reduce((s, p) => s + p.price, 0);
    let discount = 0;
    let shipping = input.shipping.price;
    if (input.couponCode) {
      const v = await CouponServiceMock.validate(input.couponCode, subtotal);
      if (!v.ok) throw new Error(v.message);
      coupon = v.coupon;
      const c = CouponServiceMock.computeDiscount(coupon!, subtotal, shipping);
      if (c.freeShipping) shipping = 0;
      else discount = c.discount;
    }
    const order = mutate((d) => {
      const code = nextCode(d.orders);
      const expiresAt = new Date(t + PIX_MINUTES * 60000).toISOString();
      const o: Order = {
        id: code.toLowerCase(),
        code,
        customerId: input.customerId ?? 'visitante',
        buyer: input.buyer,
        items: products.map((p) => ({ productId: p.id, name: p.name, price: p.price, photo: p.photos[0] })),
        subtotal,
        discount,
        shipping,
        total: Math.max(0, subtotal - discount + shipping),
        couponCode: coupon?.code,
        shippingMethod: input.shipping.method,
        shippingLabel: input.shipping.label,
        address: input.address,
        payment: { method: 'pix-simulado', status: 'pendente', expiresAt },
        status: 'aguardando-pagamento',
        history: [{ at: new Date(t).toISOString(), status: 'aguardando-pagamento', note: 'Pedido criado na loja (demonstração). Aguardando PIX simulado.', by: 'Sistema' }],
        createdAt: new Date(t).toISOString(),
      };
      d.orders.push(o);
      // as peças ficam reservadas até o vencimento do PIX
      for (const p of products) {
        const r = d.reservations.find((x) => x.productId === p.id && isActive(x, t) && x.sessionId === input.sessionId);
        if (r) r.expiresAt = expiresAt;
        else d.reservations.push({ id: uid('res'), productId: p.id, sessionId: input.sessionId, createdAt: o.createdAt, expiresAt, status: 'ativa' });
      }
      return o;
    });
    return delay(order, 700);
  },
  async updateStatus(id, status: OrderStatus, note, by) {
    const o = mutate((d) => {
      const o = d.orders.find((x) => x.id === id)!;
      if (status === 'cancelado') {
        cancelOrder(o, note || 'Cancelado pelo painel administrativo.');
        o.history[o.history.length - 1].by = by;
        // libera reservas e, se já vendido, devolve as peças ao estoque
        o.items.forEach((i) => {
          d.reservations.forEach((r) => r.productId === i.productId && r.status === 'ativa' && (r.status = 'cancelada'));
          const p = d.products.find((x) => x.id === i.productId);
          if (p && p.status === 'vendido') p.status = 'disponivel';
        });
        if (o.payment.status === 'aprovado') o.payment.status = 'estornado';
        return o;
      }
      if (status === 'pago' && o.payment.status !== 'aprovado') {
        approve(d, o, by);
      }
      o.status = status;
      if (o.history[o.history.length - 1]?.status !== status) o.history.push({ at: nowIso(), status, note: note || 'Status atualizado.', by });
      return o;
    });
    return delay(o, 300);
  },
};

function approve(d: ReturnType<typeof getDb>, o: Order, by: string) {
  o.payment.status = 'aprovado';
  o.payment.paidAt = nowIso();
  o.status = 'pago';
  o.history.push({ at: o.payment.paidAt, status: 'pago', note: 'Pagamento PIX aprovado (simulação, nenhuma cobrança real).', by });
  o.items.forEach((i) => {
    const p = d.products.find((x) => x.id === i.productId);
    if (p) p.status = 'vendido';
    d.reservations.forEach((r) => r.productId === i.productId && r.status === 'ativa' && (r.status = 'convertida'));
  });
  if (o.couponCode) {
    const c = d.coupons.find((x) => x.code === o.couponCode);
    if (c) c.used += 1;
  }
}

export const PaymentServiceMock: PaymentService = {
  async createPixCharge(orderId) {
    const o = mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId)!;
      if (!o.payment.pixCode) o.payment.pixCode = `DEMONSTRACAO-SEM-VALOR-${o.code}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      return o;
    });
    return delay({ code: o.payment.pixCode!, expiresAt: o.payment.expiresAt!, amount: o.total }, 500);
  },
  async simulateApproval(orderId) {
    const o = mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId)!;
      if (o.status !== 'aguardando-pagamento') throw new Error('Este pedido não está aguardando pagamento.');
      approve(d, o, 'Simulação de pagamento');
      return o;
    });
    return delay(o, 1200);
  },
};

export const CustomerServiceMock: CustomerService = {
  async list() {
    return delay(getDb().customers);
  },
  async get(id) {
    return delay(getDb().customers.find((c) => c.id === id) ?? null);
  },
  async demoAccount() {
    return delay(getDb().customers.find((c) => c.isDemoAccount)!, 400);
  },
  async upsertGuest(buyer, city) {
    const c = mutate((d) => {
      const existing = d.customers.find((c) => c.email.toLowerCase() === buyer.email.toLowerCase());
      if (existing) return existing;
      const c = { id: uid('cli'), ...buyer, city, createdAt: nowIso() };
      d.customers.push(c);
      return c;
    });
    return delay(c, 100);
  },
};
