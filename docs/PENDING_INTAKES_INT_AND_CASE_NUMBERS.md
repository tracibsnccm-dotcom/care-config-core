# Pending Intakes: INT Number and Case Number

## Fields used

| Display       | Source                                                                 | Notes                                                                 |
|--------------|-------------------------------------------------------------------------|-----------------------------------------------------------------------|
| **INT Number** | `rc_client_intake_sessions.intake_id` (joined by `case_id`)             | Original identifier (e.g. `INT-YYMMDD-##X`). Fallback: `rc_cases.case_number` when it starts with `INT-`. Shown as "—" when missing. |
| **Case Number** | `rc_cases.case_number`                                                  | Shown only after attorney confirmation. Before that, the cell shows a **Pending** badge. If confirmed and `case_number` is empty, "—". |

## Summary

- **Original INT number:** `rc_client_intake_sessions.intake_id`, with fallback to `rc_cases.case_number` when it starts with `INT-` (e.g. before the case number is reassigned at attestation).
- **Assigned case number:** `rc_cases.case_number`; the table shows a "Pending" badge until the attorney has attested.
