# Backend Staff Update Endpoint Specification

## Current Issue
The frontend is trying to update staff member details (including names), but the backend `PATCH /api/users/{email}` endpoint doesn't support all the fields we need.

## Current Frontend Implementation

### What We're Sending:
```json
{
  "role": "ROLE_WAITER" | "ROLE_KITCHEN",
  "fullName": "John Doe",  // ⚠️ NOT in current UpdateUserRequest DTO
  "phoneNumber": "+1234567890",
  "salaryAmount": 1200.00,
  "salaryPeriod": "MONTHLY",
  "branchId": 5
}
```

### Current Backend Endpoint (from API docs):

**Endpoint:** `PATCH /api/users/{email}`

**Current UpdateUserRequest DTO:**
```java
{
  "password": String (OPTIONAL) - Can only be set for ROLE_SUPERADMIN and ROLE_ADMIN
  "role": String (OPTIONAL) - Role update (restricted by requester role)
  "restaurantId": Long (OPTIONAL) - Restaurant ID (restricted by role)
  "branchId": Long (OPTIONAL) - Branch ID (restricted by role)
  "phoneNumber": String (OPTIONAL) - Can be updated for staff members
  "salaryAmount": Double (OPTIONAL, @Positive) - Can be updated for staff members
  "salaryPeriod": SalaryPeriod (OPTIONAL) - Can be updated for staff members
}
```

## Required Backend Changes

### Option 1: Add Name Fields to UpdateUserRequest (RECOMMENDED)

**Update the `UpdateUserRequest` DTO to include:**

```java
public class UpdateUserRequest {
    private String password;           // OPTIONAL - Can only be set for ROLE_SUPERADMIN and ROLE_ADMIN
    private String role;               // OPTIONAL - Role update (restricted by requester role)
    private Long restaurantId;         // OPTIONAL - Restaurant ID (restricted by role)
    private Long branchId;             // OPTIONAL - Branch ID (restricted by role)
    private String phoneNumber;        // OPTIONAL - Can be updated for staff members
    private Double salaryAmount;       // OPTIONAL, @Positive - Can be updated for staff members
    private SalaryPeriod salaryPeriod; // OPTIONAL - Can be updated for staff members
    
    // ADD THESE FIELDS:
    private String fullName;           // OPTIONAL - Full name for staff members
    // OR alternatively:
    private String firstName;          // OPTIONAL - First name
    private String lastName;           // OPTIONAL - Last name
}
```

**Notes:**
- If your backend uses `fullName` (single field), add `fullName` to the DTO
- If your backend uses `firstName` and `lastName` (separate fields), add both fields
- The frontend currently sends `fullName` by combining firstName and lastName

### Option 2: Use Separate firstName/lastName Fields

If your backend stores names as separate fields, update the DTO to accept:
```java
private String firstName;  // OPTIONAL
private String lastName;   // OPTIONAL
```

## Complete Request Body Example

### For Staff Update (with names):
```json
{
  "role": "ROLE_WAITER",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "salaryAmount": 1200.00,
  "salaryPeriod": "MONTHLY",
  "branchId": 5
}
```

### For Staff Update (with separate name fields):
```json
{
  "role": "ROLE_WAITER",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "salaryAmount": 1200.00,
  "salaryPeriod": "MONTHLY",
  "branchId": 5
}
```

## Backend Service Implementation

### Update User Service Method Should:

1. **Validate the request:**
   - Ensure the user exists
   - Check authorization (ADMIN can update staff in their branch, SUPERADMIN can update any staff)
   - Validate salaryAmount is positive if provided
   - Validate salaryPeriod is one of: DAILY, WEEKLY, MONTHLY

2. **Update the user entity:**
   ```java
   if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
       user.setFullName(request.getFullName().trim());
   }
   // OR if using firstName/lastName:
   if (request.getFirstName() != null) {
       user.setFirstName(request.getFirstName().trim());
   }
   if (request.getLastName() != null) {
       user.setLastName(request.getLastName().trim());
   }
   
   if (request.getPhoneNumber() != null) {
       user.setPhoneNumber(request.getPhoneNumber().trim());
   }
   
   if (request.getSalaryAmount() != null) {
       user.setSalaryAmount(request.getSalaryAmount());
   }
   
   if (request.getSalaryPeriod() != null) {
       user.setSalaryPeriod(request.getSalaryPeriod());
   }
   
   if (request.getBranchId() != null) {
       // Validate branch exists and belongs to the restaurant
       Branch branch = branchRepository.findById(request.getBranchId())
           .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
       user.setBranchId(branch.getId());
   }
   
   if (request.getRole() != null) {
       // Validate role change is allowed
       user.setRole(request.getRole());
   }
   ```

3. **Save and return:**
   ```java
   User updatedUser = userRepository.save(user);
   return mapToUserRecord(updatedUser);
   ```

## Authorization Rules

- **ROLE_ADMIN**: Can update staff members in their own branch only
  - Can update: firstName, lastName, phoneNumber, salaryAmount, salaryPeriod
  - Cannot update: role, branchId (staff must stay in admin's branch), restaurantId
  
- **ROLE_SUPERADMIN**: Can update any staff member
  - Can update: firstName, lastName, phoneNumber, salaryAmount, salaryPeriod, branchId, role
  - Cannot update: restaurantId (staff must stay in same restaurant)

## Validation Rules

1. **fullName** (if used):
   - Must not be blank if provided
   - Trim whitespace

2. **firstName/lastName** (if used):
   - Must not be blank if provided
   - Trim whitespace

3. **phoneNumber**:
   - Must not be blank if provided
   - Trim whitespace

4. **salaryAmount**:
   - Must be positive (@Positive)
   - Must be a valid number

5. **salaryPeriod**:
   - Must be one of: DAILY, WEEKLY, MONTHLY
   - Case-insensitive matching

6. **branchId**:
   - Must exist in database
   - Must belong to the same restaurant as the user
   - For ADMIN: Must be the admin's own branchId

7. **role**:
   - Must be valid role (ROLE_WAITER, ROLE_KITCHEN, etc.)
   - ADMIN cannot change roles
   - SUPERADMIN can change roles

## Response Format

The endpoint should return the updated `UserRecord` with all fields:

```json
{
  "id": 123,
  "email": "waiter@example.com",
  "fullName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ROLE_WAITER",
  "phoneNumber": "+1234567890",
  "phone": "+1234567890",
  "salaryAmount": 1200.00,
  "salaryPeriod": "MONTHLY",
  "branchId": 5,
  "restaurantId": 1
}
```

## Error Handling

The backend should return appropriate error responses:

1. **400 Bad Request**: Invalid data (e.g., negative salary, invalid role)
   ```json
   {
     "message": "Salary amount must be positive"
   }
   ```

2. **404 Not Found**: User not found
   ```json
   {
     "message": "User not found"
   }
   ```

3. **403 Forbidden**: Unauthorized to update this user
   ```json
   {
     "message": "You do not have permission to update this user"
   }
   ```

4. **400 Bad Request**: Branch not found or doesn't belong to restaurant
   ```json
   {
     "message": "Branch not found or does not belong to this restaurant"
   }
   ```

## Testing Checklist

- [ ] Update staff member's fullName/firstName/lastName
- [ ] Update staff member's phoneNumber
- [ ] Update staff member's salaryAmount
- [ ] Update staff member's salaryPeriod
- [ ] Update staff member's branchId (SUPERADMIN only)
- [ ] Update staff member's role (SUPERADMIN only)
- [ ] Verify ADMIN cannot update branchId
- [ ] Verify ADMIN cannot update role
- [ ] Verify validation errors for invalid data
- [ ] Verify authorization checks work correctly

## Frontend Code Reference

The frontend code that needs this functionality is in:
- `src/lib/api/admin.ts` - `updateStaff()` function
- `src/app/admin/staff/page.tsx` - Admin staff edit form
- `src/app/superadmin/staff/page.tsx` - Superadmin staff edit form

The frontend currently sends:
```typescript
{
  role: 'ROLE_WAITER' | 'ROLE_KITCHEN',
  firstName: string,
  lastName: string,
  phoneNumber: string,
  salaryAmount: number,
  salaryPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  branchId: number  // Only for superadmin
}
```

And converts firstName/lastName to fullName before sending.

