# Asgardeo Integration Guide

This document explains how to configure Asgardeo for the Phoenix Booking stack (React SPA + Node microservices) and how to supply the required environment variables locally, in CI, and in production.

## 1. Prerequisites

- An Asgardeo tenant with permission to create applications and manage user roles.
- SPA redirect URLs for each environment:
  - Local dev: `http://localhost:5174`
  - Docker preview: `http://localhost:4173`
  - Staging/production: your deployed frontend URL
- The Phoenix Booking repo checked out locally with Node 18+ installed.

## 2. Create the SPA application in Asgardeo

1. Sign in to the Asgardeo console and select your tenant.
2. Navigate to **Applications → New Application → Single-Page Application**.
3. Give it a recognizable name (e.g., `phoenix-booking-spa`).
4. Under **Authorized redirect URLs**, add the URLs from the prerequisites for both sign-in and sign-out.
5. Under **Allowed origins**, add the same hostname(s) used by the SPA (localhost plus deployed hosts).
6. In **Allowed scopes**, include at minimum:
   - `openid`
   - `profile`
   - `email`
   - Any custom scopes that emit role claims if you modeled roles outside the default `roles`/`groups` claims.
7. Copy the generated **Client ID**, tenant domain, and organization URL. You will map these to env vars in the next step.

## 3. Map Asgardeo values to environment variables

| Purpose | Env var | Source |
| --- | --- | --- |
| SPA client ID | `VITE_ASGARDEO_CLIENT_ID` (frontend) / `ASGARDEO_CLIENT_ID` (backend) | Application → Client ID |
| Tenant/org URL | `VITE_ASGARDEO_BASE_URL`, `ASGARDEO_ORG_URL`, `ASGARDEO_TENANT_DOMAIN` | Application overview or tenant settings |
| Token issuer URL | `ASGARDEO_ISSUER` | Usually `https://api.asgardeo.io/t/<tenant>/oauth2/token` |
| JWKS endpoint | `ASGARDEO_JWKS_URL` | Usually `https://api.asgardeo.io/t/<tenant>/oauth2/jwks` |
| Redirect URLs | `VITE_ASGARDEO_SIGN_IN_REDIRECT`, `VITE_ASGARDEO_SIGN_OUT_REDIRECT` | Same values entered in the SPA app |
| Scopes | `VITE_ASGARDEO_SCOPES` | Space/CSV separated list (default `openid profile email`) |

Update the following files:

- `backend/.env.local` (or `.env.docker`) → set `ASGARDEO_*` vars for each runtime.
- `hotel-booking-frontend/.env.local` → set `VITE_ASGARDEO_*` vars for the SPA.
- CI/CD secret stores (e.g., GitHub Actions, Azure DevOps) → mirror the same values for automated builds and deployments.

## 4. User roles

The backend enforces three normalized roles: `user`, `hotel_owner`, and `admin`. Ensure that Asgardeo emits one of these values in at least one of the following claims:

- `roles`
- `groups`
- `http://wso2.org/claims/role`
- Any custom scope claim defined for your tenant

Tips:

- Create a custom attribute or role mapping in Asgardeo if your internal naming differs. Example: map `HotelOwner` to `hotel_owner` via attribute transformation rules.
- Assign the appropriate role to each test account before validating the flows locally.

## 5. Local configuration checklist

1. Copy the sample env files:

   ```bash
   cp backend/.env.example backend/.env.local
   cp hotel-booking-frontend/.env.example hotel-booking-frontend/.env.local
   ```

2. Fill in the `ASGARDEO_*` and `VITE_ASGARDEO_*` values.
3. Start Mongo/Redis via Docker if needed:

   ```bash
   docker compose up -d mongo redis
   ```

4. Run the backend services (`npm run dev:core`) and the frontend (`npm run dev` inside `hotel-booking-frontend`).
5. Sign in with an Asgardeo user and confirm that protected pages (e.g., `/my-hotels`, `/admin/users`) match the assigned roles.

## 6. Deploying to staging/production

- Store Asgardeo secrets (client ID, tenant, issuer, JWKS) in your cloud secret manager or CI/CD variable group.
- When deploying the SPA, ensure `VITE_ASGARDEO_SIGN_IN_REDIRECT` and `VITE_ASGARDEO_SIGN_OUT_REDIRECT` match the deployed hostname; Asgardeo will block the redirect otherwise.
- Each backend microservice reads the same `ASGARDEO_*` vars via Docker/Kubernetes manifests. Keep them synchronized across environments.
- For Kubernetes, apply `phoenix-booking-infra/k8s-manifests/09-asgardeo-config.yaml` and reference it via `envFrom` (already wired for identity, hotel, booking, and the API gateway).
- If you rotate the SPA Client ID or tenant, restart all services so `shared/auth/asgardeo.ts` reloads the updated values.

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Asgardeo configuration is incomplete` warning at startup | Missing `ASGARDEO_*` env vars | Re-check `backend/.env.*` files and redeploy |
| 401 responses from the API gateway after login | Token not signed by expected issuer or audience | Confirm `ASGARDEO_ISSUER` and `ASGARDEO_CLIENT_ID` match the SPA app |
| "Client Id is not present" error page in the hosted login | `VITE_ASGARDEO_CLIENT_ID` (or backend `ASGARDEO_CLIENT_ID`) is blank | Populate the env vars with the SPA's Client ID and restart `npm run dev` |
| Redirect loop after login | Redirect URL not on the allowed list | Add the URL to the Asgardeo application and redeploy |
| Roles not recognized | JWT lacks `hotel_owner`/`admin` claims | Update Asgardeo role assignments or mapping rules |

With this guide, your team should be able to reprovision Asgardeo, rotate credentials, and keep local/staging/prod environments in sync without digging through source files.
