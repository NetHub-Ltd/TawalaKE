# Rollback

| Ref | Note |
|-----|------|
| dev before this branch | `499e40f` |

```bash
git checkout dev && git pull
git revert <sha>
git push origin dev
```

Frontend + backend stock routes/schemas only; no migrations.
