# Maji Watch: Complete Project Documentation

This file contains the combined documentation for the Maji Watch project, including the system overview, technical reference, business proposal, requirements, architecture, testing plan, and user manual.

---

## 1. System Overview (SYSTEM_DOCUMENTATION.md)

### Overview
Maji Watch is a comprehensive water access and quality monitoring system designed for Kenyan communities. It facilitates citizen reporting of water-related issues and enables county water authorities to manage, track, and resolve these issues efficiently.

### System Architecture
The system follows a classic client-server architecture:
- **Frontend**: A React-based Single Page Application (SPA) built with Vite and Tailwind-inspired custom styles.
- **Backend**: A Node.js Express API with TypeScript for robust type safety.
- **Database**: PostgreSQL with **PostGIS** extension for advanced geospatial data operations.
- **Storage**: Cloud-based storage (Supabase) for image uploads with local fallback.
- **Real-time**: **Socket.io** for live notifications across all user roles (Admin alerts for new reports, Technician alerts for assignments).

### Role-Based Portals
- **Citizen Portal**: For reporting issues, tracking status, and community upvoting.
- **Admin Dashboard**: For system oversight, data analytics, and technician management.
- **Technician Portal**: For field staff to receive real-time assignments and resolve infrastructure issues.

---

## 2. Technical Function Reference (FUNCTION_REFERENCE.md)

### Backend Services

#### Auth Service (`backend/src/services/auth.service.ts`)
- `registerCitizen(input)`: Registers citizens, hashes passwords (Bcrypt), issues JWTs.
- `loginUser(input)`: Authenticates any role, constant-time comparison for security.
- `rotateRefreshToken(token)`: Secure session rotation using DB transactions.

#### Reports Service (`backend/src/services/reports.service.ts`)
- `createReport(input)`: Persists reports with PostGIS geospatial data.
- `listReports(opts)`: Advanced filtering including proximity search (`ST_DWithin`) and category-based filtering for exports.
- `updateReportStatus(id, input)`: Transactional status updates with audit logging.
- `upvoteReport(id, citizenId)`: Idempotent community upvote toggle.
- `assignTechnician(reportId, technicianId)`: Triggers real-time Socket.io notifications to the assigned technician.

#### Technicians Service (`backend/src/services/technicians.service.ts`)
- `createTechnician(input)`: Orchestrates user creation and technician profiling.
- `listTechnicians(county)`: Lists technicians with active workload aggregation.

#### Upload Service (`backend/src/services/upload.service.ts`)
- `saveReportImages(reportId, files)`: Resizes (Sharp), strips EXIF, and uploads to storage.

### Frontend Logic

#### API Service (`frontend/src/services/api.ts`)
- `authApi`, `reportsApi`, `techniciansApi`: Axios-based modules with automatic JWT refresh interceptors and support for filtered PDF/CSV exports.

#### Auth Store (`frontend/src/context/auth.store.ts`)
- `useAuthStore`: Zustand store for session hydration, role-based routing, and profile management.

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
- Enhance transparency via public dashboards and modern UI/UX.

---

## 4. Functional Requirements (SRS) (Functional_Requirements.md)

### 1. User Authentication
- FR1.1: Citizen registration.
- FR1.2: Secure login for all roles.
- FR1.3: Multi-role support (Citizen, Admin, Technician).

### 2. Citizen Reporting
- FR2.1: Water issue submission with GPS pinning and photo support.
- FR2.4: Unique reference codes for tracking.

### 3. Community Engagement
- FR3.1: Upvoting reports to signal priority.
- FR3.2: Public dashboard for community transparency.

### 4. Admin Management
- FR4.1: Interactive map visualization (Leaflet).
- FR4.3: Report verification and resolution workflow.
- FR4.4: **Real-time Technician assignment**.

### 5. Technician Operations
- FR5.1: Real-time assignment notifications via Socket.io.
- FR5.2: Field task management and status resolution.

### 6. Analytics & Documentation
- FR6.1: Real-time dashboard stats and trends.
- FR6.2: Filtered CSV/PDF exports for reporting.
- FR6.3: Integrated System Engineering Manuals (SRS/SDD/PRD).

---

## 5. Non-Functional Requirements (SRS) (Non_Functional_Requirements.md)

### 1. Security
- NFR1.1: Bcrypt hashing (cost factor 12).
- NFR1.2: JWT with httpOnly refresh cookies for session security.
- NFR1.3: Role-Based Access Control (RBAC) enforced at API and UI levels.
- NFR1.4: EXIF metadata stripping from images for privacy.

### 2. UI/UX
- NFR2.1: Modern, "cool" aesthetic using card-based layouts and gradients.
- NFR2.2: Responsive design for field technician mobile use.

---

## 6. Product Requirements (PRD) (Product_Requirements_Document_PRD.md)

### Goals
- 30% increase in repair efficiency.
- <24h technician assignment time.
- 100% transparency for reported issue status.

### User Personas
- **Citizen (Jane)**: Needs intuitive reporting and tracking.
- **Admin (Peter)**: Needs oversight, workload management, and data exports.
- **Technician (Mwangi)**: Needs precise field data, real-time alerts, and simple resolution tools.

---

## 7. Technical Architecture (SDD) (Technical_Architecture_Description.md)

### Architecture Pattern
Service-Oriented Architecture (SOA) with distinct layers: Routes -> Controllers -> Services -> Database.

### Tech Stack
- **Frontend**: React (Vite), Zustand, React Query, Leaflet, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io, Sharp, pdf-lib.
- **Database**: PostgreSQL + PostGIS.

### Real-time Flow
1. Citizen submits report -> Admin receives `new_report` event.
2. Admin assigns technician -> Technician receives `technician_assigned_${id}` event.

---

## 8. User Manual & Documentation (User_Manual.md)

### For Citizens (Support Center)
1. **Quick Start**: Register, report issues using the map, and upload photos.
2. **Track**: Monitor "My Reports" for live status updates from the county.
3. **Engage**: Upvote community issues to prioritize infrastructure repairs.

### For County Admins (Command Center)
1. **Dashboard**: View real-time KPIs and infrastructure trends.
2. **Workflow**: Verify reports, assign to technicians, and monitor progress.
3. **Exports**: Generate filtered PDF/CSV reports for stakeholders.
4. **System Docs**: Access integrated project documentation via the system repository.

### For Technicians (Field Guide)
1. **Tasks**: Receive real-time alerts for new assignments.
2. **Navigation**: Use the interactive map to locate infrastructure issues.
3. **Resolve**: Mark tasks as resolved instantly from the field.
