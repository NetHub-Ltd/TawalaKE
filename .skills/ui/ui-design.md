# Skill: UI Design

## Purpose

Make interface decisions that help a real person finish a real job under real conditions—with clear status, recoverable mistakes, warranted trust, and a look and feel that supports comprehension rather than decoration.

**Load when:** any screen, flow, component, layout, visual system, form, table, empty/loading/error state, or interaction change.

## Definition of good (baseline)

**Good UI/UX** = the interface makes the correct next action obvious, the system state honest, mistakes recoverable, and the real job finishable under real conditions—with the least unnecessary effort and the most warranted trust.

**Good look and feel** = a coherent visual system where hierarchy, contrast, spacing, and feedback make the job obvious and the product feel trustworthy—without decoration that slows understanding or weakens status and control.

## Mandatory reasoning order (before pixels)

1. Who is the user and what job are they finishing?
2. What is the primary action on this surface?
3. What system status must always be visible?
4. What can go wrong, and how do they recover?
5. What is consequential (money, stock, permissions, PIN)?
6. What density and speed does the context demand (e.g. counter vs back office)?
7. Only then: hierarchy, type, color, space, motion, polish.

Do not start from moodboards or “modern UI.”

## UX principles (behavior)

| Principle | Requirement |
|-----------|-------------|
| Purpose | Every screen has a clear job and outcome |
| Status | State, progress, success, and failure are visible |
| Mental model | Labels and structure match how the user thinks about the work |
| Effort | No extra steps, fields, or choices that do not serve the job |
| Hierarchy | Primary action and critical data win attention first |
| Prevention & recovery | Hard to make serious mistakes; failures explain what / why / next |
| Consistency | Same things behave the same; differences are meaningful |
| Agency | User can confirm, undo, stop, or override consequential actions |
| Trust | Permissions, side effects, and uncertainty are honest |
| Accessibility | Keyboard, focus, contrast, non-color status—part of design |
| Context | Real device, light, noise, speed, roles, network |
| Evidence | Prefer task success and recovery over personal taste |

### Screen test (must pass)

Job → primary action → status → inputs → consequence → error path → recovery → role → effort → return use under fatigue.

### Interaction model

Intent → Action → System response → Result → Recovery / next action.

Consider states: idle, hover/focus, active, disabled, loading, success, error, empty, submitting, partial/async, permission-restricted.

- **Loading:** least disruptive indication; preserve context.
- **Empty:** explain why; offer the next useful action when appropriate.
- **Error:** user-relevant language; what failed; what to do; preserve work when possible.
- **Success:** confirm consequential completion without unnecessary interruption.

### Forms and dense data

- Required vs optional obvious; inline errors next to fields.
- Tables: scan-first; clear numeric hierarchy; sticky critical columns when needed.
- POS / speed paths: minimum chrome; adequate targets; confirm only when consequence is high.
- Roles: show only what the role may do; forbidden actions absent or clearly disabled with reason when useful.
- Consequential actions: preview or confirm when irreversible or financial; undo/correct path when possible.

## Look-and-feel principles (visual system)

| Principle | Requirement |
|-----------|-------------|
| Hierarchy before decoration | Size, weight, contrast, position encode importance |
| Clarity over cleverness | Readable labels beat ambiguous icons when stakes are high |
| Consistency with meaning | One visual language; variation only when meaning differs |
| Restraint | Color, shadow, motion must earn their place |
| Contrast & legibility | Readable in real light and sizes; status and money unambiguous |
| Spatial rhythm | Deliberate spacing scale; group related, separate unrelated |
| Honest feedback | Press, loading, success, error are visible and truthful |
| Interactive honesty | Interactive looks interactive; disabled/error are obvious |
| Tone fit | Competent and calm for operational tools; brand without undermining trust |
| Cohesion | Same product across modules—not one-off screens |
| Environment | Works on target devices and conditions |
| A11y as quality | Contrast, focus, scalable type are craft, not afterthought |

### Prefer / avoid

| Prefer | Avoid |
|--------|--------|
| Strong primary control; secondary quieter | Many equal-weight competing buttons |
| Few color roles (brand, success, warning, danger, neutral) | Rainbow of one-off accents |
| Clear type hierarchy; readable sizes | Tiny grey text; too many weights |
| Consistent spacing scale | Random gaps; forced emptiness that adds scrolling without clarity |
| High density when speed matters (POS) | Decorative noise on money / PIN / credit / stock |
| Short, meaningful motion; respect reduced-motion | Decorative loops; long delays |
| Status not color-only | Low-contrast “soft” status people cannot parse fast |

### Design systems

- Prefer tokens and shared components over one-off styles.
- Controlled variation: change when meaning differs, not for novelty.
- Extend the existing system before inventing a parallel one.

### Responsive

- Design for real viewports and input methods used in production.
- Touch targets adequate where touch is expected.
- Do not assume a designer’s large monitor is the primary context.

### Accessibility (minimum)

- Visible focus; keyboard operability for core flows.
- Contrast sufficient for text and critical status.
- Do not convey status by color alone.
- Target WCAG 2.2 AA for interactive product surfaces unless product explicitly defines another bar.

## When the system acts with autonomy (optional)

Apply only if the product includes agent-like behavior. Same baseline, plus:

- Show intent before consequential execution (plan visibility).
- Separate goal input from activity/progress (do not use chat alone as the workflow log).
- Binary confidence where useful (confident vs needs review); pause on low confidence for high stakes.
- Step-level pause / override / redirect.
- Errors routed by class (misunderstood request vs tool/data failure vs partial success).
- Expand autonomy only after reliability is earned (progressive delegation).

Do not force agent chrome onto ordinary forms and tables.

## Anti-patterns (refuse by default)

- Pretty layouts with unclear primary action
- Hidden status to look “minimal”
- Generic Retry with no explanation
- Low-contrast text or status
- Silent side effects or full autonomy on day one for high-stakes actions
- Designing only the happy path
- New visual language without inspecting existing tokens/components
- Accessibility postponed to “later”
- No-feedback buttons; unexplained disabled controls
- Destructive actions styled like routine actions

## Repository rule

When repository access exists, inspect existing frontend structure, tokens, components, spacing, typography, status patterns, and RBAC-aware UI **before** proposing a new look or interaction model. Prefer extend over reinvent.

## Recommendation format

For substantive UI changes state:

- What is wrong or missing
- Why it matters (job, trust, speed, recovery)
- Which principle supports it
- What to change / what to leave
- Severity: **P0** (blocked task, destructive/trust failure, serious a11y) · **P1** (major flow friction) · **P2** (meaningful inconsistency) · **P3** (polish)
- Confidence / evidence

Do not inflate severity.

## Source basis

Synthesized from established usability heuristics (visibility of status, match to mental model, consistency, error prevention/recovery), accessibility practice (contrast, focus, non-color status), operational product UI craft, and—where autonomy applies—agent UX patterns for transparency, control, status, and recovery. Principles are decision tools, not fashion rules.
