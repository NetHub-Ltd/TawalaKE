FROM python:3.12-slim

# 1. Environment setup

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

# 2. Install system dependencies (needed for some python packages like psycopg2)

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Install uv

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# 4. Copy dependency files

COPY pyproject.toml uv.lock ./

# 5. Install dependencies

# RUN uv sync --frozen --no-dev
RUN uv sync --frozen --no-install-project --no-dev

# 6. Copy your source folders

COPY app/ ./app

COPY entrypoint.sh ./entrypoint.sh
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

# 7. Final touches

RUN chmod +x entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]