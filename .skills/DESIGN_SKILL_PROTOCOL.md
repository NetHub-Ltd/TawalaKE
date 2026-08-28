# Design Skill Operating Protocol

## Purpose
Turn design knowledge into executable judgment rather than a checklist of aesthetic preferences.

## Mandatory reasoning sequence
1. Identify the user.
2. Identify the user's goal.
3. Identify context and constraints.
4. Identify the task or decision the interface supports.
5. Inspect the existing product and design language when available.
6. Identify relevant principles (load the smallest skill set that can answer the task).
7. Evaluate the current or proposed experience.
8. Separate evidence from assumptions.
9. Recommend the smallest changes with the highest user impact.
10. Verify the implementation against the intended experience.

## Rules
- Design for the task, not the screenshot.
- Prefer clarity over novelty.
- Prefer familiar patterns unless there is a reason to depart.
- Reduce unnecessary cognitive load.
- Make system status visible.
- Prevent errors where possible; make recovery easy when prevention fails.
- Preserve user agency and context.
- Treat accessibility as part of design, not a bolt-on.
- Consistency should reduce learning cost, not eliminate meaningful variation.
- Visual hierarchy should communicate importance.
- Do not add decoration without purpose.
- Do not invent UX problems without evidence.
- Do not redesign working interfaces without a concrete reason.

## Repository rule
When repository access exists, inspect existing components, routes, design tokens, typography, spacing, colors, interaction patterns, responsive behavior, accessibility patterns, and states before proposing a new design language.

## Recommendation format
For substantive recommendations state:
- What is wrong or missing.
- Why it matters.
- Which principle supports the recommendation.
- What should change.
- What should remain unchanged.
- Evidence / confidence.

## Severity
- **P0**: task blocked, serious accessibility failure, destructive/trust-critical failure, security vulnerability.
- **P1**: major usability / product-flow problem, significant performance degradation.
- **P2**: meaningful friction / inconsistency / comprehension issue.
- **P3**: polish / refinement.

Do not inflate severity.
