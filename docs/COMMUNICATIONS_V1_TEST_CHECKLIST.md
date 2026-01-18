# Communications v1 (Clinical Requests & Updates) — Test Checklist

## 1. Database

- [ ] Apply `20260202000000_complete_communications_v1_clinical_requests.sql` (or ensure `rc_case_requests` and `rc_case_request_updates` exist with minimal RLS).

## 2. Attorney: /attorney/communications

- [ ] Page loads without **COMM-FETCH-ERROR** (uses `rc_case_assignments` / `case_assignments` and `rc_cases`).
- [ ] With a case selected and no data: **empty state** “No requests yet for this case.” and **Create Request** CTA.
- [ ] **Create Request**: type, priority, body → insert into `rc_case_requests`; new request appears in the list.
- [ ] **Requests** tab: list and detail work; no infinite loading; no dead tabs.
- [ ] **All Activity** tab: empty state when no data; after creating a request, the request appears; after an RN update, both request and update appear (newest first).

## 3. RN response

- [ ] RN can open requests for a case (e.g. Case Detail “Clinical Requests & Updates” or `/rn/case/:caseId/requests`).
- [ ] **Post Update** inserts into `rc_case_request_updates` and sets `rc_case_requests.status = 'RESPONDED'` and `responded_at` when the request was OPEN.

## 4. Edge cases

- [ ] Empty result from `rc_case_requests` (200 `[]`) does **not** show COMM-FETCH-ERROR.
- [ ] Refresh and switching cases do not cause infinite loading or dead tabs.
