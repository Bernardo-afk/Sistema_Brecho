// Contratos de serviço. A interface consome apenas estas interfaces (via `services`),
// nunca o armazenamento local diretamente. Para a versão definitiva, basta criar
// implementações HTTP com as mesmas assinaturas e trocá-las em `services/index.ts`.
import type {
  AdminUser, Article, Category, Coupon, Customer, ID, Order, OrderStatus, Panorama, Product, ProductStatus,
  Reservation, ShippingMethodId, ShippingQuote, UploadedFile, Address, Hotspot,
} from '@/types/domain';

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  status?: ProductStatus | 'todos' | 'ativos';
  minPrice?: number;
  maxPrice?: number;
  era?: string;
  conservation?: string;
  sort?: 'recentes' | 'preco-asc' | 'preco-desc' | 'nome' | 'populares';
  featured?: boolean;
  isNew?: boolean;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'slug'> & { slug?: string };

export interface ProductService {
  list(filters?: ProductFilters): Promise<Product[]>;
  get(idOrSlug: string): Promise<Product | null>;
  related(productId: ID, limit?: number): Promise<Product[]>;
  create(input: ProductInput): Promise<Product>;
  update(id: ID, patch: Partial<ProductInput>): Promise<Product>;
  remove(id: ID): Promise<void>;
  setStatus(id: ID, status: ProductStatus): Promise<Product>;
  registerView(id: ID): Promise<void>;
  /** Status considerando reservas ativas (reservado) além do status salvo. */
  effectiveStatus(product: Product, reservations: Reservation[]): ProductStatus;
}

export interface CategoryService {
  list(): Promise<Category[]>;
  get(idOrSlug: string): Promise<Category | null>;
  create(input: Omit<Category, 'id'>): Promise<Category>;
  update(id: ID, patch: Partial<Category>): Promise<Category>;
  remove(id: ID): Promise<{ ok: boolean; reason?: string }>;
}

export interface PanoramaService {
  list(): Promise<Panorama[]>;
  get(id: ID): Promise<Panorama | null>;
  saveHotspots(id: ID, hotspots: Hotspot[]): Promise<Panorama>;
  update(id: ID, patch: Partial<Panorama>): Promise<Panorama>;
}

export interface ReservationService {
  /** ATENÇÃO (mock): a reserva vive no navegador e NÃO garante exclusividade entre dispositivos. */
  reserve(productId: ID, sessionId: string): Promise<Reservation>;
  release(productId: ID, sessionId: string): Promise<void>;
  listActive(): Promise<Reservation[]>;
  forSession(sessionId: string): Promise<Reservation[]>;
  /** Expira reservas vencidas; retorna as que expiraram nesta varredura. */
  sweep(): Promise<Reservation[]>;
  /** Utilitário de demonstração: força a expiração em poucos segundos. */
  fastForward(productId: ID, sessionId: string, secondsLeft: number): Promise<void>;
}

export interface CouponValidation {
  ok: boolean;
  coupon?: Coupon;
  message: string;
}

export interface CouponService {
  list(): Promise<Coupon[]>;
  validate(code: string, subtotal: number): Promise<CouponValidation>;
  computeDiscount(coupon: Coupon, subtotal: number, shipping: number): { discount: number; freeShipping: boolean };
  create(input: Omit<Coupon, 'id' | 'used'>): Promise<Coupon>;
  update(id: ID, patch: Partial<Coupon>): Promise<Coupon>;
  remove(id: ID): Promise<void>;
}

export interface ShippingService {
  /** Simulação: valores fictícios calculados localmente pela região do CEP. */
  quote(cep: string, products: Product[]): Promise<ShippingQuote[]>;
  lookupCep(cep: string): Promise<Partial<Address> | null>;
}

export interface CheckoutInput {
  sessionId: string;
  customerId?: ID;
  buyer: { name: string; email: string; phone: string; cpf?: string };
  address?: Address;
  productIds: ID[];
  shipping: ShippingQuote;
  couponCode?: string;
}

export interface OrderService {
  list(): Promise<Order[]>;
  get(idOrCode: string): Promise<Order | null>;
  byCustomer(customerId: ID): Promise<Order[]>;
  create(input: CheckoutInput): Promise<Order>;
  updateStatus(id: ID, status: OrderStatus, note: string, by: string): Promise<Order>;
}

export interface PaymentService {
  /** Gera uma cobrança PIX FICTÍCIA. O código é inválido para pagamentos reais. */
  createPixCharge(orderId: ID): Promise<{ code: string; expiresAt: string; amount: number }>;
  simulateApproval(orderId: ID): Promise<Order>;
}

export interface CustomerService {
  list(): Promise<Customer[]>;
  get(id: ID): Promise<Customer | null>;
  demoAccount(): Promise<Customer>;
  upsertGuest(buyer: { name: string; email: string; phone: string }, city: string): Promise<Customer>;
}

export interface ArticleService {
  list(opts?: { publicOnly?: boolean }): Promise<Article[]>;
  get(idOrSlug: string): Promise<Article | null>;
  create(input: Omit<Article, 'id'>): Promise<Article>;
  update(id: ID, patch: Partial<Article>): Promise<Article>;
  remove(id: ID): Promise<void>;
}

export interface AdminService {
  listUsers(): Promise<AdminUser[]>;
  createUser(input: Omit<AdminUser, 'id'>): Promise<AdminUser>;
  updateUser(id: ID, patch: Partial<AdminUser>): Promise<AdminUser>;
  removeUser(id: ID): Promise<void>;
  resetDemo(): Promise<void>;
}

export interface FileService {
  /** Mock: guarda o arquivo no IndexedDB do navegador. Futuro: storage remoto (S3, GCS...). */
  upload(file: File): Promise<{ ref: string; meta: UploadedFile }>;
  resolve(ref: string): Promise<string | null>;
  remove(ref: string): Promise<void>;
}

export interface AnalyticsSnapshot {
  revenue: number;
  salesCount: number;
  ordersPending: number;
  productsAvailable: number;
  productsSold: number;
  activeReservations: number;
  averageTicket: number;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  mostViewed: { product: Product; views: number }[];
  bestSellingCategories: { category: string; count: number; revenue: number }[];
  recentSold: { product: Product; soldAt: string; orderCode: string }[];
}

export interface AnalyticsService {
  snapshot(): Promise<AnalyticsSnapshot>;
}

export interface Services {
  products: ProductService;
  categories: CategoryService;
  panoramas: PanoramaService;
  reservations: ReservationService;
  coupons: CouponService;
  shipping: ShippingService;
  orders: OrderService;
  payments: PaymentService;
  customers: CustomerService;
  articles: ArticleService;
  admin: AdminService;
  files: FileService;
  analytics: AnalyticsService;
}

export type { ShippingMethodId };
