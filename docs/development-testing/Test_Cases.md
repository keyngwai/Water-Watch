# Test Cases

## Overview

Executed and planned cases aligned to implementation rubric.

## Pass/Fail Table

| Test Case ID | Type | Description | Status |
|---|---|---|---|
| TC-AUTH-001 | API Integration | Forgot-password valid payload returns generic success | PASS |
| TC-AUTH-002 | API Integration | Forgot-password invalid email rejected (422) | PASS |
| TC-AUTH-003 | API Integration | Reset-password valid token + strong password succeeds | PASS |
| TC-AUTH-004 | API Integration | Reset-password invalid token returns INVALID_RESET_TOKEN | PASS |
| TC-AUTH-005 | API Integration | Reset-password weak password rejected (422) | PASS |
| TC-REP-001 | API Integration | Reports list invalid pagination rejected (422) | PASS |
| TC-REP-002 | API Integration | Admin stats endpoint requires auth (401) | PASS |
| TC-REP-003 | API Integration | Admin export CSV endpoint requires auth (401) | PASS |
| TC-FE-001 | Frontend Component | ForgotPassword submits email and shows success notice | PASS |
| TC-FE-002 | Frontend Component | ResetPassword submits token/password to API | PASS |
| TC-E2E-001 | E2E | Forgot-password page load and submission flow | PLANNED |

## Manual Evidence to Attach

- Screenshot of `npm --prefix backend test` passing.
- Screenshot of `npm --prefix frontend test` passing.
- Screenshot of exported CSV and PDF download from admin dashboard.
- Screenshot of forgot/reset password UX success messages.
