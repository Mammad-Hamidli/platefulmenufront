# Debugging 500 Error on Staff Update

## Error Details
- **Error:** "Request failed with status code 500"
- **Endpoint:** `PATCH /api/users/{email}`
- **Action:** Editing staff member

## What We're Sending (Based on Modal)

From the screenshot, the edit form contains:
- **Branch:** Ganjlik Filiali (branchId)
- **Staff type:** Waiter (maps to ROLE_WAITER)
- **First name:** salam
- **Last name:** aleykum
- **Phone number:** +994505275633
- **Salary:** 12
- **Salary cycle:** (not visible, but likely Daily/Weekly/Monthly)

## Expected Request Body

Based on our code, the frontend should be sending:

```json
{
  "role": "ROLE_WAITER",
  "firstName": "salam",
  "lastName": "aleykum",
  "fullName": "salam aleykum",
  "phoneNumber": "+994505275633",
  "salaryAmount": 12.00,
  "salaryPeriod": "DAILY" | "WEEKLY" | "MONTHLY",
  "branchId": <branch_id_number>
}
```

## Possible Causes of 500 Error

### 1. Backend Not Handling Name Fields
**Issue:** Backend `UpdateUserRequest` DTO might not have `firstName`, `lastName`, or `fullName` fields yet.

**Solution:** Backend needs to add these fields to `UpdateUserRequest`:
```java
private String fullName;    // OPTIONAL
private String firstName;   // OPTIONAL
private String lastName;    // OPTIONAL
```

### 2. Backend Service Not Processing Name Fields
**Issue:** Even if DTO has the fields, the service might not be updating them in the database.

**Solution:** Backend service should update user entity:
```java
if (request.getFullName() != null) {
    user.setFullName(request.getFullName().trim());
}
// OR
if (request.getFirstName() != null) {
    user.setFirstName(request.getFirstName().trim());
}
if (request.getLastName() != null) {
    user.setLastName(request.getLastName().trim());
}
```

### 3. Database Constraint Violation
**Issue:** Database might have constraints that are being violated (e.g., NOT NULL constraint, unique constraint).

**Solution:** Check backend logs for specific database error messages.

### 4. Null Pointer Exception
**Issue:** Backend might be trying to access a field that doesn't exist or is null.

**Solution:** Backend needs null checks before accessing fields.

### 5. Branch ID Validation Issue
**Issue:** The branchId might be invalid or the backend might be trying to validate it incorrectly.

**Solution:** Verify the branchId exists and belongs to the restaurant.

### 6. Salary Period Enum Issue
**Issue:** The salaryPeriod value might not match the backend enum exactly.

**Solution:** Ensure we're sending uppercase values: "DAILY", "WEEKLY", "MONTHLY"

## Immediate Debugging Steps

### Step 1: Check Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try editing the staff member again
4. Find the PATCH request to `/api/users/{email}`
5. Click on it and check:
   - **Request Payload:** What we're actually sending
   - **Response:** The full error response from backend
   - **Status Code:** Should be 500

### Step 2: Check Backend Logs
Look for:
- Stack traces
- Null pointer exceptions
- Validation errors
- Database constraint violations

### Step 3: Test with Minimal Payload
Try sending only one field at a time to isolate the issue:
- First try: Only `phoneNumber`
- Then: Only `salaryAmount`
- Then: Only `firstName` and `lastName`
- Then: Only `branchId`

## Quick Fix: Send Only Supported Fields

If the backend doesn't support name fields yet, we can temporarily modify the code to only send fields that are definitely supported:

```typescript
// Temporarily comment out name fields
// if (payload.firstName !== undefined || payload.lastName !== undefined) {
//   ...
// }
```

But this is not ideal - we should fix the backend instead.

## Backend Checklist

The backend team should verify:

- [ ] `UpdateUserRequest` DTO includes `fullName`, `firstName`, `lastName` fields
- [ ] Service method updates these fields in the user entity
- [ ] No null pointer exceptions when accessing optional fields
- [ ] Database schema supports these fields (not null constraints, etc.)
- [ ] Branch ID validation is working correctly
- [ ] Salary period enum matches exactly ("DAILY", "WEEKLY", "MONTHLY")
- [ ] Authorization checks are passing (ROLE_SUPERADMIN can update any staff)

## Recommended Backend Fix

The backend should implement the `UpdateUserRequest` DTO as documented:

```java
public class UpdateUserRequest {
    private String password;        // OPTIONAL
    private String role;            // OPTIONAL
    private Long restaurantId;      // OPTIONAL
    private Long branchId;         // OPTIONAL
    private String fullName;        // ✅ ADD THIS
    private String firstName;       // ✅ ADD THIS
    private String lastName;        // ✅ ADD THIS
    private String phoneNumber;     // OPTIONAL
    private Double salaryAmount;    // OPTIONAL
    private SalaryPeriod salaryPeriod; // OPTIONAL
}
```

And the service should handle these fields:

```java
if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
    user.setFullName(request.getFullName().trim());
}
// OR handle firstName/lastName separately
if (request.getFirstName() != null) {
    user.setFirstName(request.getFirstName().trim());
}
if (request.getLastName() != null) {
    user.setLastName(request.getLastName().trim());
}
```

## Next Steps

1. **Check browser console/network tab** for the exact request and response
2. **Check backend logs** for the specific error
3. **Share the error details** with the backend team
4. **Verify backend implementation** matches the API documentation

The 500 error is definitely a backend issue - the frontend is sending the correct data according to the API documentation.

