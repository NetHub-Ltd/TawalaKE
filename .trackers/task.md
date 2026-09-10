# Combine auto-tag into build workflow
- [x] Remove auto_tag.yml (GITHUB_TOKEN tag push cannot trigger other workflows)
- [x] build_and_push.yml: prepare job bumps v0.0.* and tags; same run builds/pushes with version tags
