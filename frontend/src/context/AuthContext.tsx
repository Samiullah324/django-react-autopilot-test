import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  api,
  clearTokens,
  getRefreshToken,
  getToken,
  setTokens,
  type ChangePasswordPayload,
  type ProfileUpdatePayload,
  type RegisterPayload,
} from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdatePayload) => Promise<void>;
  changePassword: (data: ChangePasswordPayload) => Promise<void>;
  isManager: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username: string, password: string, remember = true) => {
    const tokens = await api.login(username, password);
    setTokens(tokens.access, tokens.refresh, remember);
    const currentUser = await api.getCurrentUser();
    setUser(currentUser);
  };

  const register = async (data: RegisterPayload) => {
    await api.register(data);
  };

  const logout = async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh && getToken()) {
        await api.logout(refresh);
      }
    } catch {
      // Clear local session even if server logout fails
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const updateProfile = async (data: ProfileUpdatePayload) => {
    const updated = await api.updateUser(data);
    setUser(updated);
  };

  const changePassword = async (data: ChangePasswordPayload) => {
    await api.changePassword(data);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      isManager: user?.role === 'admin' || user?.role === 'manager',
      isAdmin: user?.role === 'admin',
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
