# Rollback

| Ref | Note |
|-----|------|
| dev tip before branch | `98b41f0` |

```bash
git checkout dev && git pull
git revert <sha>
git push origin dev
```

No migrations.
