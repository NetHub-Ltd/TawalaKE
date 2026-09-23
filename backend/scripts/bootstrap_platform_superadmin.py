#!/usr/bin/env python3
"""Optional CLI entry for platform SUPER_ADMIN bootstrap.

Preferred path: set PLATFORM_BOOTSTRAP_EMAIL (+ optional NAME) in backend/.env;
the API runs ensure_platform_superadmin() on startup (idempotent).

This script calls the same helper for one-off runs without restarting the API.
"""
from __future__ import annotations

import asyncio
import sys


async def main() -> int:
    from app.prestart import ensure_platform_superadmin

    await ensure_platform_superadmin()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
