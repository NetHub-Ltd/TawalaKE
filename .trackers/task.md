# Task Tracker

**Branch:** `chore/frontend-turbopack-builds`  
**Base:** `main`

## Authorized
Enable Turbopack for faster local/CI frontend builds.

## Completed
- [x] `dev`: `next dev --turbopack`
- [x] `build`: `next build --turbopack`
- [x] `build:webpack`: webpack fallback if Turbopack misbehaves

## Note
Next 16 may default to Turbopack; flags make the choice explicit and documented.
