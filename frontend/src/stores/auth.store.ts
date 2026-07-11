import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'citizen' | 'volunteer' | 'department_admin' | 'municipal_admin' | 'super_admin';
  avatar?: string;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.data.accessToken);
    localStorage.setItem('refresh_token', data.data.refreshToken);
    set({ user: data.data.user, isAuthenticated: true });
  },
  register: async (regData) => {
    const { data } = await api.post('/auth/register', regData);
    localStorage.setItem('access_token', data.data.accessToken);
    localStorage.setItem('refresh_token', data.data.refreshToken);
    set({ user: data.data.user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },
  loadUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await api.get('/users/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
