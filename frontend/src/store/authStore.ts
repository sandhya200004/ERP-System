import { create } from 'zustand';
import { authService, type AuthResponse } from '../services/auth.service';

export type UserRole = 
  | 'ADMIN'
  | 'LEAD_MANAGER'
  | 'DM_EXECUTIVE'
  | 'EMPLOYEE'
  | 'DEVELOPER';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  permissions?: string[];
}

interface Company {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (employeeId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (employeeId: string, password: string) => {
    try {
      const response: AuthResponse = await authService.login({ employeeId, password });
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      set({
        user: response.user,
        company: response.company,
        isAuthenticated: true,
      });
    } catch (error) {
      set({ user: null, company: null, isAuthenticated: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, company: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      set({
        user: user,
        company: { id: 'enterprise', name: 'TriVerse Enterprise' },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Check auth error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, company: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
