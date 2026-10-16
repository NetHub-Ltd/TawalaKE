#!/usr/bin/env python3
"""Export active PlatformUsers for Path A NetHubKe membership linking (#540).

Does not call NetHubKe. Writes JSON for the NetHubKe link script.

Usage (from backend/):
  uv run python scripts/path_a_export_platform_users.py
  uv run python scripts/path_a_export_platform_users.py --out /tmp/platform_users_path_a.json
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path


async def _export(out: Path) -> int:
    from sqlmodel import select

    from app.db.session import AsyncSessionLocal
    from app.models.models import PlatformUser

    async with AsyncSessionLocal() as db:
        stmt = (
            select(PlatformUser)
            .where(PlatformUser.deleted_at.is_(None))  # type: ignore[union-attr]
            .order_by(PlatformUser.email)
        )
        rows = list((await db.exec(stmt)).all())

    payload = {
        "product": "tawala-platform",
        "users": [
            {
                "external_user_id": str(u.id),
                "email": (u.email or "").strip().lower(),
                "full_name": u.full_name,
                "role": u.role.value if hasattr(u.role, "value") else str(u.role),
                "active": bool(u.active),
                "nethub_user_id": str(u.nethub_user_id) if getattr(u, "nethub_user_id", None) else None,
            }
            for u in rows
            if u.active
        ],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(payload['users'])} active platform user(s) → {out}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Export PlatformUsers for Path A linking")
    p.add_argument(
        "--out",
        type=Path,
        default=Path("platform_users_path_a_export.json"),
        help="Output JSON path",
    )
    args = p.parse_args()
    return asyncio.run(_export(args.out))


if __name__ == "__main__":
    raise SystemExit(main())
