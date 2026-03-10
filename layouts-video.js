/* ═══════════════════════════════════════════════════════════════
   HQ MOVIE — Video Layouts System
   Vertical (9:16), Widescreen (16:9), Square (1:1)
   ═══════════════════════════════════════════════════════════════ */

const VIDEO_FORMATS = {
  vertical: { 
    id: 'vertical',
    get name() { return typeof t !== 'undefined' ? t('formats.vertical') : 'Vertical (9:16)'; },
    get description() { return typeof t !== 'undefined' ? t('formats.verticalDescription') : 'Stories, Reels, TikTok'; },
    width: 1080, 
    height: 1920,
    ratio: 9/16,
    icon: 'smartphone'
  },
  widescreen: { 
    id: 'widescreen',
    get name() { return typeof t !== 'undefined' ? t('formats.widescreen') : 'Widescreen (16:9)'; },
    get description() { return typeof t !== 'undefined' ? t('formats.widescreenDescription') : 'YouTube, TV'; },
    width: 1920, 
    height: 1080,
    ratio: 16/9,
    icon: 'video'
  },
  square: { 
    id: 'square',
    get name() { return typeof t !== 'undefined' ? t('formats.square') : 'Square (1:1)'; },
    get description() { return typeof t !== 'undefined' ? t('formats.squareDescription') : 'Instagram Feed'; },
    width: 1080, 
    height: 1080,
    ratio: 1,
    icon: 'square'
  },
  portrait: { 
    id: 'portrait',
    get name() { return typeof t !== 'undefined' ? t('formats.portrait') : 'Portrait (4:3)'; },
    get description() { return typeof t !== 'undefined' ? t('formats.portraitDescription') : 'Presentations, Classic Monitor'; },
    width: 1440, 
    height: 1080,
    ratio: 4/3,
    icon: 'video'
  }
};

// Replace icon strings with actual SVG when Icons is available
if (typeof Icons !== 'undefined') {
  VIDEO_FORMATS.vertical.icon = Icons.smartphone;
  VIDEO_FORMATS.widescreen.icon = Icons.video;
  VIDEO_FORMATS.square.icon = Icons.square;
  VIDEO_FORMATS.portrait.icon = Icons.video;
}

// Gutter for video layouts
const VG = 16;

// ═══════════════════════════════════════════════════════════════
// VERTICAL LAYOUTS (9:16 - 1080x1920)
// ═══════════════════════════════════════════════════════════════
const VW = 1080;
const VH = 1920;

const VideoLayoutsVertical = {
  // V1: Splash Vertical (1 panel full)
  'v1-splash': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.v1Splash') : 'Vertical Splash'; },
    count: 1, 
    format: 'vertical',
    panels: [{ x: 0, y: 0, w: VW, h: VH, order: 1 }] 
  },
  
  // V2: Diálogo Dual (2 panels stacked)
  'v2-dual': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.v2Dual') : 'Dual Dialogue'; },
    count: 2, 
    format: 'vertical',
    panels: [
      { x: 0, y: 0, w: VW, h: (VH - VG) / 2, order: 1 },
      { x: 0, y: (VH + VG) / 2, w: VW, h: (VH - VG) / 2, order: 2 }
    ] 
  },
  
  // V3: Sequência Tripla (3 panels stacked)
  'v3-triple': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.v3Triple') : 'Triple Sequence'; },
    count: 3, 
    format: 'vertical',
    panels: [
      { x: 0, y: 0, w: VW, h: (VH - 2*VG) / 3, order: 1 },
      { x: 0, y: (VH - 2*VG) / 3 + VG, w: VW, h: (VH - 2*VG) / 3, order: 2 },
      { x: 0, y: 2 * ((VH - 2*VG) / 3 + VG), w: VW, h: (VH - 2*VG) / 3, order: 3 }
    ] 
  },
  
  // V4: Grid 2x2 (4 panels)
  'v4-grid': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.v4Grid') : 'Grid 2x2'; },
    count: 4, 
    format: 'vertical',
    panels: [
      { x: 0, y: 0, w: (VW - VG) / 2, h: (VH - VG) / 2, order: 1 },
      { x: (VW + VG) / 2, y: 0, w: (VW - VG) / 2, h: (VH - VG) / 2, order: 2 },
      { x: 0, y: (VH + VG) / 2, w: (VW - VG) / 2, h: (VH - VG) / 2, order: 3 },
      { x: (VW + VG) / 2, y: (VH + VG) / 2, w: (VW - VG) / 2, h: (VH - VG) / 2, order: 4 }
    ] 
  }
};

// ═══════════════════════════════════════════════════════════════
// WIDESCREEN LAYOUTS (16:9 - 1920x1080)
// ═══════════════════════════════════════════════════════════════
const WW = 1920;
const WH = 1080;

const VideoLayoutsWidescreen = {
  // W1: Cinematic Full (1 panel)
  'w1-cinematic': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.w1Cinematic') : 'Cinematic Full'; },
    count: 1, 
    format: 'widescreen',
    panels: [{ x: 0, y: 0, w: WW, h: WH, order: 1 }] 
  },
  
  // W2: Split Screen (2 panels side by side)
  'w2-split': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.w2Split') : 'Split Screen'; },
    count: 2, 
    format: 'widescreen',
    panels: [
      { x: 0, y: 0, w: (WW - VG) / 2, h: WH, order: 1 },
      { x: (WW + VG) / 2, y: 0, w: (WW - VG) / 2, h: WH, order: 2 }
    ] 
  },
  
  // W3: Hero + Context (1 large left + 2 stacked right)
  'w3-hero': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.w3Hero') : 'Hero + Context'; },
    count: 3, 
    format: 'widescreen',
    panels: [
      { x: 0, y: 0, w: Math.floor(WW * 2/3) - VG/2, h: WH, order: 1 },
      { x: Math.floor(WW * 2/3) + VG/2, y: 0, w: Math.floor(WW * 1/3) - VG/2, h: (WH - VG) / 2, order: 2 },
      { x: Math.floor(WW * 2/3) + VG/2, y: (WH + VG) / 2, w: Math.floor(WW * 1/3) - VG/2, h: (WH - VG) / 2, order: 3 }
    ] 
  },
  
  // W4: Grid 3x2 (6 panels)
  'w4-grid': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.w4Grid') : 'Grid 3x2'; },
    count: 6, 
    format: 'widescreen',
    panels: [
      { x: 0, y: 0, w: (WW - 2*VG) / 3, h: (WH - VG) / 2, order: 1 },
      { x: (WW - 2*VG) / 3 + VG, y: 0, w: (WW - 2*VG) / 3, h: (WH - VG) / 2, order: 2 },
      { x: 2 * ((WW - 2*VG) / 3 + VG), y: 0, w: (WW - 2*VG) / 3, h: (WH - VG) / 2, order: 3 },
      { x: 0, y: (WH + VG) / 2, w: (WW - 2*VG) / 3, h: (WH - VG) / 2, order: 4 },
      { x: (WW - 2*VG) / 3 + VG, y: (WH + VG) / 2, w: (WW - 2*VG) / 3, h: (WH - VG) / 2, order: 5 },
      { x: 2 * ((WW - 2*VG) / 3 + VG), y: (WH + VG) / 2, w: (WW - 2*VG) / 3, h: (WH - VG) / 2, order: 6 }
    ] 
  }
};

// ═══════════════════════════════════════════════════════════════
// SQUARE LAYOUTS (1:1 - 1080x1080)
// ═══════════════════════════════════════════════════════════════
const SW = 1080;
const SH = 1080;

const VideoLayoutsSquare = {
  // S1: Full Square (1 panel)
  's1-full': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.s1Full') : 'Full Square'; },
    count: 1, 
    format: 'square',
    panels: [{ x: 0, y: 0, w: SW, h: SH, order: 1 }] 
  },
  
  // S2: Grid 2x2 (4 panels)
  's2-grid': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.s2Grid') : 'Grid 2x2'; },
    count: 4, 
    format: 'square',
    panels: [
      { x: 0, y: 0, w: (SW - VG) / 2, h: (SH - VG) / 2, order: 1 },
      { x: (SW + VG) / 2, y: 0, w: (SW - VG) / 2, h: (SH - VG) / 2, order: 2 },
      { x: 0, y: (SH + VG) / 2, w: (SW - VG) / 2, h: (SH - VG) / 2, order: 3 },
      { x: (SW + VG) / 2, y: (SH + VG) / 2, w: (SW - VG) / 2, h: (SH - VG) / 2, order: 4 }
    ] 
  },
  
  // S3: L-Shape (3 panels)
  's3-lshape': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.s3Lshape') : 'L-Shape'; },
    count: 3, 
    format: 'square',
    panels: [
      { x: 0, y: 0, w: (SW - VG) / 2, h: SH, order: 1 },
      { x: (SW + VG) / 2, y: 0, w: (SW - VG) / 2, h: (SH - VG) / 2, order: 2 },
      { x: (SW + VG) / 2, y: (SH + VG) / 2, w: (SW - VG) / 2, h: (SH - VG) / 2, order: 3 }
    ] 
  },
  
  // S4: Horizontal Split (2 panels stacked)
  's4-hsplit': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.s4Hsplit') : 'Horizontal Split'; },
    count: 2, 
    format: 'square',
    panels: [
      { x: 0, y: 0, w: SW, h: (SH - VG) / 2, order: 1 },
      { x: 0, y: (SH + VG) / 2, w: SW, h: (SH - VG) / 2, order: 2 }
    ] 
  }
};

// ═══════════════════════════════════════════════════════════════
// PORTRAIT LAYOUTS (4:3 - 1440x1080)
// ═══════════════════════════════════════════════════════════════
const PW = 1440;
const PH = 1080;

const VideoLayoutsPortrait = {
  // P1: Full Portrait (1 panel)
  'p1-full': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.p1Full') : 'Full Portrait'; },
    count: 1, 
    format: 'portrait',
    panels: [{ x: 0, y: 0, w: PW, h: PH, order: 1 }] 
  },
  
  // P2: Split Vertical (2 panels side by side)
  'p2-split': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.p2Split') : 'Vertical Split'; },
    count: 2, 
    format: 'portrait',
    panels: [
      { x: 0, y: 0, w: (PW - VG) / 2, h: PH, order: 1 },
      { x: (PW + VG) / 2, y: 0, w: (PW - VG) / 2, h: PH, order: 2 }
    ] 
  },
  
  // P3: Trio Stack (3 panels stacked)
  'p3-trio': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.p3Trio') : 'Trio Stack'; },
    count: 3, 
    format: 'portrait',
    panels: [
      { x: 0, y: 0, w: PW, h: (PH - 2*VG) / 3, order: 1 },
      { x: 0, y: (PH - 2*VG) / 3 + VG, w: PW, h: (PH - 2*VG) / 3, order: 2 },
      { x: 0, y: 2 * ((PH - 2*VG) / 3 + VG), w: PW, h: (PH - 2*VG) / 3, order: 3 }
    ] 
  },
  
  // P4: Grid 2x2 (4 panels)
  'p4-grid': { 
    get name() { return typeof t !== 'undefined' ? t('layouts.p4Grid') : 'Grid 2x2'; },
    count: 4, 
    format: 'portrait',
    panels: [
      { x: 0, y: 0, w: (PW - VG) / 2, h: (PH - VG) / 2, order: 1 },
      { x: (PW + VG) / 2, y: 0, w: (PW - VG) / 2, h: (PH - VG) / 2, order: 2 },
      { x: 0, y: (PH + VG) / 2, w: (PW - VG) / 2, h: (PH - VG) / 2, order: 3 },
      { x: (PW + VG) / 2, y: (PH + VG) / 2, w: (PW - VG) / 2, h: (PH - VG) / 2, order: 4 }
    ] 
  }
};

// Combined video layouts
const VideoLayouts = {
  ...VideoLayoutsVertical,
  ...VideoLayoutsWidescreen,
  ...VideoLayoutsSquare,
  ...VideoLayoutsPortrait
};

// Helper to get layouts by format
function getVideoLayoutsByFormat(formatId) {
  return Object.entries(VideoLayouts)
    .filter(([_, layout]) => layout.format === formatId)
    .reduce((acc, [key, layout]) => ({ ...acc, [key]: layout }), {});
}

// Helper to get default layout for format
function getDefaultVideoLayout(formatId) {
  switch(formatId) {
    case 'vertical': return 'v1-splash';
    case 'widescreen': return 'w1-cinematic';
    case 'square': return 's1-full';
    case 'portrait': return 'p1-full';
    default: return 'v1-splash';
  }
}

// ═══════════════════════════════════════════════════════════════
// SLIDESHOW LAYOUT (Universal - works with all formats)
// ═══════════════════════════════════════════════════════════════
const VideoLayoutsSlideshow = {
  'slideshow': {
    get name() { return typeof t !== 'undefined' ? t('layouts.slideshow') : 'Slideshow'; },
    get description() { return typeof t !== 'undefined' ? t('layouts.slideshowDescription') : 'Multiple images in temporal sequence'; },
    count: 0, // Dynamic - determined by slides array
    format: 'all', // Works with any video format
    panels: [], // Not used - slides are temporal, not spatial
    icon: '🎬'
  }
};

// Export to window for global access
window.VIDEO_FORMATS = VIDEO_FORMATS;
window.VideoLayouts = { ...VideoLayouts, ...VideoLayoutsSlideshow };
window.getVideoLayoutsByFormat = getVideoLayoutsByFormat;
window.getDefaultVideoLayout = getDefaultVideoLayout;
