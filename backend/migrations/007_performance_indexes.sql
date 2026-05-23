-- =============================================================================
-- PERFORMANCE INDEXES
-- Optimizes common filter patterns and administrative analytics queries.
-- =============================================================================

-- Composite index for county-level status filtering (very common for dashboard)
CREATE INDEX IF NOT EXISTS idx_reports_county_status ON reports(county, status);

-- Composite index for date-based filtering within a county (common for exports)
CREATE INDEX IF NOT EXISTS idx_reports_county_created_at ON reports(county, created_at DESC);

-- Index for category-based filtering within a county
CREATE INDEX IF NOT EXISTS idx_reports_county_category ON reports(county, category);

-- Index for technician assignments within a county
CREATE INDEX IF NOT EXISTS idx_reports_county_assigned_to ON reports(county, assigned_to);

-- Index for citizen-specific views
CREATE INDEX IF NOT EXISTS idx_reports_citizen_created_at ON reports(citizen_id, created_at DESC);

-- Optimize date truncations for daily volume trends
CREATE INDEX IF NOT EXISTS idx_reports_created_at_date ON reports (CAST(created_at AS DATE));
