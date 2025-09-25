FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Copy poetry files
COPY pyproject.toml poetry.lock* ./

# Configure poetry
RUN poetry config virtualenvs.create false

# Install dependencies
RUN poetry install --no-dev

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /data/intakes /data/exports

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]