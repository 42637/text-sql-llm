# Multi-stage Dockerfile for TextSQL-GPT Backend on Render / Cloud
FROM python:3.11-slim as runtime

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    git-lfs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install Python dependencies (using CPU-only PyTorch wheels)
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend application code and model artifacts
COPY backend /app/backend

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    MODEL_DIR=/app/backend/model \
    ALLOWED_ORIGINS=*

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["sh", "-c", "python backend/download_model.py && uvicorn app:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}"]
