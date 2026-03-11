import { create } from 'zustand';
import api from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'ATTENDANT';
  stationId?: string;
  companyId?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  initialize: () => void;

  isAdmin: () => boolean;
  isManager: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      localStorage.setItem('fuelflow_token', token);
      localStorage.setItem('fuelflow_user', JSON.stringify(user));
      set({ user, token, loading: false });
      return user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('fuelflow_token');
    localStorage.removeItem('fuelflow_user');
    set({ user: null, token: null });
    window.location.href = '/login';
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fuelflow_token');
      const userStr = localStorage.getItem('fuelflow_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as AuthUser;
          set({ user, token, initialized: true });
        } catch {
          set({ initialized: true });
        }
      } else {
        set({ initialized: true });
      }
    }
  },

  isAdmin: () => get().user?.role === 'ADMIN',
  isManager: () => get().user?.role === 'MANAGER',
}));
