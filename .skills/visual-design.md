# Skill: Visual Design

## Purpose
Use visual design to improve comprehension, hierarchy, confidence, and task execution.

## Review order
1. Layout/information hierarchy
2. Typography/readability
3. Spacing/grouping
4. Contrast
5. Alignment
6. Color semantics
7. Shape/density
8. Icons/imagery
9. Motion/polish

## Principles
- Visual weight should reflect importance.
- Related information should look related.
- Spacing should communicate relationships.
- Typography should distinguish roles without unnecessary variation.
- Color should reinforce meaning and never be the only state signal.
- Density should follow task requirements; dense expert interfaces can be excellent.
- Alignment should create predictable scanning paths.

## Concrete thresholds
- **Touch target**: minimum 44×44 px (Apple HIG) or 48×48 dp (Material); never below 24×24 px (WCAG 2.5.5 AA).
- **Contrast**: 4.5:1 for normal text, 3:1 for large text (18 pt+) and UI components (WCAG 2.2 AA).
- **Line length**: 45–75 characters per line for body text; max 90 ch.
- **Line height**: 1.5 for body text; 1.2–1.4 for headings.
- **Spacing base unit**: 4 px or 8 px; derive all spacing from this scale.
- **Max content width**: ~65–75 ch for readable prose; wider for data-dense dashboards.
- **Focus indicator**: at least 2 px outline or offset, with 3:1 contrast against adjacent colors.

## Rules
- Do not optimize isolated components while ignoring the composition and task flow.
- Avoid decorative hierarchy that conflicts with semantic hierarchy.
- Avoid excessive typography styles, arbitrary spacing, and effects that reduce clarity.
