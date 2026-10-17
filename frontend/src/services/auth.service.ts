import { apiClient } from '@/lib/api-client';
import type {
  AuthResponse,
  ConfirmEmailRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/api/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  async confirmEmail(data: ConfirmEmailRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/auth/confirm-email', data);
    return response.data;
  },

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/refresh', data);
    return response.data;
  },

  async logout(data: LogoutRequest): Promise<void> {
    await apiClient.post('/api/auth/logout', data);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/auth/reset-password', data);
    return response.data;
  },
};
