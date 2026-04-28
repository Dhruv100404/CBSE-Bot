FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y curl build-essential && rm -rf /var/lib/apt/lists/*
RUN pip install uv

WORKDIR /app/apps/worker
COPY apps/worker /app/apps/worker
RUN uv sync --no-dev
CMD ["uv", "run", "python", "-m", "src.main"]
