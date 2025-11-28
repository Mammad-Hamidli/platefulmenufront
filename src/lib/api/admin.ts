import type { AxiosInstance } from 'axios';
import type { Branch, MenuItem, TableEntity, UserRecord } from '@/types/entities';

export interface StaffCreatePayload {
  email: string;
  role: 'ROLE_WAITER' | 'ROLE_KITCHEN';
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  salaryAmount?: number;
  salaryPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface StaffUpdatePayload {
  role?: 'ROLE_WAITER' | 'ROLE_KITCHEN';
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  salaryAmount?: number;
  salaryPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  branchId?: number;
}

export interface TablePayload {
  name?: string | null;
  tableNumber?: number | null;
  seatCount?: number | null;
  restaurantId?: number;
  branchId?: number;
}

const STAFF_ROLES = new Set(['ROLE_WAITER', 'ROLE_KITCHEN']);

export const getBranch = async (api: AxiosInstance, branchId: number) => {
  const { data } = await api.get<Branch>(`/branches/${branchId}`);
  return data;
};

export const listStaff = async (api: AxiosInstance, branchId: number) => {
  const { data } = await api.get<UserRecord[]>('/users', {
    params: { branchId },
  });
  return (data ?? []).filter((user) => STAFF_ROLES.has(user.role));
};

export const createStaff = async (
  api: AxiosInstance,
  restaurantId: number,
  branchId: number,
  payload: StaffCreatePayload
) => {
  const body: Record<string, unknown> = {
    email: payload.email.toLowerCase(),
    role: payload.role,
    restaurantId,
    branchId,
  };
  if (payload.password) {
    body.password = payload.password;
  }
  // Name fields - backend expects fullName, not firstName/lastName separately
  if (payload.firstName?.trim() || payload.lastName?.trim()) {
    const firstName = payload.firstName?.trim() || '';
    const lastName = payload.lastName?.trim() || '';
    body.fullName = `${firstName} ${lastName}`.trim();
    console.log('[createStaff] Sending name fields:', {
      firstName: payload.firstName,
      lastName: payload.lastName,
      fullName: body.fullName,
    });
  }
  // Required fields for staff members
  if (payload.phoneNumber !== undefined && payload.phoneNumber !== null) {
    body.phoneNumber = payload.phoneNumber;
  }
  if (payload.salaryAmount !== undefined && payload.salaryAmount !== null) {
    // Ensure salaryAmount is sent as a number (float/double), not BigDecimal
    body.salaryAmount = Number(payload.salaryAmount);
  }
  if (payload.salaryPeriod !== undefined && payload.salaryPeriod !== null) {
    body.salaryPeriod = payload.salaryPeriod;
  }
  
  console.log('[createStaff] Complete request body being sent to backend:', JSON.stringify(body, null, 2));
  
  const { data } = await api.post<UserRecord>('/users', body);
  
  console.log('[createStaff] Response from backend:', {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    phoneNumber: data.phoneNumber,
    salaryAmount: data.salaryAmount,
    salaryPeriod: data.salaryPeriod,
    allKeys: Object.keys(data),
  });
  
  return data;
};

export const updateStaff = async (
  api: AxiosInstance,
  email: string,
  payload: StaffUpdatePayload
) => {
  const body: Record<string, unknown> = {};
  
  if (payload.role) {
    body.role = payload.role;
  }
  if (payload.password) {
    body.password = payload.password;
  }
  // Name fields - backend supports both fullName and firstName/lastName
  // According to API docs: server derives fullName when both firstName/lastName are provided
  // We'll send firstName/lastName separately to let backend handle it, or fullName if only one is provided
  if (payload.firstName !== undefined || payload.lastName !== undefined) {
    const firstName = payload.firstName?.trim() || '';
    const lastName = payload.lastName?.trim() || '';
    // Send both fields separately - backend will derive fullName automatically
    if (firstName) {
      body.firstName = firstName;
    }
    if (lastName) {
      body.lastName = lastName;
    }
    // Also send fullName as fallback (backend accepts either approach)
    if (firstName || lastName) {
      body.fullName = `${firstName} ${lastName}`.trim();
    }
  }
  if (payload.phoneNumber !== undefined && payload.phoneNumber !== null) {
    body.phoneNumber = payload.phoneNumber;
  }
  if (payload.salaryAmount !== undefined && payload.salaryAmount !== null) {
    body.salaryAmount = Number(payload.salaryAmount);
  }
  if (payload.salaryPeriod !== undefined && payload.salaryPeriod !== null) {
    body.salaryPeriod = payload.salaryPeriod;
  }
  if (payload.branchId !== undefined && payload.branchId !== null) {
    body.branchId = payload.branchId;
  }
  
  console.log('[updateStaff] Sending update request:', {
    email: email.toLowerCase(),
    url: `/users/${encodeURIComponent(email.toLowerCase())}`,
    body: JSON.stringify(body, null, 2),
  });
  
  try {
    const { data } = await api.patch<UserRecord>(`/users/${encodeURIComponent(email.toLowerCase())}`, body);
    console.log('[updateStaff] Update successful:', data);
    return data;
  } catch (error: any) {
    console.error('[updateStaff] Update failed:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      requestBody: body,
    });
    throw error;
  }
};

export const deleteStaff = async (api: AxiosInstance, email: string) => {
  await api.delete(`/users/${encodeURIComponent(email.toLowerCase())}`);
};

export const listTables = async (api: AxiosInstance, restaurantId: number, branchId: number) => {
  const { data } = await api.get<TableEntity[]>('/tables', {
    params: { restId: restaurantId },
  });
  return (data ?? []).filter((table) => table.branchId === branchId);
};

export const createTable = async (
  api: AxiosInstance,
  restaurantId: number,
  branchId: number,
  payload: TablePayload
) => {
  const { data } = await api.post<TableEntity>('/tables', {
    restaurantId,
    branchId,
    name: payload.name ?? '',
    tableNumber: payload.tableNumber ?? null,
    seatCount: payload.seatCount ?? null,
  });
  return data;
};

export const updateTable = async (
  api: AxiosInstance,
  tableId: number,
  payload: TablePayload
) => {
  const body: Record<string, unknown> = {
    name: payload.name ?? '',
    tableNumber: payload.tableNumber ?? null,
    seatCount: payload.seatCount ?? null,
  };
  if (payload.restaurantId !== undefined) {
    body.restaurantId = payload.restaurantId;
  }
  if (payload.branchId !== undefined) {
    body.branchId = payload.branchId;
  }
  const { data } = await api.put<TableEntity>(`/tables/${tableId}`, body);
  return data;
};

export const deleteTable = async (api: AxiosInstance, tableId: number) => {
  await api.delete(`/tables/${tableId}`);
};

export const listMenuItems = async (api: AxiosInstance, restaurantId: number) => {
  const { data } = await api.get<MenuItem[]>('/menu/admin/all', {
    params: { restId: restaurantId },
  });
  return data ?? [];
};

