# Skill: Product Design & Planning

## Purpose

Ensure product and interface decisions serve a coherent user outcome—not merely attractive screens or opportunistic features.

**Load when:** defining scope, prioritizing work, shaping flows, evaluating whether a change is worth building, or running product/UX critique before implementation.

## Procedure

1. Identify target user and context.
2. State the desired outcome plainly.
3. Identify the job / task.
4. Identify constraints: time, knowledge, device, trust, permissions, data, environment.
5. Separate essential workflow steps from optional capabilities.
6. Identify the highest-value action.
7. Remove or defer features that do not support the outcome.
8. Define success (observable).
9. Design around the user’s mental model and task sequence.
10. Check whether implementation can support the intended outcome.

## Core questions

- Who is this for?
- What are they trying to accomplish?
- What must they know before acting?
- What decision are they making?
- What could make them hesitate?
- What could cause an expensive mistake?
- What does “done” look like?
- What should we explicitly not build now?

## Foundational judgment

- **Purpose:** every feature/screen has a clear reason and user outcome.
- **Agency:** people understand what they can do, what is happening, and how to recover.
- **Familiarity:** use established mental models unless departure provides meaningful value.
- **Simplicity:** remove unnecessary complexity without hiding important information.
- **Trust:** be transparent about consequential actions, permissions, data, and failures.
- **Craft:** details matter when they improve comprehension, confidence, usability, or quality.
- **Delight:** only when it reinforces purpose rather than competing with it.

## Decision test

1. What user problem does this solve?
2. What does it clarify?
3. What cognitive or operational cost does it introduce?
4. Does it match established patterns in the product?
5. What happens on error?
6. Is it accessible and secure enough for the context?
7. Is the value worth the complexity?

## Evaluation (while building)

- Is the current state obvious?
- Does the interface speak the user’s language?
- Can the user undo or recover?
- Are avoidable errors prevented?
- Is important information visible without forcing memory?
- Is there unnecessary cognitive or interaction cost?

For each finding: severity / location / issue / user impact / principle / recommendation / confidence. Prefer evidence from the actual product.

## Final design review (once, before ship)

Cross-check product intent, UI skill baseline, and backend constraints. Output: strengths to preserve / findings by severity / recommendations / what not to change / verification checklist / confidence.

Do not redesign for the sake of redesigning. A strong review may conclude only targeted changes are needed.

## Severity

- **P0:** task blocked, serious trust/destructive failure, serious accessibility or security issue
- **P1:** major usability or product-flow problem
- **P2:** meaningful friction or inconsistency
- **P3:** polish

## Anti-patterns

- Building features without a stated job outcome
- Optimizing for demo paths only
- Expanding scope mid-task without updating authorization
- Treating visual novelty as product progress
