#!/usr/bin/env python3
"""One-shot bootstrap: create the first PlatformUser SUPER_ADMIN via invite.

Does **not** accept a hardcoded password. Generates a temporary password and
emails it with a platform login link (same as POST /platform/users invite).

Usage (from backend/ with env configured, including RESEND + FRONTEND_URL):
  PLATFORM_BOOTSTRAP_EMAIL=ops@nethub.co.ke \\
  PLATFORM_BOOTSTRAP_NAME='Platform Ops' \\
  python -m scripts.bootstrap_platform_superadmin

Refuses to run if any SUPER_ADMIN already exists.
Never commit real passwords. Prefer API invite after the first SUPER_ADMIN exists.
"""
from __future__ import annotations

import asyncio
import os
import secrets
import sys


async def main() -> int:
    email = (os.environ.get("PLATFORM_BOOTSTRAP_EMAIL") or "").strip().lower()
    name = (os.environ.get("PLATFORM_BOOTSTRAP_NAME") or "Platform Super Admin").strip()

    if not email or "@" not in email:
        print("PLATFORM_BOOTSTRAP_EMAIL required", file=sys.stderr)
        return 2

    from sqlmodel import select

    from app.core.config import settings
    from app.core.mailer import mailer
    from app.core.security import security
    from app.core.session import AsyncSessionLocal
    from app.models.models import PlatformRole, PlatformUser

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

        temporary_password = secrets.token_urlsafe(18)
        user = PlatformUser(
            email=email,
            full_name=name,
            hashed_password=security.hash_password(temporary_password),
            role=PlatformRole.SUPER_ADMIN,
            active=True,
            must_change_password=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        frontend = (settings.frontend_url or "").rstrip("/")
        if frontend and not frontend.startswith("http"):
            frontend = f"https://{frontend}"
        login_url = f"{frontend}/platform/login" if frontend else "/platform/login"

        try:
            mailer.send_platform_user_invite(
                to_email=email,
                temporary_password=temporary_password,
                login_url=login_url,
                user_name=name,
                inviter_name="Tawala bootstrap",
            )
            print(
                f"Created SUPER_ADMIN id={user.id} email={user.email}; "
                "invite email sent (change password after first login)."
            )
        except Exception as exc:
            print(
                f"Created SUPER_ADMIN id={user.id} email={user.email} but email failed: "
                f"{type(exc).__name__}. Password was not printed for security — "
                "reset via DB or re-invite after fixing mailer.",
                file=sys.stderr,
            )
            return 3
        return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
