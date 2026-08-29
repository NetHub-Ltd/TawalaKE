# Rollback

## Known-good references

| Ref | SHA / note |
|-----|------------|
| **dev tip before this chore** | `e153d7d` (or parent of this branch) |
| **main tip (post #114)** | `faa51fb` |

## If this skills PR must be undone

```bash
git checkout dev
git pull
git revert <merge-or-commit-sha>   # prefer revert once shared
git push origin dev
```

## Migration / data

- Tracker and `.skills/` / `AGENTS.md` documentation only. No schema or runtime code in this chore.
