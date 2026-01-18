# Attorney Attestation: Idempotency and Source of Truth

## Source of truth

| Data | Table | Column(s) |
|------|--------|-----------|
| **Case number** (assigned) | `rc_cases` | `case_number` |
| **PIN / client login** | `rc_cases` | `client_pin` |
| **Confirmed / attested** | `rc_client_intakes` | `attorney_attested_at`, `intake_status` |
| **Case confirmed status** | `rc_cases` | `case_status` (e.g. `attorney_confirmed`) |

- **Original INT number** remains in `rc_client_intake_sessions.intake_id`; the Pending Intakes table shows it from there (see `PENDING_INTAKES_INT_AND_CASE_NUMBERS.md`).

## What makes the confirm action idempotent

1. **Before generating or writing anything**, the confirm handler:
   - SELECTs `rc_client_intakes` by `id` (intake id) including `attorney_attested_at`
   - SELECTs `rc_cases` by `case_id` including `case_number`, `client_pin`, `case_status`

2. **If already confirmed**, it does **not** generate or persist new values:
   - Treated as confirmed when:  
     `attorney_attested_at` is set **or**  
     (`client_pin` is set **and** `case_status = 'attorney_confirmed'`)
   - In that case it uses existing `rc_cases.case_number` and `rc_cases.client_pin`, returns them to the UI, and **skips**:
     - New PIN generation
     - `rc_cases` / `rc_client_intakes` updates
     - Audit, auto-note, and credentials email

3. **If not confirmed**, it runs the normal flow once:
   - Converts INT → attorney case number if needed
   - Generates a new PIN
   - Updates `rc_cases` and `rc_client_intakes`
   - Runs audit, auto-note, and credentials email

Re-attesting the same intake therefore always returns the **existing** case number and PIN and never creates a second PIN or case number.

## Pending queue and same source of truth

- The Pending Intakes list reads from:
  - `rc_client_intakes` (e.g. `attorney_attested_at`, `intake_status`) with a join to
  - `rc_cases` (e.g. `case_number`).
- Confirmation writes to those same tables/columns, so the queue and confirmation use the same source of truth.
- After confirm (or decline), `loadData()` is called so the list refetches and the row updates (e.g. case number, status) without a manual refresh.

## Data integrity

- `idx_rc_cases_client_pin_unique` on `rc_cases(client_pin) WHERE client_pin IS NOT NULL` prevents duplicate client PINs across cases.
