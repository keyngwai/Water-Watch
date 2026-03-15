import axios, { AxiosError } from 'axios';
import { ApiResponse, Report, User, Technician, ReportStats, PaginationMeta } from '../types';

// ---------------------------------------------------------------------------
// Axios instance with base configuration
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maji_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth expiry globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string; code?: string }>) => {
    const code = error.response?.data?.code;

    if (code === 'AUTH_EXPIRED' || code === 'AUTH_INVALID') {
      localStorage.removeItem('maji_token');
      localStorage.removeItem('maji_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  register: async (data: {
    email: string; password: string; full_name: string;
    phone?: string; county?: string;
  }) => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return res.data.data;
  },

  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password });
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  createAdmin: async (data: {
    email: string; password: string; full_name: string;
    phone?: string; county: string;
  }) => {
    const res = await api.post<ApiResponse<User>>('/auth/admin/create', data);
    return res.data.data;
  },
};

// ---------------------------------------------------------------------------
// Reports API
// ---------------------------------------------------------------------------

export interface ReportFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  county?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  sort?: string;
}

function normalizeReport(report: any): Report {
  return {
    ...report,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    upvote_count: Number(report.upvote_count ?? 0),
    view_count: Number(report.view_count ?? 0),
    created_at: String(report.created_at),
    updated_at: String(report.updated_at),
  } as Report;
}

export const reportsApi = {
  list: async (filters: ReportFilters = {}): Promise<{ reports: Report[]; meta: PaginationMeta }> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const res = await api.get<ApiResponse<Report[]>>('/reports', { params });
    return { reports: res.data.data.map(normalizeReport), meta: res.data.meta! };
  },

  getById: async (id: string): Promise<Report> => {
    const res = await api.get<ApiResponse<Report>>(`/reports/${id}`);
    return normalizeReport(res.data.data);
  },

  create: async (formData: FormData): Promise<Report> => {
    const res = await api.post<ApiResponse<Report>>('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  getMyReports: async (filters: ReportFilters = {}): Promise<{ reports: Report[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<Report[]>>('/reports/my/reports', { params: filters });
    return { reports: res.data.data.map(normalizeReport), meta: res.data.meta! };
  },

  upvote: async (id: string): Promise<{ upvote_count: number }> => {
    const res = await api.post<ApiResponse<{ upvote_count: number }>>(`/reports/${id}/upvote`);
    return res.data.data;
  },

  // Admin endpoints
  adminList: async (filters: ReportFilters = {}): Promise<{ reports: Report[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<Report[]>>('/reports/admin/all', { params: filters });
    return { reports: res.data.data.map(normalizeReport), meta: res.data.meta! };
  },

  updateStatus: async (id: string, data: {
    status: string;
    comment?: string;
    is_public?: boolean;
    technician_id?: string;
    estimated_resolution_date?: string;
  }): Promise<Report> => {
    const res = await api.patch<ApiResponse<Report>>(`/reports/${id}/status`, data);
    return normalizeReport(res.data.data);
  },

  getStats: async (): Promise<ReportStats> => {
    const res = await api.get<ApiResponse<ReportStats>>('/reports/admin/stats');
    return res.data.data;
  },
};

// ---------------------------------------------------------------------------
// Technicians API
// ---------------------------------------------------------------------------

export const techniciansApi = {
  list: async (county?: string): Promise<Technician[]> => {
    const res = await api.get<ApiResponse<Technician[]>>('/technicians', {
      params: county ? { county } : {},
    });
    return res.data.data;
  },

  create: async (data: Record<string, unknown>): Promise<Technician> => {
    const res = await api.post<ApiResponse<Technician>>('/technicians', data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/technicians/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Error message extractor
// ---------------------------------------------------------------------------
export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data?.details) {
      // For validation errors, show field-specific messages
      const details = Object.entries(data.details as Record<string, string[]>)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join('; ');
      return `${data.error} ${details}`;
    }
    return data?.error || err.message || 'An unexpected error occurred.';
  }
  return (err as Error).message || 'An unexpected error occurred.';
}

export default api;
