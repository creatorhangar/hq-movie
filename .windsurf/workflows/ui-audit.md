---
description: Audit UI code against the design system for spacing, depth, color, and pattern violations
---

# UI Audit Workflow

Check existing code against `.interface-design/system.md` for consistency violations.

## Steps

1. **Load Design System**
   - Read `.interface-design/system.md`
   - If missing, run `/ui-extract` first to create it

2. **Scan CSS Files**
   - Check `styles-v3.css` for pattern violations
   - Verify all spacing values are on the 4px grid
   - Verify depth approach is consistent (borders-only OR shadows)

3. **Check Spacing Violations**
   - Find values not on grid: `17px` when base is `4px`
   - Flag random values like `14px`, `22px`, `13px`
   - Suggest nearest grid value

4. **Check Depth Violations**
   - If borders-only system → flag unnecessary shadows
   - If shadows system → flag inconsistent shadow values
   - Allow ring shadows (`0 0 0 1px`) for focus states

5. **Check Color Violations**
   - Verify all colors come from CSS variables
   - Flag hardcoded hex values not in palette
   - Allow semantic grays

6. **Check Pattern Drift**
   - Verify button heights match pattern
   - Verify card padding matches pattern
   - Verify border-radius follows scale

7. **Report Format**
   ```
   Audit Results: styles-v3.css

   ✓ Spacing: All values on 4px grid
   ✗ Depth: Found shadow on line 87 (system: borders-only)
   ✓ Colors: All from palette
   ✗ Radius: Found 7px on line 234 (scale: 4, 6, 8)

   Suggestions:
   - Line 87: Replace shadow with border
   - Line 234: Use --r-md (6px) or --r-lg (8px)
   ```

## Using Playwright MCP

// turbo
8. **Visual Verification**
   ```
   # Start local server if needed
   python serve-nocache.py &
   
   # Use Playwright MCP to verify
   mcp0_browser_navigate({ url: "http://localhost:8000" })
   mcp0_browser_snapshot()
   mcp0_browser_console_messages({ level: "error" })
   ```
