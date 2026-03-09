# RELATÓRIO UAT — HQ MOVIE

**Data:** 2026-03-06  
**Testador:** Cascade (UAT via Playwright MCP em browser real)  
**Ambiente:** Linux, Chromium headless, localhost:8082  
**Versão:** HQ Movie v4 (Core) / v14 (VideoExporter)

---

## ✅ SCREENSHOTS: 12 capturas reais do app

| # | Arquivo | Descrição |
|---|---------|-----------|
| 01 | `01-dashboard.png` | Dashboard inicial — logo, botão Novo Projeto, projeto existente |
| 02 | `02-format-selector.png` | Seletor de 4 formatos (Vertical, Widescreen, Square, Portrait) |
| 03 | `03-editor-empty.png` | Editor vazio — canvas vertical, sidebars, timeline |
| 04 | `04-panel-with-image.png` | Painel com imagem Flintstones, efeitos visíveis |
| 05 | `05-balloon-placed.png` | Balão de fala posicionado no canvas |
| 06 | `06-balloon-pt-br.png` | Balão com texto "Olá! Este é um teste." em PT-BR |
| 07 | `07-page2-with-image.png` | Página 2 com Danny Phantom, Ken Burns Pan Direita |
| 08 | `08-export-page.png` | Página de export com preview de 2 páginas |
| 09 | `09-export-complete.png` | Export concluído — progress bar 100% |
| 10 | `10-preview-playing.png` | Preview rodando — transição para página 2 |
| 11 | `11-language-en.png` | Editor após troca para EN |
| 12 | `12-timeline-2pages.png` | Timeline com 2 páginas, 8s total |

---

## ✅ VÍDEOS GERADOS: 1 arquivo .webm

| Arquivo | Tamanho | Duração | Resolução | Codec |
|---------|---------|---------|-----------|-------|
| `projeto-vertical-pt-br.webm` | 15.6 KB | 3.94s | 1080×1920 | VP9 30fps |

**Nota:** Duração deveria ser ~8s (2 páginas × 4s). Ver BUG #2.

---

## 🐛 BUGS ENCONTRADOS: 2 críticos, 2 médios, 1 baixo

### Críticos (BLOQUEANTES)

#### BUG #1: VideoExporter Declarado Duas Vezes
- **Onde:** Carregamento do app
- **Detalhe:** `video-exporter.js` declara `class VideoExporter`, `app.js` declara `const VideoExporter` — colisão no escopo global
- **Console:** `Identifier 'VideoExporter' has already been declared`
- **Impacto:** Erro em 100% dos carregamentos. O VideoExporter de `app.js` não carrega.
- **Fix:** Renomear um deles ou unificar implementações

#### BUG #2: Vídeo Exportado com Metade da Duração Esperada
- **Onde:** Export > Exportar Vídeo WebM
- **Detalhe:** Projeto com 2 páginas × 4s = 8s total, mas vídeo exportado tem apenas ~4s
- **ffprobe:** `Duration: 00:00:03.94`
- **Impacto:** Conteúdo de páginas cortado no vídeo final
- **Causa provável:** Race condition entre `renderPage()` async e `MediaRecorder`, ou o loop de páginas não espera completamente cada render

### Médios

#### BUG #4: activeLanguage Não Inicializado em Novo Projeto
- **Onde:** Criar novo projeto
- **Detalhe:** `Store.get('currentProject').activeLanguage` retorna `undefined`
- **Impacto:** Balloon text salvo como string simples (não multi-lang), toggle de idioma não funciona
- **Fix:** Inicializar `activeLanguage: 'pt-BR'` na criação do projeto

#### BUG #5: Ctrl+T Abre Nova Aba do Browser
- **Onde:** Editor > Atalho teclado
- **Detalhe:** Browser intercepta Ctrl+T antes do handler JS
- **Impacto:** Impossível trocar idioma via atalho
- **Fix:** Usar atalho diferente (Alt+T ou Ctrl+Shift+L)

### Baixo

#### BUG #3: Export Mostra "0.0 MB" no Tamanho
- **Onde:** Export > Status após conclusão
- **Detalhe:** Arquivo de 15.6 KB exibe "Pronto! 0.0 MB"
- **Fix:** Mostrar em KB para arquivos < 1MB

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### Bloqueantes (DEVE funcionar)

- [x] Criar projeto funciona
- [x] Upload imagem funciona
- [x] Adicionar balão funciona
- [ ] ~~Trocar idioma funciona~~ — **BUG #4 + #5**: não inicializa, atalho não funciona
- [x] Export gera .webm
- [ ] ~~Vídeo com duração correta~~ — **BUG #2**: metade da duração
- [x] Texto aparece no balão
- [ ] ~~ZERO erros no console~~ — **BUG #1**: VideoExporter duplicado

### Importantes (DEVERIA funcionar)

- [x] Preview funciona (transição entre páginas OK)
- [x] Animações Ken Burns selecionáveis (7 opções)
- [ ] Áudio — não testado (sem arquivo MP3 disponível)
- [ ] Narrative track — não testado (foco nos bloqueantes)
- [ ] Música contínua — não testado
- [ ] Ducking — não testado
- [ ] Export ambos idiomas — bloqueado por BUG #4

### Desejáveis (BOM TER)

- [ ] ~~Ctrl+T toggle idioma~~ — **BUG #5**
- [ ] Validação tradução faltando — não testado
- [x] Progress bar funciona (mostra frames/total, percentual)
- [x] Preview rápido (< 2s para iniciar)

---

## 🎨 IMPRESSÕES DE UX

### Positivo
- **UI moderna e bonita** — tema escuro, cores accent verdes, ícones limpos
- **Layout do editor bem organizado** — 3 colunas intuitivas
- **Seletor de formato excelente** — 4 opções claras com ícones e dimensões
- **Balloon customization rico** — tipo, fonte, cor fundo, cor texto, cauda, opacidade
- **Ken Burns fácil de usar** — 7 presets com ícones visuais
- **Timeline funcional** — mostra duração, animação por página
- **Export page informativa** — preview das páginas, stats, múltiplos formatos
- **Efeitos visuais variados** — 8 efeitos (Papercut, Halftone, Vintage, etc.)

### Negativo
- **Balão pequeno por default** — difícil de ler texto no canvas
- **Sem indicador visual de idioma ativo** — não sei se estou em PT ou EN
- **Sem botão visível de troca de idioma** — apenas atalho Ctrl+T (que não funciona)
- **Export file size mostrado incorretamente** — "0.0 MB"

---

## 📊 APROVAÇÃO

### ● NÃO APROVADO — Corrigir críticos primeiro

**Razão:** 2 bugs críticos impedem uso básico:
1. Console error em todo carregamento (VideoExporter duplicado)
2. Vídeo exportado com duração incorreta (metade do esperado)

### Ações Necessárias (Prioridade)

1. **[CRÍTICO]** Resolver duplicação VideoExporter (`app.js` vs `video-exporter.js`)
2. **[CRÍTICO]** Corrigir duração do vídeo exportado (todas as páginas devem renderizar)
3. **[MÉDIO]** Inicializar `activeLanguage` na criação de projeto
4. **[MÉDIO]** Trocar atalho Ctrl+T para algo que browser não intercepte
5. **[BAIXO]** Mostrar tamanho em KB quando < 1MB

---

## 📁 ESTRUTURA DE ENTREGÁVEIS

```
tests/validation-suite/output/
├── screenshots/
│   ├── 01-dashboard.png
│   ├── 02-format-selector.png
│   ├── 03-editor-empty.png
│   ├── 04-panel-with-image.png
│   ├── 05-balloon-placed.png
│   ├── 06-balloon-pt-br.png
│   ├── 07-page2-with-image.png
│   ├── 08-export-page.png
│   ├── 09-export-complete.png
│   ├── 10-preview-playing.png
│   ├── 11-language-en.png
│   └── 12-timeline-2pages.png
├── videos/
│   └── projeto-vertical-pt-br.webm
├── bugs/
│   ├── BUG-001-videoexporter-duplicate-declaration.md
│   ├── BUG-002-export-duration-half.md
│   ├── BUG-003-export-filesize-display-zero.md
│   ├── BUG-004-language-not-initialized.md
│   └── BUG-005-ctrl-t-opens-browser-tab.md
└── VALIDATION-REPORT.md
```
