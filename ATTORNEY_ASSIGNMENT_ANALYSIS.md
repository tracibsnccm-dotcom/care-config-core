# Attorney Assignment Analysis for Intakes

## Summary

This document analyzes how attorney assignment works for client intakes and identifies potential issues.

---

## 1. rc_client_intakes Table Schema

### Table Definition
Found in: `supabase/migrations/202601061303_add_intake_attestation_and_notifications.sql`

```sql
CREATE TABLE IF NOT EXISTS public.rc_client_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.rc_cases(id) ON DELETE CASCADE,
  intake_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Attorney-related columns:
  intake_submitted_at timestamptz,
  attorney_confirm_deadline_at timestamptz,
  attorney_attested_at timestamptz,
  attorney_attested_by text,  -- ⚠️ Text field, not UUID
  intake_status text NOT NULL DEFAULT 'draft',
  deleted_at timestamptz,
  deletion_reason text,
  last_notified_at timestamptz
);
```

### ⚠️ CRITICAL FINDINGS:

1. **NO `attorney_id` COLUMN** - The `rc_client_intakes` table does NOT have an `attorney_id` column
2. **NO `assigned_attorney_id` COLUMN** - There is no assigned attorney column either
3. **Attorney is stored in `rc_cases` table** - The attorney assignment is stored in the related `rc_cases` table via `attorney_id` column

**The intake itself does NOT have an attorney_id field. Attorney assignment is tracked via the case relationship.**

---

## 2. RLS Policies on rc_client_intakes

### ⚠️ CRITICAL: NO RLS POLICIES FOUND

**No RLS policies were found in the migration file that creates `rc_client_intakes`.**

The migration file (`202601061303_add_intake_attestation_and_notifications.sql`) creates the table but does NOT:
- Enable Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- Create any SELECT policies
- Create any INSERT policies
- Create any UPDATE policies
- Create any DELETE policies

**This means the table may be accessible to all authenticated users, or access may be controlled elsewhere (check Supabase dashboard).**

---

## 3. IntakeWizard Component - Attorney Assignment

### Where Attorney Code is Collected
- **File**: `src/pages/IntakeWizard.tsx`
- **State variable**: `attorneyCode` (line 152) - text input from user
- **State variable**: `clientType` (line 153) - 'I' for internal, 'D' for defense, 'R' for referral

### How Attorney Assignment Works

1. **Attorney Code Input**: Client enters `attorneyCode` in the intake form (if not internal lead)

2. **Case Creation**: 
   - A `newCase` object is created (line 286) but **I could not find where this case is inserted into `rc_cases` table**
   - The code references `.from("cases")` for updates (line 500) but the actual INSERT is not visible in IntakeWizard
   - **⚠️ ISSUE**: The case may be created by an edge function or elsewhere, but attorney_id assignment is unclear

3. **Intake Submission** (lines 566-585):
   ```typescript
   // Get attorney_id from rc_cases if available, otherwise use attorneyCode as text
   let attorneyIdText: string | null = attorneyCode || null;
   
   // Try to get actual attorney_id from rc_cases
   if (newCase.id) {
     const { data: caseData } = await supabase
       .from('rc_cases')
       .select('attorney_id')
       .eq('id', newCase.id)
       .maybeSingle();
     
     if (caseData?.attorney_id) {
       attorneyIdText = caseData.attorney_id;
     }
   }
   ```
   
   **⚠️ PROBLEM**: This tries to read `attorney_id` from `rc_cases`, but if the case doesn't exist yet or wasn't assigned an attorney, `attorneyIdText` will just be the `attorneyCode` string.

4. **Intake Record Creation** (lines 593-600):
   ```typescript
   await supabase
     .from("rc_client_intakes")
     .insert({
       case_id: newCase.id,
       intake_json: intakeJson,
       intake_submitted_at: submittedAt,
       attorney_confirm_deadline_at: attorneyConfirmDeadlineAt,
       // ⚠️ NO attorney_id or attorney_attested_by is set here!
     });
   ```
   
   **The intake record does NOT store the attorney assignment. It only stores:**
   - `case_id` (links to rc_cases)
   - `intake_submitted_at`
   - `attorney_confirm_deadline_at`
   - `intake_json` (contains all intake data)

### What Field Stores Selected Attorney?

**Answer**: There is NO field in `rc_client_intakes` that stores the selected attorney.

- The `attorney_attested_by` field is set LATER when an attorney attests/confirms the intake
- Attorney assignment is stored in `rc_cases.attorney_id`, not in the intake record
- The `attorneyCode` entered by the client is only used to generate the client ID and may be stored in `intake_json`

---

## 4. AttorneyIntakeTracker - Columns Selected

### File: `src/components/AttorneyIntakeTracker.tsx`

### Query (lines 82-98):
```typescript
let query = supabase
  .from('rc_client_intakes')
  .select(`
    id,
    case_id,
    intake_submitted_at,
    attorney_confirm_deadline_at,
    attorney_attested_at,
    intake_status,
    intake_json,
    created_at,
    rc_cases!inner (
      client_id,
      attorney_id  // ⚠️ This is where attorney_id comes from
    )
  `)
  .in('intake_status', ['submitted_pending_attorney', 'attorney_confirmed', 'attorney_declined_not_client']);
```

### How Attorney Filtering Works (lines 100-113):

```typescript
// If "mine" scope, filter by attorney_id in cases
if (scope === 'mine' && user) {
  // Get attorney rc_user id if available
  const { data: rcUser } = await supabase
    .from('rc_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('role', 'attorney')
    .single();

  if (rcUser?.id) {
    query = query.eq('rc_cases.attorney_id', rcUser.id);  // ⚠️ Filters by rc_cases.attorney_id
  }
}
```

**Key Points:**
1. AttorneyIntakeTracker gets `attorney_id` from the JOINed `rc_cases` table, NOT from `rc_client_intakes`
2. When filtering "mine", it matches `rc_cases.attorney_id` to the logged-in attorney's `rc_users.id`
3. The intake record itself has no direct attorney reference

---

## 5. Verification Checklist

### ✅ Does the intake have an attorney_id field?
**NO** - `rc_client_intakes` does NOT have an `attorney_id` field. Attorney assignment is stored in `rc_cases.attorney_id`.

### ✅ Is the test intake actually assigned to the logged-in attorney?
**CHECK THIS**:
1. Query the `rc_cases` table for the test intake's `case_id`
2. Check if `rc_cases.attorney_id` matches the logged-in attorney's `rc_users.id`
3. The attorney's `rc_users.id` can be found by:
   ```sql
   SELECT id FROM rc_users WHERE auth_user_id = '<attorney-auth-uid>' AND role = 'attorney';
   ```

### ✅ Are RLS policies blocking the update because of attorney ownership?
**POSSIBLE ISSUE**:
1. **No RLS policies found on `rc_client_intakes`** - This may be intentional (all authenticated users can update) or may need to be added
2. **Check `rc_cases` RLS policies** - If the attorney can't see/update their own cases, that could block intake updates
3. **Check if there are implicit policies** - Policies may be defined in Supabase dashboard but not in migrations

### How to Verify Attorney Assignment:

```sql
-- 1. Find the intake record
SELECT * FROM rc_client_intakes WHERE case_id = '<test-case-id>';

-- 2. Check the case's attorney assignment
SELECT 
  c.id as case_id,
  c.attorney_id,
  u.id as rc_user_id,
  u.auth_user_id,
  u.role
FROM rc_cases c
LEFT JOIN rc_users u ON c.attorney_id = u.id
WHERE c.id = '<test-case-id>';

-- 3. Check if logged-in attorney matches
SELECT 
  id as rc_user_id,
  auth_user_id,
  role
FROM rc_users
WHERE auth_user_id = '<logged-in-attorney-auth-uid>' 
  AND role = 'attorney';
```

**If `rc_cases.attorney_id` doesn't match the attorney's `rc_users.id`, the intake will not show up in "mine" scope.**

---

## 6. Potential Issues & Recommendations

### Issue 1: Attorney Assignment May Not Be Set
**Problem**: When an intake is submitted, the `rc_cases.attorney_id` may not be set, especially for:
- Internal leads (clientType = 'I')
- Cases where only `attorneyCode` is provided (text, not UUID)

**Recommendation**: Ensure the case creation logic sets `attorney_id` when:
- Attorney code is provided AND matches an attorney
- Internal leads may need manual assignment or round-robin

### Issue 2: No RLS Policies on rc_client_intakes
**Problem**: Without RLS policies, any authenticated user could potentially update any intake.

**Recommendation**: Add RLS policies:
```sql
ALTER TABLE public.rc_client_intakes ENABLE ROW LEVEL SECURITY;

-- Attorneys can update intakes for their own cases
CREATE POLICY "Attorneys can update their case intakes"
ON public.rc_client_intakes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM rc_cases c
    INNER JOIN rc_users u ON c.attorney_id = u.id
    WHERE c.id = rc_client_intakes.case_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'attorney'
  )
);
```

### Issue 3: attorney_attested_by is Text, Not UUID
**Problem**: The `attorney_attested_by` field is `text`, not a UUID reference to `rc_users.id`.

**Recommendation**: Consider changing to UUID if you want proper foreign key relationships, or ensure the text value is consistent (e.g., always use `rc_users.id` as text).

### Issue 4: Case Creation Logic Unclear
**Problem**: The IntakeWizard creates a `newCase` object but the actual INSERT into `rc_cases` is not visible in the code.

**Recommendation**: 
1. Find where `rc_cases` is actually created (may be in an edge function)
2. Ensure `attorney_id` is set during case creation
3. If using `attorneyCode`, resolve it to `rc_users.id` before setting

---

## 7. Next Steps for Debugging

1. **Check the actual case record**:
   ```sql
   SELECT * FROM rc_cases WHERE id = '<test-case-id>';
   ```
   Verify if `attorney_id` is NULL or set incorrectly.

2. **Check attorney's rc_users record**:
   ```sql
   SELECT * FROM rc_users WHERE auth_user_id = '<attorney-auth-uid>';
   ```
   Verify the attorney has a `rc_users` record with correct `id`.

3. **Check if RLS is blocking**:
   - Try updating the intake as the attorney
   - Check browser console for RLS policy errors
   - Check Supabase logs for RLS denial messages

4. **Verify the JOIN works**:
   ```sql
   SELECT 
     i.id as intake_id,
     i.case_id,
     c.attorney_id,
     u.id as rc_user_id,
     u.auth_user_id
   FROM rc_client_intakes i
   INNER JOIN rc_cases c ON i.case_id = c.id
   LEFT JOIN rc_users u ON c.attorney_id = u.id
   WHERE i.case_id = '<test-case-id>';
   ```

---

## Summary

**Key Finding**: `rc_client_intakes` does NOT have an `attorney_id` field. Attorney assignment is tracked via `rc_cases.attorney_id`. 

**For the blank screen/update issue:**
1. Verify `rc_cases.attorney_id` is set correctly for the test intake
2. Verify the logged-in attorney's `rc_users.id` matches `rc_cases.attorney_id`
3. Check if RLS policies on `rc_cases` or `rc_client_intakes` are blocking updates
4. Consider adding explicit RLS policies to `rc_client_intakes` if none exist
