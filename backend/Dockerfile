# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies only if needed
RUN apt-get update && apt-get install -y --no-install-recommends gcc \
 && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create directories for output
RUN mkdir -p app/compressed_images app/compressed_pdfs app/merged_pdfs app/organized_pdfs app/split_pdfs

# Expose port (Cloud Run conventionally uses 8080)
EXPOSE 8080

# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]