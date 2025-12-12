# Auth & Role Verification Checklist

Use this script whenever you need to validate the Asgardeo-powered authentication flow locally, in QA, or after a deployment.

## 0. Prerequisites

- `backend/.env.local` and `hotel-booking-frontend/.env.local` contain valid `ASGARDEO_*` and `VITE_ASGARDEO_*` values.
- MongoDB (and Redis if you need notifications) is running via Docker: `docker compose up -d mongo redis`.
- Backend services are running (`npm run dev:core` or `npm run dev`).
- Frontend dev server is running at `http://localhost:5174`.
- You have three test users in Asgardeo (or role assignments you can toggle):
  - **User** role only
  - **Hotel Owner** role (must include `hotel_owner` claim)
  - **Admin** role (`admin` claim)

## 1. Smoke test (anonymous)

1. Open the frontend home page as an anonymous visitor.
2. Ensure navigation shows **Sign In / Register** CTAs and hides role-specific actions.
3. Run `curl http://localhost:7008/health` to confirm the gateway is reachable.

## 2. User journey (role: `user`)

1. Sign in with the user-only account.
2. Verify the header now shows profile/avatar plus **My bookings**.
3. Attempt to visit `/my-hotels` → expect a forbidden notice in UI (HTTP 403 from API).
4. Perform a hotel search and begin a booking to confirm API calls include the Bearer token (check browser devtools → request headers).
5. Sign out via the avatar menu and confirm the SDK redirects back to the home page.

## 3. Hotel owner journey (role: `hotel_owner`)

1. Sign in with the hotel owner account.
2. Confirm **Host your home** / **My hotels** links appear.
3. Navigate to `/my-hotels` and ensure the list loads (HTTP 200 from `hotel-service`).
4. Create or edit a hotel and save; API gateway logs should show forwarded headers (`x-user-id`, `x-user-roles`).
5. Confirm `/analytics` remains hidden unless the user also has `admin`.

## 4. Admin journey (role: `admin`)

1. Sign in with the admin account.
2. Open `/admin/users` and ensure the table loads.
3. Change another user’s role via the admin UI and verify the response reflects the new role.
4. Hit the protected admin endpoint directly to double-check headers:

   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:7008/api/admin/users | jq '.[0]'```

   (Use the access token from devtools → Application → Asgardeo session.)

## 5. Failure modes

- Kill the hotel-service process and attempt to access `/my-hotels`; confirm the frontend shows a service-unavailable message (gateway should return 502/504).
- Remove the `hotel_owner` role from the owner account in Asgardeo, wait 1 minute, and refresh `/my-hotels`; confirm access is revoked without redeploying.

## 6. Regression checklist

- [ ] Anonymous user can browse/search without auth headers.
- [ ] `user` role is blocked from owner/admin routes (403).
- [ ] `hotel_owner` role can manage hotels but not view admin dashboards.
- [ ] `admin` role can reach `/admin/users` and change roles.
- [ ] Sign-out clears the Asgardeo session and React Query cache (check console: `[auth] signed out`).
- [ ] Gateway forwards `x-user-id`/`x-user-email`/`x-user-roles` headers to downstream services (inspect service logs).

Record results in your QA doc or deployment log after each run.
