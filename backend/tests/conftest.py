"""Shared fixtures — real PostgreSQL only. No FakeSession.

Requires DATABASE_URL (postgresql+asyncpg://...) and ENVIRONMENT=test.
CI provides a Postgres service and sets both variables.

Note: migration setup is a *sync* session-scoped fixture so it does not
conflict with pytest-asyncio's default function-scoped event loop.
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from uuid import uuid4

import pytest
import pytest_asyncio
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from alembic import command
from app.core_platform.shared.settings import clear_settings_cache, get_settings
from app.db.session import get_session_factory, reset_engine, set_tenant_guc
from app.main import app


def _has_database_url() -> bool:
    return bool(os.environ.get("DATABASE_URL", "").strip())


@pytest.fixture(scope="session")
def database_url() -> str:
    if not _has_database_url():
        pytest.skip("DATABASE_URL not set — PostgreSQL required")
    os.environ["ENVIRONMENT"] = "test"
    clear_settings_cache()
    reset_engine()
    return get_settings().require_database_url()


@pytest.fixture(scope="session")
def prepared_database(database_url: str) -> None:
    """Run Alembic migrations once per test session (sync — avoids ScopeMismatch)."""
    clear_settings_cache()
    reset_engine()
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(cfg, "head")


@pytest_asyncio.fixture
async def db_session(prepared_database: None) -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        await set_tenant_guc(session, business_id=None, bypass=True)
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(prepared_database: None) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def two_tenants(db_session: AsyncSession, client: AsyncClient) -> dict:
    """Seed two businesses, three users, parties, products; return tokens + ids."""
    from app.core_platform.identity.password import hash_password
    from app.core_platform.security.service import RoleService
    from app.models.catalog import Product
    from app.models.identity import Credential, CredentialType, User, UserStatus
    from app.models.organization import Business, BusinessStatus
    from app.models.parties import (
        LinkStatus,
        Party,
        PartyBusinessLink,
        PartyKind,
        PartyRelationship,
    )
    from app.models.security import Membership, MembershipStatus

    await set_tenant_guc(db_session, None, bypass=True)

    biz_a = Business(id=uuid4(), name="Business A", status=BusinessStatus.ACTIVE)
    biz_b = Business(id=uuid4(), name="Business B", status=BusinessStatus.ACTIVE)
    db_session.add_all([biz_a, biz_b])

    user_a = User(
        id=uuid4(), email=f"a-{uuid4().hex[:8]}@example.com", status=UserStatus.ACTIVE
    )
    user_b = User(
        id=uuid4(), email=f"b-{uuid4().hex[:8]}@example.com", status=UserStatus.ACTIVE
    )
    user_none = User(
        id=uuid4(),
        email=f"none-{uuid4().hex[:8]}@example.com",
        status=UserStatus.ACTIVE,
    )
    db_session.add_all([user_a, user_b, user_none])

    pwd = "TestPass123!"
    for u in (user_a, user_b, user_none):
        db_session.add(
            Credential(
                id=uuid4(),
                user_id=u.id,
                type=CredentialType.PASSWORD,
                secret_hash=hash_password(pwd),
            )
        )

    mem_a = Membership(
        id=uuid4(),
        business_id=biz_a.id,
        user_id=user_a.id,
        status=MembershipStatus.ACTIVE,
        activated_at=datetime.now(UTC),
    )
    mem_b = Membership(
        id=uuid4(),
        business_id=biz_b.id,
        user_id=user_b.id,
        status=MembershipStatus.ACTIVE,
        activated_at=datetime.now(UTC),
    )
    db_session.add_all([mem_a, mem_b])
    await db_session.flush()

    roles = RoleService(db_session)
    await set_tenant_guc(db_session, None, bypass=True)
    await roles.bootstrap_owner(biz_a.id, mem_a.id)
    await set_tenant_guc(db_session, None, bypass=True)
    await roles.bootstrap_owner(biz_b.id, mem_b.id)

    await set_tenant_guc(db_session, None, bypass=True)
    party_a = Party(id=uuid4(), kind=PartyKind.PERSON, display_name="Party A")
    party_b = Party(id=uuid4(), kind=PartyKind.PERSON, display_name="Party B")
    db_session.add_all([party_a, party_b])
    db_session.add(
        PartyBusinessLink(
            id=uuid4(),
            business_id=biz_a.id,
            party_id=party_a.id,
            relationship=PartyRelationship.CUSTOMER,
            status=LinkStatus.ACTIVE,
        )
    )
    db_session.add(
        PartyBusinessLink(
            id=uuid4(),
            business_id=biz_b.id,
            party_id=party_b.id,
            relationship=PartyRelationship.CUSTOMER,
            status=LinkStatus.ACTIVE,
        )
    )
    prod_a = Product(
        id=uuid4(), business_id=biz_a.id, name="Product A", sku=f"A-{uuid4().hex[:6]}"
    )
    prod_b = Product(
        id=uuid4(), business_id=biz_b.id, name="Product B", sku=f"B-{uuid4().hex[:6]}"
    )
    db_session.add_all([prod_a, prod_b])
    await db_session.commit()

    async def _login(email: str) -> str:
        r = await client.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        assert r.status_code == 200, r.text
        return r.json()["access_token"]

    return {
        "biz_a": biz_a.id,
        "biz_b": biz_b.id,
        "party_a": party_a.id,
        "party_b": party_b.id,
        "prod_a": prod_a.id,
        "prod_b": prod_b.id,
        "mem_a": mem_a.id,
        "token_a": await _login(user_a.email),
        "token_b": await _login(user_b.email),
        "token_none": await _login(user_none.email),
        "email_a": user_a.email,
        "session": db_session,
    }
