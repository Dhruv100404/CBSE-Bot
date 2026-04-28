# CBSE PCMB AI Platform

Monorepo scaffold for a Docker-first AI learning platform focused on CBSE Class 11 and 12 Physics, Chemistry, Mathematics, and Biology.

## Stack

* `apps/web`: Next.js App Router
* `apps/api`: FastAPI + SQLAlchemy + Alembic
* `apps/worker`: Python worker scaffold
* `postgres`, `redis`, `minio`, `mailhog`: local dependencies via Docker Compose

## Local setup

1. Copy `.env.example` to `.env`.
2. Ensure Docker is installed and running.
3. Enable `pnpm` if needed:

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

4. Install JS dependencies:

```bash
pnpm install
```

5. Start the full local stack:

```bash
docker compose up --build
```

## Useful commands

```bash
pnpm dev
make up
make down
make migrate
```

## Sprint status

The current scaffold includes:

* workspace and package structure
* route stubs for public, student, teacher, and admin surfaces
* auth shell for the web app
* API foundations with auth and curriculum endpoints
* Alembic migration skeletons
* worker placeholder jobs
* Dockerfiles and Compose wiring
