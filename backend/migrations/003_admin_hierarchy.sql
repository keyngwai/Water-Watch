-- =============================================================================
-- Migration: Add admin hierarchy support
-- Adds is_root_admin column to enable root admin vs county admin distinction
-- =============================================================================

-- Add is_root_admin column with default false (if it doesn't already exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_root_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for admin queries (if it doesn't already exist)
CREATE INDEX IF NOT EXISTS idx_users_role_admin_level ON users(role, is_root_admin, county) WHERE role = 'admin';

-- Update existing admin users to be root admins (for backward compatibility)
-- This assumes existing admins should have full access
UPDATE users SET is_root_admin = TRUE WHERE role = 'admin' AND is_root_admin = FALSE;