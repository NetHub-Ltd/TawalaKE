# Convenience Dockerfile for builds from the repository root.
# Sources live under backend/; this file only re-paths COPY instructions.
#
# Preferred (CI uses this):
#   docker build -t tawala-core:local -f backend/Dockerfile backend
#
# From repo root:
#   docker build -t tawala-core:local .

FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml backend/README.md ./
COPY backend/app ./app

RUN python -m venv /install \
    && /install/bin/pip install --upgrade pip \
    && /install/bin/pip install .

FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/install/bin:$PATH"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /install
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini
COPY backend/start.sh ./start.sh

RUN chmod +x /app/start.sh

EXPOSE 8000

LABEL org.opencontainers.image.title="tawala-core" \
      org.opencontainers.image.description="Tawala Core platform (core/v2 isolated)" \
      org.opencontainers.image.source="https://github.com/NetHub-Ltd/TawalaKE"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["/app/start.sh"]
