---
description: Extract design patterns from existing CSS/JS to create .interface-design/system.md
---

# UI Extract Workflow

Extract design patterns from existing code to create a design system file.

## Steps

1. **Scan CSS Variables**
   - Read `:root` block in `styles-v3.css`
   - Extract color palette, spacing scale, radius scale
   - Identify naming conventions

2. **Analyze Spacing**
   - Find all spacing values (padding, margin, gap)
   - Count occurrences of each value
   - Determine base unit and scale

3. **Analyze Depth Strategy**
   - Count `box-shadow` occurrences
   - Count `border` occurrences
   - Determine primary approach (borders vs shadows)

4. **Analyze Border Radius**
   - Find all radius values
   - Build scale from most common values
   - Note outliers

5. **Analyze Typography**
   - Find font families
   - Find font size scale
   - Find font weight usage

6. **Extract Component Patterns**
   - Button: height, padding, radius
   - Card: border, padding, shadow
   - Input: height, padding, border

7. **Generate system.md**
   ```markdown
   # Design System - HQ Movie

   ## Direction
   **Personality:** [inferred from analysis]
   **Foundation:** [warm/cool from color analysis]
   **Depth:** [borders-only/shadows from analysis]

   ## Tokens
   ### Spacing
   Base: 4px
   Scale: 4, 8, 12, 16, 20, 24, 32

   ### Colors
   [extracted from CSS variables]

   ### Radius
   Scale: 4px, 6px, 8px, 10px, 12px

   ## Patterns
   [extracted component patterns]

   ## Decisions
   | Decision | Rationale | Date |
   |----------|-----------|------|
   ```

8. **Save to `.interface-design/system.md`**
   - Create directory if needed
   - Write extracted system
   - Confirm with user before saving
