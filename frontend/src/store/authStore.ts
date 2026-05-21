import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

const ACCESS_TOKEN_KEY = 'access_token';
const USER_KEY = 'user';
const COOKIE_OPTIONS = { expires: 1, sameSite: 'lax' as const, path: '/' };

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'citizen' | 'officer' | 'admin';
  is_active: boolean;
  citizen_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadFromCookie: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  loadFromCookie: () => {
    const token = Cookies.get(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
    const userStr = Cookies.get(USER_KEY) || localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch {}
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user } = res.data;
      Cookies.set(ACCESS_TOKEN_KEY, access_token, COOKIE_OPTIONS);
      Cookies.set(USER_KEY, JSON.stringify(user), COOKIE_OPTIONS);
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ token: access_token, user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await authAPI.register(data);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' });
    Cookies.remove(USER_KEY, { path: '/' });
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/auth/login';
  },
}));
