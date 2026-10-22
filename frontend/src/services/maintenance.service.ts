import { apiClient } from '@/lib/api-client';
import type {
  MaintenanceRequestDto,
  CreateMaintenanceRequest,
  UpdateMaintenanceStatusRequest,
  PagedResult,
  PaginationParams,
} from '@/types';

export const maintenanceService = {
  async getRequests(params?: PaginationParams & { status?: number }): Promise<PagedResult<MaintenanceRequestDto>> {
    const res = await apiClient.get<PagedResult<MaintenanceRequestDto>>('/api/maintenance', {
      params,
    });
    return res.data;
  },

  async getRequestById(id: number): Promise<MaintenanceRequestDto> {
    const res = await apiClient.get<MaintenanceRequestDto>(`/api/maintenance/${id}`);
    return res.data;
  },

  async createRequest(data: CreateMaintenanceRequest): Promise<MaintenanceRequestDto> {
    const res = await apiClient.post<MaintenanceRequestDto>('/api/maintenance', data);
    return res.data;
  },

  async updateStatus(id: number, data: UpdateMaintenanceStatusRequest): Promise<MaintenanceRequestDto> {
    const res = await apiClient.put<MaintenanceRequestDto>(`/api/maintenance/${id}/status`, data);
    return res.data;
  },
};
