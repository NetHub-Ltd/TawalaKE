"""Core SQLModel tables — import all models for Alembic metadata."""

from app.models.identity import Credential, Session, User

__all__ = ["User", "Credential", "Session"]
