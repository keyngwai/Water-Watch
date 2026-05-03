import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string; password: string; full_name: string;
    phone?: string; county?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  initFromStorage: () => {
    const token = localStorage.getItem('maji_token');
    const userStr = localStorage.getItem('maji_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('maji_token');
        localStorage.removeItem('maji_user');
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authApi.login(email, password);
      localStorage.setItem('maji_token', token);
      localStorage.setItem('maji_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authApi.register(data);
      localStorage.setItem('maji_token', token);
      localStorage.setItem('maji_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await authApi.logout();
    localStorage.removeItem('maji_token');
    localStorage.removeItem('maji_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
