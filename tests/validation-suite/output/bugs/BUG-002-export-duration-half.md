### BUG #2: Vídeo Exportado com Duração Incorreta (~4s em vez de ~8s)

**Severidade:** ● Crítico

**Onde:** Export > Exportar Vídeo WebM

**Passos para Reproduzir:**
1. Criar projeto com 2 páginas (4s cada = 8s total)
2. Adicionar imagens em ambas
3. Exportar vídeo WebM
4. Verificar duração com ffprobe

**Esperado:**
Vídeo com duração ~8 segundos (2 páginas × 4s)

**Atual:**
```
ffprobe output:
Duration: 00:00:03.94, start: 0.000000, bitrate: 31 kb/s
```
Apenas ~4 segundos — equivalente a 1 página, não 2.

**Análise:**
- O `VideoExporter` em `video-exporter.js` usa `setTimeout` para `waitFrame()` (linha 336)
- O MediaRecorder pode não estar capturando todos os frames corretamente
- O loop `for (let i = 0; i < totalPages; i++)` pode estar executando mas o recorder
  não está sincronizado com o rendering loop
- Possível race condition entre `renderPage()` e `MediaRecorder.ondataavailable`

**Screenshot:** 09-export-complete.png

**Prioridade:** Crítica — vídeo exportado falta conteúdo de páginas
