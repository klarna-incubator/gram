# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Gram is Klarna's threat-model diagramming tool: a React frontend, Express + WebSocket backend, PostgreSQL store, structured as a Lerna/npm-workspaces monorepo. A more detailed agent-oriented brief lives in `AGENTS.md` — this file captures only the things that are non-obvious or easy to get wrong.

## Common commands

Setup (first time): `npm install && docker compose up -d && npm run build`.

| Task | Command |
|------|---------|
| Run full stack (backend + frontend) | `npm run dev` |
| Backend only | `npm run start-backend` (http://localhost:8080) |
| Frontend only | `npm run start-frontend` (http://localhost:4726) |
| Backend with debugger | `npm run debug` (Node `--inspect` on 127.0.0.1:9229) |
| Build API + app | `npm run build` |
| Build everything incl. plugins | `npm run build-all` |
| Lint / auto-fix | `npm run lint` / `npm run lint-fix` |
| All tests | `npm test` |
| Tests for one package | `npm -w @gram/api test` (or `@gram/core`, `@gram/app`) |
| Single backend test file | `npm -w @gram/api test -- path/to/file.spec.ts` |
| Single test by name | `npm -w @gram/api test -- -t "test name pattern"` |
| Connect to dev DB | `scripts/local-psql.sh` |
| Connect to test DB | `scripts/test-psql.sh` |

Backend tests are run with `--runInBand` and need the test postgres container (port 5433) up — `docker compose up -d` provides both dev (5432) and test (5433) databases.

## Critical workflow gotchas

- **`npm run dev` does not watch the backend.** It runs `build-backend` once, then starts the API from `dist/`. Any change under `api/` or `core/` requires restarting the dev process (and a rebuild happens at start). The frontend (CRA) hot-reloads normally.
- **First login is via magic link printed to stdout.** Default identity provider is `MagicLinkIdentityProvider`; SMTP isn't configured locally, so the login URL appears in the API logs (`MagicLinkIdentityProvider - Sending magic link ... link http://localhost:4726/login/callback/magic-link?token=...`). Hardcoded test users: `user@localhost`, `reviewer@localhost`, `admin@localhost`.
- **`NODE_ENV` selects which config file loads.** `config/default.ts` is the base; `development.ts`, `staging.ts`, `production.ts` override it. `npm run start-backend` forces `NODE_ENV=development`; tests force `NODE_ENV=test` (loads `config/test.json`).
- **The frontend dev server proxies `/api/*` to `http://localhost:8080`** (set via `proxy` in `app/package.json`). If you change the backend port, update that too.
- **Backend ESM imports must use `.js` extensions** even when importing TypeScript files (e.g. `import { foo } from "./bar.js"`). This is required by the ESM + ts-jest setup; the matching `moduleNameMapper` strips `.js` at test time.

## Architecture

The monorepo splits responsibilities across five workspaces:

- **`core/`** (`@gram/core`) — all backend domain logic: data services, auth, validation, suggestions, notifications, plugin registry, and database migrations (`core/src/data/migrations/*.sql`, applied automatically at boot via `postgres-migrations`). Exports the `DataAccessLayer` (DAL) and the `Bootstrapper`.
- **`api/`** (`@gram/api`) — Express app + WebSocket server. Thin layer: routers under `api/src/resources/gram/v1/<entity>/router.ts` are wired in `api/src/app.ts` and delegate to services on the DAL. Real-time collaborative editing lives in `api/src/ws/`.
- **`app/`** (`@gram/app`) — React 17 + Redux + Konva (canvas). Built with CRA / `react-scripts`. Diagram rendering uses Konva via `react-konva`.
- **`config/`** (`@gram/config`) — composition root. `default.ts` builds a `GramConfiguration` whose `bootstrapProviders(dal)` returns all providers (auth, systems, teams, reviewers, suggestion sources, validation rules, asset folders, component classes, search providers, resource providers). To add functionality, register it here.
- **`plugins/*`** — independently published packages (`@gram/aws`, `@gram/azure`, `@gram/cncf`, `@gram/github`, `@gram/jira`, `@gram/kubernetes`, `@gram/ldap`, `@gram/magiclink`, `@gram/oidc`, `@gram/stride`, `@gram/svgporn`, `@gram/threatlib`). They expose providers/component classes/assets/migrations consumed by `config/default.ts`.

### How a request flows

1. `api/src/index.ts` → `bootstrap()` (in `core/src/bootstrap.ts`) constructs the `DataAccessLayer`, runs DB migrations, then invokes `config.bootstrapProviders(dal)` and registers each provider through the `Bootstrapper` (see `core/src/Bootstrapper.ts`).
2. `createApp(dal)` mounts middleware (`metrics`, `validateToken`, `logger`, `authz`) and routers under `/api/v1`. Routes split into `unauthenticatedRoutes` (banners, menu, contact, `/auth/*`) and `authenticatedRoutes` (everything else, gated by `authRequiredMiddleware`).
3. Route handlers receive the DAL and call into `core/src/data/*/<Entity>DataService.ts` for persistence, or into handlers (`UserHandler`, `TeamHandler`, `SearchHandler`, `ResourceHandler`, `SuggestionEngine`, `ValidationEngine`) for non-DB logic.
4. WebSocket connections (`api/src/ws/`) attach to the same HTTP server and share the DAL — there's only one process; the app is **not horizontally scalable** (documented limitation).

### Plugins

A plugin is just an npm package consumed by `config/`. To install one: `npm -w config install @gram/<name>`, then import and register it in `config/default.ts`. Plugins can:

- Provide their own DB schema via `Bootstrapper.migrate(suffix, migrationsFolder)` + `Bootstrapper.getPluginDbPool(suffix)` (see `MagicLinkMigrations` in `config/default.ts`'s `additionalMigrations`).
- Register identity, system, user, team, reviewer, search, resource, validation, suggestion, or notification providers.
- Ship static assets and component classes for the diagram editor.

### DataAccessLayer

`DataAccessLayer` (in `core/src/data/dal.ts`) is the single dependency-injection seam: every router and handler takes it as a constructor argument. New backend features should be added as a new `*DataService` on the DAL plus a router under `api/src/resources/gram/v1/`, then mounted in `api/src/app.ts`.

## Tests

- Backend (`api`, `core`) use Jest with ts-jest ESM preset — note `NODE_OPTIONS=--experimental-vm-modules` and `--runInBand` in their `test` scripts. Tests hit the real test DB on port 5433.
- Frontend (`app`) uses Jest with `jsdom` and `jest-canvas-mock` (Konva needs canvas mocked).
- Test files live next to source as `*.spec.ts` / `*.spec.js`.
