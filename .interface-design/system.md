# Design System — HQ Movie

Comic/Video Editor for Social Media Content Creation

## Direction

**Personality:** Professional Studio + Creative Playfulness
**Foundation:** Professional Gray (neutral base with strategic teal brand accents)
**Depth:** Hybrid — Borders-primary with contextual shadows for elevation

## Intent

**Who is this human?**
Content creators making comic-style videos for social media. They're creative, time-pressed, working on mobile or desktop. They want professional results without complexity.

**What must they accomplish?**
Create panel-based video content quickly. Add images, text, effects. Export in social media formats (9:16, 1:1, 16:9).

**What should this feel like?**
Like a professional editing suite that doesn't intimidate. Dark mode studio aesthetic with playful touches. Dense enough for power users, clear enough for beginners.

## Tokens

### Spacing
Base: 4px
Scale: 4, 8, 12, 16, 20, 24, 32

```css
--sp1: 4px;
--sp2: 8px;
--sp3: 12px;
--sp4: 16px;
--sp5: 20px;
--sp6: 24px;
--sp8: 32px;
```

### Colors

#### Surfaces (L1 → L5 elevation)
```css
--bg: #111214;        /* L1: Base */
--bg-deep: #0a0b0c;   /* L0: Deepest */
--surface: #18191c;   /* L2: Cards */
--surface2: #1e2024;  /* L3: Elevated */
--surface3: #2a2d32;  /* L4: Interactive */
--hover: #32363d;     /* L5: Hover */
--active: #3d424a;    /* L6: Active */
```

#### Borders (opacity-based)
```css
--border: rgba(255, 255, 255, 0.08);   /* Default */
--border2: rgba(255, 255, 255, 0.04);  /* Subtle */
--border3: rgba(255, 255, 255, 0.15);  /* Prominent */
```

#### Text
```css
--text: #f1f5f9;   /* Primary */
--text2: #a1a1aa;  /* Secondary */
--text3: #71717a;  /* Muted */
--text4: #52525b;  /* Faint */
```

#### Accent (Gray - Primary Interactive)
```css
--accent: #6b7280;
--accent-hover: #9ca3af;
--accent-deep: #4b5563;
--accent-glow: rgba(107, 114, 128, 0.15);
```

#### Brand Teal (Strategic Accent)
```css
--brand-teal: #14b8a6;
--brand-teal-hover: #2dd4bf;
--brand-teal-muted: #0d9488;
--brand-teal-glow: rgba(20, 184, 166, 0.15);
--brand-teal-light: #5eead4;
```

**Usage:**
- Default buttons/borders: Gray (--accent)
- Hover on key actions: Teal (--brand-teal)
- Focus states: Teal (accessibility)
- Selected/active states: Teal glow
- Primary CTAs: Teal background

#### Semantic
```css
--success: #22c55e;
--error: #ef4444;
--warning: #f59e0b;
```

#### Base Colors
```css
--white: #ffffff;
--black: #000000;
```

### Radius
Scale: 4px, 6px, 8px (professional, angular design)

```css
--r-sm: 4px;   /* Inputs, small buttons */
--r-md: 4px;   /* Buttons (reduced) */
--r-lg: 6px;   /* Cards, panels (reduced) */
--r-xl: 6px;   /* Large elements (reduced) */
--r-4xl: 8px;  /* Timeline pages (reduced) */
--r-6xl: 8px;  /* Modals (reduced) */
--r-full: 50%; /* Circles */
```

### Typography
```css
--font: 'Inter', -apple-system, system-ui, sans-serif;
--font-comic: 'Bangers', cursive;  /* For comic style text */
--font-story: 'Lora', Georgia, serif;  /* For story mode */
```

### Typography Scale
```css
--text-2xs: 10px;  /* Meta info, badges */
--text-xs: 11px;   /* Labels, hints */
--text-sm: 12px;   /* Secondary text */
--text-base: 14px; /* Body text */
--text-md: 15px;   /* Emphasized body */
--text-lg: 16px;   /* Subheadings */
--text-xl: 18px;   /* Section titles */
--text-2xl: 20px;  /* Panel headers */
--text-3xl: 24px;  /* Page titles */
```

### Touch Targets
```css
--touch-min: 44px;  /* Minimum touch target */
--touch-lg: 48px;
--touch-xl: 56px;
```

### Shadows (used sparingly for elevation)
```css
--sh-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
--sh-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--sh-lg: 0 12px 40px rgba(0, 0, 0, 0.5);
--sh-accent: 0 0 12px rgba(107, 114, 128, 0.2);
```

### Transitions
```css
--ease: cubic-bezier(0.4, 0, 0.2, 1);
```

## Patterns

### Button - Primary
- Min-height: 44px (touch target)
- Padding: 10px 16px
- Radius: var(--r-md) (6px)
- Background: var(--surface2)
- Border: 1px solid var(--border)
- Font: 13px, 500 weight
- States: hover → border-color change + translateY(-2px)

### Button - Icon
- Size: 36px × 36px or 44px × 44px
- Radius: var(--r-md)
- Background: transparent or var(--surface)
- Border: 1px solid var(--border)

### Card
- Background: var(--surface)
- Border: 1px solid var(--border)
- Radius: var(--r-lg) (8px)
- Padding: var(--sp4) (16px)
- Hover: border-color accent, translateY(-3px), shadow

### Input
- Height: 44px minimum
- Padding: 10px 12px
- Radius: var(--r-md)
- Background: var(--surface)
- Border: 1px solid var(--border)
- Focus: border-color var(--border-focus)

### Panel/Sidebar
- Background: var(--surface)
- Border: 1px solid var(--border)
- Padding: var(--sp4)

### Modal
- Background: var(--surface)
- Border: 1px solid var(--border3)
- Radius: var(--r-6xl) (12px)
- Shadow: var(--sh-lg)
- Backdrop: rgba(0, 0, 0, 0.7)

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Borders-primary depth | Dark UI needs borders for definition, shadows less visible | 2026-03-12 |
| 4px spacing base | Standard for dense tool UI, allows fine control | 2026-03-12 |
| Gray-first palette | Professional foundation, teal as brand accent | 2026-03-12 |
| 44px touch targets | Mobile-first, accessibility compliance | 2026-03-12 |
| Tight radius (4-8px) | Angular, technical, production-ready aesthetic | 2026-03-12 |
| Teal strategic use | Brand identity via hover/active/CTA only | 2026-03-12 |
| Inter font | Readable at small sizes, professional | 2026-03-12 |
| Opacity-based borders | Consistent on any surface color | 2026-03-12 |
| Typography scale | 10-24px scale with semantic names for consistency | 2026-03-12 |
| Token-based radius | All border-radius use CSS vars (--r-sm to --r-6xl) | 2026-03-12 |

## Notes

- Glass effects (backdrop-filter) used for overlays
- Gray (#6b7280) is primary interactive color for professional restraint
- Teal (#14b8a6) used strategically: hover, focus, selected, primary CTAs
- Comic/story fonts only for actual content, not UI
- All interactive elements must have visible focus states (teal for accessibility)
- Balanced professional design: not sterile, maintains brand personality
