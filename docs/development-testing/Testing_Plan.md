# Testing Plan: Maji Watch

## 1. Introduction
This document outlines the testing strategy for the Maji Watch system to ensure high reliability, security, and performance.

## 2. Testing Levels
### 2.1. Unit Testing
- **Focus**: Individual functions and components.
- **Tools**: Jest, Vitest.
- **Scope**: Password hashing logic, date formatting, validation helpers, utility functions.

### 2.2. Integration Testing
- **Focus**: Interaction between backend services and the database.
- **Tools**: Jest, Supertest.
- **Scope**: Authentication flow (login/register/refresh), report creation and status transitions, technician assignment logic.

### 2.3. End-to-End (E2E) Testing
- **Focus**: Full user journeys from the browser.
- **Tools**: Playwright.
- **Scope**: Citizen reporting flow, Admin dashboard filtering, Map interaction, Password reset flow.

### 2.4. Manual Testing
- **Focus**: UI/UX consistency, mobile responsiveness, and complex edge cases.
- **Scope**: Layout on various screen sizes, photo upload behavior on mobile, map gesture handling.

## 3. Key Test Cases
| ID | Feature | Description | Expected Result |
|---|---|---|---|
| **TC1** | Registration | Citizen registers with valid data. | Account created; JWT returned; Redirect to dashboard. |
| **TC2** | Reporting | Citizen submits report with photo and GPS. | Report appears on map; Admin receives notification. |
| **TC3** | Assignment | Admin assigns technician to a report. | Report status remains 'verified' (or changes); Audit log created. |
| **TC4** | Upvoting | User toggles upvote on a report. | Upvote count increments/decrements correctly. |
| **TC5** | PDF Export | Admin clicks export on filtered list. | Professional PDF generated and downloaded. |
| **TC6** | Security | User tries to access admin routes without role. | System returns 403 Forbidden. |

## 4. Test Environment
- **Database**: Dedicated PostgreSQL test instance (cleaned between runs).
- **API**: Node.js server running in 'test' mode.
- **Frontend**: Vite dev server with mocked API (where applicable).

## 5. Bug Reporting Process
1. **Detection**: Bug found during manual or automated testing.
2. **Logging**: Issue created with steps to reproduce, expected vs. actual behavior, and screenshots.
3. **Fixing**: Developer resolves the issue and adds a regression test.
4. **Verification**: QA/Peer reviews the fix and closes the issue.
