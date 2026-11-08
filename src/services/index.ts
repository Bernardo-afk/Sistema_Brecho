// Ponto único de troca: hoje todos os serviços são mocks locais.
// Na versão definitiva, substitua cada item por uma implementação HTTP
// (ex.: `products: new HttpProductService(apiClient)`) mantendo os contratos.
import type { Services } from './contracts';
import { CategoryServiceMock, PanoramaServiceMock, ProductServiceMock } from './mock/catalog';
import { CouponServiceMock, CustomerServiceMock, OrderServiceMock, PaymentServiceMock, ReservationServiceMock, ShippingServiceMock } from './mock/commerce';
import { AdminServiceMock, AnalyticsServiceMock, ArticleServiceMock, FileServiceMock } from './mock/content';

export const services: Services = {
  products: ProductServiceMock,
  categories: CategoryServiceMock,
  panoramas: PanoramaServiceMock,
  reservations: ReservationServiceMock,
  coupons: CouponServiceMock,
  shipping: ShippingServiceMock,
  orders: OrderServiceMock,
  payments: PaymentServiceMock,
  customers: CustomerServiceMock,
  articles: ArticleServiceMock,
  admin: AdminServiceMock,
  files: FileServiceMock,
  analytics: AnalyticsServiceMock,
};

export { subscribe as subscribeToData, getRevision as getDataRevision } from './mock/db';
export { RESERVATION_MINUTES, PIX_MINUTES } from './mock/commerce';
export type * from './contracts';
