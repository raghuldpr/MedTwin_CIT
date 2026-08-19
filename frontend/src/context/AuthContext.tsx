/**
 * AuthContext — JWT auth, session persistence, role-based state.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiRequest, setStoredToken, clearStoredToken, getStoredToken, registerUnauthorizedCallback } from '../services/api';
import type { BackendUser } from '../services/patient.api';

interface AuthState {
  user: BackendUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  backendOnline: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'PATIENT' | 'DOCTOR') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

interface Props { children: ReactNode; }

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => { registerUnauthorizedCallback(logout); }, [logout]);

  useEffect(() => {
    const init = async () => {
      try {
        await fetch('/api/health');
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
        setIsLoading(false);
        return;
      }

      const stored = getStoredToken();
      if (!stored) { setIsLoading(false); return; }

      try {
        const data = await apiRequest<{ user: BackendUser }>('GET', '/api/auth/me');
        setUser(data.user);
        setToken(stored);
      } catch {
        clearStoredToken();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ user: BackendUser; token: string }>('POST', '/api/auth/login', { email, password });
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: 'PATIENT' | 'DOCTOR') => {
    const data = await apiRequest<{ user: BackendUser; token: string }>('POST', '/api/auth/register', { name, email, password, role });
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: BackendUser }>('GET', '/api/auth/me');
      setUser(data.user);
    } catch {
      logout();
    }
  }, [logout]);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    backendOnline,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
