# Skill: Testing & QA

## Purpose
Ensure correctness, prevent regressions, and build confidence in changes.

## Unit tests
- Use **pytest** as the test runner.
- Test functions in isolation; mock external dependencies (DB, HTTP APIs, file system).
- One assertion concept per test; keep tests focused and fast.
- Name tests descriptively: `test_<action>_<condition>_<expected_result>`.
- Use `pytest.mark.parametrize` for testing multiple inputs against the same logic.

## Integration tests
- Use FastAPI `TestClient` for endpoint-level tests.
- Spin up a real test database (PostgreSQL) or use an in-memory equivalent only if behavior is identical.
- Apply migrations to the test DB before the test suite runs.
- Roll back transactions after each test to keep tests independent.

## Fixtures
- Use `pytest.fixture` for reusable setup: DB sessions, test users, authenticated clients.
- Use `scope="session"` for expensive setup (DB engine, migration runner).
- Use `scope="function"` for data that must be fresh per test.
- Yield fixtures for proper teardown.

## Mocking
- Use `unittest.mock` or `pytest-mock` (`mocker` fixture).
- Mock at the boundary: the function/class under test should call real code; external services should be mocked.
- Avoid over-mocking: if you mock the system under test, the test is worthless.

## Coverage
- Aim for meaningful coverage, not 100% line coverage.
- Prioritize coverage of: business logic, auth flows, error handlers, and edge cases.
- Use `pytest-cov` and enforce a minimum threshold in CI (e.g., 70–80%).
- Treat uncovered code as a risk indicator, not a failure.

## Test database strategy
- Use a separate test database with the same schema as production.
- Run tests inside a transaction that rolls back on teardown (fast, isolated).
- For tests that require commits (e.g., testing transaction logic), use a cleanup fixture that deletes test data.
- Never run tests against production data or production databases.

## API contract tests
- Validate that every endpoint returns the expected status code and response shape.
- Test happy path, validation errors (422), auth failures (401/403), and not-found (404).
- Ensure OpenAPI schema matches implementation (use `schemathesis` or manual checks).

## Property-based testing (optional)
- Use **Hypothesis** to generate randomized inputs and catch edge cases.
- Particularly useful for parsers, validators, and business rules.

## Load & performance testing (optional)
- Use **locust** or **k6** for load testing.
- Identify bottlenecks under realistic concurrency before shipping.
- Do not optimize prematurely; measure first.

## CI/CD integration
- Run the full test suite on every pull request.
- Block merges if tests fail or coverage drops below threshold.
- Run linting (`ruff`, `mypy`) alongside tests.
- Run security scans (`bandit`, `pip-audit`) in CI.

## Test anti-patterns
- Tests that depend on execution order.
- Tests that call external services directly.
- Tests with hard-coded IDs or timestamps that break over time.
- Tests that assert on exact error message strings (assert on error codes instead).
- Slow tests that discourage running the suite frequently.
