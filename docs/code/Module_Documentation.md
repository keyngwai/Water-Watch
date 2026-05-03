# Module Documentation

## Auth & Password Reset Module

- **Frontend files:**
  - `frontend/src/pages/ForgotPassword.tsx`
  - `frontend/src/pages/ResetPassword.tsx`
  - `frontend/src/services/api.ts`
- **Backend files:**
  - `backend/src/routes/auth.routes.ts`
  - `backend/src/controllers/auth.controller.ts`
  - `backend/src/services/auth.service.ts`
  - `backend/src/middlewares/validation.middleware.ts`
- **Database tables:**
  - `users`
  - `password_resets`
  - `security_events`

### Inputs

- Forgot password request body:
  - `email` (valid email required)
- Reset password request body:
  - `token` (string length 32-255)
  - `new_password` (min 8, must include uppercase/lowercase/number)

### Outputs

- Forgot password response:
  - `200` with generic message to avoid account enumeration.
- Reset password response:
  - `200` on success, with `{ reset: true }`.

### Error Cases

- `422 VALIDATION_ERROR` for malformed payloads.
- `400 INVALID_RESET_TOKEN` for invalid, expired, or already-used tokens.
- `429 RATE_LIMITED` for excessive reset attempts.

### Security Controls

- One-time reset tokens with expiration.
- Previous unused tokens invalidated when new token is issued.
- Password reset actions logged to `security_events`.
- Forgot/reset endpoints protected with auth rate limiter.

## Reports Analytics & Export Module

- **Frontend files:**
  - `frontend/src/pages/admin/Dashboard.tsx`
  - `frontend/src/services/api.ts`
- **Backend files:**
  - `backend/src/routes/reports.routes.ts`
  - `backend/src/controllers/reports.controller.ts`
  - `backend/src/services/reports.service.ts`
- **Database tables:**
  - `reports`
  - `users`

### Inputs

- Query filters:
  - `county` (optional)
  - `status` (optional)
  - `start_date` (optional ISO date)
  - `end_date` (optional ISO date)

### Outputs

- `GET /api/reports/admin/stats`
  - Returns `byStatus`, `byCategory`, `dailyTrend`, `byCounty`.
- `GET /api/reports/admin/export.csv`
  - Streams downloadable CSV report.
- `GET /api/reports/admin/export.pdf`
  - Streams downloadable PDF summary.

### Error Cases

- `401 AUTH_MISSING` without token.
- `403 AUTH_FORBIDDEN` for non-admin users.
- `422 VALIDATION_ERROR` for invalid query parameters.
