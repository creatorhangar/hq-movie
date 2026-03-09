# 🎬 Como Ver os Vídeos Gerados

## 🚀 Método Rápido (Recomendado)

### 1. Abrir o Gerador de Vídeos
```bash
cd /home/tiago/CascadeProjects/HQ/hq-movie/tests/stress-test-2026-03-05/scripts
python3 -m http.server 8083
```

### 2. Abrir no Navegador
```
http://localhost:8083/generate-videos.html
```

### 3. Gerar Vídeos
- **Amostra (4 vídeos):** Clique em "🎯 Gerar Amostra" - ~30 segundos
- **Todos (28 vídeos):** Clique em "▶ Gerar Todos os Vídeos" - ~3-4 minutos

### 4. Assistir
Os vídeos aparecem automaticamente na página com player integrado!

---

## 📺 O Que Você Vai Ver

### Amostra (4 vídeos)
1. **Vertical 9:16 - Zoom In** 🔍
   - 1080×1920 px
   - Animação: aproximação gradual
   - 4 segundos
   
2. **Widescreen 16:9 - Pan Esquerda** ⬅
   - 1920×1080 px
   - Animação: movimento horizontal
   - 4 segundos
   
3. **Square 1:1 - Flutuação** 🌊
   - 1080×1080 px
   - Animação: movimento suave combinado
   - 4 segundos
   
4. **Portrait 4:3 - Estático** ⏹
   - 1440×1080 px
   - Sem animação
   - 4 segundos

### Todos os Vídeos (28 total)

#### Vertical 9:16 (7 vídeos)
- ⏹ Estático
- 🔍 Zoom In
- 🔎 Zoom Out
- ⬅ Pan Esquerda
- ➡ Pan Direita
- ⬆ Pan Cima
- 🌊 Flutuação

#### Widescreen 16:9 (7 vídeos)
- ⏹ Estático
- 🔍 Zoom In
- 🔎 Zoom Out
- ⬅ Pan Esquerda
- ➡ Pan Direita
- ⬆ Pan Cima
- 🌊 Flutuação

#### Square 1:1 (7 vídeos)
- ⏹ Estático
- 🔍 Zoom In
- 🔎 Zoom Out
- ⬅ Pan Esquerda
- ➡ Pan Direita
- ⬆ Pan Cima
- 🌊 Flutuação

#### Portrait 4:3 (7 vídeos)
- ⏹ Estático
- 🔍 Zoom In
- 🔎 Zoom Out
- ⬅ Pan Esquerda
- ➡ Pan Direita
- ⬆ Pan Cima
- 🌊 Flutuação

---

## 🎨 Animações Ken Burns Implementadas

### ⏹ Estático
- Sem movimento
- Imagem fixa por 4 segundos

### 🔍 Zoom In
- Escala de 1.0 → 1.2
- Aproximação gradual e suave
- Foco no centro

### 🔎 Zoom Out
- Escala de 1.2 → 1.0
- Afastamento gradual
- Revela mais da imagem

### ⬅ Pan Esquerda
- Movimento horizontal da direita para esquerda
- Offset de 10% da largura
- Simula câmera seguindo ação

### ➡ Pan Direita
- Movimento horizontal da esquerda para direita
- Offset de 10% da largura
- Efeito cinematográfico

### ⬆ Pan Cima
- Movimento vertical de baixo para cima
- Offset de 10% da altura
- Revela conteúdo superior

### 🌊 Flutuação
- Movimento combinado (zoom + pan)
- Zoom senoidal (±5%)
- Pan circular suave
- Efeito orgânico e natural

---

## 💾 Especificações Técnicas

### Formato de Vídeo
- **Codec:** VP9 (WebM)
- **Bitrate:** 5 Mbps
- **FPS:** 30 frames por segundo
- **Duração:** 4 segundos por página
- **Tamanho médio:** 1-3 MB por vídeo

### Qualidade
- ✅ Alta qualidade visual
- ✅ Compressão eficiente
- ✅ Compatível com navegadores modernos
- ✅ Reprodução suave

---

## 📊 Conteúdo de Cada Vídeo

Cada vídeo contém:

1. **Animação Ken Burns** aplicada à imagem de fundo
2. **3 Balões de texto:**
   - Speech (fala): "Olá!"
   - Thought (pensamento): Frase média
   - Narration (narração): Texto longo

3. **Dimensões corretas** para o formato selecionado
4. **4 segundos** de duração

---

## 🔧 Troubleshooting

### Vídeos não aparecem?
1. Verifique se o servidor está rodando na porta 8083
2. Abra o Console do navegador (F12) para ver erros
3. Certifique-se de que está usando Chrome/Edge (melhor suporte a WebM)

### Geração muito lenta?
- Normal! Cada vídeo leva ~5-10 segundos para gerar
- 28 vídeos = ~3-4 minutos total
- Use "Gerar Amostra" para testar rapidamente

### Erro "MediaRecorder not supported"?
- Use Chrome, Edge ou Firefox atualizado
- Safari tem suporte limitado a WebM

---

## 📥 Download dos Vídeos

### Download Individual
- Clique com botão direito no vídeo
- "Salvar vídeo como..."
- Salve com extensão `.webm`

### Download em Lote
Os vídeos ficam na memória do navegador. Para salvar todos:
1. Abra o Console (F12)
2. Execute:
```javascript
generatedVideos.forEach(v => {
    const a = document.createElement('a');
    a.href = v.url;
    a.download = v.filename;
    a.click();
});
```

---

## 🎯 Próximos Passos

### Após Ver os Vídeos
1. Validar que as animações Ken Burns funcionam
2. Verificar qualidade visual
3. Testar em diferentes navegadores
4. Identificar melhorias necessárias

### Melhorias Futuras
- [ ] Adicionar áudio (música de fundo + narração)
- [ ] Transições entre páginas
- [ ] Efeitos de partículas
- [ ] Exportação MP4 (além de WebM)
- [ ] Renderização em alta resolução (4K)

---

## ✅ Checklist de Validação

Ao assistir os vídeos, verifique:

- [ ] Animação Ken Burns é visível e suave
- [ ] Dimensões corretas para cada formato
- [ ] Balões de texto legíveis
- [ ] Sem tearing ou artifacts
- [ ] FPS constante (30 fps)
- [ ] Tamanho de arquivo razoável (<5 MB)
- [ ] Reprodução sem travamentos

---

**Última atualização:** 2026-03-05 15:10:00 UTC-03:00  
**Versão:** HQ Movie v15 (com VideoExporter)
