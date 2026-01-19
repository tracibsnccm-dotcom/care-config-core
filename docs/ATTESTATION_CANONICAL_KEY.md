# Attestation: Canonical Intake Key and Authoritative rc_cases Fields

## Canonical intake key

- **`original_int_number`** (text) on `rc_cases`: INT-YYMMDD-##X from `rc_client_intake_sessions.intake_id`. This is the canonical key for “one intake = one rc_cases.”
- **Lookup by intake (UI)**: `rc_client_intakes.id` (intake_id) → `rc_client_intakes.case_id` → `rc_cases.id`. For attestation we use `intake.case_id`; after cleanup, that points at the canonical (non‑superseded) `rc_cases` row.

## rc_cases fields that are authoritative

| Field | Authority | Notes |
|-------|-----------|-------|
| `case_number` | rc_cases | Assigned at intake (INT-…), then replaced at attestation (e.g. BG04-YYMMDD-##X). Source of truth. |
| `client_pin` | rc_cases | Set only at attorney attestation. Source of truth. |
| `case_status` | rc_cases | `intake_pending` until attestation; `attorney_confirmed` after. Used with `case_number` for Pending Intakes. |
| `original_int_number` | rc_cases | Set at intake, never changed. Used to find/reuse the single rc_cases row per intake; UNIQUE (when not superseded). |

## Idempotent behavior

- **IntakeWizard**: Before inserting `rc_cases`, SELECT by `original_int_number`. If found, reuse that row and skip INSERT. If an `rc_client_intakes` for that case is already `submitted_pending_attorney` or `attorney_confirmed`, treat as “Already submitted” and return.
- **AttorneyAttestationCard (Pending Intakes View/Attest)**: Only SELECT and UPDATE on `rc_cases`; no INSERT. Confirm is idempotent because it updates `rc_cases` by `id = caseId` (the selected table row) and reuses existing `client_pin` and `case_number` when `client_pin` is not null or `case_status = 'attorney_confirmed'`. Re‑attesting returns the same `client_pin` and `case_number`.

## DB guardrail

- `idx_rc_cases_original_int_number_unique` on `rc_cases(original_int_number) WHERE original_int_number IS NOT NULL AND superseded_by_case_id IS NULL` prevents more than one non‑superseded `rc_cases` per intake at the DB level.

## Superseded rows

- `rc_cases.superseded_by_case_id`: when set, this row is a duplicate; the authoritative case is `superseded_by_case_id`. Migration repoints `rc_client_intakes.case_id` and `rc_client_intake_sessions.case_id` to the canonical. Do not use superseded rows in business logic.
