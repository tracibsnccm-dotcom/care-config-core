# COMM-NO-CASES: Premium CTA and Gated Case Selector

## Where case selection is stored

- **Assigned cases**: Fetched from `rc_case_assignments` / `case_assignments` and `rc_cases`; the chosen case is kept in component state `selectedCaseId` only.
- **Fallback (testing)**: When the attorney has **0 assigned cases** and picks a case from the “Select a case (for testing)” list, that choice is stored in **localStorage** under:
  - **Key:** `rcms_attorney_comm_fallback_case_id`
  - **Value:** the `rc_cases.id` (UUID) of the selected case.

  On later loads, if there are still 0 assigned cases, the component restores that id from localStorage, fetches that one `rc_cases` row, sets `cases = [that case]` and `selectedCaseId`, and shows the normal communications UI. If the case no longer exists or the fetch fails, the key is removed from localStorage.

  When the user later has at least one assigned case, `fetchCases` clears `rcms_attorney_comm_fallback_case_id` so the fallback choice is not reused.

## How the fallback list is gated

The “Select a case (for testing)” block is shown only when:

```ts
const allowUnassignedCaseSelect =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === "true";
```

- **`import.meta.env.DEV`**: `true` in Vite dev (`npm run dev`), `false` in production builds.
- **`VITE_ENABLE_DEMO === "true"`**: enables the fallback in production when the app is built/run with `VITE_ENABLE_DEMO=true`.

In production, with `VITE_ENABLE_DEMO` unset or not `"true"`, the fallback selector is **hidden**; only the COMM-NO-CASES message, the explanation, and the “View Pending Intakes” CTA are shown.

---

## Manual test checklist

- [ ] **Attorney with 0 assigned cases sees COMM-NO-CASES + link to pending intakes**  
  - Go to `/attorney/communications` as an attorney with no case assignments.  
  - You see: “No cases assigned to you yet. (COMM-NO-CASES)”, “You don’t have any cases assigned yet.”, and a **View Pending Intakes** button linking to `/attorney/pending-intakes`.  
  - The fallback “Select a case (for testing)” block is **not** visible in production when `VITE_ENABLE_DEMO` is not `"true"`.

- [ ] **In demo/dev mode, attorney can select a case and communications loads**  
  - Run in dev (`npm run dev`) or with `VITE_ENABLE_DEMO=true`.  
  - As an attorney with 0 assigned cases, go to `/attorney/communications`.  
  - The “Select a case (for testing)” section is visible.  
  - Pick a case from the dropdown.  
  - The main communications UI (case selector, Requests, All Activity) appears and loads requests/updates for that case.  
  - Refresh: the same case is restored from `rcms_attorney_comm_fallback_case_id` and communications load again.

- [ ] **In production mode, the fallback selection is hidden unless enabled**  
  - Production build without `VITE_ENABLE_DEMO` (or `VITE_ENABLE_DEMO` not `"true"`):  
    - With 0 assigned cases, only COMM-NO-CASES, the explanation, and “View Pending Intakes” are shown; no “Select a case” dropdown.  
  - Production build (or run) with `VITE_ENABLE_DEMO=true`:  
    - With 0 assigned cases, the “Select a case (for testing)” block is shown and works as in dev.
