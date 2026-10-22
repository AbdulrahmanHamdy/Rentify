import type { components } from './api.generated';

// Core Schema Types
export type ApiErrorResponse = components['schemas']['ApiErrorResponse'];
export type AuthResponse = {
  userId: string;
  email: string;
  roles: string[];
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
};
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type RegisterResponse = {
  userId: string;
  email: string;
  role: string;
  message: string;
};
export type LoginRequest = components['schemas']['LoginRequest'];
export type RefreshTokenRequest = components['schemas']['RefreshTokenRequest'];
export type LogoutRequest = components['schemas']['LogoutRequest'];
export type ConfirmEmailRequest = components['schemas']['ConfirmEmailRequest'];
export type ForgotPasswordRequest = components['schemas']['ForgotPasswordRequest'];
export type ResetPasswordRequest = components['schemas']['ResetPasswordRequest'];

// Property & Unit Types
export type PropertyDto = components['schemas']['PropertyDto'];
export type PropertyDtoPagedResult = components['schemas']['PropertyDtoPagedResult'];
export type CreatePropertyRequest = components['schemas']['CreatePropertyRequest'];
export type UpdatePropertyRequest = components['schemas']['UpdatePropertyRequest'];

export type UnitDto = components['schemas']['UnitDto'];
export type UnitDtoPagedResult = components['schemas']['UnitDtoPagedResult'];
export type CreateUnitRequest = components['schemas']['CreateUnitRequest'];
export type UpdateUnitRequest = components['schemas']['UpdateUnitRequest'];

// Contract Types
export type ContractDto = components['schemas']['ContractDto'];
export type ContractDtoPagedResult = components['schemas']['ContractDtoPagedResult'];
export type CreateContractRequest = components['schemas']['CreateContractRequest'];
export type ContractStatus = 'Pending' | 'Active' | 'Expired' | 'Cancelled' | 'Terminated';
export type UnitStatus = 'Available' | 'Reserved' | 'Rented' | 'Maintenance';

// Payment Types (Prepared for frontend UI & API integration)
export interface PaymentDto {
  id: number;
  rentalContractId: number;
  tenantProfileId: number;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  status: 'Pending' | 'Paid' | 'Late' | 'Cancelled';
  method?: 'Cash' | 'BankTransfer' | 'Card' | null;
  referenceNumber?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface MarkPaymentPaidRequest {
  method: 'Cash' | 'BankTransfer' | 'Card';
  referenceNumber?: string;
}

// User & Role Constants
export type UserRole = 'Admin' | 'Owner' | 'Tenant';

export interface UserSession {
  userId: string;
  email: string;
  roles: UserRole[];
}

// Generic Pagination
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// User Profile Types
export interface UserProfileDto {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  roles: string[];
  createdAt: string;
  ownerProfileId?: number | null;
  companyName?: string | null;
  propertiesCount: number;
  unitsCount: number;
  tenantProfileId?: number | null;
  nationalId?: string | null;
  activeContractsCount: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  companyName?: string;
  nationalId?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Maintenance Types
export type MaintenancePriority = 1 | 2 | 3 | 4;
export type MaintenanceStatus = 1 | 2 | 3 | 4;

export interface MaintenanceUpdateDto {
  id: number;
  oldStatus?: number | null;
  newStatus: number;
  updatedByUserId: string;
  note?: string | null;
  createdAt: string;
}

export interface MaintenanceRequestDto {
  id: number;
  unitId: number;
  unitNumber: string;
  propertyId: number;
  propertyName: string;
  tenantProfileId: number;
  tenantName: string;
  title: string;
  description: string;
  priority: number;
  status: number;
  createdAt: string;
  updates: MaintenanceUpdateDto[];
}

export interface CreateMaintenanceRequest {
  unitId: number;
  title: string;
  description: string;
  priority: number;
}

export interface UpdateMaintenanceStatusRequest {
  status: number;
  note?: string;
}
