# Skill: Design Systems

## Purpose
Create consistency without forcing every screen into identical shapes.

## Principles
- Reuse meaningful behavior, not merely markup.
- Establish semantic tokens for recurring spacing, type, color, radius, elevation, and motion.
- Similar components should behave similarly.
- Variants should represent real product differences.
- Prefer composable primitives over universal components with excessive flags.
- Shared components should encode accessibility and states by default.

## Review
- Is the pattern genuinely repeated?
- Does abstraction reduce cognitive/maintenance cost?
- Does the component own the right behavior?
- Are variants meaningful?
- Is the API understandable?
- Does the system preserve product context?

## Anti-patterns
Premature abstraction, universal components with huge configuration surfaces, copy-paste divergence, meaningless tokens, and a design system more complex than the product.

The design system should make good product decisions easier, not eliminate all variation.
