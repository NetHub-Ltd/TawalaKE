# Rollback

| Ref | Note |
|-----|------|
| dev before this branch | `8d46875` |

```bash
git checkout dev && git pull
git revert <sha>   # or close PR without merge
git push origin dev
```

Backend only: `services/paywall.py`, product/staff/organization routes, `testing/test_paywall.py`, trackers. No migrations.
