// Tipos de domínio compartilhados entre interface, serviços mock e futura API.

export type ID = string;
/** Referência a um arquivo: caminho estático (`assets/...`) ou arquivo enviado (`upload:<id>`). */
export type AssetRef = string;

export type ProductStatus = 'disponivel' | 'reservado' | 'vendido' | 'arquivado';
export type Conservation = 'excelente' | 'muito-bom' | 'bom' | 'restaurado' | 'com-marcas-de-uso';

export interface Dimensions {
  height: number; // cm
  width: number; // cm
  depth: number; // cm
}

export interface Product {
  id: ID;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number; // em reais
  compareAtPrice?: number;
  categoryId: ID;
  photos: AssetRef[];
  model3d?: AssetRef | null;
  dimensions: Dimensions;
  weightKg: number;
  material: string;
  conservation: Conservation;
  era: string;
  maker: string;
  provenance: string;
  wearNotes: string;
  status: ProductStatus;
  featured: boolean;
  isNew: boolean;
  tags: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: ID;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: AssetRef;
  panoramaId?: ID | null;
  order: number;
  showInMenu: boolean;
}

export interface Hotspot {
  id: ID;
  productId: ID;
  yaw: number; // graus, longitude no panorama
  pitch: number; // graus, latitude no panorama
}

export interface NavPoint {
  id: ID;
  targetPanoramaId: ID;
  label: string;
  yaw: number;
  pitch: number;
}

export interface Panorama {
  id: ID;
  name: string;
  description: string;
  image: AssetRef;
  imageMobile?: AssetRef;
  cover: AssetRef;
  initialYaw: number;
  hotspots: Hotspot[];
  navPoints: NavPoint[];
}

export interface CartItem {
  productId: ID;
  addedAt: string;
  selected: boolean;
}

export interface Reservation {
  id: ID;
  productId: ID;
  /** Sessão (navegador) que criou a reserva. Em produção seria o usuário/carrinho no servidor. */
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  status: 'ativa' | 'expirada' | 'convertida' | 'cancelada';
}

export type CouponType = 'percentual' | 'valor-fixo' | 'frete-gratis';
export interface Coupon {
  id: ID;
  code: string;
  description: string;
  type: CouponType;
  value: number; // % ou R$, ignorado em frete grátis
  minSubtotal: number;
  validUntil: string; // ISO date
  usageLimit: number;
  used: number;
  active: boolean;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  isDemoAccount?: boolean;
  address?: Address;
}

export type ShippingMethodId = 'retirada' | 'transportadora' | 'correios';
export interface ShippingQuote {
  method: ShippingMethodId;
  label: string;
  description: string;
  price: number;
  days: [number, number];
  available: boolean;
  unavailableReason?: string;
}

export type OrderStatus = 'aguardando-pagamento' | 'pago' | 'em-separacao' | 'enviado' | 'entregue' | 'cancelado';

export interface OrderItem {
  productId: ID;
  name: string;
  price: number;
  photo: AssetRef;
}

export interface OrderHistoryEntry {
  at: string;
  status: OrderStatus;
  note: string;
  by: string;
}

export interface Order {
  id: ID;
  code: string;
  customerId: ID;
  buyer: { name: string; email: string; phone: string; cpf?: string };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  shippingMethod: ShippingMethodId;
  shippingLabel: string;
  address?: Address;
  payment: {
    method: 'pix-simulado';
    status: 'pendente' | 'aprovado' | 'expirado' | 'estornado';
    pixCode?: string;
    expiresAt?: string;
    paidAt?: string;
  };
  status: OrderStatus;
  history: OrderHistoryEntry[];
  createdAt: string;
}

export type ArticleStatus = 'rascunho' | 'agendado' | 'publicado';
export interface Article {
  id: ID;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // parágrafos separados por linha em branco
  cover: AssetRef;
  author: string;
  status: ArticleStatus;
  publishAt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
}

export type AdminRole = 'admin' | 'gerente' | 'estoque' | 'editor';
export interface AdminUser {
  id: ID;
  name: string;
  email: string;
  role: AdminRole;
  avatarColor: string;
  active: boolean;
}

export interface UploadedFile {
  id: ID;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}
