/* ═══════════════════════════════════════════════════════════════
   HQ MOVIE — Video Layouts System
   Vertical (9:16), Widescreen (16:9), Square (1:1)
   ═══════════════════════════════════════════════════════════════ */

const VIDEO_FORMATS = {
  vertical: { 
    id: 'vertical',
    name: 'Vertical (9:16)', 
    description: 'Stories, Reels, TikTok',
    width: 1080, 
    height: 1920,
    ratio: 9/16,
    icon: 'smartphone' // Will be replaced with Icons.smartphone when available
  },
  widescreen: { 
    id: 'widescreen',
    name: 'Widescreen (16:9)', 
    description: 'YouTube, TV',
    width: 1920, 
    height: 1080,
    ratio: 16/9,
    icon: 'video' // Will be replaced with Icons.video when available
  },
  square: { 
    id: 'square',
    name: 'Quadrado (1:1)', 
    description: 'Instagram Feed',
    width: 1080, 
    height: 1080,
    ratio: 1,
    icon: 'square' // Will be replaced with Icons.square when available
  },
  portrait: { 
    id: 'portrait',
    name: 'Retrato (4:3)', 
    description: 'Apresentações, Monitor clássico',
    width: 1440, 
    height: 1080,
    ratio: 4/3,
    icon: 'video' // Will be replaced with Icons.video when available
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
    name: 'Splash Vertical', 
    count: 1, 
    format: 'vertical',
    panels: [{ x: 0, y: 0, w: VW, h: VH, order: 1 }] 
  },
  
  // V2: Diálogo Dual (2 panels stacked)
  'v2-dual': { 
    name: 'Diálogo Dual', 
    count: 2, 
    format: 'vertical',
    panels: [
      { x: 0, y: 0, w: VW, h: (VH - VG) / 2, order: 1 },
      { x: 0, y: (VH + VG) / 2, w: VW, h: (VH - VG) / 2, order: 2 }
    ] 
  },
  
  // V3: Sequência Tripla (3 panels stacked)
  'v3-triple': { 
    name: 'Sequência Tripla', 
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
    name: 'Grid 2x2', 
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
    name: 'Cinematic Full', 
    count: 1, 
    format: 'widescreen',
    panels: [{ x: 0, y: 0, w: WW, h: WH, order: 1 }] 
  },
  
  // W2: Split Screen (2 panels side by side)
  'w2-split': { 
    name: 'Split Screen', 
    count: 2, 
    format: 'widescreen',
    panels: [
      { x: 0, y: 0, w: (WW - VG) / 2, h: WH, order: 1 },
      { x: (WW + VG) / 2, y: 0, w: (WW - VG) / 2, h: WH, order: 2 }
    ] 
  },
  
  // W3: Hero + Context (1 large left + 2 stacked right)
  'w3-hero': { 
    name: 'Hero + Context', 
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
    name: 'Grid 3x2', 
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
    name: 'Full Square', 
    count: 1, 
    format: 'square',
    panels: [{ x: 0, y: 0, w: SW, h: SH, order: 1 }] 
  },
  
  // S2: Grid 2x2 (4 panels)
  's2-grid': { 
    name: 'Grid 2x2', 
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
    name: 'L-Shape', 
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
    name: 'Horizontal Split', 
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
    name: 'Full Portrait', 
    count: 1, 
    format: 'portrait',
    panels: [{ x: 0, y: 0, w: PW, h: PH, order: 1 }] 
  },
  
  // P2: Split Vertical (2 panels side by side)
  'p2-split': { 
    name: 'Split Vertical', 
    count: 2, 
    format: 'portrait',
    panels: [
      { x: 0, y: 0, w: (PW - VG) / 2, h: PH, order: 1 },
      { x: (PW + VG) / 2, y: 0, w: (PW - VG) / 2, h: PH, order: 2 }
    ] 
  },
  
  // P3: Trio Stack (3 panels stacked)
  'p3-trio': { 
    name: 'Trio Stack', 
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
    name: 'Grid 2x2', 
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

// Export to window for global access
window.VIDEO_FORMATS = VIDEO_FORMATS;
window.VideoLayouts = VideoLayouts;
window.getVideoLayoutsByFormat = getVideoLayoutsByFormat;
window.getDefaultVideoLayout = getDefaultVideoLayout;
