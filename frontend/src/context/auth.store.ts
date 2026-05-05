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

/**
 * Auth Store: Manages global authentication state using Zustand.
 * Handles user profile, JWT tokens, and session hydration from localStorage.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  /**
   * Initializes the store from localStorage on application startup.
   */
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

  /**
   * Authenticates a user and persists the session.
   */
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

  /**
   * Registers a new citizen and automatically logs them in.
   */
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

  /**
   * Revokes the current session and clears all local auth data.
   */
  logout: async () => {
    await authApi.logout();
    localStorage.removeItem('maji_token');
    localStorage.removeItem('maji_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
