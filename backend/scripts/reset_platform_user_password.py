#!/usr/bin/env python3
"""Emergency platform operator password reset (ops only).

Use when locked out of /platform/login and no other SUPER_ADMIN can force-reset
from the Operators UI.

  cd backend
  # DATABASE_*, RESEND / mailer, FRONTEND_URL must be available (same as API)
  python scripts/reset_platform_user_password.py --email you@example.com

  # If email delivery is broken, secure shell only:
  python scripts/reset_platform_user_password.py --email you@example.com --print-once

Behaviour:
  - Generates a temporary password
  - Sets must_change_password=True
  - Emails the password (plaintext never written to app logs)
  - --print-once prints password once to stdout for break-glass recovery

Do not commit printed passwords or leave --print-once output in CI logs.
"""
from __future__ import annotations

import argparse
import asyncio
import secrets
import sys


async def _run(email: str, *, print_once: bool) -> int:
    from sqlmodel import select

    from app.core.config import settings
    from app.core.mailer import mailer
    from app.core.security import security
    from app.core.session import AsyncSessionLocal
    from app.models.models import PlatformUser
    from app.utils.logging import logger

    email_n = email.strip().lower()
    if not email_n or "@" not in email_n:
        print("Invalid --email", file=sys.stderr)
        return 2

    temporary_password = secrets.token_urlsafe(18)

    async with AsyncSessionLocal() as session:
        rows = list(
            await session.exec(
                select(PlatformUser).where(PlatformUser.deleted_at.is_(None))
            )
        )
        user = next(
            (u for u in rows if (u.email or "").strip().lower() == email_n),
            None,
        )
        if not user:
            print(f"No platform user found for email={email_n}", file=sys.stderr)
            return 1
        if not user.active:
            print(
                f"Warning: platform user {email_n} is inactive; login may still be denied.",
                file=sys.stderr,
            )

        user.hashed_password = security.hash_password(temporary_password)
        user.must_change_password = True
        session.add(user)
        await session.commit()
        await session.refresh(user)

        try:
            login_url = f"{settings.frontend_origin}/platform/login"
        except Exception:
            frontend = (getattr(settings, "frontend_url", None) or "").rstrip("/")
            if frontend and not frontend.startswith("http"):
                frontend = f"https://{frontend}"
            login_url = f"{frontend}/platform/login" if frontend else "/platform/login"

        mailed = False
        try:
            mailer.send_platform_password_reset(
                to_email=user.email,
                temporary_password=temporary_password,
                login_url=login_url,
                user_name=user.full_name,
                reset_by_name="Platform ops reset script",
            )
            mailed = True
            logger.info(
                "Platform password reset for id=%s email=%s; email sent",
                user.id,
                user.email,
            )
        except Exception as mail_err:
            logger.error(
                "Platform password reset saved for id=%s email=%s but email failed: %s",
                user.id,
                user.email,
                type(mail_err).__name__,
            )
            print(
                f"Password updated in DB but email failed: {type(mail_err).__name__}",
                file=sys.stderr,
            )

        if print_once:
            print("TEMPORARY_PASSWORD_START")
            print(temporary_password)
            print("TEMPORARY_PASSWORD_END")
            print(
                "Change this password immediately after login (must_change_password is set).",
                file=sys.stderr,
            )
        elif mailed:
            print(
                f"OK: temporary password emailed to {user.email}. "
                f"Sign in at {login_url} then change password."
            )
        else:
            print(
                "Password hash updated but email failed. Re-run with --print-once "
                "in a secure shell, or fix mailer and re-run.",
                file=sys.stderr,
            )
            return 3

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Reset a platform operator password and email a temporary one."
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Platform user email (account on platform_users)",
    )
    parser.add_argument(
        "--print-once",
        action="store_true",
        help="Also print the temporary password once (break-glass if email is down)",
    )
    args = parser.parse_args()
    return asyncio.run(_run(args.email, print_once=args.print_once))


if __name__ == "__main__":
    raise SystemExit(main())
