# Marking Scheme Test Evidence (Implementation Awards)

This document maps the project tests and verification evidence directly to the COMP 493 implementation marking areas.

## How to Execute Tests

- Backend unit/integration tests: `cd backend && npm test`
- Backend build validation: `cd backend && npm run build`
- Frontend build validation: `cd frontend && npm run build`
- CI validation: push branch / open PR to trigger `.github/workflows/ci.yml`

## Evidence Matrix by Rubric Item

## 1) User Interface

- **Evidence:** Functional role-based pages and password reset views:
  - `frontend/src/pages/ForgotPassword.tsx`
  - `frontend/src/pages/ResetPassword.tsx`
  - `frontend/src/App.tsx` (public routes)
- **Verification:** Manual UI walkthrough:
  - Navigate to `/forgot-password`
  - Submit valid email
  - Open reset link with token query parameter
  - Submit new password and confirm redirect to login
- **Proof to collect:** Screenshots for each step + success toast.

## 2) Functional Components (Databases, Tables, Reports, Queries, Forms)

- **Database/Table evidence:**
  - `backend/migrations/004_password_resets.sql`
  - `backend/migrations/run.ts`
- **Form/Query evidence:**
  - `backend/src/routes/auth.routes.ts`
  - `backend/src/controllers/auth.controller.ts`
  - `backend/src/services/auth.service.ts`
- **Automated checks:**
  - `auth.routes.integration.test.ts` validates form payload and endpoint behavior.
  - `auth.service.test.ts` validates token and password update behavior.
- **Proof to collect:** migration output showing `004_password_resets.sql` applied.

## 3) Transaction Applications (Programs, Online Help, Module Documentation)

- **Program/module evidence:** Reset flow as complete backend program path:
  - route -> controller -> service -> database transaction.
- **Transaction integrity evidence:**
  - `backend/src/services/auth.service.ts` (`BEGIN`, `COMMIT`, `ROLLBACK` in reset process).
- **Documentation evidence:** this file + `docs/development-testing/Test_Reports.md`.
- **Proof to collect:** test pass output and snippet of transaction logic.

## 4) Testing (Validation Checks)

- **Automated tests implemented:**
  - `backend/src/services/auth.service.test.ts`
  - `backend/src/routes/auth.routes.integration.test.ts`
- **Validation checks covered:**
  - invalid email format -> 422
  - weak password -> 422
  - invalid/expired token service error -> 400
  - valid payload path -> 200
- **CI enforcement:**
  - `.github/workflows/ci.yml` runs build + tests.

## 5) User Involvement (Data Capture, Data Analysis)

- **Data capture evidence:** Forgot/reset forms capture user email and new password.
- **Behavior evidence:** Generic forgot-password response avoids user-enumeration leakage for safer user interaction.
- **Proof to collect:** demo recording of user flow and logs of successful reset attempt.

## 6) Systems Security

- **Security controls verified:**
  - token expiry and one-time use enforcement (`password_resets.used`, `expires_at`)
  - strong password validation regex in `validation.middleware.ts`
  - non-disclosure response on forgot-password (`If the email exists...`)
- **Automated evidence:** tests for invalid token and weak password failures.

## 7) System Growth/Integrity

- **Integrity evidence:**
  - Migration-based schema evolution (`004_password_resets.sql`).
  - CI pipeline ensures repeatable checks on each push/PR.
  - `backend/src/app.ts` guarded startup (`require.main === module`) enables test-safe imports.
- **Proof to collect:** CI run status screenshots and passing pipeline logs.

## Test Case IDs (Current Executed Set)

- `TC-SEC-001` Forgot-password accepts valid email and returns generic success.
- `TC-VAL-001` Forgot-password rejects invalid email.
- `TC-SEC-002` Reset-password accepts valid token + strong password.
- `TC-SEC-003` Reset-password rejects invalid/expired token (AppError path).
- `TC-VAL-002` Reset-password rejects weak password format.
- `TC-INT-001` Service layer updates password and marks token(s) used transactionally.

## Recommended Submission Attachments

- Terminal output of:
  - `npm run migrate`
  - `npm test`
  - `npm run build` (backend + frontend)
- CI job screenshots from GitHub Actions.
- UI screenshots for forgot/reset flow.
- Short note mapping each screenshot/output to TC IDs above.
