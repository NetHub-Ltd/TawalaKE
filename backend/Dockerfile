FROM python:3.12-slim

# Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    UV_PROJECT_ENVIRONMENT=system

WORKDIR /app

# System dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

ENV PATH="/root/.local/bin:${PATH}"

# Install Python dependencies
COPY pyproject.toml uv.lock ./

RUN uv sync \
    --frozen \
    --no-install-project \
    --no-dev

# Copy application
COPY app/ ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]