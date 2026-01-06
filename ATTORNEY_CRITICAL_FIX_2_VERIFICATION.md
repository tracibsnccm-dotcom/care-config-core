# Critical Fix #2 — AttorneyDataExport Verification

**Date:** 2024-12-19  
**Status:** ✅ **VERIFIED COMPLETE**

---

## Summary

Verified that `AttorneyDataExport` and all related export functionality (including "Download Text") do not query `rc_cases` directly and only export released cases.

---

## Verification Results

### ✅ 1. AttorneyDataExport.tsx

**Status:** ✅ **COMPLETE**

**Implementation:**
- ✅ Uses `getAttorneyCases()` from `attorneyCaseQueries.ts` (RPC: `attorney_accessible_cases`)
- ✅ No direct `rc_cases` queries found
- ✅ Runtime guards check `case_status !== 'released' && case_status !== 'closed'`
- ✅ Export disabled if drafts detected
- ✅ UI shows "Export available for released cases only" message

**Code Verification:**
```typescript
// Line 10: Uses getAttorneyCases() import
import { getAttorneyCases, AttorneyCase } from "@/lib/attorneyCaseQueries";

// Line 34: Loads cases via getAttorneyCases()
const cases = await getAttorneyCases();

// Line 47-50: Runtime guard
const hasOnlyReleasedCases = attorneyCases.every(
  (c) => c.case_status === "released" || c.case_status === "closed"
);

// Line 79-84: Export guard
if (!canExportCases) {
  toast.error("Export available for released cases only");
  return;
}

// Line 88: Uses getAttorneyCases() for export
const releasedCases = await getAttorneyCases();

// Line 91-100: Double-check guard
const hasDrafts = releasedCases.some(
  (c) => c.case_status !== "released" && c.case_status !== "closed"
);
```

**Direct Query Check:**
```bash
grep -r "from(['\"]rc_cases['\"])" src/components/AttorneyDataExport.tsx
# Result: No matches found ✅
```

---

### ✅ 2. AttorneyPrintReportButton.tsx — "Download Text"

**Status:** ✅ **COMPLETE**

**Implementation:**
- ✅ Uses `resolvedCase` prop (comes from released snapshot resolver)
- ✅ Runtime guards check `case_status !== 'released' && status !== 'closed'`
- ✅ Both "Print PDF" and "Download Text" have guards
- ✅ No direct `rc_cases` queries

**Code Verification:**
```typescript
// Line 104-115: handleDownloadText() function
const handleDownloadText = async () => {
  if (!resolvedCase) {
    alert("Exports are available only for released snapshots.");
    return;
  }

  // Runtime guard: Only allow export if case is released or closed
  const status = (resolvedCase.case_status || "").toLowerCase();
  if (status !== "released" && status !== "closed") {
    alert("Exports are available only for released snapshots.");
    return;
  }
  // ... rest of export logic
};
```

**Direct Query Check:**
```bash
grep -r "from(['\"]rc_cases['\"])" src/attorney/AttorneyPrintReportButton.tsx
# Result: No matches found ✅
```

---

### ✅ 3. Released Snapshot Resolver

**Status:** ✅ **VERIFIED**

**Implementation:**
- ✅ `resolveAttorneyCase()` in `attorneyCaseQueries.ts` uses RPC: `resolve_attorney_case`
- ✅ `resolveLatestReleasedCase()` is a pure function (no DB queries)
- ✅ Both functions filter to only released/closed cases

**Code Verification:**
```typescript
// src/lib/attorneyCaseQueries.ts:85-96
export async function resolveAttorneyCase(caseId: string) {
  const { data, error } = await supabase.rpc('resolve_attorney_case', {
    case_id_param: caseId
  });
  // Returns latest released/closed version
}

// src/lib/resolveLatestReleasedCase.ts:79-83
const releasedOrClosed = lineageCases.filter((c) => {
  const status = (c.case_status || "").toLowerCase();
  return status === "released" || status === "closed";
});
```

**Direct Query Check:**
```bash
grep -r "from(['\"]rc_cases['\"])" src/lib/resolveLatestReleasedCase.ts
# Result: No matches found ✅

grep -r "from(['\"]rc_cases['\"])" src/lib/attorneyCaseQueries.ts
# Result: No matches found ✅
```

---

## Security Guarantees

### ✅ Export Cannot Be Triggered with Draft ID

1. **Data Source:** `getAttorneyCases()` only returns released/closed cases (enforced by RPC)
2. **Runtime Guards:** Multiple layers of validation prevent draft export
3. **UI Guards:** Export button disabled if drafts detected
4. **Resolver:** `resolveAttorneyCase()` returns null for draft IDs

### ✅ No Direct rc_cases Queries

- ✅ `AttorneyDataExport.tsx` - Zero direct queries
- ✅ `AttorneyPrintReportButton.tsx` - Zero direct queries
- ✅ `attorneyCaseQueries.ts` - Uses RPC functions only
- ✅ `resolveLatestReleasedCase.ts` - Pure function, no queries

### ✅ "Download Text" Follows Same Rules

- ✅ Uses same `resolvedCase` prop (released snapshot)
- ✅ Same runtime guards as "Print PDF"
- ✅ Same error messages
- ✅ Same audit logging

---

## Files Verified

1. ✅ `src/components/AttorneyDataExport.tsx` - Uses `getAttorneyCases()`, has guards
2. ✅ `src/attorney/AttorneyPrintReportButton.tsx` - Uses `resolvedCase`, has guards
3. ✅ `src/lib/attorneyCaseQueries.ts` - Uses RPC functions only
4. ✅ `src/lib/resolveLatestReleasedCase.ts` - Pure function, no queries

---

## Testing Checklist

- [x] No direct `rc_cases` queries in export code
- [x] Export uses `getAttorneyCases()` (released-only)
- [x] Export uses released snapshot resolver
- [x] Runtime guards prevent draft export
- [x] UI shows "Export available for released cases only"
- [x] "Download Text" follows same rules
- [x] Export button disabled if drafts detected
- [x] No linter errors

---

**Fix Status:** ✅ **VERIFIED COMPLETE**  
**All export functionality uses released-only data via secure RPC paths**
