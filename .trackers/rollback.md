# Rollback

| Ref | Note |
|-----|------|
| dev before this branch | `cecc3cf` |

```bash
git checkout dev && git pull
git revert <sha>
git push origin dev
```

No migrations. Revert services/paywall.py, paywall_deps, middleware, api_router, route wiring, subscription invalidate, tests.
