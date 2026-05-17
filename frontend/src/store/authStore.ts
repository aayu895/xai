import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

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
    const token = Cookies.get('access_token');
    const userStr = Cookies.get('user');
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
      Cookies.set('access_token', access_token, { expires: 1, sameSite: 'strict' });
      Cookies.set('user', JSON.stringify(user), { expires: 1, sameSite: 'strict' });
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
    Cookies.remove('access_token');
    Cookies.remove('user');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/auth/login';
  },
}));
