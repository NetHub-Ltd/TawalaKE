# Repository State — Core V2

- Branch: `core/v2`
- Isolation: never PR `core/**` into `main`/`dev`
- Image: `tawala-core:<sha>` only
- Board: https://github.com/orgs/NetHub-Ltd/projects/5
- Contracts: `docs/architecture/CORE_CONTRACTS.md` (includes RLS §14)
- Last updated: 2026-09-20

## Gates

| Gate | Status |
|------|--------|
| M11 Core Gate Closure | Done (contracts doc) |
| M12 PostgreSQL Isolation + RLS | Implemented — await CI proof |
| M13–M23 | Open |

## Config
- `ENVIRONMENT` + `DATABASE_URL` via pydantic_settings BaseSettings
- test/production require DATABASE_URL
