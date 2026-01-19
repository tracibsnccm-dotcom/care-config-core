# is_superseded: Verification Checklist

After deploying the migration and one-time supersede script, and with app filtering in place:

## 1. Active cases still appear
- [ ] **Attorney dashboard** (released/closed/ready): Cases for the attorney still load.
- [ ] **Pending Intakes** (AttorneyIntakeTracker): Intakes with non-superseded `rc_cases` show as before.
- [ ] **RN Work Queue / RNDashboard / RNWorkQueuePage / PendingCasesSection**: Assigned and direct `rn_cm_id` cases appear.
- [ ] **Client portal** (ClientPortalDashboard, ClientPortalSimple, client-sign-in): Client can log in with case number + PIN and see their case.
- [ ] **Communications** (AttorneyCommunicationCenter, AttorneyCaseNotes, CalendarScheduling, ClientCommunicationCenter, CommunicationWidget): Case lists and lookups work.
- [ ] **Exports** (CarePlanPDFExport, exportAudit): Resolving by `case_number` and loading case data works for released/closed.

## 2. Superseded cases no longer appear in normal UI
- [ ] **Attorney**: Superseded cases do not show in case lists, communications, or pending intakes.
- [ ] **RN**: Superseded cases do not show in work queue, dashboard, or case selectors.
- [ ] **Client**: Client cannot sign in with a superseded case’s case number + PIN; case is not shown in portal.
- [ ] **Intake enforcement** (edge function): Pending intakes whose `rc_cases` is superseded are not processed (they are filtered out).

## 3. Released cases were not superseded
- [ ] Rows with `released_at IS NOT NULL` have `is_superseded = false`.
- [ ] Rows with `case_status = 'closed'` have `is_superseded = false`.
- [ ] The one-time script `supabase/scripts/one_time_supersede_old_test_cases.sql` excludes these (and only marks clusters with `count > 1`).

## 4. One-time script
- [ ] Run `supabase/scripts/one_time_supersede_old_test_cases.sql` once after migration `20260205100000_rc_cases_is_superseded_flag`.
- [ ] Check `RAISE NOTICE` / logs for `clusters_processed` and `rows_marked`.

## 5. Reversibility
- To undo: `UPDATE rc_cases SET is_superseded = false WHERE id IN (...);` for the affected ids. No deletes.
