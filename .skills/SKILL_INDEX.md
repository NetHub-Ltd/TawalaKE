# Skill Index — Three Domains

A deliberately small, high-signal skill set for AI agents on this repository.
Load only the skills relevant to the current task.

## Domains

| Domain | Path | Use for |
|--------|------|---------|
| **Product design & planning** | `product/product-design.md` | Outcomes, scope, prioritization, evaluation, final product critique |
| **Backend design practices** | `backend/backend-design.md` | API, data, security, testing, operability |
| **UI** | `ui/ui-design.md` | Screens, interaction, look and feel, forms/tables, a11y, optional agent UX |

## Shared gate

- **`DESIGN_SKILL_PROTOCOL.md`** — mandatory reasoning sequence before design or UI implementation recommendations. Load with product and/or UI work.

## Selection rule

Use the **smallest set** that can answer the task.

| Task type | Load |
|-----------|------|
| Scope, prioritization, “should we build this?” | Product (+ protocol) |
| Screen, component, layout, visual, form, table | UI (+ protocol); Product if outcome is unclear |
| API, schema, migration, auth, tests | Backend (security section always applies) |
| Full feature (API + UI) | Product (brief) → Backend + UI as needed |
| Design review before ship | Product + UI (+ protocol) |

## Priority

User outcome → usability → security → accessibility → clarity/hierarchy → consistency → performance → visual polish.

## Overlap notes

- Product decides **what/why**; UI decides **how it appears and behaves on screen**; Backend decides **how the system supports that safely**.
- UI skill includes operational dense UI and an optional autonomy section—do not invent a fourth domain for agent chrome.
- Backend skill treats **security as non-optional** whenever backend work is in scope.
