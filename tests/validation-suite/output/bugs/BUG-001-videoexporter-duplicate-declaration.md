### BUG #1: VideoExporter Identifier Declared Twice

**Severidade:** ● Crítico

**Onde:** Carregamento do app — `video-exporter.js` + `app.js`

**Passos para Reproduzir:**
1. Abrir `http://localhost:8082`
2. Abrir DevTools (F12) → Console
3. Erro imediato no carregamento

**Esperado:**
Nenhum erro no console durante carregamento normal

**Atual:**
```
Identifier 'VideoExporter' has already been declared
```

**Causa Raiz:**
- `video-exporter.js` (linha 6) declara `class VideoExporter { ... }`
- `app.js` (linha 2849) declara `const VideoExporter = { ... }`
- Ambos carregados via `<script>` em `index.html` (linhas 78-79)
- O segundo `const` colide com o `class` já declarado no escopo global

**Impacto:**
- O `VideoExporter` de `app.js` NÃO é carregado (erro de parse impede)
- O `controller.js` chama `VideoExporter.exportVideo()` que existe no `app.js` (linha 2849+)
- Porém como o `app.js` VideoExporter falha, o controller usa o da `video-exporter.js`
- Funcionalidade de export PODE funcionar parcialmente, mas com comportamento imprevisível

**Fix Sugerido:**
Renomear o VideoExporter em `app.js` para `VideoExporterEngine` ou remover a duplicata, 
mantendo apenas uma implementação canônica.

**Prioridade:** Alta — erro em 100% dos carregamentos
