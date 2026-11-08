# Assets demonstrativos

Todos os assets visuais da demo foram **gerados proceduralmente** (sem fotos ou modelos de terceiros), exceto o modelo enviado pelo cliente.

| Pasta | Conteúdo |
| --- | --- |
| `public/assets/products/<id>/1..3.jpg` | 3 fotos de estúdio por produto |
| `public/assets/models/<id>.glb` | Modelos 3D exportados (19 produtos) |
| `public/assets/models/peca-demo.glb` | **Modelo GLB de exemplo fornecido pelo cliente**, usado no produto "Peça decorativa demonstrativa" e posicionado no ambiente Escritório |
| `public/assets/panoramas/<ambiente>.jpg` | Panoramas equiretangulares 4096×2048 (desktop) e `-mobile.jpg` 2048×1024 |
| `public/assets/scenes/*.jpg` | Vistas em perspectiva dos ambientes (hero, capas e editoriais) |
| `src/data/generated/assets-manifest.json` | Caminhos gerados e **hotspots calculados automaticamente** a partir da posição 3D de cada peça |

## Como foram gerados

`scripts/generate-assets.mjs` empacota `scripts/asset-studio/` com esbuild e executa no Chromium headless:

1. **Modelos** (`models.js`): móveis construídos com geometrias three.js e texturas procedurais (`textures.js`: madeira, veludo, couro, palhinha, porcelana, papel de parede, tapetes, pinturas).
2. **Fotos**: estúdio com fundo creme, sombras suaves e três ângulos por peça.
3. **GLB**: `GLTFExporter` para os produtos marcados com `exportGlb: true` em `scripts/asset-spec.mjs`. Os demais demonstram a experiência alternativa sem 3D.
4. **Panoramas**: os ambientes são montados com as mesmas peças, renderizados com `CubeCamera` e convertidos para projeção equiretangular por shader. A direção de cada peça a partir do ponto de vista vira o hotspot (yaw/pitch).

Para regenerar (requer Playwright + Chromium instalados):

```bash
npm run assets
```

Opções: `-- --only=products`, `-- --only=rooms` e `-- --id=<produto-ou-ambiente>`.

Para usar **modelos e panoramas reais**, basta substituir os arquivos ou enviá-los pelo painel (produtos) e ajustar os hotspots no editor panorâmico.
