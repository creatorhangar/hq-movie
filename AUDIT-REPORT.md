# HQ Movie - Auditoria Visual End-to-End

**Data:** 2026-03-11
**Viewport Desktop:** 1280x800
**Viewport Mobile:** 390x844 (iPhone 14 Pro)
**URL:** http://localhost:8082
**Screenshots:** `audit-screenshots/`

---

## Resumo

| Area | Desktop | Mobile |
|------|---------|--------|
| Dashboard | OK | OK |
| Format Picker | OK | OK |
| Editor 9:16 (1-4 panels) | OK | FIXED |
| Editor 16:9 (1-6 panels) | OK | FIXED |
| Editor 1:1 | OK | FIXED |
| Editor 4:3 | OK | FIXED |
| Export Page | OK | OK |
| Drawer Midia | N/A | OK |
| Drawer Texto | N/A | OK |
| Drawer Timing | N/A | Fixed |
| Preview Fullscreen | N/A | OK |
| Zoom Controls | OK | FIXED |
| Fit to Screen | OK | FIXED |
| Format Selection | OK | FIXED (was perceived broken) |
| Multi-panel Layouts | OK | FIXED |

---

## Bugs Encontrados e Corrigidos

### BUG-001: Zoom controls interceptados pelo mobile nav (CRITICO)
- **Antes:** z-index 999 < nav 1002 + position absolute causava overlap fisico
- **Root cause:** zoom bottom=812px, nav top=780px (32px overlap)
- **Fix:** `position: fixed !important` + `z-index: 1005`
- **Arquivo:** `styles-v3.css` linha ~7266
- **Verificado:** overlap=false (zoom bottom=768, nav top=780)

### BUG-002: bento-frame transform:none mata viewport zoom (ALTO)
- **Antes:** CSS `transform: none !important` impedia JS zoom/pan
- **Fix:** Removido de `.canvas-scroll` e `.bento-frame`
- **Arquivo:** `styles-v3.css` linhas ~7232-7246

### BUG-003: Panel labels overflow em mobile (MEDIO)
- **Antes:** "Quadro 1 / 2x clique" vazava alem da borda direita
- **Fix:** `max-width:100%`, `overflow:hidden`, `text-overflow:ellipsis`, `font-size:11px`
- **Arquivo:** `styles-v3.css` linhas ~7254-7263

### BUG-004: Timing drawer scroll mid-content (MEDIO)
- **Antes:** Drawer abria mostrando EFEITOS cortado no topo
- **Fix:** `scrollTop = 0` antes de `scrollIntoView`
- **Arquivo:** `controller.js` funcao `scrollMobileDrawerTo()`

### BUG-005: Texto "sidebar" visivel em mobile (BAIXO)
- **Antes:** Helper text "escolha um layout na sidebar" visivel sem sidebar
- **Fix:** CSS `display: none !important` para `.slot-helper-text`
- **Arquivo:** `styles-v3.css` linhas ~7248-7252

### BUG-006: Formatos parecem identicos em mobile — "todos abrem Story" (CRITICO)
- **Antes:** Canvas 19% zoom, preto em fundo escuro, impossivel distinguir 16:9 vs 9:16
- **Root cause 1:** CSS `max-width`/`max-height` no `.bento-frame` restringia canvas a 366x692px
- **Root cause 2:** CSS `display:flex` + centering no `.canvas-area` conflitava com JS `translate()` transform
- **Root cause 3:** `newProject()` nao chamava `zoomFit()` apos criacao
- **Root cause 4:** Padding de 64px no zoomFit() desperdicava espaco em tela 390px
- **Fix 1:** Removido `max-width`/`max-height` do `.bento-frame`
- **Fix 2:** `.canvas-area` mudado para `position:relative; overflow:hidden` (sem flex centering)
- **Fix 3:** `.canvas-scroll` mudado para `position:absolute; transform-origin:0 0`
- **Fix 4:** `newProject()` agora chama `zoomFit()` via double `requestAnimationFrame`
- **Fix 5:** Padding mobile reduzido de 64px para 16px no `zoomFit()`
- **Fix 6:** Mobile usa `fitW` (fit-to-width) em vez de `min(fitW, fitH)`
- **Fix 7:** Adicionado `outline` + `box-shadow` no `.bento-frame` para contraste
- **Arquivos:** `controller.js` (zoomFit, newProject), `styles-v3.css` (canvas-area, canvas-scroll, bento-frame)
- **Verificado:** Cada formato agora tem forma visualmente distinta:
  - Vertical 9:16: 35% zoom → 374×665px (PORTRAIT)
  - Widescreen 16:9: 19% zoom → 374×210px (LANDSCAPE)
  - Quadrado 1:1: 35% zoom → 374×374px (SQUARE)
  - Retrato 4:3: 26% zoom → 374×281px (LANDSCAPE)

### BUG-007: Multi-panel layouts invisiveis em mobile (CRITICO)
- **Antes:** Divisoes de paineis impossiveis de ver em canvas minusculo
- **Root cause:** Mesmo que BUG-006 — canvas constrained por CSS
- **Fix:** Corrigido junto com BUG-006
- **Verificado:** Layouts 2-panel, 3-panel e 6-panel visiveis em widescreen mobile
- **Screenshots:** 49 (2-panel), 50 (3-panel), 51 (6-panel)

---

## Issues Conhecidos (Nao corrigidos)

### ISSUE-001: Google Fonts falha offline
- Console: ERR_FAILED ao carregar JetBrains Mono
- Impacto: Baixo - fallback font usado. App offline-first.
- Recomendacao: Servir fonts localmente em /vendor/fonts/

### ISSUE-002: Widescreen canvas pequeno em tela 390px (DESIGN)
- Canvas 1920x1080 em tela 390px = 19% zoom = 374×210px
- Funcional mas pequeno para edicao detalhada
- User pode usar Zoom+ e Pan para navegar
- Recomendacao futura: Considerar "mobile preview mode" com canvas escalado

---

## Screenshots Capturados (audit-screenshots/)

### Desktop (1280x800)
- 01: Dashboard
- 02: Format Picker
- 03-06: Editor 9:16 (1,2,3,4 panels)
- 07: Editor 16:9 (1 panel)
- 08-09: Editor 16:9 (layout switch)
- 10: Editor 1:1 (1 panel)
- 11: Editor 1:1 (4 panels)
- 12: Editor 4:3 (1 panel)
- 13: Editor 4:3 (4 panels)
- 14: Export Page

### Mobile (390x844)
- 15: Dashboard
- 16: Editor 4:3 4-panel
- 17: Drawer Midia
- 18: Drawer Texto (6 baloes + Excalidraw)
- 19: Drawer Timing
- 20: Preview Fullscreen
- 21: Export Page
- 22-23: Zoom (antes do fix)
- 24: Format Picker mobile
- 25: Editor 9:16 1-panel
- 30: Zoom funcionando (apos fix)
- 31: Fit-to-screen (apos fix)
- 38: Vertical 9:16 CSS fixed
- 45: Widescreen centered
- 47: Widescreen com outline verde (debug)
- 48: Widescreen final
- 49: Widescreen 2-panel Split Screen
- 50: Widescreen 3-panel Hero+Context
- 51: Widescreen 6-panel Grid 3x2

---

## Versoes Atuais

| Arquivo | Versao |
|---------|--------|
| sw.js | v92-mobile-zoom |
| styles-v3.css | v32 |
| controller.js | v29 |
| ui.js | v35 |

---

## Arquivos Modificados

- `styles-v3.css` - 10 fixes CSS (zoom, transform, labels, sidebar text, overflow, canvas-area, canvas-scroll, bento-frame outline, max-width removal)
- `controller.js` - 3 fixes JS (drawer scroll reset, newProject auto zoomFit, mobile fitW zoom)
- `sw.js` - version bump v91→v92
- `index.html` - version bump query strings v31→v32, v28→v29

*Auditoria atualizada em 2026-03-11 — Sessao 2: Mobile format + zoom fixes*
