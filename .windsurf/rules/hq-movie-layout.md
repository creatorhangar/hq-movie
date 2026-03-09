---
description: Criar ou modificar layouts específicos por formato de vídeo (Vertical 9:16, Widescreen 16:9, Square 1:1, Portrait 4:3)
triggers:
  - novo layout
  - adicionar formato
  - aspect ratio
  - painéis
  - panels
  - grid
---

# HQ Movie: Video Format Layout

Use para novos layouts ou ajustes de aspect ratio nos 4 formatos suportados.

## Inputs Necessários

- **Formato de vídeo:** vertical, widescreen, square, portrait
- **Número de painéis:** 1-9
- **Estilo:** grid, split, custom

## Dimensões do Canvas por Formato

| Formato | Aspect Ratio | Dimensões (px) |
|---------|--------------|----------------|
| Vertical | 9:16 | 1080 × 1920 |
| Widescreen | 16:9 | 1920 × 1080 |
| Square | 1:1 | 1080 × 1080 |
| Portrait | 4:3 | 1440 × 1080 |

## Steps de Implementação

1. **Consultar VIDEO_FORMATS** em `layouts-video.js`:
   ```javascript
   const VIDEO_FORMATS = {
     vertical: { width: 1080, height: 1920, ratio: '9:16' },
     widescreen: { width: 1920, height: 1080, ratio: '16:9' },
     square: { width: 1080, height: 1080, ratio: '1:1' },
     portrait: { width: 1440, height: 1080, ratio: '4:3' }
   };
   ```

2. **Calcular posição dos painéis:**
   - Usar coordenadas absolutas: `x, y, w, h` em pixels
   - Margem entre painéis: **12px**
   - Margem externa: **0px** (painéis vão até a borda)

3. **Estrutura de Layout:**
   ```javascript
   {
     id: 'widescreen_6_grid',
     format: 'widescreen',
     panels: 6,
     style: 'grid',
     name: '6 Painéis Grid 3x2',
     layout: [
       { x: 0, y: 0, w: 630, h: 534 },
       { x: 642, y: 0, w: 630, h: 534 },
       { x: 1284, y: 0, w: 636, h: 534 },
       { x: 0, y: 546, w: 630, h: 534 },
       { x: 642, y: 546, w: 630, h: 534 },
       { x: 1284, y: 546, w: 636, h: 534 }
     ]
   }
   ```

4. **Adicionar ao LayoutEngine:**
   ```javascript
   LayoutEngine.getVideoLayouts(format, panelCount)
   ```

5. **Criar thumbnail preview:**
   - Escala: 60×34 para widescreen, proporcional para outros
   - Mostrar preview visual no seletor de layouts

## Constraints Obrigatórias

- ⚠️ Painéis **NÃO podem sobrepor**
- ⚠️ **SEMPRE preencher canvas** (sem áreas vazias grandes)
- ⚠️ **MANTER aspect ratio** das imagens (usar `object-fit: cover`)
- ⚠️ Soma de widths + gaps = canvas width
- ⚠️ Soma de heights + gaps = canvas height

## Fórmula de Cálculo

```javascript
// Grid NxM com gap
function calculateGrid(format, cols, rows, gap = 12) {
  const { width, height } = VIDEO_FORMATS[format];
  const totalGapX = gap * (cols - 1);
  const totalGapY = gap * (rows - 1);
  const panelW = Math.floor((width - totalGapX) / cols);
  const panelH = Math.floor((height - totalGapY) / rows);
  
  const panels = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      panels.push({
        x: col * (panelW + gap),
        y: row * (panelH + gap),
        w: panelW,
        h: panelH
      });
    }
  }
  return panels;
}
```

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `layouts-video.js` | Adicionar novo layout |
| `ui.js` | Renderizar thumbnail (se necessário) |

## Validation Checklist

- [ ] Layout renderiza corretamente no canvas do formato
- [ ] Painéis preenchem bem o espaço
- [ ] Sem sobreposição de painéis
- [ ] Testar com imagens reais (sem bordas brancas)
- [ ] Thumbnail preview funciona no seletor

## Exemplo: Criar Layout Split Vertical

```javascript
// Widescreen com 2 painéis lado a lado
{
  id: 'widescreen_2_split_h',
  format: 'widescreen',
  panels: 2,
  style: 'split',
  name: '2 Painéis Horizontal',
  layout: [
    { x: 0, y: 0, w: 954, h: 1080 },
    { x: 966, y: 0, w: 954, h: 1080 }
  ]
}
```
