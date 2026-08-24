# CI Workflow Template

**File:** `.github/workflows/test_backend.yml`
**Status:** NOT PUSHED (PAT lacks workflow scope)
**Action:** Add via GitHub web interface or use a PAT with `workflow` scope

```yaml
name: Test Backend

on:
  push:
    branches: [main, master]
    paths:
      - "backend/**"
      - ".github/workflows/test_backend.yml"
  pull_request:
    paths:
      - "backend/**"
      - ".github/workflows/test_backend.yml"

jobs:
  test-backend:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        working-directory: backend
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov fakeredis

      - name: Run tests with coverage
        working-directory: backend
        run: |
          pytest testing/ -v --cov=app --cov-report=term-missing --cov-fail-under=60

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: backend/htmlcov/
```
