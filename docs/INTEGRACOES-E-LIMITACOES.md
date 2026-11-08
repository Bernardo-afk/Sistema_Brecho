# Integrações futuras e limitações conhecidas

## O que é simulado (e como está sinalizado)

| Recurso | Comportamento no protótipo | Sinalização na interface |
| --- | --- | --- |
| Pagamento PIX | QR Code **decorativo** (não é um QR válido) e código `DEMONSTRACAO-SEM-VALOR-…`; aprovação por botão | Selo "Simulação · sem cobrança real", carimbo "Ilustrativo" no QR e aviso explicativo |
| Frete e CEP | Valores calculados pela região do CEP; endereço preenchido com texto genérico | Selo "Frete simulado · valores fictícios" |
| Reserva de peças | Temporizador no navegador | Aviso no carrinho sobre a ausência de exclusividade entre dispositivos |
| Login de cliente | Conta demonstrativa sem senha | Selo "Login simulado" |
| Perfis do painel | Troca livre de usuário no topo | Selo "Demo" e aviso na tela de usuários |
| E-mail e WhatsApp | Não enviados | Avisos na confirmação do pedido e nas mudanças de status |
| Uploads | IndexedDB local | Aviso no formulário de produtos |
| Banco de dados | localStorage | Barra de "Protótipo demonstrativo" em todas as páginas da loja |

## Pontos de substituição para a versão definitiva

1. **Banco de dados e API:** implementar `services/contracts.ts` sobre uma API (ex.: Node/NestJS ou Laravel + PostgreSQL).
2. **Reservas:** criação atômica no servidor com expiração (TTL) e job de liberação; o pedido herda a reserva até o vencimento do PIX.
3. **Pagamento PIX:** integrar um PSP. Criar a cobrança no servidor, exibir o QR/copia-e-cola reais e confirmar **somente via webhook** assinado.
4. **Frete:** Melhor Envio/Frenet para itens pequenos e cotação com transportadoras especializadas para móveis; ViaCEP para endereço.
5. **Autenticação:** login seguro (ex.: Auth.js, Cognito, Supabase Auth), recuperação de senha, RBAC validado no servidor (a matriz atual em `pages/admin/AdminApp.tsx` serve de referência).
6. **Storage:** S3/R2 com URLs assinadas para upload; CDN para fotos, GLB e panoramas; geração de miniaturas e compressão (KTX2/Draco para GLB).
7. **Notificações:** e-mail transacional (Resend, SES) e WhatsApp Business API para confirmação, envio e entrega.
8. **Nota fiscal, LGPD e termos:** emissão de NF-e, consentimento de cookies, textos jurídicos revisados.
9. **Observabilidade e SEO:** analytics real, monitoramento de erros e SSR/pré-renderização para SEO (o HashRouter atual não é ideal para indexação; usar BrowserRouter com hospedagem que suporte reescrita, ou Next.js).

## Limitações conhecidas

- Os dados ficam **por navegador**: outra pessoa ou outro dispositivo vê os dados originais.
- A reserva **não** impede que dois navegadores comprem a mesma peça.
- Rotas com `#` (necessárias no GitHub Pages) não são ideais para SEO.
- Modelos 3D e panoramas foram gerados proceduralmente para a demo (estilo ilustrativo). Em produção, use fotogrametria/escaneamento e fotos 360° reais.
- Uploads grandes ficam no IndexedDB; navegadores em modo privado podem limitar ou apagar esses dados.
- O GLTF enviado no painel precisa ter recursos embutidos (ou usar GLB); arquivos `.gltf` com texturas externas não são suportados no mock.
- Gráficos e textos jurídicos são demonstrativos.
- **O sistema não está pronto para operar comercialmente.**
