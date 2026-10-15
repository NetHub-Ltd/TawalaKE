#!/usr/bin/env python3
"""Apply NetHubKe user ids onto platform_users.nethub_user_id (#540).

Input JSON is the *mapping* produced by NetHubKe path_a_link_platform_memberships.py
(or any file with users[].external_user_id + users[].nethub_user_id).

Never rewrites platform_users.id. Idempotent. Dry-run by default.

Usage:
  uv run python scripts/path_a_apply_platform_links.py --in mapping.json
  uv run python scripts/path_a_apply_platform_links.py --in mapping.json --apply
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from uuid import UUID


async def _apply(path: Path, *, apply: bool) -> int:
    from sqlmodel import select

    from app.db.session import AsyncSessionLocal
    from app.models.models import PlatformUser

    data = json.loads(path.read_text())
    users = data.get("users") or []
    if not users:
        print("No users in mapping file", file=sys.stderr)
        return 1

    updates = 0
    skipped = 0
    missing = 0

    async with AsyncSessionLocal() as db:
        for row in users:
            ext = row.get("external_user_id")
            nh = row.get("nethub_user_id")
            if not ext or not nh:
                skipped += 1
                continue
            try:
                ext_id = UUID(str(ext))
                nh_id = UUID(str(nh))
            except ValueError:
                print(f"SKIP invalid uuid: {row}")
                skipped += 1
                continue

            pu = (
                await db.exec(select(PlatformUser).where(PlatformUser.id == ext_id))
            ).first()
            if not pu:
                print(f"MISSING platform_user id={ext_id} email={row.get('email')}")
                missing += 1
                continue

            if pu.nethub_user_id == nh_id:
                skipped += 1
                continue

            print(
                f"{'APPLY' if apply else 'DRY'}: {pu.email} "
                f"nethub_user_id {pu.nethub_user_id} → {nh_id}"
            )
            if apply:
                pu.nethub_user_id = nh_id
                db.add(pu)
                updates += 1

        if apply and updates:
            await db.commit()

    print(f"done updates={updates} skipped={skipped} missing={missing} apply={apply}")
    return 0 if missing == 0 else 2


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="inp", type=Path, required=True)
    p.add_argument("--apply", action="store_true", help="Write DB (default dry-run)")
    args = p.parse_args()
    return asyncio.run(_apply(args.inp, apply=args.apply))


if __name__ == "__main__":
    raise SystemExit(main())
