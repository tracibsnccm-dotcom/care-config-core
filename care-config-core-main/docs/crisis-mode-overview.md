# Reconcile C.A.R.E. — Crisis Mode Overview

This document explains the current Crisis Mode implementation for Reconcile C.A.R.E.:

- RN → Buddy → Supervisor workflow
- Crisis state machine
- Database tables
- API endpoints
- Frontend screens

This is a v1 scaffolding intended for iterative refinement.

---

## 1. Roles in Crisis Mode

### 1.1 RN (Registered Nurse)

**Primary responsibilities during Crisis Mode:**

- Identify a crisis and activate Crisis Mode from the RN Case Engine.
- Stay with the client (phone or in person).
- Maintain calm, clear, non-shaming communication.
- Avoid calling EMS directly if systems and Buddy/Supervisor are available.
- Document brief status updates during the crisis.

In the UI, the RN:

- Clicks **Enter Crisis Mode** from the RN view.
- Sees **RNCrisisScreen** with:
  - Crisis state pill (e.g., “Crisis Detected”)
  - RN role instructions
  - Buddy/Decision Owner, EMS status, Supervisor status cards
  - RN status updates textarea
- Can temporarily **Exit Crisis View** back to the normal case engine layout.

---

### 1.2 Buddy (Decision Owner)

**Primary responsibilities:**

- Complete a structured safety checklist based on:
  - RN report
  - Chart information
- Own the **EMS decision** during the crisis (unless Supervisor takes over).
- Document safety factors: weapons, children, drugs/ETOH, cooperation, etc.

In the UI, the Buddy:

- Uses **BuddyCrisisScreen**.
- Sees a tri-state checklist (Yes / No / Unknown) for:
  - Firearm present
  - Other weapons
  - Children present
  - Vulnerable person present
  - Drugs/ETOH involved
  - Immediate threat
  - Location confirmed
  - Visible injuries
  - Client cooperative
  - RN requesting EMS now
- Clicks **Save Buddy Checklist**, which:
  - Calls `/api/crisis-buddy-checklist`
  - Saves a checklist row in `crisis_checklists`
  - Logs an action in `crisis_actions_log`
  - Updates `crisis_incidents.current_state` → `buddy_active`
  - Sets `crisis_incidents.severity_level` to low / moderate / high

Decision buttons (Call EMS, Consult Supervisor, Do NOT Call EMS) are currently placeholders and will be wired in a later iteration.

---

### 1.3 Supervisor

**Primary responsibilities:**

- Review safety information and EMS decisions.
- Confirm or override EMS dispatch.
- Finalize disposition and resolution documentation.
- Close the crisis incident in the system.

In the UI, the Supervisor:

- Uses **SupervisorCrisisScreen**.
- Sees:
  - Crisis snapshot (category, subtype, severity – placeholder)
  - EMS / law enforcement status (placeholder)
  - RN & Buddy status summary (placeholder)
  - Safety snapshot (from checklist – currently described, not yet live-wired)
- Has three key actions:
  1. **Call EMS / Law Enforcement**
  2. **Override: EMS Not Needed**
  3. **Resolve Crisis**

These actions call `/api/crisis-supervisor-actions` and update `crisis_incidents` accordingly.

---

## 2. Crisis State Machine

Defined in `src/domain/crisisState.ts`.

### 2.1 States

```ts
export type CrisisState =
  | "crisis_detected"
  | "buddy_active"
  | "supervisor_review"
  | "resolution_pending"
  | "resolved";
