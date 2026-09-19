"""Database session placeholders (wired in milestone M3).

SPEC requires async SQLAlchemy + PostgreSQL. This module documents the
extension point without requiring a live database for M1 health checks.
"""

from __future__ import annotations

# Milestone M3 will define:
# - engine = create_async_engine(settings.database_url)
# - async_session_maker
# - get_session() FastAPI dependency
