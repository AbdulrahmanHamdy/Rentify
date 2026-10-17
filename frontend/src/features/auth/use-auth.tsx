import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { tokenManager } from '@/lib/token-manager';
import { authService } from '@/services/auth.service';
import { queryClient } from '@/lib/query-client';
import type { LoginRequest, RegisterRequest, UserRole, UserSession, AuthResponse, RegisterResponse } from '@/types';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  primaryRole: UserRole | null;
  hasRole: (role: UserRole) => boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => tokenManager.getUserSession());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((session) => {
      setUser(session);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      tokenManager.setAuth(response.accessToken, response.refreshToken, {
        userId: response.userId,
        email: response.email,
        roles: response.roles,
      });
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<RegisterResponse> => {
    setIsLoading(true);
    try {
      return await authService.register(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenManager.getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch {
      // Ignore network/server logout errors; always clear client state
    } finally {
      tokenManager.clearAuth(true);
      queryClient.clear();
    }
  }, []);

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return !!user?.roles?.includes(role);
    },
    [user]
  );

  const primaryRole = useMemo<UserRole | null>(() => {
    if (!user || !user.roles.length) return null;
    if (user.roles.includes('Admin')) return 'Admin';
    if (user.roles.includes('Owner')) return 'Owner';
    if (user.roles.includes('Tenant')) return 'Tenant';
    return user.roles[0];
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      primaryRole,
      hasRole,
      login,
      register,
      logout,
    }),
    [user, isLoading, primaryRole, hasRole, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
