import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface PlatformAdmin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'trial' | 'suspended';
  subscription_plan: 'trial' | 'basic' | 'professional' | 'enterprise';
  max_users: number;
  max_branches: number;
  max_storage_gb: number;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
}

export interface LoginResponse {
  access_token: string;
  admin: PlatformAdmin;
}

export interface CreateCompanyDto {
  name: string;
  subdomain: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name: string;
  subscription_plan?: 'trial' | 'basic' | 'professional' | 'enterprise';
  max_users?: number;
  max_branches?: number;
  max_storage_gb?: number;
}

export interface CompanyListResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubdomainCheckResponse {
  available: boolean;
  valid: boolean;
  message: string;
  suggestion?: string;
  preview_url?: string;
}

class PlatformAdminService {
  private token: string | null = null;

  private getAuthHeader() {
    const token = this.token || localStorage.getItem('platform_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(
      `${API_URL}/platform-admin/login`,
      { email, password }
    );
    this.token = response.data.access_token;
    localStorage.setItem('platform_admin_token', response.data.access_token);
    localStorage.setItem('platform_admin', JSON.stringify(response.data.admin));
    return response.data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('platform_admin_token');
    localStorage.removeItem('platform_admin');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('platform_admin_token');
  }

  getCurrentAdmin(): PlatformAdmin | null {
    const admin = localStorage.getItem('platform_admin');
    return admin ? JSON.parse(admin) : null;
  }

  async getStats(): Promise<PlatformStats> {
    const response = await axios.get<PlatformStats>(
      `${API_URL}/platform-admin/stats`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async getCompanies(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<CompanyListResponse> {
    const params: any = { page, limit };
    if (status) params.status = status;

    const response = await axios.get<CompanyListResponse>(
      `${API_URL}/platform-admin/companies`,
      { headers: this.getAuthHeader(), params }
    );
    return response.data;
  }

  async getCompanyById(id: string): Promise<Company> {
    const response = await axios.get<Company>(
      `${API_URL}/platform-admin/companies/${id}`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async createCompany(data: CreateCompanyDto): Promise<any> {
    const response = await axios.post(
      `${API_URL}/platform-admin/companies`,
      data,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const response = await axios.patch<Company>(
      `${API_URL}/platform-admin/companies/${id}`,
      data,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async suspendCompany(id: string, reason: string): Promise<Company> {
    const response = await axios.post<Company>(
      `${API_URL}/platform-admin/companies/${id}/suspend`,
      { reason },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async reactivateCompany(id: string): Promise<Company> {
    const response = await axios.post<Company>(
      `${API_URL}/platform-admin/companies/${id}/reactivate`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async checkSubdomain(subdomain: string): Promise<SubdomainCheckResponse> {
    const response = await axios.get<SubdomainCheckResponse>(
      `${API_URL}/platform-admin/companies/check-subdomain/${subdomain}`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async deleteCompany(id: string): Promise<void> {
    await axios.delete(
      `${API_URL}/platform-admin/companies/${id}`,
      { headers: this.getAuthHeader() }
    );
  }
}

export const platformAdminService = new PlatformAdminService();
