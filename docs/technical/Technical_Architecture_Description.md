# Technical Architecture Description (SDD): Maji Watch

## 1. System Overview
Maji Watch is built using a modern full-stack architecture designed for performance, scalability, and developer productivity. The system leverages TypeScript across the entire stack to ensure type safety and reduce runtime errors.

## 2. Architectural Pattern
The system follows a **Service-Oriented Architecture (SOA)** on the backend:
- **Routes Layer**: Handles HTTP requests and maps them to controllers.
- **Controllers Layer**: Validates input and orchestrates calls to services.
- **Services Layer**: Contains the core business logic and interacts with the database.
- **Database Layer**: PostgreSQL with PostGIS for relational and geospatial data.

## 3. Technology Stack
| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Leaflet |
| **State Management** | Zustand (Auth), React Query (Server State) |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL (Supabase) + PostGIS |
| **Real-time** | Socket.io |
| **Auth** | JWT (JSON Web Tokens) with Refresh Tokens |
| **File Storage** | Supabase Storage (S3-compatible) |
| **PDF Generation** | pdf-lib |

## 4. Data Models (Key Entities)
### 4.1. Users
Stores credentials and profile information for Citizens, Admins, and Technicians.
### 4.2. Reports
The central entity, storing issue details, status, and geospatial coordinates (`location_geom`).
### 4.3. Technicians
Extends the user model for field staff, tracking specializations and county assignments.
### 4.4. Admin Actions
An immutable audit log tracking every status change and technician assignment for every report.

## 5. Security Architecture
- **JWT Authentication**: Short-lived (15m) access tokens and long-lived (14d) refresh tokens stored in secure `httpOnly` cookies.
- **Bcrypt Hashing**: All passwords hashed with 12 rounds of salt.
- **Input Validation**: Strict validation using `express-validator` on all API endpoints.
- **CORS & Helmet**: Middleware configured to prevent common web vulnerabilities (XSS, Clickjacking).

## 6. Geospatial Strategy
The system uses **PostGIS** for high-performance spatial queries. Reports are stored with a `GEOGRAPHY(POINT, 4326)` column, allowing for:
- Efficient proximity searches (e.g., "Find all reports within 5km of my location").
- Fast rendering of thousands of reports on a Leaflet-based map.

## 7. Real-time Notifications
A Socket.io server is integrated into the Express application to broadcast:
- `new_report`: Notifies all connected admins when a citizen submits a report.
- `status_updated`: Notifies the relevant citizen when their report status changes.
