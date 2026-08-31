# Rollback

Prior `dev` tip before this work: `18d4f52`

```bash
git checkout dev && git pull
# revert merge commit of the PR, or:
git revert <merge-sha>
```

No migrations. API removals: restore previous routes if external clients still need them.
