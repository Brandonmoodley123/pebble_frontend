export type Role = "Admin" | "Broker";
export type ClientStatus = "Active" | "Inactive" | "Deceased";
export type ClientProductStatus = "Active" | "Lapsed" | "Cancelled";
export type OrganizationType = "Insurer" | "MedicalAid" | "InvestmentHouse" | "Other";
export type ProductCategory = "Policy" | "Investment" | "MedicalAid";

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  errorCode?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  reason: string;
}

export interface UpdateUserActiveRequest {
  isActive: boolean;
  reason: string;
}

export interface SetUserPasswordRequest {
  newPassword: string;
  reason: string;
}

export interface UserOrganizationDto {
  id: number;
  userId: number;
  organizationId: number;
  organizationName?: string | null;
  productTypeId?: number | null;
  productTypeName?: string | null;
  isActive: boolean;
  assignedAt: string;
  assignedByUserId?: number | null;
  assignedByUsername?: string | null;
  assignedReason?: string | null;
  deactivatedAt?: string | null;
  deactivatedByUserId?: number | null;
  deactivatedByUsername?: string | null;
  deactivationReason?: string | null;
}

export interface AssignUserOrganizationRequest {
  organizationId: number;
  productTypeId?: number;
  reason: string;
}

export interface UserOrganizationActionRequest {
  reason: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserDto;
}

export interface RegisterUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: Role;
}

export interface ClientDto {
  id: number;
  firstName: string;
  lastName: string;
  idNumber: string;
  email?: string | null;
  phoneNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt?: string | null;
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
  productCount: number;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  idNumber: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth?: string;
  notes?: string;
}

export interface UpdateClientRequest extends CreateClientRequest {
  reason: string;
}

export interface InitialClientProduct {
  organizationId: number;
  productTypeId: number;
  policyNumber?: string;
  premiumAmount?: number;
  startDate: string;
}

export interface UpdateClientStatusRequest {
  status: ClientStatus;
  reason: string;
}

export interface OrganizationDto {
  id: number;
  name: string;
  type: OrganizationType;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAt: string;
  createdByUserId?: number | null;
}

export interface CreateOrganizationRequest {
  name: string;
  type: OrganizationType;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateOrganizationRequest extends CreateOrganizationRequest {
  isActive: boolean;
}

export interface ProductTypeDto {
  id: number;
  name: string;
  category: ProductCategory;
  description?: string | null;
  organizationId: number;
  organizationName?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductTypeRequest {
  name: string;
  category: ProductCategory;
  description?: string;
  organizationId: number;
}

export interface UpdateProductTypeRequest extends CreateProductTypeRequest {
  isActive: boolean;
}

export interface ClientProductDto {
  id: number;
  clientId: number;
  clientFullName?: string | null;
  productTypeId: number;
  productTypeName?: string | null;
  productCategory?: string | null;
  organizationId: number;
  organizationName?: string | null;
  policyNumber?: string | null;
  premiumAmount?: number | null;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  status: ClientProductStatus;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateClientProductRequest {
  clientId: number;
  productTypeId: number;
  organizationId: number;
  policyNumber?: string;
  premiumAmount?: number;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateClientProductRequest {
  productTypeId: number;
  organizationId: number;
  policyNumber?: string;
  premiumAmount?: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  status: ClientProductStatus;
}

export interface AuditLogDto {
  id: number;
  userId?: number | null;
  username?: string | null;
  action: string;
  entityName: string;
  entityId: string;
  changes?: string | null;
  reason?: string | null;
  timestamp: string;
}
