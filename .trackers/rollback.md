# Rollback

| Ref | Note |
|-----|------|
| Prior known-good on `dev` | `f25f1b3` (Merge #148) |

```bash
git checkout dev && git pull
git revert <sha-of-report-commit>
git push origin dev
```

Docs-only change (`.reports/` + tracker updates). No runtime impact.
