# Skill: Design Review

## Purpose
Perform a final high-signal review of a product surface, feature, flow, or implementation.

## When to use
Run once, at the end of a design or implementation cycle. For iterative evaluation while building, use **ux-evaluation.md**.

## Review sequence
1. **Product**: purpose, outcome, primary task.
2. **UX**: flow, friction, terminology, mental models, recovery.
3. **Interaction**: states, feedback, predictability, consequential actions.
4. **Visual**: hierarchy, density, typography, spacing, alignment, color semantics.
5. **System**: existing design language, reusable patterns, justified exceptions.
6. **Accessibility**: semantics, focus, labels, contrast, input methods, errors.
7. **Responsive**: task integrity across viewport sizes.
8. **Security**: input validation, auth checks, data exposure, secrets handling.
9. **Performance**: load times, query efficiency, bundle size, caching.

## Prioritization
- **P0** — blocked task, serious accessibility failure, destructive/trust-critical failure, security vulnerability.
- **P1** — major usability/product-flow problem, significant performance issue.
- **P2** — meaningful friction, inconsistency, or comprehension issue.
- **P3** — polish.

## Output
Executive assessment / strengths worth preserving / findings by severity / recommendations / what not to change / verification checklist / confidence and evidence.

Do not redesign for the sake of redesigning. A strong review may conclude that the current design is good and needs only targeted changes.
