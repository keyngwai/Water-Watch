#  Maji Watch
### Water Access & Quality Monitoring System for Kenyan Communities

> A platform empowering citizens to report water issues and enabling county water authorities to respond with accountability and transparency.

---

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Examiner Verification Commands](#examiner-verification-commands)
- [Environment Variables](#environment-variables)
- [Deployment Guide](#deployment-guide)
- [Design Decisions](#design-decisions)

---

## Project Overview

Maji Watch addresses a critical infrastructure gap in Kenya: the lack of a structured, transparent system for citizens to report water-related problems to the relevant county water authorities.

**Citizens can:**
- Submit water issue reports with GPS coordinates, photos, and descriptions
- Track the status of their reports from submission to resolution
- Upvote community reports to signal priority

**County Water Authority Admins can:**
- View all reports on an interactive map
- Verify, reject, or escalate reports
- Assign qualified field technicians
- Update report status with public or internal notes
- View analytics on issue trends by category and county

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MAJI WATCH SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────┐          ┌──────────────────────────┐    │
│   │   React Frontend  │  HTTPS  │   Express.js REST API     │    │
│   │   (TypeScript)    │◄───────►│   (TypeScript, Node.js)  │    │
│   │                   │         │                           │    │
│   │  ┌─────────────┐  │         │  ┌────────────────────┐  │    │
│   │  │Citizen Portal│  │         │  │ Routes             │  │    │
│   │  │ - Submit     │  │         │  │ Controllers        │  │    │
│   │  │ - Track      │  │         │  │ Services           │  │    │
│   │  │ - Upvote     │  │         │  │ Middlewares        │  │    │
│   │  └─────────────┘  │         │  └────────────────────┘  │    │
│   │                   │         │           │               │    │
│   │  ┌─────────────┐  │         │           ▼               │    │
│   │  │Admin Portal  │  │         │  ┌────────────────────┐  │    │
│   │  │ - Dashboard  │  │         │  │  PostgreSQL         │  │    │
│   │  │ - Map View   │  │         │  │  (Supabase)        │  │    │
│   │  │ - Reports    │  │         │  │                    │  │    │
│   │  │ - Technicians│  │         │  │  + PostGIS for     │  │    │
│   │  └─────────────┘  │         │  │    spatial queries  │  │    │
│   └──────────────────┘          └──────────────────────────┘    │
│                                          │                        │
│                                          ▼                        │
│                                 ┌─────────────────┐              │
│                                 │ Supabase Storage │              │
│                                 │ (Image uploads)  │              │
│                                 └─────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Request → Rate Limiter → CORS → Helmet → Morgan Logger
       → JWT Auth Middleware → Role Authorization
       → Input Validation → Controller → Service → Database
       → Response / Error Handler
```

---

## Tech Stack

| Layer       | Technology          | Rationale                                          |
|-------------|---------------------|----------------------------------------------------|
| Frontend    | React 18 + TypeScript | Type safety, component reuse, ecosystem maturity |
| State       | Zustand + React Query | Simple auth state; server cache with React Query |
| Routing     | React Router v6     | Industry standard SPA routing                      |
| Map         | Leaflet + OpenStreetMap | Free, no API key required, offline-capable      |
| Backend     | Node.js + Express   | Lightweight, great PostgreSQL ecosystem            |
| Language    | TypeScript          | Type safety across the entire stack                |
| Database    | PostgreSQL (Supabase) | ACID compliance, PostGIS for geospatial queries  |
| Auth        | JWT (jsonwebtoken)  | Stateless auth suitable for distributed deployment |
| Images      | Multer + Sharp      | Server-side resizing, EXIF stripping for privacy   |
| Logging     | Winston             | Structured logs, multiple transports              |
| Validation  | express-validator   | Declarative input validation chains                |

---

## Database Schema

### Entity Relationship Overview

```
users (id, email, phone, full_name, password_hash, role, county, ...)
  │
  ├── reports (id, citizen_id→users, category, severity, status, lat, lng, ...)
  │     ├── report_images (id, report_id→reports, storage_key, public_url, ...)
  │     ├── admin_actions (id, report_id→reports, admin_id→users, action_type, ...)
  │     └── report_upvotes (citizen_id→users, report_id→reports)
  │
  └── technicians (id, user_id→users, employee_id, job_role, specialization, county, ...)
        └── reports.assigned_to → technicians.id
```

### Enums

```sql
user_role:     citizen | admin | technician
report_status: reported | verified | in_progress | resolved | rejected
issue_category: broken_borehole | contaminated_water | illegal_connection
                | water_shortage | unfair_pricing | pipe_burst
                | no_water_supply | other
severity_level: low | medium | high | critical
```

### Status State Machine

```
reported ──► verified ──► in_progress ──► resolved
    │            │              │
    └────────────┴──────────►  rejected
                                    │
                                    └──► verified (re-review allowed)
```

---

## API Documentation

**Base URL:** `http://localhost:3000/api`

**Authentication:** `Authorization: Bearer <jwt_token>`

---

### Auth Endpoints

#### `POST /api/auth/register`
Register a new citizen account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass1",
  "full_name": "John Kamau",
  "phone": "+254712345678",
  "county": "Nairobi"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "full_name": "John Kamau",
      "role": "citizen",
      "county": "Nairobi"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Account created successfully."
}
```

---

#### `POST /api/auth/login`
Login for all roles.

**Request Body:**
```json
{ "email": "john@example.com", "password": "SecurePass1" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "citizen", ... },
    "token": "eyJ..."
  }
}
```

---

#### `GET /api/auth/me`
Get authenticated user's profile. **Requires auth.**

---

### Reports Endpoints

#### `POST /api/reports`
Submit a water issue report. **Requires auth (citizen/admin).**

**Content-Type:** `multipart/form-data`

**Fields:**
```
category:      broken_borehole | contaminated_water | ... (required)
severity:      low | medium | high | critical (default: medium)
title:         string, 5–255 chars (required)
description:   string, 20–5000 chars (required)
latitude:      float, -4.72 to 5.02 (required)
longitude:     float, 33.9 to 41.9 (required)
county:        string (required)
location_name: string (optional)
sub_county:    string (optional)
ward:          string (optional)
images:        File[] up to 5 files, JPEG/PNG/WebP (optional)
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reference_code": "MJW-2024-00001",
    "status": "reported",
    "images": [{ "id": "uuid", "public_url": "https://...", "is_primary": true }],
    ...
  },
  "message": "Report MJW-2024-00001 submitted successfully."
}
```

---

#### `GET /api/reports`
List public reports. **No auth required.**

**Query Parameters:**
| Param       | Type    | Description                          |
|-------------|---------|--------------------------------------|
| `page`      | integer | Page number (default: 1)             |
| `limit`     | integer | Per page, max 100 (default: 20)      |
| `status`    | string  | Filter by status enum                |
| `category`  | string  | Filter by category enum              |
| `county`    | string  | Filter by county name                |
| `lat`       | float   | Center latitude for proximity search |
| `lng`       | float   | Center longitude for proximity search|
| `radius_km` | float   | Radius in km (requires lat/lng)      |
| `sort`      | string  | newest\|oldest\|severity\|upvotes    |

**Response `200`:**
```json
{
  "success": true,
  "data": [ ...reports ],
  "meta": {
    "page": 1, "limit": 20, "total": 143,
    "totalPages": 8, "hasNext": true, "hasPrev": false
  }
}
```

---

#### `GET /api/reports/:id`
Get single report with images and public timeline. **No auth required.**

---

#### `PATCH /api/reports/:id/status`
Update report status. **Requires admin.**

**Request Body:**
```json
{
  "status": "verified",
  "comment": "Confirmed by field inspection. Assigning technician.",
  "is_public": true,
  "technician_id": "uuid",
  "estimated_resolution_date": "2024-02-15"
}
```

---

#### `GET /api/reports/admin/all`
List all reports (no public filter). **Requires admin.**

#### `GET /api/reports/admin/stats`
Dashboard statistics. **Requires admin.**

**Response:**
```json
{
  "success": true,
  "data": {
    "byStatus": [{ "status": "reported", "count": "42" }, ...],
    "byCategory": [{ "category": "water_shortage", "count": "28" }, ...],
    "dailyTrend": [{ "date": "2024-01-15T00:00:00Z", "count": "7" }, ...]
  }
}
```

---

### Technicians Endpoints

#### `GET /api/technicians`
List all technicians. **Requires admin.**

#### `POST /api/technicians`
Register new technician. **Requires admin.**

```json
{
  "email": "james@county.go.ke",
  "password": "TempPass123",
  "full_name": "James Ochieng",
  "employee_id": "WB-2024-001",
  "job_role": "Field Technician",
  "department": "Borehole Services",
  "specialization": "Borehole Drilling",
  "county": "Kisumu",
  "phone": "+254723456789"
}
```

---

### Error Response Format

All errors follow a consistent structure:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "email": ["Must be a valid email address"],
    "latitude": ["Must be within Kenya bounds"]
  }
}
```

**Error Codes:**
| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_MISSING` | 401 | No token provided |
| `AUTH_EXPIRED` | 401 | Token has expired |
| `AUTH_INVALID` | 401 | Token is malformed |
| `AUTH_FORBIDDEN` | 403 | Insufficient role |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Supabase project)
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/your-org/maji-watch.git
cd maji-watch

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# Frontend
cd ../frontend
cp .env.example .env
# Edit VITE_API_BASE_URL if needed
```

### 3. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 4. Seed Initial Admin Account

```bash
# Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env first
npm run seed:admin
```

### 5. (Optional) Seed technicians by county & role

Creates **3 technicians per county** across all 47 counties, with rotating **job roles** (Field Technician, Water Quality Analyst, County Supervisor, etc.). Default password: `TechPass123`.

```bash
# From backend/ — run migrations first so `job_role` exists
npm run migrate
npm run seed:technicians
```

> Emails look like `tech.c0.0@majiwatch.seed`. Skip or edit `seed-technicians.ts` in production.

### 6. Start Development Servers

```bash
# Terminal 1: Backend (default port 3000; may differ if PORT is set in backend/.env)
cd backend && npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend && npm run dev
```

The app will be available at `http://localhost:5173`.

**If the backend listens on a port other than 3000** (for example `PORT=3001` in `backend/.env`), the Vite proxy must match or `/api` requests will fail (often shown as a generic “500” / network error). Either set **`PORT=3000`** in `backend/.env`, or create **`frontend/.env.local`** with:

```bash
VITE_BACKEND_PORT=3001
# or full origin: VITE_DEV_BACKEND_ORIGIN=http://127.0.0.1:3001
```

Then restart `npm run dev` in `frontend/`.

---

## Examiner Verification Commands

Run these from the project root (`maji-watch/`) during demos or marking:

```bash
# Full verification (backend build + backend tests + frontend build)
npm run verify:all

# Backend only
npm run verify:backend

# Frontend only
npm run verify:frontend
```

Expected result:
- Backend TypeScript compiles
- Auth reset tests and integration tests pass
- Frontend production build succeeds

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Minimum 32-character secret |
| `JWT_EXPIRES_IN` | | Access JWT TTL (default: `15m`) |
| `REFRESH_TOKEN_DAYS` | | Refresh session lifetime in days (default: `14`; cookie `maji_refresh`) |
| `NODE_ENV` | | `development` or `production` |
| `PORT` | | Server port (default: `3000`) |
| `STORAGE_PROVIDER` | | `local` or `supabase_storage` |
| `SUPABASE_URL` | if using Supabase Storage | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | if using Supabase Storage | Service role key |
| `SUPABASE_STORAGE_BUCKET` | if using Supabase Storage | Bucket name |
| `CORS_ALLOWED_ORIGINS` | | Comma-separated frontend URLs |
| `SEED_ADMIN_EMAIL` | for seeding | Initial admin email |
| `SEED_ADMIN_PASSWORD` | for seeding | Initial admin password |

---

## Deployment Guide

### Backend — Railway / Render / Fly.io

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

**Required env vars in production:**
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `JWT_SECRET` — Strong random secret (32+ chars)
- `NODE_ENV=production`
- `CORS_ALLOWED_ORIGINS` — Your frontend domain
- `STORAGE_PROVIDER=supabase_storage` — With Supabase credentials

### Frontend — Vercel / Netlify

```bash
# Build for production
npm run build
# Output is in dist/
```

**Vercel `vercel.json`:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Supabase Setup

1. Create a new Supabase project
2. Run `migrations/001_initial_schema.sql` in the SQL editor
3. Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
4. Create a storage bucket named `report-images` (set to public)
5. Copy your project URL and service role key to backend `.env`

### Production Checklist

- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] `SEED_ADMIN_PASSWORD` is changed after first login
- [ ] `NODE_ENV=production` is set
- [ ] Database SSL is enabled
- [ ] Rate limiting is tuned for expected traffic
- [ ] File upload path or Supabase bucket is configured
- [ ] CORS origins are locked to your frontend domain
- [ ] Database backups are enabled (Supabase does this automatically)

---

## Design Decisions

### Why OpenStreetMap + Leaflet instead of Google Maps?
OpenStreetMap requires no API key and has no usage billing. For a government civic platform serving potentially millions of requests, avoiding per-request billing is critical. Leaflet is also the most mature React-compatible OSS mapping library.

### Why UUID primary keys?
UUIDs prevent sequential ID enumeration attacks (a concern for public-facing civic platforms). They also enable client-side ID generation for offline-capable future mobile clients.

### Why PostGIS for proximity search?
`ST_DWithin` with a geography index is dramatically faster than computing Haversine distance in application code. For a platform where "find issues near me" is a core use case, this matters at scale.

### Why store images in Supabase Storage vs. a CDN?
Supabase Storage is backed by S3 and includes a CDN. For county governments with limited DevOps capacity, reducing the number of infrastructure dependencies is a priority.

### Why Sharp for image processing?
1. EXIF stripping — citizen photos can contain GPS metadata that shouldn't be in the permanent record
2. Resolution capping — prevents storage bloat from high-res phone photos
3. WebP conversion — roughly 30% smaller than JPEG at equivalent quality

### Why separate `admin_actions` table?
This creates an immutable audit trail. Government systems require accountability — every status change, assignment, and comment by an admin is permanently recorded with who did it and when. This table should never have rows deleted.

### Why Zustand for auth state + React Query for server state?
These solve different problems. Zustand manages the locally-persisted authentication token and user profile. React Query manages API cache, loading states, and background refetching for report data. Mixing the two in a single store creates unnecessary complexity.

---

## Project Structure

```
maji-watch/
├── backend/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Full DB schema + triggers + indexes
│   │   └── run.ts                    # Migration runner
│   ├── src/
│   │   ├── app.ts                    # Express bootstrap
│   │   ├── config/
│   │   │   └── database.ts           # pg Pool + query helpers
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── technicians.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts    # JWT + RBAC
│   │   │   ├── error.middleware.ts   # AppError + global handler
│   │   │   └── validation.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   └── technicians.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Register, login, bcrypt
│   │   │   ├── reports.service.ts    # CRUD, status machine, stats
│   │   │   ├── technicians.service.ts
│   │   │   └── upload.service.ts     # Multer + Sharp + Storage
│   │   ├── types/
│   │   │   └── index.ts              # Shared TS types + Express augmentation
│   │   └── utils/
│   │       ├── logger.ts             # Winston logger
│   │       ├── response.ts           # Standardised API responses
│   │       └── seed-admin.ts         # Admin bootstrap script
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Router + QueryClient setup
│   │   ├── main.tsx                  # React entry point
│   │   ├── components/
│   │   │   └── shared/
│   │   │       ├── Badges.tsx        # StatusBadge, CategoryBadge, ReportCard
│   │   │       ├── Layout.tsx        # Nav + page wrapper
│   │   │       └── Map.tsx           # ReportMap + LocationPicker
│   │   ├── context/
│   │   │   └── auth.store.ts         # Zustand auth store
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ReportDetail.tsx
│   │   │   ├── citizen/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── SubmitReport.tsx  # 4-step wizard with LocationPicker
│   │   │   │   └── MyReports.tsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx     # KPIs + charts + recent reports
│   │   │       ├── Reports.tsx       # Table + status update modal
│   │   │       ├── MapView.tsx       # Full-screen map with sidebar
│   │   │       └── Technicians.tsx   # Technician cards + registration
│   │   ├── services/
│   │   │   └── api.ts               # Axios client + all API functions
│   │   └── types/
│   │       └── index.ts             # Shared types + Kenya constants
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## License

This project is intended for use by Kenyan county governments and civic technology organizations. Contact the project maintainers for licensing arrangements.

---

*Built with ❤️ for Kenya's water infrastructure accountability.*
