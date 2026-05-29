import { create } from 'zustand';
import api from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'ATTENDANT';
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

const TOKEN_KEY = 'stationiq_token';
const USER_KEY = 'stationiq_user';
const LEGACY_TOKEN_KEY = 'fuelflow_token';
const LEGACY_USER_KEY = 'fuelflow_user';

function readStoredSession(): Pick<AuthState, 'user' | 'token'> {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  let token = localStorage.getItem(TOKEN_KEY);
  let userStr = localStorage.getItem(USER_KEY);

  if (!token) {
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken) {
      token = legacyToken;
      localStorage.setItem(TOKEN_KEY, legacyToken);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  }

  if (!userStr) {
    const legacyUser = localStorage.getItem(LEGACY_USER_KEY);
    if (legacyUser) {
      userStr = legacyUser;
      localStorage.setItem(USER_KEY, legacyUser);
      localStorage.removeItem(LEGACY_USER_KEY);
    }
  }

  if (!token || !userStr) {
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(userStr) as AuthUser;
    return { user, token };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { user: null, token: null };
  }
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
      const { user: raw, session } = response.data as { user: Record<string, unknown>; session?: { access_token: string } };
      const token = session?.access_token;
      if (!token) throw new Error('No token in response');
      const roleMap: Record<string, AuthUser['role']> = {
        superadmin: 'SUPERADMIN',
        company_admin: 'ADMIN',
        station_manager: 'MANAGER',
        attendant: 'ATTENDANT',
      };
      const user: AuthUser = {
        id: raw.id as string,
        email: (raw.email as string) ?? '',
        name: (raw.name as string) ?? '',
        role: roleMap[String(raw.role ?? '').toLowerCase()] ?? 'ATTENDANT',
        stationId: raw.station_id as string | undefined,
        companyId: raw.company_id as string | undefined,
      };
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token, loading: false, initialized: true });
      return user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    set({ user: null, token: null, initialized: true });
    window.location.href = '/login';
  },

  initialize: () => {
    const { user, token } = readStoredSession();
    set({ user, token, initialized: true });
  },

  isAdmin: () => {
    const r = get().user?.role;
    return r === 'ADMIN' || r === 'SUPERADMIN';
  },
  isManager: () => get().user?.role === 'MANAGER',
}));
