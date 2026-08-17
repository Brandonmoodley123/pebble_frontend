import { tokenStore } from "./token-store";
import type {
  AssignUserOrganizationRequest,
  AuditLogDto,
  ClientDto,
  ClientProductDto,
  CreateClientProductRequest,
  CreateClientRequest,
  CreateOrganizationRequest,
  CreateProductTypeRequest,
  LoginRequest,
  LoginResponse,
  OrganizationDto,
  PagedResult,
  ProblemDetails,
  ProductTypeDto,
  RegisterUserRequest,
  SetUserPasswordRequest,
  UpdateClientProductRequest,
  UpdateClientRequest,
  UpdateClientStatusRequest,
  UpdateOrganizationRequest,
  UpdateProductTypeRequest,
  UpdateUserActiveRequest,
  UpdateUserRequest,
  UserDto,
  UserOrganizationActionRequest,
  UserOrganizationDto,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5227/api";

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, message: string, errorCode?: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
  }
}

// Set by AuthProvider so a 401 from any request can force a clean logout+redirect
// without every call site having to handle it individually.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.getToken();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) unauthorizedHandler();

    const problem = body as ProblemDetails | null;
    const message = problem?.detail ?? problem?.title ?? `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, problem?.errorCode, problem?.errors);
  }

  return body as T;
}

export const authApi = {
  login: (payload: LoginRequest) => request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload: RegisterUserRequest) => request<UserDto>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
};

export const usersApi = {
  list: () => request<UserDto[]>("/users"),
  get: (id: number) => request<UserDto>(`/users/${id}`),
  update: (id: number, payload: UpdateUserRequest) =>
    request<UserDto>(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setActive: (id: number, payload: UpdateUserActiveRequest) =>
    request<UserDto>(`/users/${id}/active`, { method: "PATCH", body: JSON.stringify(payload) }),
  setPassword: (id: number, payload: SetUserPasswordRequest) =>
    request<void>(`/users/${id}/password`, { method: "PATCH", body: JSON.stringify(payload) }),
  getOrganizations: (id: number) => request<UserOrganizationDto[]>(`/users/${id}/organizations`),
  assignOrganization: (id: number, payload: AssignUserOrganizationRequest) =>
    request<UserOrganizationDto>(`/users/${id}/organizations`, { method: "POST", body: JSON.stringify(payload) }),
  deactivateOrganization: (id: number, userOrganizationId: number, payload: UserOrganizationActionRequest) =>
    request<UserOrganizationDto>(`/users/${id}/organizations/${userOrganizationId}/deactivate`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  reactivateOrganization: (id: number, userOrganizationId: number, payload: UserOrganizationActionRequest) =>
    request<UserOrganizationDto>(`/users/${id}/organizations/${userOrganizationId}/reactivate`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const clientsApi = {
  list: (params: { search?: string; status?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<ClientDto>>(`/clients${buildQuery(params)}`),
  get: (id: number) => request<ClientDto>(`/clients/${id}`),
  create: (payload: CreateClientRequest) => request<ClientDto>("/clients", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: UpdateClientRequest) =>
    request<ClientDto>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateStatus: (id: number, payload: UpdateClientStatusRequest) =>
    request<ClientDto>(`/clients/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/clients/${id}`, { method: "DELETE" }),
};

export const organizationsApi = {
  list: (params: { search?: string; type?: string; page?: number; pageSize?: number } = {}) =>
    request<PagedResult<OrganizationDto>>(`/organizations${buildQuery(params)}`),
  get: (id: number) => request<OrganizationDto>(`/organizations/${id}`),
  create: (payload: CreateOrganizationRequest) =>
    request<OrganizationDto>("/organizations", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: UpdateOrganizationRequest) =>
    request<OrganizationDto>(`/organizations/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/organizations/${id}`, { method: "DELETE" }),
};

export const productTypesApi = {
  list: (params: { search?: string; category?: string; organizationId?: number; page?: number; pageSize?: number } = {}) =>
    request<PagedResult<ProductTypeDto>>(`/product-types${buildQuery(params)}`),
  get: (id: number) => request<ProductTypeDto>(`/product-types/${id}`),
  create: (payload: CreateProductTypeRequest) =>
    request<ProductTypeDto>("/product-types", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: UpdateProductTypeRequest) =>
    request<ProductTypeDto>(`/product-types/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/product-types/${id}`, { method: "DELETE" }),
};

export const clientProductsApi = {
  list: (params: { clientId?: number; organizationId?: number; status?: string; page?: number; pageSize?: number } = {}) =>
    request<PagedResult<ClientProductDto>>(`/client-products${buildQuery(params)}`),
  get: (id: number) => request<ClientProductDto>(`/client-products/${id}`),
  create: (payload: CreateClientProductRequest) =>
    request<ClientProductDto>("/client-products", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: UpdateClientProductRequest) =>
    request<ClientProductDto>(`/client-products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/client-products/${id}`, { method: "DELETE" }),
};

export const auditLogsApi = {
  list: (params: { entityName?: string; entityId?: string; userId?: number; page?: number; pageSize?: number } = {}) =>
    request<PagedResult<AuditLogDto>>(`/audit-logs${buildQuery(params)}`),
};
