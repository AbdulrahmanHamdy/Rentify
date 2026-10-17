import { apiClient } from '@/lib/api-client';
import type { UnitDto, UpdateUnitRequest } from '@/types';

export const unitsService = {
  async getUnitById(id: number): Promise<UnitDto> {
    const response = await apiClient.get<UnitDto>(`/api/units/${id}`);
    return response.data;
  },

  async updateUnit(id: number, data: UpdateUnitRequest): Promise<UnitDto> {
    const response = await apiClient.put<UnitDto>(`/api/units/${id}`, data);
    return response.data;
  },

  async deleteUnit(id: number): Promise<void> {
    await apiClient.delete(`/api/units/${id}`);
  },
};
