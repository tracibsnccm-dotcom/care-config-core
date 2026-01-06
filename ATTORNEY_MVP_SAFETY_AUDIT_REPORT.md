# Attorney MVP Safety Audit Report

**Date:** 2024-12-19  
**Scope:** Attorney routing, released-only data access, export/print safety, demo contamination removal  
**Status:** ⚠️ **VIOLATIONS FOUND** - Action Required

---

## Executive Summary

This audit identified **3 critical violations** where attorney routes may access draft/unreleased case data, and **2 minor demo contamination issues** in attorney paths. The database layer has proper safeguards, but several frontend data loaders bypass them.

---

## 1. Attorney Routes Inventory

### ✅ Verified Routes (All Attorney-Accessible)
- `/dashboard` - Shared dashboard
- `/attorney-portal` - Attorney landing page
- `/attorney-dashboard` - Attorney-specific dashboard
- `/attorney/settings` - Attorney settings
- `/attorney/billing` - Billing & subscriptions
- `/referrals` - Referral management
- `/rn-clinical-liaison` - RN Clinical Liaison interface
- `/cases` - Cases list view
- `/reports` - Reports view
- `/documents` - Document hub
- `/providers` - Provider management
- `/router` - Case routing

**Status:** All routes identified. No unauthorized routes found.

---

## 2. Critical Violations: Draft Data Access

### 🚨 VIOLATION #1: `useCases()` Hook Bypasses Released-Only Filter

**Location:** `src/hooks/useSupabaseData.ts:112-170`

**Issue:** The `useCases()` hook queries `rc_cases` table directly without filtering for released/closed status:

```typescript
const { data, error: fetchError } = await supabase
  .from("rc_cases")  // ❌ Direct table access
  .select(`*, rc_case_assignments!inner(user_id)`)
  .eq("rc_case_assignments.user_id", user.id)
  .order("created_at", { ascending: false });
```

**Impact:** 
- Used by `AppContext` (`src/context/AppContext.tsx:58`)
- Used by `AttorneyLanding` via `useApp()` hook
- Attorneys can see draft cases in their case lists

**Fix Required:** 
- For attorney role, use `attorney_accessible_cases()` RPC or `attorney_latest_final_cases` view
- Or add `.in('case_status', ['released', 'closed'])` filter for attorney role

**Severity:** 🔴 **CRITICAL**

---

### 🚨 VIOLATION #2: `AttorneyDataExport` Queries Cases Table Directly

**Location:** `src/components/AttorneyDataExport.tsx:48-63`

**Issue:** Export function queries `cases` table directly without released-only filter:

```typescript
const { data: cases } = await supabase
  .from('cases')  // ❌ Direct table access
  .select('*')
  .in('id', caseIds);
```

**Impact:** 
- Attorneys can export draft case data
- Violates released-only data access policy

**Fix Required:**
- Use `getAttorneyCases()` from `attorneyCaseQueries.ts` instead
- Or filter by `case_status IN ('released', 'closed')`

**Severity:** 🔴 **CRITICAL**

---

### 🚨 VIOLATION #3: `useApp()` Context Loads All Cases

**Location:** `src/context/AppContext.tsx:58, 80-105`

**Issue:** The `AppContext` uses `useCases()` which loads all cases (including drafts), then transforms them for use throughout the app:

```typescript
const { cases: supabaseCases, loading: casesLoading } = useCases();
// ... transforms to Case[] without filtering
const cases: Case[] = supabaseCases.map((c: any) => ({ ... }));
```

**Impact:**
- `AttorneyLanding` page uses `useApp().cases` which includes drafts
- Any component using `useApp()` hook can access draft data
- Violates released-only enforcement

**Fix Required:**
- Filter cases by `case_status` for attorney role in `AppContext`
- Or use role-aware data loading

**Severity:** 🔴 **CRITICAL**

---

## 3. ✅ Correctly Implemented: Released-Only Access

### ✅ `attorneyCaseQueries.ts` - Proper Implementation

**Location:** `src/lib/attorneyCaseQueries.ts`

**Status:** ✅ **CORRECT** - Uses `attorney_accessible_cases()` RPC function:

```typescript
export async function getAttorneyCases() {
  const { data, error } = await supabase.rpc('attorney_accessible_cases');
  // ✅ Uses database function that enforces released-only
}
```

**Recommendation:** All attorney data loaders should use these functions.

---

### ✅ `AttorneyPrintReportButton.tsx` - Runtime Guards

**Location:** `src/attorney/AttorneyPrintReportButton.tsx:27-38`

**Status:** ✅ **CORRECT** - Has runtime guards:

```typescript
const status = (resolvedCase.case_status || "").toLowerCase();
if (status !== "released" && status !== "closed") {
  alert("Exports are available only for released snapshots.");
  return;
}
```

**Note:** This is a runtime guard, but relies on correct data loading upstream.

---

### ✅ `buildAttorneyPrintHtml.ts` - Uses Resolved Cases

**Location:** `src/attorney/print/buildAttorneyPrintHtml.ts`

**Status:** ✅ **CORRECT** - Only accepts `CaseWithRevision` (resolved/released cases)

**Note:** Function signature enforces released-only at compile time.

---

## 4. Export/Print Safety Analysis

### ✅ Print Functions: SAFE

- `buildAttorneyPrintHtml()` - Only works with resolved cases
- `buildAttorneyPrintText()` - Only works with resolved cases  
- `AttorneyPrintReportButton` - Runtime guards prevent draft export

**Status:** ✅ **SAFE** - Print functions correctly use released snapshots only.

### 🚨 Export Function: UNSAFE

- `AttorneyDataExport.handleExport()` - Queries cases table directly (see Violation #2)

**Status:** 🚨 **UNSAFE** - Can export draft data.

---

## 5. Demo Contamination Analysis

### ⚠️ MINOR: Demo Constants in Attorney Console

**Location:** `src/attorney/AttorneyConsole.tsx:26-63`

**Issue:** Contains `DEMO_TIMELINE_EVENTS` constant:

```typescript
// TEMP: demo/sample events just so the Timeline tab shows real cards.
const DEMO_TIMELINE_EVENTS: AttorneyTimelineEvent[] = [ ... ];
```

**Impact:** Low - This is mock data for UI display, not actual case data access.

**Recommendation:** Remove or clearly mark as development-only.

**Severity:** 🟡 **MINOR**

---

### ⚠️ MINOR: Demo Shell Comment

**Location:** `src/attorney/AttorneyCaseConsole.tsx:2, 62`

**Issue:** Contains "demo shell" comments:

```typescript
// Reconcile C.A.R.E. — Attorney Case Console (demo shell)
// Demo shell only — not yet wired to live documents or tasks.
```

**Impact:** Low - Comments only, no functional impact.

**Recommendation:** Update comments to clarify MVP status.

**Severity:** 🟡 **MINOR**

---

### ✅ No DemoHub Imports Found

**Status:** ✅ **CLEAN** - No imports from `DemoHub` or `/demo` paths in attorney components.

---

## 6. Database Layer Analysis

### ✅ RLS Policies: CORRECT

**Location:** `supabase/migrations/20251206_add_case_revision_fields_and_attorney_view.sql`

**Status:** ✅ **CORRECT** - Database enforces released-only access:

1. **View Created:** `attorney_latest_final_cases` - Shows only latest released/closed cases
2. **RLS Policy:** Attorneys are explicitly blocked from direct `rc_cases` table access
3. **RPC Function:** `attorney_accessible_cases()` - Security definer function for attorneys
4. **Helper Function:** `resolve_attorney_case()` - Resolves any case ID to latest released version

**Note:** Database layer is properly secured. Frontend violations bypass these safeguards.

---

## 7. Recommendations

### Immediate Actions Required

1. **Fix `useCases()` Hook** (Violation #1)
   - Add role check: if attorney, use `attorney_accessible_cases()` RPC
   - Or filter by `case_status IN ('released', 'closed')` for attorney role

2. **Fix `AttorneyDataExport`** (Violation #2)
   - Replace direct `cases` table query with `getAttorneyCases()` from `attorneyCaseQueries.ts`
   - Or add `case_status` filter

3. **Fix `AppContext`** (Violation #3)
   - Filter cases by `case_status` for attorney role
   - Or use role-aware data loading hooks

### Optional Cleanup

4. **Remove Demo Constants** (Minor)
   - Remove or clearly mark `DEMO_TIMELINE_EVENTS` as dev-only
   - Update "demo shell" comments in `AttorneyCaseConsole.tsx`

---

## 8. Testing Checklist

After fixes are applied, verify:

- [ ] Attorney users cannot see draft cases in `/cases` route
- [ ] Attorney users cannot see draft cases in `/attorney-portal` route
- [ ] Attorney users cannot see draft cases in `/dashboard` route
- [ ] Attorney export only includes released/closed cases
- [ ] Print functions only work with released cases
- [ ] All attorney routes use `attorney_accessible_cases()` or equivalent
- [ ] No demo-related code in attorney paths

---

## 9. Summary

| Category | Status | Count |
|----------|--------|-------|
| Critical Violations | 🚨 | 3 |
| Minor Issues | ⚠️ | 2 |
| Correctly Implemented | ✅ | 3 |
| Routes Verified | ✅ | 12 |

**Overall Status:** ⚠️ **ACTION REQUIRED** - 3 critical violations must be fixed before MVP launch.

---

## 10. Files Requiring Changes

1. `src/hooks/useSupabaseData.ts` - Add released-only filter for attorney role
2. `src/components/AttorneyDataExport.tsx` - Use `getAttorneyCases()` instead of direct query
3. `src/context/AppContext.tsx` - Filter cases by status for attorney role
4. `src/attorney/AttorneyConsole.tsx` - Remove or mark demo constants (optional)
5. `src/attorney/AttorneyCaseConsole.tsx` - Update comments (optional)

---

**Report Generated:** 2024-12-19  
**Auditor:** AI Safety Check  
**Next Steps:** Fix critical violations before implementing any other changes.
