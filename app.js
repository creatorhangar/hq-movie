/* ═══════════════════════════════════════════════════════════════
   HQ MOVIE — Core v4
   34 Pixel-Perfect Layouts, 3-Column Grid, Safe Area, Z-Order
   ═══════════════════════════════════════════════════════════════ */

// ── XSS Sanitization (DOMPurify wrapper) ──
const S = (str) => {
  if (str == null) return '';
  const s = String(str);
  if (typeof DOMPurify !== 'undefined') return DOMPurify.sanitize(s);
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};
const S_ATTR = (str) => {
  if (str == null) return '';
  const s = String(str);
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
};

// ── A4 Canvas Config (from CRITICAL-ADDENDUM) ──
const A4 = {
  W: 794, H: 1123,
  RATIO: 794 / 1123,
  MARGIN: { top: 40, bottom: 40, left: 40, right: 40 },
  CONTENT: { x: 40, y: 40, w: 714, h: 1043 },
  GRID: { columns: 3, gutter: 12, colW: 226 }
};

// Grid helpers
const colX = (col) => col * (A4.GRID.colW + A4.GRID.gutter); // 0→0, 1→238, 2→476
const colW = (n) => n * A4.GRID.colW + (n - 1) * A4.GRID.gutter; // 1→226, 2→464, 3→714
const G = A4.GRID.gutter;
const CW = A4.CONTENT.w; // 714
const CH = A4.CONTENT.h; // 1043

function getProjectDims(proj) {
  const p = proj || (typeof Store !== 'undefined' ? Store.get('currentProject') : null);
  const vf = p?.videoFormat ? VIDEO_FORMATS[p.videoFormat] : null;
  if (vf) return { canvasW: vf.width, canvasH: vf.height, contentW: vf.width, contentH: vf.height, marginX: 0, marginY: 0, isVideo: true };
  return { canvasW: A4.W, canvasH: A4.H, contentW: A4.CONTENT.w, contentH: A4.CONTENT.h, marginX: A4.MARGIN.left, marginY: A4.MARGIN.top, isVideo: false };
}

// ── Unified Font System ──
const APP_FONTS = {
  // Text fonts (narrative, materia, balloons)
  serif:   { id: 'serif',   name: 'Serif',      family: "'Lora', Georgia, serif",           category: 'text' },
  sans:    { id: 'sans',    name: 'Sans',       family: "'Inter', 'Segoe UI', sans-serif",  category: 'text' },
  comic:   { id: 'comic',   name: 'Comic',      family: "'Bangers', 'Comic Sans MS', cursive", category: 'text' },
  mono:    { id: 'mono',    name: 'Mono',       family: "'JetBrains Mono', monospace",      category: 'text' },
  // Display fonts (titles, covers)
  display: { id: 'display', name: 'Display',    family: "'Bebas Neue', 'Impact', sans-serif", category: 'display' },
  marker:  { id: 'marker',  name: 'Marker',     family: "'Permanent Marker', cursive",      category: 'display' },
  // SFX fonts (impact only)
  bangers:    { id: 'bangers',    name: 'Bangers',     family: "'Bangers', cursive",        category: 'sfx' },
  boogaloo:   { id: 'boogaloo',   name: 'Boogaloo',    family: "'Boogaloo', sans-serif",    category: 'sfx' },
  lilita:     { id: 'lilita',     name: 'Lilita One',  family: "'Lilita One', cursive",     category: 'sfx' },
  fredoka:    { id: 'fredoka',    name: 'Fredoka One', family: "'Fredoka One', cursive",    category: 'sfx' },
  righteous:  { id: 'righteous',  name: 'Righteous',   family: "'Righteous', cursive",      category: 'sfx' },
};

const FontUtils = {
  get(id) { return APP_FONTS[id] || APP_FONTS.serif; },
  family(id) { return (APP_FONTS[id] || APP_FONTS.serif).family; },
  options(category = null) {
    let fonts = Object.values(APP_FONTS);
    if (category) fonts = fonts.filter(f => f.category === category);
    return fonts.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  },
  textOptions() { return this.options('text'); },
  allOptions() { return this.options(); }
};

// ── Balloon Typography per Type ──
window.BALLOON_TYPOGRAPHY = {
  speech: {
    fontFamily: "'Comic Neue', 'Patrick Hand', 'Comic Sans MS', cursive",
    fontSize:   22,
    fontWeight: '700',
    fontStyle:  'normal',
    textTransform: 'none',
    letterSpacing: '0.02em',
    textAlign:  'center',
    lineHeight: '1.3',
  },
  thought: {
    fontFamily: "'Patrick Hand', 'Comic Sans MS', cursive",
    fontSize:   20,
    fontWeight: '400',
    fontStyle:  'normal',
    textTransform: 'none',
    letterSpacing: '0.03em',
    textAlign:  'center',
    lineHeight: '1.3',
  },
  shout: {
    fontFamily: "'Boogaloo', 'Impact', sans-serif",
    fontSize:   24,
    fontWeight: '400',
    fontStyle:  'normal',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign:  'center',
    lineHeight: '1.15',
  },
  whisper: {
    fontFamily: "'Kalam', 'Comic Sans MS', cursive",
    fontSize:   18,
    fontWeight: '300',
    fontStyle:  'italic',
    textTransform: 'none',
    letterSpacing: '0.01em',
    textAlign:  'center',
    lineHeight: '1.35',
  },
  narration: {
    fontFamily: "'Roboto Condensed', 'Arial Narrow', sans-serif",
    fontSize:   24,
    fontWeight: '400',
    fontStyle:  'normal',
    textTransform: 'none',
    letterSpacing: '0',
    textAlign:  'left',
    lineHeight: '1.5',
  },
  box: {
    fontFamily: "'Roboto Condensed', 'Arial Narrow', sans-serif",
    fontSize:   24,
    fontWeight: '400',
    fontStyle:  'normal',
    textTransform: 'none',
    letterSpacing: '0',
    textAlign:  'left',
    lineHeight: '1.5',
  },
  sfx: {
    fontFamily: "'Bangers', 'Impact', sans-serif",
    fontSize:   72,
    fontWeight: '400',
    fontStyle:  'normal',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign:  'center',
    lineHeight: '1.0',
  },
};

// ── Typography Defaults (numeric values for sliders) ──
window.TYPOGRAPHY_DEFAULTS = {
  speech:    { lineHeight: 1.30, letterSpacing: 2  },
  thought:   { lineHeight: 1.30, letterSpacing: 3  },
  shout:     { lineHeight: 1.15, letterSpacing: 5  },
  whisper:   { lineHeight: 1.35, letterSpacing: 1  },
  narration: { lineHeight: 1.50, letterSpacing: 0  },
  sfx:       { lineHeight: 1.00, letterSpacing: 5  },
};

// ── Balloon Color Presets (6 fixed + 6 custom per category) ──
window.BALLOON_BG_FIXED = [
  '#FFFFFF', // branco puro
  '#FFF9C4', // amarelo claro
  '#FFCCBC', // pêssego
  '#C8E6FF', // azul claro
  '#D4F5C8', // verde menta
  '#1C1C1E', // preto
];
window.BALLOON_BG_CUSTOM_DEFAULT = [
  '#F5F0E8', // papel
  '#E8D5FF', // lilás
  '#FFE0B2', // âmbar
  '#2D3A4A', // azul noite
  '#8BC34A', // verde
  '#FF7043', // laranja
];
window.BALLOON_TEXT_FIXED = [
  '#1C1C1E', // preto
  '#FFFFFF', // branco
  '#C0392B', // vermelho
  '#1A3A5C', // azul marinho
  '#5C3A1E', // marrom
  '#4A1A6B', // roxo
];
window.BALLOON_TEXT_CUSTOM_DEFAULT = [
  '#E65100', // laranja escuro
  '#1B5E20', // verde escuro
  '#0D47A1', // azul
  '#6A1B9A', // roxo vibrante
  '#BF360C', // terracota
  '#263238', // cinza escuro
];

// Color Presets Manager — persists custom colors in localStorage
const ColorPresets = {
  _key: 'comic_color_presets',
  _cache: null,
  
  _load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(this._key);
      this._cache = raw ? JSON.parse(raw) : {};
    } catch { this._cache = {}; }
    return this._cache;
  },
  
  _save() {
    try { localStorage.setItem(this._key, JSON.stringify(this._cache || {})); } catch {}
  },
  
  getBgCustom() {
    const data = this._load();
    return data.bgCustom || [...window.BALLOON_BG_CUSTOM_DEFAULT];
  },
  
  getTextCustom() {
    const data = this._load();
    return data.textCustom || [...window.BALLOON_TEXT_CUSTOM_DEFAULT];
  },
  
  setBgCustom(index, color) {
    const data = this._load();
    if (!data.bgCustom) data.bgCustom = [...window.BALLOON_BG_CUSTOM_DEFAULT];
    data.bgCustom[index] = color;
    this._cache = data;
    this._save();
  },
  
  setTextCustom(index, color) {
    const data = this._load();
    if (!data.textCustom) data.textCustom = [...window.BALLOON_TEXT_CUSTOM_DEFAULT];
    data.textCustom[index] = color;
    this._cache = data;
    this._save();
  },
  
  getAllBg() {
    return [...window.BALLOON_BG_FIXED, ...this.getBgCustom()];
  },
  
  getAllText() {
    return [...window.BALLOON_TEXT_FIXED, ...this.getTextCustom()];
  }
};
window.ColorPresets = ColorPresets;

// Legacy compatibility
Object.defineProperty(window, 'BALLOON_BG_PRESETS', { get: () => ColorPresets.getAllBg() });
Object.defineProperty(window, 'BALLOON_TEXT_PRESETS', { get: () => ColorPresets.getAllText() });

// ── Balloon Size Config per type ──
window.BALLOON_SIZE_CONFIG = {
  speech:    { default: 14, min: 10, max: 72  },
  thought:   { default: 14, min: 10, max: 72  },
  shout:     { default: 22, min: 16, max: 72  },
  whisper:   { default: 12, min: 9,  max: 48  },
  narration: { default: 13, min: 10, max: 48  },
  sfx:       { default: 36, min: 20, max: 120 },
};

// ── Shared Balloon Utils (single source of truth) ──
// Fix #2: lineHeight por tipo — usado tanto no TextMeasurer quanto no CSS
function _lineHeightForType(type) {
  const typo = window.BALLOON_TYPOGRAPHY[type] || window.BALLOON_TYPOGRAPHY.speech;
  return parseFloat(typo.lineHeight) || 1.25;
}
window._lineHeightForType = _lineHeightForType;

// Fixed pixel insets per balloon type — eliminates circular dependency
// Values tuned to match SVG shape padding visually
function _calcBalloonInsets(type, w, h) {
  const fixed = {
    speech:     { t: 18, b: 18, l: 24, r: 24 },
    thought:    { t: 28, b: 28, l: 34, r: 34 },
    shout:      { t: 45, b: 45, l: 50, r: 50 },
    whisper:    { t: 16, b: 16, l: 22, r: 22 },
    narration:  { t: 8,  b: 8,  l: 10, r: 10 },
    box:        { t: 8,  b: 8,  l: 10, r: 10 },
    sfx:        { t: 5,  b: 5,  l: 5,  r: 5  },
  }[type] || { t: 14, b: 14, l: 18, r: 18 };

  return { ...fixed };
}
window._calcBalloonInsets = _calcBalloonInsets;

// ── Database ──
const db = new Dexie('ComicCreatorDB');
db.version(1).stores({ projects: 'id, metadata.name, metadata.updatedAt' });
function genId() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ── SVG Icon Library ──
const Icons = {
  logo: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
  text: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>`,
  balloon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  layout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
  undo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  export: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  menu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  upload: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  page: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  textBelow: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="12" rx="1"/><line x1="3" y1="19" x2="21" y2="19"/><line x1="3" y1="22" x2="15" y2="22"/></svg>`,
  home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  zoomIn: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  zoomOut: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  zoomFit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`,
  grid: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  thought: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="10" rx="8" ry="6" stroke-dasharray="5 3"/><circle cx="8" cy="19" r="2"/><circle cx="5" cy="22" r="1"/></svg>`,
  shout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15,8 22,8 17,13 19,20 12,16 5,20 7,13 2,8 9,8" stroke-linejoin="round"/></svg>`,
  narrationBox: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="14" x2="13" y2="14"/></svg>`,
  flipH: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 3 3 7 7 11"/><path d="M3 7h11a5 5 0 0 1 0 10H9"/></svg>`,
  flipV: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 7 7 3 11 7"/><path d="M7 3v11a5 5 0 0 0 10 0V9"/></svg>`,
  pdf: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  
  // New icons for emoji replacement
  video: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  film: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
  package: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  fileText: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  music: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  mic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  camera: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  smartphone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  palette: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
  download: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  save: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  arrowLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  arrowRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  arrowUp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  arrowDown: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  waves: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
  square: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
  target: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  feather: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>`,
  scissors: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  flag: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  radio: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>`,
  book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  bookOpen: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  globe: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  imageIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  volumeIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  file: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`,
  layers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  flagBR: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" fill="#009b3a"/><path d="M12 6L20 12L12 18L4 12Z" fill="#fed100"/><circle cx="12" cy="12" r="3.5" fill="#002776"/></svg>`,
  flagUS: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" fill="#b22234"/><path d="M2 6h20M2 8h20M2 10h20M2 12h20M2 14h20M2 16h20M2 18h20" stroke="#fff" stroke-width="1"/><rect x="2" y="5" width="9" height="7" rx="1" fill="#3c3b6e"/></svg>`,
  alert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  headphones: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  volumeX: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  lock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  unlock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  folder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  keyboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="8" y1="12" x2="8.01" y2="12"/><line x1="12" y1="12" x2="12.01" y2="12"/><line x1="16" y1="12" x2="16.01" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>`,
  crosshair: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`,
};

// Replace VIDEO_FORMATS icons with actual SVG when available
if (typeof VIDEO_FORMATS !== 'undefined') {
  VIDEO_FORMATS.vertical.icon = Icons.smartphone;
  VIDEO_FORMATS.widescreen.icon = Icons.video;
  VIDEO_FORMATS.square.icon = Icons.square;
  VIDEO_FORMATS.portrait.icon = Icons.video;
}

// ── Toast ──
const Toast = {
  _lastMsg: null,
  _lastTime: 0,

  show(msg, type = 'info', dur = 2500) {
    const c = document.getElementById('toast-container');
    if (!c) return;

    // Prevent flooding: same message within 2 seconds
    const now = Date.now();
    if (msg === this._lastMsg && now - this._lastTime < 2000) {
      return; 
    }
    this._lastMsg = msg;
    this._lastTime = now;

    // Limit number of toasts (max 3)
    const existing = c.querySelectorAll('.toast:not(.toast-out)');
    if (existing.length >= 3) {
      existing[0].remove(); // Immediate remove oldest
    }

    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { 
      if (t.parentNode) {
        t.classList.add('toast-out'); 
        setTimeout(() => { if (t.parentNode) t.remove(); }, 300); 
      }
    }, dur);
  },
  showAction(msg, actions = [], dur = 8000, onDismiss) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast toast-action';
    const btns = actions.map(a =>
      `<button class="toast-action-btn${a.danger ? ' danger' : ''}" onclick="event.stopPropagation();${a.action};this.closest('.toast').remove();">${a.label}</button>`
    ).join('');
    t.innerHTML = `<div class="toast-action-msg">${msg}</div><div class="toast-action-btns">${btns}</div>`;
    c.appendChild(t);
    const timer = setTimeout(() => { if (onDismiss) onDismiss(); t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, dur);
    t._timer = timer;
  }
};

// ── Library Helpers (global project library) ──
const Library = {
  _lastAddedSrc: null,
  _lastAddedTime: 0,
  ensure(project) {
    if (!project.library) project.library = [];
    return project.library;
  },
  add(project, src, source = 'upload', pageIndex = null) {
    this.ensure(project);
    // Guard: prevent duplicate additions within 500ms (fixes drop + input handler race)
    const now = Date.now();
    if (src === this._lastAddedSrc && now - this._lastAddedTime < 500) return null;
    this._lastAddedSrc = src;
    this._lastAddedTime = now;
    const entry = {
      id: genId(),
      src,
      addedAt: now,
      source,
      usedInPages: pageIndex != null ? [pageIndex] : [],
      tag: null
    };
    project.library.push(entry);
    return entry;
  },
  remove(project, libId) {
    this.ensure(project);
    project.library = project.library.filter(e => e.id !== libId);
  },
  findBySrc(project, src) {
    this.ensure(project);
    return project.library.find(e => e.src === src);
  },
  computeUsage(project) {
    this.ensure(project);
    project.library.forEach(e => { e.usedInPages = []; });
    project.pages.forEach((page, pi) => {
      if (!page.images) return;
      page.images.forEach(img => {
        if (!img || !img.src) return;
        const entry = project.library.find(e => e.src === img.src);
        if (entry && !entry.usedInPages.includes(pi)) entry.usedInPages.push(pi);
      });
    });
  },
  getUsageForPage(project, pageIndex) {
    this.ensure(project);
    const result = {};
    project.library.forEach(e => {
      if (e.usedInPages.includes(pageIndex)) result[e.id] = 'current';
      else if (e.usedInPages.length > 0) result[e.id] = 'other';
      else result[e.id] = 'unused';
    });
    return result;
  },
  syncFromPages(project) {
    this.ensure(project);
    const seen = new Set(project.library.map(e => e.src.substring(0, 100)));
    project.pages.forEach((page, pi) => {
      (page.images || []).forEach(img => {
        if (!img || !img.src) return;
        const key = img.src.substring(0, 100);
        if (seen.has(key)) return;
        seen.add(key);
        this.add(project, img.src, 'sync', pi);
      });
    });
  }
};

// ── Panel Capacity Helpers ──
const PanelHelper = {
  getCapacity(page) {
    if (!page) return 0;
    const layoutId = page.layoutId || LayoutEngine.getDefaultForCount(page.images ? page.images.length : 1);
    const tmpl = LayoutEngine.get(layoutId, page.images || []);
    return tmpl && tmpl.panels ? tmpl.panels.length : 0;
  },
  findFirstEmpty(page) {
    const cap = this.getCapacity(page);
    if (!page.images) return cap > 0 ? 0 : -1;
    for (let i = 0; i < cap; i++) {
      if (!page.images[i] || !page.images[i].src) return i;
    }
    return -1;
  },
  countFilled(page) {
    if (!page || !page.images) return 0;
    return page.images.filter(img => img && img.src).length;
  },
  isFull(page) {
    const cap = this.getCapacity(page);
    if (cap <= 0) return false;
    return this.countFilled(page) >= cap;
  },
  suggestLayout(count) {
    const map = {
      1: '1p-full', 2: '2p-h-65', 3: '3p-1big-2sm-h', 4: '4p-top-hero',
      5: '5p-classic', 6: '6p-grid', 7: '7p-action', 8: '8p-grid-4x2', 9: '9p-grid-3x3'
    };
    return map[count] || LayoutEngine.getDefaultForCount(count);
  },
  findPageWithEmpty(project, startIdx = 0) {
    for (let i = startIdx; i < project.pages.length; i++) {
      if (this.findFirstEmpty(project.pages[i]) >= 0) return i;
    }
    return -1;
  }
};

// ── Store ──
const Store = {
  _s: {
    view: 'dashboard', projects: [], currentProject: null,
    activePageIndex: 0, coverActive: false, selectedElement: null, selectedSlot: -1,
    leftPanelOpen: true, rightPanelOpen: true,
    zoom: 0.55, showGuides: true,
    panOffset: { x: 0, y: 0 }, panMode: false, isPanning: false,
    undoStack: [], redoStack: [],
    // Layout editor state
    layoutEditorActive: false,
    layoutEditorPanels: [],       // Working copy of panels being edited
    layoutEditorEditingId: null,  // Custom layout ID if editing existing, null if new
    layoutEditorSelectedPanel: -1,
    layoutEditorSnap: true,
    layoutEditorUndoStack: [],    // Separate undo stack (never touches main app undo)
    layoutEditorRedoStack: [],
    isDraggingBalloon: false,
    isResizingBalloon: false,
    timelinePlayer: { playing: false, pageIndex: -1, pageProgress: 0 },
  },
  _l: [],
  get(k) { return this._s[k]; },
  set(u) { Object.assign(this._s, u); this._l.forEach(fn => fn(this._s)); },
  setSilent(u) { Object.assign(this._s, u); }, // Atualiza estado sem disparar render
  subscribe(fn) { this._l.push(fn); },
  getActivePage() {
    const p = this._s.currentProject;
    return p ? (p.pages[this._s.activePageIndex] || null) : null;
  },
  pushUndo() {
    const p = this._s.currentProject;
    if (!p) return;
    const stack = [...this._s.undoStack, structuredClone(p)].slice(-50);
    this.set({ undoStack: stack, redoStack: [] });
  },
  pushUndoSilent() {
    const p = this._s.currentProject;
    if (!p) return;
    const stack = [...this._s.undoStack, structuredClone(p)].slice(-50);
    this.setSilent({ undoStack: stack, redoStack: [] });
  },
  undo() { const s = [...this._s.undoStack]; if (!s.length) return; const prev = s.pop(); const redo = [...this._s.redoStack, structuredClone(this._s.currentProject)]; this.set({ currentProject: prev, undoStack: s, redoStack: redo }); this.save(); },
  redo() { const s = [...this._s.redoStack]; if (!s.length) return; const next = s.pop(); const undo = [...this._s.undoStack, structuredClone(this._s.currentProject)]; this.set({ currentProject: next, undoStack: undo, redoStack: s }); this.save(); },
  async save() { const p = this._s.currentProject; if (!p) return; p.metadata.updatedAt = Date.now(); if (typeof ThumbnailGenerator !== 'undefined' && p._thumbDirty) { try { const thumb = await ThumbnailGenerator.generate(p); if (thumb) { p.thumbnail = thumb; p._thumbDirty = false; } } catch {} } await db.projects.put(structuredClone(p)); const ind = document.getElementById('save-indicator'); if (ind) { ind.innerHTML = `${Icons.save} Salvando...`; ind.style.color = 'var(--accent)'; setTimeout(() => { ind.innerHTML = '✓ Salvo'; ind.style.color = 'var(--success)'; }, 600); } },
  async loadProjects() { 
    const all = await db.projects.toArray(); 
    // Auto-upgrade legacy typography
    const upgraded = all.map(p => this.upgradeProjectTypography(p));
    // Save back if changed (optional, but good for persistence)
    // For now, just load into state
    this.set({ projects: upgraded.sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt) }); 
  },
  
  // Upgrade legacy small fonts to video-friendly sizes
  upgradeProjectTypography(project) {
    if (!project || !project.pages) return project;
    let changed = false;
    
    project.pages.forEach(page => {
      // Upgrade Narrative
      if (page.narrativeStyle) {
        if (!page.narrativeStyle.size || page.narrativeStyle.size < 40) {
          page.narrativeStyle.size = 48; // New default
          changed = true;
        }
      }
      
      // Upgrade Balloons
      if (page.texts) {
        page.texts.forEach(text => {
          // If size is small (legacy default 12-24), bump to 40+
          if (!text.style) text.style = {};
          
          // Helper to bump size
          const bump = (current, min) => (!current || current < min) ? min : current;
          
          if (text.type === 'speech') text.fontSize = bump(text.fontSize, 42);
          if (text.type === 'thought') text.fontSize = bump(text.fontSize, 36);
          if (text.type === 'shout') text.fontSize = bump(text.fontSize, 48);
          if (text.type === 'whisper') text.fontSize = bump(text.fontSize, 32);
          if (text.type === 'narration') text.fontSize = bump(text.fontSize, 48);
          if (text.type === 'sfx') text.fontSize = bump(text.fontSize, 120);
        });
      }
      
      // Upgrade Materia Zones
      if (page.materiaZones) {
        Object.values(page.materiaZones).forEach(zone => {
          if (zone.style && zone.style.size < 40) {
            zone.style.size = 48;
            changed = true;
          }
        });
      }
    });
    
    return project;
  },

  async deleteProject(id) { await db.projects.delete(id); await this.loadProjects(); }
};

/* ═══════════════════════════════════════════════════════════════
   KEN BURNS EFFECT - Presets for motion on static images
   Gives life to single-frame pages with subtle pan/zoom animation
   ═══════════════════════════════════════════════════════════════ */

const KEN_BURNS_PRESETS = {
  'none':      { name: 'Estático',       icon: Icons.square, from: { scale: 1, x: 0, y: 0 },    to: { scale: 1, x: 0, y: 0 } },
  'zoom-in':   { name: 'Zoom In',        icon: Icons.zoomIn, from: { scale: 1, x: 0, y: 0 },    to: { scale: 1.18, x: 0, y: 0 } },
  'zoom-out':  { name: 'Zoom Out',       icon: Icons.zoomOut, from: { scale: 1.18, x: 0, y: 0 }, to: { scale: 1, x: 0, y: 0 } },
  'pan-left':  { name: 'Pan Esquerda',   icon: Icons.arrowLeft, from: { scale: 1.1, x: 3, y: 0 },  to: { scale: 1.1, x: -3, y: 0 } },
  'pan-right': { name: 'Pan Direita',    icon: Icons.arrowRight, from: { scale: 1.1, x: -3, y: 0 }, to: { scale: 1.1, x: 3, y: 0 } },
  'pan-up':    { name: 'Pan Cima',       icon: Icons.arrowUp, from: { scale: 1.1, x: 0, y: 2 },  to: { scale: 1.1, x: 0, y: -2 } },
  'pan-down':  { name: 'Pan Baixo',      icon: Icons.arrowDown, from: { scale: 1.1, x: 0, y: -2 }, to: { scale: 1.1, x: 0, y: 2 } },
  'drift':     { name: 'Flutuação',      icon: Icons.waves, from: { scale: 1.02, x: -1.5, y: 1 }, to: { scale: 1.12, x: 1.5, y: -1 } },
};

const KenBurns = {
  getPreset(id) {
    return KEN_BURNS_PRESETS[id] || KEN_BURNS_PRESETS['none'];
  },
  
  getAllPresets() {
    return Object.entries(KEN_BURNS_PRESETS).map(([id, preset]) => ({ id, ...preset }));
  },
  
  interpolate(preset, progress) {
    const t = Math.max(0, Math.min(1, progress));
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const from = preset.from;
    const to = preset.to;
    return {
      scale: from.scale + (to.scale - from.scale) * ease,
      x: from.x + (to.x - from.x) * ease,
      y: from.y + (to.y - from.y) * ease
    };
  },
  
  getTransformCSS(presetId, progress) {
    const preset = this.getPreset(presetId);
    if (presetId === 'none') return 'none';
    const { scale, x, y } = this.interpolate(preset, progress);
    return `scale(${scale.toFixed(4)}) translate(${x.toFixed(2)}%, ${y.toFixed(2)}%)`;
  }
};

/* ═══════════════════════════════════════════════════════════════
   AUDIO MANAGER - Web Audio API for HQ Movie
   Handles background music, narration per page, preview, and mixing
   ═══════════════════════════════════════════════════════════════ */

const AudioManager = {
  _ctx: null,
  _sources: {},
  _gains: {},
  _playing: null,
  
  getContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  },
  
  async loadAudioBuffer(dataUrl) {
    const ctx = this.getContext();
    const response = await fetch(dataUrl);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  },
  
  async playAudio(id, dataUrl, options = {}) {
    const { volume = 1, loop = false, onEnded = null } = options;
    
    if (this._playing === id) {
      this.stopAudio(id);
      return false;
    }
    
    this.stopAll();
    
    const ctx = this.getContext();
    const buffer = await this.loadAudioBuffer(dataUrl);
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume;
    
    source.onended = () => {
      if (this._playing === id) {
        this._playing = null;
        delete this._sources[id];
        delete this._gains[id];
      }
      if (onEnded) onEnded();
    };
    
    this._sources[id] = source;
    this._gains[id] = gainNode;
    this._playing = id;
    
    source.start(0);
    return true;
  },
  
  stopAudio(id) {
    if (this._sources[id]) {
      try {
        this._sources[id].stop();
      } catch (e) {}
      delete this._sources[id];
      delete this._gains[id];
    }
    if (this._playing === id) {
      this._playing = null;
    }
  },
  
  stopAll() {
    Object.keys(this._sources).forEach(id => this.stopAudio(id));
    this._playing = null;
  },
  
  setVolume(id, volume) {
    if (this._gains[id]) {
      this._gains[id].gain.value = Math.max(0, Math.min(1, volume));
    }
  },
  
  // Ducking: smoothly lower background music when narration plays
  applyDucking(project, isNarrationPlaying) {
    if (!project?.videoAudio?.ducking?.enabled) return;
    if (!this._gains['background']) return;
    
    const ducking = project.videoAudio.ducking;
    const bgVolume = project.videoAudio.background?.volume || 0.4;
    const targetVolume = isNarrationPlaying ? (bgVolume * ducking.level) : bgVolume;
    const fadeMs = ducking.fadeMs || 200;
    
    const ctx = this.getContext();
    const gain = this._gains['background'];
    const currentTime = ctx.currentTime;
    
    gain.gain.cancelScheduledValues(currentTime);
    gain.gain.setValueAtTime(gain.gain.value, currentTime);
    gain.gain.linearRampToValueAtTime(targetVolume, currentTime + fadeMs / 1000);
  },
  
  // Play narration with ducking
  async playNarrationWithDucking(project, pageId, narrationData) {
    if (!narrationData?.file) return false;
    
    // Apply ducking - lower background music
    this.applyDucking(project, true);
    
    const played = await this.playAudio('narration-' + pageId, narrationData.file, {
      volume: narrationData.volume || 0.8,
      onEnded: () => {
        // Restore background music volume
        this.applyDucking(project, false);
      }
    });
    
    return played;
  },
  
  // Crossfade between two audio sources
  async crossfadeAudio(fromId, toId, toDataUrl, duration = 500, options = {}) {
    const ctx = this.getContext();
    const fadeTime = duration / 1000;
    const currentTime = ctx.currentTime;
    
    // Fade out current audio
    if (this._gains[fromId]) {
      this._gains[fromId].gain.setValueAtTime(this._gains[fromId].gain.value, currentTime);
      this._gains[fromId].gain.linearRampToValueAtTime(0, currentTime + fadeTime);
      setTimeout(() => this.stopAudio(fromId), duration);
    }
    
    // Start and fade in new audio
    if (toDataUrl) {
      const buffer = await this.loadAudioBuffer(toDataUrl);
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      source.loop = options.loop || false;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Start at 0 volume and fade in
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(options.volume || 0.8, currentTime + fadeTime);
      
      source.onended = () => {
        if (this._playing === toId) {
          this._playing = null;
          delete this._sources[toId];
          delete this._gains[toId];
        }
        if (options.onEnded) options.onEnded();
      };
      
      this._sources[toId] = source;
      this._gains[toId] = gainNode;
      this._playing = toId;
      
      source.start(0);
    }
  },
  
  // Preview narration with auto-ducking for editor preview
  async previewPageAudio(project, pageId) {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) return;
    
    const lang = project.activeLanguage || 'pt-BR';
    const narration = this.getPageNarration(project, pageId, lang);
    const bgMusic = project.videoAudio?.background;
    
    // Play background music if exists and not playing
    if (bgMusic?.file && !this.isPlaying('background')) {
      await this.playAudio('background', bgMusic.file, {
        volume: bgMusic.volume || 0.4,
        loop: bgMusic.loop !== false
      });
    }
    
    // Play narration with ducking
    if (narration?.file) {
      await this.playNarrationWithDucking(project, pageId, narration);
    }
  },
  
  isPlaying(id) {
    return this._playing === id;
  },
  
  getPlayingId() {
    return this._playing;
  },
  
  async getAudioDuration(dataUrl) {
    try {
      const buffer = await this.loadAudioBuffer(dataUrl);
      return buffer.duration;
    } catch (e) {
      return 0;
    }
  },
  
  setBackgroundMusic(project, audioData) {
    if (!project || !project.videoAudio) return;
    project.videoAudio.background.file = audioData;
    Store.save();
  },
  
  setPageNarration(project, pageId, audioData, lang = null) {
    if (!project || !project.videoAudio) return;
    const activeLang = lang || project.activeLanguage || 'pt-BR';
    const existing = project.videoAudio.pages.find(p => p.pageId === pageId);
    
    if (existing) {
      // Multi-language support: check if narration is old format
      if (existing.narration && existing.narration.file !== undefined) {
        // Migrate old format to new
        const oldNarr = existing.narration;
        existing.narration = {
          'pt-BR': { file: oldNarr.file, volume: oldNarr.volume || 0.8, duration: oldNarr.duration || 0 },
          'en': { file: null, volume: 0.8, duration: 0 }
        };
      }
      if (!existing.narration[activeLang]) {
        existing.narration[activeLang] = { file: null, volume: 0.8, duration: 0 };
      }
      existing.narration[activeLang].file = audioData;
    } else {
      project.videoAudio.pages.push({
        pageId,
        narration: {
          'pt-BR': activeLang === 'pt-BR' ? { file: audioData, volume: 0.8, duration: 0 } : { file: null, volume: 0.8, duration: 0 },
          'en': activeLang === 'en' ? { file: audioData, volume: 0.8, duration: 0 } : { file: null, volume: 0.8, duration: 0 }
        }
      });
    }
    Store.save();
  },
  
  getPageNarration(project, pageId, lang = null) {
    if (!project || !project.videoAudio) return null;
    const activeLang = lang || project.activeLanguage || 'pt-BR';
    const pageAudio = project.videoAudio.pages.find(p => p.pageId === pageId);
    if (!pageAudio) return null;
    
    // Multi-language support: check format
    if (pageAudio.narration && pageAudio.narration.file !== undefined) {
      // Old format - return as-is for backwards compatibility
      return pageAudio.narration;
    }
    // New format - return narration for active language
    return pageAudio.narration ? pageAudio.narration[activeLang] : null;
  },
  
  removePageNarration(project, pageId, lang = null) {
    if (!project || !project.videoAudio) return;
    const activeLang = lang || project.activeLanguage || 'pt-BR';
    const pageAudio = project.videoAudio.pages.find(p => p.pageId === pageId);
    
    if (pageAudio && pageAudio.narration) {
      // Multi-language support
      if (pageAudio.narration[activeLang]) {
        pageAudio.narration[activeLang] = { file: null, volume: 0.8, duration: 0 };
      } else if (pageAudio.narration.file !== undefined) {
        // Old format - remove entirely
        project.videoAudio.pages = project.videoAudio.pages.filter(p => p.pageId !== pageId);
      }
    }
    Store.save();
  },
  
  setBackgroundVolume(project, volume) {
    if (!project || !project.videoAudio) return;
    project.videoAudio.background.volume = volume;
    this.setVolume('background', volume);
    Store.save();
  },
  
  setNarrationVolume(project, pageId, volume, lang = null) {
    if (!project || !project.videoAudio) return;
    const activeLang = lang || project.activeLanguage || 'pt-BR';
    const pageAudio = project.videoAudio.pages.find(p => p.pageId === pageId);
    if (pageAudio && pageAudio.narration) {
      // Multi-language support
      if (pageAudio.narration[activeLang]) {
        pageAudio.narration[activeLang].volume = volume;
      } else if (pageAudio.narration.volume !== undefined) {
        // Old format
        pageAudio.narration.volume = volume;
      }
      this.setVolume('narration-' + pageId + '-' + activeLang, volume);
      Store.save();
    }
  },
  
  async updateNarrationDuration(project, pageId, lang = null) {
    const activeLang = lang || project.activeLanguage || 'pt-BR';
    const narration = this.getPageNarration(project, pageId, activeLang);
    if (narration && narration.file) {
      const duration = await this.getAudioDuration(narration.file);
      narration.duration = duration;
      
      // Update page duration based on longest narration across languages
      const page = project.pages.find(p => p.id === pageId);
      if (page && duration > 0) {
        const pageAudio = project.videoAudio.pages.find(p => p.pageId === pageId);
        let maxDuration = duration;
        if (pageAudio && pageAudio.narration) {
          ['pt-BR', 'en'].forEach(l => {
            if (pageAudio.narration[l] && pageAudio.narration[l].duration > maxDuration) {
              maxDuration = pageAudio.narration[l].duration;
            }
          });
        }
        // Duration = exact audio length (ceil) + 1s buffer
        page.duration = Math.ceil(maxDuration) + 1;
        page.durationLocked = true; // Locked by audio
      }
      Store.save();
    }
  },

  // Check if a page has narration audio
  pageHasNarration(project, pageId, lang = null) {
    const narr = this.getPageNarration(project, pageId, lang);
    return !!(narr && narr.file);
  },
  
  // Check if page has narration for ANY language
  pageHasAnyNarration(project, pageId) {
    if (!project || !project.videoAudio) return false;
    const pageAudio = project.videoAudio.pages.find(p => p.pageId === pageId);
    if (!pageAudio || !pageAudio.narration) return false;
    
    // Old format
    if (pageAudio.narration.file !== undefined) {
      return !!pageAudio.narration.file;
    }
    // New format - check all languages
    return ['pt-BR', 'en'].some(l => pageAudio.narration[l] && pageAudio.narration[l].file);
  }
};

/* ═══════════════════════════════════════════════════════════════
   AUDIO SPLITTER - Split long audio across pages
   Advanced auto-split with waveform, per-segment editing, undo
   ═══════════════════════════════════════════════════════════════ */

const AudioSplitter = {
  _draft: null,
  _previewAudio: null,
  _previewPlaying: false,
  _waveformData: null,
  _selectedSegment: 0,
  _undoStack: [],
  _maxUndo: 30,
  
  initDraft(lang = 'pt-BR') {
    this._draft = {
      lang: lang,
      sourceFile: null,
      sourceBuffer: null,
      sourceDuration: 0,
      boundaries: [],
      mode: 'equal',
      pageCount: 0,
      segmentMeta: []  // per-segment: { volume, fadeIn, fadeOut, note }
    };
    this._waveformData = null;
    this._selectedSegment = 0;
    this._undoStack = [];
    return this._draft;
  },
  
  getDraft() { return this._draft; },
  
  getSelectedSegment() { return this._selectedSegment; },
  setSelectedSegment(i) { this._selectedSegment = Math.max(0, Math.min(i, (this._draft?.pageCount || 1) - 1)); },
  
  clearDraft() {
    this.stopPreview();
    this._draft = null;
    this._waveformData = null;
    this._undoStack = [];
  },
  
  _pushUndo() {
    if (!this._draft) return;
    this._undoStack.push(JSON.stringify(this._draft.boundaries));
    if (this._undoStack.length > this._maxUndo) this._undoStack.shift();
  },
  
  undo() {
    if (!this._draft || this._undoStack.length === 0) return false;
    const prev = JSON.parse(this._undoStack.pop());
    this._draft.boundaries = prev;
    this._draft.mode = 'manual';
    return true;
  },
  
  async loadSourceAudio(dataUrl) {
    if (!this._draft) return null;
    try {
      const ctx = AudioManager.getContext();
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      this._draft.sourceFile = dataUrl;
      this._draft.sourceBuffer = buffer;
      this._draft.sourceDuration = buffer.duration;
      this._waveformData = this._generateWaveformData(buffer, 600);
      return { duration: buffer.duration, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels };
    } catch (e) {
      console.error('AudioSplitter: Failed to load audio', e);
      return null;
    }
  },
  
  _generateWaveformData(buffer, numBars) {
    const channelData = buffer.getChannelData(0);
    const samplesPerBar = Math.floor(channelData.length / numBars);
    const peaks = [];
    for (let i = 0; i < numBars; i++) {
      let max = 0;
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, channelData.length);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }
      peaks.push(max);
    }
    return peaks;
  },
  
  getWaveformData() { return this._waveformData; },
  
  _initSegmentMeta(count) {
    this._draft.segmentMeta = [];
    for (let i = 0; i < count; i++) {
      this._draft.segmentMeta.push({ volume: 0.8, fadeIn: 0.08, fadeOut: 0.08, note: '', ignored: false });
    }
  },
  
  getSegmentMeta(index) {
    if (!this._draft || !this._draft.segmentMeta) return { volume: 0.8, fadeIn: 0.08, fadeOut: 0.08, note: '', ignored: false };
    return this._draft.segmentMeta[index] || { volume: 0.8, fadeIn: 0.08, fadeOut: 0.08, note: '', ignored: false };
  },
  
  setSegmentMeta(index, key, value) {
    if (!this._draft || !this._draft.segmentMeta || !this._draft.segmentMeta[index]) return;
    this._draft.segmentMeta[index][key] = value;
  },
  
  buildEqualBoundaries(pageCount) {
    if (!this._draft || !this._draft.sourceDuration || pageCount < 1) return [];
    this._pushUndo();
    const duration = this._draft.sourceDuration;
    const segDur = duration / pageCount;
    const boundaries = [0];
    for (let i = 1; i < pageCount; i++) boundaries.push(i * segDur);
    boundaries.push(duration);
    this._draft.boundaries = boundaries;
    this._draft.pageCount = pageCount;
    this._draft.mode = 'equal';
    this._initSegmentMeta(pageCount);
    return boundaries;
  },
  
  updateBoundary(index, timeSec) {
    if (!this._draft || !this._draft.boundaries) return false;
    const bounds = this._draft.boundaries;
    if (index <= 0 || index >= bounds.length - 1) return false;
    this._pushUndo();
    const minGap = 0.1;
    bounds[index] = Math.max(bounds[index - 1] + minGap, Math.min(bounds[index + 1] - minGap, timeSec));
    this._draft.mode = 'manual';
    return true;
  },
  
  resetBoundaries() {
    if (!this._draft) return;
    this.buildEqualBoundaries(this._draft.pageCount);
  },
  
  addBoundary(timeSec) {
    if (!this._draft || !this._draft.boundaries) return false;
    const bounds = this._draft.boundaries;
    const duration = this._draft.sourceDuration || 0;
    const minGap = 0.3;
    timeSec = Math.max(minGap, Math.min(duration - minGap, timeSec));
    // Check not too close to existing boundary
    for (let i = 0; i < bounds.length; i++) {
      if (Math.abs(bounds[i] - timeSec) < minGap) return false;
    }
    this._pushUndo();
    bounds.push(timeSec);
    bounds.sort((a, b) => a - b);
    this._draft.pageCount = bounds.length - 1;
    this._draft.mode = 'manual';
    // Add segment meta for new segment
    const newIdx = bounds.indexOf(timeSec);
    this._draft.segmentMeta.splice(newIdx, 0, { volume: 0.8, fadeIn: 0.08, fadeOut: 0.08, note: '', ignored: false });
    return true;
  },
  
  removeBoundary(index) {
    if (!this._draft || !this._draft.boundaries) return false;
    const bounds = this._draft.boundaries;
    if (index <= 0 || index >= bounds.length - 1) return false; // can't remove first/last
    if (bounds.length <= 2) return false; // need at least 1 segment
    this._pushUndo();
    bounds.splice(index, 1);
    this._draft.pageCount = bounds.length - 1;
    this._draft.mode = 'manual';
    // Remove segment meta (remove the segment that was after this boundary)
    if (this._draft.segmentMeta.length > index) {
      this._draft.segmentMeta.splice(index, 1);
    }
    if (this._selectedSegment >= this._draft.pageCount) {
      this._selectedSegment = this._draft.pageCount - 1;
    }
    return true;
  },
  
  getSegments() {
    if (!this._draft || !this._draft.boundaries || this._draft.boundaries.length < 2) return [];
    const segments = [];
    const bounds = this._draft.boundaries;
    for (let i = 0; i < bounds.length - 1; i++) {
      segments.push({ index: i, start: bounds[i], end: bounds[i + 1], duration: bounds[i + 1] - bounds[i] });
    }
    return segments;
  },
  
  extractSegment(buffer, startSec, endSec, fadeInSec = 0.08, fadeOutSec = 0.08, volume = 1.0) {
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.min(Math.floor(endSec * sampleRate), buffer.length);
    const segmentLength = endSample - startSample;
    if (segmentLength <= 0) return null;
    const ctx = AudioManager.getContext();
    const segBuf = ctx.createBuffer(channels, segmentLength, sampleRate);
    const fadeInSamples = Math.floor(fadeInSec * sampleRate);
    const fadeOutSamples = Math.floor(fadeOutSec * sampleRate);
    for (let ch = 0; ch < channels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = segBuf.getChannelData(ch);
      for (let i = 0; i < segmentLength; i++) {
        let s = src[startSample + i] * volume;
        if (i < fadeInSamples) s *= (i / fadeInSamples);
        if (i >= segmentLength - fadeOutSamples) s *= ((segmentLength - i) / fadeOutSamples);
        dst[i] = s;
      }
    }
    return segBuf;
  },
  
  audioBufferToWavDataUrl(buffer) {
    const numCh = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const length = buffer.length * numCh;
    const samples = new Int16Array(length);
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const v = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        samples[i * numCh + ch] = v < 0 ? v * 0x8000 : v * 0x7FFF;
      }
    }
    const byteRate = sr * numCh * 2;
    const blockAlign = numCh * 2;
    const dataSize = samples.length * 2;
    const buf = new ArrayBuffer(44 + dataSize);
    const dv = new DataView(buf);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); dv.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
    ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, numCh, true); dv.setUint32(24, sr, true);
    dv.setUint32(28, byteRate, true); dv.setUint16(32, blockAlign, true); dv.setUint16(34, 16, true);
    ws(36, 'data'); dv.setUint32(40, dataSize, true);
    for (let i = 0; i < samples.length; i++) dv.setInt16(44 + i * 2, samples[i], true);
    const blob = new Blob([buf], { type: 'audio/wav' });
    return new Promise(r => { const fr = new FileReader(); fr.onloadend = () => r(fr.result); fr.readAsDataURL(blob); });
  },
  
  async applyToProject(project) {
    if (!this._draft || !this._draft.sourceBuffer || !this._draft.boundaries) {
      return { success: false, error: 'No audio loaded or boundaries defined' };
    }
    const segments = this.getSegments();
    const validSegments = segments.map((seg, i) => ({...seg, originalIndex: i})).filter((seg) => {
      const meta = this.getSegmentMeta(seg.originalIndex);
      return !meta.ignored;
    });
    
    const pages = project.pages || [];
    const lang = this._draft.lang;
    const videoFormat = project.videoFormat || null;
    
    // Create missing pages if valid segments > existing pages
    let pagesCreated = 0;
    while (pages.length < validSegments.length) {
      pages.push(createPage(pages.length, videoFormat));
      pagesCreated++;
    }
    
    // Remove extra pages if valid segments < existing pages? We just leave them for now.
    
    try {
      for (let i = 0; i < validSegments.length; i++) {
        const seg = validSegments[i];
        const originalIdx = seg.originalIndex;
        const meta = this.getSegmentMeta(originalIdx);
        const page = pages[i];
        const segBuf = this.extractSegment(this._draft.sourceBuffer, seg.start, seg.end, meta.fadeIn, meta.fadeOut, meta.volume);
        if (!segBuf) continue;
        const wavDataUrl = await this.audioBufferToWavDataUrl(segBuf);
        if (!page.narration) page.narration = {};
        page.narration[lang] = { file: wavDataUrl, volume: meta.volume, duration: seg.duration, note: meta.note || '' };
        const newDuration = Math.ceil(seg.duration) + 1;
        page.duration = Math.max(page.duration || 4, newDuration);
        page.durationLocked = true;
      }
      Store.save();
      return { success: true, segmentCount: validSegments.length, pagesCreated };
    } catch (e) {
      console.error('AudioSplitter: Failed to apply to project', e);
      return { success: false, error: e.message };
    }
  },
  
  // Preview playback
  async playPreview(startTime = 0) {
    if (!this._draft || !this._draft.sourceFile) return;
    this.stopPreview();
    this._previewAudio = new Audio(this._draft.sourceFile);
    this._previewAudio.currentTime = startTime;
    this._previewAudio.onended = () => { this._previewPlaying = false; };
    try { await this._previewAudio.play(); this._previewPlaying = true; } catch (e) { console.warn('AudioSplitter: Preview failed', e); }
  },
  
  async playSegmentPreview(segIndex) {
    const segs = this.getSegments();
    if (!segs[segIndex]) return;
    await this.playPreview(segs[segIndex].start);
    // Auto-stop at segment end
    const seg = segs[segIndex];
    if (this._segStopTimeout) clearTimeout(this._segStopTimeout);
    this._segStopTimeout = setTimeout(() => { this.pausePreview(); }, (seg.duration) * 1000);
  },
  
  pausePreview() {
    if (this._previewAudio && this._previewPlaying) { this._previewAudio.pause(); this._previewPlaying = false; }
    if (this._segStopTimeout) { clearTimeout(this._segStopTimeout); this._segStopTimeout = null; }
  },
  
  stopPreview() {
    if (this._previewAudio) { this._previewAudio.pause(); this._previewAudio.currentTime = 0; this._previewAudio = null; }
    this._previewPlaying = false;
    if (this._segStopTimeout) { clearTimeout(this._segStopTimeout); this._segStopTimeout = null; }
  },
  
  getPreviewTime() { return this._previewAudio ? this._previewAudio.currentTime : 0; },
  isPreviewPlaying() { return this._previewPlaying; },
  
  seekPreview(time) {
    if (this._previewAudio) this._previewAudio.currentTime = Math.max(0, Math.min(time, this._draft?.sourceDuration || 0));
  },
  
  // Which segment is playing right now?
  getActiveSegmentAtTime(time) {
    const segs = this.getSegments();
    for (let i = 0; i < segs.length; i++) {
      if (time >= segs[i].start && time < segs[i].end) return i;
    }
    return segs.length - 1;
  }
};

window.AudioSplitter = AudioSplitter;

/* ═══════════════════════════════════════════════════════════════
   VISUAL EFFECTS SYSTEM - 6 Canvas-Based Effects (per image)
   Effects: Papercut, Halftone, Vintage, Mangá, Sharpness, Ink Bleed
   Data: img.effect = { name, intensity, seed } | null
   Backup: img.srcOriginal = original image before any effect
   ═══════════════════════════════════════════════════════════════ */

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function applyPapercut(ctx, w, h, intensity, seed) {
  const rnd = seededRandom(seed);

  // STEP 1 — Desaturation + lift blacks + grain INTEGRATED pixel-by-pixel
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const desat = intensity * 0.5;
    let r = d[i]     * (1 - desat) + gray * desat;
    let g = d[i + 1] * (1 - desat) + gray * desat;
    let b = d[i + 2] * (1 - desat) + gray * desat;
    const lift = 20 * intensity;
    r += lift; g += lift; b += lift + 5 * intensity;
    // Grain pixel-by-pixel — eliminates "snow" artifact
    const grain = (rnd() - 0.5) * (30 + intensity * 40);
    d[i]     = Math.min(255, Math.max(0, r + grain));
    d[i + 1] = Math.min(255, Math.max(0, g + grain));
    d[i + 2] = Math.min(255, Math.max(0, b + grain));
  }
  ctx.putImageData(id, 0, 0);

  // STEP 2 — Tiny 1×1 pixel dots (no arc anti-aliasing = no flakes)
  const dotCount = Math.floor(w * h / 500 * intensity);
  for (let i = 0; i < dotCount; i++) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * h);
    const alpha = rnd() * 0.4 + 0.2;
    const id2 = ctx.getImageData(x, y, 1, 1);
    id2.data[0] = Math.min(255, id2.data[0] + Math.round(180 * alpha));
    id2.data[1] = Math.min(255, id2.data[1] + Math.round(180 * alpha));
    id2.data[2] = Math.min(255, id2.data[2] + Math.round(180 * alpha));
    ctx.putImageData(id2, x, y);
  }

  // STEP 3 — Visible diagonal scratches (min 3, min opacity 0.18)
  const scratchCount = Math.max(3, Math.floor(12 * intensity));
  for (let i = 0; i < scratchCount; i++) {
    const x1 = rnd() * w;
    const y1 = rnd() < 0.5 ? 0 : rnd() * h;
    const angle = (rnd() - 0.5) * 0.25;
    const len = h * (0.3 + rnd() * 0.9);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.sin(angle) * len, y1 + len * Math.cos(angle));
    ctx.strokeStyle = `rgba(255,255,255,${rnd() * 0.27 + 0.18})`;
    ctx.lineWidth = rnd() * 0.7 + 0.2;
    ctx.stroke();
  }
}

function applyHalftone(ctx, w, h, intensity, colorMode) {
  // PASSO 1 — Capturar imagem original (antes de qualquer modificação)
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w; srcCanvas.height = h;
  srcCanvas.getContext('2d').drawImage(ctx.canvas, 0, 0);
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;

  // Spacing inversamente proporcional à intensidade
  // 30% → 16px (dots grandes, espaçados, pop-art)
  // 100% → 8px (dots menores, mais detalhe)
  const spacing = Math.round(16 - intensity * 8); // 16 → 8
  const maxR = spacing * 0.46;  // dot máximo = 92% do espaço
  const minR = 0.6;             // dot mínimo sempre existe

  const cx = w / 2, cy = h / 2;
  const diagonal = Math.sqrt(w * w + h * h);
  const halfDiag = diagonal / 2;

  if (!colorMode) {
    // ─────────────────────────────────────────────────
    // MODO P&B — imagem preservada, dessaturada + dots com multiply
    // ─────────────────────────────────────────────────

    // PASSO 2 — Dessaturar + tingir creme (imagem fica como "papel envelhecido")
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
      d[i]   = d[i]   * 0.3 + gray * 0.7;
      d[i+1] = d[i+1] * 0.3 + gray * 0.7;
      d[i+2] = d[i+2] * 0.3 + gray * 0.7;
      d[i]   = Math.min(255, d[i]   * 1.05 + 8);
      d[i+1] = Math.min(255, d[i+1] * 1.02 + 5);
      d[i+2] = Math.min(255, d[i+2] * 0.92);
    }
    ctx.putImageData(id, 0, 0);

    // PASSO 3 — Dots pretos em canvas separado (fundo branco = transparente com multiply)
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = w; dotCanvas.height = h;
    const dCtx = dotCanvas.getContext('2d');
    dCtx.fillStyle = '#ffffff';
    dCtx.fillRect(0, 0, w, h);

    const angle = Math.PI / 4; // 45°
    const cos = Math.cos(angle), sin = Math.sin(angle);

    dCtx.fillStyle = '#000000';
    for (let gy = -halfDiag; gy < halfDiag; gy += spacing) {
      for (let gx = -halfDiag; gx < halfDiag; gx += spacing) {
        const rx = gx * cos - gy * sin;
        const ry = gx * sin + gy * cos;
        const canvasX = rx + cx;
        const canvasY = ry + cy;
        const sx = Math.round(canvasX);
        const sy = Math.round(canvasY);
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

        const i = (sy * w + sx) * 4;
        const lum = (src[i] * 0.299 + src[i+1] * 0.587 + src[i+2] * 0.114) / 255;
        const r = minR + (1 - lum) * (maxR - minR);

        dCtx.beginPath();
        dCtx.arc(canvasX, canvasY, r, 0, Math.PI * 2);
        dCtx.fill();
      }
    }

    // PASSO 4 — Compor dots sobre imagem com multiply
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(dotCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // PASSO 5 — Micro-dots layer (adds richness/texture like reference)
    const microSpacing = Math.max(3, Math.round(spacing / 3));
    const microMaxR = microSpacing * 0.35;
    const microCanvas = document.createElement('canvas');
    microCanvas.width = w; microCanvas.height = h;
    const mCtx = microCanvas.getContext('2d');
    mCtx.fillStyle = '#ffffff';
    mCtx.fillRect(0, 0, w, h);
    mCtx.fillStyle = 'rgba(0,0,0,0.4)';

    const microAngle = Math.PI / 6; // 30° offset from main grid
    const mCos = Math.cos(microAngle), mSin = Math.sin(microAngle);

    for (let gy = -halfDiag; gy < halfDiag; gy += microSpacing) {
      for (let gx = -halfDiag; gx < halfDiag; gx += microSpacing) {
        const rx = gx * mCos - gy * mSin;
        const ry = gx * mSin + gy * mCos;
        const canvasX = rx + cx;
        const canvasY = ry + cy;
        const sx = Math.round(canvasX);
        const sy = Math.round(canvasY);
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

        const i = (sy * w + sx) * 4;
        const lum = (src[i] * 0.299 + src[i+1] * 0.587 + src[i+2] * 0.114) / 255;
        // Only add micro-dots in mid-tones (not shadows/highlights)
        if (lum < 0.15 || lum > 0.85) continue;
        const r = 0.3 + (1 - lum) * (microMaxR - 0.3);
        if (r < 0.4) continue;

        mCtx.beginPath();
        mCtx.arc(canvasX, canvasY, r, 0, Math.PI * 2);
        mCtx.fill();
      }
    }

    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.3 + intensity * 0.3; // subtle at 30%, more visible at 100%
    ctx.drawImage(microCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    return;
  }

  // ─────────────────────────────────────────────────
  // MODO COLORIDO — imagem original preservada, CMY dots com multiply
  // Sem canal K — o escuro da imagem original já cumpre esse papel
  // ─────────────────────────────────────────────────

  function rgbToCmy(r, g, b) {
    return [1 - r / 255, 1 - g / 255, 1 - b / 255];
  }

  const channels = [
    { angleDeg: 15, inkColor: '#00e5ff', ch: 0 }, // Ciano
    { angleDeg: 75, inkColor: '#ff00ff', ch: 1 }, // Magenta
    { angleDeg: 30, inkColor: '#ffea00', ch: 2 }, // Amarelo
  ];

  // Canvas de composição CMY (branco = sem tinta)
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = w; compositeCanvas.height = h;
  const compCtx = compositeCanvas.getContext('2d');
  compCtx.fillStyle = '#ffffff';
  compCtx.fillRect(0, 0, w, h);

  channels.forEach(({ angleDeg, inkColor, ch }) => {
    const chanCanvas = document.createElement('canvas');
    chanCanvas.width = w; chanCanvas.height = h;
    const cCtx = chanCanvas.getContext('2d');
    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(0, 0, w, h);
    cCtx.fillStyle = inkColor;

    const angle = angleDeg * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);

    for (let gy = -halfDiag; gy < halfDiag; gy += spacing) {
      for (let gx = -halfDiag; gx < halfDiag; gx += spacing) {
        const rx = gx * cos - gy * sin;
        const ry = gx * sin + gy * cos;
        const canvasX = rx + cx;
        const canvasY = ry + cy;
        const sx = Math.round(canvasX);
        const sy = Math.round(canvasY);
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

        const i = (sy * w + sx) * 4;
        const cmy = rgbToCmy(src[i], src[i+1], src[i+2]);
        const inkVal = cmy[ch];
        const r = minR + inkVal * (maxR - minR);
        if (r < minR + 0.2) continue;

        cCtx.beginPath();
        cCtx.arc(canvasX, canvasY, r, 0, Math.PI * 2);
        cCtx.fill();
      }
    }

    // Compor canal com darken (entre canais CMY)
    compCtx.globalCompositeOperation = 'darken';
    compCtx.drawImage(chanCanvas, 0, 0);
  });

  // PASSO FINAL — Compor CMY sobre imagem original com multiply
  // multiply: branco = transparente = imagem aparece entre dots
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(compositeCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  // BONUS — Micro-dots coloridos para textura rica (como referência pop-art)
  const microSpacing = Math.max(3, Math.round(spacing / 3));
  const microMaxR = microSpacing * 0.32;
  const microColors = ['#ff6b6b', '#4ecdc4', '#ffe66d']; // RGB complementares vibrantes

  const microCanvas = document.createElement('canvas');
  microCanvas.width = w; microCanvas.height = h;
  const mCtx = microCanvas.getContext('2d');
  mCtx.fillStyle = '#ffffff';
  mCtx.fillRect(0, 0, w, h);

  const microAngle = Math.PI / 5; // 36° offset
  const mCos = Math.cos(microAngle), mSin = Math.sin(microAngle);

  for (let gy = -halfDiag; gy < halfDiag; gy += microSpacing) {
    for (let gx = -halfDiag; gx < halfDiag; gx += microSpacing) {
      const rx = gx * mCos - gy * mSin;
      const ry = gx * mSin + gy * mCos;
      const canvasX = rx + cx;
      const canvasY = ry + cy;
      const sx = Math.round(canvasX);
      const sy = Math.round(canvasY);
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

      const i = (sy * w + sx) * 4;
      const lum = (src[i] * 0.299 + src[i+1] * 0.587 + src[i+2] * 0.114) / 255;
      if (lum < 0.12 || lum > 0.88) continue;

      // Escolher cor baseado na posição (padrão alternado)
      const colorIdx = ((Math.floor(gx / microSpacing) + Math.floor(gy / microSpacing)) % 3 + 3) % 3;
      mCtx.fillStyle = microColors[colorIdx];

      const r = 0.25 + (1 - lum) * (microMaxR - 0.25);
      if (r < 0.35) continue;

      mCtx.beginPath();
      mCtx.arc(canvasX, canvasY, r, 0, Math.PI * 2);
      mCtx.fill();
    }
  }

  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.25 + intensity * 0.25;
  ctx.drawImage(microCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function applyVintage(ctx, w, h, intensity, options) {
  const {
    sepiaColor       = '#C8A060',
    vignetteColor    = '#000000',
    vignetteIntensity = intensity
  } = options || {};

  // STEP 1 — Full desaturation
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = lum;
  }
  ctx.putImageData(id, 0, 0);

  // STEP 2 — Colorize with customizable sepia color
  const sc = hexToRgb(sepiaColor);
  const id2 = ctx.getImageData(0, 0, w, h);
  const d2 = id2.data;
  for (let i = 0; i < d2.length; i += 4) {
    const lum = d2[i] / 255;
    d2[i]     = d2[i]     + (sc.r * lum - d2[i])     * intensity;
    d2[i + 1] = d2[i + 1] + (sc.g * lum - d2[i + 1]) * intensity;
    d2[i + 2] = d2[i + 2] + (sc.b * lum - d2[i + 2]) * intensity;
    // Lift shadows slightly
    d2[i]     = Math.min(255, d2[i]     + 15 * intensity);
    d2[i + 1] = Math.min(255, d2[i + 1] + 10 * intensity);
    d2[i + 2] = Math.min(255, d2[i + 2] + 5  * intensity);
  }
  ctx.putImageData(id2, 0, 0);

  // STEP 3 — Vignette with customizable color
  const vc = hexToRgb(vignetteColor);
  const cx = w / 2, cy = h / 2;
  const inner = Math.min(w, h) * 0.25;
  const outer = Math.max(w, h) * 0.78;
  const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  grad.addColorStop(0, `rgba(${vc.r},${vc.g},${vc.b},0)`);
  grad.addColorStop(1, `rgba(${vc.r},${vc.g},${vc.b},${0.75 * vignetteIntensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // STEP 4 — Warm grain (like Mangá but tinted warm)
  const rnd = seededRandom(271828); // fixed seed = reproducible
  const id3 = ctx.getImageData(0, 0, w, h);
  const d3 = id3.data;
  const grainBase = 12;
  const grainVar = intensity * 14;

  for (let i = 0; i < d3.length; i += 4) {
    const n = (rnd() - 0.5) * (grainBase + grainVar);
    // Warm grain: R slightly more, B less (preserves warmth)
    d3[i]   = Math.min(255, Math.max(0, d3[i]   + n * 1.05));
    d3[i+1] = Math.min(255, Math.max(0, d3[i+1] + n * 0.95));
    d3[i+2] = Math.min(255, Math.max(0, d3[i+2] + n * 0.80));
  }
  ctx.putImageData(id3, 0, 0);

  // STEP 5 — Bayer dithering on mid-tones (only at 50%+ intensity)
  if (intensity < 0.5) return;

  const BAYER = [
    [0/16,  8/16,  2/16, 10/16],
    [12/16, 4/16, 14/16,  6/16],
    [3/16, 11/16,  1/16,  9/16],
    [15/16, 7/16, 13/16,  5/16],
  ];

  const dithStr = (intensity - 0.5) / 0.5; // 0→1
  const id4 = ctx.getImageData(0, 0, w, h);
  const d4 = id4.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = (d4[i]*0.299 + d4[i+1]*0.587 + d4[i+2]*0.114) / 255;

      // Only mid-tones (20%-80%) — preserve highlights and shadows
      if (lum < 0.20 || lum > 0.80) continue;

      const bayer = BAYER[y % 4][x % 4];
      const threshold = 0.35 + dithStr * 0.35;
      const shift = lum > bayer * threshold ? 40 : -40;
      const dithAmount = shift * dithStr * 0.7; // 70% of Mangá strength

      // Apply while keeping warm tone (proportional per channel)
      d4[i]   = Math.min(255, Math.max(0, d4[i]   + dithAmount * 1.05));
      d4[i+1] = Math.min(255, Math.max(0, d4[i+1] + dithAmount * 0.90));
      d4[i+2] = Math.min(255, Math.max(0, d4[i+2] + dithAmount * 0.70));
    }
  }
  ctx.putImageData(id4, 0, 0);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function applyRisograph(ctx, w, h, intensity, seed, color1, color2) {
  const c1 = hexToRgb(color1 || '#FF4D8D');
  const c2 = hexToRgb(color2 || '#1a1a1a');

  // intensity controla 3 parâmetros independentes:
  // 30% → pastel/aquarelado, 60% → risograph claro, 100% → agressivo/impresso
  const contrastBoost = 0.6 + intensity * 0.8;   // 0.6 → 1.4
  const colorSaturation = 0.5 + intensity * 0.5; // 0.5 → 1.0
  const grainAmt   = 30 + intensity * 60;         // 30 → 90
  const grainAlpha = Math.round(20 + intensity * 50); // 20 → 70

  // STEP 1 — Duotone com contraste e saturação controlados por intensity
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;

    // Aplicar contraste ao mapeamento de luminância
    const boostedLum = Math.min(1, Math.max(0, (lum - 0.5) * contrastBoost + 0.5));

    let tr, tg, tb;
    if (boostedLum < 0.5) {
      const t = boostedLum * 2;
      tr = c2.r * t * colorSaturation;
      tg = c2.g * t * colorSaturation;
      tb = c2.b * t * colorSaturation;
    } else {
      const t = (boostedLum - 0.5) * 2;
      tr = c2.r * (1 - t) * colorSaturation + c1.r * t * colorSaturation;
      tg = c2.g * (1 - t) * colorSaturation + c1.g * t * colorSaturation;
      tb = c2.b * (1 - t) * colorSaturation + c1.b * t * colorSaturation;
    }

    d[i]     = Math.min(255, Math.max(0, tr));
    d[i + 1] = Math.min(255, Math.max(0, tg));
    d[i + 2] = Math.min(255, Math.max(0, tb));
  }
  ctx.putImageData(id, 0, 0);

  // STEP 2 — Grain: Date.now() seed (não reprodutível)
  const rnd = seededRandom(Date.now());
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = w; grainCanvas.height = h;
  const gCtx = grainCanvas.getContext('2d');
  const gData = gCtx.createImageData(w, h);

  for (let i = 0; i < gData.data.length; i += 4) {
    const n = (rnd() - 0.5) * grainAmt;
    const v = Math.min(255, Math.max(0, 128 + n));
    gData.data[i] = gData.data[i + 1] = gData.data[i + 2] = v;
    gData.data[i + 3] = grainAlpha;
  }
  gCtx.putImageData(gData, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.65 + intensity * 0.35; // 0.65 → 1.0
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Bayer Matrix 4×4 — normalized threshold 0.0 to 1.0
const BAYER_4x4 = [
  [0/16,  8/16,  2/16, 10/16],
  [12/16, 4/16, 14/16,  6/16],
  [3/16, 11/16,  1/16,  9/16],
  [15/16, 7/16, 13/16,  5/16],
];

function applyManga(ctx, w, h, intensity) {
  // PHASE 1 — Grayscale with progressive contrast boost
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  const contrast = 1.0 + intensity * 1.2; // 1.0 → 2.2
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const v = Math.min(255, Math.max(0, (lum - 128) * contrast + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(id, 0, 0);

  // PHASE 2 — Grain ALWAYS present (disguises low quality)
  const rnd = seededRandom(314159);
  const id2 = ctx.getImageData(0, 0, w, h);
  const d2 = id2.data;
  const grainBase = 15;
  const grainVar  = intensity * 10;
  for (let i = 0; i < d2.length; i += 4) {
    const n = (rnd() - 0.5) * (grainBase + grainVar);
    d2[i] = d2[i + 1] = d2[i + 2] = Math.min(255, Math.max(0, d2[i] + n));
  }
  ctx.putImageData(id2, 0, 0);

  // PHASE 3 — Bayer ordered dithering (only at intensity > 0.45)
  // Only on midtones (15%–85%), blacks and whites untouched
  if (intensity < 0.45) return;

  const dithStr = (intensity - 0.45) / 0.55; // scale 0→1
  const id3 = ctx.getImageData(0, 0, w, h);
  const d3 = id3.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = d3[i] / 255;
      if (lum < 0.15 || lum > 0.85) continue; // protect extremes

      const bayer = BAYER_4x4[y % 4][x % 4];
      const threshold = 0.4 + dithStr * 0.4;

      const result = lum + (lum > bayer * threshold ? 1 : -1) * 55 * dithStr;
      d3[i] = d3[i + 1] = d3[i + 2] = Math.min(255, Math.max(0, result));
    }
  }
  ctx.putImageData(id3, 0, 0);
}

function applySharpness(ctx, w, h, intensity) {
  // PASSO 1 — Blur via downscale/upscale (suaviza ruído uniformemente)
  const blurScale = 0.5;
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width  = Math.max(1, Math.floor(w * blurScale));
  blurCanvas.height = Math.max(1, Math.floor(h * blurScale));
  const bCtx = blurCanvas.getContext('2d');
  bCtx.imageSmoothingEnabled = true;
  bCtx.imageSmoothingQuality = 'high';
  bCtx.drawImage(ctx.canvas, 0, 0, blurCanvas.width, blurCanvas.height);

  const upCanvas = document.createElement('canvas');
  upCanvas.width = w; upCanvas.height = h;
  const uCtx = upCanvas.getContext('2d');
  uCtx.imageSmoothingEnabled = true;
  uCtx.imageSmoothingQuality = 'high';
  uCtx.drawImage(blurCanvas, 0, 0, w, h);

  const orig = ctx.getImageData(0, 0, w, h);
  const blur = uCtx.getImageData(0, 0, w, h);

  // PASSO 2 — Máscara de bordas: nitidez forte em bordas reais, suave em áreas uniformes
  const result = ctx.createImageData(w, h);
  const sharpAmount = 0.8 + intensity * 2.0; // 0.8 → 2.8

  for (let i = 0; i < orig.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = Math.abs(orig.data[i+c] - blur.data[i+c]);
      // diff alto = borda real → nitidez plena
      // diff baixo = área uniforme → nitidez muito suave (não amplifica ruído)
      const isBorder = diff > 12;
      const factor = isBorder ? sharpAmount : sharpAmount * 0.25;

      result.data[i+c] = Math.min(255, Math.max(0,
        orig.data[i+c] + (orig.data[i+c] - blur.data[i+c]) * factor
      ));
    }
    result.data[i+3] = orig.data[i+3];
  }
  ctx.putImageData(result, 0, 0);

  // PASSO 3 — Micro-blur final (só em intensidade baixa — remove serrilhado residual)
  if (intensity < 0.5) {
    const microScale = 0.85;
    const micro1 = document.createElement('canvas');
    micro1.width  = Math.floor(w * microScale);
    micro1.height = Math.floor(h * microScale);
    micro1.getContext('2d').drawImage(ctx.canvas, 0, 0, micro1.width, micro1.height);

    const micro2 = document.createElement('canvas');
    micro2.width = w; micro2.height = h;
    const m2Ctx = micro2.getContext('2d');
    m2Ctx.imageSmoothingEnabled = true;
    m2Ctx.imageSmoothingQuality = 'high';
    m2Ctx.drawImage(micro1, 0, 0, w, h);

    // Misturar micro-blur: 20% blur + 80% nítido (suaviza jaggies residuais)
    const antiAlias = (0.5 - intensity) * 0.4; // 0.2 → 0.0
    ctx.globalAlpha = antiAlias;
    ctx.drawImage(micro2, 0, 0);
    ctx.globalAlpha = 1;
  }
}

function _applyInkBleedLight(ctx, w, h, intensity) {
  const src = ctx.getImageData(0, 0, w, h).data;
  const result = ctx.createImageData(w, h);
  const d = result.data;
  const bleedRadius = Math.max(1, Math.round(intensity * 2));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let minR = 255, minG = 255, minB = 255;
      for (let dy = -bleedRadius; dy <= bleedRadius; dy++) {
        for (let dx = -bleedRadius; dx <= bleedRadius; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const ny = Math.min(h - 1, Math.max(0, y + dy));
          const ni = (ny * w + nx) * 4;
          const br = src[ni] * 0.299 + src[ni + 1] * 0.587 + src[ni + 2] * 0.114;
          if (br < (minR * 0.299 + minG * 0.587 + minB * 0.114)) {
            minR = src[ni]; minG = src[ni + 1]; minB = src[ni + 2];
          }
        }
      }
      d[i]     = src[i]     + (minR - src[i])     * intensity * 0.5;
      d[i + 1] = src[i + 1] + (minG - src[i + 1]) * intensity * 0.5;
      d[i + 2] = src[i + 2] + (minB - src[i + 2]) * intensity * 0.5;
      d[i + 3] = src[i + 3];
    }
  }
  ctx.putImageData(result, 0, 0);
}

// ─────────────────────────────────────────────────
// VHS / CRT / CCTV EFFECT
// ─────────────────────────────────────────────────

function _applyChromaticAberration(src, dst, w, h, shift) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const rx = Math.max(0, x - shift);
      const ri = (y * w + rx) * 4;
      const bx = Math.min(w - 1, x + shift);
      const bi = (y * w + bx) * 4;
      dst[i]   = src[ri];
      dst[i+1] = src[i+1];
      dst[i+2] = src[bi+2];
      dst[i+3] = 255;
    }
  }
}

function _applyScanlines(d, w, h, intensity, density = 2) {
  for (let y = 0; y < h; y++) {
    if (y % density !== 0) continue;
    const factor = 1 - (0.25 + intensity * 0.45);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      d[i]   *= factor;
      d[i+1] *= factor;
      d[i+2] *= factor;
    }
  }
}

function _applyJitter(src, dst, w, h, intensity, rnd) {
  let jitterActive = false, jitterOffset = 0, jitterCountdown = 0;
  for (let y = 0; y < h; y++) {
    if (jitterCountdown <= 0) {
      jitterActive = rnd() < (0.05 + intensity * 0.10);
      jitterOffset = Math.floor((rnd() - 0.5) * (4 + intensity * 12));
      jitterCountdown = Math.floor(rnd() * 8) + 2;
    }
    jitterCountdown--;
    const offset = jitterActive ? jitterOffset : 0;
    for (let x = 0; x < w; x++) {
      const srcX = Math.min(w - 1, Math.max(0, x + offset));
      const si = (y * w + srcX) * 4;
      const di = (y * w + x) * 4;
      dst[di] = src[si]; dst[di+1] = src[si+1]; dst[di+2] = src[si+2]; dst[di+3] = 255;
    }
  }
}

function _applyAnalogNoise(d, w, h, intensity, rnd) {
  const noiseAmt = 20 + intensity * 50;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114) / 255;
    const shadowBoost = 1 + (1 - lum) * 0.8;
    const n = (rnd() - 0.5) * noiseAmt * shadowBoost;
    d[i]   = Math.min(255, Math.max(0, d[i]   + n));
    d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
    d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
  }
}

function _applyColorBleed(src, dst, w, h, intensity) {
  const bleedPixels = Math.round(2 + intensity * 6);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let bleedR = 0, bleedB = 0, count = 0;
      for (let b = 0; b <= bleedPixels; b++) {
        const bx = Math.max(0, x - b);
        const bi = (y * w + bx) * 4;
        bleedR += src[bi]; bleedB += src[bi+2]; count++;
      }
      dst[i]   = bleedR / count;
      dst[i+1] = src[i+1];
      dst[i+2] = bleedB / count;
      dst[i+3] = 255;
    }
  }
}

function _applyVHSMode(ctx, w, h, intensity, rnd) {
  // Blur horizontal (simulates 240-line VHS resolution)
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = Math.floor(w * 0.75); blurCanvas.height = h;
  const bCtx = blurCanvas.getContext('2d');
  bCtx.imageSmoothingEnabled = true; bCtx.imageSmoothingQuality = 'high';
  bCtx.drawImage(ctx.canvas, 0, 0, blurCanvas.width, h);
  const upCanvas = document.createElement('canvas');
  upCanvas.width = w; upCanvas.height = h;
  const uCtx = upCanvas.getContext('2d');
  uCtx.imageSmoothingEnabled = true; uCtx.imageSmoothingQuality = 'high';
  uCtx.drawImage(blurCanvas, 0, 0, w, h);
  ctx.drawImage(upCanvas, 0, 0);

  // Saturation boost + warm tone
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  const satBoost = 1.0 + intensity * 0.4;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i+1] + d[i+2]) / 3;
    d[i]   = Math.min(255, avg + (d[i]   - avg) * satBoost + 8 * intensity);
    d[i+1] = Math.min(255, avg + (d[i+1] - avg) * satBoost + 3 * intensity);
    d[i+2] = Math.min(255, avg + (d[i+2] - avg) * satBoost - 5 * intensity);
  }
  ctx.putImageData(id, 0, 0);

  // Color bleed
  const afterSat = ctx.getImageData(0, 0, w, h);
  const bleedResult = ctx.createImageData(w, h);
  _applyColorBleed(afterSat.data, bleedResult.data, w, h, intensity);
  ctx.putImageData(bleedResult, 0, 0);

  // Jitter
  const afterBleed = ctx.getImageData(0, 0, w, h);
  const jitterResult = ctx.createImageData(w, h);
  _applyJitter(afterBleed.data, jitterResult.data, w, h, intensity, rnd);
  ctx.putImageData(jitterResult, 0, 0);

  // Chromatic aberration
  const afterJitter = ctx.getImageData(0, 0, w, h);
  const chromaResult = ctx.createImageData(w, h);
  _applyChromaticAberration(afterJitter.data, chromaResult.data, w, h, Math.round(1 + intensity * 4));
  ctx.putImageData(chromaResult, 0, 0);

  // Scanlines (soft, every 2 lines)
  const afterChroma = ctx.getImageData(0, 0, w, h);
  _applyScanlines(afterChroma.data, w, h, intensity * 0.7, 2);
  ctx.putImageData(afterChroma, 0, 0);

  // Analog noise
  const final = ctx.getImageData(0, 0, w, h);
  _applyAnalogNoise(final.data, w, h, intensity * 0.6, rnd);
  ctx.putImageData(final, 0, 0);
}

function _applyCRTMode(ctx, w, h, intensity, rnd) {
  // Green phosphor tint
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i]   = Math.min(255, d[i]   * (1 - intensity * 0.08));
    d[i+1] = Math.min(255, d[i+1] * (1 + intensity * 0.06));
    d[i+2] = Math.min(255, d[i+2] * (1 - intensity * 0.05));
  }
  ctx.putImageData(id, 0, 0);

  // Chromatic aberration (stronger)
  const src2 = ctx.getImageData(0, 0, w, h);
  const chromaResult = ctx.createImageData(w, h);
  _applyChromaticAberration(src2.data, chromaResult.data, w, h, Math.round(1 + intensity * 5));
  ctx.putImageData(chromaResult, 0, 0);

  // Heavy scanlines (every line)
  const afterChroma = ctx.getImageData(0, 0, w, h);
  _applyScanlines(afterChroma.data, w, h, intensity, 1);
  ctx.putImageData(afterChroma, 0, 0);

  // Phosphor glow (downscale blur + screen blend)
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = Math.floor(w * 0.4); glowCanvas.height = Math.floor(h * 0.4);
  glowCanvas.getContext('2d').drawImage(ctx.canvas, 0, 0, glowCanvas.width, glowCanvas.height);
  const glowUp = document.createElement('canvas');
  glowUp.width = w; glowUp.height = h;
  glowUp.getContext('2d').drawImage(glowCanvas, 0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.12 + intensity * 0.18;
  ctx.drawImage(glowUp, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // CRT vignette
  const cx = w / 2, cy = h / 2;
  const grad = ctx.createRadialGradient(cx, cy, Math.min(w,h)*0.3, cx, cy, Math.max(w,h)*0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${0.5 + intensity * 0.3})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Noise
  const final = ctx.getImageData(0, 0, w, h);
  _applyAnalogNoise(final.data, w, h, intensity * 0.4, rnd);
  ctx.putImageData(final, 0, 0);
}

function _applyCCTVMode(ctx, w, h, intensity, seed) {
  // B&W with cold green tint
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
    d[i]   = Math.min(255, lum * (1 - intensity * 0.08));
    d[i+1] = Math.min(255, lum * (1 + intensity * 0.06) + 3);
    d[i+2] = Math.min(255, lum * (1 - intensity * 0.04));
  }
  ctx.putImageData(id, 0, 0);

  // Pixelation (low CCD resolution)
  const pixelSize = Math.round(1 + intensity * 3);
  if (pixelSize > 1) {
    const pixCanvas = document.createElement('canvas');
    pixCanvas.width  = Math.floor(w / pixelSize);
    pixCanvas.height = Math.floor(h / pixelSize);
    const pCtx = pixCanvas.getContext('2d');
    pCtx.imageSmoothingEnabled = false;
    pCtx.drawImage(ctx.canvas, 0, 0, pixCanvas.width, pixCanvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixCanvas, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
  }

  // CCD grain (heavy)
  const rnd = seededRandom(seed);
  const id2 = ctx.getImageData(0, 0, w, h);
  const d2 = id2.data;
  const noiseAmt = 30 + intensity * 70;
  for (let i = 0; i < d2.length; i += 4) {
    const lum = d2[i] / 255;
    const shadowBoost = 1 + (1 - lum) * 1.2;
    const n = (rnd() - 0.5) * noiseAmt * shadowBoost;
    d2[i]   = Math.min(255, Math.max(0, d2[i]   + n));
    d2[i+1] = Math.min(255, Math.max(0, d2[i+1] + n * 1.05));
    d2[i+2] = Math.min(255, Math.max(0, d2[i+2] + n * 0.90));
  }
  ctx.putImageData(id2, 0, 0);

  // Light scanlines
  const id3 = ctx.getImageData(0, 0, w, h);
  _applyScanlines(id3.data, w, h, intensity * 0.5, 2);
  ctx.putImageData(id3, 0, 0);

  // Timestamp (only at 30%+)
  if (intensity >= 0.3) {
    const rnd2 = seededRandom(seed + 1);
    const year  = 1998 + Math.floor(rnd2() * 12);
    const month = String(1 + Math.floor(rnd2() * 12)).padStart(2, '0');
    const day   = String(1 + Math.floor(rnd2() * 28)).padStart(2, '0');
    const hour  = String(Math.floor(rnd2() * 24)).padStart(2, '0');
    const min   = String(Math.floor(rnd2() * 60)).padStart(2, '0');
    const sec   = String(Math.floor(rnd2() * 60)).padStart(2, '0');
    const timestamp = `${year}/${month}/${day}  ${hour}:${min}:${sec}`;
    const camId = `CAM ${String(Math.floor(rnd2() * 8) + 1).padStart(2, '0')}`;
    const fontSize = Math.max(10, Math.round(w * 0.022));
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(camId, 17, h - 31);
    ctx.fillText(timestamp, 17, h - 15);
    ctx.fillStyle = `rgba(180, 220, 180, ${0.7 + intensity * 0.3})`;
    ctx.fillText(camId, 16, h - 32);
    ctx.fillText(timestamp, 16, h - 16);
  }
}

function applyVHS(ctx, w, h, intensity, options = {}) {
  const { vhsMode = 'vhs', seed = Date.now() } = options;
  const rnd = seededRandom(seed);
  switch (vhsMode) {
    case 'vhs':  _applyVHSMode(ctx, w, h, intensity, rnd); break;
    case 'crt':  _applyCRTMode(ctx, w, h, intensity, rnd); break;
    case 'cctv': _applyCCTVMode(ctx, w, h, intensity, seed); break;
  }
}

function applyInkBleed(ctx, w, h, intensity, seed) {
  const src = ctx.getImageData(0, 0, w, h).data;
  const result = ctx.createImageData(w, h);
  const d = result.data;
  const bleedRadius = Math.max(1, Math.round(intensity * 3));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let minR = 255, minG = 255, minB = 255;
      let minBright = 999;
      for (let dy = -bleedRadius; dy <= bleedRadius; dy++) {
        for (let dx = -bleedRadius; dx <= bleedRadius; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const ny = Math.min(h - 1, Math.max(0, y + dy));
          const ni = (ny * w + nx) * 4;
          const brightness = src[ni] * 0.299 + src[ni + 1] * 0.587 + src[ni + 2] * 0.114;
          if (brightness < minBright) {
            minBright = brightness;
            minR = src[ni]; minG = src[ni + 1]; minB = src[ni + 2];
          }
        }
      }
      d[i]     = src[i]     + (minR - src[i])     * intensity * 0.6;
      d[i + 1] = src[i + 1] + (minG - src[i + 1]) * intensity * 0.6;
      d[i + 2] = src[i + 2] + (minB - src[i + 2]) * intensity * 0.6;
      d[i + 3] = src[i + 3];
    }
  }
  ctx.putImageData(result, 0, 0);
}

async function applyEffect(imageObj, effectName, intensity, opts) {
  if (!imageObj.srcOriginal) {
    imageObj.srcOriginal = imageObj.src;
  }
  if (!effectName || effectName === 'none') {
    imageObj.src = imageObj.srcOriginal;
    imageObj.effect = null;
    return imageObj;
  }
  const img = await loadImage(imageObj.srcOriginal);
  const canvas = document.createElement('canvas');
  canvas.width  = img.naturalWidth  || 714;
  canvas.height = img.naturalHeight || 1043;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const seed = imageObj.effect?.seed || Date.now();
  const o = opts || imageObj.effect || {};
  switch (effectName) {
    case 'papercut':  applyPapercut(ctx, canvas.width, canvas.height, intensity, seed); break;
    case 'halftone':  applyHalftone(ctx, canvas.width, canvas.height, intensity, !!o.colorMode); break;
    case 'vintage':
      if (o.vintageMode === 'risograph') {
        applyRisograph(ctx, canvas.width, canvas.height, intensity, seed, o.riso1 || '#FF4D8D', o.riso2 || '#1a1a1a');
      } else {
        applyVintage(ctx, canvas.width, canvas.height, intensity, {
          sepiaColor: o.sepiaColor || '#C8A060',
          vignetteColor: o.vignetteColor || '#000000',
          vignetteIntensity: o.vignetteIntensity ?? intensity,
        });
      }
      break;
    case 'manga':     applyManga(ctx, canvas.width, canvas.height, intensity); break;
    case 'sharpness': applySharpness(ctx, canvas.width, canvas.height, intensity); break;
    case 'inkbleed':  applyInkBleed(ctx, canvas.width, canvas.height, intensity, seed); break;
    case 'vhs':       applyVHS(ctx, canvas.width, canvas.height, intensity, { vhsMode: o.vhsMode || 'vhs', seed }); break;
  }
  imageObj.src = canvas.toDataURL('image/jpeg', 0.92);
  imageObj.effect = {
    name: effectName, intensity, seed,
    colorMode: o.colorMode || false,
    vintageMode: o.vintageMode || 'sepia',
    sepiaColor: o.sepiaColor || '#C8A060',
    vignetteColor: o.vignetteColor || '#000000',
    vignetteIntensity: o.vignetteIntensity ?? intensity,
    riso1: o.riso1 || '#FF4D8D',
    riso2: o.riso2 || '#1a1a1a',
    vhsMode: o.vhsMode || 'vhs',
  };
  return imageObj;
}


const EFFECT_DEFINITIONS = [
  { id: 'none',      label: 'Nenhum',              desc: '' },
  { id: 'papercut',  label: 'Papercut / Pel\u00edcula', desc: 'Grain fino + riscos + textura de pel\u00edcula' },
  { id: 'halftone',  label: 'Halftone',             desc: 'P&B cl\u00e1ssico ou pop-art colorido (CMY)' },
  { id: 'vintage',   label: 'Vintage / Risograph',  desc: 'S\u00e9pia forte + vinheta ou duotone Riso' },
  { id: 'manga',     label: 'Mang\u00e1',                desc: 'P&B alto contraste + screentone calibrado' },
  { id: 'sharpness', label: 'Nitidez',              desc: 'Unsharp mask \u2014 realce de bordas vis\u00edvel' },
  { id: 'inkbleed',  label: 'Ink Bleed',             desc: 'Expans\u00e3o de bordas escuras \u2014 sangria de tinta' },
  { id: 'vhs',       label: 'VHS / CRT / CCTV',     desc: 'Anal\u00f3gico \u2022 c\u00e2mera de seguran\u00e7a \u2022 monitor de tubo' },
];

// ── Cover Page Data Structures ──
function autoScaleFontSize(text, baseFontSize, maxWidth) {
  const longestWord = text.split(/\s+/).reduce((a, b) => a.length > b.length ? a : b, '');
  const estimatedWordWidth = longestWord.length * baseFontSize * 0.6;
  if (estimatedWordWidth <= maxWidth) return baseFontSize;
  const scaledSize = Math.floor(maxWidth / (longestWord.length * 0.6));
  return Math.max(scaledSize, 28);
}

const COVER_TEMPLATES = {
  'blockbuster': {
    name: 'Blockbuster',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4v16M5 4v16M9 4h6M9 20h6M9 12h6"/></svg>',
    description: 'Impacto Cinematográfico',
    bgColor: '#ffffff',
    structure: {
      topLine: { y: 64, color: '#000000', width: 6 },
      bottomLine: { y: 680, color: '#000000', width: 6 }
    },
    elements: [
      { id: 'director', type: 'cover-text', role: 'custom', text: 'DIRECTED BY\nAUTHOR NAME', x: 40, y: 12, width: 230,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: '700', color: '#000000', textAlign: 'left', textTransform: 'uppercase', lineHeight: '1.3' } },
      { id: 'year', type: 'cover-text', role: 'custom', text: '2026', x: 282, y: 12, width: 230,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: '700', color: '#000000', textAlign: 'center', textTransform: 'uppercase' } },
      { id: 'original-story', type: 'cover-text', role: 'custom', text: 'ORIGINAL STORY BY\nSTUDIO NAME', x: 524, y: 12, width: 230,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: '700', color: '#000000', textAlign: 'right', textTransform: 'uppercase', lineHeight: '1.3' } },
      { id: 'title', type: 'cover-text', role: 'title', text: 'TITLE', x: 40, y: 75, width: 714,
        style: { fontFamily: "'Archivo Black', sans-serif", fontSize: 72, fontWeight: '400', color: '#000000', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: '0.95' } },
      { id: 'arc', type: 'cover-text', role: 'subtitle', text: 'THE FINAL ARC', x: 40, y: 695, width: 714,
        style: { fontFamily: "'Archivo Black', sans-serif", fontSize: 56, fontWeight: '400', color: '#000000', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: '1.0' } },
      { id: 'synopsis', type: 'cover-text', role: 'synopsis', text: 'A mysterious force steps into this world, and our hero faces the deadliest battle yet — fueled by love in a world where survival knows no rules.', x: 40, y: 770, width: 714,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: '500', color: '#000000', textAlign: 'center', textTransform: 'none', lineHeight: '1.5', letterSpacing: '0px' } }
    ]
  },
  'monolith': {
    name: 'Monolith',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v18z"/><path d="M14 2v6h6"/><path d="M10 12v6"/><path d="M8 18h4"/></svg>',
    description: 'Impacto Tipográfico (Given)',
    bgColor: '#E63946',
    structure: {},
    elements: [
      { id: 'title', type: 'cover-text', role: 'title', text: 'GIVEN', x: 0, y: 220, width: 714,
        style: { fontFamily: "'Anton', sans-serif", fontSize: 280, fontWeight: '400', color: '#1a1a1a', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '-5px', lineHeight: '0.8', textShadow: '4px 4px 0px rgba(0,0,0,0.1)' } },
      { id: 'subtitle', type: 'cover-text', role: 'subtitle', text: 'ギヴン', x: 0, y: 500, width: 714,
        style: { fontFamily: "'Black Han Sans', sans-serif", fontSize: 120, fontWeight: '400', color: '#111111', textAlign: 'center', letterSpacing: '0px', lineHeight: '1.0' } },
      { id: 'tagline', type: 'cover-text', role: 'tagline', text: '"A story of a certain summer. A story of a certain night."', x: 40, y: 30, width: 714,
        style: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: '400', color: '#333333', textAlign: 'center', fontStyle: 'italic', letterSpacing: '1px' } }
    ]
  },
  'manga-shonen': {
    name: 'Manga Shonen',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    description: 'Estilo Japonês / Ação',
    bgColor: '#FF5500',
    structure: {
      topLine: { y: 70, color: 'rgba(0,0,0,0.3)', width: 3 },
      bottomLine: { y: 940, color: 'rgba(0,0,0,0.3)', width: 3 },
      volBadge: { x: 40, y: 18, w: 50, h: 50, border: '3px solid #000', bg: '#ffffff', text: 'VOL', textColor: '#000' }
    },
    elements: [
      { id: 'vol-label', type: 'cover-text', role: 'custom', text: '1', x: 46, y: 32, width: 38,
        style: { fontFamily: "'Koulen', sans-serif", fontSize: 26, fontWeight: '400', color: '#000000', textAlign: 'center' } },
      { id: 'title', type: 'cover-text', role: 'title', text: 'SHONEN IMPACT', x: 100, y: 10, width: 654,
        style: { fontFamily: "'Koulen', sans-serif", fontSize: 48, fontWeight: '400', color: '#ffffff', textAlign: 'left', letterSpacing: '2px', textShadow: '3px 3px 0 rgba(0,0,0,0.5)', lineHeight: '1.1' } },
      { id: 'author', type: 'cover-text', role: 'author', text: 'AUTOR', x: 40, y: 950, width: 400,
        style: { fontFamily: "'Archivo Black', sans-serif", fontSize: 18, fontWeight: '400', color: '#ffffff', textAlign: 'left', letterSpacing: '1px' } },
      { id: 'tagline', type: 'cover-text', role: 'tagline', text: 'サブタイトル', x: 40, y: 975, width: 300,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: '700', color: '#ffffff', textAlign: 'left', opacity: '0.7' } }
    ]
  },
  'brutal-editorial': {
    name: 'Brutal Editorial',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    description: 'Kerning Apertado / Editorial',
    bgColor: '#F4F4F0',
    structure: {
      topLine: { y: 40, color: '#FF3300', width: 4 }
    },
    elements: [
      { id: 'author', type: 'cover-text', role: 'author', text: 'A GRAPHIC NOVEL BY AUTHOR', x: 40, y: 15, width: 634,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: '800', color: '#FF3300', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '4px' } },
      { id: 'title', type: 'cover-text', role: 'title', text: 'THE\nSILENT\nECHO', x: 40, y: 80, width: 714,
        style: { fontFamily: "'Syne', sans-serif", fontSize: 110, fontWeight: '800', color: '#111111', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '-5px', lineHeight: '0.85' } },
      { id: 'vol', type: 'cover-text', role: 'subtitle', text: 'VOL 01', x: 40, y: 920, width: 300,
        style: { fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: '800', color: '#FF3300', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '-2px' } }
    ]
  }
};

const COVER_TEXT_PRESETS = {
  'blockbuster': { name: 'Blockbuster', fontFamily: "'Archivo Black', sans-serif", fontSize: 88, fontWeight: '400', color: '#000', textTransform: 'uppercase', letterSpacing: '-2px', transform: 'scaleX(1.15)', lineHeight: '0.9' },
  'monolith': { name: 'Monolith', fontFamily: "'Anton', sans-serif", fontSize: 240, fontWeight: '400', color: '#E63946', textTransform: 'uppercase', letterSpacing: '-5px', lineHeight: '0.8' },
  'brutal': { name: 'Brutal', fontFamily: "'Syne', sans-serif", fontSize: 140, fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '-6px', lineHeight: '0.85' },
  'manga': { name: 'Mangá', fontFamily: "'Nunito', sans-serif", fontSize: 32, fontWeight: '900', color: '#ffffff', textShadow: '2px 2px 0 rgba(0,0,0,0.3)', letterSpacing: '1px' },
  'terror': { name: 'Terror', fontFamily: "'Black Han Sans', sans-serif", fontSize: 56, fontWeight: '400', color: '#cc0000', textShadow: '0 0 20px #ff0000, 3px 3px 0 #000', textTransform: 'uppercase', letterSpacing: '2px' }
};

function createCover(projectName = '') {
  return {
    title: projectName || '',
    subtitle: '',
    author: '',
    penciller: '',
    colorist: '',
    volume: 1,
    issue: 1,
    year: new Date().getFullYear(),
    publisher: '',
    genre: '',
    rating: '',
    synopsis: '',
    language: 'pt',
    backgroundImage: null,
    backgroundColor: '#ffffff',
    elements: [],
    showBleedGuides: false,
    showSafeAreaGuides: false,
    template: null
  };
}

// ── Back Cover (Contracapa) ──
const BACKCOVER_TEMPLATES = {
  'classica': {
    name: 'Clássica',
    icon: '📋',
    description: 'Sinopse + Código de barras',
    bgColor: '#f5f5f5',
    elements: [
      { id: 'synopsis', type: 'cover-text', role: 'synopsis', text: 'Insira aqui a sinopse da sua história. Descreva o enredo principal sem revelar o final — deixe o leitor curioso para virar as páginas.', x: 60, y: 80, width: 594,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: '400', color: '#333333', textAlign: 'left', lineHeight: '1.6' } },
      { id: 'quote', type: 'cover-text', role: 'tagline', text: '"Uma aventura que vai mudar tudo."', x: 60, y: 420, width: 594,
        style: { fontFamily: "'Lora', Georgia, serif", fontSize: 18, fontWeight: '400', color: '#666666', textAlign: 'center', fontStyle: 'italic' } },
      { id: 'credits', type: 'cover-text', role: 'custom', text: 'Roteiro e Arte: Autor\nEditora · 2026', x: 60, y: 900, width: 400,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: '400', color: '#999999', textAlign: 'left', letterSpacing: '1px' } },
      { id: 'barcode-label', type: 'cover-text', role: 'custom', text: 'ISBN 000-00-0000-000-0', x: 460, y: 960, width: 230,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: '400', color: '#aaaaaa', textAlign: 'right', letterSpacing: '0.5px' } }
    ]
  },
  'editorial': {
    name: 'Editorial',
    icon: '📖',
    description: 'Graphic novel / BD europeia',
    bgColor: '#F5F0E8',
    elements: [
      { id: 'synopsis', type: 'cover-text', role: 'synopsis', text: 'Insira aqui a sinopse da sua história. Uma narrativa rica e envolvente que transporta o leitor para um mundo completamente novo.', x: 80, y: 120, width: 554,
        style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: '400', color: '#444444', textAlign: 'justify', lineHeight: '1.7' } },
      { id: 'pull-quote', type: 'cover-text', role: 'tagline', text: '"Extraordinário."\n— Revista Exemplo', x: 80, y: 500, width: 554,
        style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: '400', color: '#777777', textAlign: 'center', fontStyle: 'italic', lineHeight: '1.4' } },
      { id: 'author-bio', type: 'cover-text', role: 'custom', text: 'SOBRE O AUTOR\n\nDescreva aqui uma breve biografia do autor, incluindo outros trabalhos publicados e prêmios.', x: 80, y: 680, width: 554,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: '400', color: '#888888', textAlign: 'left', lineHeight: '1.6', letterSpacing: '0.5px' } },
      { id: 'publisher-info', type: 'cover-text', role: 'publisher', text: 'Editora · Coleção', x: 80, y: 950, width: 300,
        style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 12, fontWeight: '400', color: '#aaa', textAlign: 'left', letterSpacing: '2px', textTransform: 'uppercase' } },
      { id: 'isbn', type: 'cover-text', role: 'custom', text: 'ISBN 000-00-0000-000-0', x: 460, y: 955, width: 230,
        style: { fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: '400', color: '#bbb', textAlign: 'right' } }
    ]
  }
};

function createBackCover() {
  return {
    synopsis: '',
    backgroundImage: null,
    backgroundColor: '#f5f5f5',
    elements: [],
    showBleedGuides: false,
    showSafeAreaGuides: false,
    template: null
  };
}

function createProject(name, videoFormat = 'vertical') {
  return {
    id: genId(),
    metadata: { name, createdAt: Date.now(), updatedAt: Date.now() },
    settings: {
      colorPalette: { balloonBg: '#FFFFFF', balloonBorder: '#1a1a1a', textColor: '#000000' },
      audio: null, // { name: 'track.mp3', data: 'data:audio/mp3;base64,...', durationPerPage: 3 }
      autoPastePage: false // Feature 1: Auto-create page on paste
    },
    // Multi-language support
    defaultLanguage: 'pt-BR',
    languages: ['pt-BR', 'en'],
    activeLanguage: 'pt-BR', // Currently active language in editor
    // Narrative Track system
    narrativeMode: 'per-page', // 'per-page' | 'continuous-track' | 'hybrid'
    narrativePosition: 'bottom', // 'top' | 'bottom'
    narrativeSegments: [], // [{ id, text: {pt-BR, en}, pageRange: [start, end], style }]
    narrativeDisplay: 'single',   // 'single' | 'dual' — single shows activeLanguage, dual shows both
    narrativeOrder: 'pt-first',    // 'pt-first' | 'en-first' — which language on top in dual mode
    narrativeDualSpacing: 4,       // px gap between PT and EN lines in dual mode
    narrativeSettings: {
      heightLocked: false,
      fontSizeLocked: false,
      overflow: 'shrink', // 'truncate' | 'shrink' | 'warn'
      minFontSize: 12,
      warnOnMin: false
    },
    // HQ Movie specific
    videoFormat: videoFormat, // 'vertical' | 'widescreen' | 'square'
    videoAudio: {
      background: { file: null, volume: 0.4, loop: true, fadeIn: 1, fadeOut: 2 },
      ducking: { enabled: true, level: 0.15, fadeMs: 200 },
      pages: [] // [{ pageId, narration: { 'pt-BR': {file, volume, duration}, 'en': {...} } }]
    },
    timeline: {
      defaultDuration: 4, // seconds per page without audio
      transition: 'fade', // 'fade' | 'slide' | 'cut'
      transitionDuration: 0.5
    },
    cover: null,
    backCover: null,
    library: [],
    customLayouts: [],      // User-created layouts: [{ id, name, createdAt, count, thumbnail, panels }]
    favoriteLayoutId: null, // Default layout ID (built-in or custom) for new pages
    pages: [createPage(0, videoFormat)]
  };
}

function createVideoProject(name, videoFormat = 'vertical') {
  const project = createProject(name, videoFormat);
  // Set default video layout
  const defaultLayout = getDefaultVideoLayout(videoFormat);
  project.pages[0].layoutId = defaultLayout;
  return project;
}
function createPage(order, videoFormat = null) {
  const layoutId = videoFormat ? getDefaultVideoLayout(videoFormat) : null;
  return { 
    id: genId(), 
    order, 
    layoutId, 
    images: [], 
    texts: [], 
    narrative: { 'pt-BR': '', 'en': '' }, // Multi-language narrative
    narrativeSegmentId: null, // Reference to segment in continuous-track mode
    recordatorios: [], 
    narrativeStyle: { 
      align: 'justify', 
      font: 'serif', 
      size: 48, 
      color: '#333333', 
      leading: 1.4,
      background: 'rgba(0,0,0,0.85)',
      textColor: '#ffffff'
    }, 
    materiaZones: {}, 
    duration: 4,
    // Slideshow mode: multiple images in temporal sequence
    slides: [], // [{ id, image, duration, kenBurns, transition, transitionDuration, panX, panY, zoom }]
    kenBurns: 'zoom-in', // Default Ken Burns for non-slideshow layouts
    transition: 'fade' // Default transition
  };
}

// ── Multi-Language Text Helpers ──
const MultiLang = {
  // Get text for specific language, with fallback
  get(textObj, lang, fallbackLang = 'pt-BR') {
    if (typeof textObj === 'string') return textObj; // Legacy support
    if (!textObj) return '';
    return textObj[lang] || textObj[fallbackLang] || Object.values(textObj)[0] || '';
  },
  
  // Set text for specific language
  set(textObj, lang, value) {
    if (typeof textObj === 'string') {
      // Migrate string to object
      return { 'pt-BR': textObj, 'en': '', [lang]: value };
    }
    return { ...textObj, [lang]: value };
  },
  
  // Create empty multi-lang object
  empty() {
    return { 'pt-BR': '', 'en': '' };
  },
  
  // Check if text exists for language
  has(textObj, lang) {
    if (typeof textObj === 'string') return lang === 'pt-BR' && textObj.length > 0;
    return textObj && textObj[lang] && textObj[lang].length > 0;
  },
  
  // Migrate string to multi-lang object
  migrate(text) {
    if (typeof text === 'object' && text !== null) return text;
    return { 'pt-BR': text || '', 'en': '' };
  },
  
  // Get active language from project or Store
  getActive(project) {
    return project?.activeLanguage || (typeof Store !== 'undefined' ? Store.get('activeLanguage') : null) || 'pt-BR';
  },
  
  // Validate translations - returns array of missing items
  validate(project) {
    const missing = [];
    const langs = project.languages || ['pt-BR', 'en'];
    
    project.pages.forEach((page, pi) => {
      // Check page narrative
      if (page.narrative) {
        langs.forEach(lang => {
          if (!this.has(page.narrative, lang)) {
            missing.push({ type: 'narrative', pageIndex: pi, lang });
          }
        });
      }
      // Check balloons
      (page.texts || []).forEach((balloon, bi) => {
        if (balloon.text) {
          langs.forEach(lang => {
            if (!this.has(balloon.text, lang)) {
              missing.push({ type: 'balloon', pageIndex: pi, balloonIndex: bi, lang });
            }
          });
        }
      });
    });
    
    // Check narrative segments
    (project.narrativeSegments || []).forEach((seg, si) => {
      if (seg.text) {
        langs.forEach(lang => {
          if (!this.has(seg.text, lang)) {
            missing.push({ type: 'segment', segmentIndex: si, lang });
          }
        });
      }
    });
    
    return missing;
  }
};
window.MultiLang = MultiLang;

// ── Narrative Segment Helpers ──
const NarrativeSegments = {
  // Create a new segment
  create(startPage, endPage, text = null) {
    return {
      id: genId(),
      text: text || { 'pt-BR': '', 'en': '' },
      pageRange: [startPage, endPage],
      style: {
        font: 'serif',
        size: 30,
        color: '#ffffff',
        background: 'rgba(0,0,0,0.85)',
        align: 'center',
        padding: 24
      }
    };
  },
  
  // Get segment for a specific page
  getForPage(project, pageIndex) {
    if (!project.narrativeSegments) return null;
    return project.narrativeSegments.find(seg => 
      pageIndex >= seg.pageRange[0] && pageIndex <= seg.pageRange[1]
    );
  },
  
  // Find gaps (pages without segment)
  findGaps(project) {
    const gaps = [];
    const pageCount = project.pages.length;
    const segments = project.narrativeSegments || [];
    
    for (let i = 0; i < pageCount; i++) {
      const hasSegment = segments.some(seg => 
        i >= seg.pageRange[0] && i <= seg.pageRange[1]
      );
      if (!hasSegment) gaps.push(i);
    }
    return gaps;
  },
  
  // Auto-assign pages to segments based on count
  autoSplit(project, pagesPerSegment = 3) {
    const pageCount = project.pages.length;
    const segments = [];
    
    for (let i = 0; i < pageCount; i += pagesPerSegment) {
      const end = Math.min(i + pagesPerSegment - 1, pageCount - 1);
      segments.push(this.create(i, end));
    }
    
    return segments;
  },
  
  // Update page references when segment changes
  updatePageRefs(project) {
    project.pages.forEach((page, i) => {
      const seg = this.getForPage(project, i);
      page.narrativeSegmentId = seg ? seg.id : null;
    });
  }
};
window.NarrativeSegments = NarrativeSegments;

// ── SFX Style Presets ──
const SFX_PRESETS = {
  boom: {
    id: 'boom', name: 'BOOM!',
    font: 'comic', fontSize: 48,
    color: '#ff6600', stroke: '#000000', strokeWidth: 3,
    rotate: -8, skewX: 0, letterSpacing: 4,
    shadow: '3px 3px 0 #000'
  },
  pow: {
    id: 'pow', name: 'POW!',
    font: 'comic', fontSize: 42,
    color: '#ffff00', stroke: '#ff0000', strokeWidth: 4,
    rotate: 12, skewX: -5, letterSpacing: 3,
    shadow: '2px 2px 0 #000'
  },
  crash: {
    id: 'crash', name: 'CRASH!',
    font: 'display', fontSize: 56,
    color: '#ffffff', stroke: '#000000', strokeWidth: 5,
    rotate: -15, skewX: -2, letterSpacing: 2,
    shadow: '4px 4px 0 #000'
  },
  splash: {
    id: 'splash', name: 'SPLASH!',
    font: 'comic', fontSize: 40,
    color: '#00bfff', stroke: '#0066cc', strokeWidth: 2,
    rotate: 5, skewX: 0, letterSpacing: 2,
    shadow: '2px 2px 0 #004a99'
  },
  whoosh: {
    id: 'whoosh', name: 'WHOOSH!',
    font: 'marker', fontSize: 44,
    color: '#f8fafc', stroke: '#111827', strokeWidth: 3,
    rotate: -10, skewX: -10, letterSpacing: 3,
    shadow: '2px 2px 0 #111827'
  }
};
window.SFX_PRESETS = SFX_PRESETS;

// ── BalloonSVGRenderer v2 — Organic Bézier paths ──
window.BalloonSVGRenderer = {

  _shadow() {
    return `<defs><filter id="bbShadow" x="-18%" y="-18%" width="146%" height="150%">
      <feDropShadow dx="1" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.22)"/></filter></defs>`;
  },

  // ── Organic speech paths — 400×400 normalized viewBox ──
  // Hand-crafted Bézier curves; source: test-balloon-tail-lab.html
  _SP: {
    s:      'M 90,210 C 110,90 320,110 310,200 C 300,310 210,290 180,300 C 170,340 140,370 120,380 C 135,340 145,310 140,290 C 80,290 70,240 90,210 Z',
    n:      'M 90,190 C 80,310 320,290 310,200 C 300,90 210,110 180,100 C 170,60 140,30 120,20 C 135,60 145,90 140,110 C 80,110 70,160 90,190 Z',
    e:      'M 190,90 C 90,80 110,320 200,310 C 310,300 290,210 300,180 C 340,170 370,140 380,120 C 340,135 310,145 290,140 C 290,80 240,70 190,90 Z',
    w:      'M 210,90 C 310,80 290,320 200,310 C 90,300 110,210 100,180 C 60,170 30,140 20,120 C 60,135 90,145 110,140 C 110,80 160,70 210,90 Z',
    ne:     'M 150,150 C 90,220 160,320 250,310 C 340,290 360,180 310,140 C 330,110 360,80 380,60 C 340,90 310,110 280,120 C 230,80 130,90 150,150 Z',
    nw:     'M 250,150 C 310,220 240,320 150,310 C 60,290 40,180 90,140 C 70,110 40,80 20,60 C 60,90 90,110 120,120 C 170,80 270,90 250,150 Z',
    se:     'M 150,250 C 90,180 160,80 250,90 C 340,110 360,220 310,260 C 330,290 360,320 380,340 C 340,310 310,290 280,280 C 230,320 130,310 150,250 Z',
    sw:     'M 250,250 C 310,180 240,80 150,90 C 60,110 40,220 90,260 C 70,290 40,320 20,340 C 60,310 90,290 120,280 C 170,320 270,310 250,250 Z',
    none:   'M 50,200 C 50,95 140,38 200,38 C 260,38 350,95 350,200 C 350,305 260,362 200,362 C 140,362 50,305 50,200 Z',
    center: 'M 50,200 C 50,95 140,38 200,38 C 260,38 350,95 350,200 C 350,305 260,362 200,362 C 140,362 50,305 50,200 Z',
  },

  render(type, w, h, tailDir, opts = {}) {
    const o = {
      fill:   opts.fill        || 'var(--bb-bg,#fff)',
      stroke: opts.stroke      || 'var(--bb-border,#222)',
      sw:     opts.strokeWidth || 2.5,
    };
    switch (type) {
      case 'speech':    return this.dialog(w, h, tailDir || 's', o);
      case 'thought':   return this.thought(w, h, tailDir || 'sw', o);
      case 'shout':     return this.shout(w, h, tailDir || 's', o);
      case 'whisper':   return this.whisper(w, h, tailDir || 's', o);
      case 'narration': return this.box(w, h, o, opts);
      case 'sfx':       return this.sfx(w, h, o);
      default:          return this.dialog(w, h, tailDir || 's', o);
    }
  },

  // ── Speech ───────────────────────────────────────────────────────────────
  // Rounded rectangle + triangle tail — professional comic style
  // Reference: devsnap.me/css-speech-bubbles
  dialog(w, h, tailDir, o) {
    const PAD = 28;
    const R = Math.min(w, h) * 0.15;  // corner radius
    const sw = o.sw || 2.5;
    const dir = (!tailDir || tailDir === 'center' || tailDir === 'none') ? null : tailDir;

    // Rounded rect path
    const rectPath = `M ${R},0 L ${w - R},0 Q ${w},0 ${w},${R} L ${w},${h - R} Q ${w},${h} ${w - R},${h} L ${R},${h} Q 0,${h} 0,${h - R} L 0,${R} Q 0,0 ${R},0 Z`;

    // Tail triangles — positioned on the edges of the rounded rect
    const TL = Math.min(w, h) * 0.28;  // tail length
    const TW = Math.min(w, h) * 0.18;  // tail half-width
    const tailPaths = {
      s:  `M ${w*0.4},${h} L ${w*0.5},${h+TL} L ${w*0.4+TW*2},${h} Z`,
      n:  `M ${w*0.4},0 L ${w*0.5},${-TL} L ${w*0.4+TW*2},0 Z`,
      e:  `M ${w},${h*0.35} L ${w+TL},${h*0.5} L ${w},${h*0.35+TW*2} Z`,
      w:  `M 0,${h*0.35} L ${-TL},${h*0.5} L 0,${h*0.35+TW*2} Z`,
      sw: `M ${w*0.2},${h} L ${w*0.05},${h+TL} L ${w*0.2+TW*1.5},${h} Z`,
      se: `M ${w*0.6},${h} L ${w*0.85},${h+TL} L ${w*0.6+TW*1.5},${h} Z`,
      nw: `M ${w*0.2},0 L ${w*0.05},${-TL} L ${w*0.2+TW*1.5},0 Z`,
      ne: `M ${w*0.6},0 L ${w*0.85},${-TL} L ${w*0.6+TW*1.5},0 Z`,
    };

    const tailPath = dir && tailPaths[dir]
      ? `<path d="${tailPaths[dir]}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`
      : '';

    const svgW = w + PAD * 2, svgH = h + PAD * 2;
    return `<svg width="${svgW}" height="${svgH}" viewBox="${-PAD} ${-PAD} ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;position:absolute;left:${-PAD}px;top:${-PAD}px;pointer-events:none;">
      ${this._shadow()}
      <g filter="url(#bbShadow)">
        ${tailPath}
        <path d="${rectPath}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
      </g></svg>`;
  },

  // ── Thought ──────────────────────────────────────────────────────────────
  // Pre-designed organic Bézier cloud path (400×420 viewBox) scaled to w×h.
  // Asymmetric bumps — each segment has different curvature for hand-drawn feel.
  // Bubble trail: 3 diminishing circles (SW / S / SE only).
  thought(w, h, tailDir, o) {
    const PAD = 22;

    // Organic cloud path pre-drawn in 400×400 space — asymmetric intentional
    const cloudPath = 'M 205,52 C 240,44 278,56 295,80 C 318,62 345,68 350,95 C 372,88 382,118 368,142 C 390,158 386,192 362,202 C 374,228 360,258 334,262 C 340,290 316,310 290,302 C 282,328 255,340 228,326 C 215,348 186,346 170,328 C 150,342 124,332 118,308 C 92,314 74,290 82,264 C 58,254 52,226 68,208 C 46,192 46,160 68,148 C 52,126 58,96 82,88 C 80,60 106,46 132,55 C 148,36 180,34 200,50 Z';

    const sx = (w / 400).toFixed(5);
    const sy = (h / 400).toFixed(5);

    // Bubble trail — only for SW / S / SE (scaled to actual balloon size)
    const trailMap = {
      sw: [{ cx: 122, cy: 322 }, { cx: 92, cy: 356 }, { cx: 70, cy: 382 }],
      s:  [{ cx: 200, cy: 332 }, { cx: 200, cy: 362 }, { cx: 200, cy: 386 }],
      se: [{ cx: 278, cy: 322 }, { cx: 308, cy: 356 }, { cx: 330, cy: 382 }],
    };
    const radii = [20, 13, 8];
    const trail = trailMap[tailDir];
    let bubbles = '';
    if (trail) {
      trail.forEach((b, idx) => {
        bubbles += `<circle cx="${b.cx}" cy="${b.cy}" r="${radii[idx]}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.sw}" vector-effect="non-scaling-stroke"/>`;
      });
    }

    const svgW = w + PAD * 2, svgH = h + PAD * 2 + 10;
    return `<svg width="${svgW}" height="${svgH}" viewBox="${-PAD} ${-PAD} ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;position:absolute;left:${-PAD}px;top:${-PAD}px;pointer-events:none;">
      ${this._shadow()}
      <g filter="url(#bbShadow)">
        <g transform="scale(${sx},${sy})">
          <path d="${cloudPath}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${o.sw}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          ${bubbles}
        </g>
      </g></svg>`;
  },

  // ── Shout ────────────────────────────────────────────────────────────────
  // Irregular-spike starburst with preserveAspectRatio="none".
  // Dynamic PAD: inner ring (R_IN=125) maps to wrapper edges.
  // Formula: PAD = 0.3 * dimension (derived from (200-R_IN)/400 ratio).
  // This guarantees spikes always extend OUTSIDE the wrapper, text stays inside.
  shout(w, h, tailDir, o) {
    const PAD_X = Math.max(20, Math.round(w * 0.3));
    const PAD_Y = Math.max(20, Math.round(h * 0.3));
    const SPIKES = 20;
    const cx = 200, cy = 200;
    const R_OUT = 175, R_IN = 125;

    let pts = '';
    for (let i = 0; i < SPIKES * 2; i++) {
      const a = (i / (SPIKES * 2)) * Math.PI * 2 - Math.PI / 2;
      const outer = i % 2 === 0;
      const jitter = outer
        ? 1 + 0.16 * Math.abs(Math.sin(i * 127.1 + 311.7))
        : 1 - 0.09 * Math.abs(Math.sin(i * 73.3 + 157.9));
      const r = (outer ? R_OUT : R_IN) * jitter;
      pts += `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)} `;
    }

    const fillShout = o.fill === 'var(--bb-bg,#fff)' ? 'var(--bb-bg,#fffde7)' : o.fill;
    const svgW = w + PAD_X * 2, svgH = h + PAD_Y * 2;
    return `<svg width="${svgW}" height="${svgH}" viewBox="0 0 400 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;position:absolute;left:${-PAD_X}px;top:${-PAD_Y}px;pointer-events:none;">
      ${this._shadow()}
      <g filter="url(#bbShadow)">
        <polygon points="${pts}" fill="${fillShout}" stroke="${o.stroke}" stroke-width="4" stroke-linejoin="bevel" vector-effect="non-scaling-stroke"/>
      </g></svg>`;
  },

  // ── Whisper ──────────────────────────────────────────────────────────────
  // Rounded rectangle with dashed border + small dashed triangle tail
  whisper(w, h, tailDir, o) {
    const PAD = 28;
    const R = Math.min(w, h) * 0.15;
    const sw = o.sw || 2.5;
    const dir = (!tailDir || tailDir === 'center' || tailDir === 'none') ? null : tailDir;

    const rectPath = `M ${R},0 L ${w - R},0 Q ${w},0 ${w},${R} L ${w},${h - R} Q ${w},${h} ${w - R},${h} L ${R},${h} Q 0,${h} 0,${h - R} L 0,${R} Q 0,0 ${R},0 Z`;

    const TL = Math.min(w, h) * 0.22;
    const TW = Math.min(w, h) * 0.14;
    const tailPaths = {
      s:  `M ${w*0.4},${h} L ${w*0.5},${h+TL} L ${w*0.4+TW*2},${h} Z`,
      n:  `M ${w*0.4},0 L ${w*0.5},${-TL} L ${w*0.4+TW*2},0 Z`,
      e:  `M ${w},${h*0.35} L ${w+TL},${h*0.5} L ${w},${h*0.35+TW*2} Z`,
      w:  `M 0,${h*0.35} L ${-TL},${h*0.5} L 0,${h*0.35+TW*2} Z`,
      sw: `M ${w*0.2},${h} L ${w*0.05},${h+TL} L ${w*0.2+TW*1.5},${h} Z`,
      se: `M ${w*0.6},${h} L ${w*0.85},${h+TL} L ${w*0.6+TW*1.5},${h} Z`,
      nw: `M ${w*0.2},0 L ${w*0.05},${-TL} L ${w*0.2+TW*1.5},0 Z`,
      ne: `M ${w*0.6},0 L ${w*0.85},${-TL} L ${w*0.6+TW*1.5},0 Z`,
    };

    const tailPath = dir && tailPaths[dir]
      ? `<path d="${tailPaths[dir]}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-dasharray="5 4"/>`
      : '';

    const svgW = w + PAD * 2, svgH = h + PAD * 2;
    return `<svg width="${svgW}" height="${svgH}" viewBox="${-PAD} ${-PAD} ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;position:absolute;left:${-PAD}px;top:${-PAD}px;pointer-events:none;">
      ${this._shadow()}
      <g filter="url(#bbShadow)">
        ${tailPath}
        <path d="${rectPath}" fill="${o.fill}" stroke="${o.stroke}" stroke-width="${sw}" stroke-dasharray="8 5" stroke-linecap="round" stroke-linejoin="round"/>
      </g></svg>`;
  },

  // ── Narration (Caption Box) — solid rectangle + double-border ────────────
  box(w, h, o, opts = {}) {
    const sw      = opts.strokeWidth || o.sw || 1.5;
    const radius  = opts.cornerRadius ?? 4;
    const fillBox = o.fill === 'var(--bb-bg,#fff)' ? 'var(--bb-bg,#fffde7)' : o.fill;
    const stroke  = o.stroke || '#1a1a1a';
    const gap     = 3;
    const sw2     = 0.75;

    return `<svg xmlns="http://www.w3.org/2000/svg"
      width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"
      style="position:absolute;inset:0;overflow:visible;pointer-events:none">
      ${this._shadow()}
      <g filter="url(#bbShadow)">
        <rect
          x="${sw / 2}" y="${sw / 2}"
          width="${w - sw}" height="${h - sw}"
          rx="${radius}" ry="${radius}"
          fill="${fillBox}"
          stroke="${stroke}"
          stroke-width="${sw}"/>
        <rect
          x="${sw / 2 + gap}" y="${sw / 2 + gap}"
          width="${w - sw - gap * 2}" height="${h - sw - gap * 2}"
          rx="${Math.max(0, radius - 1)}" ry="${Math.max(0, radius - 1)}"
          fill="none"
          stroke="${stroke}"
          stroke-width="${sw2}"
          opacity="0.5"/>
      </g></svg>`;
  },

  // ── SFX — transparent container, text only ───────────────────────────────
  sfx(w, h) {
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="pointer-events:none;"><rect fill="transparent" width="${w}" height="${h}"/></svg>`;
  },
};

// Compatibility shim — old code calls Balloons.getForType(type, w, h, dir)
const Balloons = {
  getForType(type, w, h, dir) {
    return BalloonSVGRenderer.render(type, w, h, dir);
  }
};

// ── TextMeasurer v2 — DOM-based measurement ──
// Uses a real hidden DOM element with identical CSS to .balloon-text
// This guarantees measurement matches rendering exactly (fonts, letter-spacing, transforms, etc.)
const TextMeasurer = {
  _measureDiv: null,

  _ensureDiv() {
    if (this._measureDiv) return;
    const div = document.createElement('div');
    div.style.cssText = `
      position:absolute; top:-9999px; left:-9999px;
      visibility:hidden; pointer-events:none; z-index:-1;
      white-space:pre-wrap; word-break:break-word; overflow-wrap:break-word;
    `;
    document.body.appendChild(div);
    this._measureDiv = div;
  },

  // Measure text using actual DOM rendering — returns { width, height }
  measureDOM(text, type, fontSize, maxWidth) {
    this._ensureDiv();
    const typo = window.BALLOON_TYPOGRAPHY[type] || window.BALLOON_TYPOGRAPHY.speech;
    const div = this._measureDiv;

    div.style.width = maxWidth + 'px';
    div.style.fontFamily = typo.fontFamily;
    div.style.fontSize = fontSize + 'px';
    div.style.fontWeight = typo.fontWeight || 'normal';
    div.style.fontStyle = typo.fontStyle || 'normal';
    div.style.textTransform = typo.textTransform || 'none';
    div.style.letterSpacing = typo.letterSpacing || '0';
    div.style.lineHeight = typo.lineHeight || '1.25';
    div.style.textAlign = typo.textAlign || 'center';

    div.innerText = text;

    return {
      width: div.scrollWidth,
      height: div.scrollHeight
    };
  },

  calcBalloonSize(text, fontSize, fontId, type = 'speech') {
    const limits = {
      speech:    { minW: 120, maxW: 300 },
      thought:   { minW: 130, maxW: 320 },
      shout:     { minW: 180, maxW: 400 },
      whisper:   { minW: 110, maxW: 280 },
      narration: { minW: 160, maxW: 500 },
      sfx:       { minW: 80,  maxW: 350 },
    }[type] || { minW: 120, maxW: 300 };

    if (!text || !text.trim()) {
      return { w: limits.minW, h: type === 'narration' ? 60 : 80 };
    }

    // Calculate insets for max width to get available text area
    const estInsets = window._calcBalloonInsets ?
      window._calcBalloonInsets(type, limits.maxW, 200) :
      { l: 10, r: 10, t: 8, b: 8 };

    // Available text width inside the max balloon
    const maxTextW = limits.maxW - estInsets.l - estInsets.r;

    // DOM-based measurement — exact match with CSS rendering
    const measured = this.measureDOM(text, type, fontSize, maxTextW);

    // Calculate needed balloon dimensions
    const neededW = measured.width + estInsets.l + estInsets.r;

    // Recalculate insets with actual dimensions for accurate height
    const finalInsets = window._calcBalloonInsets ?
      window._calcBalloonInsets(type, Math.min(limits.maxW, Math.max(limits.minW, neededW)), measured.height + estInsets.t + estInsets.b) :
      { t: 8, b: 8 };
    const neededH = measured.height + finalInsets.t + finalInsets.b;

    return {
      w: Math.max(limits.minW, Math.min(limits.maxW, Math.ceil(neededW))),
      h: Math.max(type === 'shout' ? 110 : type === 'thought' ? 80 : type === 'narration' ? 50 : 70, Math.ceil(neededH))
    };
  },

  clear() {
    // no-op for compatibility
  }
};

const LayoutEngine = {
  getForCount(n, videoFormat = null) {
    // If video format specified, use video layouts
    if (videoFormat && typeof VideoLayouts !== 'undefined') {
      const videoList = Object.entries(VideoLayouts)
        .filter(([_, t]) => t.format === videoFormat && (t.count === n || t.count === -1))
        .map(([id, t]) => ({ id, ...t }));
      return videoList;
    }
    // Otherwise use standard A4 layouts
    const list = Object.entries(Layouts).filter(([_, t]) => !t.isMateria && (t.count === n || t.count === -1)).map(([id, t]) => ({ id, ...t }));
    return list;
  },
  getVideoLayouts(videoFormat) {
    if (typeof VideoLayouts === 'undefined') return [];
    return Object.entries(VideoLayouts)
      .filter(([_, t]) => t.format === videoFormat)
      .map(([id, t]) => ({ id, ...t }));
  },
  get(id, images = [], project = null) {
    // Check if it's a video layout first
    if (typeof VideoLayouts !== 'undefined' && VideoLayouts[id]) {
      return VideoLayouts[id];
    }
    // Handle custom layouts (id starts with 'custom-')
    if (id && id.startsWith('custom-') && project && project.customLayouts) {
      const custom = project.customLayouts.find(c => c.id === id);
      if (custom) {
        return { name: custom.name, count: custom.count, panels: custom.panels, isCustom: true };
      }
    }
    const lay = Layouts[id] || Layouts['1p-full'];
    
    // Canvas Livre - auto-grid determinístico (sem sobreposição)
    // Regras: 1img→1col full, 2img→2cols lado a lado, 3-4img→2cols, 5+img→3cols
    if (id === 'free-canvas') {
      const realImages = images.filter(img => img && img.src);
      const count = realImages.length;
      if (count === 0) {
        return { ...lay, panels: [{ x: 0, y: 0, w: CW, h: CH, order: 1 }] };
      }
      const G = 12; // gutter
      // Determinar colunas baseado na contagem
      const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;
      const rows = Math.ceil(count / cols);
      const panelW = Math.floor((CW - G * (cols - 1)) / cols);
      const panelH = Math.floor((CH - G * (rows - 1)) / rows);
      
      const panels = [];
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        panels.push({
          x: col * (panelW + G),
          y: row * (panelH + G),
          w: panelW,
          h: panelH,
          order: i + 1
        });
      }
      return { ...lay, panels };
    }
    
    // Masonry - Pinterest-style com colunas balanceadas e alturas variadas
    // Regras: 1img→full, 2-4img→2cols, 5+img→3cols
    // Altura variada usando seed baseada no id da imagem (não índice)
    if (id === 'masonry') {
      const realImages = images.filter(img => img && img.src);
      const count = realImages.length;
      if (count === 0) {
        return { ...lay, panels: [{ x: 0, y: 0, w: CW, h: CH, order: 1 }] };
      }
      if (count === 1) {
        return { ...lay, panels: [{ x: 0, y: 0, w: CW, h: CH, order: 1 }] };
      }
      
      const G = 12; // gutter
      const cols = count <= 4 ? 2 : 3;
      const colW = Math.floor((CW - G * (cols - 1)) / cols);
      
      // Função hash simples para gerar seed baseada no id da imagem
      const hashSeed = (str) => {
        let hash = 0;
        const s = String(str || Math.random());
        for (let i = 0; i < s.length; i++) {
          hash = ((hash << 5) - hash) + s.charCodeAt(i);
          hash = hash & hash;
        }
        return Math.abs(hash);
      };
      
      // Alturas variadas baseadas em seed do id (não índice)
      // Proporções entre 0.35 e 0.65 da altura média esperada
      const avgH = Math.floor(CH / Math.ceil(count / cols));
      const colHeights = new Array(cols).fill(0);
      const panels = [];
      
      for (let i = 0; i < count; i++) {
        const img = realImages[i];
        const seed = hashSeed(img?.id || i);
        // Variação de altura: 0.5 a 0.8 da altura média, baseado em seed
        const heightRatio = 0.5 + (seed % 30) / 100; // 0.50 a 0.79
        let panelH = Math.floor(avgH * heightRatio);
        panelH = Math.max(100, Math.min(panelH, CH * 0.6)); // limites
        
        // Colocar na coluna mais baixa (algoritmo masonry real)
        const targetCol = colHeights.indexOf(Math.min(...colHeights));
        const x = targetCol * (colW + G);
        const y = colHeights[targetCol];
        
        // Verificar se cabe na página
        if (y + panelH > CH) {
          panelH = Math.max(80, CH - y - G);
        }
        
        panels.push({ x, y, w: colW, h: panelH, order: i + 1 });
        colHeights[targetCol] += panelH + G;
      }
      return { ...lay, panels };
    }
    
    return lay;
  },
  getDefaultForCount(n, videoFormat = null) {
    if (videoFormat && typeof getDefaultVideoLayout !== 'undefined') {
      return getDefaultVideoLayout(videoFormat);
    }
    const opts = this.getForCount(n).filter(o => o.count !== -1);
    return opts.length ? opts[0].id : '1p-full';
  },
  preview(id, pw = 48, ph = 68, videoFormat = null) {
    // Distinct fill colors per panel index for visual clarity
    const fills = ['#5b8def','#e8625c','#50c878','#f5a623','#9b59b6','#1abc9c','#e74c8b','#34495e','#f39c12'];
    const pageBg = '#f0f0f0';
    const border = '#333';
    const bw = 1.4;

    if (id === 'masonry') return `<svg width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}"><rect width="${pw}" height="${ph}" fill="${pageBg}" rx="2"/><rect x="2" y="2" width="${pw-4}" height="${ph*0.35}" rx="1" fill="${fills[0]}" stroke="${border}" stroke-width="${bw}"/><rect x="2" y="${2+ph*0.38}" width="${pw-4}" height="${ph*0.28}" rx="1" fill="${fills[1]}" stroke="${border}" stroke-width="${bw}"/><rect x="2" y="${2+ph*0.7}" width="${pw-4}" height="${ph*0.25}" rx="1" fill="${fills[2]}" stroke="${border}" stroke-width="${bw}"/></svg>`;
    if (id === 'free-canvas') return `<svg width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}"><rect width="${pw}" height="${ph}" fill="${pageBg}" rx="2"/><rect x="5" y="5" width="22" height="22" rx="1" fill="${fills[0]}" stroke="${border}" stroke-width="${bw}" transform="rotate(-8 16 16)"/><rect x="18" y="30" width="24" height="28" rx="1" fill="${fills[1]}" stroke="${border}" stroke-width="${bw}" transform="rotate(5 30 44)"/></svg>`;

    // Check for video layout first
    let tmpl = null;
    let canvasW = CW, canvasH = CH;
    if (typeof VideoLayouts !== 'undefined' && VideoLayouts[id]) {
      tmpl = VideoLayouts[id];
      const fmt = VIDEO_FORMATS[tmpl.format];
      if (fmt) { canvasW = fmt.width; canvasH = fmt.height; }
    } else {
      tmpl = Layouts[id];
    }
    if (!tmpl) return '';
    const sx = (pw - 4) / canvasW, sy = (ph - 4) / canvasH;

    if (tmpl.skewed) {
      // For skewed/diagonal layouts, render clip-path polygons
      const defs = tmpl.panels.map((p, i) => `<clipPath id="prev-${id}-${i}"><polygon points="${(p.clipPath||'').replace('polygon(','').replace(')','').split(',').map(pt => {
        const [xv, yv] = pt.trim().split(/\s+/);
        const xn = parseFloat(xv) / 100 * pw;
        const yn = parseFloat(yv) / 100 * ph;
        return `${xn},${yn}`;
      }).join(' ')}"/></clipPath>`).join('');
      const panels = tmpl.panels.map((p, i) => `<rect width="${pw}" height="${ph}" fill="${fills[i % fills.length]}" clip-path="url(#prev-${id}-${i})"/><rect width="${pw}" height="${ph}" fill="none" stroke="${border}" stroke-width="${bw}" clip-path="url(#prev-${id}-${i})"/>`).join('');
      return `<svg width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}"><defs>${defs}</defs><rect width="${pw}" height="${ph}" fill="${pageBg}" rx="2"/>${panels}</svg>`;
    }

    const rects = tmpl.panels.map((p, i) => {
      const x = 2 + p.x * sx, y = 2 + p.y * sy, w = Math.max(4, p.w * sx - 1), h = Math.max(4, p.h * sy - 1);
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${fills[i % fills.length]}" stroke="${border}" stroke-width="${bw}"/>`;
    }).join('');
    return `<svg width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}"><rect width="${pw}" height="${ph}" fill="${pageBg}" rx="2"/>${rects}</svg>`;
  }
};

// Generate thumbnail for custom layouts (canvas-based, returns dataURL)
function generateLayoutThumbnail(panels, w = 56, h = 80) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const scaleX = w / CW;
  const scaleY = h / CH;
  const colors = ['#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#cbd5e1', '#e2e8f0', '#f1f5f9'];

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Draw each panel
  panels.forEach((p, i) => {
    const px = p.x * scaleX + 1;
    const py = p.y * scaleY + 1;
    const pw = p.w * scaleX - 2;
    const ph = p.h * scaleY - 2;
    
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(px, py, pw, ph);
    
    // Panel number
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(8, Math.round(Math.min(pw, ph) * 0.4))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.order || i + 1), px + pw / 2, py + ph / 2);
  });

  // Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  return canvas.toDataURL('image/png');
}

/* ═══════════════════════════════════════
   GUTTER DETECTION — finds shared edges
   between adjacent panels for resize handles
   ═══════════════════════════════════════ */
function findGutters(panels, scaleX, scaleY) {
  const gutters = [];
  const TOL = 20; // tolerance for matching edges
  for (let i = 0; i < panels.length; i++) {
    for (let j = i + 1; j < panels.length; j++) {
      const a = panels[i], b = panels[j];
      const ax = a.x * scaleX, ay = a.y * scaleY, aw = a.w * scaleX, ah = a.h * scaleY;
      const bx = b.x * scaleX, by = b.y * scaleY, bw = b.w * scaleX, bh = b.h * scaleY;

      // Horizontal gutter: a.bottom ≈ b.top (panels stacked vertically)
      const aBot = ay + ah, bTop = by;
      if (Math.abs(aBot - bTop) < TOL) {
        const overlapLeft = Math.max(ax, bx);
        const overlapRight = Math.min(ax + aw, bx + bw);
        if (overlapRight - overlapLeft > 30) {
          gutters.push({ dir: 'h', x: overlapLeft, y: (aBot + bTop) / 2, len: overlapRight - overlapLeft, panelA: i, panelB: j });
        }
      }
      // Vertical gutter: a.right ≈ b.left (panels side by side)
      const aRight = ax + aw, bLeft = bx;
      if (Math.abs(aRight - bLeft) < TOL) {
        const overlapTop = Math.max(ay, by);
        const overlapBot = Math.min(ay + ah, by + bh);
        if (overlapBot - overlapTop > 30) {
          gutters.push({ dir: 'v', x: (aRight + bLeft) / 2, y: overlapTop, len: overlapBot - overlapTop, panelA: i, panelB: j });
        }
      }
    }
  }
  return gutters;
}

/* ═══════════════════════════════════════════════════════════════
   VIDEO EXPORTER - Moved to video-exporter.js
   ═══════════════════════════════════════════════════════════════ */

// VideoExporter logic has been moved to a dedicated file (video-exporter.js)
// to support advanced features like AudioContext mixing, ducking, and better performance.

/* ═══════════════════════════════════════════════════════════════
   EXPORT PRESETS — Multi-format export without recreating project
   Story (9:16), YouTube (16:9), Feed (1:1), Custom
   ═══════════════════════════════════════════════════════════════ */

const EXPORT_MODE_PRESETS = {
  story: {
    id: 'story', label: 'Story / Reels', icon: '📱',
    description: 'Instagram, TikTok, Reels',
    aspectRatio: '9:16', width: 1080, height: 1920,
    narrativePosition: 'overlay-center',
    narrativeFontScale: 0.8,
    imageFit: 'cover'
  },
  youtube: {
    id: 'youtube', label: 'YouTube', icon: '▶️',
    description: 'Horizontal padrão',
    aspectRatio: '16:9', width: 1920, height: 1080,
    narrativePosition: 'bottom',
    narrativeFontScale: 1.0,
    imageFit: 'cover'
  },
  feed: {
    id: 'feed', label: 'Feed / Post', icon: '⬛',
    description: 'Quadrado Instagram',
    aspectRatio: '1:1', width: 1080, height: 1080,
    narrativePosition: 'overlay-bottom',
    narrativeFontScale: 0.9,
    imageFit: 'cover'
  },
  portrait: {
    id: 'portrait', label: 'Retrato (4:3)', icon: '📺',
    description: 'Apresentações',
    aspectRatio: '4:3', width: 1440, height: 1080,
    narrativePosition: 'bottom',
    narrativeFontScale: 0.95,
    imageFit: 'cover'
  }
};

const ExportPresets = {
  getAll() { return Object.values(EXPORT_MODE_PRESETS); },
  get(id) { return EXPORT_MODE_PRESETS[id] || null; },

  // Map preset id to VIDEO_FORMATS id
  toVideoFormat(presetId) {
    const map = { story: 'vertical', youtube: 'widescreen', feed: 'square', portrait: 'portrait' };
    return map[presetId] || 'vertical';
  },

  // Get recommended narrative settings for a given export mode
  getNarrativeAdaptation(presetId) {
    const preset = this.get(presetId);
    if (!preset) return { fontScale: 1, position: 'bottom', maxCharsRecommended: 200 };
    const charMap = { story: 120, youtube: 200, feed: 150, portrait: 180 };
    return {
      fontScale: preset.narrativeFontScale,
      position: preset.narrativePosition,
      maxCharsRecommended: charMap[presetId] || 200
    };
  },

  // Check page text warnings for a given export mode
  getWarnings(project, presetId) {
    const adaptation = this.getNarrativeAdaptation(presetId);
    const warnings = [];
    const lang = project.activeLanguage || 'pt-BR';
    (project.pages || []).forEach((page, i) => {
      const text = typeof page.narrative === 'string' ? page.narrative : (page.narrative?.[lang] || '');
      if (text.length > adaptation.maxCharsRecommended) {
        warnings.push({
          pageIndex: i,
          type: 'text-overflow',
          message: `Página ${i + 1}: Texto com ${text.length} chars (recomendado ≤${adaptation.maxCharsRecommended} para ${presetId})`
        });
      }
    });
    return warnings;
  },

  // Save export preset to project
  saveToProject(project, presetId) {
    if (!project.exportPresets) project.exportPresets = {};
    const preset = this.get(presetId);
    if (!preset) return;
    project.exportPresets[presetId] = {
      aspectRatio: preset.aspectRatio,
      resolution: { width: preset.width, height: preset.height },
      narrativePosition: preset.narrativePosition,
      narrativeFontScale: preset.narrativeFontScale,
      lastUsed: Date.now()
    };
  }
};

window.EXPORT_MODE_PRESETS = EXPORT_MODE_PRESETS;
window.ExportPresets = ExportPresets;

/* ═══════════════════════════════════════════════════════════════
   BULK TEXT IMPORTER — Paste full script → create N pages
   Paragraph-based splitting with smart overflow handling
   ═══════════════════════════════════════════════════════════════ */

const BulkTextImporter = {
  MAX_CHARS_PER_PAGE: 250,
  PAGE_BREAK_MARKER: '---PAGE---',
  PAGE_BREAK_RE: /---PAGE---|━{3,}/g,

  // Parse text into segments (each becomes a page)
  parse(text, options = {}) {
    const maxChars = options.maxChars || this.MAX_CHARS_PER_PAGE;
    const mode = options.mode || 'hybrid'; // 'paragraph' | 'sentence' | 'marker' | 'hybrid'

    let rawSegments;
    if (mode === 'marker') {
      rawSegments = text.split(this.PAGE_BREAK_RE).map(s => s.trim()).filter(Boolean);
    } else if (mode === 'paragraph') {
      rawSegments = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    } else if (mode === 'sentence') {
      rawSegments = this._splitBySentence(text, maxChars);
    } else {
      // Hybrid: paragraphs first, then auto-split long ones
      const paragraphs = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
      // Also handle explicit markers (---PAGE--- or ━━━ line)
      const withMarkers = [];
      paragraphs.forEach(p => {
        if (this.PAGE_BREAK_RE.test(p)) {
          this.PAGE_BREAK_RE.lastIndex = 0;
          p.split(this.PAGE_BREAK_RE).map(s => s.trim()).filter(Boolean).forEach(s => withMarkers.push(s));
        } else {
          withMarkers.push(p);
        }
      });
      rawSegments = [];
      withMarkers.forEach(seg => {
        if (seg.length > maxChars) {
          rawSegments.push(...this._smartSplit(seg, maxChars));
        } else {
          rawSegments.push(seg);
        }
      });
    }

    return rawSegments.map((text, i) => ({
      index: i,
      text: text.trim(),
      charCount: text.trim().length,
      wordCount: text.trim().split(/\s+/).length
    }));
  },

  // Split long text at punctuation boundaries
  _smartSplit(text, maxChars) {
    const result = [];
    let remaining = text;
    while (remaining.length > maxChars) {
      let cutPoint = maxChars;
      // Look backwards from maxChars for punctuation
      const punctuationPoints = ['. ', '! ', '? ', ', ', '; ', '— ', '... '];
      let bestCut = -1;
      for (const punct of punctuationPoints) {
        const idx = remaining.lastIndexOf(punct, maxChars);
        if (idx > maxChars * 0.4 && idx > bestCut) {
          bestCut = idx + punct.length;
        }
      }
      if (bestCut > 0) cutPoint = bestCut;
      else {
        // Fall back to word boundary
        const spaceIdx = remaining.lastIndexOf(' ', maxChars);
        if (spaceIdx > maxChars * 0.4) cutPoint = spaceIdx + 1;
      }
      result.push(remaining.substring(0, cutPoint).trim());
      remaining = remaining.substring(cutPoint).trim();
    }
    if (remaining) result.push(remaining);
    return result;
  },

  _splitBySentence(text, maxChars) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const result = [];
    let current = '';
    sentences.forEach(s => {
      s = s.trim();
      if ((current + ' ' + s).trim().length > maxChars && current) {
        result.push(current.trim());
        current = s;
      } else {
        current = (current + ' ' + s).trim();
      }
    });
    if (current) result.push(current.trim());
    return result;
  },

  // Parse bilingual text in "PT: ... \n EN: ..." format
  parseBilingual(text) {
    const blocks = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    const results = [];
    for (const block of blocks) {
      // Try to detect PT:/EN: pattern (case-insensitive)
      const ptMatch = block.match(/(?:^|\n)\s*(?:PT(?:-BR)?)\s*[:：]\s*(.+?)(?=\n\s*(?:EN)\s*[:：]|$)/is);
      const enMatch = block.match(/(?:^|\n)\s*(?:EN)\s*[:：]\s*(.+?)(?=\n\s*(?:PT(?:-BR)?)\s*[:：]|$)/is);
      if (ptMatch || enMatch) {
        results.push({
          index: results.length,
          pt: (ptMatch ? ptMatch[1] : '').trim(),
          en: (enMatch ? enMatch[1] : '').trim(),
          charCount: ((ptMatch ? ptMatch[1] : '').trim().length + (enMatch ? enMatch[1] : '').trim().length),
          wordCount: ((ptMatch ? ptMatch[1] : '') + ' ' + (enMatch ? enMatch[1] : '')).trim().split(/\s+/).length
        });
      } else {
        // No PT:/EN: tags — treat as single-language block
        results.push({
          index: results.length,
          pt: block,
          en: '',
          charCount: block.length,
          wordCount: block.split(/\s+/).length
        });
      }
    }
    return results;
  },

  // Detect if text contains bilingual markers
  detectBilingual(text) {
    const ptEnPattern = /(?:^|\n)\s*PT(?:-BR)?\s*[:：]/im;
    const enPattern = /(?:^|\n)\s*EN\s*[:：]/im;
    return ptEnPattern.test(text) && enPattern.test(text);
  },

  // Create pages from parsed segments
  createPages(project, segments, options = {}) {
    const duration = options.duration || 4;
    const layout = options.layout || getDefaultVideoLayout(project.videoFormat || 'vertical');
    const lang = project.activeLanguage || 'pt-BR';
    const showTextBelow = options.showTextBelow !== false;
    const bilingual = options.bilingual || false;

    const newPages = segments.map((seg, i) => {
      const page = createPage(project.pages.length + i, project.videoFormat);
      page.layoutId = layout;
      page.duration = duration;
      page.showTextBelow = showTextBelow;
      if (bilingual && (seg.pt !== undefined || seg.en !== undefined)) {
        page.narrative = { 'pt-BR': seg.pt || '', 'en': seg.en || '' };
      } else {
        page.narrative = MultiLang.set(MultiLang.empty(), lang, seg.text);
      }
      page.kenBurns = 'zoom-in';
      page.transition = 'fade';
      return page;
    });

    if (bilingual) {
      project.narrativeDisplay = 'dual';
      project.narrativeOrder = 'pt-first';
    }

    project.pages.push(...newPages);
    return newPages.length;
  }
};

window.BulkTextImporter = BulkTextImporter;

/* ═══════════════════════════════════════════════════════════════
   BULK AUDIO IMPORTER — Upload long audio → detect silence → create pages
   Uses Web Audio API for amplitude analysis
   ═══════════════════════════════════════════════════════════════ */

const BulkAudioImporter = {
  _buffer: null,
  _waveformData: null,
  _segments: [],
  _sourceFile: null,

  // Load audio file and decode
  async loadAudio(dataUrl) {
    try {
      const ctx = AudioManager.getContext();
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      this._buffer = await ctx.decodeAudioData(arrayBuffer);
      this._sourceFile = dataUrl;
      this._waveformData = this._generateWaveform(this._buffer, 800);
      return {
        duration: this._buffer.duration,
        sampleRate: this._buffer.sampleRate,
        channels: this._buffer.numberOfChannels
      };
    } catch (e) {
      console.error('BulkAudioImporter: Failed to load audio', e);
      return null;
    }
  },

  _generateWaveform(buffer, numBars) {
    const channelData = buffer.getChannelData(0);
    const samplesPerBar = Math.floor(channelData.length / numBars);
    const peaks = [];
    for (let i = 0; i < numBars; i++) {
      let max = 0;
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, channelData.length);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }
      peaks.push(max);
    }
    return peaks;
  },

  getWaveformData() { return this._waveformData; },
  getBuffer() { return this._buffer; },
  getSegments() { return this._segments; },
  getSourceFile() { return this._sourceFile; },

  // Detect silence-based boundaries
  detectSilence(options = {}) {
    if (!this._buffer) return [];
    const threshold = options.threshold || 0.03; // amplitude threshold (~-30dB)
    const minSilenceMs = options.minSilenceMs || 500;
    const channelData = this._buffer.getChannelData(0);
    const sampleRate = this._buffer.sampleRate;
    const minSilenceSamples = Math.floor((minSilenceMs / 1000) * sampleRate);
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms analysis windows

    const boundaries = [];
    let silenceStart = -1;
    let inSilence = false;

    for (let i = 0; i < channelData.length; i += windowSize) {
      let rms = 0;
      const end = Math.min(i + windowSize, channelData.length);
      for (let j = i; j < end; j++) {
        rms += channelData[j] * channelData[j];
      }
      rms = Math.sqrt(rms / (end - i));

      if (rms < threshold) {
        if (!inSilence) { silenceStart = i; inSilence = true; }
      } else {
        if (inSilence && (i - silenceStart) >= minSilenceSamples) {
          // Mark midpoint of silence as boundary
          const midpoint = (silenceStart + i) / 2 / sampleRate;
          if (midpoint > 0.5 && midpoint < this._buffer.duration - 0.5) {
            boundaries.push(midpoint);
          }
        }
        inSilence = false;
      }
    }

    this._updateSegments(boundaries);
    return this._segments;
  },

  // Split by fixed duration
  splitByDuration(durationSec) {
    if (!this._buffer) return [];
    const boundaries = [];
    const total = this._buffer.duration;
    for (let t = durationSec; t < total - 0.5; t += durationSec) {
      boundaries.push(t);
    }
    this._updateSegments(boundaries);
    return this._segments;
  },

  // Manual boundaries
  addBoundary(timeSec) {
    if (!this._buffer) return;
    const boundaries = this._segments.slice(1).map(s => s.start);
    boundaries.push(timeSec);
    boundaries.sort((a, b) => a - b);
    this._updateSegments(boundaries);
  },

  removeBoundary(index) {
    if (!this._buffer || index < 1) return;
    const boundaries = this._segments.slice(1).map(s => s.start);
    boundaries.splice(index - 1, 1);
    this._updateSegments(boundaries);
  },

  _updateSegments(boundaries) {
    if (!this._buffer) return;
    const total = this._buffer.duration;
    const points = [0, ...boundaries.filter(b => b > 0 && b < total).sort((a, b) => a - b), total];
    this._segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      this._segments.push({
        index: i,
        start: points[i],
        end: points[i + 1],
        duration: points[i + 1] - points[i]
      });
    }
  },

  // Create pages from detected segments
  createPages(project, options = {}) {
    if (!this._buffer || !this._segments.length) return 0;
    const layout = options.layout || getDefaultVideoLayout(project.videoFormat || 'vertical');
    const lang = project.activeLanguage || 'pt-BR';

    const newPages = this._segments.map((seg, i) => {
      const page = createPage(project.pages.length + i, project.videoFormat);
      page.layoutId = layout;
      page.duration = Math.round(seg.duration * 10) / 10; // 1 decimal
      page.showTextBelow = false;
      page.kenBurns = 'zoom-in';
      page.transition = 'fade';
      page._audioSegment = { start: seg.start, end: seg.end, sourceFile: this._sourceFile };
      return page;
    });

    project.pages.push(...newPages);

    // Assign audio segments as narration for each page
    const audioCtx = AudioManager.getContext();
    this._segments.forEach((seg, i) => {
      const pageIndex = project.pages.length - newPages.length + i;
      const page = project.pages[pageIndex];
      if (!page) return;
      // Store segment info for later audio extraction
      if (!project.videoAudio.pages) project.videoAudio.pages = [];
      project.videoAudio.pages.push({
        pageId: page.id,
        audioSegment: { start: seg.start, end: seg.end, duration: seg.duration },
        narration: {
          [lang]: { file: this._sourceFile, volume: 0.9, duration: seg.duration, segmentStart: seg.start, segmentEnd: seg.end }
        }
      });
    });

    return newPages.length;
  },

  // Format seconds to mm:ss
  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  clear() {
    this._buffer = null;
    this._waveformData = null;
    this._segments = [];
    this._sourceFile = null;
  }
};

window.BulkAudioImporter = BulkAudioImporter;

/* ═══════════════════════════════════════════════════════════════
   ASSET EXPORTER — Professional ZIP export with organized assets
   Supports: images, narration audio, background music, metadata,
   README, project file (.hq)
   ═══════════════════════════════════════════════════════════════ */

const AssetExporter = {
  _progress: 0,
  _total: 0,
  _onProgress: null,

  // ── Helpers ──

  _dataUrlToBase64(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    const idx = dataUrl.indexOf(',');
    return idx >= 0 ? dataUrl.substring(idx + 1) : null;
  },

  _guessExtension(dataUrl) {
    if (!dataUrl) return 'bin';
    if (dataUrl.startsWith('data:image/png')) return 'png';
    if (dataUrl.startsWith('data:image/webp')) return 'webp';
    if (dataUrl.startsWith('data:image/gif')) return 'gif';
    if (dataUrl.startsWith('data:image/svg')) return 'svg';
    if (dataUrl.startsWith('data:image/')) return 'jpg';
    if (dataUrl.startsWith('data:audio/wav')) return 'wav';
    if (dataUrl.startsWith('data:audio/ogg')) return 'ogg';
    if (dataUrl.startsWith('data:audio/mp4')) return 'm4a';
    if (dataUrl.startsWith('data:audio/')) return 'mp3';
    return 'bin';
  },

  _pad3(n) { return String(n).padStart(3, '0'); },

  _fmtDuration(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m}min ${s}s`;
  },

  _tick() {
    this._progress++;
    if (this._onProgress) {
      const pct = Math.min(100, Math.round((this._progress / this._total) * 100));
      this._onProgress(pct, this._progress, this._total);
    }
  },

  // ── Collect all exportable assets ──

  collectAssets(project) {
    const result = { images: [], narrations: [], backgroundMusic: null, pageCount: 0 };
    if (!project || !project.pages) return result;

    result.pageCount = project.pages.length;

    // Images
    project.pages.forEach((page, i) => {
      if (!page.images) return;
      page.images.forEach((img, slotIdx) => {
        if (!img || !img.src) return;
        const ext = this._guessExtension(img.src);
        const base64 = this._dataUrlToBase64(img.src);
        if (!base64) return;
        const pageNum = this._pad3(i + 1);
        const slotSuffix = page.images.filter(im => im && im.src).length > 1 ? `_slot${slotIdx + 1}` : '';
        result.images.push({
          filename: `page_${pageNum}${slotSuffix}.${ext}`,
          base64,
          pageIndex: i,
          slotIndex: slotIdx
        });
      });
    });

    // Narration audio (multi-language)
    if (project.videoAudio && project.videoAudio.pages) {
      project.videoAudio.pages.forEach((pa) => {
        const pageIdx = project.pages.findIndex(p => p.id === pa.pageId);
        if (pageIdx < 0) return;
        const pageNum = this._pad3(pageIdx + 1);

        if (pa.narration) {
          ['pt-BR', 'en'].forEach(lang => {
            const narr = pa.narration[lang];
            if (!narr || !narr.file) return;
            const ext = this._guessExtension(narr.file);
            const base64 = this._dataUrlToBase64(narr.file);
            if (!base64) return;
            const langSuffix = lang.toLowerCase().replace('-', '_');
            result.narrations.push({
              filename: `narration_page_${pageNum}_${langSuffix}.${ext}`,
              base64,
              pageIndex: pageIdx,
              lang,
              duration: narr.duration || 0
            });
          });

          // Old format fallback
          if (pa.narration.file && typeof pa.narration.file === 'string') {
            const ext = this._guessExtension(pa.narration.file);
            const base64 = this._dataUrlToBase64(pa.narration.file);
            if (base64) {
              result.narrations.push({
                filename: `narration_page_${pageNum}.${ext}`,
                base64,
                pageIndex: pageIdx,
                lang: 'pt-BR',
                duration: pa.narration.duration || 0
              });
            }
          }
        }
      });
    }

    // Background music
    if (project.videoAudio && project.videoAudio.background && project.videoAudio.background.file) {
      const src = project.videoAudio.background.file;
      const ext = this._guessExtension(src);
      const base64 = this._dataUrlToBase64(src);
      if (base64) {
        result.backgroundMusic = { filename: `background_music.${ext}`, base64 };
      }
    }

    return result;
  },

  // ── Generate README.txt ──

  generateReadme(project) {
    const pages = project.pages || [];
    const totalDuration = pages.reduce((s, p) => s + (p.duration || 4), 0);
    const vf = VIDEO_FORMATS[project.videoFormat || 'vertical'] || VIDEO_FORMATS.vertical;
    const name = project.metadata?.name || 'Projeto HQ Movie';
    const created = project.metadata?.createdAt ? new Date(project.metadata.createdAt).toISOString().split('T')[0] : 'N/A';

    return `HQ MOVIE PROJECT EXPORT
=======================

Project: ${name}
Created: ${created}
Pages: ${pages.length}
Duration: ${this._fmtDuration(totalDuration)}
Format: ${vf.name} (${vf.width}x${vf.height})
Aspect Ratio: ${vf.ratio || project.videoFormat}

FOLDER STRUCTURE:
-----------------
01_Assets/Images/    → Page images (numbered sequence)
01_Assets/Audio/     → Narration and background music
01_Assets/Metadata/  → Project structure JSON
project.hq           → Original project file (reimportable)
README.txt           → This file

IMAGE NAMING:
-------------
${pages.map((_, i) => `page_${this._pad3(i + 1)}.jpg = Page ${i + 1}`).join('\n')}

IMPORT TO OTHER SOFTWARE:
-------------------------
- Premiere Pro: Import images as sequence (File > Import)
- After Effects: Import as composition (drag folder)
- DaVinci Resolve: Add to media pool, create timeline
- PowerPoint: Insert pictures in order
- Canva: Upload images and arrange

AUDIO SYNC:
-----------
Each narration file corresponds to its page number.
narration_page_001_pt_br.mp3 → Sync with page_001.jpg
Duration per page is listed in project_structure.json.

Generated by HQ Movie (https://hqmovie.app)
`;
  },

  // ── Generate project_structure.json ──

  generateMetadata(project) {
    const pages = project.pages || [];
    const vf = VIDEO_FORMATS[project.videoFormat || 'vertical'] || VIDEO_FORMATS.vertical;
    const totalDuration = pages.reduce((s, p) => s + (p.duration || 4), 0);

    return {
      projectName: project.metadata?.name || 'Projeto',
      version: '1.0',
      created: project.metadata?.createdAt ? new Date(project.metadata.createdAt).toISOString() : null,
      exported: new Date().toISOString(),
      format: {
        id: project.videoFormat || 'vertical',
        name: vf.name,
        width: vf.width,
        height: vf.height,
        aspectRatio: vf.ratio || project.videoFormat
      },
      totalDuration,
      totalPages: pages.length,
      languages: project.activeLanguage ? [project.activeLanguage] : ['pt-BR'],
      pages: pages.map((page, i) => {
        const imgCount = page.images ? page.images.filter(im => im && im.src).length : 0;
        const pageNum = this._pad3(i + 1);
        return {
          index: i + 1,
          imageFile: imgCount > 0 ? `page_${pageNum}.jpg` : null,
          imageCount: imgCount,
          narrativeText: (page.narrative ? (typeof page.narrative === 'string' ? page.narrative : MultiLang.get(page.narrative, 'pt-BR')) : null) || page.narrativeText || page.textBelow || null,
          duration: page.duration || 4,
          kenBurns: page.kenBurns || 'static',
          transition: page.transition || 'fade',
          layout: page.layoutId || 'unknown',
          showTextBelow: !!page.showTextBelow
        };
      })
    };
  },

  // ── Main export function ──

  async exportAssets(project, options = {}) {
    const {
      includeImages = true,
      includeNarration = true,
      includeBackgroundMusic = true,
      includeProjectFile = true,
      includeReadme = true,
      includeMetadata = true,
      onProgress = null
    } = options;

    this._progress = 0;
    this._onProgress = onProgress;

    const assets = this.collectAssets(project);

    // Calculate total steps
    this._total = 1; // ZIP finalization
    if (includeImages) this._total += assets.images.length;
    if (includeNarration) this._total += assets.narrations.length;
    if (includeBackgroundMusic && assets.backgroundMusic) this._total += 1;
    if (includeProjectFile) this._total += 1;
    if (includeReadme) this._total += 1;
    if (includeMetadata) this._total += 1;

    const zip = new JSZip();

    // Images
    if (includeImages) {
      const imagesFolder = zip.folder('01_Assets/Images');
      for (const img of assets.images) {
        imagesFolder.file(img.filename, img.base64, { base64: true });
        this._tick();
      }
    }

    // Audio folder
    const audioFolder = zip.folder('01_Assets/Audio');

    // Narration
    if (includeNarration) {
      for (const narr of assets.narrations) {
        audioFolder.file(narr.filename, narr.base64, { base64: true });
        this._tick();
      }
    }

    // Background music
    if (includeBackgroundMusic && assets.backgroundMusic) {
      audioFolder.file(assets.backgroundMusic.filename, assets.backgroundMusic.base64, { base64: true });
      this._tick();
    }

    // Metadata
    if (includeMetadata) {
      const metadataFolder = zip.folder('01_Assets/Metadata');
      metadataFolder.file('project_structure.json', JSON.stringify(this.generateMetadata(project), null, 2));
      this._tick();
    }

    // README
    if (includeReadme) {
      zip.file('README.txt', this.generateReadme(project));
      this._tick();
    }

    // Project file (.hq compatible)
    if (includeProjectFile) {
      const projectData = JSON.parse(JSON.stringify(project));
      zip.file('project.hq', JSON.stringify(projectData));
      this._tick();
    }

    // Generate ZIP blob
    const blob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (meta) => {
        if (onProgress) {
          const pct = Math.round(80 + (meta.percent / 100) * 20);
          onProgress(pct, this._progress, this._total);
        }
      }
    );

    if (onProgress) onProgress(100, this._total, this._total);

    return blob;
  },

  // ── Summary for UI ──

  getSummary(project) {
    const assets = this.collectAssets(project);
    let estimatedSizeKB = 0;
    assets.images.forEach(img => { estimatedSizeKB += Math.round(img.base64.length * 0.75 / 1024); });
    assets.narrations.forEach(narr => { estimatedSizeKB += Math.round(narr.base64.length * 0.75 / 1024); });
    if (assets.backgroundMusic) estimatedSizeKB += Math.round(assets.backgroundMusic.base64.length * 0.75 / 1024);

    const sizeMB = (estimatedSizeKB / 1024).toFixed(1);
    return {
      imageCount: assets.images.length,
      narrationCount: assets.narrations.length,
      hasBackgroundMusic: !!assets.backgroundMusic,
      pageCount: assets.pageCount,
      estimatedSizeMB: sizeMB
    };
  }
};

window.AssetExporter = AssetExporter;

// Export to window for global access
window.Store = Store;
// window.VideoExporter is assigned in video-exporter.js
window.APP_FONTS = APP_FONTS;
window.FontUtils = FontUtils;
window.KenBurns = KenBurns;
window.db = db;
