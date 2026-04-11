// =============================================================================
// Shared TypeScript Types — Maji Watch
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

// ---------------------------------------------------------------------------
// Database Row Types
// ---------------------------------------------------------------------------

export interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  password_hash: string;
  role: UserRole;
  county: string | null;
  sub_county: string | null;
  ward: string | null;
  is_root_admin: boolean;
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  [key: string]: unknown; // Add index signature
}

export interface ReportRow {
  id: string;
  reference_code: string;
  citizen_id: string;
  category: IssueCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  latitude: string; // pg returns decimals as strings
  longitude: string;
  location_name: string | null;
  county: string;
  sub_county: string | null;
  ward: string | null;
  status: ReportStatus;
  assigned_to: string | null;
  verified_by: string | null;
  verified_at: Date | null;
  resolved_at: Date | null;
  estimated_resolution_date: Date | null;
  upvote_count: number;
  view_count: number;
  is_public: boolean;
  source: string;
  created_at: Date;
  updated_at: Date;
  [key: string]: unknown;
}

export interface ReportImageRow {
  id: string;
  report_id: string;
  storage_key: string;
  public_url: string;
  filename: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  uploaded_at: Date;
}

export interface TechnicianRow {
  id: string;
  user_id: string;
  employee_id: string;
  // Operational role within the county team (e.g., Field Technician), not the auth `user.role`.
  job_role: string | null;
  department: string | null;
  specialization: string | null;
  county: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
  [key: string]: unknown; // Add index signature
}

export interface AdminActionRow {
  id: string;
  report_id: string;
  admin_id: string;
  action_type: string;
  previous_status: ReportStatus | null;
  new_status: ReportStatus | null;
  assigned_to: string | null;
  comment: string | null;
  is_public: boolean;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// JWT Payload
// ---------------------------------------------------------------------------

export interface JwtPayload {
  sub: string;   // user ID
  role: UserRole;
  email: string;
  county: string | null;
  is_root_admin: boolean;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------
// Request Extensions
// ---------------------------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// API Response Shapes
// ---------------------------------------------------------------------------

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
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}
