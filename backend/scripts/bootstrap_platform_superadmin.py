#!/usr/bin/env python3
"""One-shot bootstrap: create the first PlatformUser SUPER_ADMIN.

Usage (from backend/ with env configured):
  PLATFORM_BOOTSTRAP_EMAIL=ops@nethub.co.ke \\
  PLATFORM_BOOTSTRAP_PASSWORD='...' \\
  PLATFORM_BOOTSTRAP_NAME='Platform Ops' \\
  python -m scripts.bootstrap_platform_superadmin

Refuses to run if any SUPER_ADMIN already exists.
Never commit real passwords.
"""
from __future__ import annotations

import asyncio
import os
import sys


async def main() -> int:
    email = (os.environ.get("PLATFORM_BOOTSTRAP_EMAIL") or "").strip().lower()
    password = os.environ.get("PLATFORM_BOOTSTRAP_PASSWORD") or ""
    name = (os.environ.get("PLATFORM_BOOTSTRAP_NAME") or "Platform Super Admin").strip()

    if not email or "@" not in email:
        print("PLATFORM_BOOTSTRAP_EMAIL required", file=sys.stderr)
        return 2
    if len(password) < 12:
        print("PLATFORM_BOOTSTRAP_PASSWORD must be at least 12 characters", file=sys.stderr)
        return 2

    from sqlmodel import select
    from app.core.session import AsyncSessionLocal
    from app.core.security import security
    from app.models.models import PlatformUser, PlatformRole

    async with AsyncSessionLocal() as db:
        existing_sa = (
            await db.exec(
                select(PlatformUser).where(
                    PlatformUser.role == PlatformRole.SUPER_ADMIN,
                    PlatformUser.deleted_at.is_(None),
                )
            )
        ).first()
        if existing_sa:
            print(f"SUPER_ADMIN already exists: {existing_sa.email} — aborting")
            return 1

        dup = (
            await db.exec(select(PlatformUser).where(PlatformUser.email == email))
        ).first()
        if dup:
            print(f"Email already registered as platform user: {email}")
            return 1

        user = PlatformUser(
            email=email,
            full_name=name,
            hashed_password=security.hash_password(password),
            role=PlatformRole.SUPER_ADMIN,
            active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f"Created SUPER_ADMIN id={user.id} email={user.email}")
        return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
