# Creating County-Specific Admins

## Step-by-Step Guide

### 1. Log In as Root Admin
- Email: Your root admin email
- Password: Your root admin password
- Verify you see "All Counties" in the dashboard subtitle

### 2. Navigate to Create Admin
- Click the **"Create Admin"** button in the top right
- A modal dialog will appear

### 3. Fill in Admin Details
- **Full Name**: e.g., "Nairobi County Administrator"
- **Email Address**: e.g., "nairobi.admin@example.com"
- **Phone Number**: (Optional) County admin's phone
- **County**: Select the county they will manage (Required)
- **Password**: Must have uppercase, lowercase, and a number

### 4. ⚠️ CRITICAL: Root Admin Settings
- **DO NOT check** "Root Admin (can see all counties)"
  - Check this ONLY for super admins
  - Leave it UNCHECKED for county-specific admins

### 5. Click "Create Admin"
- System will create the account
- Toast notification: "Admin account created successfully!"
- Share credentials with the new admin securely

## Verification After Creation

### Test as Root Admin
1. Go to Reports page
2. You should see reports from ALL counties

### Test as County Admin
1. Log in with the newly created account
2. Go to Reports page
3. Verify that only reports from their county appear
4. Verify that technicians list shows only technicians from their county

## Common Mistakes

❌ **Checking "Root Admin" for county admins**
- Result: Admin sees all counties (defeats the purpose)
- Fix: Uncheck the checkbox when creating

❌ **Not selecting a county**
- Result: Admin can't see any reports (county is NULL)
- Fix: Always select a county for county admins

❌ **Creating multiple admins for same county**
- Result: Multiple admins can manage same county (by design, for redundancy)
- Fix: This is actually okay! Allows team management

## What Each Admin Type Can Do

### Root Admin (is_root_admin = TRUE)
- ✓ See reports from ALL counties
- ✓ See all technicians across Kenya
- ✓ Create new admin accounts
- ✓ System-wide reporting and analytics

### County Admin (is_root_admin = FALSE)
- ✓ See reports ONLY from assigned county
- ✓ See technicians ONLY from assigned county
- ✓ Assign technicians to reports in their county
- ✓ Update report statuses for their county
- ✗ Cannot modify other counties' data
- ✗ Cannot see other counties' reports

## Emergency Access

If a county admin needs to see another county's reports:
1. Contact the root administrator
2. Root admin can view the reports
3. Create a separate root admin account if needed (be careful with this!)

## SQL Query to Check Admin Levels

```sql
-- View all admins and their access level
SELECT 
  email, 
  full_name, 
  county,
  CASE 
    WHEN is_root_admin = TRUE THEN 'ROOT ADMIN (All Counties)'
    WHEN is_root_admin = FALSE THEN 'COUNTY ADMIN (' || county || ')'
    ELSE 'Unknown'
  END as admin_level
FROM users 
WHERE role = 'admin'
ORDER BY is_root_admin DESC, county;
```

---

**Last Updated**: April 9, 2026
**Admin Hierarchy Version**: 1.0
