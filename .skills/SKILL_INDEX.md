# Full-Stack Product + Engineering Skill Set

A deliberately small, high-signal skill set for an AI engineering agent.
Load only the skills relevant to the current task.

## Product & UX
- **design-principles.md** — foundational product/interface judgment
- **product-thinking.md** — user outcomes, task definition, product scope
- **ux-evaluation.md** — evidence-based usability evaluation (ongoing / iterative)
- **interaction-design.md** — behavior, affordances, feedback, recovery, states

## Visual & Systems
- **visual-design.md** — hierarchy, typography, spacing, color, composition, concrete thresholds
- **design-systems.md** — reusable patterns, tokens, consistency, controlled variation
- **forms-data-dense-ui.md** — forms, tables, dashboards, operational interfaces
- **responsive-design.md** — viewport and input adaptation
- **accessibility.md** — accessibility as a core interaction requirement, WCAG 2.2 AA targets

## Review & Quality
- **design-review.md** — final cross-disciplinary design critique (run once, at the end)

## Backend & Data
- **backend-api-design.md** — FastAPI route design, Pydantic, async, DI, error handling, OpenAPI
- **database-design.md** — Postgres schema design, indexing, migrations, query optimization
- **security-privacy.md** — authN/authZ, input validation, secrets, TLS, rate limiting, PII
- **testing-qa.md** — pytest, integration tests with TestClient, fixtures, mocking, coverage

## Selection rule
Use the smallest set that can answer the task. Do not invoke every skill by default.

## Priority
User outcome → usability → security → accessibility → clarity/hierarchy → consistency → performance → visual polish.

## Overlap notes
- **ux-evaluation** is iterative; run it while building. **design-review** is a final checkpoint.
- **interaction-design** subsumes states and feedback; load it for any behavioral work.
- **security-privacy** applies to every backend task by default; do not treat it as optional.
