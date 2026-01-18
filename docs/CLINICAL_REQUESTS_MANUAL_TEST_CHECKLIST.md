# Clinical Requests & Updates — Manual Test Checklist

Use this checklist to verify the **Definition of DONE** for the Clinical Requests & Updates (Communications v1) workflow.

---

## Pre-requisites

- [ ] Apply migration `20260201000000_create_rc_case_requests_and_updates.sql` to your Supabase project.
- [ ] At least one case assigned to an attorney and one RN with case access.

---

## 1) Attorney can create a Case Request

- [ ] Go to `/attorney/communications`.
- [ ] Select a case from the case dropdown (no infinite loading; if no cases, “No cases assigned” is shown).
- [ ] Click **New Request**.
- [ ] Choose **Type** (e.g. Clarification, Record Gap, Timeline, Clinical Summary, Other).
- [ ] Enter **Message** (required) and optionally **Priority**, **Due date**, **Subject**.
- [ ] Click **Create Request**.
- [ ] Request appears in the Requests list with status **OPEN**, correct priority and due date when set.

---

## 2) RN can respond to a request with an Update

- [ ] As RN, open a case that has at least one OPEN request: `/cases/:caseId` or `/rn/case/:caseId/requests`.
- [ ] Find the request and expand it (or open the Requests panel on Case Detail).
- [ ] Enter text in **Add your response** and click **Post Update**.
- [ ] The update appears under the request, clearly labeled as **RN** / **You** (or “RN Response” in attorney view).

---

## 3) Attorney can view RN updates for each request

- [ ] As attorney, go to `/attorney/communications`, select the same case.
- [ ] Open the **Requests** tab and select the request that the RN responded to.
- [ ] In the **Updates** section, the RN’s reply is visible and clearly labeled as **RN Response** (or similar).

---

## 4) Request statuses: OPEN, RESPONDED, CLOSED (with timestamps)

- [ ] New requests start as **OPEN**; `created_at` is shown.
- [ ] After the first RN update, the request becomes **RESPONDED** and `responded_at` is set (visible in detail or in DB).
- [ ] **CLOSED** exists as a valid status (can be set via DB or future UI); timestamps remain correct.  
  _Optional:_ If a “Close” action is not yet in the UI, this item is satisfied if the status and `closed_at` column behave correctly when set manually.

---

## 5) All Activity shows Requests + Updates

- [ ] As attorney, go to `/attorney/communications`, select a case, open the **All Activity** tab.
- [ ] **All Activity** lists at least:
  - Request creation events (request body or summary).
  - Each Update (body or summary).
- [ ] Order is **newest first** (most recent at top).

---

## 6) No dead tabs; no infinite loading; refresh-safe

- [ ] **No dead tabs:** Only **Requests** and **All Activity** are present; no empty or disabled tabs.
- [ ] **No infinite loading:**  
  - With no case selected: message like “Select a case to view Requests & Updates.” (no spinner forever).  
  - With case selected: loading eventually shows either content or empty state.
- [ ] **Refresh-safe:** Refresh on `/attorney/communications` and on `/rn/case/:caseId/requests` (or Case Detail with Requests panel) does not cause infinite load or blank screen; data reloads as expected.

---

## RN access

- [ ] **Case Detail:** On `/cases/:caseId`, as RN, the **Clinical Requests & Updates** panel is visible and usable.
- [ ] **Standalone page:** `/rn/case/:caseId/requests` loads and shows the same requests/updates for that case; RN can post updates.

---

## Empty states

- [ ] No requests: “No requests yet” (or equivalent) in Requests list and in All Activity when applicable.
- [ ] No updates on a request: “No updates yet” (or equivalent) in the detail/updates section.

---

## Sign-off

| Criterion                               | Pass |
|-----------------------------------------|------|
| 1) Attorney creates Case Request        | [ ]  |
| 2) RN responds with Update              | [ ]  |
| 3) Attorney sees RN updates             | [ ]  |
| 4) Statuses OPEN / RESPONDED / CLOSED   | [ ]  |
| 5) All Activity = Requests + Updates    | [ ]  |
| 6) No dead tabs; no infinite load; refresh-safe | [ ]  |
