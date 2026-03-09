---
description: Integrar sistema de áudio (música de fundo, narração bilíngue, ducking) no HQ Movie
triggers:
  - adicionar áudio
  - narração
  - música de fundo
  - ducking
  - sincronizar
  - audio
  - background music
---

# HQ Movie: Audio Integration

Use ao trabalhar com features de áudio ou export de vídeo.

## Inputs Necessários

- **Tipo de áudio:** background (música), narration (narração)
- **Idiomas:** PT-BR, EN, ou ambos
- **Página específica:** (se narração)

## AudioManager API

```javascript
// Música de fundo
AudioManager.setBackgroundMusic(file, volume, loop);

// Narração por página
AudioManager.setPageNarration(pageId, lang, file, volume);

// Ducking automático
AudioManager.applyDucking(bgVolume, narrationVolume);

// Preview
AudioManager.play();
AudioManager.pause();
AudioManager.stop();
```

## Estrutura de Dados

```javascript
project: {
  videoAudio: {
    background: {
      file: File | Blob | null,
      fileName: 'background.mp3',
      volume: 0.3,
      loop: true
    },
    pages: [
      {
        pageId: 'page_1',
        narration: {
          'pt-BR': {
            file: File | Blob | null,
            fileName: 'narracao_p1_ptbr.mp3',
            volume: 1.0
          },
          'en': {
            file: File | Blob | null,
            fileName: 'narration_p1_en.mp3',
            volume: 1.0
          }
        }
      }
    ]
  }
}
```

## Steps de Implementação

1. **UI de Upload:**
   - Background: 1 slot de upload (aceita MP3/WAV/OGG)
   - Narração: 2 slots por página (🇧🇷 PT-BR | 🇺🇸 EN)
   - Controles: volume slider, play/pause preview

2. **Handlers em controller.js:**
   ```javascript
   async function handleAudioUpload(type, file, pageId, lang) {
     if (type === 'background') {
       project.videoAudio.background.file = file;
     } else if (type === 'narration') {
       const page = project.videoAudio.pages.find(p => p.pageId === pageId);
       page.narration[lang].file = file;
     }
     await saveProject();
   }
   ```

3. **Preview no Editor:**
   - Play/pause individual para cada áudio
   - Mixer global (ajustar volumes)
   - Visualização de waveform (opcional)

## Princípios de Áudio

| Regra | Descrição |
|-------|-----------|
| **Música contínua** | Background NÃO para entre páginas |
| **Ducking automático** | Música abaixa 50% durante fala |
| **Crossfade** | 500ms entre narrações de segmentos |
| **Sincronização** | Usar `audioContext.currentTime` |

## Ducking Implementation

```javascript
function applyDucking(bgGain, narrationGain, isNarrationPlaying) {
  if (isNarrationPlaying) {
    // Abaixa música para 50% durante narração
    bgGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.3);
  } else {
    // Volta ao volume normal
    bgGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.5);
  }
}
```

## VideoExporter Integration

```javascript
// Em video-exporter.js
async function mixAudioTracks(audioContext, duration) {
  const destination = audioContext.createMediaStreamDestination();
  
  // Background music (loop se necessário)
  if (project.videoAudio.background.file) {
    const bgBuffer = await decodeAudio(project.videoAudio.background.file);
    const bgSource = audioContext.createBufferSource();
    bgSource.buffer = bgBuffer;
    bgSource.loop = true;
    
    const bgGain = audioContext.createGain();
    bgGain.gain.value = project.videoAudio.background.volume;
    
    bgSource.connect(bgGain).connect(destination);
    bgSource.start(0);
  }
  
  // Narração por página (sincronizada com timeline)
  let timeOffset = 0;
  for (const page of project.pages) {
    const narration = getPageNarration(page.id, activeLanguage);
    if (narration?.file) {
      const narBuffer = await decodeAudio(narration.file);
      const narSource = audioContext.createBufferSource();
      narSource.buffer = narBuffer;
      narSource.connect(destination);
      narSource.start(timeOffset);
    }
    timeOffset += page.duration;
  }
  
  return destination.stream;
}
```

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `app.js` | AudioManager helper |
| `controller.js` | Upload handlers, volume controls |
| `ui.js` | Audio UI section (uploads, sliders) |
| `video-exporter.js` | Audio mixing no export |

## Validation Commands

1. Upload arquivo MP3/WAV no editor
2. Play preview - verificar áudio toca
3. Ajustar volume - verificar slider funciona
4. Export vídeo
5. Verificar sincronização no VLC

## Checklist

- [ ] Upload de áudio funciona (drag & drop + botão)
- [ ] Preview play/pause funciona
- [ ] Volume slider ajusta corretamente
- [ ] Ducking ativa durante narração
- [ ] Export inclui áudio sincronizado
- [ ] Crossfade suave entre páginas
