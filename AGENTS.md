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

**Environment Variables** (from config/ package):

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

Key env vars for deployment:
```
ORIGIN=http://localhost:4726
POSTGRES_HOST=localhost
POSTGRES_USER=gram
POSTGRES_PASSWORD=somethingsecret
POSTGRES_DATABASE=gram
NODE_ENV=development
AUTH_SECRET=<long-random-string>
```

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

## Additional Resources

- **Threat Modeling**: See [README.md](README.md) for feature overview
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
- **Deployment**: See [QuickStart.md](QuickStart.md) for deployment setup
- **Development Details**: See [Development.md](Development.md) for technical details
