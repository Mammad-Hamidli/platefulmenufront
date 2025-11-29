'use client';

// Disable SSR completely - this route must be client-only
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = 'auto';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getKdsToken, clearKdsToken } from '@/lib/kds-token';
import { API_BASE_URL } from '@/lib/env';
import { listKitchenOrders, acceptOrder, markOrderReady } from '@/lib/api/kitchen';
import { createApiClient } from '@/lib/api';
import type { Order, OrderStatus } from '@/types/entities';

if (typeof window === 'undefined') {
  console.log('[KDS] ❌ SERVER RENDER BLOCKED');
}

type OrdersByStatus = {
  ORDERED: Order[];
  PREPARING: Order[];
  PREPARED_WAITING: Order[];
};

export default function KitchenOrdersPage() {
  if (typeof window === 'undefined') return null;

  console.log('[Kitchen] Client-side render OK');
  console.log('[Kitchen] Window check passed');

  const params = useParams();
  const router = useRouter();
  const branchId = Number(params.branchId);
  const hasInitializedRef = useRef(false);

  const [orders, setOrders] = useState<OrdersByStatus>({
    ORDERED: [],
    PREPARING: [],
    PREPARED_WAITING: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  // Check KDS token on mount - ONLY runs client-side
  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitializedRef.current) {
      console.log('[KDS Orders] ⚠️ Already initialized, skipping');
      return;
    }

    console.log('[KDS Orders] 🔄 Initialization started (client-side only)');
    
    if (isNaN(branchId)) {
      console.error('[KDS Orders] ❌ Invalid branch ID:', params.branchId);
      setError('Invalid branch ID');
      setLoading(false);
      return;
    }

    // Ensure localStorage is available
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.error('[KDS Orders] ❌ localStorage not available - cannot proceed');
      setError('Storage not available');
      setLoading(false);
      return;
    }

    console.log('[Kitchen] Token check runs');
    console.log('[KDS Orders] 📋 Checking for KDS token...');
    const token = getKdsToken(branchId);
    console.log('[KDS Orders] Token check result:', {
      branchId,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : null,
      localStorageAvailable: typeof localStorage !== 'undefined',
    });

    if (!token) {
      console.log('[KDS Orders] ❌ No token found, redirecting to PIN page');
      hasInitializedRef.current = true;
      router.replace(`/kitchen/${branchId}`);
      return;
    }

    console.log('[KDS Orders] ✅ Token found, will fetch orders');
    hasInitializedRef.current = true;

    // Start fetching orders - only from client-side
    void fetchOrders();
  }, [branchId]); // Removed router from deps to prevent loop

  // Fetch orders function - uses KDS token via createApiClient (no JWT)
  // This function ONLY runs client-side, called from useEffect
  const fetchOrders = useCallback(async () => {
    // CRITICAL: Never run on server
    if (typeof window === 'undefined') {
      console.error('[KDS Orders] ❌ fetchOrders called on server - aborting');
      return;
    }

    if (isNaN(branchId)) {
      console.error('[KDS Orders] ❌ Invalid branchId in fetchOrders');
      return;
    }

    const token = getKdsToken(branchId);
    console.log('[KDS Orders] 🔍 Token check in fetchOrders:', {
      branchId,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : null,
    });

    if (!token) {
      console.error('[KDS Orders] ❌ No token available for fetching orders');
      clearKdsToken(branchId);
      router.replace(`/kitchen/${branchId}`);
      return;
    }

    console.log('[KDS Orders] 📡 Fetching orders with KDS token header');
    console.log('[KDS Orders] Request URL will be:', `/api/branches/${branchId}/kitchen/orders`);

    try {
      setLoading(true);
      setError(null);

      // Create API client WITHOUT JWT token - only KDS token will be added by interceptor
      const api = createApiClient(undefined, () => {
        // On unauthorized, clear token and redirect to PIN page
        console.log('[KDS Orders] ❌ Unauthorized callback triggered');
        clearKdsToken(branchId);
        router.replace(`/kitchen/${branchId}`);
      });

      console.log('[Kitchen] Orders API runs');
      console.log('[KDS Orders] 🚀 Calling listKitchenOrders API...');
      const fetchedOrders = await listKitchenOrders(api, branchId);
      console.log('[KDS Orders] ✅ Orders fetched successfully, count:', fetchedOrders.length);

      // Group orders by status
      const grouped: OrdersByStatus = {
        ORDERED: [],
        PREPARING: [],
        PREPARED_WAITING: [],
      };

      fetchedOrders.forEach((order) => {
        if (order.status === 'ORDERED' || order.status === 'PREPARING' || order.status === 'PREPARED_WAITING') {
          grouped[order.status].push(order);
        }
      });

      setOrders(grouped);
      console.log('[KDS Orders] ✅ Orders grouped successfully:', {
        ordered: grouped.ORDERED.length,
        preparing: grouped.PREPARING.length,
        prepared: grouped.PREPARED_WAITING.length,
        total: fetchedOrders.length,
      });
    } catch (err: any) {
      console.error('[KDS Orders] ❌ Error fetching orders:', {
        error: err,
        message: err?.message,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        responseData: err?.response?.data,
      });

      // Handle 401 - token expired or invalid
      if (err?.response?.status === 401) {
        const responseData = err.response.data;
        console.log('[KDS Orders] ❌ 401 Unauthorized:', {
          requiresPin: responseData?.requiresPin,
          message: responseData?.message,
        });
        if (responseData?.requiresPin) {
          // PIN required - redirect to PIN page
          console.log('[KDS Orders] 🔐 PIN authentication required - redirecting');
          clearKdsToken(branchId);
          router.replace(`/kitchen/${branchId}`);
          return;
        }
      }

      // Handle 403 - token expired or invalid
      if (err?.response?.status === 403) {
        console.log('[KDS Orders] ❌ 403 Forbidden - token expired or invalid:', {
          message: err?.response?.data?.message,
        });
        clearKdsToken(branchId);
        router.replace(`/kitchen/${branchId}`);
        return;
      }

      console.error('[KDS Orders] ❌ Unknown error - showing error message');
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      console.log('[KDS Orders] ✅ fetchOrders completed (loading set to false)');
    }
  }, [branchId]); // Removed router dependency to prevent callback recreation

  // Auto-refresh orders every 5 seconds - ONLY client-side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading) return;

    console.log('[KDS Orders] 🔄 Setting up auto-refresh interval (5 seconds)');
    const interval = setInterval(() => {
      console.log('[KDS Orders] 🔄 Auto-refresh triggered');
      void fetchOrders();
    }, 5000);

    return () => {
      console.log('[KDS Orders] 🧹 Cleaning up auto-refresh interval');
      clearInterval(interval);
    };
  }, [loading, fetchOrders]);

  // Handle accept order (ORDERED -> PREPARING)
  const handleAcceptOrder = async (orderId: number) => {
    if (typeof window === 'undefined') {
      console.error('[KDS Orders] ❌ handleAcceptOrder called on server');
      return;
    }

    if (isNaN(branchId)) {
      console.error('[KDS Orders] ❌ Invalid branchId in handleAcceptOrder');
      return;
    }

    const token = getKdsToken(branchId);
    console.log('[KDS Orders] 🔍 Token check in handleAcceptOrder:', {
      branchId,
      orderId,
      hasToken: !!token,
    });

    if (!token) {
      console.error('[KDS Orders] ❌ No token in handleAcceptOrder - redirecting');
      router.replace(`/kitchen/${branchId}`);
      return;
    }

    try {
      setProcessingOrderId(orderId);
      console.log('[KDS Orders] ✅ Accepting order:', orderId);

      // Create API client WITHOUT JWT token - only KDS token will be added by interceptor
      const api = createApiClient(undefined, () => {
        clearKdsToken(branchId);
        router.replace(`/kitchen/${branchId}`);
      });

      await acceptOrder(api, branchId, orderId);

      // Refresh orders
      await fetchOrders();
    } catch (err: any) {
      console.error('[KDS] Error accepting order:', err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        clearKdsToken(branchId);
        router.replace(`/kitchen/${branchId}`);
        return;
      }

      alert('Failed to accept order. Please try again.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Handle mark order ready (PREPARING -> PREPARED_WAITING)
  const handleMarkReady = async (orderId: number) => {
    if (typeof window === 'undefined') {
      console.error('[KDS Orders] ❌ handleMarkReady called on server');
      return;
    }

    if (isNaN(branchId)) {
      console.error('[KDS Orders] ❌ Invalid branchId in handleMarkReady');
      return;
    }

    const token = getKdsToken(branchId);
    console.log('[KDS Orders] 🔍 Token check in handleMarkReady:', {
      branchId,
      orderId,
      hasToken: !!token,
    });

    if (!token) {
      console.error('[KDS Orders] ❌ No token in handleMarkReady - redirecting');
      router.replace(`/kitchen/${branchId}`);
      return;
    }

    try {
      setProcessingOrderId(orderId);
      console.log('[KDS Orders] ✅ Marking order as ready:', orderId);

      // Create API client WITHOUT JWT token - only KDS token will be added by interceptor
      const api = createApiClient(undefined, () => {
        clearKdsToken(branchId);
        router.replace(`/kitchen/${branchId}`);
      });

      await markOrderReady(api, branchId, orderId);

      // Refresh orders
      await fetchOrders();
    } catch (err: any) {
      console.error('[KDS] Error marking order ready:', err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        clearKdsToken(branchId);
        router.replace(`/kitchen/${branchId}`);
        return;
      }

      alert('Failed to mark order as ready. Please try again.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const formatPrice = (cents: number | null | undefined) => {
    if (!cents) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isNaN(branchId)) {
    return (
      <main className="min-h-screen bg-slate-900 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300">
            Invalid branch ID
          </div>
        </div>
      </main>
    );
  }

  if (loading && orders.ORDERED.length === 0 && orders.PREPARING.length === 0 && orders.PREPARED_WAITING.length === 0) {
    return (
      <main className="min-h-screen bg-slate-900 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center text-white">Loading orders...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Kitchen - Branch {branchId}</h1>
          <button
            onClick={() => {
              clearKdsToken(branchId);
              router.replace(`/kitchen/${branchId}`);
            }}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* New Orders */}
          <section className="rounded-lg bg-slate-800 p-4">
            <h2 className="mb-4 border-b-2 border-yellow-500 pb-2 text-xl font-bold text-white">
              New Orders
            </h2>
            {orders.ORDERED.length === 0 ? (
              <p className="text-center text-slate-400">No orders</p>
            ) : (
              <div className="space-y-3">
                {orders.ORDERED.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-600 bg-slate-700 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">Order #{order.id}</p>
                        <p className="text-xs text-slate-400">Table: {order.tableName || order.tableId}</p>
                        {order.createdAt && (
                          <p className="text-xs text-slate-400">{formatTime(order.createdAt)}</p>
                        )}
                      </div>
                      {order.totalCents && (
                        <p className="text-sm font-medium text-white">{formatPrice(order.totalCents)}</p>
                      )}
                    </div>

                    <div className="mb-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-300">
                          <span className="font-medium">{item.qty}x</span> {item.menuItemName || `Item ${item.menuItemId}`}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="mb-3 text-xs text-yellow-400">Note: {order.notes}</p>
                    )}

                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={processingOrderId === order.id}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingOrderId === order.id ? 'Processing...' : 'Accept Order'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Preparing */}
          <section className="rounded-lg bg-slate-800 p-4">
            <h2 className="mb-4 border-b-2 border-yellow-500 pb-2 text-xl font-bold text-white">
              Preparing
            </h2>
            {orders.PREPARING.length === 0 ? (
              <p className="text-center text-slate-400">No orders</p>
            ) : (
              <div className="space-y-3">
                {orders.PREPARING.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-600 bg-slate-700 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">Order #{order.id}</p>
                        <p className="text-xs text-slate-400">Table: {order.tableName || order.tableId}</p>
                        {order.createdAt && (
                          <p className="text-xs text-slate-400">{formatTime(order.createdAt)}</p>
                        )}
                      </div>
                      {order.totalCents && (
                        <p className="text-sm font-medium text-white">{formatPrice(order.totalCents)}</p>
                      )}
                    </div>

                    <div className="mb-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-300">
                          <span className="font-medium">{item.qty}x</span> {item.menuItemName || `Item ${item.menuItemId}`}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="mb-3 text-xs text-yellow-400">Note: {order.notes}</p>
                    )}

                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={processingOrderId === order.id}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingOrderId === order.id ? 'Processing...' : 'Mark Ready'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ready */}
          <section className="rounded-lg bg-slate-800 p-4">
            <h2 className="mb-4 border-b-2 border-yellow-500 pb-2 text-xl font-bold text-white">
              Ready
            </h2>
            {orders.PREPARED_WAITING.length === 0 ? (
              <p className="text-center text-slate-400">No orders</p>
            ) : (
              <div className="space-y-3">
                {orders.PREPARED_WAITING.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-600 bg-slate-700 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">Order #{order.id}</p>
                        <p className="text-xs text-slate-400">Table: {order.tableName || order.tableId}</p>
                        {order.createdAt && (
                          <p className="text-xs text-slate-400">{formatTime(order.createdAt)}</p>
                        )}
                      </div>
                      {order.totalCents && (
                        <p className="text-sm font-medium text-white">{formatPrice(order.totalCents)}</p>
                      )}
                    </div>

                    <div className="mb-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-300">
                          <span className="font-medium">{item.qty}x</span> {item.menuItemName || `Item ${item.menuItemId}`}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="mb-3 text-xs text-yellow-400">Note: {order.notes}</p>
                    )}

                    <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-3 py-2 text-center text-sm font-medium text-green-300">
                      Ready for Pickup
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

