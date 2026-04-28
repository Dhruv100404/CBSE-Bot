# Sprint 1 Build Sheet

This document converts the CBSE PCMB AI Platform blueprint into an implementation-ready Sprint 1 plan.

Sprint 1 goal: establish the repo foundation, Docker-first local runtime, auth shell, shared packages, initial database setup, route stubs, and the first UI scaffolds so later AI flows can land without rework.

## 1. Sprint 1 scope

Sprint 1 covers:

* monorepo bootstrap
* Dockerfiles for `web`, `api`, and `worker`
* `docker-compose.yml` for local orchestration
* environment variable contracts
* initial Postgres schema and migrations
* auth shell and protected route groups
* shared UI/config/types packages
* first route stubs across public, student, teacher, and admin surfaces
* shadcn setup and initial component inventory
* CI skeleton

Sprint 1 explicitly does not cover:

* retrieval quality work
* OCR pipelines
* embeddings
* payments
* production deployment
* advanced analytics

## 2. Working assumptions

To keep Sprint 1 executable, this build sheet fixes the stack choices below:

* monorepo package manager: `pnpm`
* monorepo task runner: `turbo`
* frontend: Next.js App Router + TypeScript + Tailwind + shadcn/ui
* API: FastAPI + SQLAlchemy + Pydantic
* worker: Python worker app using Dramatiq + Redis
* database migrations: Alembic
* local infra: Docker Compose with Postgres, Redis, MinIO, MailHog
* auth in Sprint 1: email/password with JWT access/refresh tokens
* ORM ownership: Python owns DB schema source of truth

If the team later prefers Celery or RQ over Dramatiq, that can be swapped with minimal domain impact because worker jobs will be expressed as service-layer tasks.

## 3. Expected repo shape after Sprint 1

```txt
repo/
  apps/
    web/
    api/
    worker/
  packages/
    ui/
    config/
    types/
  infra/
    docker/
      web/
      api/
      worker/
    compose/
  docs/
    architecture/
      Sprint-1-Build-Sheet.md
  .github/
    workflows/
  package.json
  pnpm-workspace.yaml
  turbo.json
  docker-compose.yml
  .env.example
  .gitignore
  Makefile
```

## 4. Exact bootstrap commands

Run these from the repo root in order.

### 4.1 Core workspace bootstrap

```bash
mkdir -p apps packages infra/docker/web infra/docker/api infra/docker/worker infra/compose docs/architecture .github/workflows
pnpm init
pnpm add -D turbo prettier eslint
pnpm pkg set packageManager="pnpm@10"
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^test"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### 4.2 Web app bootstrap

```bash
pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-pnpm
cd apps/web
pnpm add zod react-hook-form @hookform/resolvers framer-motion lucide-react recharts clsx tailwind-merge class-variance-authority next-themes
pnpm add katex react-katex
cd ../..
```

### 4.3 Shared package bootstrap

```bash
mkdir -p packages/ui/src/components packages/config packages/types
```

Initialize `packages/ui/package.json`:

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

Initialize `packages/types/package.json`:

```json
{
  "name": "@repo/types",
  "version": "0.0.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
```

Initialize `packages/config/package.json`:

```json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true
}
```

### 4.4 Python services bootstrap

Use `uv` for reproducible Python environments.

```bash
uv init apps/api --package
uv init apps/worker --package
uv add --directory apps/api fastapi uvicorn[standard] sqlalchemy alembic psycopg[binary] pydantic-settings python-jose[cryptography] passlib[bcrypt] redis boto3 python-multipart
uv add --directory apps/worker dramatiq redis boto3 pydantic-settings psycopg[binary] sqlalchemy
uv add --directory apps/api --dev pytest pytest-asyncio httpx ruff mypy
uv add --directory apps/worker --dev pytest ruff mypy
```

### 4.5 shadcn bootstrap

From `apps/web`:

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input form label textarea dialog dropdown-menu sheet tabs badge table select separator skeleton toast sonner avatar tooltip progress
```

## 5. Root package scripts

Add these root scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "dev:web": "pnpm --filter web dev",
    "docker:up": "docker compose up --build",
    "docker:down": "docker compose down",
    "docker:reset": "docker compose down -v"
  }
}
```

## 6. Environment contract

Create `.env.example` at the repo root:

```env
NODE_ENV=development

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

API_PORT=8000
WEB_PORT=3000
WORKER_PORT=8001

POSTGRES_DB=cbse_ai
POSTGRES_USER=cbse
POSTGRES_PASSWORD=cbse_dev_password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql+psycopg://cbse:cbse_dev_password@postgres:5432/cbse_ai

REDIS_URL=redis://redis:6379/0

MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET=cbse-local
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123

JWT_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me_too
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=14

MAILHOG_SMTP_HOST=mailhog
MAILHOG_SMTP_PORT=1025
```

## 7. Dockerfiles

### `infra/docker/web/Dockerfile`

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --no-frozen-lockfile

FROM deps AS dev
COPY . .
WORKDIR /app/apps/web
CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
```

### `infra/docker/api/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y curl build-essential && rm -rf /var/lib/apt/lists/*
RUN pip install uv

COPY apps/api/pyproject.toml apps/api/uv.lock* /app/apps/api/
WORKDIR /app/apps/api
RUN uv sync || true

COPY apps/api /app/apps/api
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### `infra/docker/worker/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y curl build-essential && rm -rf /var/lib/apt/lists/*
RUN pip install uv

COPY apps/worker/pyproject.toml apps/worker/uv.lock* /app/apps/worker/
WORKDIR /app/apps/worker
RUN uv sync || true

COPY apps/worker /app/apps/worker
CMD ["uv", "run", "python", "-m", "src.main"]
```

## 8. Docker Compose

Create `docker-compose.yml` at repo root:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: infra/docker/web/Dockerfile
    env_file:
      - .env
    ports:
      - "${WEB_PORT:-3000}:3000"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: infra/docker/api/Dockerfile
    env_file:
      - .env
    ports:
      - "${API_PORT:-8000}:8000"
    volumes:
      - .:/app
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 10

  worker:
    build:
      context: .
      dockerfile: infra/docker/worker/Dockerfile
    env_file:
      - .env
    volumes:
      - .:/app
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

## 9. Makefile

Create a root `Makefile`:

```makefile
up:
	docker compose up --build

down:
	docker compose down

reset:
	docker compose down -v

logs:
	docker compose logs -f

migrate:
	docker compose exec api uv run alembic upgrade head

makemigration:
	docker compose exec api uv run alembic revision --autogenerate -m "$(name)"
```

## 10. API app skeleton

Target file layout:

```txt
apps/api/
  src/
    main.py
    core/
      config.py
      db.py
      security.py
    routes/
      health.py
      auth.py
      subjects.py
    schemas/
      auth.py
      common.py
    models/
      base.py
      user.py
      organization.py
      curriculum.py
    services/
      auth_service.py
    middleware/
      rbac.py
  alembic.ini
  alembic/
    env.py
    versions/
```

Minimum initial endpoints:

* `GET /health`
* `POST /v1/auth/signup`
* `POST /v1/auth/login`
* `GET /v1/auth/me`
* `GET /v1/subjects`
* `GET /v1/subjects/{subject_id}/chapters`

## 11. Worker app skeleton

Target file layout:

```txt
apps/worker/
  src/
    main.py
    config.py
    jobs/
      ping.py
      document_ingest.py
    pipelines/
      ingest_pipeline.py
```

Initial job scope:

* Redis connectivity test
* placeholder ingest job accepting `document_id`
* structured logs with job id and status

## 12. Web app route stubs

Create the following route groups immediately:

```txt
apps/web/app/
  (public)/
    page.tsx
    features/page.tsx
    pricing/page.tsx
    try/page.tsx
    teacher-tools/page.tsx
    schools/page.tsx
    login/page.tsx
    signup/page.tsx
  (student)/
    student/page.tsx
    student/subjects/page.tsx
    student/subjects/[subject]/page.tsx
    student/tutor/page.tsx
    student/quizzes/page.tsx
    student/papers/upload/page.tsx
    student/mistakes/page.tsx
    student/revision-plan/page.tsx
    student/settings/page.tsx
  (teacher)/
    teacher/page.tsx
    teacher/paper-studio/page.tsx
    teacher/paper-studio/new/page.tsx
    teacher/question-bank/page.tsx
    teacher/uploads/page.tsx
    teacher/classes/page.tsx
    teacher/analytics/page.tsx
    teacher/settings/page.tsx
  (admin)/
    admin/page.tsx
    admin/curriculum/page.tsx
    admin/documents/page.tsx
    admin/questions/page.tsx
    admin/review-queue/page.tsx
    admin/organizations/page.tsx
    admin/evals/page.tsx
```

Sprint 1 requirement: every stub page should render a title, breadcrumb, role guard placeholder, and "coming next" CTA zone so navigation can be validated early.

## 13. Auth shell decisions

Auth in Sprint 1 should include:

* signup page
* login page
* JWT-based API auth
* `me` endpoint
* role-aware layout guards in web app
* mock session hydration for protected layouts until full refresh flow is added

Web app tasks:

* create `AuthProvider`
* add route guard helper
* add role-based sidebar variants for student, teacher, admin
* redirect unauthenticated users from protected layouts to `/login`

API tasks:

* password hashing
* login token issue
* refresh token strategy placeholder
* `current_user` dependency
* initial RBAC decorator or dependency

## 14. Initial schema migration files

Sprint 1 should generate these initial migrations in order:

### `0001_create_users_and_profiles`

Tables:

* `users`
* `user_profiles`

Columns to include:

* `users.id uuid pk`
* `users.email unique not null`
* `users.phone nullable`
* `users.password_hash nullable`
* `users.role enum`
* `users.status enum`
* timestamps
* `user_profiles.user_id pk fk`
* `full_name`
* `preferred_language`
* `grade_level`
* `target_stream`
* `avatar_url`
* `timezone`
* `preferences_json`

### `0002_create_orgs_and_classes`

Tables:

* `organizations`
* `organization_memberships`
* `classes`
* `class_memberships`

### `0003_create_curriculum_core`

Tables:

* `boards`
* `subjects`
* `units`
* `chapters`
* `subtopics`
* `concepts`
* `syllabus_mappings`

### `0004_create_prompt_and_ai_run_core`

Tables:

* `prompt_versions`
* `ai_runs`
* `ai_run_sources`

Even though tutor generation is not built in Sprint 1, this schema should exist early so observability is not bolted on later.

## 15. Route stub inventory by API module

Create empty-but-typed routers for:

* `auth`
* `subjects`
* `chapters`
* `documents`
* `tutor`
* `quizzes`
* `paper_uploads`
* `paper_blueprints`
* `review_queue`

Each router should expose placeholder endpoints returning:

```json
{
  "ok": true,
  "message": "Not implemented yet"
}
```

Use typed response schemas rather than raw dicts.

## 16. Shared types to define in Sprint 1

In `packages/types`, add these first:

* `Role`
* `UserStatus`
* `SubjectCode`
* `ClassLevel`
* `ApiResponse<T>`
* `PaginationMeta`
* `TutorMode`
* `DifficultyLevel`
* `QuestionType`

These do not need to be exhaustive yet, but naming should match the blueprint so later OpenAPI generation and frontend alignment stay stable.

## 17. shadcn component list for Sprint 1

Install and wire these first because they unlock almost every surface:

* `button`
* `card`
* `input`
* `form`
* `label`
* `textarea`
* `dialog`
* `sheet`
* `tabs`
* `badge`
* `table`
* `select`
* `separator`
* `skeleton`
* `tooltip`
* `avatar`
* `progress`
* `sonner`

Create app-specific wrappers in `packages/ui`:

* `PageShell`
* `SectionCard`
* `StatCard`
* `EmptyState`
* `RoleGate`
* `AppSidebar`
* `TopNav`
* `GradientBadge`

## 18. UI wireframe task list by page

### Public pages

* `/`: hero, subject band, product pillars, CTA split for student/teacher
* `/features`: feature grid by user type
* `/pricing`: 3-column pricing cards with student and teacher segmentation
* `/try`: public demo shell with watermark placeholders
* `/teacher-tools`: teacher value proposition and sample worksheet card
* `/schools`: institution pitch with analytics preview
* `/login` and `/signup`: centered auth card layout

### Student pages

* `/student`: dashboard with progress cards, daily mission, recent doubts
* `/student/subjects`: subject tiles with color-coded accents
* `/student/subjects/[subject]`: chapter list and progress meter
* `/student/tutor`: split chat and concept panel layout
* `/student/quizzes`: quiz mode cards and recent attempts
* `/student/papers/upload`: upload dropzone and paper history shell
* `/student/mistakes`: categorized mistake list
* `/student/revision-plan`: timeline layout
* `/student/settings`: profile and preferences form

### Teacher pages

* `/teacher`: dashboard with quick actions and usage stats
* `/teacher/paper-studio`: drafts table and create CTA
* `/teacher/paper-studio/new`: blueprint builder shell
* `/teacher/question-bank`: search/filter/table shell
* `/teacher/uploads`: upload queue shell
* `/teacher/classes`: class list and analytics teaser
* `/teacher/analytics`: charts shell
* `/teacher/settings`: org and personal settings tabs

### Admin pages

* `/admin`: metrics strip and review queue summary
* `/admin/curriculum`: subject-tree explorer shell
* `/admin/documents`: ingest status table
* `/admin/questions`: reviewable question table
* `/admin/review-queue`: moderation queue shell
* `/admin/organizations`: org list and member counts
* `/admin/evals`: eval run list and placeholder charts

## 19. Design system direction for Sprint 1

Keep the UI aligned with the blueprint's premium direction from day one.

Use:

* dark graphite background with restrained glow accents
* strong subject color coding
* large rounded containers
* dense desktop layouts for teacher/admin
* mobile-first bottom navigation for student

Avoid in Sprint 1:

* default white-card SaaS look
* generic Inter-only visual identity if a more expressive display font is used for headings
* over-animated dashboards before base flows exist

Suggested font pairing:

* headings: `Space Grotesk`
* body: `Manrope`

## 20. API contract stubs to ship in Sprint 1

Implement request/response schemas now, even if service logic is mocked.

### Auth schemas

* `SignupRequest`
* `LoginRequest`
* `AuthTokensResponse`
* `CurrentUserResponse`

### Curriculum schemas

* `SubjectListItem`
* `ChapterListItem`
* `SubjectListResponse`
* `ChapterListResponse`

### Common schemas

* `HealthResponse`
* `MessageResponse`
* `ErrorResponse`

## 21. Seed data targets for Sprint 1

Create seed scripts for only the minimum CBSE curriculum shell:

* board: CBSE
* classes: 11 and 12
* subjects: Physics, Chemistry, Mathematics, Biology
* 3-5 starter chapters per subject for UI and API testing

Do not wait for full syllabus completeness to unblock the frontend. The seed set only needs enough data to validate hierarchy and navigation.

## 22. CI pipeline

Create `.github/workflows/ci.yml` with these jobs:

* web lint
* web typecheck
* api lint
* api tests
* worker lint
* docker compose config validation

Initial trigger:

* pull requests
* pushes to `main`

## 23. Sprint 1 acceptance criteria

Sprint 1 is complete when:

* `docker compose up --build` starts `web`, `api`, `worker`, `postgres`, `redis`, `minio`, and `mailhog`
* `GET /health` returns healthy
* signup and login work against the database
* protected layouts exist for student, teacher, and admin
* seeded subjects and chapters render in API and web shells
* root navigation across public and protected route stubs works
* Alembic migrations run cleanly from empty database
* CI passes on a clean checkout

## 24. Delivery checklist

Before closing Sprint 1, verify:

* `.env.example` is complete
* `.env` local setup instructions are documented
* all app services build through Docker
* no page has an unstyled blank state
* route guards fail safely
* DB migrations are idempotent on fresh environments
* at least one seed command exists and is documented

## 25. First 30 Codex prompts/tasks

Use these sequentially. Each line should become a separate implementation task or Codex prompt.

1. Initialize a `pnpm` + `turbo` monorepo with `apps/web`, `apps/api`, `apps/worker`, and `packages/ui`, `packages/config`, `packages/types`.
2. Add root workspace files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example`, and `Makefile`.
3. Scaffold `apps/web` with Next.js App Router, Tailwind, and TypeScript configured for the monorepo.
4. Scaffold `apps/api` with FastAPI, `src/main.py`, router registration, and a working `/health` endpoint.
5. Scaffold `apps/worker` with a runnable Python entrypoint and placeholder job module.
6. Add `infra/docker/web/Dockerfile`, `infra/docker/api/Dockerfile`, and `infra/docker/worker/Dockerfile` for dev containers.
7. Create root `docker-compose.yml` with `web`, `api`, `worker`, `postgres`, `redis`, `minio`, and `mailhog`.
8. Add health checks and startup dependencies so `api` waits on Postgres readiness.
9. Set up shared environment parsing in `packages/config` for web and in Python config modules for API and worker.
10. Install and initialize shadcn/ui in `apps/web`.
11. Create shared UI primitives in `packages/ui`: `PageShell`, `SectionCard`, `StatCard`, `EmptyState`, and `GradientBadge`.
12. Create public route group pages for `/`, `/features`, `/pricing`, `/try`, `/teacher-tools`, `/schools`, `/login`, and `/signup`.
13. Create protected route group shells for student, teacher, and admin layouts with placeholder nav.
14. Implement a web-side auth store/provider with mocked session persistence first.
15. Add API auth models, password hashing helpers, and Pydantic request/response schemas.
16. Implement `POST /v1/auth/signup`, `POST /v1/auth/login`, and `GET /v1/auth/me`.
17. Add SQLAlchemy base setup, engine/session management, and Alembic configuration.
18. Create migration `0001_create_users_and_profiles`.
19. Create migration `0002_create_orgs_and_classes`.
20. Create migration `0003_create_curriculum_core`.
21. Add seed scripts for CBSE, classes 11/12, and four subjects with starter chapters.
22. Implement `GET /v1/subjects` and `GET /v1/subjects/{subject_id}/chapters`.
23. Build the student dashboard shell at `/student` with progress cards and recent activity placeholders.
24. Build the student tutor shell at `/student/tutor` with chat panel and context sidebar.
25. Build the teacher dashboard and paper studio index shells.
26. Build the admin curriculum shell with subject tree placeholder data.
27. Add route guards that redirect unauthenticated users and hide unauthorized nav items by role.
28. Add a GitHub Actions CI workflow for web lint/typecheck and API/worker lint/tests.
29. Document local setup in a root `README.md` with Docker-first startup steps.
30. Run the full local stack, verify container health, and fix any bootstrapping issues until a fresh clone can start cleanly.

## 26. Recommended Sprint 1 implementation order

Follow this order inside the sprint:

1. repo bootstrap
2. Docker and env wiring
3. API and worker skeletons
4. database and migrations
5. auth
6. shared UI and design tokens
7. public pages
8. protected layouts
9. curriculum seeds and endpoints
10. CI and documentation

## 27. Immediate artifact after Sprint 1

After Sprint 1 lands, the next document should be `Sprint-2-Tutor-and-Retrieval-Build-Sheet.md` covering:

* retrieval package structure
* prompt registry implementation
* tutor orchestration endpoint
* citation object contracts
* `ai_runs` write path
* first eval fixtures for tutor helpfulness and factuality
