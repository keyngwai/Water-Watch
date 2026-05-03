# Testing Plan

## Overview

Testing uses a layered approach:
- Unit tests for service logic.
- Integration tests for API routes.
- Frontend component tests for critical user flows.
- E2E tests (Playwright) for browser-level confidence.

## Types of Testing

### 1) Backend Unit Tests (Jest)
- File: `backend/src/services/auth.service.test.ts`
- Focus:
  - reset token validation
  - password update transaction
  - failure handling for invalid token

### 2) Backend Integration Tests (Jest + Supertest)
- Files:
  - `backend/src/routes/auth.routes.integration.test.ts`
  - `backend/src/routes/reports.routes.integration.test.ts`
- Focus:
  - forgot/reset endpoint contract
  - validation errors
  - auth-required endpoint protection

### 3) Frontend Component Tests (Vitest + RTL)
- Files:
  - `frontend/src/pages/ForgotPassword.test.tsx`
  - `frontend/src/pages/ResetPassword.test.tsx`
- Focus:
  - form submission behavior
  - API call wiring

### 4) E2E Tests (Playwright)
- File: `e2e/auth-reset-flow.spec.ts`
- Focus:
  - forgot-password page load + submission path.

## Execution Commands

- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`
- E2E: `npm run test:e2e`
- Full verifier: `npm run verify:all`
