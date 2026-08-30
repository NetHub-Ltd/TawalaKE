# Rollback

**Previous known-good:** `dev` @ `9247ae2`

```bash
git checkout dev && git pull
git revert <merge-commit-sha>
```

No migrations. Frontend + router mount only.
