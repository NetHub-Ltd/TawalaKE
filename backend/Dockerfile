FROM python:3.12-slim

# 1. Environment setup
# Set PYTHONPATH to /app so 'import app' works from anywhere
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

# 2. Install system dependencies (needed for some python packages like psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Copy dependency files
# Even without poetry, pip can read pyproject.toml
COPY requirements.txt ./

# 4. Install dependencies + Gunicorn/Uvicorn manually
# We use 'pip install .' if you have a build-backend,
# or just install the requirements manually for speed.
RUN pip install --no-cache-dir -r requirements.txt gunicorn
#RUN #pip install --no-cache-dir .

# 5. Copy your source folders specifically
# Matching your manual copy logic
COPY app/ ./app
# COPY fastapi ./fastapi
# COPY realms ./realms
# COPY scripts ./scripts
COPY entrypoint.sh ./entrypoint.sh
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

# 6. Final touches
RUN chmod +x entrypoint.sh
EXPOSE 8000

# Using dots for the module path, not slashes!
#CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]
ENTRYPOINT ["./entrypoint.sh"]