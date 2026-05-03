# API Documentation

## Overview

Selected endpoint examples used in implementation marking and demos.

## Endpoints

### Auth

- `POST /api/auth/login` / `POST /api/auth/register`
  - JSON body returns `{ user, token }` where `token` is the **access** JWT (short TTL, default `JWT_EXPIRES_IN`).
  - Response also sets httpOnly cookie `maji_refresh` (opaque refresh token; server stores SHA-256 hash in `refresh_sessions`).
  - SPA clients should use `credentials: 'include'` / axios `withCredentials: true` against the same site or a proxied `/api` origin so the cookie is stored.
- `POST /api/auth/refresh`
  - Uses `maji_refresh` cookie; rotates refresh token and returns `{ token }` (new access JWT).
- `POST /api/auth/logout`
  - Revokes the current refresh session (if cookie present) and clears `maji_refresh`.
- `POST /api/auth/forgot-password`
  - Body: `{ "email": "citizen@example.com" }`
  - Returns generic success message (anti-enumeration).
- `POST /api/auth/reset-password`
  - Body: `{ "token": "<token>", "new_password": "StrongPass1" }`
  - Returns success when token is valid and not expired/used.

### Admin Analytics

- `GET /api/reports/admin/stats?status=reported&start_date=2026-04-01&end_date=2026-04-30`
  - Filters stats to reported issues within April 2026.
- `GET /api/reports/admin/stats?county=Nairobi&status=resolved`
  - Returns only resolved reports for Nairobi.

### Admin Export

- `GET /api/reports/admin/export.csv?start_date=2026-01-01&end_date=2026-05-01`
  - Downloads CSV for offline analysis.
- `GET /api/reports/admin/export.pdf?county=Kisumu`
  - Downloads PDF summary for presentation/briefing.

## Query Interpretation Notes

- **High `reported`, low `in_progress`:** likely assignment bottleneck.
- **High `rejected`:** likely poor report quality or duplicate submissions; improve user guidance.
- **County with unusually high counts:** prioritize field staff and resource allocation there.
- **Falling `dailyTrend` after interventions:** may indicate successful remediation.
