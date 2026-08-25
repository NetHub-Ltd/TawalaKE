# Rollback State

**Deploy branch tip:** `e603129` on `deploy/onboarding-combined-test`  
**Previous tip before last fix:** `a4224da` (route order only)  
**main (untouched by this PR until user merges):** remains pre-onboarding-combined unless user merges #107

## Rollback of deploy/test branch
```bash
git checkout deploy/onboarding-combined-test
git reset --hard <prior-sha>   # e.g. a4224da or cf7f02c
git push --force-with-lease origin deploy/onboarding-combined-test
```
Only with user approval — force-push is exceptional.

## Runtime impact if branch is live on preview
- Revert image/tag to previous known-good preview build
- No irreversible migrations required by this workstream (enum value TRIAL was never successfully written)

## Data notes
- Pending staff (`active=false`) and trial subscriptions may exist from testing; clean up manually if needed
