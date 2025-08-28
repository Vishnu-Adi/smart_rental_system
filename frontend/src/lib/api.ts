import { AssetsResponse, HealthRow, MachineDetail, UsageRow, ForecastRow, CustomerRow, DashboardAnalytics, UsageAnalytics, AdvancedForecastData, ApiError, AuthResponse, Company, CustomerDashboard, Notification } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = (await res.json()) as ApiError;
      message = data?.message || message;
    } catch {
      // ignore
    }
    const err = new Error(message) as Error & { status?: number };
    (err as { status?: number }).status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  // Admin APIs
  getAssets: () => http<AssetsResponse>('/api/assets'),
  getHealth: () => http<HealthRow[]>('/api/health'),
  getMachineDetail: (machineId: number | string) => http<MachineDetail>(`/api/health/${machineId}`),
  getUsage: () => http<UsageRow[]>('/api/usage'),
  getUsageAnalytics: () => http<UsageAnalytics>('/api/usage/analytics'),
  getForecast: () => http<ForecastRow[]>('/api/forecast'),
  getAdvancedForecast: () => http<AdvancedForecastData>('/api/forecast/advanced'),
  getCustomers: () => http<CustomerRow[]>('/api/customers'),
  getDashboardAnalytics: () => http<DashboardAnalytics>('/api/dashboard/analytics'),
  
  // Authentication APIs
  login: (username: string, password: string, userType: 'admin' | 'customer') => 
    http<AuthResponse>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, userType })
    }),
  
  register: (username: string, password: string, company_id: number) =>
    http<AuthResponse>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, company_id })
    }),
  
  // Customer Portal APIs
  getCompanies: () => http<Company[]>('/api/companies'),
  getCustomerDashboard: (companyId: number) => http<CustomerDashboard>(`/api/customer/dashboard/${companyId}`),
  getNotifications: (clientId: number) => http<Notification[]>(`/api/customer/notifications/${clientId}`),
  markNotificationRead: (notificationId: number) =>
    http<{ message: string }>(`/api/customer/notifications/${notificationId}/read`, {
      method: 'PUT'
    }),
};


