import { apiClient } from '@/lib/api-client';
import type { UserProfileDto, UpdateProfileRequest, ChangePasswordRequest } from '@/types';

export const profileService = {
  async getProfile(): Promise<UserProfileDto> {
    const res = await apiClient.get<UserProfileDto>('/api/profile');
    return res.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileDto> {
    const res = await apiClient.put<UserProfileDto>('/api/profile', data);
    return res.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/api/profile/change-password', data);
    return res.data;
  },
};
