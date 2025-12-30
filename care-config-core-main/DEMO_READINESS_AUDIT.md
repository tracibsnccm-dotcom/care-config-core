# Demo Readiness Audit - Jan 15, 2025

## Executive Summary
This audit identifies issues that must be addressed before the Jan 15 demo. Issues are categorized by severity and include specific file locations and recommended fixes.

---

## 1. Broken Routes or 404s

### Issue 1.1: AppLayout Navigation Routes Not Wired to React Router
**Files:**
- `care-config-core-main/src/components/AppLayout.tsx` (lines 44-80)
- `care-config-core-main/src/main.tsx` (lines 10-29)

**Problem:**
- `AppLayout.tsx` defines 20+ navigation routes (e.g., `/dashboard`, `/attorney-portal`, `/rn-portal-landing`, `/cases`, `/reports`, etc.)
- `main.tsx` only handles `/demo` routes and falls back to `AppShell` (which uses tab switching, not React Router)
- `AppShell.tsx` does NOT use React Router - it's a simple tab switcher
- Navigation links in `AppLayout` will fail because there's no `<Routes>` setup in the main app

**Demo-Safe Fix:**
1. For demo, hide all navigation items in `AppLayout` that aren't demo-ready
2. OR: Add React Router setup in `main.tsx` with catch-all route to `NotFound`
3. OR: Remove `AppLayout` from demo flow entirely and use only `DemoHub` → `AttorneyConsole` / `ClientIntakeScreen`

**Recommendation:** Option 3 (simplest for demo). Hide `AppLayout` navigation for demo paths.

---

### Issue 1.2: RoleLandingRedirect References Routes That May Not Exist
**Files:**
- `care-config-core-main/src/pages/RoleLandingRedirect.tsx` (lines 14-39)

**Problem:**
- Redirects to `/clinical-management-portal`, `/rn-portal-landing`, `/provider-portal`, `/attorney-portal`, `/client-portal`
- These routes may not be wired in React Router (see Issue 1.1)
- Will cause 404s if accessed

**Demo-Safe Fix:**
- For demo, ensure all redirect targets exist OR redirect to `/demo` instead
- Add route handlers in `main.tsx` or ensure `AppShell` handles these paths

---

### Issue 1.3: NotFound Page Links to "/" Which Shows DemoHub
**Files:**
- `care-config-core-main/src/pages/NotFound.tsx` (line 9)

**Problem:**
- 404 page links to `/` which shows `DemoHub` (access-gated)
- User may be locked out if they hit a 404

**Demo-Safe Fix:**
- Change link to `/demo` or add a "Back to Demo Hub" button that respects unlock state

---

## 2. Demo Gating Inconsistencies

### Issue 2.1: Access Code Mismatch Between DemoHub and Config
**Files:**
- `care-config-core-main/src/pages/DemoHub.tsx` (line 9): `ACCESS_CODE = "RCMS-CARE-2026"`
- `care-config-core-main/src/config/demoAccess.ts` (line 4): `DEMO_ACCESS_CODE = "RCMS-DEMO-2025"`

**Problem:**
- Two different access codes defined
- `DemoHub` uses hardcoded `"RCMS-CARE-2026"` instead of importing from config
- `demoAccess.ts` is not used anywhere

**Demo-Safe Fix:**
1. Update `DemoHub.tsx` line 9 to import and use `DEMO_ACCESS_CODE` from `demoAccess.ts`
2. OR: Update `demoAccess.ts` to match `"RCMS-CARE-2026"` and ensure `DemoHub` uses it
3. Remove unused `demoAccess.ts` if not needed

**Recommendation:** Option 1 - Use single source of truth from config.

---

### Issue 2.2: Demo Mode Toggle in AttorneyConsole May Confuse Users
**Files:**
- `care-config-core-main/src/screens/AttorneyConsole.tsx` (lines 346, 441-451, 2327-2357)

**Problem:**
- AttorneyConsole has a "Demo Mode" toggle that can be turned OFF
- When OFF, shows "Live mode: awaiting onboarding" messages
- This is confusing for demo - users shouldn't be able to disable demo mode

**Demo-Safe Fix:**
- Remove the toggle button for demo
- Set `demoMode` to always `true` in demo context
- OR: Hide the toggle UI entirely for demo

---

### Issue 2.3: AppShell Bypasses Demo Gating
**Files:**
- `care-config-core-main/src/main.tsx` (lines 27-28)
- `care-config-core-main/src/AppShell.tsx`

**Problem:**
- If user navigates to any path that's NOT `/`, `/demo`, or `/demo/*`, they get `AppShell` directly
- `AppShell` has no demo gating - shows RN/Attorney/Buddy/Supervisor tabs immediately
- This bypasses the access code requirement

**Demo-Safe Fix:**
- Ensure all non-demo paths redirect to `/demo` OR require authentication
- OR: Add demo gating check inside `AppShell` before rendering tabs

---

## 3. Active Case State Definition and Conflicts

### Issue 3.1: Multiple Sources of Active Case State
**Files:**
- `care-config-core-main/src/lib/mockDB.tsx` (lines 394-396): `activeIndex`, `activeCase` from `MockDBProvider`
- `care-config-core-main/src/context/AppContext.tsx` (lines 23-24, 80-105): `cases` array from Supabase
- `care-config-core-main/src/attorney/AttorneyCaseConsole.tsx` (line 16): Uses `useMockDB().activeCase`
- `care-config-core-main/src/screens/AttorneyConsole.tsx` (line 350): Uses `selectedClientId` state (local)

**Problem:**
- `MockDBProvider` manages `activeCase` via `activeIndex`
- `AppContext` manages `cases` from Supabase (different source)
- `AttorneyConsole` uses local `selectedClientId` state (not synced with MockDB)
- No single source of truth - different components read from different places

**Demo-Safe Fix:**
1. For demo, ensure all components use `MockDBProvider` as single source
2. Remove `AppContext.cases` usage in demo paths OR ensure it syncs with MockDB
3. Make `AttorneyConsole` use `useMockDB().activeCase` instead of local state

**Recommendation:** Use `MockDBProvider` as single source for demo. Ensure `AppContext` doesn't conflict.

---

### Issue 3.2: Case Selector Not Always Visible
**Files:**
- `care-config-core-main/src/lib/mockDB.tsx` (lines 394-396)
- `care-config-core-main/src/screens/AttorneyConsole.tsx` (lines 1224-1393)

**Problem:**
- `CARE_SYSTEM_CONTEXT.md` states "Case selector is always visible once unlocked"
- `AttorneyConsole` shows case selector in left panel, but only when `demoMode === true`
- If demo mode is off, selector disappears

**Demo-Safe Fix:**
- Ensure case selector is always visible in demo mode
- Add case selector to `DemoHub` if not already present
- Ensure `MockDBProvider` is available at top level for all demo views

---

## 4. RN, Attorney, or Client Views - Blank, Broken, or Role Boundary Leaks

### Issue 4.1: Attorney Console Shows RN Internal Scoring Details
**Files:**
- `care-config-core-main/src/screens/AttorneyConsole.tsx` (lines 554-602, 1587-1634)

**Problem:**
- Attorney view shows detailed 4Ps and 10-Vs dimension scores (e.g., "Physical: 2/5", "VoiceView: 3/5")
- `CARE_SYSTEM_CONTEXT.md` states: "Attorneys receive clinically informed CARE summaries, flags, and narratives — not raw RN scoring logic"
- Attorney should see narratives/summaries, not individual dimension scores

**Demo-Safe Fix:**
- Remove `renderFourPsMiniList()` and `renderTenVsMiniList()` from attorney view
- Show only overall scores and narratives
- Keep dimension details in RN view only

---

### Issue 4.2: Client View May Be Blank or Incomplete
**Files:**
- `care-config-core-main/src/client/ClientHome.tsx` (lines 6-26)
- `care-config-core-main/src/pages/DemoHub.tsx` (lines 502-547)

**Problem:**
- `ClientHome` only shows `ClientFourPsForm` - may be blank if no data
- `DemoHub` renders `ClientIntakeScreen` for client view, not `ClientHome`
- Inconsistency between what's shown

**Demo-Safe Fix:**
- Ensure `ClientIntakeScreen` shows meaningful demo content
- Add placeholder content if form is empty
- Verify client view shows "read-only CARE plan summaries written in non-diagnostic, client-friendly language" per context doc

---

### Issue 4.3: RN Console May Show Attorney-Only Features
**Files:**
- `care-config-core-main/src/components/RNCaseEngine.tsx`
- `care-config-core-main/src/screens/rn/*.tsx`

**Problem:**
- Need to verify RN views don't show attorney-specific features (e.g., legal strategy tools)
- RN should not see attorney communication logs or case strategy sections

**Demo-Safe Fix:**
- Audit all RN screen components for role-appropriate content
- Hide any attorney-specific UI elements in RN views
- Ensure RN views focus on assessment tools (4Ps, 10-Vs, SDOH, Crisis)

---

### Issue 4.4: Role Boundary Check - Attorney Seeing Raw Scoring
**Files:**
- `care-config-core-main/src/screens/AttorneyConsole.tsx` (lines 496-552, 1663-1704)

**Problem:**
- `buildClinicalNarrative()` shows raw scores like "4Ps overall: 2/5", "10-Vs overall: 2/5"
- While this is summary-level, it's still showing scoring structure
- Context doc says attorneys should see "clinically informed care narrative" not raw scoring

**Demo-Safe Fix:**
- Rewrite narrative to be more prose-like, less score-focused
- Use language like "Client reports moderate functional limitations" instead of "4Ps: 2/5"
- Keep scores in background, emphasize narrative interpretation

---

## 5. Features to Cut, Hide, or Replace with Placeholders for Demo

### Issue 5.1: Supabase Write Operations Should Be Disabled
**Files:**
- Multiple files using `supabase.from().insert()`, `.update()`, `.delete()`

**Problem:**
- `CARE_SYSTEM_CONTEXT.md` states "Demo must NOT write to Supabase"
- Need to ensure all write operations are blocked or mocked in demo mode

**Demo-Safe Fix:**
- Add demo mode check before all Supabase writes
- Return mock success responses instead of actual writes
- Add console warnings in demo mode: "Demo mode: write blocked"

---

### Issue 5.2: Production Authentication Routes Should Be Hidden
**Files:**
- `care-config-core-main/src/pages/Access.tsx`
- `care-config-core-main/src/pages/RoleLandingRedirect.tsx`
- `care-config-core-main/src/auth/supabaseAuth.tsx`

**Problem:**
- Context doc says "No production authentication required" for demo
- Auth routes may confuse demo users

**Demo-Safe Fix:**
- Hide `/access` route from demo navigation
- Ensure demo flow doesn't require auth
- Show "Demo mode - no auth required" message if auth is attempted

---

### Issue 5.3: Billing, Subscriptions, and Payment Features
**Files:**
- `care-config-core-main/src/pages/AttorneyBilling.tsx`
- `care-config-core-main/src/components/AppLayout.tsx` (line 50): "Billing & Subscriptions" nav item

**Problem:**
- Context doc says "Payments" are out of scope for Jan 15
- Billing features should be hidden

**Demo-Safe Fix:**
- Remove "Billing & Subscriptions" from `AppLayout` navigation for demo
- Hide billing routes entirely
- Add placeholder: "Billing features coming soon"

---

### Issue 5.4: Provider Workflows Should Be Hidden or Placeholder
**Files:**
- `care-config-core-main/src/pages/ProviderPortal.tsx`
- `care-config-core-main/src/pages/ProviderRouter.tsx`
- `care-config-core-main/src/pages/ProviderDetail.tsx`
- `care-config-core-main/src/provider/ProviderVisitNoteForm.tsx`

**Problem:**
- Context doc says "Full provider workflows" are out of scope
- Provider views should be informational only or hidden

**Demo-Safe Fix:**
- Hide provider routes from navigation
- Show placeholder page: "Provider portal coming soon"
- OR: Show read-only provider info if needed for demo context

---

### Issue 5.5: Admin and Analytics Features
**Files:**
- `care-config-core-main/src/pages/AdminPanel.tsx`
- `care-config-core-main/src/pages/Insights.tsx`
- `care-config-core-main/src/components/AppLayout.tsx` (lines 76-78): Admin, Analytics, Journal Analytics

**Problem:**
- Admin features not needed for demo
- May confuse demo users

**Demo-Safe Fix:**
- Hide admin/analytics nav items for demo
- Remove from `AppLayout` navigation array OR filter by demo mode
- Show placeholder if accessed directly

---

### Issue 5.6: Documents & Files Feature May Be Incomplete
**Files:**
- `care-config-core-main/src/pages/DocumentHub.tsx`
- `care-config-core-main/src/components/AppLayout.tsx` (line 63): "Documents & Files" nav

**Problem:**
- May not be fully implemented for demo
- Could show blank page or errors

**Demo-Safe Fix:**
- Verify `DocumentHub` shows meaningful demo content
- Add placeholder if incomplete: "Document management coming soon"
- OR: Hide from navigation if not ready

---

### Issue 5.7: Reports Feature Should Show Placeholder Content
**Files:**
- `care-config-core-main/src/pages/Reports.tsx`
- `care-config-core-main/src/screens/AttorneyConsole.tsx` (lines 1922-2064): Reports section

**Problem:**
- Reports may not be fully functional
- Should show demo-appropriate placeholder content

**Demo-Safe Fix:**
- Ensure reports show demo data (AttorneyConsole already has this)
- Verify `Reports.tsx` page shows placeholder if accessed directly
- Add "Demo data - not for production use" disclaimer

---

### Issue 5.8: Test Setup and Dev Pages Should Be Hidden
**Files:**
- `care-config-core-main/src/pages/TestSetup.tsx`
- `care-config-core-main/src/pages/DevCaseDocumentsDemo.tsx`

**Problem:**
- Dev/test pages should not be accessible in demo

**Demo-Safe Fix:**
- Remove from any navigation
- Block access in demo mode
- Return 404 or redirect to demo hub

---

## Summary of Critical Fixes Needed

### Must Fix Before Demo:
1. **Fix demo access code mismatch** (Issue 2.1) - Single source of truth
2. **Hide/remove broken navigation routes** (Issue 1.1) - Prevent 404s
3. **Remove RN scoring details from attorney view** (Issue 4.1) - Role boundary violation
4. **Ensure case selector is always visible** (Issue 3.2) - Demo requirement
5. **Block Supabase writes in demo mode** (Issue 5.1) - Demo requirement

### Should Fix Before Demo:
6. **Fix active case state conflicts** (Issue 3.1) - Use single source
7. **Hide billing/payment features** (Issue 5.3) - Out of scope
8. **Hide admin/analytics features** (Issue 5.5) - Not needed
9. **Hide provider workflows** (Issue 5.4) - Out of scope
10. **Ensure client view shows meaningful content** (Issue 4.2) - Demo completeness

### Nice to Have:
11. **Improve attorney narrative language** (Issue 4.4) - Less score-focused
12. **Add demo mode indicators** - Clear "DEMO" badges throughout
13. **Add "Back to Demo Hub" links** - Better navigation

---

## Recommended Demo Flow Validation

1. User enters `/demo` → Sees `DemoHub` with access code gate ✓
2. User enters code `RCMS-CARE-2026` → Unlocks demo ✓
3. User clicks "Open Attorney Console" → Sees `AttorneyConsole` with case selector ✓
4. User selects case → Sees CARE summary (narrative, not raw scores) ⚠️ (needs fix)
5. User clicks "Open Client Experience" → Sees `ClientIntakeScreen` with demo content ✓
6. User navigates away → Should return to demo hub or show clear demo context ⚠️ (needs fix)

---

## Files Requiring Immediate Attention

1. `care-config-core-main/src/pages/DemoHub.tsx` - Fix access code import
2. `care-config-core-main/src/screens/AttorneyConsole.tsx` - Remove scoring details, ensure case selector always visible
3. `care-config-core-main/src/main.tsx` - Add route handling or hide broken routes
4. `care-config-core-main/src/components/AppLayout.tsx` - Filter navigation for demo mode
5. `care-config-core-main/src/lib/mockDB.tsx` - Ensure single source of truth for active case
6. All Supabase write operations - Add demo mode guards

---

*Audit completed: Based on CARE_SYSTEM_CONTEXT.md as authoritative source*


