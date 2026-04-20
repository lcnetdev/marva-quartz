[![End to End Tests](https://github.com/lcnetdev/marva-quartz/actions/workflows/playwright.yml/badge.svg)](https://github.com/lcnetdev/marva-quartz/actions/workflows/playwright.yml) [![Unit Tests](https://github.com/lcnetdev/marva-quartz/actions/workflows/unit_tests.yml/badge.svg)](https://github.com/lcnetdev/marva-quartz/actions/workflows/unit_tests.yml)

## Marva

Marva is a Bibframe RDF XML editor.


### Documentation

- [Getting Started](https://github.com/lcnetdev/marva-quartz/wiki/Getting-Started)


---
### 🛠️ Local development

Use `scripts/docker-run.sh` from repo root. This wrapper picks the correct compose file and action:

```bash
sh scripts/docker-run.sh <dev|prod> [up|down|restart]
```

Examples:

```bash
# Start local development stack (docker-compose-dev.yaml)
sh scripts/docker-run.sh dev up

# Stop local development stack
sh scripts/docker-run.sh dev down

# Restart local development stack
sh scripts/docker-run.sh dev restart
```

Development mode starts:
- Marva dev server on `http://localhost:4444/marva/`
- `marva-keycloak-middleware` on `http://localhost:9401`

For production compose locally (`docker-compose.yaml`):

```bash
sh scripts/docker-run.sh prod up
```

### 🚀 Build and publish Docker images in GitHub Actions

Workflow: `.github/workflows/publish.yml`

Triggers:
- Push to `bluecore-main`
- Release published
- Manual `workflow_dispatch`

Images published to GHCR:
- `ghcr.io/blue-core-lod/marva:latest`
- `ghcr.io/blue-core-lod/marva-keycloak-middleware:latest`

Required repository secrets:
- `MARVA_KEYCLOAK_PATH`
- `MARVA_BLUECORE_API_PATH`

### ⚙️ Purpose of `marva-keycloak-middleware`

The middleware is a small Node service that sits in front of Marva util/api-style routes. It:
- handles Keycloak login/callback/refresh/logout endpoints under `/marva/util/auth/*`
- proxies allowed upstream Marva util routes
- provides controlled warning responses when optional upstreams are not configured
- centralizes auth/session behavior so the frontend can call a single middleware base path
