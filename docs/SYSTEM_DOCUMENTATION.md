# Maji Watch System Documentation

## Overview
Maji Watch is a comprehensive water access and quality monitoring system designed for Kenyan communities. It facilitates citizen reporting of water-related issues and enables county water authorities to manage, track, and resolve these issues efficiently.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Backend Documentation](#backend-documentation)
    - [Services](#backend-services)
    - [Controllers](#backend-controllers)
    - [Middlewares](#backend-middlewares)
3. [Frontend Documentation](#frontend-documentation)
    - [State Management](#state-management)
    - [Pages & Components](#pages-and-components)
    - [Hooks](#hooks)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)

---

## System Architecture
The system follows a classic client-server architecture:
- **Frontend**: A React-based Single Page Application (SPA).
- **Backend**: A Node.js Express API.
- **Database**: PostgreSQL with PostGIS extension for geospatial data.
- **Storage**: Supabase Storage (or local storage fallback) for image uploads.
- **Real-time**: Socket.io for live notifications.

---

## Backend Documentation

### Backend Services

#### `auth.service.ts`
Handles all authentication and user management logic.
- `registerCitizen(input)`: Registers a new citizen. Hashes passwords using bcrypt.
- `loginUser(input)`: Authenticates users and returns access/refresh tokens.
- `rotateRefreshToken(token)`: Rotates JWT refresh tokens for secure long-lived sessions.
- `revokeRefreshToken(token)`: Invalidates a refresh token (logout).
- `requestPasswordReset(email)`: Generates a reset token and sends an email via Nodemailer.
- `resetPasswordWithToken(token, password)`: Updates password after verification of the reset token.
- `createAdminUser(input)`: Internal helper to create admin/technician accounts.

#### `reports.service.ts`
Core business logic for water issue reports.
- `createReport(input)`: Persists a new report with GPS coordinates.
- `getReportById(id, userId)`: Retrieves detailed report data, including images and timeline.
- `listReports(options)`: Paginated and filterable list of public reports (supports proximity search).
- `adminListReports(options)`: Admin-specific list with access to private reports and county-based filtering.
- `updateReportStatus(id, input)`: Transactional update of report status with audit log creation.
- `assignReportTechnician(id, input)`: Assigns a field technician to a report.
- `upvoteReport(id, citizenId)`: Toggles a community upvote on a report.
- `getFilteredReportStats(options)`: Generates analytics data for the admin dashboard.

#### `technicians.service.ts`
Manages field technician profiles.
- `createTechnician(input)`: Creates both a user account and a technician profile.
- `listTechnicians(county)`: Lists technicians with their current workload (active assignments).
- `getTechnicianById(id)`: Retrieves detailed technician profile.
- `deleteTechnician(id)`: Removes a technician and their associated user account.

#### `upload.service.ts`
Handles file uploads and image processing.
- `saveReportImages(reportId, files)`: Processes and stores multiple images for a report.
- `deleteReportImage(imageId, reportId)`: Removes an image from storage and database.

---

### Backend Controllers

#### `auth.controller.ts`
Exposes auth services via HTTP. Handles cookie management for refresh tokens.
- `register`, `login`, `logout`, `refresh`, `forgotPassword`, `resetPassword`.

#### `reports.controller.ts`
Handles report-related requests.
- `createReport`, `listReports`, `getMyReports`, `getReport`, `upvoteReport`.
- `adminListReports`, `updateReportStatus`, `assignTechnician`, `getStats`.
- `exportReportsCsv`, `exportReportsPdf`.

#### `technicians.controller.ts`
Handles technician-related requests.
- `createTechnician`, `listTechnicians`, `getTechnician`, `deleteTechnician`.

---

## Frontend Documentation

### State Management
- **Zustand**: Used for `auth.store.ts` to manage user authentication state, tokens, and profile data.
- **React Query**: Used for server state management (fetching, caching, and synchronizing reports, stats, and technicians).

### Pages and Components
- **LandingPage**: Public introduction to the system.
- **LoginPage / RegisterPage**: User authentication.
- **Citizen Dashboard**: Overview of reported issues and quick actions for citizens.
- **Admin Dashboard**: High-level analytics and KPIs for county admins.
- **MapView**: Interactive Leaflet map showing report clusters and details.
- **ReportDetail**: Deep dive into a single report, including timeline and images.

---

## Database Schema
The database consists of the following primary tables:
- `users`: Stores all users (citizens, admins, technicians).
- `reports`: Stores water issue reports with PostGIS geometry.
- `technicians`: Stores additional profile info for field staff.
- `report_images`: Stores metadata and links for uploaded photos.
- `admin_actions`: Audit log of all status changes and assignments.
- `report_upvotes`: Tracks community interest in specific reports.
- `refresh_sessions`: Stores hashed refresh tokens for secure auth.

---

## API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register citizen | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Refresh JWT | No (Cookie) |
| GET | `/api/reports` | List public reports | No |
| POST | `/api/reports` | Submit report | Yes (Citizen) |
| GET | `/api/reports/:id` | Get report details | No |
| PATCH | `/api/reports/:id/status` | Update status | Yes (Admin) |
| GET | `/api/technicians` | List technicians | Yes (Admin) |
