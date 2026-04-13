FROM python:3.11-slim

# HuggingFace Spaces runs as user 1000
RUN useradd -m -u 1000 user
WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend
COPY backend/ ./backend/

# Create data directories owned by user
RUN mkdir -p /app/data /app/data/faiss_indexes /app/data/uploads && \
    chown -R user:user /app

USER user

# Environment defaults
ENV APP_ENV=production
ENV DATABASE_URL=sqlite:////app/data/legal_ai.db
ENV FAISS_INDEX_DIR=/app/data/faiss_indexes
ENV UPLOAD_DIR=/app/data/uploads
ENV PORT=7860

EXPOSE 7860

CMD gunicorn --chdir backend app.main:app --bind 0.0.0.0:7860 --workers 2 --timeout 120 --worker-class uvicorn.workers.UvicornWorker
