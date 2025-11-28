'use client';

import { useState } from 'react';

import type { MenuItem } from '@/types/entities';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (menuItemId: number, quantity: number) => void;
  onRemove: (menuItemId: number) => void;
  onPlaceOrder: () => void;
  submitting: boolean;
}

export function Cart({
  items,
  total,
  onUpdateQuantity,
  onRemove,
  onPlaceOrder,
  submitting,
}: CartProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0 && !isOpen) {
    return null;
  }

  const totalPrice = (total / 100).toFixed(2);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Floating Cart Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 shadow-lg transition hover:bg-blue-700"
        >
          <span className="text-sm font-semibold text-white">
            Cart ({itemCount})
          </span>
          <span className="text-sm font-bold text-white">${totalPrice}</span>
        </button>
      )}

      {/* Cart Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 right-0 z-50 flex h-[85vh] w-full max-w-md flex-col bg-white shadow-2xl sm:rounded-tl-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Your Order ({itemCount})
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <p className="text-slate-600">Your cart is empty</p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="mt-4 text-sm text-blue-600 hover:underline"
                    >
                      Browse menu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const itemPrice = (item.menuItem.priceCents / 100).toFixed(2);
                    const itemTotal = (
                      (item.menuItem.priceCents * item.quantity) /
                      100
                    ).toFixed(2);

                    return (
                      <div
                        key={item.menuItem.id}
                        className="flex items-start gap-4 rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">
                            {item.menuItem.name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            ${itemPrice} each
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                onUpdateQuantity(
                                  item.menuItem.id,
                                  item.quantity - 1
                                )
                              }
                              className="rounded-full border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateQuantity(
                                  item.menuItem.id,
                                  item.quantity + 1
                                )
                              }
                              className="rounded-full border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>
                          <div className="w-20 text-right">
                            <p className="font-semibold text-slate-900">
                              ${itemTotal}
                            </p>
                          </div>
                          <button
                            onClick={() => onRemove(item.menuItem.id)}
                            className="rounded-full p-1 text-red-600 transition hover:bg-red-50"
                          >
                            <span className="sr-only">Remove</span>
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-lg font-semibold text-slate-900">
                    Total
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    ${totalPrice}
                  </span>
                </div>
                <button
                  onClick={onPlaceOrder}
                  disabled={submitting || items.length === 0}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

