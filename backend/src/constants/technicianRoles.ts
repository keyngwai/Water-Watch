/**
 * Standard technician job roles used across counties (distinct from app user role `technician`).
 */
export const TECHNICIAN_ROLE_DEFINITIONS = [
  {
    job_role: 'Field Technician',
    department: 'Field Operations',
    specialization: 'On-site inspections, minor repairs & follow-up',
  },
  {
    job_role: 'Senior Field Technician',
    department: 'Field Operations',
    specialization: 'Complex repairs, equipment & junior tech support',
  },
  {
    job_role: 'Water Quality Analyst',
    department: 'Laboratory Services',
    specialization: 'Sampling, testing & contamination response',
  },
  {
    job_role: 'Pipeline & Distribution Specialist',
    department: 'Infrastructure',
    specialization: 'Pipe bursts, illegal connections & network maintenance',
  },
  {
    job_role: 'Borehole & Well Technician',
    department: 'Borehole & Well Services',
    specialization: 'Boreholes, hand pumps & solar pumping systems',
  },
  {
    job_role: 'Community Liaison Officer',
    department: 'Public Engagement',
    specialization: 'Citizen follow-up, verification support & outreach',
  },
  {
    job_role: 'Emergency Response Technician',
    department: 'Rapid Response',
    specialization: 'Critical outages, leaks & urgent field deployment',
  },
  {
    job_role: 'County Supervisor',
    department: 'County Operations',
    specialization: 'Work planning, assignments & team coordination',
  },
] as const;

export const TECHNICIAN_JOB_ROLE_VALUES: string[] = TECHNICIAN_ROLE_DEFINITIONS.map((r) => r.job_role);

/** How many technicians (each with a different rotating role) to create per county when seeding. */
export const SEED_TECHNICIANS_PER_COUNTY = 3;
