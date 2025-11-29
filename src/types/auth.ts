export type UserRole = 'ROLE_SUPERADMIN' | 'ROLE_ADMIN' | 'ROLE_WAITER' | 'ROLE_KITCHEN';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  restaurantId: number;
  branchId: number | null;
  restaurantName?: string | null;
  permissions: string[];
}

export interface AuthSession {
  token: string | null;
  user: AuthUser | null;
}

