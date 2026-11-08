# Arquitetura do protótipo

## 1. Stack escolhida

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| Build | **Vite 5** | Inicialização instantânea, build estático pronto para qualquer hospedagem (GitHub Pages) e code splitting automático. |
| UI | **React 18 + TypeScript** | Ecossistema mais amplo para 3D na web (react-three-fiber), tipagem forte nos contratos de serviço e ampla disponibilidade de profissionais. |
| Estilo | **Tailwind CSS 3** | Design system por tokens (cores, tipografia, sombras) em `tailwind.config.js`, responsivo e mobile-first sem CSS solto. |
| 3D | **three.js + @react-three/fiber + drei** | Padrão de mercado para WebGL; carrega GLB/GLTF, controles de órbita por toque/mouse, sombras de contato e carregamento progressivo. |
| Panoramas | **Visualizador próprio em three.js** | Esfera com shader equiretangular, hotspots em HTML (acessíveis e clicáveis), arraste com inércia, pinça, teclado e modo editor. Evita dependências extras e reaproveita o three. |
| Estado global | **Zustand** | Leve, sem boilerplate, com persistência simples (carrinho, sessão, checkout). |
| Rotas | **React Router 6 (HashRouter)** | Funciona em hospedagem estática sem regras de reescrita. |
| Gráficos | **Recharts** | Gráficos declarativos no dashboard (carregado só no painel). |
| Ícones | **lucide-react** | Conjunto consistente e leve. |

**Sem backend.** Toda a "API" é simulada no navegador (ver `SERVICOS-MOCK.md`).

### Desempenho

- A loja pública baixa **~110 KB gzip** de JS. O three.js (~220 KB gzip) só é carregado quando um panorama ou modelo 3D é aberto (`src/viewers/index.tsx` usa `React.lazy`).
- O painel administrativo também é carregado sob demanda.
- **Qualidade adaptativa** (`src/utils/device.ts`): em celulares e aparelhos com pouca memória ou poucos núcleos, o panorama usa a versão 2048 px (e não a de 4096 px), e o 3D desativa sombras e antialias e limita o DPR.
- Imagens com `loading="lazy"` e transição suave. Fontes com `display=swap`.

## 2. Estrutura de diretórios

```
public/assets/            assets estáticos (fotos, GLB, panoramas, cenas)
scripts/                  gerador procedural de assets (three.js + Chromium headless)
src/
  types/domain.ts         tipos de domínio (Product, Order, Panorama…)
  data/seed/              dados demonstrativos iniciais
  data/generated/         manifesto gerado pelo script de assets (fotos, modelos, hotspots)
  services/
    contracts.ts          INTERFACES dos serviços (contrato estável)
    index.ts              ponto único de troca mock → API real
    mock/                 implementações mock (db local, catálogo, comércio, conteúdo)
  store/                  estado global (Zustand): carrinho, sessão, checkout, toasts
  hooks/                  useQuery (busca reativa), useCartDetails, useNow…
  design-system/          componentes base (Button, Modal, Drawer, Field, Badge…)
  viewers/                PanoramaViewer, Model3DViewer, PhotoAngleViewer
  components/             layout público, carrinho, cards, explorador panorâmico
  pages/public/           páginas da loja
  pages/admin/            painel administrativo
  utils/                  formatação, assets, heurísticas de dispositivo
```

## 3. Separação entre interface e dados

- Componentes **nunca** importam os dados de `src/data`. Eles chamam `services.*` (`src/services/index.ts`).
- Os serviços são **assíncronos** (retornam `Promise`) e têm latência artificial, exatamente como uma API real. Por isso a interface já tem estados de carregamento, vazio e erro.
- O hook `useQuery` refaz as buscas automaticamente quando os dados mudam (assinatura em `mock/db.ts`). Na versão real, pode ser trocado por React Query ou SWR sem alterar as telas.

## 4. Estratégia de estado

| Estado | Onde | Persistência |
| --- | --- | --- |
| Dados de negócio (produtos, pedidos, cupons, hotspots…) | serviços mock (`mock/db.ts`) | `localStorage` (`casa-ambar:demo-db`) |
| Arquivos enviados no painel | `FileServiceMock` | IndexedDB (`casa-ambar-uploads`) |
| Carrinho e cupom aplicado | `store/cart.ts` | `localStorage` |
| Sessão (id da sessão, conta demo, perfil admin) | `store/session.ts` | `localStorage` |
| Formulário do checkout | `store/checkout.ts` | `sessionStorage` |
| Notificações, modais e confirmações | stores efêmeros | memória |

"Restaurar dados originais" (Painel → Demonstração) recria o banco a partir do seed e limpa os uploads.

## 5. Regras de negócio implementadas

- **Peça única:** cada produto tem 1 unidade. O carrinho não permite duplicar e o checkout valida a disponibilidade.
- **Reserva de 15 min:** ao adicionar ao carrinho. O `ReservationWatcher` varre reservas vencidas a cada segundo, libera a peça e avisa o usuário. Ao criar o pedido, a reserva é estendida até o vencimento do PIX (30 min). PIX vencido cancela o pedido e libera as peças.
- **Status efetivo:** `reservado` é derivado das reservas ativas (não é gravado no produto), então a disponibilidade se atualiza sozinha.
- **Pagamento aprovado:** marca as peças como vendidas, converte as reservas e incrementa o uso do cupom.
- **Cancelamento no painel:** libera reservas, devolve peças vendidas ao estoque e marca o pagamento como estornado (simulado).
- **Indicadores:** derivados de pedidos, produtos e reservas (`AnalyticsServiceMock`).

> **Limitação explícita:** a reserva vive no navegador e **não garante exclusividade entre dispositivos ou usuários**. Na versão definitiva, ela deve ser criada no servidor, de forma atômica (ex.: `UPDATE ... WHERE status='disponivel'` ou lock com TTL no Redis).

## 6. Como o backend entra depois

1. Implementar cada interface de `services/contracts.ts` com chamadas HTTP (ex.: `HttpProductService`).
2. Trocar os objetos em `services/index.ts`. **Nenhuma tela precisa mudar.**
3. Mover para o servidor as regras hoje simuladas no cliente: reservas, cálculo de totais e cupons, criação de pedidos, aprovação de pagamento (webhook) e permissões.
4. Substituir `useQuery` por React Query, se desejado (invalidação de cache por chave).

Mais detalhes em `INTEGRACOES-E-LIMITACOES.md`.
