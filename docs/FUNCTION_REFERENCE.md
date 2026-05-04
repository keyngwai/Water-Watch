# Maji Watch Function Reference

This document provides a detailed technical reference for all major functions within the Maji Watch system.

## Backend Services

### Auth Service (`backend/src/services/auth.service.ts`)

#### `registerCitizen(input: RegisterInput): Promise<AuthSessionResult>`
- **Description**: Registers a new citizen user.
- **Process**:
  1. Checks if the email already exists.
  2. Hashes the password using `bcrypt` (12 rounds).
  3. Inserts the user into the `users` table with the 'citizen' role.
  4. Generates an access token and a refresh session.
- **Returns**: User object, access token, and raw refresh token.

#### `loginUser(input: LoginInput): Promise<AuthSessionResult>`
- **Description**: Authenticates a user for any role.
- **Process**:
  1. Retrieves user by email.
  2. Performs a constant-time bcrypt comparison (even if user doesn't exist) to prevent timing attacks.
  3. Verifies account is active.
  4. Updates `last_login_at`.
  5. Generates tokens.
- **Returns**: User object and tokens.

#### `rotateRefreshToken(rawToken: string): Promise<...>`
- **Description**: Rotates an existing refresh token for a new one.
- **Security**: Uses a database transaction and `FOR UPDATE` lock to prevent race conditions or replay attacks.

---

### Reports Service (`backend/src/services/reports.service.ts`)

#### `createReport(input: CreateReportInput): Promise<ReportRow>`
- **Description**: Creates a new water issue report.
- **Fields**: Category, severity, title, description, coordinates, county, etc.
- **Triggers**: Database triggers automatically generate a `reference_code` and populate the `location_geom` (PostGIS) column.

#### `listReports(opts: ListReportsOptions): Promise<...>`
- **Description**: Fetches public reports with advanced filtering.
- **Key Feature**: Proximity search using `ST_DWithin` if `lat`, `lng`, and `radius_km` are provided.

#### `updateReportStatus(reportId: string, input: UpdateStatusInput): Promise<ReportRow>`
- **Description**: Updates the status of a report (e.g., to 'verified' or 'resolved').
- **Integrity**: Validates the state transition (e.g., cannot go from 'resolved' back to 'reported'). Creates an entry in `admin_actions` for auditing.

#### `upvoteReport(reportId: string, citizenId: string): Promise<...>`
- **Description**: Toggles an upvote for a report by a citizen.
- **Logic**: If an upvote exists, it is removed; otherwise, it is added. The `upvote_count` on the `reports` table is updated atomically.

---

### Technicians Service (`backend/src/services/technicians.service.ts`)

#### `createTechnician(input: CreateTechnicianInput): Promise<...>`
- **Description**: Orchestrates the creation of a technician.
- **Steps**: Calls `authService.createAdminUser` first, then inserts specific technician details into the `technicians` table.

#### `listTechnicians(county?: string): Promise<...>`
- **Description**: Lists technicians, optionally filtered by county.
- **Aggregation**: Includes a `active_assignments` count by joining with the `reports` table where status is 'in_progress'.

---

### Upload Service (`backend/src/services/upload.service.ts`)

#### `saveReportImages(reportId: string, files: Express.Multer.File[]): Promise<...>`
- **Description**: Processes and stores multiple images for a report.
- **Workflow**:
  1. Resizes and compresses images using `sharp` (WebP format, max 1200px width/height).
  2. Strips EXIF data for user privacy.
  3. Uploads to Supabase Storage.
  4. Stores image metadata and public URLs in the `report_images` table.

#### `deleteReportImage(imageId: string, reportId: string): Promise<void>`
- **Description**: Removes an image from storage and the database.
- **Verification**: Ensures the image belongs to the specified report before deletion.

---

## Frontend Logic

### API Service (`frontend/src/services/api.ts`)

#### `authApi`
- **`register(data)`**: Creates a citizen account.
- **`login(email, password)`**: Authenticates and receives access token + refresh cookie.
- **`forgotPassword(email)`**: Requests a password reset link.
- **`resetPassword(token, newPassword)`**: Completes the password reset process.
- **`logout()`**: Clears local storage and calls the logout endpoint to revoke the refresh token.

#### `reportsApi`
- **`list(filters)`**: Fetches public reports with pagination and search criteria.
- **`getById(id)`**: Fetches a single report with its timeline and images.
- **`create(formData)`**: Submits a new report using `multipart/form-data` for image support.
- **`getMyReports(filters)`**: Fetches reports submitted by the logged-in citizen.
- **`upvote(id)`**: Toggles an upvote on a report.
- **`getStats(filters)`**: (Admin) Fetches dashboard statistics.
- **`exportCsv(filters)` / `exportPdf(filters)`**: (Admin) Downloads filtered reports in CSV or PDF format.

#### `techniciansApi`
- **`list(county)`**: Fetches a list of technicians, optionally filtered by county.
- **`create(data)`**: Adds a new technician profile and user account.
- **`delete(id)`**: Removes a technician.

### Auth Store (`frontend/src/context/auth.store.ts`)

#### `useAuthStore` (Zustand)
- **State**: `user`, `token`, `isAuthenticated`, `isLoading`.
- **Actions**:
  - `login(email, password)`: Orchestrates API call and state updates.
  - `logout()`: Resets state and clears storage.
  - `initFromStorage()`: Hydrates state from `localStorage` on startup.

---

## Utility Functions

### Backend Utils

#### `buildReportPdfBytes(rows, stats)` (`backend/src/utils/reportExportPdf.ts`)
- **Description**: Generates a professional PDF document.
- **Library**: `pdf-lib`.
- **Content**: Summary stats, pie charts (simulated or drawn), and a detailed table of report entries.

#### `emitNotification(event, data)` (`backend/src/utils/socket.ts`)
- **Description**: Broadcasts real-time updates via Socket.io.
- **Events**: `new_report`, `status_updated`.

#### `parsePagination(pageStr, limitStr)` (`backend/src/utils/response.ts`)
- **Description**: Normalizes query parameters into numeric `page`, `limit`, and `offset` for SQL queries.
- **Defaults**: Page 1, Limit 10.

#### `sendSuccess(res, data, message, code, meta)` (`backend/src/utils/response.ts`)
- **Description**: Standardizes the JSON response format across all API endpoints.

---

### Database Helpers (`backend/src/config/database.ts`)

#### `query<T>(text, params): Promise<T[]>`
- **Description**: Thin wrapper around `pg.Pool.query`.
- **Logging**: Automatically logs query duration and row counts for performance monitoring.

#### `queryOne<T>(text, params): Promise<T | null>`
- **Description**: Helper that returns the first row of a query result or `null` if empty.

#### `withTransaction<T>(callback): Promise<T>`
- **Description**: Executes a callback within a managed SQL transaction (`BEGIN` / `COMMIT` / `ROLLBACK`).
- **Resource Management**: Ensures the database client is released back to the pool even if the transaction fails.

---

### Frontend Hooks
- `useAutoLocationFields(form)`: (See above)

### Map Components (`frontend/src/components/shared/Map.tsx`)

#### `ReportMap`
- **Description**: Displays multiple reports on an interactive map.
- **Features**:
  - Custom colored markers based on report status.
  - "Fly-to" animation when a report is selected.
  - Optional radius circle for proximity-based views.
  - Popups with report summaries and status badges.

#### `LocationPicker`
- **Description**: Allows citizens to manually select a location on a map when submitting a report.
- **Logic**: Captures click events and returns the selected latitude/longitude to the parent form.
