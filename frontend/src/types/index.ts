// =============================================================================
// Frontend Shared Types — Maji Watch
// =============================================================================

export type UserRole = 'citizen' | 'admin' | 'technician';

export type ReportStatus =
  | 'reported'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type IssueCategory =
  | 'broken_borehole'
  | 'contaminated_water'
  | 'illegal_connection'
  | 'water_shortage'
  | 'unfair_pricing'
  | 'pipe_burst'
  | 'no_water_supply'
  | 'other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  county: string | null;
  sub_county: string | null;
  ward: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface ReportImage {
  id: string;
  public_url: string;
  filename: string;
  is_primary: boolean;
}

export interface AdminAction {
  id: string;
  action_type: string;
  new_status: ReportStatus;
  comment: string | null;
  admin_name: string;
  created_at: string;
}

export interface Report {
  id: string;
  reference_code: string;
  citizen_id: string;
  citizen_name?: string;
  citizen_phone?: string;
  category: IssueCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  county: string;
  sub_county: string | null;
  ward: string | null;
  status: ReportStatus;
  assigned_to: string | null;
  technician_name?: string | null;
  technician_job_role?: string | null;
  technician?: {
    id: string;
    full_name?: string;
    specialization?: string | null;
    employee_id?: string;
    job_role?: string | null;
  };
  verified_at: string | null;
  resolved_at: string | null;
  estimated_resolution_date: string | null;
  upvote_count: number;
  view_count: number;
  images?: ReportImage[];
  primary_image?: string | null;
  timeline?: AdminAction[];
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_role: string | null;
  department: string | null;
  specialization: string | null;
  county: string;
  is_available: boolean;
  active_assignments: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ReportStats {
  byStatus: Array<{ status: ReportStatus; count: string }>;
  byCategory: Array<{ category: IssueCategory; count: string }>;
  dailyTrend: Array<{ date: string; count: string }>;
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  broken_borehole: 'Broken Borehole',
  contaminated_water: 'Contaminated Water',
  illegal_connection: 'Illegal Connection',
  water_shortage: 'Water Shortage',
  unfair_pricing: 'Unfair Pricing',
  pipe_burst: 'Burst Pipe',
  no_water_supply: 'No Water Supply',
  other: 'Other',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  reported: 'Reported',
  verified: 'Verified',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  reported: '#f59e0b',
  verified: '#3b82f6',
  in_progress: '#8b5cf6',
  resolved: '#10b981',
  rejected: '#ef4444',
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
  'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

/** Operational job roles for field staff (must match backend `TECHNICIAN_JOB_ROLE_VALUES`). */
export const TECHNICIAN_JOB_ROLES = [
  'Field Technician',
  'Senior Field Technician',
  'Water Quality Analyst',
  'Pipeline & Distribution Specialist',
  'Borehole & Well Technician',
  'Community Liaison Officer',
  'Emergency Response Technician',
  'County Supervisor',
] as const;
