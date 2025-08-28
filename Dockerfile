# Use lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install git (needed for some HF downloads)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/hf_cache && chmod -R 777 /app/hf_cache

# Copy project files into container
COPY . .

ENV HF_HOME=/app/hf_cache

# Expose FastAPI port
EXPOSE 7860

# Run the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
