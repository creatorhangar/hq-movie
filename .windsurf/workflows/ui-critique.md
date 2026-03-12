---
description: Critique UI for craft quality, then rebuild what defaulted
---

# UI Critique Workflow

Review UI work like a design lead reviews a junior's work — not "does this work?" but "would I put my name on this?"

## The Gap

There's a distance between **correct** and **crafted**:
- Correct: layout holds, grid aligns, colors don't clash
- Crafted: someone cared about every decision down to the last pixel

## Steps

### 1. See the Composition

- **Rhythm**: Dense areas give way to open content? Or monotone everywhere?
- **Proportions**: Do specific sizes declare what matters?
- **Focal Point**: One thing dominates through size, position, or contrast?

### 2. See the Craft

- **Spacing Grid**: Every value multiple of 4px, no exceptions
- **Typography**: Hierarchy from weight + tracking, not just size
- **Surfaces**: Can you perceive structure through color alone (no borders)?
- **Interactive States**: Every button/link responds to hover/press

### 3. See the Content

- Does the screen tell one coherent story?
- Could a real person be looking at exactly this data?
- Content incoherence breaks illusion faster than visual flaws

### 4. See the Structure

Open CSS and find the lies:
- Negative margins undoing parent padding
- `calc()` values as workarounds
- Absolute positioning to escape layout flow

Each is a shortcut where a clean solution exists.

### 5. Fix

Ask: "If they said this lacks craft, what would they point to?"

That thing you just thought of — fix it. Then ask again.

## Using Playwright MCP for Verification

// turbo
```bash
# Visual check with browser
mcp0_browser_navigate({ url: "http://localhost:8000" })
mcp0_browser_snapshot()

# Check different viewport sizes
mcp0_browser_resize({ width: 375, height: 667 })
mcp0_browser_snapshot()

mcp0_browser_resize({ width: 1920, height: 1080 })
mcp0_browser_snapshot()
```
