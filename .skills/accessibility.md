# Skill: Accessibility

## Purpose
Make accessibility part of the product and interaction model from the beginning.

## Core principles
Evaluate whether the interface is:
- Perceivable
- Operable
- Understandable
- Robust

## Review checklist
- Semantic HTML and correct heading hierarchy (h1 → h2 → h3, no skips).
- Accessible names/labels for all interactive elements.
- Keyboard operation: all functionality available without a pointer.
- Logical and visible focus indicators (minimum 2 px, 3:1 contrast against adjacent colors).
- Error identification and recovery: inline errors, clear messaging, preserved input.
- Contrast and non-color cues: never rely on color alone for state.
- Responsive/reflow behavior: content readable at 320 px equivalent width, 200% zoom.
- Dialog/menu focus management: trap focus, return focus on close, ESC to dismiss.
- Appropriate status announcements for screen readers (ARIA live regions or polite announcements).
- Motion: respect `prefers-reduced-motion`; do not auto-play distracting animations.
- Touch/pointer interaction: targets ≥ 24×24 px (WCAG 2.5.5 AA), ideally 44×44 px.

## Rules
- Never rely on color alone to communicate state.
- Do not force keyboard users into a different conceptual workflow without reason.
- Do not replace semantic controls with custom widgets unnecessarily.
- Accessibility requirements should influence component design and architecture.

## WCAG 2.2 AA conformance targets
- **Text contrast**: 4.5:1 minimum.
- **Large text / UI components**: 3:1 minimum.
- **Focus appearance**: at least 2 px thick, 3:1 contrast against unfocused state.
- **Target size**: 24×24 px minimum (2.5.5 AA); 44×44 px is the enhanced target (2.5.5 AAA).

## Source basis
WCAG 2.2 organizes accessibility around perceivable, operable, understandable, and robust principles and provides testable success criteria.
