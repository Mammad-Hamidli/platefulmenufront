import type { MenuItem } from '@/types/entities';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface StartSessionRequest {
  branchId: number;
  tableId: number;
}

export interface StartSessionResponse {
  guestSessionId: string;
  restaurantId: number;
}

export interface CreateOrderRequest {
  guestSessionId: string;
  branchId: number;
  tableId: number;
  items: OrderItemRequest[];
}

export interface OrderItemRequest {
  menuItemId: number;
  qty: number;
}

/**
 * Start a customer session
 * POST /api/customer/session/start
 */
export const startCustomerSession = async (
  branchId: number,
  tableId: number
): Promise<StartSessionResponse> => {
  const response = await fetch(`${BASE_URL}/api/customer/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branchId,
      tableId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to start session: ${response.statusText}`);
  }

  return response.json();
};

/**
 * End a customer session
 * POST /api/customer/session/end
 */
export const endCustomerSession = async (guestSessionId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/customer/session/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      guestSessionId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to end session: ${response.statusText}`);
  }
};

/**
 * Get menu for customer
 * GET /api/customer/menu?branchId={branchId}&tableId={tableId}
 */
export const getCustomerMenu = async (
  branchId: number,
  tableId: number
): Promise<MenuItem[]> => {
  const url = new URL(`${BASE_URL}/api/customer/menu`);
  url.searchParams.set('branchId', String(branchId));
  url.searchParams.set('tableId', String(tableId));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to load menu: ${response.statusText}`);
  }

  const data = await response.json();
  return data ?? [];
};

/**
 * Create customer order
 * POST /api/customer/orders
 */
export const createCustomerOrder = async (
  payload: CreateOrderRequest
): Promise<unknown> => {
  const response = await fetch(`${BASE_URL}/api/customer/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create order: ${response.statusText}`);
  }

  return response.json();
};

