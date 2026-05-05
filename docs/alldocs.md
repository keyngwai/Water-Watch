# Maji Watch: Complete Project Documentation

This file contains the combined documentation for the Maji Watch project, including the system overview, technical reference, business proposal, requirements, architecture, testing plan, and user manual.

---

## 1. System Overview (SYSTEM_DOCUMENTATION.md)

### Overview
Maji Watch is a comprehensive water access and quality monitoring system designed for Kenyan communities. It facilitates citizen reporting of water-related issues and enables county water authorities to manage, track, and resolve these issues efficiently.

### System Architecture
The system follows a classic client-server architecture:
- **Frontend**: A React-based Single Page Application (SPA).
- **Backend**: A Node.js Express API.
- **Database**: PostgreSQL with PostGIS extension for geospatial data.
- **Storage**: Supabase Storage (or local storage fallback) for image uploads.
- **Real-time**: Socket.io for live notifications.

### Backend Documentation
#### Backend Services
- **auth.service.ts**: Handles authentication, registration, and token management.
- **reports.service.ts**: Core business logic for report creation, listing, and status updates.
- **technicians.service.ts**: Manages field technician profiles and workloads.
- **upload.service.ts**: Handles image processing and storage.

#### Backend Controllers
- **auth.controller.ts**: Auth-related HTTP endpoints.
- **reports.controller.ts**: Report-related HTTP endpoints.
- **technicians.controller.ts**: Technician-related HTTP endpoints.

### Frontend Documentation
- **Zustand**: Global state for auth and user profile.
- **React Query**: Server state management for reports and technicians.
- **Leaflet**: Interactive mapping for report visualization.

---

## 2. Technical Function Reference (FUNCTION_REFERENCE.md)

### Backend Services

#### Auth Service (`backend/src/services/auth.service.ts`)
- `registerCitizen(input)`: Registers citizens, hashes passwords (Bcrypt), issues JWTs.
- `loginUser(input)`: Authenticates any role, constant-time comparison for security.
- `rotateRefreshToken(token)`: Secure session rotation using DB transactions.

#### Reports Service (`backend/src/services/reports.service.ts`)
- `createReport(input)`: Persists reports with PostGIS geospatial data.
- `listReports(opts)`: Advanced filtering including proximity search (`ST_DWithin`).
- `updateReportStatus(id, input)`: Transactional status updates with audit logging.
- `upvoteReport(id, citizenId)`: Idempotent community upvote toggle.

#### Technicians Service (`backend/src/services/technicians.service.ts`)
- `createTechnician(input)`: Orchestrates user creation and technician profiling.
- `listTechnicians(county)`: Lists technicians with active workload aggregation.

#### Upload Service (`backend/src/services/upload.service.ts`)
- `saveReportImages(reportId, files)`: Resizes (Sharp), strips EXIF, and uploads to storage.

### Frontend Logic

#### API Service (`frontend/src/services/api.ts`)
- `authApi`, `reportsApi`, `techniciansApi`: Axios-based modules with automatic JWT refresh interceptors.

#### Auth Store (`frontend/src/context/auth.store.ts`)
- `useAuthStore`: Zustand store for session hydration and profile management.

---

## 3. Project Proposal (Project_Proposal.md)

### 1. Project Overview
Digital platform bridging citizens and county water authorities for real-time infrastructure reporting and resolution.

### 2. Problem Statement
Fragmented reporting and lack of precise location data lead to delayed water infrastructure repairs in Kenya.

### 3. Project Objectives
- Empower citizens with mobile/web reporting.
- Improve accountability via status tracking.
- Optimize resource allocation for authorities.
- Enhance transparency via public dashboards.

### 4. Proposed Solution
Full-stack web app with Citizen Portal, Admin Dashboard, PostGIS mapping, and real-time Socket.io alerts.

---

## 4. Functional Requirements (SRS) (Functional_Requirements.md)

### 1. User Authentication
- FR1.1: Citizen registration.
- FR1.2: Secure login for all roles.
- FR1.3: Multi-role support (Citizen, Admin, Technician).

### 2. Citizen Reporting
- FR2.1: Water issue submission.
- FR2.2: GPS and photo support.
- FR2.4: Unique reference codes.

### 3. Community Engagement
- FR3.1: Upvoting reports.
- FR3.2: Public dashboard.

### 4. Admin Management
- FR4.1: Interactive map visualization.
- FR4.3: Report verification and resolution workflow.
- FR4.4: Technician assignment.

### 6. Analytics
- FR6.1: Real-time dashboard stats.
- FR6.2: CSV/PDF exports.

---

## 5. Non-Functional Requirements (SRS) (Non_Functional_Requirements.md)

### 1. Security
- NFR1.1: Bcrypt hashing (cost factor 12).
- NFR1.2: JWT with httpOnly refresh cookies.
- NFR1.3: Role-Based Access Control (RBAC).

### 2. Performance
- NFR2.1: <300ms API response time.
- NFR2.2: Support for 100+ concurrent users.

### 3. Scalability
- NFR3.1: Horizontal scaling of Express API.
- NFR3.3: External cloud storage (Supabase).

---

## 6. Product Requirements (PRD) (Product_Requirements_Document_PRD.md)

### Goals
- 30% increase in repair efficiency.
- 5,000+ active users in 6 months.
- <24h technician assignment time.

### User Personas
- **Citizen (Jane)**: Needs simple reporting and tracking.
- **Admin (Peter)**: Needs centralized oversight and workload management.
- **Technician (Mwangi)**: Needs precise location and issue details.

### Key Features (MVP)
- Interactive Map, Report Submission, Upvoting, Admin Dashboard, Audit Log, PDF/CSV Export.

---

## 7. Technical Architecture (SDD) (Technical_Architecture_Description.md)

### Architecture Pattern
Service-Oriented Architecture (SOA) with Routes -> Controllers -> Services -> Database layers.

### Tech Stack
- React, Node/Express, PostgreSQL/PostGIS, Zustand, React Query, Socket.io, pdf-lib.

### Data Models
- Users, Reports, Technicians, Admin Actions (Audit Log).

### Security
- Secure JWT flow, Bcrypt, Input Validation, CORS/Helmet.

---

## 8. Testing Plan (Testing_Plan.md)

### Testing Levels
- **Unit**: Individual functions (Jest/Vitest).
- **Integration**: Service/DB interaction (Supertest).
- **E2E**: Full user journeys (Playwright).
- **Manual**: UI/UX and mobile responsiveness.

### Key Test Cases
- Registration, Reporting, Assignment, Upvoting, PDF Export, Security/RBAC.

---

## 9. User Manual (User_Manual.md)

### For Citizens
1. **Register/Login**: Create account and sign in.
2. **Report**: Use the map or GPS to pin issues and upload photos.
3. **Track**: Check "My Reports" for status updates.
4. **Upvote**: Prioritize issues in your community.

### For County Admins
1. **Dashboard**: View high-level KPIs and trends.
2. **Manage**: Filter and verify reports on the map or list.
3. **Assign**: Route technicians to verified issues.
4. **Export**: Generate reports for briefings.
