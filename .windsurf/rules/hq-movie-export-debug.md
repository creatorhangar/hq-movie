---
description: Debugar problemas de export de vídeo (duração incorreta, áudio dessinc, crash) no HQ Movie
triggers:
  - export trava
  - vídeo curto
  - áudio dessinc
  - debug export
  - video bug
  - export error
  - mediarecorder
---

# HQ Movie: Video Export Debug

Use quando vídeo exportado apresenta problemas.

## Inputs Necessários

- **Sintoma:** duração errada, áudio fora de sinc, crash, tela preta, etc
- **Configuração do projeto:** nº páginas, formato, duração esperada
- **Log de erro:** mensagens do console (se houver)

## Diagnostic Steps

### 1. Verificar VideoExporter.exportVideo()

```javascript
// Checklist de renderização
async function exportVideo() {
  // ✓ Loop de páginas completo?
  for (const page of project.pages) {
    await renderPage(page);  // AWAIT obrigatório!
  }
  
  // ✓ MediaRecorder state transitions?
  // idle -> recording -> stopped
  
  // ✓ Duração calculada correta?
  const duration = project.pages.reduce((sum, p) => sum + p.duration, 0);
  // + tempo de transições entre páginas
}
```

### 2. Verificar Áudio

```javascript
// ✓ Background music inicia ANTES da primeira página?
bgSource.start(0);  // Não start(currentTime)

// ✓ Sincronização usa audioContext.currentTime?
// ERRADO: Date.now()
// CERTO: audioContext.currentTime

// ✓ Ducking aplicado?
// Verificar que bgGain muda durante narração
```

### 3. Verificar Canvas Rendering

```javascript
// ✓ Cada página renderiza 30fps × duration?
const frames = page.duration * 30;
for (let f = 0; f < frames; f++) {
  drawFrame(ctx, page, f / 30);
  await waitFrame();  // requestAnimationFrame ou setTimeout
}

// ✓ Ken Burns transform aplicado frame-a-frame?
// Verificar que transform muda a cada frame

// ✓ Transições entre páginas renderizadas?
// Crossfade, slide, etc entre páginas
```

## Common Bugs & Fixes

### BUG: Vídeo com metade da duração

**Causa:** Falta de `await` no loop de páginas

```javascript
// ❌ ERRADO
for (const page of pages) {
  renderPage(page);  // Não espera!
}

// ✅ CERTO
for (const page of pages) {
  await renderPage(page);
}
```

### BUG: Áudio dessinc após 30s

**Causa:** Uso de `Date.now()` em vez de `audioContext.currentTime`

```javascript
// ❌ ERRADO
const startTime = Date.now();
const elapsed = (Date.now() - startTime) / 1000;

// ✅ CERTO
const startTime = audioContext.currentTime;
const elapsed = audioContext.currentTime - startTime;
```

### BUG: Export trava em página X

**Causa:** Imagem corrompida ou layout inválido

```javascript
// Diagnóstico
try {
  await renderPage(page);
} catch (error) {
  console.error(`Erro na página ${page.id}:`, error);
  console.log('Imagens:', page.panels.map(p => p.image?.src));
  console.log('Layout:', page.layout);
}
```

### BUG: Tela preta no vídeo

**Causa:** Canvas não está sendo desenhado no MediaRecorder

```javascript
// Verificar que canvas stream está conectado
const stream = canvas.captureStream(30);
const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

// Verificar que desenho acontece DEPOIS de recorder.start()
recorder.start();
await renderAllPages();  // Desenho aqui
recorder.stop();
```

### BUG: Áudio não incluso no vídeo

**Causa:** AudioContext não conectado ao MediaRecorder

```javascript
// ✅ Combinar streams de vídeo e áudio
const videoStream = canvas.captureStream(30);
const audioStream = audioContext.createMediaStreamDestination().stream;

const combinedStream = new MediaStream([
  ...videoStream.getVideoTracks(),
  ...audioStream.getAudioTracks()
]);

const recorder = new MediaRecorder(combinedStream);
```

### BUG: Ken Burns não anima

**Causa:** Transform aplicado uma vez só, não por frame

```javascript
// ❌ ERRADO
applyKenBurns(panel);
drawAllFrames();

// ✅ CERTO
for (let frame = 0; frame < totalFrames; frame++) {
  const progress = frame / totalFrames;
  const transform = calculateKenBurns(panel, progress);
  drawFrameWithTransform(ctx, panel, transform);
}
```

## Debug Logging

Adicionar logs temporários para diagnóstico:

```javascript
// Em video-exporter.js
console.log('[Export] Iniciando...', {
  pages: project.pages.length,
  format: project.videoFormat,
  expectedDuration: calculateTotalDuration()
});

// Por página
console.log(`[Export] Página ${i + 1}/${total}`, {
  pageId: page.id,
  duration: page.duration,
  panels: page.panels.length
});

// Ao finalizar
console.log('[Export] Completo', {
  actualDuration: videoBlob.duration,
  fileSize: videoBlob.size
});
```

## Validation Procedure

1. **Projeto teste mínimo:**
   - 2 páginas, 4s cada = 8s total
   - 1 painel por página
   - Sem áudio (primeiro teste)

2. **Export e verificar:**
   ```bash
   # No terminal
   ffprobe output.webm
   # Verificar: Duration: 00:00:08.00
   ```

3. **Adicionar áudio:**
   - Background music
   - Narração página 1
   - Re-export e verificar sinc no VLC

4. **Console deve mostrar:**
   - Zero erros
   - Progress logs de cada página
   - Duração final correta

## Arquivos a Verificar

| Arquivo | O que verificar |
|---------|-----------------|
| `video-exporter.js` | Loop de páginas, MediaRecorder, timing |
| `app.js` | AudioManager (se problema de áudio) |
| `layouts-video.js` | Cálculo de painéis (se tela preta) |

## Quick Debug Snippet

```javascript
// Cole no console para debug rápido
window.DEBUG_EXPORT = true;

// Em video-exporter.js, adicionar:
if (window.DEBUG_EXPORT) {
  console.log('[DEBUG]', { step, data });
}
```
