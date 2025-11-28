# Staff Update Implementation Status

## ✅ Good News: Backend API Supports Name Updates!

According to the updated `COMPLETE_API_ENDPOINTS_DOCUMENTATION.md`, the backend **DOES support** updating staff names via the `PATCH /api/users/{email}` endpoint.

## Current API Documentation (Section 7: Update User)

### Supported Fields in UpdateUserRequest:

```json
{
  "password": "newpassword123",        // OPTIONAL - Only for SUPERADMIN/ADMIN
  "role": "ROLE_ADMIN",                // OPTIONAL - Restricted by requester role
  "restaurantId": 1,                   // OPTIONAL - Restricted by role
  "branchId": 5,                       // OPTIONAL - Restricted by role
  "fullName": "John Doe",              // ✅ OPTIONAL - Set/override display name
  "firstName": "John",                 // ✅ OPTIONAL - Structured name field
  "lastName": "Doe",                   // ✅ OPTIONAL - Structured name field
  "phoneNumber": "+1234567890",        // ✅ OPTIONAL - Can be updated for staff
  "salaryAmount": 1200.00,             // ✅ OPTIONAL - Can be updated for staff
  "salaryPeriod": "MONTHLY"            // ✅ OPTIONAL - Can be updated for staff
}
```

### Key Points from Documentation:

1. **Name Fields Support:**
   - `fullName` (String, OPTIONAL) - Set/override display name
   - `firstName` / `lastName` (String, OPTIONAL) - Structured name fields; **server derives `fullName` when both provided**

2. **Authorization Rules:**
   - `ROLE_SUPERADMIN`: Can update any staff/admin in their restaurant (including role/branch changes)
   - `ROLE_ADMIN`: Can update only staff members within their own branch; can edit name/phone/salary fields; **cannot change branchId, restaurantId, or promote staff to admin roles**

3. **Response:** Returns updated `UserDTO` with `fullName`, `firstName`, `lastName`, `phoneNumber`, and its alias `phone`, along with salary and assignment metadata.

## Frontend Implementation

### Current Implementation (`src/lib/api/admin.ts`):

Our code currently:
1. ✅ Sends `fullName` (combining firstName + lastName)
2. ✅ Sends `phoneNumber`
3. ✅ Sends `salaryAmount`
4. ✅ Sends `salaryPeriod`
5. ✅ Sends `branchId` (for superadmin)
6. ✅ Sends `role`

### Updated Implementation:

I've updated the code to send **both** `firstName`/`lastName` separately AND `fullName`, giving the backend flexibility to handle either approach.

## If It's Still Not Working

### Possible Issues:

1. **Backend Not Updated Yet:**
   - The API documentation might be ahead of the actual backend implementation
   - Check if the backend `UpdateUserRequest` DTO actually includes `fullName`, `firstName`, `lastName` fields

2. **Authorization Issues:**
   - Verify the logged-in user has the correct role (ROLE_ADMIN or ROLE_SUPERADMIN)
   - For ROLE_ADMIN: Ensure they're trying to update staff in their own branch only
   - Check backend logs for authorization errors

3. **Validation Errors:**
   - Check browser console for network errors
   - Check backend logs for validation errors
   - Verify all required fields are being sent correctly

4. **Email Encoding:**
   - The email in the URL path must be URL encoded
   - Our code uses `encodeURIComponent(email.toLowerCase())` which should be correct

### Debugging Steps:

1. **Check Network Tab:**
   - Open browser DevTools → Network tab
   - Try to edit a staff member
   - Check the PATCH request to `/api/users/{email}`
   - Verify the request body contains all expected fields
   - Check the response status code and error message

2. **Check Backend Logs:**
   - Look for any validation errors
   - Check if the endpoint is being hit
   - Verify authorization is passing

3. **Test with curl/Postman:**
   ```bash
   curl -X PATCH "http://your-backend/api/users/waiter%40example.com" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "John",
       "lastName": "Doe",
       "phoneNumber": "+1234567890",
       "salaryAmount": 1200.00,
       "salaryPeriod": "MONTHLY"
     }'
   ```

## Expected Request Body (from Frontend)

```json
{
  "role": "ROLE_WAITER",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "salaryAmount": 1200.00,
  "salaryPeriod": "MONTHLY",
  "branchId": 5
}
```

## Next Steps

1. ✅ Frontend code is updated to send name fields correctly
2. ⚠️ Verify backend actually implements the fields (check UpdateUserRequest DTO)
3. ⚠️ Test the endpoint with a tool like Postman
4. ⚠️ Check browser console and network tab for errors
5. ⚠️ Check backend logs for validation/authorization errors

## Summary

The API documentation says the backend **should** support name updates. If it's not working:
- The backend might not be updated yet
- There might be authorization/validation issues
- Check the actual error messages in browser console and backend logs

The frontend implementation is now aligned with the API documentation.

