---
description: Implementar navegação panel-by-panel (guided view) onde câmera foca em cada painel sequencialmente
triggers:
  - guided view
  - panel by panel
  - sequência de painéis
  - zoom em painel
  - panel sequence
  - focus animation
---

# HQ Movie: Panel-by-Panel Navigation

Use para motion comics dinâmicos com câmera focando em cada painel sequencialmente.

## Inputs Necessários

- **Layout:** quantos painéis (2, 4, 6, etc)
- **Ordem de navegação:** Z-pattern, horizontal, vertical, custom
- **Animação por painel:** zoom, pan, static

## Data Model

```javascript
page: {
  panelSequence: {
    mode: 'guided-view',  // 'guided-view' | 'page-level'
    steps: [
      {
        panelIndex: 0,
        animation: 'zoom-in',  // 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'static'
        zoom: 1.5,             // 1.0 - 3.0
        duration: 2,           // segundos
        focus: 'center',       // 'center' | 'top' | 'bottom' | 'left' | 'right'
        easing: 'ease-in-out'  // CSS easing function
      },
      {
        panelIndex: 1,
        animation: 'pan-right',
        zoom: 1.2,
        duration: 2.5,
        focus: 'center',
        easing: 'ease-in-out'
      }
      // ... outros painéis
    ],
    transitionBetweenPanels: 'smooth-pan',  // 'smooth-pan' | 'cut' | 'crossfade'
    transitionDuration: 0.5  // segundos
  }
}
```

## Patterns de Navegação

### Z-Pattern (padrão para leitura ocidental)
```
1 → 2
↙
3 → 4
```

### Horizontal (linha por linha)
```
1 → 2 → 3
4 → 5 → 6
```

### Vertical (coluna por coluna)
```
1   3   5
↓   ↓   ↓
2   4   6
```

## Implementation Steps

### 1. calculatePanelViewport()

```javascript
function calculatePanelViewport(panel, zoom, focus) {
  // Retorna {x, y, w, h} da área visível no canvas
  const { x, y, w, h } = panel;
  
  // Área ampliada pelo zoom
  const viewW = w / zoom;
  const viewH = h / zoom;
  
  // Offset baseado no focus
  let offsetX = 0, offsetY = 0;
  switch (focus) {
    case 'top': offsetY = (h - viewH) / 2; break;
    case 'bottom': offsetY = -(h - viewH) / 2; break;
    case 'left': offsetX = (w - viewW) / 2; break;
    case 'right': offsetX = -(w - viewW) / 2; break;
  }
  
  return {
    x: x + (w - viewW) / 2 + offsetX,
    y: y + (h - viewH) / 2 + offsetY,
    w: viewW,
    h: viewH
  };
}
```

### 2. interpolatePanelTransition()

```javascript
function interpolatePanelTransition(from, to, progress) {
  // Easing: ease-in-out quad
  const eased = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    w: from.w + (to.w - from.w) * eased,
    h: from.h + (to.h - from.h) * eased,
    zoom: from.zoom + (to.zoom - from.zoom) * eased
  };
}
```

### 3. UI: Panel Sequence Editor

```javascript
// Sidebar component
function renderPanelSequenceEditor(page) {
  return `
    <div class="panel-sequence-editor">
      <h3>Sequência de Painéis</h3>
      
      <select id="sequence-mode">
        <option value="page-level">Página Inteira</option>
        <option value="guided-view">Guided View</option>
      </select>
      
      <div class="sequence-list" id="sequence-steps">
        <!-- Drag & drop list de steps -->
      </div>
      
      <button onclick="autoGenerateSequence()">
        🔄 Auto-Gerar Sequência
      </button>
      
      <button onclick="previewSequence()">
        ▶️ Preview
      </button>
    </div>
  `;
}
```

### 4. VideoExporter: Render Panel Sequence

```javascript
async function renderPageWithSequence(ctx, page) {
  const { steps, transitionDuration } = page.panelSequence;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const panel = page.panels[step.panelIndex];
    
    // Renderizar frames do step
    const frames = step.duration * 30;
    for (let f = 0; f < frames; f++) {
      const progress = f / frames;
      const viewport = calculateAnimatedViewport(panel, step, progress);
      drawPanelFocused(ctx, panel, viewport);
      await captureFrame();
    }
    
    // Transição para próximo painel
    if (i < steps.length - 1) {
      const nextStep = steps[i + 1];
      const nextPanel = page.panels[nextStep.panelIndex];
      await renderTransition(ctx, panel, nextPanel, transitionDuration);
    }
  }
}
```

## Constraints

| Regra | Valor |
|-------|-------|
| Zoom mínimo | 1.0x (100%) |
| Zoom máximo | 3.0x (300%) |
| Duração mínima por painel | 1s |
| Transição entre painéis | 500ms padrão |
| Painel sempre visível completo | Sem cortes |

## Auto-Generate Sequence

```javascript
function autoGenerateSequence(page, pattern = 'z-pattern') {
  const panelCount = page.panels.length;
  const steps = [];
  
  // Ordenar painéis pelo pattern
  const order = getReadingOrder(page.layout, pattern);
  
  for (const panelIndex of order) {
    steps.push({
      panelIndex,
      animation: 'zoom-in',
      zoom: 1.3,
      duration: 2,
      focus: 'center',
      easing: 'ease-in-out'
    });
  }
  
  return {
    mode: 'guided-view',
    steps,
    transitionBetweenPanels: 'smooth-pan',
    transitionDuration: 0.5
  };
}

function getReadingOrder(layout, pattern) {
  const panels = layout.map((p, i) => ({ ...p, index: i }));
  
  switch (pattern) {
    case 'z-pattern':
      // Ordenar por Y (linha) depois X (coluna)
      return panels
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(p => p.index);
    
    case 'horizontal':
      return panels
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(p => p.index);
    
    case 'vertical':
      return panels
        .sort((a, b) => a.x - b.x || a.y - b.y)
        .map(p => p.index);
    
    default:
      return panels.map(p => p.index);
  }
}
```

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `app.js` | Data model, helpers de cálculo |
| `controller.js` | Panel sequence editor logic |
| `ui.js` | Panel sequence UI (sidebar) |
| `video-exporter.js` | Render panel sequence |

## Validation

1. Criar página com layout 2x2 (4 painéis)
2. Ativar guided-view mode
3. Auto-gerar sequência Z-pattern
4. Preview no editor - verificar câmera foca cada painel
5. Export vídeo - assistir sequência completa
6. Verificar transições suaves entre painéis

## Checklist

- [ ] UI de edição de sequência funciona
- [ ] Drag & drop reordena steps
- [ ] Auto-generate cria sequência lógica
- [ ] Preview mostra sequência correta
- [ ] Export respeita sequência definida
- [ ] Transições são suaves (não cortes bruscos)
- [ ] Zoom não ultrapassa limites (1x-3x)
