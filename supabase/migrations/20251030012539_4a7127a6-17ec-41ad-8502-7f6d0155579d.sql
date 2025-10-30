-- Drop existing problematic RLS policies on client_checkins
DROP POLICY IF EXISTS "Clients can create check-ins for their cases" ON client_checkins;
DROP POLICY IF EXISTS "Users can view check-ins for their cases" ON client_checkins;
DROP POLICY IF EXISTS "Staff can update check-ins" ON client_checkins;

-- Create simpler JWT-based policies for client_checkins
CREATE POLICY "client_insert_own_checkins"
  ON client_checkins 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id
  );

CREATE POLICY "client_select_own_checkins"
  ON client_checkins 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = client_id
  );

CREATE POLICY "rn_select_assigned_checkins"
  ON client_checkins 
  FOR SELECT 
  TO authenticated
  USING (
    has_role('RN_CCM') AND EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = client_checkins.case_id
        AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "staff_select_all_checkins"
  ON client_checkins
  FOR SELECT
  TO authenticated
  USING (
    has_role('ATTORNEY') OR 
    has_role('STAFF') OR 
    has_role('SUPER_USER') OR 
    has_role('SUPER_ADMIN')
  );

-- Fix case_assignments RLS to prevent infinite recursion
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "assignments_read" ON case_assignments;

-- Create non-recursive policy using direct auth check
CREATE POLICY "assignments_read_own"
  ON case_assignments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "assignments_read_staff"
  ON case_assignments
  FOR SELECT
  TO authenticated
  USING (
    has_role('ATTORNEY') OR 
    has_role('STAFF') OR 
    has_role('RN_CCM') OR
    has_role('SUPER_USER') OR 
    has_role('SUPER_ADMIN')
  );