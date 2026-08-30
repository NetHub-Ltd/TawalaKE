# Rollback

| Ref | Note |
|-----|------|
| dev tip | `fb7723e` |

```bash
git checkout dev && git pull && git revert <sha>
```

No migrations. Restores previous middleware if reverted.
