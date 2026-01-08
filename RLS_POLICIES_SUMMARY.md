# Row Level Security (RLS) Policies for Data Isolation

## Overview

This migration (`20260115_add_data_isolation_rls_policies.sql`) adds comprehensive RLS policies to ensure data isolation at the database level. Even if someone bypasses the UI, they cannot access data they shouldn't see.

## Security Model

### 1. rc_cases Table

**Policy: `rc_cases_select_by_role`**

- **Attorneys**: Can only SELECT cases where `attorney_id = their rc_users.id`
- **Clients**: Can only SELECT cases where `client_id` links to their `rc_users.id` via `rc_clients` table
- **RN CMs / Supervisors**: Can see all cases (Phase 1 simplification)

**SQL Logic:**
```sql
-- Attorney sees cases where they are assigned
(u.role = 'attorney' AND rc_cases.attorney_id = u.id)

-- Client sees cases where they are the client
(u.role = 'client' AND EXISTS (
  SELECT 1 FROM rc_clients c
  WHERE c.id = rc_cases.client_id AND c.user_id = u.id
))

-- RN CM / Supervisor sees all cases
OR u.role IN ('rn_cm', 'supervisor')
```

### 2. rc_client_intakes Table

**All policies join through `rc_cases` to check authorization.**

#### SELECT Policy: `rc_client_intakes_select_by_case_access`
- Users can only see intakes for cases they have access to
- Authorization is verified by joining through `rc_cases`
- Same role-based access as `rc_cases`:
  - Attorneys see intakes for their cases
  - Clients see intakes for their cases
  - RN CMs / Supervisors see all intakes

#### INSERT Policy: `rc_client_intakes_insert_by_client`
- Only clients can create intakes
- Clients can only create intakes for their own cases
- Verified through: `rc_client_intakes.case_id` → `rc_cases` → `rc_clients` → `rc_users`

#### UPDATE Policy: `rc_client_intakes_update_by_authorized`
- **Clients**: Can update intakes for their own cases
- **Attorneys**: Can update intakes for their cases (for attestation)
- **RN CMs / Supervisors**: Can update any intake
- Authorization verified through `rc_cases` join

#### DELETE Policy: `rc_client_intakes_delete_by_rn`
- Only RN CMs and Supervisors can delete intakes
- In practice, this should be a soft delete via `deleted_at` column
- Clients and attorneys cannot directly delete intakes

## Data Flow

### For Clients:
```
auth.uid() → rc_users.auth_user_id
         → rc_users.id
         → rc_clients.user_id
         → rc_clients.id
         → rc_cases.client_id
         → rc_cases.id
         → rc_client_intakes.case_id
```

### For Attorneys:
```
auth.uid() → rc_users.auth_user_id
         → rc_users.id
         → rc_cases.attorney_id
         → rc_cases.id
         → rc_client_intakes.case_id
```

## Security Guarantees

1. **Attorneys cannot see other attorneys' cases** - Enforced by `attorney_id = u.id` check
2. **Clients cannot see other clients' cases** - Enforced by `rc_clients.user_id = u.id` check
3. **Intakes are protected by case access** - All intake policies join through `rc_cases` to verify authorization
4. **No direct data access** - Even with direct SQL queries, users can only see their authorized data

## Migration Details

- **File**: `supabase/migrations/20260115_add_data_isolation_rls_policies.sql`
- **Drops existing policy**: `rc_cases_select_by_role` (to add client support)
- **Creates new policies**: 5 policies total
  - 1 for `rc_cases` (SELECT)
  - 4 for `rc_client_intakes` (SELECT, INSERT, UPDATE, DELETE)

## Testing Recommendations

1. **Test as Attorney**: 
   - Should only see cases where `attorney_id` matches their `rc_users.id`
   - Should only see intakes for those cases

2. **Test as Client**:
   - Should only see cases where `client_id` links to their `rc_users.id`
   - Should only see intakes for those cases
   - Should be able to create/update intakes for their cases

3. **Test as RN CM**:
   - Should see all cases
   - Should see all intakes
   - Should be able to update/delete intakes

4. **Test unauthorized access**:
   - Try to query cases/intakes that don't belong to the user
   - Should return empty results (not errors)

## Notes

- RLS is enforced at the database level, so it works even if the application layer is bypassed
- Policies use `EXISTS` subqueries for efficient checking
- All policies require `auth.uid() IS NOT NULL` to ensure user is authenticated
- The migration is idempotent (uses `DROP POLICY IF EXISTS`)
