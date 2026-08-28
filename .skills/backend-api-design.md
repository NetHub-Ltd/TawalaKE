# Skill: Backend API Design (FastAPI)

## Purpose
Build robust, maintainable, and discoverable HTTP APIs with FastAPI.

## Route design
- Use resource-oriented URLs: `/users`, `/users/{id}`, `/users/{id}/orders`.
- Use correct HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE (remove).
- Avoid verbs in paths: prefer `POST /orders` over `POST /createOrder`.
- Use plural nouns for collections: `/items` not `/item`.
- Nest sub-resources logically: `/projects/{id}/tasks`.
- Return consistent HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity (Pydantic), 429 Too Many Requests, 500 Internal Server Error.

## Pydantic models
- Separate schemas for **Create**, **Read**, **Update**, and **List** operations.
- Use `BaseModel` for request/response validation; leverage `Field(..., description=...)` for OpenAPI docs.
- Use `ConfigDict(from_attributes=True)` (v2) or `orm_mode` (v1) for ORM-to-schema serialization.
- Avoid exposing internal IDs or sensitive fields in public schemas.
- Use `UUID` for external identifiers when possible.

## Dependency injection
- Use `Depends()` for DB sessions, authentication, configuration, and reusable logic.
- Yield DB sessions in dependencies and ensure cleanup (context manager pattern).
- Keep dependencies testable: accept interfaces, not concrete implementations where practical.

## Async patterns
- Use `async def` for I/O-bound operations: DB queries (asyncpg/aiosqlite), HTTP calls, file I/O.
- Use regular `def` for CPU-bound work to avoid blocking the event loop; offload to thread pool if needed.
- Do not mix sync and async ORM sessions arbitrarily within the same request path.

## Error handling
- Raise `HTTPException` with descriptive `detail` and correct `status_code`.
- Implement custom exception handlers for domain errors to return consistent JSON error shapes.
- Standard error response format:
  ```json
  {
    "error": "ErrorCode",
    "message": "Human-readable description",
    "details": { "field": "reason" }
  }
  ```
- Log exceptions with stack traces server-side; send sanitized messages to clients.

## Middleware & cross-cutting concerns
- CORS: whitelist specific origins in production; never use `allow_origins=["*"]` with credentials.
- Request ID logging: attach a unique ID to every request for traceability.
- Rate limiting: apply per-user or per-IP (e.g., `slowapi` or custom middleware).
- Compression: enable GZip/Brotli for responses > 1 KB.

## OpenAPI / documentation
- Add `tags` to routers for logical grouping in auto-generated docs.
- Write `summary` and `description` on endpoints.
- Use `response_model` to document return shapes.
- Keep docs accurate: if the schema changes, the docs must reflect it.

## Pagination
- Use **cursor pagination** for large, frequently changing datasets (better performance, no skipped rows).
- Use **offset/limit** for small or stable datasets (simpler, random access).
- Always return a consistent envelope:
  ```json
  {
    "data": [],
    "next_cursor": "...",
    "total": 100
  }
  ```

## Versioning
- Prefer URL versioning (`/v1/users`) for public APIs.
- Maintain backward compatibility within a version; deprecate gracefully with Sunset headers.

## File uploads / downloads
- Validate file type (magic bytes, not just extension) and size before processing.
- Stream large files; do not load multi-GB files into memory.
- Store files outside the app container (object storage: S3, MinIO, etc.).

## Background tasks
- Use FastAPI `BackgroundTasks` for fire-and-forget work (emails, notifications) that need not block the response.
- For heavy or retryable work, use a proper task queue (Celery, RQ, arq) instead of `BackgroundTasks`.

## WebSockets (if needed)
- Authenticate during the handshake, not after.
- Handle disconnects gracefully; clean up resources.
- Do not use WebSockets for simple request/response patterns.
