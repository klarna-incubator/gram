# AGENTS.md

This document provides essential information for autonomous AI agents working on the Gram codebase.

## Project Overview

Gram is Klarna's threat model diagramming tool—a web application for collaboratively creating threat models with dataflow diagrams. It consists of a React frontend, Express backend API, and shared core library using TypeScript and PostgreSQL.

**Repository**: git@github.com:klarna-incubator/gram.git

## Quick Start

### Setup

```bash
npm install
docker compose up -d
npm run build
npm run dev
```

This sequence:
1. Installs all dependencies for the monorepo workspace
2. Starts PostgreSQL containers for development and testing
3. Builds the API and frontend applications
4. Starts both backend API (http://localhost:8080) and frontend (http://localhost:4726)

### First Login

Use email `user@localhost` or `admin@localhost` (hardcoded test users by default). The login link will appear in application logs.

## Architecture

**Monorepo Structure** (Lerna + npm workspaces):
- `app/` - React frontend for threat modeling UI (Port 4726)
- `api/` - Express.js backend API (Port 8080)
- `core/` - Shared library with business logic, data access, validation
- `config/` - Configuration management and plugin loading
- `plugins/` - Optional plugins (GitHub, Jira, OIDC, LDAP, AWS, Azure, Kubernetes, etc.)

**Key Technologies**:
- TypeScript 5.2 with strict mode
- ESLint + Prettier for code quality
- Jest for testing
- PostgreSQL for data persistence
- Express + WebSocket for real-time collaboration
- React 17 + Redux for frontend state

## Development Commands

### Build & Compilation
```bash
npm run build              # Build API + App (main packages)
npm run build-backend      # Build only backend (API + core)
npm run build-all          # Build all packages including plugins
npm run clean              # Remove all build artifacts
```

### Running Locally
```bash
npm run dev                # Start backend API + frontend (parallel) - restart for backend changes
npm run start-backend      # Start API only (http://localhost:8080)
npm run start-frontend     # Start React app only (http://localhost:4726)
npm run debug              # Start backend with Node debugger (--inspect)
```

### Code Quality
```bash
npm run lint               # Check formatting and linting (all packages)
npm run lint-fix           # Auto-fix formatting issues
npm test                   # Run all tests (jest)
npm run snyk               # Security vulnerability scanning
```

### Database
Start services: `docker compose up -d`

Connect to development database:
```bash
scripts/local-psql.sh      # Development database
scripts/test-psql.sh       # Test database
```

## Testing

**Run all tests** (monorepo):
```bash
npm test
```

**Run tests for specific package**:
```bash
npm -w @gram/api test
npm -w @gram/app test
npm -w @gram/core test
```

**Tests are configured with**:
- Jest as test runner
- TypeScript support (ts-jest)
- Database isolation for integration tests (--runInBand, in-memory/test containers)
- 50+ test files across API and core packages
- Frontend tests with jsdom environment

Test locations:
- API: `api/src/**/*.spec.ts` (50+ files)
- App: `app/src/**` (jest config)
- Core: `core/src/**/*.spec.ts` (25+ files)

## Code Conventions

### Naming & Style
- **camelCase** for functions, variables, properties
- **PascalCase** for classes, interfaces, React components
- **CONSTANT_CASE** for constants
- Configured via ESLint @typescript-eslint/naming-convention
- Enforced by Prettier (2-space indentation)

### Commits
- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- Format: `type(scope): description`
- Example: `feat(api): add threat validation endpoint`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

### Pull Requests
- Keep changes focused (one feature/fix per PR)
- Include test cases for new features and bug fixes
- All tests must pass
- Code must follow existing style (run `npm run lint-fix` before pushing)

## Monorepo Commands

**Install/update dependencies**:
```bash
npm install                  # Install all workspace deps
npm -w @gram/api install     # Install in specific workspace
npm install <package>        # Add to root (shared)
npm install -w api <package> # Add to specific workspace
```

**Publishing packages** (release):
```bash
npm run version              # Lerna version bump with conventional commits
```

## Configuration

**Environment Variables**:

Copy `.env.example` to `.env` and fill in required values:
```bash
cp .env.example .env
```

See `.env.example` for complete list of environment variables including:
- **REQUIRED**: `NODE_ENV`, `ORIGIN`, `AUTH_SECRET`, Database credentials (POSTGRES_*)
- **OPTIONAL**: Email config (EMAIL_*), Sentry (SENTRY_DSN), Frontend (PORT, REACT_APP_VERSION)

The `config/` package loads environment-specific configurations:
- `config/default.ts` - Base configuration
- `config/development.ts` - Development overrides
- `config/staging.ts` - Staging overrides
- `config/production.ts` - Production overrides

**Set NODE_ENV** to load appropriate config:
```bash
NODE_ENV=development npm run dev
NODE_ENV=production npm run build
```

**Important Security Notes**:
- Never commit `.env` to version control (`.env` is in `.gitignore`)
- Generate a strong `AUTH_SECRET` for production: `openssl rand -base64 32`
- Use strong passwords for `POSTGRES_PASSWORD`
- Ensure `.env` contains no committed secrets

### Plugins

Add plugin to config:
```bash
npm -w config install @gram/<pluginname>
```

Then update `config/default.ts` to load the plugin.

Available plugins: GitHub, Jira, OIDC, LDAP, AWS, Azure, Kubernetes, Threat Library, STRIDE, CNCF, SVG Porn (logo library)

## Deployment

**Docker Build** (single container):
```bash
docker build -t gram:latest .
docker run -e POSTGRES_HOST=db -p 4726:4726 gram:latest
```

**Docker Compose** (demo):
```bash
docker-compose -f docker-compose.demo.yml up --build
```

Set environment variables before deployment. Application runs as single Express server with WebSocket support (not horizontally scalable yet).

## Debugging

**Backend debugging**:
```bash
npm run debug  # Starts with --inspect=127.0.0.1:9229
```

Use Chrome DevTools (chrome://inspect) or VS Code debugger.

**Logs**:
- Application logs appear in console during `npm run dev`
- Magic login link shown in debug logs: `[DEBUG] MagicLinkIdentityProvider - Sending magic link...`

**Database**:
```bash
docker compose up -d  # Start services
scripts/local-psql.sh # Connect to dev DB
scripts/test-psql.sh  # Connect to test DB
```

## Key Files & Paths

| Path | Purpose |
|------|---------|
| `package.json` | Root monorepo config (Lerna, workspaces) |
| `tsconfig.json` | TypeScript config with path aliases |
| `api/src/` | Backend API routes and logic |
| `app/src/` | React frontend components |
| `core/src/` | Shared business logic, data access |
| `config/` | App configuration and plugins |
| `plugins/*/` | Optional plugin implementations |
| `.github/workflows/` | CI/CD pipelines (test, lint, build) |
| `docker-compose.yml` | Local development services |

## Troubleshooting

**Tests fail with "lerna: command not found"**:
```bash
npm install  # Re-install node_modules
```

**Backend doesn't rebuild on changes**:
- `npm run dev` requires restart after backend changes
- Run `npm run build` manually then restart

**Cannot login (no magic link)**:
- Check console logs for the login URL
- Default test users: `user@localhost`, `reviewer@localhost`, `admin@localhost`

**Database connection issues**:
```bash
docker compose logs database  # View Docker logs
docker compose restart        # Restart services
docker compose down -v        # Remove containers and volumes
docker compose up -d          # Recreate fresh
```

**Port conflicts**:
- Frontend: http://localhost:4726 (set with PORT env var)
- Backend API: http://localhost:8080 (hardcoded in app proxy)
- Postgres dev: localhost:5432
- Postgres test: localhost:5433

## CI/CD

**Workflows** (.github/workflows/):
- `ci.yml` - Runs on all branches: install → build → test → lint
- `docker-publish.yml` - Publishes Docker image on tag (v*.*.*) to GHCR

**Pre-merge checks**:
- All tests pass
- Lint check passes
- Build succeeds

## Creating and Importing Threat Model JSON

Gram supports exporting and importing full threat models as JSON. When an AI agent generates or modifies a threat model JSON for import, it **must** conform to the schema validated by Zod in `api/src/resources/gram/v1/models/jsonTransferSchema.ts` and the business-logic checks in `core/src/data/models/ModelTransferService.ts`. The sections below summarise everything an agent needs to know.

### Top-level JSON structure

```json
{
  "metadata": { "schemaVersion": 1, "exportedAt": "<ISO8601>", "exportedBy": "<email>" },
  "model":     { "id": "<uuid>", "systemId": "<string|null>", "version": "<non-empty string>", "isTemplate": false, "shouldReviewActionItems": null },
  "modelData": { "components": [...], "dataFlows": [...] },
  "threats":   [...],
  "controls":  [...],
  "mitigations": [...],
  "suggestions": { "threats": [], "controls": [] },
  "links":     [],
  "flows":     [...],
  "resourceMatchings": [],
  "review":    null
}
```

### Component types (`modelData.components`)

| `type` | Meaning |
|--------|---------|
| `"ee"` | External Entity (actor or external system outside trust boundary) |
| `"proc"` | Process (internal service or application) |
| `"ds"` | Data Store (database, file store, cache) |
| `"tb"` | Trust Boundary (visual grouping box, no threat attachment) |

Required fields per component: `id` (UUID), `x` (number), `y` (number), `type`, `name`.
Optional: `width`, `height`, `description`, `classes`, `systems` (array of system-ID strings).

### Canvas coordinate system

- Component positions (`x`, `y`) are the top-left corner in canvas pixels.
- A typical canvas layout uses 100–200 px spacing between components.
- Trust boundary boxes use `width` and `height` to define their extent.
- Data flow `points` arrays are flat `[x1, y1, x2, y2, ...]` canvas coordinates that define waypoints **between** the start and end components. An empty array `[]` draws a straight line.

### Enum values — use exactly these strings

| Field | Valid values |
|-------|-------------|
| `threats[].severity` | `"informative"` `"low"` `"medium"` `"high"` `"critical"` |
| `suggestions[].status` | `"new"` `"rejected"` `"accepted"` |
| `review.status` | `"requested"` `"approved"` `"canceled"` `"meeting-requested"` |
| `links[].objectType` | `"model"` `"threat"` `"control"` `"system"` |
| `modelData.components[].type` | `"ee"` `"ds"` `"proc"` `"tb"` |

### Referential integrity rules (enforced by server)

1. All `id` fields must be valid UUID strings.
2. Every `dataFlow.startComponent.id` and `dataFlow.endComponent.id` must match a component `id` in `modelData.components`.
3. Every `threats[].componentId` and `controls[].componentId` must match a component `id` **or** a data flow `id` (threats/controls can be attached to either).
4. Every `mitigations[].threatId` must match a `threats[].id`; every `mitigations[].controlId` must match a `controls[].id`. There is **no skipping** — unresolvable mitigations throw an error.
5. Every `flows[].dataFlowId` must match a data flow `id`; every `flows[].originComponentId` must match a component `id`. Unresolvable flows also throw an error (unlike threats/controls which are skipped with a warning).
6. `metadata.schemaVersion` must be exactly `1`.

### Size constraint

The import handler enforces a **10 MB** limit on the payload (`importJson.ts`). The Express body parser allows **15 MB** (slightly higher so the handler's error message is displayed instead of a generic 413). Keep generated JSON files well under 10 MB.

For large models, reduce verbose descriptions or remove the optional `aiInstructions` block from `metadata` before importing. A safe rule of thumb: descriptions truncated to 350 characters and no `aiInstructions` will keep a 40-threat / 60-control model well under the limit.

### Validating a generated JSON before import

Use the Zod schema directly to pre-validate without running the server:

```bash
# Install zod v3 (matches Gram's pinned version) in a temp dir
mkdir -p /tmp/gram-validate && cd /tmp/gram-validate
npm init -y && npm install zod@3

# Then write a validate.js script that imports ModelJsonTransferPayloadSchema
# (replicate the schema from api/src/resources/gram/v1/models/jsonTransferSchema.ts)
node validate.js /path/to/your-model.json
```

A validation script template is kept at `/tmp/gram-validate/validate.js` from prior sessions; re-create it from the schema file if the temp directory has been cleaned.

### flows array

Each entry in `flows` describes one direction of a data flow from a given component's perspective:

```json
{
  "dataFlowId": "<uuid of the dataFlow>",
  "originComponentId": "<uuid of the component that initiates this flow direction>",
  "summary": "Short human-readable description",
  "attributes": {
    "protocols": ["HTTPS"],
    "authentication": ["OIDC"],
    "data_type": ["Personal Information"]
  }
}
```

Bidirectional data flows typically have **two** entries (one per direction, with different `originComponentId`).

## Additional Resources

- **Threat Modeling**: See [README.md](README.md) for feature overview
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
- **Deployment**: See [QuickStart.md](QuickStart.md) for deployment setup
- **Development Details**: See [Development.md](Development.md) for technical details
- **JSON Transfer Schema**: `api/src/resources/gram/v1/models/jsonTransferSchema.ts`
- **Import Service Logic**: `core/src/data/models/ModelTransferService.ts`
