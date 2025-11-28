'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  startCustomerSession,
  getCustomerMenu,
  createCustomerOrder,
  type CreateOrderRequest,
} from '@/lib/api/customer';
import type { MenuItem } from '@/types/entities';
import { CustomerMenu } from '@/components/customer/CustomerMenu';
import { Cart } from '@/components/customer/Cart';
import { OrderSuccess } from '@/components/customer/OrderSuccess';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

type PageState = 'loading' | 'menu' | 'success';

export default function TablePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tableId = Number(params.tableId);
  const branchId = Number(searchParams.get('branchId'));

  const [state, setState] = useState<PageState>('loading');
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Initialize session and load menu
  useEffect(() => {
    if (!tableId || !branchId || isNaN(tableId) || isNaN(branchId)) {
      setError('Invalid table or branch ID. Please scan the QR code again.');
      setLoading(false);
      return;
    }

    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // Start customer session
        const sessionResponse = await startCustomerSession(branchId, tableId);
        setGuestSessionId(sessionResponse.guestSessionId);
        setRestaurantId(sessionResponse.restaurantId);

        // Load menu
        const menuData = await getCustomerMenu(branchId, tableId);
        setMenu(menuData);

        setState('menu');
      } catch (err: any) {
        console.error('[TablePage] Initialization error:', err);
        const errorMessage = err?.message || 'Failed to load menu. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [tableId, branchId]);

  const addToCart = (menuItem: MenuItem) => {
    if (!menuItem.isAvailable) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
  };

  const updateCartQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item
      )
    );
  };

  const handlePlaceOrder = async () => {
    if (!guestSessionId || !branchId || !tableId || cart.length === 0) {
      return;
    }

    setOrderSubmitting(true);
    try {
      const orderPayload: CreateOrderRequest = {
        guestSessionId,
        branchId,
        tableId,
        items: cart.map((item) => ({
          menuItemId: item.menuItem.id,
          qty: item.quantity,
        })),
      };

      await createCustomerOrder(orderPayload);
      setCart([]);
      setState('success');
    } catch (err: any) {
      console.error('[TablePage] Order error:', err);
      const errorMessage = err?.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-sm text-slate-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error && state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-red-900">Error</h1>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return <OrderSuccess />;
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.menuItem.priceCents * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-6">
        <CustomerMenu
          menu={menu}
          onAddToCart={addToCart}
        />
      </div>

      <Cart
        items={cart}
        total={cartTotal}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        submitting={orderSubmitting}
      />
    </div>
  );
}

