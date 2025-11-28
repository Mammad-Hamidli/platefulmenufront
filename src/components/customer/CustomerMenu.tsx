'use client';

import type { MenuItem } from '@/types/entities';

interface CustomerMenuProps {
  menu: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export function CustomerMenu({ menu, onAddToCart }: CustomerMenuProps) {
  // Group menu items by category
  const itemsByCategory = menu.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(itemsByCategory).sort();

  if (menu.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">No menu items available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Menu</h1>
        <p className="mt-2 text-sm text-slate-600">Select items to add to your order</p>
      </div>

      {categories.map((category) => (
        <section key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itemsByCategory[category].map((item) => (
              <MenuItemCard key={item.id} item={item} onAddToCart={onAddToCart} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const price = (item.priceCents / 100).toFixed(2);

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md ${
        item.isAvailable
          ? 'border-slate-200 cursor-pointer'
          : 'border-slate-100 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="mb-2">
        <h3 className="font-semibold text-slate-900">{item.name}</h3>
        {item.description && (
          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-slate-900">${price}</span>
        {item.isAvailable ? (
          <button
            onClick={() => onAddToCart(item)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add
          </button>
        ) : (
          <span className="text-xs text-slate-500">Unavailable</span>
        )}
      </div>
    </div>
  );
}

