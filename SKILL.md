# HQ Movie - SKILL: Launch-and-Leave Blueprint

Checklist completo para validacao, deploy e manutencao zero-touch.

---

## 1. ARQUITETURA

- **Stack:** Vanilla JS + CSS, 100% client-side, offline-first (SW cache)
- **Servidor:** Qualquer static file server (npx serve, nginx, netlify)
- **Storage:** IndexedDB (Dexie) para projetos, localStorage para prefs
- **Export:** Canvas-based video rendering (WebM/MP4) + PNG + ZIP
- **Deps externas:** Google Fonts (fallback local), Excalidraw (vendored)

### Arquivos-chave
| Arquivo | Responsabilidade |
|---------|-----------------|
| `index.html` | Entry point, version query strings |
| `styles-v3.css` | Todo o CSS (8000+ linhas), responsive |
| `ui.js` | Render de todas as telas (dashboard, editor, export) |
| `controller.js` | Logica de estado, zoom, mobile workflow, export |
| `app.js` | Store, inicializacao, event bindings |
| `video-exporter.js` | Render de video frame-a-frame |
| `layouts.js` | Definicoes de layouts por formato |
| `sw.js` | Service Worker cache-first |
| `i18n.js` | Internacionalizacao PT/EN |

### Variaveis CSS criticas (mobile)
```
--toolbar-h: 48px
--timeline-h: 0px (mobile)
--mobile-nav-h: 64px
--left-w: 0px (mobile)
--right-w: 0px (mobile)
```

---

## 2. TESTE MOBILE OBRIGATORIO

### Setup
```
1. Chrome DevTools (F12)
2. Toggle Device (Ctrl+Shift+M)
3. Device: iPhone 14 Pro (390x844)
4. URL: http://localhost:8082
5. Hard refresh (Ctrl+Shift+R) para limpar cache
```

### 2.1 Checklist Dashboard
- [ ] Logo e titulo visiveis
- [ ] Botao "Novo Projeto" clicavel (44px+)
- [ ] Cards de projeto recentes visiveis
- [ ] Scroll funciona (momentum)
- [ ] Language switch EN/PT funciona

### 2.2 Checklist Format Picker
- [ ] 4 formatos visiveis: 9:16, 16:9, 1:1, 4:3
- [ ] Resolucoes corretas exibidas
- [ ] Botao Voltar funciona
- [ ] Clicar formato cria projeto e vai pro editor

### 2.3 Checklist Editor
- [ ] Canvas visivel (nao tela preta total)
- [ ] Mobile nav (5 botoes: Midia, Texto, Timing, Preview, Exportar)
- [ ] Nav fixo no bottom, sem sobreposicao
- [ ] Zoom controls ACIMA do nav (position:fixed, z-index:1005)
- [ ] Zoom +/- funciona (clicavel, muda percentual)
- [ ] "Ajustar ao ecra" funciona
- [ ] Pan mode funciona
- [ ] Indicador pagina visivel (1/1, 1/2, etc)
- [ ] Page selector buttons (1,2,3,4) funcionam

### 2.4 Checklist Layouts (testar em CADA formato)
Formatos: 9:16, 16:9, 1:1, 4:3

| Formato | Layouts disponiveis |
|---------|-------------------|
| 9:16 | Splash Vertical (1p), Dialogo Dual (2p), Sequencia Tripla (3p), Grid 2x2 (4p) |
| 16:9 | Cinematic Full (1p), Split Screen (2p), Hero+Context (3p), Grid 3x2 (6p) |
| 1:1 | Full Square (1p), Split Vertical (2p), Trio Stack (3p), Grid 2x2 (4p) |
| 4:3 | Full Portrait (1p), Split Vertical (2p), Trio Stack (3p), Grid 2x2 (4p) |

- [ ] Cada layout renderiza corretamente o numero de paineis
- [ ] Labels dos paineis nao overflow na tela
- [ ] Texto "sidebar" NAO aparece em mobile (hidden)

### 2.5 Checklist Drawers (mobile)
- [ ] Midia: PAGINAS + LAYOUT + ELEMENTOS HQ + Excalidraw
- [ ] Texto: 6 botoes (Narracao, Fala, Pensamento, Grito, Sussurro, Efeito)
- [ ] Timing: DURACAO, ANIMACAO (Ken Burns), TRANSICAO
- [ ] Timing: drawer abre no scroll correto (DURACAO visivel)
- [ ] Drawer fecha ao clicar backdrop
- [ ] Drawer fecha ao selecionar balao (auto-close)

### 2.6 Checklist Preview
- [ ] Preview fullscreen abre
- [ ] Botao Fechar visivel e funciona
- [ ] Canvas renderiza corretamente

### 2.7 Checklist Export
- [ ] Pagina export acessivel via nav bottom E header button
- [ ] Quick settings: Qualidade, Formato/FPS, Idioma
- [ ] Botao "Exportar Video" visivel e clicavel
- [ ] Collapsibles (Checklist, Modo, PNG, Assets) abrem/fecham
- [ ] Preview das paginas com thumbnails
- [ ] Voltar ao Editor funciona

### 2.8 Checklist Baloes (todos os 6)
- [ ] Narracao: caixa retangular, texto editavel
- [ ] Fala: balao com cauda, arrastavel
- [ ] Pensamento: balao nuvem
- [ ] Grito: balao explosivo
- [ ] Sussurro: balao tracejado
- [ ] Efeito: texto SFX

---

## 3. TESTE DESKTOP OBRIGATORIO

### Setup: 1280x800 (laptop padrao)

- [ ] Dashboard: todos os cards, botoes, idioma
- [ ] Editor: left sidebar + canvas + right sidebar
- [ ] Left sidebar: PAGINAS, LAYOUT, ELEMENTOS HQ, Excalidraw
- [ ] Right sidebar: BIBLIOTECA, PAGINA, EFEITOS, CAMADAS, STICKERS, AUDIO, DURACAO, ANIMACAO, TRANSICAO, ATALHOS
- [ ] Timeline bar no bottom com play, progress, paginas
- [ ] Zoom controls no canvas area (bottom-right)
- [ ] Export page: sidebar com settings + canvas preview
- [ ] Undo/Redo funciona (Ctrl+Z / Ctrl+Y)

---

## 4. BUGS CONHECIDOS E FIXES

### BUG-001: Zoom controls interceptados pelo mobile nav (CORRIGIDO v91)
- **Root cause:** position:absolute dentro de canvas-area calculava bottom relativo ao container, overlap 32px com nav
- **Fix:** `position: fixed !important; z-index: 1005 !important;`
- **Arquivo:** `styles-v3.css` linha ~7266

### BUG-002: bento-frame transform:none mata zoom (CORRIGIDO v91)
- **Root cause:** CSS `transform: none !important` impedia JS viewport zoom
- **Fix:** Removido de `.canvas-scroll` e `.bento-frame`
- **Arquivo:** `styles-v3.css` linhas ~7232-7246

### BUG-003: Panel labels overflow mobile (CORRIGIDO v91)
- **Fix:** `max-width:100%; overflow:hidden; text-overflow:ellipsis; font-size:11px`
- **Arquivo:** `styles-v3.css` linhas ~7254-7263

### BUG-004: Timing drawer scroll mid-content (CORRIGIDO v91)
- **Fix:** `content.scrollTop = 0` antes de `scrollIntoView`
- **Arquivo:** `controller.js` funcao `scrollMobileDrawerTo()`

### BUG-005: Texto "sidebar" visivel em mobile (CORRIGIDO v91)
- **Fix:** `display: none !important` para `.slot-helper-text`
- **Arquivo:** `styles-v3.css` linhas ~7248-7252

### BUG-006: Formatos parecem identicos em mobile (CORRIGIDO v92)
- **Root cause:** CSS `max-width`/`max-height` no `.bento-frame`, `display:flex` centering no `.canvas-area` conflitava com JS `translate()` transform, `newProject()` nao chamava `zoomFit()`, padding excessivo
- **Fix:** 7 sub-fixes em `controller.js` (auto zoomFit, fitW mobile, pad 16px) e `styles-v3.css` (canvas-area position:relative, canvas-scroll position:absolute + transform-origin:0 0, bento-frame outline)
- **Resultado:** Cada formato tem shape distinta: Vertical=374×665 PORTRAIT, Widescreen=374×210 LANDSCAPE, Square=374×374, Portrait=374×281

### BUG-007: Multi-panel layouts invisiveis em mobile (CORRIGIDO v92)
- **Root cause:** Mesmo que BUG-006 — canvas constrained por CSS
- **Fix:** Corrigido junto com BUG-006
- **Verificado:** 2-panel, 3-panel e 6-panel visiveis em widescreen mobile

### BUG historico: Drawer nao fecha ao selecionar balao
- **Fix:** `if (this.isMobile()) this._closeMobileSidebar();` em `startBalloonPlacement()`

### BUG historico: Right panel inline em mobile
- **Fix:** `.right-panel { transform: translateY(100%) !important; }`

### BUG historico: Export sidebar desktop gigante
- **Fix:** Progressive disclosure com `<details>` collapsibles

---

## 5. ANTES DE DEPLOY

```
1. [ ] Rodar TODA a checklist mobile (secao 2)
2. [ ] Rodar TODA a checklist desktop (secao 3)
3. [ ] Console (F12) - ZERO errors (Google Fonts warning ok)
4. [ ] Atualizar CACHE_NAME em sw.js
5. [ ] Atualizar versions nos ASSETS de sw.js
6. [ ] Atualizar query strings em index.html
7. [ ] Hard refresh em dispositivo real
8. [ ] Testar offline (desligar rede, recarregar)
9. [ ] Testar export video (pelo menos 1 video completo)
10. [ ] Testar import/export .hq (save + reopen)
```

---

## 6. VERSIONING PROTOCOL

Ao modificar qualquer arquivo:
1. Incrementar versao em `sw.js` ASSETS array
2. Incrementar versao em `index.html` query string
3. Incrementar CACHE_NAME em `sw.js`
4. Atualizar tabela de versoes abaixo

| Arquivo | Versao |
|---------|--------|
| sw.js | v92-mobile-zoom |
| styles-v3.css | v32 |
| controller.js | v29 |
| ui.js | v35 |
| app.js | v11 |
| video-exporter.js | v11 |
| layouts.js | v4 |
| layouts-video.js | v7 |
| i18n.js | v5 |
| onboarding.js | v8 |

---

## 7. WATERMARK (IMPLEMENTADO)

```javascript
// video-exporter.js renderWatermark()
// Verifica premium key; se nao premium, renderiza "HQ MOVIE" no canto
// Font: width * 0.028, cor: rgba(255,255,255,0.55)
// Posicao: bottom-right (88% x, 92% y)
```

---

## 8. RECOMENDACOES FUTURAS

- ~~**Auto zoomFit:** Chamar `zoomFit()` automaticamente apos render do editor em mobile~~ ✅ IMPLEMENTADO v92
- **Local Fonts:** Servir Google Fonts localmente em `/vendor/fonts/` para 100% offline
- **Mobile Preview Mode:** Canvas widescreen fica 374×210px em 390px phone — considerar modo preview com canvas escalado para edicao
- **E2E Tests:** Playwright script automatizado para toda a checklist (ver `audit-screenshots/`)
- **PWA:** Verificar manifest.json com lighthouse score
- **Performance:** Lazy-load Excalidraw vendor (400KB+)

---

*Ultima atualizacao: 2026-03-11 | Auditoria v92 — Sessao 2: Mobile format + zoom fixes*
