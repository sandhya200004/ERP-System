import { create } from 'zustand';
import { authService, type AuthResponse } from '../services/auth.service';

export type UserRole = 
  | 'CEO' 
  | 'CTO' 
  | 'CMO' 
  | 'HR' 
  | 'MANAGER' 
  | 'DEVELOPER' 
  | 'DESIGNER' 
  | 'MARKETING' 
  | 'RND' 
  | 'EMPLOYEE';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: {
    name: string;
    permissions: string[];
  };
  employeeId?: string; // TS2025, TSDM2025001, etc.
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authService.login({ email, password });
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
