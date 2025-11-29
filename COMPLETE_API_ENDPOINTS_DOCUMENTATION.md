# 📋 Complete Backend API Endpoints Documentation

This document provides a comprehensive list of ALL API endpoints in the backend, including exact JSON request body formats, path variables, query parameters, and validation rules.

---

## 🔐 Authentication Endpoints (`/api/auth`)

### 1. Login
**ENDPOINT:**
```
POST /api/auth/login
```

**REQUEST BODY JSON:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**DTO:** `LoginRequest`
- `email` (String, **REQUIRED**, `@NotBlank`, `@Email`) - User email
- `password` (String, **REQUIRED**, `@NotBlank`) - User password

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**RESPONSE:** `LoginResponse` with JWT token, user info, restaurantId, branchId

---

### 2. Register
**ENDPOINT:**
```
POST /api/auth/register
```

**REQUEST BODY JSON:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "ADMIN",
  "restaurantId": 1
}
```

**DTO:** `RegisterRequest`
- `username` (String, **REQUIRED**, `@NotBlank`) - Username (legacy field)
- `email` (String, **REQUIRED**, `@NotBlank`) - User email
- `password` (String, **REQUIRED**, `@NotBlank`) - User password
- `role` (String, **REQUIRED**, `@NotBlank`) - "SUPERADMIN" or "ADMIN" (with or without ROLE_ prefix)
- `restaurantId` (Long, **REQUIRED**, `@NotNull`) - Restaurant ID

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**NOTE:** Only ROLE_SUPERADMIN and ROLE_ADMIN can register publicly

---

### 3. Logout
**ENDPOINT:**
```
POST /api/auth/logout
```

**REQUEST BODY JSON:** None

**HEADERS:**
- `Authorization: Bearer {jwt_token}` (optional)

**PATH VARIABLES:** None

**QUERY PARAMS:** None

---

## 👤 User Management Endpoints (`/api/users`)

### 4. Create User
**ENDPOINT:**
```
POST /api/users
```

**REQUEST BODY JSON:**
```json
{
  "email": "waiter@example.com",
  "password": "password123",
  "role": "ROLE_WAITER",
  "restaurantId": 1,
  "branchId": 5,
  "phoneNumber": "+1234567890",
  "salaryAmount": 1000.00,
  "salaryPeriod": "MONTHLY"
}
```

**DTO:** `CreateUserRequest`
- `email` (String, **REQUIRED**, `@NotBlank`, `@Email`) - User email
- `password` (String, **OPTIONAL**) - Required for ROLE_SUPERADMIN and ROLE_ADMIN only
- `role` (String, **REQUIRED**, `@NotBlank`) - ROLE_SUPERADMIN, ROLE_ADMIN, ROLE_WAITER, ROLE_KITCHEN, ROLE_CASHIER, etc.
- `restaurantId` (Long, **REQUIRED**, `@NotNull`) - Restaurant ID
- `branchId` (Long, **OPTIONAL**) - Required for ADMIN, WAITER, KITCHEN (null for SUPERADMIN)
- `fullName` (String, **OPTIONAL**) - Display name for staff/admin
- `firstName` / `lastName` (String, **OPTIONAL**) - Provide if you prefer structured names. When both are present, `fullName` is derived automatically.
- `phoneNumber` (String, **OPTIONAL**) - Required for staff members
- `salaryAmount` (Double, **OPTIONAL**, `@Positive`) - Required for staff members
- `salaryPeriod` (SalaryPeriod, **OPTIONAL**) - DAILY, WEEKLY, or MONTHLY - Required for staff members

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")`

---

### 5. Get User by Email
**ENDPOINT:**
```
GET /api/users/{email}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `email` (String) - User email (URL encoded if contains special characters)

**QUERY PARAMS:** None

**NOTE:** Email is URL decoded automatically

---

### 6. List Users
**ENDPOINT:**
```
GET /api/users
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

---

### 7. Update User
**ENDPOINT:**
```
PATCH /api/users/{email}
```

**REQUEST BODY JSON:**
```json
{
  "password": "newpassword123",
  "role": "ROLE_ADMIN",
  "restaurantId": 1,
  "branchId": 5,
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "salaryAmount": 1200.00,
  "salaryPeriod": "MONTHLY"
}
```

**DTO:** `UpdateUserRequest`
- `password` (String, **OPTIONAL**) - Can only be set for ROLE_SUPERADMIN and ROLE_ADMIN
- `role` (String, **OPTIONAL**) - Role update (restricted by requester role)
- `restaurantId` (Long, **OPTIONAL**) - Restaurant ID (restricted by role)
- `branchId` (Long, **OPTIONAL**) - Branch ID (restricted by role)
- `fullName` (String, **OPTIONAL**) - Set/override display name
- `firstName` / `lastName` (String, **OPTIONAL**) - Structured name fields; server derives `fullName` when both provided
- `phoneNumber` (String, **OPTIONAL**) - Can be updated for staff members (`phone` is returned as an alias)
- `salaryAmount` (Double, **OPTIONAL**, `@Positive`) - Can be updated for staff members
- `salaryPeriod` (SalaryPeriod, **OPTIONAL**) - Can be updated for staff members

**Authorization**
- `ROLE_SUPERADMIN` can update any staff/admin in their restaurant (including role/branch changes) but cannot move superadmins between restaurants.
- `ROLE_ADMIN` can update only staff members within their own branch and may edit name/phone/salary fields; they cannot change branchId, restaurantId, or promote staff to admin roles.

**Response:** Returns the updated `UserDTO`, including `fullName`, `firstName`, `lastName`, `phoneNumber`, and its alias `phone`, along with salary and assignment metadata.

**PATH VARIABLES:**
- `email` (String) - User email (URL encoded)

**QUERY PARAMS:** None

---

### 8. Delete User
**ENDPOINT:**
```
DELETE /api/users/{email}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `email` (String) - User email (URL encoded)

**QUERY PARAMS:** None

---

### 9. Get Current User
**ENDPOINT:**
```
GET /api/users/me
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

---

### 10. Update Current User
**ENDPOINT:**
```
PUT /api/users/me
```

**REQUEST BODY JSON:** Same as Update User (UpdateUserRequest)

**PATH VARIABLES:** None

**QUERY PARAMS:** None

---

### 11. List Waiters by Branch
**ENDPOINT:**
```
GET /api/users/branches/{branchId}/waiters
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN') and @security.branchPermission(#branchId)")`

---

## 🏢 Superadmin Dashboard Endpoints (`/api/superadmin`)

### 12. Get Current Restaurant
**ENDPOINT:**
```
GET /api/superadmin/restaurant
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 13. List Admins
**ENDPOINT:**
```
GET /api/superadmin/admins
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 14. Reset Admin Password ⭐
**ENDPOINT:**
```
POST /api/superadmin/admins/{adminId}/reset-password
```

**REQUEST BODY JSON:**
```json
{
  "newPassword": "Admin123!"
}
```

**DTO:** `ResetPasswordRequest`
- `newPassword` (String, **REQUIRED**, `@NotBlank`, `@Size(min = 6)`) - New password (minimum 6 characters)

**PATH VARIABLES:**
- `adminId` (Long) - Admin user ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

**RESPONSE:**
```json
{
  "status": "success",
  "message": "Admin password reset successfully",
  "newPassword": "Admin123!",
  "adminEmail": "admin@example.com",
  "adminUserId": 1234567890
}
```

---

### 15. List Branches
**ENDPOINT:**
```
GET /api/superadmin/branches
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 16. Get Branch
**ENDPOINT:**
```
GET /api/superadmin/branches/{branchId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 17. Create Branch
**ENDPOINT:**
```
POST /api/superadmin/branches
```

**REQUEST BODY JSON:**
```json
{
  "name": "Yasamal Branch",
  "restaurantId": 1,
  "managerUserId": 1234567890
}
```

**DTO:** `SuperAdminBranchRequest`
- `name` (String, **REQUIRED**, `@NotBlank`) - Branch name
- `restaurantId` (Long, **REQUIRED**, `@NotNull`, `@Min(1)`) - Restaurant ID (must be positive)
- `managerUserId` (Long, **OPTIONAL**) - Manager/admin user ID

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 18. Update Branch
**ENDPOINT:**
```
PUT /api/superadmin/branches/{branchId}
```

**REQUEST BODY JSON:**
```json
{
  "name": "Updated Branch Name",
  "restaurantId": 1,
  "managerUserId": 1234567890
}
```

**DTO:** `SuperAdminBranchRequest` (same as Create Branch)

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_ADMIN')")`

---

### 19. Delete Branch
**ENDPOINT:**
```
DELETE /api/superadmin/branches/{branchId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 20. List Menu Items
**ENDPOINT:**
```
GET /api/superadmin/menu
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 21. List Tables
**ENDPOINT:**
```
GET /api/superadmin/tables
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 22. List Users by Branch
**ENDPOINT:**
```
GET /api/superadmin/branches/{branchId}/users
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 23. Create User ⭐
**ENDPOINT:**
```
POST /api/superadmin/users
```

**REQUEST BODY JSON:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "role": "BRANCH_MANAGER",
  "restaurantId": 1,
  "branchId": 5
}
```

**DTO:** `SuperAdminUserRequest`
- `email` (String, **REQUIRED**, `@NotBlank`, `@Email`) - User email
- `password` (String, **REQUIRED**, `@NotBlank`) - User password
- `role` (String, **REQUIRED**, `@NotBlank`) - Expected values: "BRANCH_MANAGER" or "POS_STAFF" (resolved server-side to ROLE_ADMIN or ROLE_WAITER)
- `restaurantId` (Long, **REQUIRED**, `@NotNull`, `@Min(1)`) - Restaurant ID (must be positive)
- `branchId` (Long, **OPTIONAL**) - Branch association (optional at creation time)

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 24. Update User
**ENDPOINT:**
```
PUT /api/superadmin/users/{email}
```

**REQUEST BODY JSON:**
```json
{
  "password": "NewPassword123!",
  "role": "BRANCH_MANAGER",
  "email": "newemail@example.com",
  "branchId": 6
}
```

**DTO:** `SuperAdminUserUpdateRequest`
- `password` (String, **OPTIONAL**) - Password update
- `role` (String, **OPTIONAL**) - Role update (when null, role stays unchanged)
- `email` (String, **OPTIONAL**) - Email update (when null, email stays unchanged)
- `branchId` (Long, **OPTIONAL**) - Branch reassignment

**PATH VARIABLES:**
- `email` (String) - User email (URL encoded, pattern: `{email:.+}`)

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_ADMIN')")`

---

### 25. Delete User
**ENDPOINT:**
```
DELETE /api/superadmin/users/{email}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `email` (String) - User email (URL encoded, pattern: `{email:.+}`)

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN','ROLE_ADMIN')")`

---

### 26. Get Financial Analytics
**ENDPOINT:**
```
POST /api/superadmin/analytics/query
```

**REQUEST BODY JSON:**
```json
{
  "restaurantId": 1,
  "branchId": 5,
  "fromDate": "2025-01-01T00:00:00Z",
  "toDate": "2025-12-31T23:59:59Z",
  "granularity": "MONTHLY"
}
```

**DTO:** `FinancialAnalyticsRequest`
- `restaurantId` (Long, **OPTIONAL**) - Restaurant ID
- `branchId` (Long, **OPTIONAL**) - Branch ID
- `fromDate` (Instant, **OPTIONAL**) - Custom range start (inclusive), ISO-8601 timestamp string (e.g. `2025-01-01T00:00:00Z`)
- `toDate` (Instant, **OPTIONAL**) - Custom range end (inclusive), ISO-8601 timestamp string (e.g. `2025-12-31T23:59:59Z`)
- `granularity` (AnalyticsGranularity, **REQUIRED**, `@NotNull`) - "DAILY", "WEEKLY", or "MONTHLY"

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 27. Get Active Sessions
**ENDPOINT:**
```
GET /api/superadmin/sessions
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:**
- `branchId` (Long, **OPTIONAL**) - Filter by branch ID

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

### 28. Override Session
**ENDPOINT:**
```
POST /api/superadmin/sessions/override
```

**REQUEST BODY JSON:**
```json
{
  "sessionId": "session-uuid-123",
  "branchId": 5,
  "reason": "Force close due to system issue"
}
```

**DTO:** `PosSessionOverrideRequest`
- `sessionId` (String, **REQUIRED**, `@NotBlank`) - Session ID
- `branchId` (Long, **OPTIONAL**) - Branch ID
- `reason` (String, **OPTIONAL**) - Reason for override

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")`

---

## 🏪 Restaurant Endpoints (`/api/restaurants`)

### 29. Create Restaurant
**ENDPOINT:**
```
POST /api/restaurants
```

**REQUEST BODY JSON:**
```json
{
  "id": 1,
  "name": "My Restaurant",
  "ownerSuperAdminId": 1234567890,
  "timezone": "UTC",
  "currency": "USD",
  "settingsJson": "{\"theme\":\"dark\"}"
}
```

**DTO:** `CreateRestaurantRequest`
- `id` (Long, **OPTIONAL**) - Restaurant ID (will be generated if not provided)
- `name` (String, **REQUIRED**, `@NotBlank`) - Restaurant name
- `ownerSuperAdminId` (Long, **REQUIRED**, `@NotNull`) - The SUPERADMIN user who owns this restaurant
- `timezone` (String, **OPTIONAL**) - Timezone
- `currency` (String, **OPTIONAL**) - Currency code
- `settingsJson` (String, **OPTIONAL**) - JSON settings string

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

---

### 30. Get Restaurant
**ENDPOINT:**
```
GET /api/restaurants/{id}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `id` (Long) - Restaurant ID

**QUERY PARAMS:** None

---

### 31. List Restaurants
**ENDPOINT:**
```
GET /api/restaurants
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:** None

---

### 32. Update Restaurant
**ENDPOINT:**
```
PUT /api/restaurants/{id}
```

**REQUEST BODY JSON:**
```json
{
  "name": "Updated Restaurant Name",
  "timezone": "EST",
  "currency": "EUR",
  "settingsJson": "{\"theme\":\"light\"}"
}
```

**DTO:** `UpdateRestaurantRequest`
- `name` (String, **OPTIONAL**) - Restaurant name
- `timezone` (String, **OPTIONAL**) - Timezone
- `currency` (String, **OPTIONAL**) - Currency code
- `settingsJson` (String, **OPTIONAL**) - JSON settings string

**PATH VARIABLES:**
- `id` (Long) - Restaurant ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

---

### 33. Delete Restaurant
**ENDPOINT:**
```
DELETE /api/restaurants/{id}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `id` (Long) - Restaurant ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

---

## 🌿 Branch Endpoints (`/api`)

### 34. Create Branch
**ENDPOINT:**
```
POST /api/restaurants/{restaurantId}/branches
```

**REQUEST BODY JSON:**
```json
{
  "name": "Yasamal Branch",
  "restaurantId": 1,
  "adminUserId": 1234567890
}
```

**DTO:** `CreateBranchRequest`
- `name` (String, **REQUIRED**, `@NotBlank`) - Branch name
- `restaurantId` (Long, **REQUIRED**, `@NotNull`) - Restaurant ID (also in path)
- `adminUserId` (Long, **OPTIONAL**) - Admin user ID (can be assigned later)

**PATH VARIABLES:**
- `restaurantId` (Long) - Restaurant ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

**NOTE:** `restaurantId` in body is set to match path variable

---

### 35. Get Branch
**ENDPOINT:**
```
GET /api/branches/{branchId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

---

### 36. List Branches by Restaurant
**ENDPOINT:**
```
GET /api/restaurants/{restaurantId}/branches
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `restaurantId` (Long) - Restaurant ID

**QUERY PARAMS:** None

---

### 37. Update Branch
**ENDPOINT:**
```
PUT /api/branches/{branchId}
```

**REQUEST BODY JSON:**
```json
{
  "name": "Updated Branch Name",
  "adminUserId": 1234567890
}
```

**DTO:** `UpdateBranchRequest`
- `name` (String, **OPTIONAL**) - Branch name
- `adminUserId` (Long, **OPTIONAL**) - Admin user ID

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

---

### 38. Delete Branch
**ENDPOINT:**
```
DELETE /api/branches/{branchId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

---

### 39. Assign Admin to Branch ⭐
**ENDPOINT:**
```
POST /api/branches/{branchId}/assign-admin
```

**REQUEST BODY JSON:**
```json
{
  "adminUserId": 1234567890
}
```

**DTO:** `Map<String, Long>` (not a DTO class, just a map)
- `adminUserId` (Long, **REQUIRED**) - Admin user ID

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

**RESPONSE (Success):**
```json
{
  "status": "success",
  "message": "Admin assigned to branch successfully",
  "branchId": 5,
  "adminId": 1234567890
}
```

**RESPONSE (Error - Branch has admin):**
```json
{
  "error": "branch_has_admin",
  "message": "This branch already has an assigned admin. Please remove the existing admin before assigning a new one."
}
```

**Unassign Admin:** When you need to remove the existing admin mapping altogether, call  
`DELETE /api/branches/{branchId}/unassign-admin` (no body). Requires `ROLE_SUPERADMIN`.  
Success response mirrors the structure above with the `adminId` field set to `null`.

---

## 🍽️ Menu Endpoints (`/api/menu`)

### 40. Get Menu (Public)
**ENDPOINT:**
```
GET /api/menu?restId={restaurantId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:**
- `restId` (Long, **REQUIRED**) - Restaurant ID

---

### 41. Get Menu Item
**ENDPOINT:**
```
GET /api/menu/{menuItemId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `menuItemId` (Long) - Menu item ID

**QUERY PARAMS:** None

---

### 42. Get All Menu Items (Admin)
**ENDPOINT:**
```
GET /api/menu/admin/all?restId={restaurantId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:**
- `restId` (Long, **REQUIRED**) - Restaurant ID

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`

---

### 43. Create Menu Item
**ENDPOINT:**
```
POST /api/menu
```

**REQUEST BODY JSON:**
```json
{
  "restaurantId": 1,
  "name": "Pizza Margherita",
  "description": "Classic pizza with tomato and mozzarella",
  "priceCents": 1500,
  "category": "Pizza",
  "isAvailable": true
}
```

**DTO:** `CreateMenuItemRequest`
- `restaurantId` (Long, **REQUIRED**, `@NotNull`) - Restaurant ID
- `name` (String, **REQUIRED**, `@NotBlank`) - Menu item name
- `description` (String, **OPTIONAL**) - Menu item description
- `priceCents` (Long, **REQUIRED**, `@NotNull`, `@Positive`) - Price in cents (must be positive)
- `category` (String, **OPTIONAL**) - Menu item category
- `isAvailable` (Boolean, **OPTIONAL**) - Availability status (default: true)

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`

---

### 44. Update Menu Item
**ENDPOINT:**
```
PUT /api/menu/{menuItemId}
```

**REQUEST BODY JSON:**
```json
{
  "name": "Updated Pizza Name",
  "description": "Updated description",
  "priceCents": 1800,
  "category": "Pizza",
  "isAvailable": false
}
```

**DTO:** `UpdateMenuItemRequest`
- `name` (String, **OPTIONAL**) - Menu item name
- `description` (String, **OPTIONAL**) - Menu item description
- `priceCents` (Long, **OPTIONAL**, `@Positive`) - Price in cents (must be positive if provided)
- `category` (String, **OPTIONAL**) - Menu item category
- `isAvailable` (Boolean, **OPTIONAL**) - Availability status

**PATH VARIABLES:**
- `menuItemId` (Long) - Menu item ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`

---

### 45. Delete Menu Item
**ENDPOINT:**
```
DELETE /api/menu/{menuItemId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `menuItemId` (Long) - Menu item ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`

---

## 🪑 Table Endpoints (`/api/tables`)

### 46. Get Tables
**ENDPOINT:**
```
GET /api/tables?restId={restaurantId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:**
- `restId` (Long, **REQUIRED**) - Restaurant ID

---

### 47. Get Table
**ENDPOINT:**
```
GET /api/tables/{tableId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `tableId` (Long) - Table ID

**QUERY PARAMS:** None

---

### 48. Create Table
**ENDPOINT:**
```
POST /api/tables
```

**REQUEST BODY JSON:**
```json
{
  "restaurantId": 1,
  "branchId": 5,
  "name": "Table 1",
  "seatCount": 4,
  "tableNumber": 1
}
```

**DTO:** `CreateTableRequest`
- `restaurantId` (Long, **REQUIRED**, `@NotNull`) - Restaurant ID
- `branchId` (Long, **REQUIRED**, `@NotNull`) - Branch ID
- `name` (String, **REQUIRED**, `@NotBlank`) - Table name
- `seatCount` (Integer, **REQUIRED**, `@Positive`) - Number of seats (must be positive)
- `tableNumber` (Integer, **OPTIONAL**) - Table number (will be auto-generated if not provided)

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`

---

### 49. Update Table
**ENDPOINT:**
```
PUT /api/tables/{tableId}
```

**REQUEST BODY JSON:** Same as Create Table (`CreateTableRequest`)

**PATH VARIABLES:**
- `tableId` (Long) - Table ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`

---

### 50. Delete Table
**ENDPOINT:**
```
DELETE /api/tables/{tableId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `tableId` (Long) - Table ID

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`

---

## 🛒 Order Endpoints (`/api/orders`)

### 51. Create Order
**ENDPOINT:**
```
POST /api/orders
```

**REQUEST BODY JSON:**
```json
{
  "restaurantId": 1,
  "tableId": 10,
  "branchId": 5,
  "guestSessionId": "session-uuid-123",
  "customerId": "customer-123",
  "items": [
    {
      "menuItemId": 100,
      "qty": 2
    }
  ]
}
```

**DTO:** `OrderRequestDTO`
- `restaurantId` (Long, **REQUIRED**, `@NotNull`) - Restaurant ID
- `tableId` (Long, **REQUIRED**, `@NotNull`) - Table ID
- `branchId` (Long, **REQUIRED**, `@NotNull`) - Branch ID
- `guestSessionId` (String, **OPTIONAL**) - UUID for anonymous customers
- `customerId` (String, **OPTIONAL**) - Customer identifier (user ID or guest identifier)
- `items` (List<OrderItemDTO>, **REQUIRED**, `@NotEmpty`, `@Valid`) - Order items (must contain at least one item)

**OrderItemDTO:**
- `menuItemId` (Long, **REQUIRED**, `@NotNull`) - Menu item ID
- `qty` (Integer, **REQUIRED**, `@NotNull`, `@Min(1)`) - Quantity (must be at least 1)
- `priceCents` (Long, **OPTIONAL**) - Price in cents (used in response)
- `menuItemName` (String, **OPTIONAL**) - Menu item name (used in response)
- `notes` (String, **OPTIONAL**) - Item-specific notes (if supported)

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**NOTE:** Rate limited per guest session

---

### 52. Get Order
**ENDPOINT:**
```
GET /api/orders/{orderId}?guestSessionId={sessionId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `orderId` (Long) - Order ID

**QUERY PARAMS:**
- `guestSessionId` (String, **OPTIONAL**) - Guest session ID for validation

---

### 53. Update Order
**ENDPOINT:**
```
PUT /api/orders/{orderId}
```

**REQUEST BODY JSON:** Same as Create Order (`OrderRequestDTO`)

**PATH VARIABLES:**
- `orderId` (Long) - Order ID

**QUERY PARAMS:** None

---

### 54. Update Order Status
**ENDPOINT:**
```
PATCH /api/orders/{orderId}/status
```

**REQUEST BODY JSON:**
```json
{
  "status": "PREPARING",
  "notes": "Started cooking"
}
```

**DTO:** `UpdateOrderStatusRequest`
- `status` (String, **REQUIRED**, `@NotBlank`, `@Pattern`) - Must be one of: "ORDERED", "PREPARING", "PREPARED_WAITING", "SERVED", "COMPLETED", "CANCELLED"
- `notes` (String, **OPTIONAL**) - Optional notes about the status change

**PATH VARIABLES:**
- `orderId` (Long) - Order ID

**QUERY PARAMS:** None

---

### 55. Get Orders by Session
**ENDPOINT:**
```
GET /api/orders/session/{sessionId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `sessionId` (String) - Session ID

**QUERY PARAMS:** None

---

### 56. Get Orders by Session (Query Param)
**ENDPOINT:**
```
GET /api/orders/list?sessionId={sessionId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:**
- `sessionId` (String, **OPTIONAL**) - Session ID (required for successful response)

---

### 57. Get Order Logs
**ENDPOINT:**
```
GET /api/orders/{orderId}/logs
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:**
- `orderId` (Long) - Order ID

**QUERY PARAMS:** None

---

### 58. Cancel Order
**ENDPOINT:**
```
POST /api/orders/{orderId}/cancel
```

**REQUEST BODY JSON:**
```json
{
  "customerId": "customer-123",
  "guestSessionId": "session-uuid-123"
}
```

**DTO:** `CancelOrderRequest`
- `customerId` (String, **OPTIONAL**) - Customer ID
- `guestSessionId` (String, **OPTIONAL**) - Guest session ID

**PATH VARIABLES:**
- `orderId` (Long) - Order ID

**QUERY PARAMS:** None

---

## 💳 Payment Endpoints (`/api/payments`)

### 59. Process Payment
**ENDPOINT:**
```
POST /api/payments
```

**REQUEST BODY JSON:**
```json
{
  "orderId": 100,
  "paymentMethod": "CASH",
  "amountPaidCents": 3000,
  "transactionId": "txn-123456",
  "notes": "Paid in full"
}
```

**DTO:** `PaymentRequest`
- `orderId` (Long, **REQUIRED**, `@NotNull`) - Order ID
- `paymentMethod` (String, **REQUIRED**, `@NotBlank`) - Payment method: "CASH", "CARD", "MOBILE_PAYMENT", etc.
- `amountPaidCents` (Long, **OPTIONAL**) - Amount paid in cents (if not provided, uses order total)
- `transactionId` (String, **OPTIONAL**) - External payment gateway transaction ID
- `notes` (String, **OPTIONAL**) - Optional payment notes

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**AUTHORIZATION:** `@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'WAITER')")`

---

## 👥 Customer Endpoints (`/api/customer`)

### 60. Start Session
**ENDPOINT:**
```
POST /api/customer/session/start
```

**REQUEST BODY JSON:**
```json
{
  "branchId": 5,
  "tableId": 10
}
```

**DTO:** `StartSessionRequest`
- `branchId` (Long, **REQUIRED**, `@NotNull`) - Branch ID
- `tableId` (Long, **REQUIRED**, `@NotNull`) - Table ID

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**RESPONSE:** `StartSessionResponse` with `guestSessionId` and `restaurantId`

---

### 61. Session API (Internal Staff / POS)
The platform also exposes a session management API for internal clients at `/api/session`.  
All endpoints consume/return `SessionRequestDTO` / `SessionResponseDTO` objects unless otherwise noted.

- `POST /api/session/start` – Create a dining session (used by staff dashboards). Body: `{"branchId":1,"tableId":10,"sessionOwnerId":"optional"}`.
- `POST /api/session/join` – Idempotently join or create a session for the same table.
- `PATCH /api/session/close/{sessionId}` – Close an active session (body optional).
- `GET /api/session/current?tableId={tableId}` – Fetch the active session for a specific table.
- `GET /api/session/{sessionId}` – Retrieve a session by ID.

All of the above require authenticated staff roles; timestamps are returned as ISO-8601 instants.

---

### 62. Get Menu (Customer)
**ENDPOINT:**
```
GET /api/customer/menu?branchId={branchId}&tableId={tableId}
```

**REQUEST BODY JSON:** None

**PATH VARIABLES:** None

**QUERY PARAMS:**
- `branchId` (Long, **REQUIRED**) - Branch ID
- `tableId` (Long, **REQUIRED**) - Table ID

---

### 63. Create Customer Order
**ENDPOINT:**
```
POST /api/customer/orders
```

**REQUEST BODY JSON:**
```json
{
  "guestSessionId": "session-uuid-123",
  "branchId": 5,
  "tableId": 10,
  "items": [
    {
      "menuItemId": 100,
      "qty": 2
    }
  ]
}
```

**DTO:** `CreateOrderRequest`
- `guestSessionId` (String, **REQUIRED**, `@NotNull`) - Guest session ID
- `branchId` (Long, **REQUIRED**, `@NotNull`) - Branch ID
- `tableId` (Long, **REQUIRED**, `@NotNull`) - Table ID
- `items` (List<OrderItemRequest>, **REQUIRED**, `@NotEmpty`, `@Valid`) - Order items

**OrderItemRequest (inner class):**
- `menuItemId` (Long, **REQUIRED**, `@NotNull`) - Menu item ID
- `qty` (Integer, **REQUIRED**, `@NotNull`) - Quantity

**PATH VARIABLES:** None

**QUERY PARAMS:** None

---

## 🧑‍💼 Admin Operations (`/api/admin`, `/api/admin/orders`, `/api/admins`)

### 64. Get Admin Reports
**ENDPOINT:**
```
GET /api/admin/reports
```
Provides aggregate metrics for the authenticated restaurant.  
**AUTHORIZATION:** `@PreAuthorize("hasRole('SUPERADMIN')")`

---

### 65. Update Admin User
**ENDPOINT:**
```
PUT /api/admins/{adminId}
```
**REQUEST BODY:** `UpdateUserRequest`
- `adminId` path variable represents the admin’s username/email.
- Follows the same validation rules as the general user update endpoint.

**AUTHORIZATION:** `ROLE_SUPERADMIN`

---

### 66. Delete Admin User
**ENDPOINT:**
```
DELETE /api/admins/{adminId}
```
Deletes the specified admin account (username in path). Returns `204 No Content`.  
**AUTHORIZATION:** `ROLE_SUPERADMIN`

---

### 67. List Restaurant Orders (Admin)
**ENDPOINT:**
```
GET /api/admin/orders
```
Returns all orders for the current restaurant as `List<OrderResponseDTO>`.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

### 68. Complete Restaurant Order
**ENDPOINT:**
```
POST /api/admin/orders/{orderId}/complete
```
Marks the given order as COMPLETED and returns the updated `OrderResponseDTO`.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

### 69. Get My Branch Snapshot
**ENDPOINT:**
```
GET /api/admin/branches/my
```
Returns `BranchSummaryDTO` for the branch of the logged-in admin.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

### 70. Get My Tables Snapshot
**ENDPOINT:**
```
GET /api/admin/tables/my
```
Provides `List<TableSummaryDTO>` for the admin’s branch.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

### 71. Get My Waiter Roster
**ENDPOINT:**
```
GET /api/admin/waiters/my
```
Returns `List<WaiterSummaryDTO>` scoped to the admin’s branch.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

### 72. Get Restaurant Menu (Admin Dashboard)
**ENDPOINT:**
```
GET /api/admin/menu
```
Delivers the restaurant menu as `List<MenuItemSummaryDTO>` including availability flags.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

## 🧑‍🍷 Waiter Operations (`/api/waiter`, `/api/branches/{branchId}/waiters`)

### 73. Waiter Order Feed
**ENDPOINT:**
```
GET /api/waiter/orders
```
Returns active orders for the waiter’s branch (falls back to empty list if branch context is missing).  
**AUTHORIZATION:** `ROLE_WAITER`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN`

---

### 74. Serve Order
**ENDPOINT:**
```
POST /api/waiter/orders/{orderId}/serve
```
Transitions the order to `SERVED`. Body not required.  
**AUTHORIZATION:** `ROLE_WAITER`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN`

---

### 75. Create Branch Waiter
**ENDPOINT:**
```
POST /api/branches/{branchId}/waiters
```
**REQUEST BODY:** `CreateUserRequest` (only `email`, `password`, optional contact fields).  
The controller forces `role=ROLE_WAITER` and `branchId` to match the path.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN` plus branch permission.

---

### 76. List Waiters for a Branch
**ENDPOINT:**
```
GET /api/branches/{branchId}/waiters
```
Lists waiters belonging to the branch as `List<UserDTO>`.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN` plus branch permission.

---

### 77. Update Waiter
**ENDPOINT:**
```
PUT /api/waiters/{waiterId}
```
`waiterId` is the waiter’s username/email. Body is `UpdateUserRequest`.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

### 78. Delete Waiter
**ENDPOINT:**
```
DELETE /api/waiters/{waiterId}
```
Removes the waiter account identified by username/email.  
**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`

---

## 👨‍🍳 Kitchen Operations (`/api/branches/{branchId}/kitchen/orders`)

**MULTI-TENANT ARCHITECTURE:** All kitchen operations are now branch-scoped to enforce tenant isolation. Each branch can only access orders belonging to that branch. `ROLE_SUPERADMIN` can access any branch, while `ROLE_KITCHEN` and `ROLE_ADMIN` are restricted to their assigned branch.

**DUAL AUTHENTICATION:** Kitchen endpoints support two authentication methods:
1. **JWT-based (existing):** User with `ROLE_KITCHEN`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN` + correct branch
2. **KDS token-based (new):** Valid, non-expired KDS token for the branch (sent via `X-KDS-Token` header)

KDS tokens are obtained by verifying the branch's 6-digit Kitchen PIN (see Kitchen PIN Management endpoints below).

### 79. Kitchen Active Orders (Branch-Scoped) ⭐
**ENDPOINT:**
```
GET /api/branches/{branchId}/kitchen/orders
```

**PATH VARIABLES:**
- `branchId` (Long, **REQUIRED**) - Branch ID

**REQUEST BODY JSON:** None

**QUERY PARAMS:** None

**RESPONSE:** 
- **Success (200 OK):** `List<OrderResponseDTO>` filtered to kitchen-relevant statuses (ORDERED, PREPARING, PREPARED_WAITING) for the specified branch.
- **PIN Required (401 Unauthorized):** `KitchenAuthRequiredResponse` when no authentication is provided:
  ```json
  {
    "requiresPin": true,
    "message": "PIN authentication required",
    "branchId": 1763914140416
  }
  ```
  This response indicates that the frontend should display a PIN entry screen. After the user enters the correct PIN, the frontend should call `POST /api/branches/{branchId}/kitchen/pin/verify` to obtain a KDS token, then retry this endpoint with the `X-KDS-Token` header.

**HEADERS:**
- `Authorization: Bearer <jwt_token>` (optional) - JWT token for authenticated users
- `X-KDS-Token: <kds_token>` (optional) - KDS token for kitchen device sessions

**AUTHORIZATION:** Either:
- JWT: `ROLE_KITCHEN`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN` with matching branch
- KDS Token: Valid, non-expired KDS token for the specified branch
- **No Authentication:** Returns `401 Unauthorized` with `KitchenAuthRequiredResponse` (frontend should show PIN entry screen)

**TENANT ISOLATION:**
- `ROLE_KITCHEN` and `ROLE_ADMIN` can only access orders from their own branch (branchId from JWT must match path variable).
- `ROLE_SUPERADMIN` can access any branch.
- If a user tries to access another branch's orders, returns `403 Forbidden` with message: "You cannot access another branch's kitchen."

**USAGE FLOW FOR KITCHEN DEVICES:**
1. Device opens URL: `GET /api/branches/{branchId}/kitchen/orders` (no auth)
2. Backend returns `401` with `KitchenAuthRequiredResponse` → Frontend shows PIN entry screen
3. User enters PIN → Frontend calls `POST /api/branches/{branchId}/kitchen/pin/verify` with PIN
4. Backend returns KDS token → Frontend stores token (e.g., localStorage)
5. Frontend retries `GET /api/branches/{branchId}/kitchen/orders` with `X-KDS-Token` header
6. Backend returns orders list → Frontend displays orders

---

### 80. Accept Order (Branch-Scoped) ⭐
**ENDPOINT:**
```
POST /api/branches/{branchId}/kitchen/orders/{orderId}/accept
```

**PATH VARIABLES:**
- `branchId` (Long, **REQUIRED**) - Branch ID
- `orderId` (Long, **REQUIRED**) - Order ID

**REQUEST BODY JSON:** None

**QUERY PARAMS:** None

**RESPONSE:** `OrderResponseDTO` with status updated to `PREPARING`.

**HEADERS:**
- `Authorization: Bearer <jwt_token>` (optional) - JWT token for authenticated users
- `X-KDS-Token: <kds_token>` (optional) - KDS token for kitchen device sessions

**AUTHORIZATION:** Either:
- JWT: `ROLE_KITCHEN`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN` with matching branch
- KDS Token: Valid, non-expired KDS token for the specified branch

**TENANT ISOLATION:**
- Validates that the order belongs to the specified branch before accepting.
- `ROLE_KITCHEN` and `ROLE_ADMIN` can only accept orders from their own branch.
- `ROLE_SUPERADMIN` can accept orders from any branch.
- If order belongs to a different branch, returns `403 Forbidden`: "You cannot access another branch's kitchen."
- If order not found, returns `404 Not Found`.

---

### 81. Mark Order Ready (Branch-Scoped) ⭐
**ENDPOINT:**
```
POST /api/branches/{branchId}/kitchen/orders/{orderId}/ready
```

**PATH VARIABLES:**
- `branchId` (Long, **REQUIRED**) - Branch ID
- `orderId` (Long, **REQUIRED**) - Order ID

**REQUEST BODY JSON:** None

**QUERY PARAMS:** None

**RESPONSE:** `OrderResponseDTO` with status updated to `PREPARED_WAITING`.

**HEADERS:**
- `Authorization: Bearer <jwt_token>` (optional) - JWT token for authenticated users
- `X-KDS-Token: <kds_token>` (optional) - KDS token for kitchen device sessions

**AUTHORIZATION:** Either:
- JWT: `ROLE_KITCHEN`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN` with matching branch
- KDS Token: Valid, non-expired KDS token for the specified branch

**TENANT ISOLATION:**
- Validates that the order belongs to the specified branch before marking as ready.
- `ROLE_KITCHEN` and `ROLE_ADMIN` can only mark orders ready from their own branch.
- `ROLE_SUPERADMIN` can mark orders ready from any branch.
- If order belongs to a different branch, returns `403 Forbidden`: "You cannot access another branch's kitchen."
- If order not found, returns `404 Not Found`.

---

## 🔐 Kitchen PIN Management (`/api/branches/{branchId}/kitchen/pin`)

**SECURITY:** Each branch has its own 6-digit Kitchen PIN for device authentication. PINs are stored as BCrypt hashes and never exposed in plain text (except once during generation).

### 88. Get Kitchen PIN Info ⭐
**ENDPOINT:**
```
GET /api/branches/{branchId}/kitchen/pin
```

**PATH VARIABLES:**
- `branchId` (Long, **REQUIRED**) - Branch ID

**REQUEST BODY JSON:** None

**QUERY PARAMS:** None

**RESPONSE:** `KitchenPinInfoDTO`
```json
{
  "branchId": 123,
  "isSet": true,
  "lastUpdatedAt": "2025-01-01T12:00:00Z",
  "maskedPin": "••••••",
  "pin": null
}
```

**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`
- `ROLE_ADMIN` can only view PIN info for their own branch
- `ROLE_SUPERADMIN` can view PIN info for any branch

**NOTE:** Full PIN is never returned in this endpoint. Use generate endpoint to see full PIN once.

---

### 89. Set Kitchen PIN Manually ⭐
**ENDPOINT:**
```
POST /api/branches/{branchId}/kitchen/pin
```

**PATH VARIABLES:**
- `branchId` (Long, **REQUIRED**) - Branch ID

**REQUEST BODY JSON:**
```json
{
  "pin": "123456"
}
```

**DTO:** `SetPinRequest`
- `pin` (String, **REQUIRED**, `@NotBlank`, `@Pattern("^[0-9]{6}$")`) - Exactly 6 numeric digits

**QUERY PARAMS:** None

**RESPONSE:** `KitchenPinInfoDTO` (masked, full PIN not returned)

**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`
- `ROLE_ADMIN` can only set PIN for their own branch
- `ROLE_SUPERADMIN` can set PIN for any branch

**VALIDATION:**
- PIN must be exactly 6 digits
- PIN must contain only numeric characters (0-9)

---

### 90. Generate Random Kitchen PIN ⭐
**ENDPOINT:**
```
POST /api/branches/{branchId}/kitchen/pin/generate
```

**PATH VARIABLES:**
- `branchId` (Long, **REQUIRED**) - Branch ID

**REQUEST BODY JSON:** None

**QUERY PARAMS:** None

**RESPONSE:** `KitchenPinInfoDTO` with full PIN included (ONLY time full PIN is returned)
```json
{
  "branchId": 123,
  "isSet": true,
  "lastUpdatedAt": "2025-01-01T12:00:00Z",
  "maskedPin": "••••••",
  "pin": "348921"
}
```

**AUTHORIZATION:** `ROLE_ADMIN` or `ROLE_SUPERADMIN`
- `ROLE_ADMIN` can only generate PIN for their own branch
- `ROLE_SUPERADMIN` can generate PIN for any branch

**IMPORTANT:** The full PIN is returned ONLY in this response. Admin should note it down immediately. Subsequent calls to get PIN info will only return masked PIN.

---

### 91. Verify Kitchen PIN and Get KDS Token ⭐
**ENDPOINT:**
```
POST /api/branches/{branchId}/kitchen/pin/verify
```

**PATH VARIABLES:**
- `branchId` (Long, **REQUIRED**) - Branch ID

**REQUEST BODY JSON:**
```json
{
  "pin": "123456"
}
```

**DTO:** `VerifyPinRequest`
- `pin` (String, **REQUIRED**, `@NotBlank`, `@Pattern("^[0-9]{6}$")`) - Exactly 6 numeric digits

**QUERY PARAMS:** None

**RESPONSE:** `KdsLoginResponseDTO`
```json
{
  "branchId": 123,
  "kdsToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2025-01-01T23:00:00Z"
}
```

**AUTHORIZATION:** None (public endpoint - no JWT required)

**USAGE:**
- Used by kitchen devices (tablets) for initial authentication
- On success, device stores `kdsToken` (e.g., in localStorage) and sends it in `X-KDS-Token` header for subsequent requests
- Session expires after 12 hours

**ERROR RESPONSES:**
- `401 Unauthorized` - Invalid PIN (generic message to avoid leaking whether PIN is set)
- `400 Bad Request` - Invalid PIN format
- `404 Not Found` - Branch not found

**SECURITY NOTES:**
- PIN is verified against BCrypt hash
- Generic error messages prevent PIN enumeration attacks
- KDS tokens are branch-specific and expire after 12 hours
- Rate limiting recommended (implemented in memory for brute-force mitigation)

---

## 👨‍🍳 Kitchen Operations (Deprecated - Legacy Endpoints)

**⚠️ DEPRECATED:** The following endpoints are retained for backward compatibility but are deprecated. Use the branch-scoped endpoints above (`/api/branches/{branchId}/kitchen/...`) instead.

### 82. Kitchen Active Orders (Deprecated)
**ENDPOINT:**
```
GET /api/kitchen/orders
```
**STATUS:** `@Deprecated` - Use `GET /api/branches/{branchId}/kitchen/orders` instead.

Returns `List<OrderResponseDTO>` filtered to kitchen-relevant statuses for the authenticated user's branch (extracted from JWT).  
**AUTHORIZATION:** `ROLE_KITCHEN`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN`

**NOTE:** This endpoint automatically resolves the branch from the JWT token. For explicit branch control, use the branch-scoped endpoint.

---

### 83. Accept Order (Deprecated)
**ENDPOINT:**
```
POST /api/kitchen/orders/{orderId}/accept
```
**STATUS:** `@Deprecated` - Use `POST /api/branches/{branchId}/kitchen/orders/{orderId}/accept` instead.

Moves the order into `PREPARING`. The branch is automatically resolved from the JWT token.  
**AUTHORIZATION:** `ROLE_KITCHEN`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN`

**PATH VARIABLES:**
- `orderId` (Long, **REQUIRED**) - Order ID

**NOTE:** This endpoint automatically resolves the branch from the JWT token. For explicit branch control, use the branch-scoped endpoint.

---

### 84. Mark Order Ready (Deprecated)
**ENDPOINT:**
```
POST /api/kitchen/orders/{orderId}/ready
```
**STATUS:** `@Deprecated` - Use `POST /api/branches/{branchId}/kitchen/orders/{orderId}/ready` instead.

Updates the order to `PREPARED_WAITING`. The branch is automatically resolved from the JWT token.  
**AUTHORIZATION:** `ROLE_KITCHEN`, `ROLE_ADMIN`, or `ROLE_SUPERADMIN`

**PATH VARIABLES:**
- `orderId` (Long, **REQUIRED**) - Order ID

**NOTE:** This endpoint automatically resolves the branch from the JWT token. For explicit branch control, use the branch-scoped endpoint.

---

## 🧾 QR Endpoints (`/api/qr`)

### 92. Generate Table QR (PNG)
**ENDPOINT:**
```
GET /api/qr/{restId}/{tableId}
```
Streams a PNG image containing the QR code that points to the customer-facing menu URL for the specified restaurant/table.  
**RESPONSE:** `Content-Type: image/png` with raw bytes.  
**AUTHORIZATION:** Authenticated staff account required.

---

## 🏢 Plateful Admin Endpoints (`/api/plateful-admin`)

**NOTE:** These endpoints are only active when `plateful-admin` profile is enabled.

### 93. Create Restaurant with Superadmin
**ENDPOINT:**
```
POST /api/plateful-admin/restaurants
```

**REQUEST BODY JSON:**
```json
{
  "restaurantName": "New Restaurant",
  "superadminEmail": "superadmin@example.com",
  "superadminPassword": "SuperAdmin123!",
  "timezone": "UTC",
  "currency": "USD",
  "settingsJson": "{\"theme\":\"dark\"}"
}
```

**DTO:** `CreateRestaurantWithSuperAdminRequest`
- `restaurantName` (String, **REQUIRED**, `@NotBlank`) - Restaurant name
- `superadminEmail` (String, **REQUIRED**, `@NotBlank`, `@Email`) - Superadmin email
- `superadminPassword` (String, **REQUIRED**, `@NotBlank`) - Superadmin password
- `timezone` (String, **OPTIONAL**) - Timezone
- `currency` (String, **OPTIONAL**) - Currency code
- `settingsJson` (String, **OPTIONAL**) - JSON settings string

**PATH VARIABLES:** None

**QUERY PARAMS:** None

**PROFILE:** `@Profile("plateful-admin")`

---

### 94. Create Admin for Branch
**ENDPOINT:**
```
POST /api/plateful-admin/branches/{branchId}/admins
```

**REQUEST BODY JSON:**
```json
{
  "adminEmail": "admin@example.com",
  "adminPassword": "Admin123!",
  "branchId": 5
}
```

**DTO:** `CreateAdminForBranchRequest`
- `adminEmail` (String, **REQUIRED**, `@NotBlank`, `@Email`) - Admin email
- `adminPassword` (String, **REQUIRED**, `@NotBlank`) - Admin password
- `branchId` (Long, **REQUIRED**, `@NotNull`) - Branch ID (also in path, set automatically)

**PATH VARIABLES:**
- `branchId` (Long) - Branch ID

**QUERY PARAMS:** None

**PROFILE:** `@Profile("plateful-admin")`

**NOTE:** `branchId` in body is set to match path variable

---

## 📊 Summary

### Total Endpoints: 91

### By Category:
- **Authentication:** 3 endpoints
- **User Management:** 8 endpoints
- **Superadmin Dashboard:** 17 endpoints
- **Restaurant:** 5 endpoints
- **Branch:** 6 endpoints (assign + unassign flows)
- **Menu:** 6 endpoints
- **Table:** 5 endpoints
- **Order:** 8 endpoints
- **Payment:** 1 endpoint
- **Customer (public):** 3 endpoints plus 1 internal session summary
- **Admin Operations:** 9 endpoints
- **Waiter Operations:** 6 endpoints
- **Kitchen Operations:** 6 endpoints (3 branch-scoped + 3 deprecated legacy)
- **Kitchen PIN Management:** 4 endpoints (PIN info, set, generate, verify)
- **Session API (internal):** 5 operations covered under entry #61
- **QR:** 1 endpoint
- **Plateful Admin:** 2 endpoints

### Key Endpoints for Admin Operations:

1. **Admin & Waiter Lifecycle:**
   - `POST /api/superadmin/users`, `POST /api/users`, `POST /api/branches/{branchId}/waiters`, `PUT/DELETE /api/waiters/{waiterId}`
2. **Operational Dashboards:**
   - `GET /api/admin/reports`, `/api/admin/branches/my`, `/api/admin/tables/my`, `/api/admin/waiters/my`, `/api/admin/menu`
3. **Access & Security:**
   - `POST /api/superadmin/admins/{adminId}/reset-password`
   - `POST /api/branches/{branchId}/assign-admin` and `DELETE /api/branches/{branchId}/unassign-admin`

### Key Endpoints for Kitchen Operations:

1. **Branch-Scoped Kitchen Endpoints (Recommended):**
   - `GET /api/branches/{branchId}/kitchen/orders` - View active orders for a specific branch
   - `POST /api/branches/{branchId}/kitchen/orders/{orderId}/accept` - Accept order (ORDERED → PREPARING)
   - `POST /api/branches/{branchId}/kitchen/orders/{orderId}/ready` - Mark order ready (PREPARING → PREPARED_WAITING)
2. **Kitchen PIN Management (Device Authentication):**
   - `GET /api/branches/{branchId}/kitchen/pin` - View PIN info (masked) - ADMIN/SUPERADMIN only
   - `POST /api/branches/{branchId}/kitchen/pin` - Set PIN manually - ADMIN/SUPERADMIN only
   - `POST /api/branches/{branchId}/kitchen/pin/generate` - Generate random PIN - ADMIN/SUPERADMIN only
   - `POST /api/branches/{branchId}/kitchen/pin/verify` - Verify PIN and get KDS token (public, no JWT)
3. **Dual Authentication:**
   - Kitchen endpoints support both JWT (existing) and KDS token (new) authentication
   - KDS tokens obtained via PIN verification, valid for 12 hours
   - Send KDS token in `X-KDS-Token` header for kitchen device sessions
4. **Tenant Isolation:**
   - All kitchen endpoints enforce branch-level access control
   - `ROLE_KITCHEN` and `ROLE_ADMIN` can only access their assigned branch
   - `ROLE_SUPERADMIN` can access any branch
   - KDS tokens are branch-specific and cannot access other branches
   - Legacy endpoints (`/api/kitchen/orders`) are deprecated but still functional for backward compatibility

---

## ✅ Validation Summary

### Common Validations:
- `@NotBlank` - String cannot be null, empty, or whitespace
- `@NotNull` - Field cannot be null
- `@Email` - Must be valid email format
- `@Size(min = 6)` - Minimum length (for passwords)
- `@Min(1)` - Minimum numeric value
- `@Positive` - Must be positive number
- `@Pattern` - Regex pattern validation (for order status)

### Field Types:
- **String** - Text fields
- **Long** - Numeric IDs and large integers
- **Integer** - Small integers (quantities, counts)
- **BigDecimal** - Decimal numbers (salaries, prices)
- **Boolean** - True/false values
- **Instant** - UTC timestamps (ISO-8601, e.g. `2025-01-01T00:00:00Z`)
- **Enum** - Predefined values (SalaryPeriod, AnalyticsGranularity, OrderStatus)

---

**Documentation Complete** ✅

All endpoint URLs, request bodies, path variables, query parameters, and validation rules have been documented.

