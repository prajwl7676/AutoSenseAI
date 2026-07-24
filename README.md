# AutoSenseAI

> 🚧 **Under active development** — core domain and infrastructure are in place; AI features are up next.

AutoSenseAI is a fleet telemetry and predictive-maintenance platform. Vehicles stream sensor readings (engine temp, battery voltage, RPM, speed, fuel level) into the API, where they are stored, risk-scored, and — in upcoming phases — analyzed by an AI assistant built on LangChain.js / LangGraph.js.

## Tech Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **API:** NestJS 11 (TypeScript), TypeORM, PostgreSQL 16, Redis
- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Auth:** Keycloak 26 (OIDC) — next-auth v5 on the web, JWT/JWKS validation + role-based guards on the API
- **Infra:** Docker Compose (web, api, postgres, redis, keycloak)

## Repository Layout

```
apps/
  api/          # NestJS API (auth, fleet, telemetry modules)
    scripts/    # Telemetry simulator (seeds fleets/vehicles, generates time-series)
  web/          # Next.js frontend
packages/
  eslint-config/      # Shared ESLint config
  typescript-config/  # Shared tsconfig bases
keycloak/       # Realm import (autosense realm, clients, roles)
postgres-init/  # DB init scripts
Docs/           # PRD and design docs
workplan.md     # Detailed phased roadmap
```

## Current State

**Done**

- Monorepo tooling: Turborepo pipelines, ESLint 9, Prettier, husky + lint-staged
- Docker Compose stack with health-checked services and Keycloak realm auto-import
- Auth end-to-end: Keycloak realm, next-auth v5 sign-in flow with redirect for unauthenticated users, API JWT strategy (JWKS), `@Roles()` / `@Public()` decorators and guards
- Fleet domain: `Fleet`, `Vehicle`, `TelemetryReading`, `Alert`, `MaintenanceLog` entities with CRUD endpoints protected by RBAC
- Batch telemetry ingestion endpoint (`POST /telemetry`) with validated DTOs
- Telemetry simulator script (`pnpm --filter api simulate`) generating realistic readings with injected degradation patterns

**In progress / next** (see [workplan.md](workplan.md) for the full roadmap)

- Rule-based risk scoring service (thresholds + rolling z-scores → per-vehicle risk score + auto alerts)
- pgvector on the existing Postgres for embeddings
- AI layer: LangChain.js + LangGraph.js agent (Gemini), RAG over fleet data, LangSmith tracing/evals
- Frontend dashboard (currently a minimal status page)

## Getting Started

Prerequisites: Node 20+, pnpm 9, Docker.

```bash
pnpm install

# Full stack (web :3000, api :3001, keycloak :8080, postgres :5432, redis :6379)
docker compose up --build

# Or run apps locally against dockerized infra
pnpm dev
```

Environment: the compose file expects `AUTH_SECRET` (and optionally `KEYCLOAK_CLIENT_SECRET`) to be set. Keycloak admin console is at `http://localhost:8080` (admin / admin, dev only).

Seed data once the API is up:

```bash
pnpm --filter api simulate
```

## Scripts

| Command                      | Description                            |
| ---------------------------- | -------------------------------------- |
| `pnpm dev`                   | Run all apps in dev mode via Turborepo |
| `pnpm build`                 | Build all workspaces                   |
| `pnpm lint`                  | Lint all workspaces                    |
| `pnpm format`                | Prettier write across the repo         |
| `pnpm --filter api test`     | API unit tests (Jest)                  |
| `pnpm --filter api simulate` | Run the telemetry simulator            |

## License

See [LICENSE](LICENSE).
