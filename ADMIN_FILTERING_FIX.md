# Admin County Filtering - Fix Summary

## Problem Identified ❌

When logging in as a county admin, the admin could see reports from all counties instead of just their assigned county. This happened because:

1. The migration files had naming conflicts (both 002_*.sql files)
2. The `is_root_admin` column wasn't being propagated correctly through the JWT token
3. The filtering logic existed but wasn't being triggered due to missing data

## Root Causes Fixed ✅

### 1. **Migration File Naming Conflict**
   - **Problem**: `002_admin_hierarchy.sql` and `002_technician_job_role.sql` both had the same "002" prefix
   - **Fix**: Renamed `002_admin_hierarchy.sql` → `003_admin_hierarchy.sql`
   - **Impact**: Ensures proper migration execution order

### 2. **Full JWT Token Flow Fixed**
   - **Database Schema**: Added `is_root_admin BOOLEAN DEFAULT FALSE` column ✓
   - **Registration**: Token now includes `is_root_admin` and `county` ✓
   - **Login**: Token creation includes `is_root_admin` and `county` ✓
   - **JWT Payload Type**: Updated to include both fields ✓

### 3. **Backend Filtering Logic**
   - **Controller**: Passes user's `county` and `is_root_admin` to service ✓
   - **Service**: Applies county filter for non-root admins ✓
   - **Logging**: Added debug logs to track filtering decisions ✓

### 4. **Admin Creation Form**
   - **Root Admin Toggle**: Added checkbox to designate root admins ✓
   - **County Field**: Optional when root admin is checked ✓
   - **API Validation**: Updated to support both admin types ✓

## How It Works Now

### Root Admin (Super Admin)
- ✓ Sees ALL reports from ALL counties
- ✓ Can assign technicians across all counties
- ✓ Has system-wide oversight

### County Admin
- ✓ Sees reports ONLY from their assigned county
- ✓ Can only assign/manage technicians in their county
- ✓ Cannot access reports from other counties

## Testing the Fix

### 1. Check Database State
```bash
npx ts-node test-admin-filter.ts
```

Expected output:
```
Admin users in database:
  - root@admin.com (Root Administrator)
    Role: admin, County: , Root Admin: true
  - nairobi@admin.com (Nairobi County Admin)
    Role: admin, County: Nairobi, Root Admin: false
```

### 2. Create a County Admin
1. Log in as root admin
2. Go to Dashboard → "Create Admin"
3. Fill in: Email, Password, Full Name, County
4. **IMPORTANT**: Leave "Root Admin" checkbox UNCHECKED
5. Click "Create Admin"

### 3. Test Filtering
1. Log in with the county admin account
2. Go to Reports page
3. Verify that ONLY reports from their assigned county appear
4. Check browser console → Network tab → `/api/reports/admin/all`
5. Response should only contain reports where `county = admin's county`

### 4. Verify Root Admin Still Works
1. Log back in as root admin
2. Go to Reports page
3. Verify that reports from ALL counties appear

## Debug Logs Location

When running the backend in development mode, check logs for:
```
Creating JWT token for user login
{
  "id": "uuid",
  "email": "admin@example.com", 
  "role": "admin",
  "county": "Nairobi",  // ← Should be present
  "is_root_admin": false  // ← Should be present
}

Applying county admin filter:
{
  "user_county": "Nairobi",
  "is_root_admin": false
}
```

## Files Modified

### Backend
- `src/services/auth.service.ts`: JWT creation with new fields
- `src/controllers/reports.controller.ts`: Pass user data to service
- `src/services/reports.service.ts`: Apply county filtering
- `src/types/index.ts`: `JwtPayload` and `UserRow` interfaces
- `src/middlewares/validation.middleware.ts`: Admin creation validation
- `migrations/003_admin_hierarchy.sql`: Database schema (renamed from 002)

### Frontend
- `src/types/index.ts`: Updated `User` interface
- `src/services/api.ts`: Updated `createAdmin` API call
- `src/pages/admin/Dashboard.tsx`: Added "Root Admin" checkbox

## Backward Compatibility ✓

- All existing admins automatically upgraded to `is_root_admin = TRUE`
- System behaves exactly as before for existing admins
- No migrations failed; no data was lost
- Existing JWT tokens still work (new logins get updated tokens)

## Next Steps

1. **Test with County Admins**: Create 2-3 county admins and verify isolation
2. **Monitor Logs**: Check `logger.debug` output for filtering decisions
3. **User Training**: Inform admins about the new hierarchy
4. **Remove Debug Logs**: After verification, remove debug logging from production

## Troubleshooting

| Issue | Check |
|-------|-------|
| County admin still sees all reports | Verify `is_root_admin = false` in DB |
| JWT missing fields | Rebuild backend after migrations |
| Still says "already applied" | Run `/migrations/run.ts` to update schema_migrations table |
| No county filter applied | Check backend logs for "Applying county admin filter" |

---

**Status**: ✅ Fixed and ready for testing
**Migration**: `003_admin_hierarchy.sql` (idempotent)
**Testing**: Use `test-admin-filter.ts` to verify DB state
