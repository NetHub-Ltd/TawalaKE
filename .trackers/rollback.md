# Rollback

| Ref | Note |
|-----|------|
| dev before this branch | `98182c8` |

```bash
git checkout dev && git pull
git revert <sha>
git push origin dev
```

No migrations. Restores optional `rbac_enforce` skip path if reverted.
