# Reconcile C.A.R.E. — RCMS Smoke Test Checklist (Dec 31 Trial)

Use this as the quick script to verify the RCMS shell and core flows are working
before any live demos or attorney testing. This is **not** a full UAT script —
it’s a “does the house have power, running water, and doors that open/close”
check.

---

## 1) Environment / Build

1. Open the Codespace for `care-config-core`.
2. In the terminal, run:

   ```bash
   npm run build
