---
description: Implementar ou debugar narrative track fixo (texto que NÃO muda enquanto imagens transitam)
triggers:
  - narrative track
  - texto fixo
  - narrativa contínua
  - segmentos narrativos
  - subtitle overlay
  - documentary mode
---

# HQ Movie: Narrative Track System

Use para documentários ou histórias narradas onde texto permanece fixo enquanto imagens transitam.

## Inputs Necessários

- **Modo:** per-page, continuous-track, hybrid
- **Posição:** top, bottom
- **Segmentos:** texto + range de páginas que cobre

## Data Model

```javascript
project: {
  narrativeMode: 'continuous-track',  // 'per-page' | 'continuous-track' | 'hybrid'
  narrativePosition: 'bottom',        // 'top' | 'bottom'
  narrativeHeight: 150,               // pixels
  narrativeSegments: [
    {
      id: 'seg_1',
      text: {
        'pt-BR': 'Era uma vez, em uma terra distante...',
        'en': 'Once upon a time, in a distant land...'
      },
      pageRange: [0, 2],  // índices das páginas (0-indexed)
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 24,
        color: '#ffffff',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: 20,
        textAlign: 'center'
      }
    },
    {
      id: 'seg_2',
      text: {
        'pt-BR': 'O herói partiu em sua jornada...',
        'en': 'The hero set out on their journey...'
      },
      pageRange: [3, 5],
      style: { /* ... */ }
    }
  ]
}
```

## Modos de Narrativa

| Modo | Descrição |
|------|-----------|
| `per-page` | Texto muda a cada página (tradicional) |
| `continuous-track` | Texto permanece durante range de páginas |
| `hybrid` | Mix de ambos (algumas páginas com texto único) |

## Implementation Steps

### 1. Área de Narrativa (Renderização)

```javascript
function drawNarrativeTrack(ctx, segment, language, canvasWidth, canvasHeight) {
  const text = segment.text[language];
  const { style, position } = segment;
  
  // Posição da área de narrativa
  const trackHeight = project.narrativeHeight || 150;
  const trackY = project.narrativePosition === 'top' 
    ? 0 
    : canvasHeight - trackHeight;
  
  // Background semi-transparente
  ctx.fillStyle = style.background || 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, trackY, canvasWidth, trackHeight);
  
  // Texto
  ctx.fillStyle = style.color || '#ffffff';
  ctx.font = `${style.fontSize || 24}px ${style.fontFamily || 'Georgia, serif'}`;
  ctx.textAlign = style.textAlign || 'center';
  ctx.textBaseline = 'middle';
  
  // Word wrap e renderização
  const lines = wrapText(ctx, text, canvasWidth - style.padding * 2);
  const lineHeight = (style.fontSize || 24) * 1.4;
  const startY = trackY + trackHeight / 2 - (lines.length - 1) * lineHeight / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, canvasWidth / 2, startY + i * lineHeight);
  });
}
```

### 2. Transições de Texto (Crossfade)

```javascript
async function transitionNarrativeSegment(ctx, fromSegment, toSegment, duration = 0.5) {
  const frames = duration * 30;
  
  for (let f = 0; f < frames; f++) {
    const progress = f / frames;
    
    // Fade out do segmento atual
    ctx.globalAlpha = 1 - progress;
    drawNarrativeTrack(ctx, fromSegment, activeLanguage);
    
    // Fade in do próximo segmento
    ctx.globalAlpha = progress;
    drawNarrativeTrack(ctx, toSegment, activeLanguage);
    
    ctx.globalAlpha = 1;
    await captureFrame();
  }
}
```

### 3. UI: Gerenciador de Segmentos

```javascript
function renderSegmentManager() {
  return `
    <div class="narrative-manager">
      <h3>📜 Narrative Track</h3>
      
      <div class="mode-selector">
        <label>
          <input type="radio" name="narrative-mode" value="per-page">
          Por Página
        </label>
        <label>
          <input type="radio" name="narrative-mode" value="continuous-track" checked>
          Contínuo
        </label>
      </div>
      
      <div class="position-selector">
        <button onclick="setNarrativePosition('top')">⬆️ Topo</button>
        <button onclick="setNarrativePosition('bottom')" class="active">⬇️ Base</button>
      </div>
      
      <div class="segments-list" id="narrative-segments">
        <!-- Lista de segmentos -->
      </div>
      
      <button onclick="addSegment()">➕ Novo Segmento</button>
      <button onclick="autoSplitSegments()">✂️ Auto-Split</button>
      <button onclick="validateSegments()">✓ Validar</button>
    </div>
  `;
}
```

### 4. Segment CRUD

```javascript
// Adicionar segmento
function addNarrativeSegment(text, pageRange) {
  const segment = {
    id: generateId('seg'),
    text: {
      'pt-BR': text['pt-BR'] || '',
      'en': text['en'] || ''
    },
    pageRange,
    style: getDefaultNarrativeStyle()
  };
  project.narrativeSegments.push(segment);
  sortSegmentsByPageRange();
  renderSegmentManager();
}

// Validar segmentos (detectar gaps)
function validateNarrativeSegments() {
  const totalPages = project.pages.length;
  const covered = new Set();
  
  project.narrativeSegments.forEach(seg => {
    for (let i = seg.pageRange[0]; i <= seg.pageRange[1]; i++) {
      covered.add(i);
    }
  });
  
  const gaps = [];
  for (let i = 0; i < totalPages; i++) {
    if (!covered.has(i)) {
      gaps.push(i);
    }
  }
  
  if (gaps.length > 0) {
    showWarning(`Páginas sem narrativa: ${gaps.map(g => g + 1).join(', ')}`);
  }
  
  return gaps.length === 0;
}

// Auto-split (divide a cada N páginas)
function autoSplitSegments(pagesPerSegment = 3) {
  const totalPages = project.pages.length;
  project.narrativeSegments = [];
  
  for (let i = 0; i < totalPages; i += pagesPerSegment) {
    const end = Math.min(i + pagesPerSegment - 1, totalPages - 1);
    addNarrativeSegment(
      { 'pt-BR': `Segmento ${Math.floor(i / pagesPerSegment) + 1}`, 'en': `Segment ${Math.floor(i / pagesPerSegment) + 1}` },
      [i, end]
    );
  }
}
```

### 5. VideoExporter Integration

```javascript
async function renderPageWithNarrative(ctx, page, pageIndex) {
  // Desenhar conteúdo da página (imagens, painéis)
  await drawPageContent(ctx, page);
  
  // Encontrar segmento de narrativa ativo
  const segment = project.narrativeSegments.find(seg => 
    pageIndex >= seg.pageRange[0] && pageIndex <= seg.pageRange[1]
  );
  
  if (segment) {
    // Desenhar overlay de narrativa
    drawNarrativeTrack(ctx, segment, activeLanguage, canvas.width, canvas.height);
  }
}

async function renderTransitionWithNarrative(ctx, fromPage, toPage, fromIndex, toIndex) {
  const fromSegment = getSegmentForPage(fromIndex);
  const toSegment = getSegmentForPage(toIndex);
  
  // Se mudou de segmento, fazer crossfade do texto
  if (fromSegment?.id !== toSegment?.id) {
    await transitionNarrativeSegment(ctx, fromSegment, toSegment);
  }
  
  // Transição normal das imagens
  await transitionPages(ctx, fromPage, toPage);
}
```

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `app.js` | NarrativeSegments helper, data model |
| `controller.js` | Segment CRUD, validação |
| `ui.js` | Segment manager UI |
| `video-exporter.js` | Narrative overlay rendering |

## Validation

1. Criar projeto com 6 páginas
2. Adicionar 2 segmentos: seg1 (págs 1-3), seg2 (págs 4-6)
3. Preview no editor - verificar texto fixo embaixo
4. Export vídeo
5. Assistir: texto de seg1 permanece durante págs 1-3
6. Verificar crossfade suave ao mudar para seg2

## Checklist

- [ ] UI de gerenciamento de segmentos funciona
- [ ] Adicionar/editar/remover segmentos
- [ ] Texto bilíngue (PT-BR + EN) funciona
- [ ] Posição (top/bottom) pode ser alterada
- [ ] Validação detecta páginas sem narrativa
- [ ] Auto-split divide corretamente
- [ ] Export renderiza narrativa como overlay
- [ ] Crossfade entre segmentos é suave
- [ ] Imagens transitam ATRÁS do texto

## Estilo Padrão

```javascript
function getDefaultNarrativeStyle() {
  return {
    fontFamily: 'Georgia, serif',
    fontSize: 24,
    color: '#ffffff',
    background: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    textAlign: 'center',
    lineHeight: 1.4
  };
}
```
