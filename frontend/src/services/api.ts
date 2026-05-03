import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, Report, User, Technician, ReportStats, PaginationMeta } from '../types';

// ---------------------------------------------------------------------------
// Axios instance with base configuration
// ---------------------------------------------------------------------------

function apiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL || '/api';
  return raw.replace(/\/$/, '');
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await axios.post<ApiResponse<{ token: string }>>(
          `${apiBaseUrl()}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        return res.data.data?.token ?? null;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maji_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh session on expired access token (refresh token stays in httpOnly cookie)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error: string; code?: string }>) => {
    const code = error.response?.data?.code;
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status === 401 &&
      code === 'AUTH_EXPIRED' &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      originalRequest._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        localStorage.setItem('maji_token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
    }

    if (code === 'AUTH_EXPIRED' || code === 'AUTH_INVALID') {
      localStorage.removeItem('maji_token');
      localStorage.removeItem('maji_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
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

  forgotPassword: async (email: string): Promise<{ requested: boolean }> => {
    const res = await api.post<ApiResponse<{ requested: boolean }>>('/auth/forgot-password', { email });
    return res.data.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ reset: boolean }> => {
    const res = await api.post<ApiResponse<{ reset: boolean }>>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* best-effort revoke */
    }
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  createAdmin: async (data: {
    email: string; password: string; full_name: string;
    phone?: string; county?: string; is_root_admin?: boolean;
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
  start_date?: string;
  end_date?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  sort?: string;
}

export interface ReportStatsFilters {
  county?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

function normalizeReport(report: any): Report {
  // Postgres often returns numeric/decimal fields as strings, so we normalize
  // to keep the frontend types predictable.
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
    // Only include non-empty filter values so we don't send unnecessary query params.
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

  assignTechnician: async (id: string, data: {
    technician_id: string;
    comment?: string;
    is_public?: boolean;
  }): Promise<Report> => {
    // Dedicated endpoint that updates `reports.assigned_to` without requiring a status transition.
    const res = await api.patch<ApiResponse<Report>>(`/reports/${id}/assign`, data);
    return normalizeReport(res.data.data);
  },

  getStats: async (filters: ReportStatsFilters = {}): Promise<ReportStats> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const res = await api.get<ApiResponse<ReportStats>>('/reports/admin/stats', { params });
    return res.data.data;
  },

  exportCsv: async (filters: ReportStatsFilters = {}): Promise<void> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const res = await api.get('/reports/admin/export.csv', { params, responseType: 'blob' });
    downloadBlob(res.data, `reports-export-${Date.now()}.csv`);
  },

  exportPdf: async (filters: ReportStatsFilters = {}): Promise<void> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const res = await api.get('/reports/admin/export.pdf', { params, responseType: 'blob' });
    downloadBlob(res.data, `reports-export-${Date.now()}.pdf`);
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

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
