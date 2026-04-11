-- Technician job role (distinct from user.role = 'technician')
-- Examples: Field Technician, Water Quality Analyst, County Supervisor

ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS job_role VARCHAR(100);

COMMENT ON COLUMN technicians.job_role IS 'Operational role within the county water team (e.g. Field Technician, Supervisor)';
