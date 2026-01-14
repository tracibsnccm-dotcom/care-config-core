# CLIENT PORTAL ROUTING UPDATES

## Add These Routes to main.tsx

Add these imports at the top:

```tsx
import ClientPortalDashboard from "./screens/client/ClientPortalDashboard";
import ClientCheckinScreen from "./screens/client/ClientCheckinScreen";
import MedicationReconciliationScreen from "./screens/client/MedicationReconciliationScreen";
```

Add these routes inside the `<Routes>` section:

```tsx
{/* Client Portal Routes */}
<Route path="/client-portal" element={<ClientPortalDashboard />} />
<Route path="/client-checkin" element={<ClientCheckinScreen />} />
<Route path="/client-medrec" element={<MedicationReconciliationScreen />} />
<Route path="/client-sdoh" element={<ClientSDOHScreen />} /> {/* If you have one */}
```

## URL Parameters

The client check-in and med rec screens accept URL parameters:

### For Routine Check-ins:
```
/client-checkin?type=check_in
/client-medrec?type=check_in
```

### For Care Plan Reviews:
```
/client-checkin?type=case_review&care_plan_id=<uuid>
/client-medrec?type=case_review&care_plan_id=<uuid>
```

## File Placement

| File | Location |
|------|----------|
| ClientPortalDashboard.tsx | src/screens/client/ClientPortalDashboard.tsx |
| ClientCheckinScreen.tsx | src/screens/client/ClientCheckinScreen.tsx |
| MedicationReconciliationScreen.tsx | src/screens/client/MedicationReconciliationScreen.tsx |

## RN Portal Route for Initiate Follow-Up

Add to main.tsx:

```tsx
import InitiateFollowUpScreen from "./screens/rn/InitiateFollowUpScreen";

// Inside Routes
<Route path="/rn/case/:caseId/follow-up" element={
  <AuthProvider><AppProvider><InitiateFollowUpScreen /></AppProvider></AuthProvider>
} />
```

## Add Button to RN Dashboard

In the RN case list (PendingCasesSection or similar), add a button to initiate follow-up:

```tsx
<button
  onClick={() => {
    localStorage.setItem("rcms_active_case_id", caseId);
    window.location.href = `/rn/case/${caseId}/follow-up`;
  }}
>
  Initiate Follow-up
</button>
```

## Navigation Flow

```
RN Dashboard
    ↓
[Initiate Follow-up] button
    ↓
InitiateFollowUpScreen
    ↓ (Creates care plan, sends notifications)
    ↓
Client receives: Portal message + Email + SMS
    ↓
Client logs into ClientPortalDashboard
    ↓
Sees "Case Review Required" banner with tasks
    ↓
Completes: 4Ps → SDOH → Med Rec
    ↓
RN can now develop care plan with client's data
```
