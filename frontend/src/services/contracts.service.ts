import { apiClient } from '@/lib/api-client';
import type {
  ContractDto,
  ContractDtoPagedResult,
  ContractStatus,
  CreateContractRequest,
  PaginationParams,
} from '@/types';

export const contractsService = {
  async getContracts(
    params: PaginationParams & { status?: ContractStatus } = {}
  ): Promise<ContractDtoPagedResult> {
    const response = await apiClient.get<ContractDtoPagedResult>('/api/contracts', {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
        sortBy: params.sortBy || undefined,
        sortDirection: params.sortDirection || undefined,
        status: params.status || undefined,
      },
    });
    return response.data;
  },

  async getContractById(id: number): Promise<ContractDto> {
    const response = await apiClient.get<ContractDto>(`/api/contracts/${id}`);
    return response.data;
  },

  async createContract(data: CreateContractRequest): Promise<ContractDto> {
    const response = await apiClient.post<ContractDto>('/api/contracts', data);
    return response.data;
  },

  async activateContract(id: number): Promise<ContractDto> {
    const response = await apiClient.post<ContractDto>(`/api/contracts/${id}/activate`);
    return response.data;
  },

  async terminateContract(id: number): Promise<ContractDto> {
    const response = await apiClient.post<ContractDto>(`/api/contracts/${id}/terminate`);
    return response.data;
  },

  async cancelContract(id: number): Promise<ContractDto> {
    const response = await apiClient.post<ContractDto>(`/api/contracts/${id}/cancel`);
    return response.data;
  },
};
