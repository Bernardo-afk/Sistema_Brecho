# Serviços mock

Contratos em `src/services/contracts.ts`, implementações em `src/services/mock/` e ponto de troca em `src/services/index.ts`.

Todas as implementações:
- leem e escrevem um único objeto `DemoDatabase` (`mock/db.ts`), persistido em `localStorage`;
- retornam cópias (`structuredClone`) com latência artificial de 100 a 1200 ms;
- notificam a interface a cada mutação (`subscribe`), e as telas se atualizam sozinhas.

| Serviço | Mock | Responsabilidade | Substituto futuro |
| --- | --- | --- | --- |
| `products` | `ProductServiceMock` | Listagem com busca, filtros e ordenação; relacionados; CRUD; status; contagem de visualizações | API de catálogo + busca (Postgres FTS / Meilisearch) |
| `categories` | `CategoryServiceMock` | CRUD e ordenação; bloqueia exclusão com produtos vinculados | API de catálogo |
| `panoramas` | `PanoramaServiceMock` | Ambientes, hotspots (yaw/pitch) e pontos de navegação | API + storage de imagens |
| `reservations` | `ReservationServiceMock` | Reserva de 15 min, liberação, varredura de expiradas, `fastForward` (demo) | Serviço transacional no servidor (lock/TTL) |
| `coupons` | `CouponServiceMock` | Validação (existência, ativo, validade, limite, mínimo) e cálculo do desconto | Regras no servidor |
| `shipping` | `ShippingServiceMock` | Cotação fictícia por região do CEP (retirada, transportadora, Correios) e CEP simulado | Melhor Envio / Frenet / transportadoras + ViaCEP |
| `orders` | `OrderServiceMock` | Criação com validação de disponibilidade, totais, histórico e mudança de status | API de pedidos |
| `payments` | `PaymentServiceMock` | Código PIX **fictício** e aprovação simulada | PSP PIX (Mercado Pago, Pagar.me, Efí…) + webhook |
| `customers` | `CustomerServiceMock` | Clientes, conta demonstrativa, cadastro de visitante | Auth + API de clientes |
| `articles` | `ArticleServiceMock` | CRUD, publicação e agendamento (visível quando a data chega) | CMS ou API própria |
| `admin` | `AdminServiceMock` | Usuários e perfis, restauração da demo | Auth com RBAC no servidor |
| `files` | `FileServiceMock` | Upload para IndexedDB, URLs temporárias (`blob:`) e remoção | Storage remoto (S3/R2/GCS) com URLs assinadas e CDN |
| `analytics` | `AnalyticsServiceMock` | KPIs e séries derivados dos mesmos dados | Consultas agregadas / data warehouse |

## Referências de arquivo (`AssetRef`)

- `assets/...`: arquivo estático em `public/assets` (resolvido com o `base` do build).
- `upload:<id>`: arquivo enviado no painel, guardado no IndexedDB e resolvido por `useAssetUrl`.

Na versão definitiva, o `FileService` devolverá URLs absolutas do storage, e `useAssetUrl` continua funcionando.

## Exemplo de substituição

```ts
// src/services/http/products.ts (futuro)
export const HttpProductService: ProductService = {
  list: (f) => api.get('/products', { params: f }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  // ...
};

// src/services/index.ts
export const services: Services = { ...mockServices, products: HttpProductService };
```
