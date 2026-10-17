import { apiClient } from '@/lib/api-client';
import type {
  CreatePropertyRequest,
  CreateUnitRequest,
  PaginationParams,
  PropertyDto,
  PropertyDtoPagedResult,
  UnitDto,
  UnitDtoPagedResult,
  UpdatePropertyRequest,
} from '@/types';

export const propertiesService = {
  async getProperties(
    params: PaginationParams & { mine?: boolean } = {}
  ): Promise<PropertyDtoPagedResult> {
    const response = await apiClient.get<PropertyDtoPagedResult>('/api/properties', {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
        sortBy: params.sortBy || undefined,
        sortDirection: params.sortDirection || undefined,
        mine: params.mine || undefined,
      },
    });
    return response.data;
  },

  async getPropertyById(id: number): Promise<PropertyDto> {
    const response = await apiClient.get<PropertyDto>(`/api/properties/${id}`);
    return response.data;
  },

  async createProperty(data: CreatePropertyRequest): Promise<PropertyDto> {
    const response = await apiClient.post<PropertyDto>('/api/properties', data);
    return response.data;
  },

  async updateProperty(id: number, data: UpdatePropertyRequest): Promise<PropertyDto> {
    const response = await apiClient.put<PropertyDto>(`/api/properties/${id}`, data);
    return response.data;
  },

  async deleteProperty(id: number): Promise<void> {
    await apiClient.delete(`/api/properties/${id}`);
  },

  async getPropertyUnits(
    propertyId: number,
    params: PaginationParams = {}
  ): Promise<UnitDtoPagedResult> {
    const response = await apiClient.get<UnitDtoPagedResult>(
      `/api/properties/${propertyId}/units`,
      {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search || undefined,
          sortBy: params.sortBy || undefined,
          sortDirection: params.sortDirection || undefined,
        },
      }
    );
    return response.data;
  },

  async createPropertyUnit(propertyId: number, data: CreateUnitRequest): Promise<UnitDto> {
    const response = await apiClient.post<UnitDto>(`/api/properties/${propertyId}/units`, data);
    return response.data;
  },
};
