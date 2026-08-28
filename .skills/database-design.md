# Skill: Database Design (PostgreSQL)

## Purpose
Design schemas that are correct, performant, and maintainable over time.

## Schema design
- Normalize to **3NF** by default: eliminate repeating groups, partial dependencies, and transitive dependencies.
- Denormalize only when you have measured a performance problem and can justify the maintenance cost.
- Use schemas to organize tables by domain (`app`, `analytics`, `audit`).
- Name tables with plural nouns (`users`, `order_items`).
- Use `snake_case` for all identifiers.

## Data types
- Use `UUID` (v4 or v7) for primary keys when external exposure or merge safety matters; use `BIGSERIAL` for internal-only, high-write tables.
- Use `TIMESTAMP WITH TIME ZONE` (`timestamptz`) for all timestamps; never use `TIMESTAMP WITHOUT TIME ZONE`.
- Use `JSONB` for semi-structured data that may change shape; index with GIN.
- Use `ARRAY` only for simple, homogeneous lists; prefer join tables for complex relationships.
- Use `ENUM` only for stable, small sets of values; otherwise use a lookup table.
- Use `DECIMAL` / `NUMERIC` for money; never use `FLOAT` for financial calculations.
- Use `TEXT` instead of `VARCHAR(n)` unless there is a hard business limit.

## Constraints
- Define `NOT NULL` on every column that must have a value.
- Use `CHECK` constraints to enforce business rules at the database level.
- Use `UNIQUE` constraints for natural keys and alternate identifiers.
- Use `FOREIGN KEY` constraints with `ON DELETE` / `ON UPDATE` actions specified explicitly.
- Add `DEFAULT` values only when the default is universally safe and meaningful.

## Indexing
- Index foreign key columns automatically.
- Index columns used in `WHERE`, `JOIN`, `ORDER BY`, and `GROUP BY`.
- Use **partial indexes** for queries that filter on a constant condition (e.g., `WHERE is_active = true`).
- Use **composite indexes** when multiple columns are queried together; order columns by selectivity (most selective first).
- Use **GIN** indexes for `JSONB`, full-text search, and array containment.
- Use **GiST** for range types and geometric data.
- Avoid indexing low-cardinality columns alone (e.g., boolean).
- Monitor index usage with `pg_stat_user_indexes`; drop unused indexes.

## Relationships
- **One-to-one**: use a foreign key with a `UNIQUE` constraint; put the FK on the optional side.
- **One-to-many**: standard foreign key from child to parent.
- **Many-to-many**: explicit join table with its own primary key and timestamps; add composite unique index on the two FKs.

## Migrations
- Use **Alembic** for schema migrations.
- Write **forward-only** migrations; avoid reversible logic that can fail in production.
- Make migrations idempotent where possible (`CREATE INDEX IF NOT EXISTS`).
- Never drop columns or tables in a migration without first confirming data is backed up or migrated.
- Test migrations against a copy of production data before deploying.

## Query optimization
- Use `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` to understand query plans.
- Avoid `SELECT *`; select only needed columns.
- Avoid N+1 queries: use `JOIN` or batched loads (e.g., `selectinload` in SQLAlchemy).
- Use `LIMIT` / `OFFSET` or cursor pagination for large result sets.
- Use `COUNT(*)` over estimated counts only when exactness is required; otherwise use `pg_class` estimates or a counter table.
- Prefer `EXISTS` over `IN` for subqueries.

## Connection management
- Use a connection pool (asyncpg pool, SQLAlchemy `AsyncSession` pool, or pgBouncer in production).
- Set `pool_size` and `max_overflow` based on expected concurrency.
- Keep transactions short; do not hold connections open during user-facing I/O.

## Partitioning
- Partition tables > 100 GB or with time-series data.
- Prefer declarative partitioning (`PARTITION BY RANGE/LIST/HASH`).
- Create indexes on the parent table; they propagate to partitions.

## Full-text search
- Use `tsvector` columns with GIN indexes for search-heavy tables.
- Update `tsvector` via trigger or generated column to keep search index in sync.

## Soft deletes & auditing
- Use a `deleted_at` timestamp for soft deletes; filter `WHERE deleted_at IS NULL` by default (use a partial index).
- Consider an `updated_at` trigger for automatic timestamp maintenance.
- For audit trails, use a separate audit table or PostgreSQL logical replication / `pg_audit`.

## Backups
- Automate daily logical backups (`pg_dump`) and continuous WAL archiving.
- Test restore procedures regularly.
