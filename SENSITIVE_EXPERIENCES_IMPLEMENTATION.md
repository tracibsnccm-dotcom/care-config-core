# Sensitive Experiences Section - Complete Implementation

## ✅ All Features Implemented

### 1. **Bulk Clear Button**
- Added "Clear All" button visible when selections exist
- Properly marks all items as `selected: false` in database
- Confirmation dialog prevents accidental clearing
- Location: Top right of section, next to edit history

### 2. **Export Verification - Disclosure Scope Filtering**
**New Files Created:**
- `src/lib/sensitiveDataExport.ts` - Export filtering logic
- `src/components/SensitiveDataAuditView.tsx` - RN audit view component

**Disclosure Scope Levels:**
- `internal`: Only RN CM, Staff, Compliance can view
- `minimal`: Internal + Attorney (limited details, respects consent)
- `full`: All authorized parties see full details

**Export Filtering Rules:**
- **Attorneys**: Only see items where `consent_attorney = 'share'`
- **Attorneys**: Free text is redacted unless consent given
- **Internal roles**: See all data regardless of scope
- **PDF exports**: Automatically filter based on viewer role

**Updated Files:**
- `src/lib/pdfCaseSummary.ts` - Now includes `getSensitiveDataSummaryForPDF()`
- Adds `viewerRole` parameter to filter sensitive data in exports

### 3. **RN Audit View - Consent History**
**Component:** `SensitiveDataAuditView.tsx`

**Features:**
- Shows all active disclosures with risk levels
- Displays consent status with timestamps
- Shows who reported each item and when
- Tracks edit history (deselected items)
- Color-coded risk badges (RED, ORANGE, YELLOW)
- Restricted to RN CM access only

**Usage:**
```tsx
import { SensitiveDataAuditView } from "@/components/SensitiveDataAuditView";

// In case detail view for RN CMs:
<SensitiveDataAuditView caseId={caseId} />
```

### 4. **RN Alert Notification Flow - VERIFIED**
**Edge Function:** `supabase/functions/notify-rn-alert/index.ts`

**Flow:**
1. Client selects RED/ORANGE risk item (e.g., self-harm, suicide thoughts)
2. `saveSensitiveDisclosure()` detects risk level
3. Creates `case_alerts` record with `disclosure_scope: 'internal'`
4. Invokes `notify-rn-alert` edge function
5. Edge function:
   - Fetches case details
   - Finds all RN CMs assigned to case
   - Creates notification records in `notifications` table
   - For RED alerts, logs immediate action needed
   - Future: Email integration placeholder ready

**Notification Structure:**
```typescript
{
  user_id: rn_cm_user_id,
  type: 'critical_alert' | 'high_alert',
  title: 'RED Safety Alert - Case [ID]',
  message: 'Client disclosed [item]. Immediate RN CM review required.',
  metadata: {
    case_id: caseId,
    item_code: itemCode,
    risk_level: riskLevel,
    requires_immediate_action: true
  },
  read: false
}
```

**Verified Components:**
✅ Notifications table exists and properly structured
✅ Edge function deployed and ready
✅ RLS policies allow RN CMs to view notifications
✅ Alert creation working in `sensitiveDisclosuresHelper.ts`

---

## Complete Feature List

### Critical Features ✅
1. ✅ Load existing data on mount
2. ✅ Save consent immediately on change
3. ✅ Connect BH screening to disclosures
4. ✅ Real-time save on checkbox toggle
5. ✅ Debounced auto-save for text (1.5s)
6. ✅ Skip section with database wiring
7. ✅ RLS policies verified and secure

### Mobile UX ✅
8. ✅ Bottom sheets instead of popovers (<768px)
9. ✅ 48px minimum touch targets
10. ✅ 20px checkboxes on mobile
11. ✅ Mobile keyboard optimization
12. ✅ Smooth slide-up animations

### User Experience ✅
13. ✅ Loading indicators
14. ✅ Saving indicators with spinner
15. ✅ Auto-save confirmation (✓ Saved)
16. ✅ Error recovery with retry button
17. ✅ Summary section showing selections
18. ✅ Input validation (XSS prevention, length limits)
19. ✅ Navigation blocking if consent not provided
20. ✅ Consent revocation dialog
21. ✅ Edit history display (last 5 changes)
22. ✅ Character counter (250 max)
23. ✅ Empty state with helpful messaging

### Security & Compliance ✅
24. ✅ Data integrity (marks deselected, doesn't delete)
25. ✅ Disclosure scope filtering for exports
26. ✅ RN notification system for RED/ORANGE alerts
27. ✅ Audit trail for all changes
28. ✅ Consent tracking with timestamps
29. ✅ Role-based data access control

### Advanced Features ✅
30. ✅ **Bulk clear button** - Quick clear all selections
31. ✅ **Export verification** - Respects disclosure_scope
32. ✅ **RN audit view** - Complete consent history
33. ✅ **Verified alert flow** - Notifications working

---

## How to Use

### For Clients (Intake):
1. Select applicable experiences from 3 categories
2. Provide optional additional details
3. Set consent preferences for attorney/providers
4. Section auto-saves every change
5. Can skip entire section if desired
6. Can clear all selections with "Clear All" button

### For RN Case Managers:
1. View client selections in case detail
2. See `SensitiveDataAuditView` component for full audit trail
3. Receive immediate notifications for RED/ORANGE risk items
4. Access complete disclosure history with consent status
5. Review who reported what and when

### For Attorneys:
1. Only see items where client granted consent
2. PDF exports automatically filter based on consent
3. Sensitive details redacted unless explicit consent given
4. Cannot access internal clinical notes

### For Exports:
```typescript
// PDF generation now includes filtered sensitive data
await generateCaseSummaryPDF({
  caseId,
  clientLabel,
  status,
  attyRef,
  timeline,
  reports,
  followUps,
  messagesSummary,
  viewerRole: 'ATTORNEY' // Automatically filters based on role
});
```

---

## Risk Level Definitions

### 🔴 RED (Critical)
- Self-harm
- Suicide thoughts
- Suicidal ideation
→ **Immediate RN notification + Critical alert**

### 🟠 ORANGE (High)
- Domestic/intimate partner violence
- Sexual assault/exploitation
- Active substance misuse
- Substance withdrawal
- Current abuse/stalking
→ **Immediate RN notification + High alert**

### 🟡 YELLOW (Monitor)
- Past substance issues
- Past trauma (resolved)
- Non-critical stressors
→ **Case flag, no immediate alert**

---

## Testing Checklist

- [x] Mobile responsive (test phone/tablet views)
- [x] Touch targets adequate size
- [x] Auto-save working (1.5s after typing stops)
- [x] Consent blocking navigation
- [x] Skip section persists state
- [x] Bulk clear works correctly
- [x] RN notifications created for RED/ORANGE
- [x] Export filters respect disclosure_scope
- [x] Audit view shows complete history
- [x] Error handling with retry
- [x] Accessibility (ARIA labels, keyboard nav)

---

## Security Notes

⚠️ **CRITICAL:** 
- Never expose sensitive data without proper consent
- Always check `disclosure_scope` before sharing with attorneys
- RN notifications only go to assigned case managers
- Audit trail tracks all access and modifications
- PDF exports automatically filter based on viewer role

## Future Enhancements (Optional)

- [ ] Email notifications for RED alerts (placeholder ready)
- [ ] Automated follow-up reminders for unacknowledged alerts
- [ ] Analytics dashboard for RN CMs (disclosure trends)
- [ ] Client portal view (limited, consent-controlled)
- [ ] Integration with crisis hotline services
