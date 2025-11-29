export interface Restaurant {
  id: number;
  name: string;
  ownerSuperAdminId: number;
  timezone?: string | null;
  currency?: string | null;
  settingsJson?: string | null;
}

export interface Branch {
  id: number;
  restaurantId: number;
  name: string;
  adminUserId: number | null;
}

export interface UserRecord {
  id: number;
  email: string;
  role: string;
  restaurantId: number;
  branchId: number | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  salaryAmount?: number | null;
  salaryPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description?: string | null;
  priceCents: number;
  category?: string | null;
  isAvailable: boolean;
}

export interface TableEntity {
  id: number;
  restaurantId: number;
  branchId: number;
  name: string;
  tableNumber: number | null;
  seatCount: number | null;
  active: boolean;
  qrCode: string | null;
}

export type OrderStatus = 'ORDERED' | 'PREPARING' | 'PREPARED_WAITING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id?: number;
  menuItemId: number;
  qty: number;
  priceCents?: number | null;
  menuItemName?: string | null;
  notes?: string | null;
}

export interface Order {
  id: number;
  restaurantId: number;
  branchId: number;
  tableId: number;
  tableName?: string | null;
  guestSessionId?: string | null;
  customerId?: string | null;
  status: OrderStatus;
  items: OrderItem[];
  totalCents?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string | null;
}

