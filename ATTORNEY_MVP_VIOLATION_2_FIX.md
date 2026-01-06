# Attorney MVP Safety Fix - Critical Violation #2

**Date:** 2024-12-19  
**Status:** ✅ **FIXED**

---

## Summary

Fixed Critical Violation #2 by replacing direct `cases` table queries in `AttorneyDataExport` with `getAttorneyCases()` and adding multiple runtime guards to ensure only released/closed cases can be exported.

---

## Changes Made

### File: `src/components/AttorneyDataExport.tsx`

#### 1. Added Released-Only Data Loading

**Before:**
```typescript
// ❌ Direct query to cases table
const { data: cases } = await supabase
  .from('cases')
  .select('*')
  .in('id', caseIds);
```

**After:**
```typescript
// ✅ Uses getAttorneyCases() which enforces released-only via RPC
const releasedCases = await getAttorneyCases();
```

**Key Changes:**
- Added `useEffect` to load released-only cases on mount via `getAttorneyCases()`
- Stores cases in state: `attorneyCases: AttorneyCase[]`
- All cases are guaranteed to be `case_status: 'released' | 'closed'`

---

#### 2. Added Runtime Guards

**Guard #1: Pre-export Validation (Line 47-50)**
```typescript
const hasOnlyReleasedCases = attorneyCases.every(
  (c) => c.case_status === "released" || c.case_status === "closed"
);
const canExportCases = hasOnlyReleasedCases && attorneyCases.length > 0;
```

**Guard #2: Export Function Guard (Line 80-84)**
```typescript
if (!canExportCases) {
  toast.error("Export available for released cases only");
  setLoading(false);
  return;
}
```

**Guard #3: Double-Check Draft Detection (Line 91-100)**
```typescript
const hasDrafts = releasedCases.some(
  (c) => c.case_status !== "released" && c.case_status !== "closed"
);

if (hasDrafts) {
  console.error("[ATTORNEY_MVP_SAFETY] ⚠️ Draft cases detected - blocking export");
  toast.error("Export available for released cases only");
  setLoading(false);
  return;
}
```

---

#### 3. Added UI Guards and Messages

**Case Option Description (Line 198-206)**
- Shows loading state: "Loading released cases..."
- Shows available count: "Released/closed cases only (X available)"
- Shows restriction: "Export available for released cases only"

**Visual Warning (Line 231-236)**
- Red alert icon and "Released only" badge when export unavailable

**Alert Message (Line 258-270)**
- Full alert box explaining restriction
- Only shown when cases option selected but export unavailable

**Button Disable Logic (Line 274-278)**
```typescript
disabled={
  loading || 
  !Object.values(exportOptions).some(v => v) ||
  (exportOptions.cases && !canExportCases)  // ✅ Blocks export if cases unavailable
}
```

---

#### 4. Export Data Transformation

**Before:** Exported raw case data (could include drafts)

**After:** Exports only released/closed cases with explicit note:
```typescript
exportData.cases = releasedCases.map((c: AttorneyCase) => ({
  // ... case fields ...
  _export_note: "This case data is from a released/closed snapshot only. Draft revisions are not included.",
}));
```

---

## Security Guarantees

### ✅ Zero Direct `rc_cases` Queries

- **Removed:** Direct `supabase.from('cases')` query
- **Replaced with:** `getAttorneyCases()` → `attorney_accessible_cases()` RPC
- **Result:** No direct table access in export code

### ✅ Draft IDs Cannot Be Exported

1. **Data Source:** `getAttorneyCases()` only returns released/closed cases
2. **Type Safety:** `AttorneyCase` type guarantees `case_status: 'released' | 'closed'`
3. **Runtime Guards:** Three layers of validation prevent draft export
4. **UI Guards:** Export button disabled if drafts detected

### ✅ Export Functions Never Accept Draft IDs

- Export only uses case IDs from `getAttorneyCases()` (released-only)
- No draft case IDs can enter the export pipeline
- All case IDs are validated before export

---

## Testing Checklist

After these changes, verify:

- [x] `AttorneyDataExport` has zero direct `rc_cases` queries
- [x] Export only uses `getAttorneyCases()` for case data
- [x] Export button disabled when no released cases available
- [x] Alert message shown when export unavailable
- [x] Export fails gracefully if drafts detected (double-check guard)
- [x] Exported JSON only contains released/closed cases
- [x] Export note included in exported case data
- [x] No draft case IDs can be exported

---

## Files Modified

1. ✅ `src/components/AttorneyDataExport.tsx` - Complete rewrite of case export logic

---

## Code Flow

```
User clicks "Export Data"
  ↓
Check canExportCases (Guard #1)
  ↓ (if false)
Show error + disable button
  ↓ (if true)
Call handleExport()
  ↓
Check canExportCases again (Guard #2)
  ↓ (if false)
Show toast error + return
  ↓ (if true)
Call getAttorneyCases() → RPC
  ↓
Double-check for drafts (Guard #3)
  ↓ (if drafts found)
Log error + show toast + return
  ↓ (if clean)
Export released cases only
```

---

## Backward Compatibility

- ✅ Export format unchanged (JSON)
- ✅ Other export options (profile, assignments, etc.) unchanged
- ✅ UI structure maintained
- ✅ Only case export logic changed

---

**Fix Status:** ✅ **COMPLETE**  
**All Critical Violations:** ✅ **FIXED** (Violations #1, #2, #3)
