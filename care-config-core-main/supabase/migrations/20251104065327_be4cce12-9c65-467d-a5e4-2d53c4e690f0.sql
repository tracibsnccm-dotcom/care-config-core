-- Create RN teams table for supervisor/manager assignments
CREATE TABLE IF NOT EXISTS rn_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  supervisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(supervisor_id, team_name)
);

-- Create RN team members junction table
CREATE TABLE IF NOT EXISTS rn_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES rn_teams(id) ON DELETE CASCADE,
  rn_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, rn_user_id)
);

-- Add recurring fields to rn_diary_entries
ALTER TABLE rn_diary_entries
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS parent_entry_id UUID REFERENCES rn_diary_entries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'pending' CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS shared_with_supervisor BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS template_name TEXT,
ADD COLUMN IF NOT EXISTS linked_time_entry_id UUID;

-- Enable RLS on new tables
ALTER TABLE rn_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE rn_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for rn_teams
CREATE POLICY "Supervisors can create teams"
ON rn_teams FOR INSERT
WITH CHECK (auth.uid() = supervisor_id);

CREATE POLICY "Supervisors can view their teams"
ON rn_teams FOR SELECT
USING (
  auth.uid() = supervisor_id OR
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Supervisors can update their teams"
ON rn_teams FOR UPDATE
USING (auth.uid() = supervisor_id);

CREATE POLICY "Supervisors can delete their teams"
ON rn_teams FOR DELETE
USING (auth.uid() = supervisor_id);

-- RLS policies for rn_team_members
CREATE POLICY "Supervisors can add team members"
ON rn_team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rn_teams
    WHERE rn_teams.id = rn_team_members.team_id
    AND rn_teams.supervisor_id = auth.uid()
  )
);

CREATE POLICY "Supervisors and team members can view team membership"
ON rn_team_members FOR SELECT
USING (
  rn_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM rn_teams
    WHERE rn_teams.id = rn_team_members.team_id
    AND rn_teams.supervisor_id = auth.uid()
  ) OR
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Supervisors can remove team members"
ON rn_team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM rn_teams
    WHERE rn_teams.id = rn_team_members.team_id
    AND rn_teams.supervisor_id = auth.uid()
  )
);

-- Update RLS policy for diary entries to include supervisor access
DROP POLICY IF EXISTS "RN can view own diary entries" ON rn_diary_entries;
CREATE POLICY "RN can view own diary entries"
ON rn_diary_entries FOR SELECT
USING (
  rn_id = auth.uid() OR
  (shared_with_supervisor = true AND EXISTS (
    SELECT 1 FROM rn_team_members rtm
    JOIN rn_teams rt ON rt.id = rtm.team_id
    WHERE rtm.rn_user_id = rn_diary_entries.rn_id
    AND rt.supervisor_id = auth.uid()
  )) OR
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rn_teams_supervisor ON rn_teams(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_rn_team_members_team ON rn_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_rn_team_members_rn ON rn_team_members(rn_user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_recurring ON rn_diary_entries(is_recurring, recurrence_pattern) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_diary_entries_completion ON rn_diary_entries(completion_status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_priority ON rn_diary_entries(priority, scheduled_date);

-- Create function to auto-update completion status based on dates
CREATE OR REPLACE FUNCTION update_diary_entry_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark as overdue if past scheduled date/time and not completed
  IF NEW.completion_status = 'pending' 
     AND NEW.scheduled_date < CURRENT_DATE
     AND (NEW.scheduled_time IS NULL OR (NEW.scheduled_date + NEW.scheduled_time) < now()) THEN
    NEW.completion_status := 'overdue';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-status update
DROP TRIGGER IF EXISTS diary_entry_status_trigger ON rn_diary_entries;
CREATE TRIGGER diary_entry_status_trigger
BEFORE INSERT OR UPDATE ON rn_diary_entries
FOR EACH ROW
EXECUTE FUNCTION update_diary_entry_status();

-- Create function to generate recurring diary entries
CREATE OR REPLACE FUNCTION generate_recurring_diary_entries(
  p_parent_entry_id UUID,
  p_weeks_ahead INTEGER DEFAULT 4
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent RECORD;
  v_generated_count INTEGER := 0;
  v_next_date DATE;
  v_interval INTERVAL;
  v_end_date DATE;
BEGIN
  -- Get parent entry details
  SELECT * INTO v_parent
  FROM rn_diary_entries
  WHERE id = p_parent_entry_id AND is_recurring = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Determine interval based on recurrence pattern
  v_interval := CASE v_parent.recurrence_pattern
    WHEN 'daily' THEN INTERVAL '1 day'
    WHEN 'weekly' THEN INTERVAL '1 week'
    WHEN 'biweekly' THEN INTERVAL '2 weeks'
    WHEN 'monthly' THEN INTERVAL '1 month'
  END;
  
  -- Set end date (either specified or weeks ahead)
  v_end_date := COALESCE(
    v_parent.recurrence_end_date,
    CURRENT_DATE + (p_weeks_ahead || ' weeks')::INTERVAL
  );
  
  -- Generate entries
  v_next_date := v_parent.scheduled_date + v_interval;
  
  WHILE v_next_date <= v_end_date LOOP
    -- Check if entry already exists for this date
    IF NOT EXISTS (
      SELECT 1 FROM rn_diary_entries
      WHERE parent_entry_id = p_parent_entry_id
      AND scheduled_date = v_next_date
    ) THEN
      INSERT INTO rn_diary_entries (
        case_id, rn_id, entry_type, title, description,
        scheduled_date, scheduled_time, location, contact_name,
        contact_phone, contact_email, requires_contact,
        is_recurring, recurrence_pattern, recurrence_end_date,
        parent_entry_id, priority, reminder_enabled, reminder_minutes_before,
        shared_with_supervisor, template_name, created_by
      ) VALUES (
        v_parent.case_id, v_parent.rn_id, v_parent.entry_type, v_parent.title, v_parent.description,
        v_next_date, v_parent.scheduled_time, v_parent.location, v_parent.contact_name,
        v_parent.contact_phone, v_parent.contact_email, v_parent.requires_contact,
        false, NULL, NULL, -- Child entries are not themselves recurring
        p_parent_entry_id, v_parent.priority, v_parent.reminder_enabled, v_parent.reminder_minutes_before,
        v_parent.shared_with_supervisor, v_parent.template_name, v_parent.created_by
      );
      
      v_generated_count := v_generated_count + 1;
    END IF;
    
    v_next_date := v_next_date + v_interval;
  END LOOP;
  
  RETURN v_generated_count;
END;
$$;