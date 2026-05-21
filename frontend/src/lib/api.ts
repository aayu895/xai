import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data: any) => api.post('/auth/register', data),
  login:     (data: any) => api.post('/auth/login', data),
  me:        ()          => api.get('/auth/me'),
};

// ─── Decisions ───────────────────────────────────────────────────────────────
export const decisionsAPI = {
  submit:       (data: any)               => api.post('/decisions/', data),
  myDecisions:  (skip = 0, limit = 20)   => api.get(`/decisions/my?skip=${skip}&limit=${limit}`),
  allDecisions: (skip = 0, limit = 50, status?: string) =>
    api.get(`/decisions/all?skip=${skip}&limit=${limit}${status ? `&status_filter=${status}` : ''}`),
  getById:      (id: number)              => api.get(`/decisions/${id}`),
  review:       (id: number, data: any)   => api.post(`/decisions/${id}/review`, data),
  appeal:       (id: number, data: any)   => api.post(`/decisions/${id}/appeal`, data),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsAPI = {
  stats:          ()           => api.get('/analytics/stats'),
  citizenStats:   ()           => api.get('/analytics/citizen-stats'),
  auditLogs:      (skip = 0)   => api.get(`/analytics/audit-logs?skip=${skip}&limit=100`),
  notifications:  ()           => api.get('/analytics/notifications'),
  markRead:       (id: number) => api.post(`/analytics/notifications/${id}/read`),
  users:          ()           => api.get('/analytics/users'),
  toggleUser:     (id: number) => api.patch(`/analytics/users/${id}/toggle-active`),
  modelPerf:      ()           => api.get('/analytics/model-performance'),
  trendData:      (days = 30)  => api.get(`/analytics/trend-data?days=${days}`),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsAPI = {
  downloadPDF: (decisionId: number) =>
    api.get(`/reports/${decisionId}/pdf`, { responseType: 'blob' }),
};
