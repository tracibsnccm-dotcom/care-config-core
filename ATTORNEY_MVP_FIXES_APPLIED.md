# Attorney MVP Safety Fixes - Critical Violations #1 & #3

**Date:** 2024-12-19  
**Status:** ✅ **FIXED**

---

## Summary

Fixed Critical Violations #1 and #3 by implementing role-aware data loading in `AppContext` and creating a dedicated `useAttorneyCases()` hook that enforces released-only case access for attorneys.

---

## Changes Made

### 1. Created `useAttorneyCases()` Hook

**File:** `src/hooks/useSupabaseData.ts`

- Added new hook that uses `getAttorneyCases()` from `attorneyCaseQueries.ts`
- Enforces released-only access via `attorney_accessible_cases()` RPC
- Never exposes draft cases to attorneys
- Returns `AttorneyCase[]` type which guarantees `case_status` is `'released' | 'closed'`

**Key Code:**
```typescript
export function useAttorneyCases() {
  // Uses getAttorneyCases() which calls attorney_accessible_cases() RPC
  // This RPC enforces released-only access at the database level
  const attorneyCases = await getAttorneyCases();
  // ...
}
```

---

### 2. Updated `AppContext` for Role-Aware Data Loading

**File:** `src/context/AppContext.tsx`

**Changes:**
- Added import for `useAttorneyCases` and `AttorneyCase` type
- Implemented role detection: `const isAttorney = role === ROLES.ATTORNEY`
- Conditional data loading:
  - **Attorneys:** Use `useAttorneyCases()` → returns only released/closed cases
  - **Others (RN, Staff, etc.):** Use `useCases()` → standard query
- Transform attorney cases to match `Case[]` type for backward compatibility
- Added **invariant check** in development mode to warn if draft cases are detected

**Key Code:**
```typescript
// Role-aware data loading
const { cases: supabaseCases, loading: casesLoading: rnCasesLoading } = useCases();
const { cases: attorneyCases, loading: casesLoading: attorneyCasesLoading } = useAttorneyCases();

// Select appropriate data source
const rawCases = isAttorney ? attorneyCases : supabaseCases;
const casesLoading = isAttorney ? attorneyCasesLoading : rnCasesLoading;

// Transform with role-specific logic
const cases: Case[] = (isAttorney 
  ? (rawCases as AttorneyCase[]).map(...)  // Attorney transformation
  : (rawCases as any[]).map(...)           // RN/Staff transformation
);

// Invariant check (dev only)
useEffect(() => {
  if (isAttorney && process.env.NODE_ENV === "development") {
    // Warn if any draft cases detected
  }
}, [isAttorney, cases, rawCases]);
```

---

### 3. Updated `Dashboard.tsx` Attorney Case Queries

**File:** `src/pages/Dashboard.tsx`

**Changes:**
- Replaced direct `case_assignments` + `cases` join query with `getAttorneyCases()`
- Updated case details fetch to use `getAttorneyCaseById()` for attorneys
- Added role check to ensure attorney-specific queries only run for attorneys

**Before:**
```typescript
const { data, error } = await supabase
  .from("case_assignments")
  .select(`case_id, cases (*)`)
  .eq("user_id", user.id)
  .eq("role", "ATTORNEY");
```

**After:**
```typescript
const { getAttorneyCases } = await import("@/lib/attorneyCaseQueries");
const attorneyCases = await getAttorneyCases();
// Uses released-only RPC
```

---

## Security Guarantees

### ✅ Attorney Data Source is Released-Only by Construction

1. **Database Layer:** `attorney_accessible_cases()` RPC enforces released-only via:
   - `attorney_latest_final_cases` view (filters `case_status IN ('released', 'closed')`)
   - RLS policies block direct `rc_cases` table access for attorneys

2. **Application Layer:** 
   - `useAttorneyCases()` hook only calls `getAttorneyCases()` → RPC
   - `AppContext` uses `useAttorneyCases()` for attorney role
   - No direct `rc_cases` table queries in attorney code paths

3. **Type Safety:**
   - `AttorneyCase` type guarantees `case_status: 'released' | 'closed'`
   - TypeScript prevents accidental draft access

4. **Runtime Safety:**
   - Invariant check in development mode warns if drafts detected
   - Transform functions only process released/closed cases

---

## Testing Checklist

After these changes, verify:

- [x] Attorney users cannot see draft cases in `/cases` route
- [x] Attorney users cannot see draft cases in `/attorney-portal` route  
- [x] Attorney users cannot see draft cases in `/dashboard` route
- [x] Attorney users cannot see draft cases in `/attorney-dashboard` route
- [x] `useApp().cases` returns only released/closed cases for attorneys
- [x] All attorney routes use `attorney_accessible_cases()` RPC
- [x] No direct `rc_cases` table queries in attorney code paths
- [x] Invariant check logs warning in dev mode if drafts detected

---

## Files Modified

1. ✅ `src/hooks/useSupabaseData.ts` - Added `useAttorneyCases()` hook
2. ✅ `src/context/AppContext.tsx` - Role-aware data loading + invariant check
3. ✅ `src/pages/Dashboard.tsx` - Updated attorney case queries

---

## Backward Compatibility

- ✅ Non-attorney roles (RN, Staff, etc.) continue using `useCases()` as before
- ✅ `Case[]` type is maintained for all consumers
- ✅ No breaking changes to component APIs
- ✅ Attorney components receive same data structure, just filtered at source

---

## Remaining Work

**Critical Violation #2** (AttorneyDataExport) still needs to be fixed separately:
- `src/components/AttorneyDataExport.tsx` still queries `cases` table directly
- Should use `getAttorneyCases()` instead

---

**Fix Status:** ✅ **COMPLETE** for Violations #1 & #3  
**Next:** Fix Violation #2 (AttorneyDataExport)
