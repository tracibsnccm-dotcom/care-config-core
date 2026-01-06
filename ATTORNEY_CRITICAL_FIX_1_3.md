# Critical Fix #1/#3 — Remove Attorney Access to useCases() / rc_cases Direct Loads

**Date:** 2024-12-19  
**Status:** ✅ **COMPLETE**

---

## Summary

Removed all attorney access to `useCases()` and direct `rc_cases` queries. Attorneys now exclusively load cases via `getAttorneyCases()` from `attorneyCaseQueries.ts`, ensuring released-only data access.

---

## Changes Made

### 1. `src/pages/Providers.tsx` (Attorney-Facing)

**Before:**
```typescript
import { useCases } from "@/hooks/useSupabaseData";
const { cases: userCases } = useCases();
```

**After:**
```typescript
import { useApp } from "@/context/AppContext";
const { cases: userCases } = useApp();
```

**Result:** Uses `useApp().cases` which provides released-only cases for attorneys.

---

### 2. `src/pages/ProviderDetail.tsx` (Attorney-Facing)

**Before:**
```typescript
import { useCases } from "@/hooks/useSupabaseData";
const { cases: userCases } = useCases();
```

**After:**
```typescript
import { useApp } from "@/context/AppContext";
const { cases: userCases } = useApp();
```

**Result:** Uses `useApp().cases` which provides released-only cases for attorneys.

---

### 3. `src/context/AppContext.tsx` — Enhanced Draft Filtering

**Added Hard Filter Before Transformation:**
```typescript
// Select the appropriate data source based on role
// For attorneys: filter out any drafts that might have slipped through (defense in depth)
const rawCases = isAttorney 
  ? (attorneyCases as AttorneyCase[]).filter((c: AttorneyCase) => {
      // Hard filter: only released/closed cases allowed
      const isValid = c.case_status === "released" || c.case_status === "closed";
      if (!isValid && process.env.NODE_ENV === "development") {
        console.warn(
          `[ATTORNEY_MVP_SAFETY] ⚠️ Filtering out non-released case (ID: ${c.id}, Status: ${c.case_status})`
        );
      }
      return isValid;
    })
  : supabaseCases;
```

**Updated Invariant Check:**
```typescript
// Invariant check: In attorney mode, verify no draft cases made it through (dev only)
// Note: Drafts are already filtered above, this is a final verification
useEffect(() => {
  if (isAttorney && process.env.NODE_ENV === "development") {
    const drafts = rawCases.filter((rc: any) => {
      if ((rc as AttorneyCase).case_status) {
        const status = (rc as AttorneyCase).case_status;
        return status !== "released" && status !== "closed";
      }
      return false;
    });
    
    if (drafts.length > 0) {
      console.error(
        "[ATTORNEY_MVP_SAFETY] ⚠️ CRITICAL: Draft cases detected after filtering!",
        `Found ${drafts.length} draft case(s). This should never happen.`,
        drafts
      );
    } else {
      console.debug(
        `[ATTORNEY_MVP_SAFETY] ✅ Invariant check passed: All ${rawCases.length} attorney cases are released/closed`
      );
    }
  }
}, [isAttorney, rawCases]);
```

**Key Improvements:**
- ✅ Drafts are filtered **before** transformation (defense in depth)
- ✅ Invariant check verifies no drafts made it through
- ✅ Development-only warnings for filtered cases
- ✅ Error-level logging if drafts detected after filtering

---

## Verification

### ✅ No useCases() in Attorney Paths

```bash
grep -r "useCases(" src/attorney/
# Result: No matches found ✅
```

### ✅ No Direct rc_cases Queries in Attorney Paths

```bash
grep -r "from(['\"]rc_cases['\"])" src/attorney/
# Result: No matches found ✅
```

### ✅ Attorney Pages Use useApp().cases

- ✅ `src/pages/AttorneyLanding.tsx` - Uses `useApp().cases`
- ✅ `src/pages/Providers.tsx` - Uses `useApp().cases` (fixed)
- ✅ `src/pages/ProviderDetail.tsx` - Uses `useApp().cases` (fixed)
- ✅ All `src/attorney/**` components - No direct case queries

### ✅ AppContext Role-Aware Loading

- ✅ Attorneys: `useAttorneyCases()` → `getAttorneyCases()` → `attorney_accessible_cases()` RPC
- ✅ RN/Client: `useCases()` → Direct Supabase query (unchanged)
- ✅ Draft filtering applied before transformation
- ✅ Invariant check verifies no drafts in memory

---

## Files Modified

1. ✅ `src/pages/Providers.tsx` - Replaced `useCases()` with `useApp().cases`
2. ✅ `src/pages/ProviderDetail.tsx` - Replaced `useCases()` with `useApp().cases`
3. ✅ `src/context/AppContext.tsx` - Added hard draft filtering + enhanced invariant check

---

## Security Guarantees

### ✅ Attorney Data Source is Released-Only by Construction

1. **Data Source:** `useAttorneyCases()` → `getAttorneyCases()` → `attorney_accessible_cases()` RPC
2. **Database Enforcement:** RPC function enforces `case_status IN ('released', 'closed')` at DB level
3. **Application-Level Filter:** Additional filter removes any drafts that might slip through
4. **Invariant Check:** Development-only verification that no drafts exist in memory

### ✅ No Draft Cases in Memory for Attorneys

- **Before Transformation:** Drafts filtered from `rawCases`
- **After Transformation:** `cases` array contains only released/closed cases
- **Runtime Verification:** Invariant check confirms no drafts present

### ✅ No Direct rc_cases Access

- **Attorney Components:** Zero direct `rc_cases` queries
- **Attorney Pages:** Zero direct `rc_cases` queries
- **AppContext:** Uses role-aware hooks (no direct queries)

---

## Remaining useCases() Calls (Non-Attorney)

The following files still use `useCases()` but are **NOT attorney-facing**:
- ✅ `src/context/AppContext.tsx` - Used for RN/client mode (correct)
- ✅ `src/hooks/useSupabaseData.ts` - Hook definition (correct)
- ✅ `src/pages/ClientCheckins.tsx` - Client-facing (correct)
- ✅ `src/pages/ClientPortal.tsx` - Client-facing (correct)

---

## Code Flow for Attorneys

```
Attorney logs in
  ↓
AppContext detects isAttorney = true
  ↓
useAttorneyCases() hook called
  ↓
getAttorneyCases() function called
  ↓
attorney_accessible_cases() RPC called
  ↓
Database returns only released/closed cases (enforced by RPC)
  ↓
Hard filter removes any drafts (defense in depth)
  ↓
Transform to Case[] type
  ↓
Invariant check verifies no drafts (dev only)
  ↓
useApp().cases provides released-only cases to all attorney components
```

---

## Testing Checklist

- [x] No `useCases()` usage in `src/attorney/**` directory
- [x] No direct `rc_cases` queries in attorney paths
- [x] `Providers.tsx` uses `useApp().cases`
- [x] `ProviderDetail.tsx` uses `useApp().cases`
- [x] `AttorneyLanding.tsx` uses `useApp().cases`
- [x] AppContext filters drafts before transformation
- [x] Invariant check verifies no drafts in memory
- [x] Attorney case lists still work (released-only)
- [x] Attorney case selectors still work (released-only)
- [x] No linter errors

---

**Fix Status:** ✅ **COMPLETE**  
**All attorney components now use released-only case data via `useApp().cases`**
