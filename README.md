# Casa Âmbar · Protótipo de e-commerce de brechó 3D

Protótipo navegável de alta fidelidade (**somente frontend, totalmente simulado**) de uma loja de móveis, decoração, antiguidades e relíquias, com **ambientes panorâmicos 360° com hotspots**, **visualizador 3D (GLB/GLTF)**, carrinho com **reservas de 15 minutos**, checkout com **PIX simulado** e **painel administrativo** completo.

> ⚠️ **Demonstração.** Não há backend, banco de dados, pagamentos, fretes, e-mails nem autenticação reais. Todos os dados são fictícios e ficam no navegador. A marca "Casa Âmbar" é fictícia.

## Executar localmente

Requisitos: **Node.js 20+** (testado com Node 22) e npm.

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173. Para gerar e testar o build de produção:

```bash
npm run build
```

```bash
npm run preview
```

## Publicar no GitHub Pages

O workflow `.github/workflows/deploy.yml` publica o site a cada push na branch `main`.

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Faça push na `main` (ou rode o workflow manualmente em **Actions**).
3. O site fica em `https://<usuario>.github.io/Sistema_Brecho/`.

O projeto usa `base: './'` e rotas com hash (`/#/produto/...`), então funciona em qualquer subcaminho sem configuração extra.

> O GitHub Pages em repositório **privado** exige plano pago (Pro/Team/Enterprise). No plano gratuito, o repositório precisa ser público.

## Roteiro sugerido de demonstração

1. **Home** → "Entrar na sala em 360°": arraste o panorama, toque nos pontos e abra a ficha de uma peça.
2. Use os botões de **porta** dentro do panorama para ir ao Escritório e ao Dormitório.
3. Na página da **Peça decorativa demonstrativa** (o GLB enviado pelo cliente), abra "Visualizar em 3D".
4. Abra uma peça **sem modelo 3D** (ex.: *Paisagem rural a óleo*) para ver o fallback por ângulos.
5. Adicione peças ao carrinho: veja o **contador de reserva** e use "simular expiração" para ver a peça ser liberada.
6. No carrinho, teste os cupons `BEMVINDO10`, `FRETEGRATIS`, `ANTIQUARIO300` e `INVERNO2025` (expirado), e simule o frete com qualquer CEP.
7. Finalize como **visitante** ou com a **conta demonstrativa**, gere o **PIX ilustrativo** e clique em "Simular pagamento aprovado".
8. Vá ao **painel** (`/#/admin`): o pedido, o faturamento e o estoque já refletem a compra.
9. No painel, teste o **editor panorâmico** (clique para criar um hotspot, arraste, salve e pré-visualize), o cadastro de produtos com upload de fotos/GLB, cupons, artigos e a **troca de perfil** (níveis de acesso).
10. Em **Painel → Demonstração**, use "Restaurar dados originais" para voltar ao estado inicial.

## Dados demonstrativos

| Item | Quantidade |
| --- | --- |
| Produtos | 27 (21 com modelo 3D, incluindo os 2 GLBs do cliente; 6 com fallback; 5 vendidos) |
| Categorias | 7 |
| Ambientes panorâmicos | 3 (24 hotspots + pontos de navegação entre ambientes) |
| Pedidos | 6 (todos os status do fluxo) |
| Clientes | 6 (incluindo a conta demonstrativa) |
| Cupons | 4 (3 válidos e 1 expirado) |
| Artigos editoriais | 4 (3 publicados e 1 agendado) |
| Usuários administrativos | 4 perfis de acesso |

Os indicadores do dashboard são **calculados a partir desses mesmos registros**. Nenhum número é inventado em uma tela isolada.

## Documentação

- [Arquitetura e decisões técnicas](docs/ARQUITETURA.md)
- [Serviços mock e contratos](docs/SERVICOS-MOCK.md)
- [Integrações futuras e limitações conhecidas](docs/INTEGRACOES-E-LIMITACOES.md)
- [Assets demonstrativos (3D, fotos e panoramas)](docs/ASSETS.md)

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Verificação de tipos |
| `npm run assets` | Regenera fotos, modelos GLB e panoramas (requer Playwright + Chromium) |
