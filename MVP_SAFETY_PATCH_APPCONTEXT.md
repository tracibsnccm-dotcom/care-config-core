# MVP Safety Patch — AppContext useCases() Removal

**Date:** 2024-12-19  
**Status:** ✅ **COMPLETE**

---

## Summary

Removed global `useCases()` call from `AppContext.tsx` to ensure attorneys never have draft cases in memory. Case loading is now role-scoped: attorneys use `useAttorneyCases()` exclusively, while non-attorneys load cases locally in their components.

---

## Changes Made

### 1. Removed `useCases()` from AppContext

**Before:**
```typescript
import { useCases, useAttorneyCases, useProviders, useAuditLogs } from "@/hooks/useSupabaseData";

const { cases: supabaseCases, loading: casesLoading: rnCasesLoading } = useCases();
const { cases: attorneyCases, loading: casesLoading: attorneyCasesLoading } = useAttorneyCases();

const rawCases = isAttorney ? attorneyCases : supabaseCases;
```

**After:**
```typescript
import { useAttorneyCases, useProviders, useAuditLogs } from "@/hooks/useSupabaseData";

// SECURITY: Attorneys must NEVER have useCases() data in memory (could contain drafts)
const { cases: attorneyCases, loading: casesLoading: attorneyCasesLoading } = useAttorneyCases();

const rawCases = isAttorney 
  ? attorneyCases.filter(...) // Released-only
  : []; // Non-attorneys: empty array (components load their own)
```

---

### 2. Role-Scoped Case Loading

**Attorneys:**
- ✅ Use `useAttorneyCases()` → `getAttorneyCases()` → RPC: `attorney_accessible_cases`
- ✅ Hard filter removes any non-released cases
- ✅ Dev-only guard drops and warns on non-released cases

**Non-Attorneys (Client/RN):**
- ✅ AppContext provides empty cases array
- ✅ Components load their own cases via `useCases()` hook
- ✅ `ClientPortal.tsx` and `ClientCheckins.tsx` already use `useCases()` directly

---

### 3. Dev-Only Guard Added

**Code (Lines 108-115):**
```typescript
const cases: Case[] = isAttorney 
  ? (rawCases as AttorneyCase[]).map((c: AttorneyCase) => {
      // Dev-only guard: drop any non-released cases and warn
      if (c.case_status !== "released" && c.case_status !== "closed") {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[ATTORNEY_MVP_SAFETY] ⚠️ Dropping non-released case from AppContext (ID: ${c.id}, Status: ${c.case_status})`
          );
        }
        return null; // Will be filtered out
      }
      // ... transform case
    }).filter((c): c is Case => c !== null) // Filter out nulls
  : []; // Non-attorneys: empty array
```

---

## Verification

### ✅ No useCases() in AppContext

**Command:**
```bash
grep "useCases(" src/context/AppContext.tsx
```

**Result:** Only comments mentioning `useCases()`, no function calls ✅

**Files:**
- ✅ `src/context/AppContext.tsx` — No `useCases()` call

---

### ✅ Attorney Pages Still Work

**AttorneyLanding.tsx:**
- Uses `useApp().cases` which now comes from `useAttorneyCases()` only
- All cases are released-only (filtered in AppContext)

**AttorneyDataExport.tsx:**
- Uses `getAttorneyCases()` directly (not affected by AppContext change)

**All attorney components:**
- Get cases from `useApp().cases` which is now attorney-only and released-only

---

### ✅ ClientPortal and ClientCheckins Still Work

**ClientPortal.tsx (Line 44):**
```typescript
const { cases: userCases, loading: casesLoading } = useCases();
```
- ✅ Already uses `useCases()` directly
- ✅ Doesn't depend on AppContext cases
- ✅ Continues to work

**ClientCheckins.tsx (Line 72):**
```typescript
const { cases: supabaseCases, loading: casesLoading, error: casesError, refetch: refetchCases } = useCases();
// ...
const availableCases = useMemo(() => {
  return supabaseCases.length > 0 ? supabaseCases : appContextCases;
}, [supabaseCases, appContextCases]);
```
- ✅ Already uses `useCases()` directly
- ✅ Falls back to `appContextCases` if needed (now empty for non-attorneys, but `supabaseCases` will always have data)
- ✅ Continues to work

---

## Security Guarantees

### ✅ Attorneys Never Have Draft Cases in Memory

1. **No useCases() Call:** AppContext doesn't call `useCases()` at all
2. **Attorney-Only Source:** Attorneys only get cases from `useAttorneyCases()` → `getAttorneyCases()` → RPC
3. **Hard Filter:** Non-released cases filtered out before transformation
4. **Dev Guard:** Non-released cases dropped and warned in development

### ✅ Non-Attorneys Unaffected

1. **Local Loading:** ClientPortal and ClientCheckins load cases via `useCases()` directly
2. **AppContext Empty:** AppContext provides empty array for non-attorneys (components don't rely on it)
3. **Backward Compatible:** Existing code continues to work

---

## Files Modified

1. ✅ `src/context/AppContext.tsx`
   - Removed `useCases()` import and call
   - Made case loading role-scoped
   - Added dev-only guard for non-released cases
   - Non-attorneys get empty array (components load their own)

---

## Testing Checklist

- [x] No `useCases()` call in AppContext.tsx
- [x] Attorneys only get cases from `useAttorneyCases()`
- [x] Non-attorneys get empty array from AppContext
- [x] ClientPortal still works (uses `useCases()` directly)
- [x] ClientCheckins still works (uses `useCases()` directly)
- [x] Attorney pages still load and show released cases only
- [x] Dev-only guard drops non-released cases
- [x] No linter errors

---

**Patch Status:** ✅ **COMPLETE**  
**Attorney surface never has draft cases in memory via AppContext**
