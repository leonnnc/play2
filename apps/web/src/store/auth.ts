import { create } from 'zustand';
import { api, getToken, setToken } from '../lib/api';
import type { User } from '../lib/types';

interface AuthState {
  user: User | null;
  ready: boolean;
  busy: boolean;
  error: string | null;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  updatePrefs: (prefs: Partial<User['prefs']>, name?: string) => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  busy: false,
  error: null,

  init: async () => {
    if (!getToken()) {
      set({ ready: true });
      return;
    }
    try {
      const { user } = await api.me();
      set({ user, ready: true });
    } catch {
      setToken(null);
      set({ user: null, ready: true });
    }
  },

  login: async (email, password) => {
    set({ busy: true, error: null });
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      set({ user, busy: false, ready: true });
    } catch (err) {
      set({ busy: false, error: err instanceof Error ? err.message : 'No se pudo iniciar sesion' });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ busy: true, error: null });
    try {
      const { token, user } = await api.register(name, email, password);
      setToken(token);
      set({ user, busy: false, ready: true });
    } catch (err) {
      set({ busy: false, error: err instanceof Error ? err.message : 'No se pudo crear la cuenta' });
      throw err;
    }
  },

  logout: () => {
    setToken(null);
    set({ user: null, error: null });
  },

  refresh: async () => {
    if (!getToken()) return;
    try {
      const { user } = await api.me();
      set({ user });
    } catch {
      /* silencioso */
    }
  },

  updatePrefs: async (prefs, name) => {
    const { user } = await api.updateMe({ prefs, name });
    set({ user });
  },
}));
