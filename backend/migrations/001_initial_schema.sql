-- =============================================================================
-- MAJI WATCH — PostgreSQL Database Schema
-- Water Access & Quality Monitoring System for Kenyan Communities
-- =============================================================================
-- Run order: This file creates all tables, enums, indexes, and constraints.
-- Compatible with PostgreSQL 14+ and Supabase.
-- =============================================================================

-- Enable PostGIS for geospatial queries (available on Supabase)
-- If PostGIS is not available, we fall back to lat/lng columns with manual radius calc.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('citizen', 'admin', 'technician');

CREATE TYPE report_status AS ENUM (
  'reported',      -- Citizen has submitted the report
  'verified',      -- Admin has confirmed the issue is legitimate
  'in_progress',   -- Technician has been assigned and is working on it
  'resolved',      -- Issue has been fixed
  'rejected'       -- Report was found to be invalid/duplicate
);

CREATE TYPE issue_category AS ENUM (
  'broken_borehole',
  'contaminated_water',
  'illegal_connection',
  'water_shortage',
  'unfair_pricing',
  'pipe_burst',
  'no_water_supply',
  'other'
);

CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users: Citizens, Admins, and Technicians all share this table, differentiated by role
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(20) UNIQUE,
  full_name         VARCHAR(255) NOT NULL,
  password_hash     TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'citizen',
  county            VARCHAR(100),                    -- e.g., "Nairobi", "Mombasa"
  sub_county        VARCHAR(100),
  ward              VARCHAR(100),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Technicians: Extended profile for users with role='technician'
CREATE TABLE technicians (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id     VARCHAR(50) UNIQUE NOT NULL,
  department      VARCHAR(150),
  specialization  VARCHAR(150),                      -- e.g., "borehole repair", "pipe laying"
  county          VARCHAR(100) NOT NULL,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_technician_user UNIQUE (user_id)
);

-- Reports: Core entity — a water issue filed by a citizen
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code  VARCHAR(20) UNIQUE NOT NULL,        -- Human-readable: MJW-2024-00001
  citizen_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category        issue_category NOT NULL,
  severity        severity_level NOT NULL DEFAULT 'medium',
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,

  -- Location
  latitude        DECIMAL(10, 8) NOT NULL,
  longitude       DECIMAL(11, 8) NOT NULL,
  location_geom   GEOGRAPHY(POINT, 4326),             -- PostGIS geometry for spatial queries
  location_name   VARCHAR(255),                       -- Human-readable address
  county          VARCHAR(100) NOT NULL,
  sub_county      VARCHAR(100),
  ward            VARCHAR(100),

  -- Status & Workflow
  status          report_status NOT NULL DEFAULT 'reported',
  assigned_to     UUID REFERENCES technicians(id) ON DELETE SET NULL,
  verified_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at     TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  estimated_resolution_date DATE,

  -- Metadata
  upvote_count    INTEGER NOT NULL DEFAULT 0,          -- Citizens can upvote to show community impact
  view_count      INTEGER NOT NULL DEFAULT 0,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  source          VARCHAR(50) DEFAULT 'web',           -- 'web' | 'mobile' | 'ussd'

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Images: Multiple images per report
CREATE TABLE report_images (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id    UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  storage_key  TEXT NOT NULL,                          -- Path in Supabase Storage / S3
  public_url   TEXT NOT NULL,
  filename     VARCHAR(255) NOT NULL,
  file_size    INTEGER NOT NULL,                       -- bytes
  mime_type    VARCHAR(100) NOT NULL,
  width        INTEGER,
  height       INTEGER,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Actions: Full audit trail of everything admins do
CREATE TABLE admin_actions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  admin_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action_type     VARCHAR(50) NOT NULL,               -- 'verify', 'reject', 'assign', 'status_update', 'comment'
  previous_status report_status,
  new_status      report_status,
  assigned_to     UUID REFERENCES technicians(id) ON DELETE SET NULL,
  comment         TEXT,                               -- Admin notes / public update
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,     -- If true, citizen can see this comment
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Upvotes: Prevent duplicate upvotes per citizen
CREATE TABLE report_upvotes (
  citizen_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (citizen_id, report_id)
);

-- Notifications: For future push/email notification integration
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id   UUID REFERENCES reports(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_technicians
  BEFORE UPDATE ON technicians
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_reports
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Sync PostGIS geometry from lat/lng on insert/update
CREATE OR REPLACE FUNCTION sync_report_geometry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_geometry_on_report
  BEFORE INSERT OR UPDATE OF latitude, longitude ON reports
  FOR EACH ROW EXECUTE FUNCTION sync_report_geometry();

-- Auto-generate human-readable reference codes
CREATE SEQUENCE report_sequence START 1;

CREATE OR REPLACE FUNCTION generate_report_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference_code = 'MJW-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('report_sequence')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_report_reference
  BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION generate_report_reference();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_county ON users(county);

-- Reports
CREATE INDEX idx_reports_citizen ON reports(citizen_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_county ON reports(county);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_reference ON reports(reference_code);

-- Geospatial index for proximity queries
CREATE INDEX idx_reports_geom ON reports USING GIST(location_geom);

-- Admin actions audit trail
CREATE INDEX idx_admin_actions_report ON admin_actions(report_id);
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);

-- Images
CREATE INDEX idx_report_images_report ON report_images(report_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =============================================================================
-- ROW LEVEL SECURITY (Supabase)
-- =============================================================================
-- RLS is enforced at the application layer via JWT middleware.
-- Supabase RLS is a secondary defense. Enable if using Supabase JS client directly.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
