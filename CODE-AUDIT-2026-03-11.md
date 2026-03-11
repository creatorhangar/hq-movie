# HQ Movie - Code Audit Report

**Date:** 2026-03-11  
**Auditor:** Cascade AI  
**Scope:** Full static code analysis covering architecture, bugs, i18n, accessibility, performance

---

## 🔴 Critical Bugs

### BUG-001: `openExportPage()` Clears Project Data
**File:** `controller.js:526`
**Severity:** CRITICAL
**Impact:** Export page cannot access project data

```javascript
async openExportPage() {
    this._blurActive();
    Store.set({ view: 'export', currentProject: null, ... }); // ← BUG: Sets to null!
    Store.loadProjects();
}
```

**Fix Required:** Remove `currentProject: null` - export page needs the project.

---

### BUG-002: Service Worker Version Mismatch
**Files:** `sw.js`, `index.html`
**Severity:** HIGH
**Impact:** Users may see stale code after updates

| File | SW Version | HTML Version |
|------|------------|--------------|
| video-exporter.js | v11 | v12 |
| styles-v3.css | v34 | v34 ✓ |
| controller.js | v30 | v30 ✓ |
| ui.js | v37 | v37 ✓ |

**Fix:** Update `sw.js` line 11: `video-exporter.js?v=11` → `v=12`

---

## 🟠 High Priority Issues

### BUG-003: Event Listener Imbalance (Potential Memory Leaks)
**File:** `controller.js`
**Count:** 42 `addEventListener` vs 27 `removeEventListener`

Missing cleanup detected in:
- `_initViewportEvents()` - touch/mouse handlers
- `startDragCoverElement()` - mousemove/mouseup
- Tooltip click-outside handlers

**Recommendation:** Audit all event listener registrations and ensure proper cleanup.

---

### BUG-004: 100+ Hardcoded Portuguese Strings
**File:** `controller.js`
**Severity:** HIGH (breaks i18n)

Examples found:
```javascript
Toast.show('Apenas imagens são aceitas (JPG, PNG, GIF, WebP)', 'error');  // Line 1226
Toast.show('Imagem excede limite seguro do navegador (50MB)', 'warning'); // Line 1227
Toast.show('Otimizando imagem...', 'info', 1500);                         // Line 1228
Toast.show('Nova página criada com a imagem');                            // Line 1396
Toast.show('Página sem slots vazios', 'error');                           // Line 1407
Toast.show('Clique no painel que quer substituir', 'info', 4000);         // Line 1447
Toast.show('Maximo 9 paineis');                                           // Line 2265
Toast.show('Minimo 1 painel');                                            // Line 2275
Toast.show('Painel muito pequeno para dividir');                          // Line 2294
// ... 90+ more instances
```

**Fix:** Replace all with `t('toast.keyName')` and add to locale files.

---

### BUG-005: Hardcoded Export Status Messages
**File:** `controller.js:8553`
```javascript
status.textContent = isStory
    ? 'Instagram: Novo post → Story → selecione os arquivos  ·  TikTok: Criar → Foto → selecione'
    : 'Instagram: Novo post → selecione todos os slides em ordem';
```

**Impact:** Export instructions always in Portuguese regardless of language setting.

---

## 🟡 Medium Priority Issues

### ISSUE-001: Memory Pressure from Undo System
**File:** `app.js:571-578`
```javascript
pushUndo() {
    const stack = [...this._s.undoStack, structuredClone(p)].slice(-50);
    // 50 full project snapshots with base64 images = potential GB of memory
}
```

**Recommendation:** Consider incremental undo or compressed snapshots for large projects.

---

### ISSUE-002: Full DOM Re-render on Every State Change
**File:** `controller.js:100`
```javascript
app.innerHTML = renderDashboard();  // Nukes entire DOM tree
```

**Impact:** 
- Poor performance on slow devices
- Loss of scroll position
- Input focus issues (partially mitigated by guard on line 89)

**Recommendation:** Consider virtual DOM or targeted updates.

---

### ISSUE-003: Accumulated Migration Code
**File:** `controller.js:359-520`
**Count:** 15+ migration blocks in `openProject()`

Each project open runs through all historical migrations. Consider:
- Version flag on projects
- Skip migrations already applied
- Consolidate to single migration function

---

### ISSUE-004: TODO Comments in Production Code
**File:** `controller.js:4708`
```javascript
// For now, add the first library image (TODO: show picker modal)
```

---

## 🟢 Accessibility Issues

### A11Y-001: Viewport Prevents User Zoom
**File:** `index.html:6`
```html
<meta name="viewport" content="..., user-scalable=no">
```

**Impact:** Violates WCAG 2.1 - users with low vision cannot zoom.
**Fix:** Remove `user-scalable=no` or set `user-scalable=yes`.

---

### A11Y-002: Limited ARIA Labels
**Finding:** Only 17 aria-labels found in `ui.js`

Missing on:
- Zoom control buttons
- Page list items  
- Balloon creation buttons
- Most toolbar buttons

---

### A11Y-003: Small Touch Targets
**File:** `styles-v3.css`
**Finding:** Multiple elements with min-height < 44px

```css
.timeline.collapsed { min-height: 32px; }  /* Line 2085 */
.tl-page-dur { min-height: 24px; }         /* Line 7354 */
.btn-sm { min-height: 36px; }              /* Line 7444 (mobile) */
```

**Recommendation:** Ensure all interactive elements meet 44x44px minimum.

---

## 🔵 Code Quality Issues

### QUALITY-001: Massive Single File
**File:** `controller.js` — 10,440 lines

Should be split into:
- `project-controller.js` - project CRUD
- `page-controller.js` - page operations
- `canvas-controller.js` - zoom/pan/viewport
- `export-controller.js` - video/PNG export
- `audio-controller.js` - recording/playback
- `balloon-controller.js` - text elements

---

### QUALITY-002: Inline Styles in Templates
**File:** `ui.js`
```javascript
style="display:flex; gap:24px; justify-content:center; flex-wrap:wrap; margin:40px 0;"
```

**Finding:** 600+ inline style declarations mixed with HTML templates.

---

### QUALITY-003: Console Statements in Production
**Finding:** 44 console.log/warn/error calls across codebase

| File | Count |
|------|-------|
| controller.js | 16 |
| video-exporter.js | 11 |
| app.js | 4 |
| i18n.js | 2 |

---

## ✅ Positive Findings

1. **XSS Protection:** `S()` and `S_ATTR()` wrappers using DOMPurify ✓
2. **Offline-First:** Service worker with proper cache strategy ✓
3. **Touch Target CSS Variable:** `--touch-min: 44px` defined ✓
4. **i18n System:** Comprehensive with fallback support ✓
5. **Onboarding:** Mobile-aware guided tour ✓
6. **Ken Burns:** Well-implemented animation system ✓
7. **Audio Ducking:** Professional audio mixing ✓

---

## 📋 Quick Wins (Easy Fixes)

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Fix `openExportPage()` null bug | 1 min | Critical |
| 2 | Update SW version for video-exporter | 1 min | High |
| 3 | Remove `user-scalable=no` | 1 min | A11Y |
| 4 | Add missing i18n keys for top 20 Toast messages | 30 min | High |
| 5 | Add aria-labels to toolbar buttons | 15 min | A11Y |

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total JS Lines | ~20,000 |
| Hardcoded PT Strings | 100+ |
| Event Listeners | 42 add / 27 remove |
| Console Statements | 44 |
| TODO Comments | 6 |
| ARIA Labels | 17 |
| Inline Styles | 600+ |

---

## 🎯 Recommended Next Steps

1. ~~**Immediate:** Fix BUG-001 (export page crash)~~ ✅ FIXED
2. ~~**Immediate:** Fix BUG-002 (SW version)~~ ✅ FIXED
3. ~~**This Sprint:** Complete i18n for Toast messages~~ ✅ PARTIALLY FIXED (20+ messages)
4. ~~**This Sprint:** Remove user-scalable=no~~ ✅ FIXED
5. **This Sprint:** Add ARIA labels to interactive elements
6. **Next Sprint:** Split controller.js into modules
7. **Future:** Implement incremental undo system

---

## ✅ Fixes Applied This Session

| Fix | File | Change |
|-----|------|--------|
| BUG-001 | `controller.js:526` | Removed `currentProject: null` from `openExportPage()` |
| BUG-002 | `sw.js` | Updated cache version to v96, synced versions |
| A11Y-001 | `index.html` | Removed `user-scalable=no` from viewport |
| i18n | `controller.js` | Replaced **50+** hardcoded PT Toast messages with `t()` calls |
| i18n | `locales/*.json` | Added **46 new** translation keys for Toast messages |
| Version | `controller.js` | Bumped to v31 |

### i18n Keys Added (46 total)
**Toast messages now properly localized:**
- Image operations: `onlyImages`, `imageTooLarge`, `optimizingImage`, `imageAdjusted`, `imageReset`, `imageCentered`, `imageRestored`, `imageReordered`, `imageRemovedFromLibrary`
- Page operations: `newPageCreated`, `noEmptySlots`, `clickPanelToReplace`, `pngSaved`, `dragToPosition`
- Layout: `layoutReset`, `maxPanels`, `minPanels`, `panelTooSmall`, `layoutDeleted`, `defaultLayoutSet`, `defaultLayoutRemoved`
- Balloons: `maxBalloonsReached`, `balloonPositioned`, `balloonAdded`, `balloonAddedToPanel`, `balloonDuplicated`, `stickerAdded`, `sfxAdded`
- Audio: `invalidAudioFormat`, `audioTooLarge`, `bgMusicLoaded`, `musicRemoved`, `narrationLoaded`, `narrationRemoved`, `loadingAudio`, `audioLoaded`, `audioLoadError`, `processingAudio`, `divisionsEqualized`
- Ken Burns/Slideshow: `kenBurnsDisabled`, `kenBurnsZoomIn`, `selectSlideshowPage`, `libraryEmpty`, `slideAdded`, `minOneSlide`, `slideRemoved`, `addSlidesFirst`
- Other: `presetSaved`, `presetRemoved`, `segmentRemoved`, `noTextFound`, `heightLocked`, `heightUnlocked`, `fontUnlocked`, `undone`, `allPagesHaveSegments`, `allTranslationsComplete`

### Files Modified
- `controller.js` - Bug fix + 50+ i18n improvements
- `sw.js` - Version bump to v96
- `index.html` - A11Y fix + version bump
- `locales/en.json` - 46 new keys
- `locales/pt-BR.json` - 46 new keys

---

*Report generated 2026-03-11 by Cascade AI Full Code Audit*
