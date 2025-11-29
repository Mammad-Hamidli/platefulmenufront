import type { AxiosInstance } from 'axios';
import type { Order } from '@/types/entities';

/**
 * Get active orders for kitchen (branch-scoped)
 * Endpoint: GET /api/branches/{branchId}/kitchen/orders
 * Returns: List<OrderResponseDTO> filtered to kitchen-relevant statuses (ORDERED, PREPARING, PREPARED_WAITING)
 * Authorization: ROLE_KITCHEN, ROLE_ADMIN, or ROLE_SUPERADMIN (or KDS token)
 * 
 * If no authentication is provided, returns 401 with KitchenAuthRequiredResponse:
 * { "requiresPin": true, "message": "PIN authentication required", "branchId": number }
 */
export const listKitchenOrders = async (api: AxiosInstance, branchId: number): Promise<Order[]> => {
  try {
    const { data } = await api.get<Order[]>(`/branches/${branchId}/kitchen/orders`);
    console.log('[listKitchenOrders] Received orders:', data?.length || 0);
    return data ?? [];
  } catch (error: any) {
    // 401 with requiresPin is expected when no token is present - let it propagate
    // The calling component will handle showing PIN login
    if (error?.response?.status === 401) {
      const responseData = error.response.data;
      if (responseData?.requiresPin) {
        console.log('[listKitchenOrders] PIN authentication required');
        // Re-throw with the response data so caller can check requiresPin
        throw error;
      }
    }
    
    console.error('[listKitchenOrders] Error:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};

/**
 * Accept an order - moves it to PREPARING status (branch-scoped)
 * Endpoint: POST /api/branches/{branchId}/kitchen/orders/{orderId}/accept
 * Authorization: ROLE_KITCHEN, ROLE_ADMIN, or ROLE_SUPERADMIN (or KDS token)
 * Response: OrderResponseDTO with status updated to PREPARING
 */
export const acceptOrder = async (api: AxiosInstance, branchId: number, orderId: number): Promise<Order> => {
  try {
    console.log('[acceptOrder] Accepting order:', orderId);
    const { data } = await api.post<Order>(`/branches/${branchId}/kitchen/orders/${orderId}/accept`);
    console.log('[acceptOrder] Order accepted successfully:', data);
    return data;
  } catch (error: any) {
    console.error('[acceptOrder] Error:', {
      orderId,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};

/**
 * Mark order as ready - moves it to PREPARED_WAITING status (branch-scoped)
 * Endpoint: POST /api/branches/{branchId}/kitchen/orders/{orderId}/ready
 * Authorization: ROLE_KITCHEN, ROLE_ADMIN, or ROLE_SUPERADMIN (or KDS token)
 * Response: OrderResponseDTO with status updated to PREPARED_WAITING
 */
export const markOrderReady = async (api: AxiosInstance, branchId: number, orderId: number): Promise<Order> => {
  try {
    console.log('[markOrderReady] Marking order as ready:', orderId);
    const { data } = await api.post<Order>(`/branches/${branchId}/kitchen/orders/${orderId}/ready`);
    console.log('[markOrderReady] Order marked ready successfully:', data);
    return data;
  } catch (error: any) {
    console.error('[markOrderReady] Error:', {
      orderId,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};

/**
 * Verify Kitchen PIN and get KDS token
 * Endpoint: POST /api/branches/{branchId}/kitchen/pin/verify
 * Authorization: None (public endpoint)
 * Response: KdsLoginResponseDTO with kdsToken and expiresAt
 */
export interface KdsLoginResponse {
  branchId: number;
  kdsToken: string;
  expiresAt: string;
}

export const verifyKitchenPin = async (
  api: AxiosInstance,
  branchId: number,
  pin: string
): Promise<KdsLoginResponse> => {
  try {
    console.log('[verifyKitchenPin] Verifying PIN for branch:', branchId);
    const { data } = await api.post<KdsLoginResponse>(`/branches/${branchId}/kitchen/pin/verify`, { pin });
    console.log('[verifyKitchenPin] PIN verified successfully');
    return data;
  } catch (error: any) {
    console.error('[verifyKitchenPin] Error:', {
      branchId,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};

/**
 * Kitchen PIN Management (Admin only - uses JWT, not KDS token)
 */

export interface KitchenPinInfo {
  branchId: number;
  isSet: boolean;
  lastUpdatedAt?: string | null;
  maskedPin?: string | null;
  pin?: string | null; // Only returned when generating new PIN
}

/**
 * Get Kitchen PIN info
 * Endpoint: GET /api/branches/{branchId}/kitchen/pin
 * Authorization: ROLE_ADMIN or ROLE_SUPERADMIN (JWT)
 */
export const getKitchenPinInfo = async (api: AxiosInstance, branchId: number): Promise<KitchenPinInfo> => {
  try {
    const { data } = await api.get<KitchenPinInfo>(`/branches/${branchId}/kitchen/pin`);
    return data;
  } catch (error: any) {
    console.error('[getKitchenPinInfo] Error:', {
      branchId,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};

/**
 * Generate random Kitchen PIN
 * Endpoint: POST /api/branches/{branchId}/kitchen/pin/generate
 * Authorization: ROLE_ADMIN or ROLE_SUPERADMIN (JWT)
 * Response: KitchenPinInfo with full PIN included (only time it's returned)
 */
export const generateKitchenPin = async (api: AxiosInstance, branchId: number): Promise<KitchenPinInfo> => {
  try {
    const { data } = await api.post<KitchenPinInfo>(`/branches/${branchId}/kitchen/pin/generate`);
    return data;
  } catch (error: any) {
    console.error('[generateKitchenPin] Error:', {
      branchId,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};

/**
 * Set custom Kitchen PIN
 * Endpoint: POST /api/branches/{branchId}/kitchen/pin
 * Authorization: ROLE_ADMIN or ROLE_SUPERADMIN (JWT)
 * Request body: { pin: string } (6 digits)
 */
export const setKitchenPin = async (api: AxiosInstance, branchId: number, pin: string): Promise<KitchenPinInfo> => {
  try {
    const { data } = await api.post<KitchenPinInfo>(`/branches/${branchId}/kitchen/pin`, { pin });
    return data;
  } catch (error: any) {
    console.error('[setKitchenPin] Error:', {
      branchId,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};

