# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p app/compressed_images app/compressed_pdfs app/merged_pdfs app/organized_pdfs app/split_pdfs

# Expose port
# Default port (Cloud Run sets PORT at runtime)
ENV PORT=8000
EXPOSE ${PORT}

# Command to run the application; allow overriding PORT at runtime
# Use a shell form so environment variable expansion works
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
