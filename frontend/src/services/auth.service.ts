import apiClient from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  currencyCode: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: {
      name: string;
      permissions: string[];
    };
    employeeId?: string;
    designation?: string;
    department?: string;
    permissions?: string[];
  };
  company: {
    id: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
