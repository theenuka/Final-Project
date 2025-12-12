# Phoenix Booking – MERN microservices

A modern hotel booking platform with a React + Vite frontend and Node/Express microservices. Includes authentication, hotel search, owner management, and booking flows. Local setup uses MongoDB via Docker and an API Gateway in front of services.

## What’s inside

  - api-gateway (7008)
  - identity-service (auth/users, 7102)
  - hotel-service (hotels & owner ops, 7103)
  - search-service (search queries, 7105)
  - booking-service (7104)
  - notification-service (7101)

## Building release images (linux/amd64)

The kubeadm cluster runs on x86_64 EC2 nodes, so every image we push to Harbor must include a `linux/amd64` variant. GitHub Actions now enforces this via `docker buildx build --platform linux/amd64`. The CI/CD pipeline has been secured by removing insecure Docker Buildx configurations for Harbor, ensuring that all communications with the registry are performed over HTTPS with proper certificate validation.

You can produce the same artifacts locally with the helper script:

```bash
scripts/build-linux-amd64.sh frontend asgardeo-fix-amd64
```

The script wraps `docker buildx` for all services (pass `all` to rebuild everything) and pushes to Harbor by default. Set `PUSH=false` if you only need to load the resulting image into your local Docker daemon. Override `HARBOR_REGISTRY` or `PLATFORM` as needed.

- Frontend builds now use a runtime configuration. Environment variables are injected at runtime, not build time.
- GitHub Actions (`.github/workflows/build-and-deploy.yml`) builds a single image, and environment-specific variables are handled at runtime via Kubernetes deployments.

## Lint/build health checks

Every pull request now runs `scripts/run-ci-checks.sh`, which iterates through each backend service with `npm ci && npm run build` and finishes by linting + building the Vite frontend. Run the same script locally before pushing changes:

```bash
scripts/run-ci-checks.sh
```

Set `RUN_INSTALL=false` if you already installed dependencies and just want to re-run the builds (helpful for local iteration). The GitHub Action defined in `.github/workflows/ci.yml` caches each package-lock file, so CI catches type or lint issues before container builds kick off.

## Project structure

```
.
├─ docker-compose.yml              # MongoDB (27018 -> 27017 in container)
├─ package.json                    # Root scripts (dev, dev:core, seed, compose)
├─ scripts/
│  └─ seed-local.ts               # Seeds a user + a sample hotel (https image URLs)
├─ data/                           # Seed fixtures and sample images
├─ e2e-tests/                      # Playwright tests
├─ shared/
│  └─ types.ts                     # Shared TS types
├─ backend/
│  ├─ .env.example                 # Copy to .env.local and fill
│  └─ services/
│     ├─ api-gateway/              # Port 7008 (proxy to downstream services)
│     ├─ identity-service/         # Port 7102 (auth/users)
│     ├─ hotel-service/            # Port 7103 (hotels & owner ops)
│     ├─ booking-service/          # Port 7104 (optional locally)
│     ├─ search-service/           # Port 7105 (search queries)
│     └─ notification-service/     # Port 7101 (optional locally)
└─ hotel-booking-frontend/         # React + Vite app (5174)
```

## Scripts

From the repo root:

```
# Start core services (gateway, identity, hotel, search)
npm run dev:core

# Start all services (includes booking and notification)
npm run dev

# Kill any stray dev service ports
npm run kill:ports

# Seed a user and one hotel (expects Mongo on 27018)
npm run seed:local
```

## Quick start

Prereqs: Node 18+, Docker Desktop (for Redis and RabbitMQ if needed)

1) Create env files

- Backend (shared):

```bash
cp backend/.env.example backend/.env.local
```

Key fields in `backend/.env.local`:

```
MONGODB_CONNECTION_STRING=mongodb+srv://<USER>:<PASSWORD>@<HOST>/<DATABASE>?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5174
JWT_SECRET_KEY=dev_secret
...
```
**Note:** The in-cluster MongoDB has been removed in favor of an external, managed MongoDB service (like MongoDB Atlas or Amazon DocumentDB). You must provide a valid MongoDB connection string in the `MONGODB_CONNECTION_STRING` environment variable.

- Frontend:
  The frontend environment variables (VITE_*) are now configured at runtime. You do not need to create a `hotel-booking-frontend/.env.local` file for these variables when using Docker Compose. They are set directly in the `docker-compose.yml` file. If you are running the frontend directly (outside of Docker Compose), you can still use a `.env.local` file.

```bash
cp hotel-booking-frontend/.env.example hotel-booking-frontend/.env.local
```

`hotel-booking-frontend/.env.local` (for direct local frontend development, outside of Docker Compose):

```
VITE_API_BASE_URL=http://localhost:7008
VITE_ASGARDEO_CLIENT_ID=your-spa-client-id
VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/your-tenant
VITE_ASGARDEO_SIGN_IN_REDIRECT=http://localhost:5174
VITE_ASGARDEO_SIGN_OUT_REDIRECT=http://localhost:5174
VITE_ASGARDEO_SCOPES=openid profile email
```

3) Start core services (gateway, identity, hotel, search)

```bash
npm run kill:ports
npm run dev:core
```

4) Seed sample data (optional)

```bash
npm run seed:local
```

5) Start the frontend

```bash
cd hotel-booking-frontend
npm run dev
```

Open http://localhost:5174

### Configure Asgardeo (one-time)

1. In Asgardeo, create an SPA application and note the `Client ID`, tenant domain, and org URL.
2. Add `http://localhost:5174` to both authorized redirect URLs (sign-in and sign-out).
3. Under scopes, include at least `openid profile email` and any custom roles you rely on (e.g. `hotel_owner`, `admin`).
4. Copy the values into `backend/.env.local` (`ASGARDEO_*`) and `hotel-booking-frontend/.env.local` (`VITE_ASGARDEO_*`).
5. Assign roles to users in Asgardeo so the JWT contains `hotel_owner`, `admin`, or `user` claims for the new role-based gates.

## Docker (full stack)

Prefer an end-to-end containerized workflow? Every microservice now ships with a multi-stage Dockerfile and the root `docker-compose.yml` wires them together. This spins up Redis, RabbitMQ, all backend services, the API gateway, and the Vite/NGINX frontend with a single command. Note that MongoDB is now an external dependency and is not managed by Docker Compose.

1. Review/update `backend/.env.docker` (at minimum change `JWT_SECRET_KEY` and any third-party API keys).
2. Build the images (run from the repo root):

```bash
docker compose build
```

3. Start the full stack:

```bash
docker compose up -d
```

4. Visit the frontend at http://localhost:4173 (it talks to the gateway on http://localhost:7008).
5. Follow logs or stop the stack when you're done:

```bash
docker compose logs -f api-gateway
docker compose down        # keep volumes
docker compose down -v     # blow away Mongo/Redis data
```

Need to rebuild just one service? Swap the target name (e.g. `docker compose build hotel-service`). Want the frontend to hit a different gateway URL? You can override the environment variable for `VITE_API_BASE_URL` in your `docker-compose.override.yml`.

| Service | Container name | Exposed port | Dockerfile |
| --- | --- | --- | --- |
| API Gateway | api-gateway | 7008 | `backend/services/api-gateway/Dockerfile` |
| Identity Service | identity-service | 7102 | `backend/services/identity-service/Dockerfile` |
| Hotel Service | hotel-service | 7103 | `backend/services/hotel-service/Dockerfile` |
| Booking Service | booking-service | 7104 | `backend/services/booking-service/Dockerfile` |
| Search Service | search-service | 7105 | `backend/services/search-service/Dockerfile` |
| Notification Service | notification-service | 7101 | `backend/services/notification-service/Dockerfile` |
| Frontend | frontend | 4173 | `hotel-booking-frontend/Dockerfile` |
| Redis | hotel-booking-redis | 6379 | official `redis:7-alpine` image |
| RabbitMQ | hotel-booking-rabbitmq | 5672, 15672 | official `rabbitmq:3-management-alpine` image |

## Service map and routes

- Gateway 7008 proxies:
  - `/api/auth/*`, `/api/users/*` → identity-service (7102)
  - `/api/hotels/search` → search-service (7105)
  - `/api/hotels`, `/api/my-hotels` → hotel-service (7103)
- Identity service now exposes:
  - `POST /auth/request-verification`, `POST /auth/verify-email`
  - `POST /auth/request-password-reset`, `POST /auth/reset-password`
  - `POST /auth/refresh` (refresh token rotation)
  - Admin-only endpoints: `GET /admin/users`, `PATCH /admin/users/:id/role`
  - Every login/register response returns `{ accessToken, refreshToken, emailVerified }`
- Notification service now supports BullMQ-backed delivery with a Redis queue (`NOTIFICATION_QUEUE_MODE=queue`) and Twilio SMS in addition to SendGrid email. Without API keys/Redis it falls back to inline mocks and console logs.
- Authentication flows now run entirely through Asgardeo via `@asgardeo/auth-react`; the frontend requests tokens from the SDK and the gateway/backends validate them with the shared `shared/auth/asgardeo.ts` helper.
- CORS allows `FRONTEND_URL`.

## Troubleshooting

- Port already in use (EADDRINUSE):

```bash
npm run kill:ports
```

- Health checks:

```bash
curl -sS http://localhost:7008/health
curl -sS http://localhost:7102/health
curl -sS http://localhost:7103/health
curl -sS http://localhost:7101/health
curl -sS http://localhost:7105/health
```

- 504s from gateway usually mean a downstream service isn’t running yet.
- No hotel images? Ensure `imageUrls` exist or set Cloudinary vars and re-seed.
- Exit code 137/143 means a process was killed (often from port killers); restart with the scripts above.

## Notes

- This fork is branded “Phoenix Booking.” Update favicon/logo under `hotel-booking-frontend/public` if desired.
- The previous monolith and archived folders were removed to avoid duplication.

## License

MIT

---

Tip for teams: run “npm run setup:env” once to auto-create local env files from the provided examples. We intentionally do not commit .env.local files with secrets; use the examples and adjust locally.
