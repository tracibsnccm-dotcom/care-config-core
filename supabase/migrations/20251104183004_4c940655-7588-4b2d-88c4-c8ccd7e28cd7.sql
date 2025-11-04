-- Add missing columns to rn_teams
ALTER TABLE public.rn_teams 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add missing columns to rn_team_members
ALTER TABLE public.rn_team_members
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

-- Create diary entry templates IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.rn_diary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  description_template TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  estimated_duration_minutes INTEGER,
  created_by UUID NOT NULL,
  is_shared BOOLEAN DEFAULT false,
  team_id UUID REFERENCES public.rn_teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring entries configuration IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.rn_diary_recurring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rn_id UUID NOT NULL,
  template_id UUID REFERENCES public.rn_diary_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  recurrence_pattern TEXT NOT NULL,
  recurrence_days INTEGER[],
  scheduled_time TIME,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Add time tracking fields to rn_diary_entries if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'rn_diary_entries' 
                 AND column_name = 'estimated_duration_minutes') THEN
    ALTER TABLE public.rn_diary_entries 
    ADD COLUMN estimated_duration_minutes INTEGER,
    ADD COLUMN actual_duration_minutes INTEGER,
    ADD COLUMN time_tracking_started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN time_tracking_completed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN parent_recurring_id UUID REFERENCES public.rn_diary_recurring(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'rn_diary_templates' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.rn_diary_templates ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'rn_diary_recurring' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.rn_diary_recurring ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- RLS Policies for templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can create templates' AND tablename = 'rn_diary_templates') THEN
    CREATE POLICY "RN can create templates"
      ON public.rn_diary_templates FOR INSERT
      TO authenticated
      WITH CHECK (created_by = auth.uid() AND (has_role('RN_CCM') OR has_role('STAFF')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can view own and shared templates' AND tablename = 'rn_diary_templates') THEN
    CREATE POLICY "RN can view own and shared templates"
      ON public.rn_diary_templates FOR SELECT
      TO authenticated
      USING (
        created_by = auth.uid() 
        OR is_shared = true
        OR (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.rn_team_members 
          WHERE team_id = rn_diary_templates.team_id AND rn_user_id = auth.uid()
        ))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can update own templates' AND tablename = 'rn_diary_templates') THEN
    CREATE POLICY "RN can update own templates"
      ON public.rn_diary_templates FOR UPDATE
      TO authenticated
      USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can delete own templates' AND tablename = 'rn_diary_templates') THEN
    CREATE POLICY "RN can delete own templates"
      ON public.rn_diary_templates FOR DELETE
      TO authenticated
      USING (created_by = auth.uid());
  END IF;
END $$;

-- RLS Policies for recurring entries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can create recurring entries' AND tablename = 'rn_diary_recurring') THEN
    CREATE POLICY "RN can create recurring entries"
      ON public.rn_diary_recurring FOR INSERT
      TO authenticated
      WITH CHECK (rn_id = auth.uid() AND (has_role('RN_CCM') OR has_role('STAFF')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can view own recurring entries' AND tablename = 'rn_diary_recurring') THEN
    CREATE POLICY "RN can view own recurring entries"
      ON public.rn_diary_recurring FOR SELECT
      TO authenticated
      USING (rn_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can update own recurring entries' AND tablename = 'rn_diary_recurring') THEN
    CREATE POLICY "RN can update own recurring entries"
      ON public.rn_diary_recurring FOR UPDATE
      TO authenticated
      USING (rn_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'RN can delete own recurring entries' AND tablename = 'rn_diary_recurring') THEN
    CREATE POLICY "RN can delete own recurring entries"
      ON public.rn_diary_recurring FOR DELETE
      TO authenticated
      USING (rn_id = auth.uid());
  END IF;
END $$;

-- Create function to generate recurring entries
CREATE OR REPLACE FUNCTION public.generate_recurring_diary_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recurring_record RECORD;
  target_date DATE;
  day_of_week INTEGER;
BEGIN
  FOR recurring_record IN 
    SELECT * FROM public.rn_diary_recurring 
    WHERE is_active = true 
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    FOR i IN 0..29 LOOP
      target_date := CURRENT_DATE + i;
      
      CONTINUE WHEN target_date < recurring_record.start_date;
      CONTINUE WHEN recurring_record.end_date IS NOT NULL AND target_date > recurring_record.end_date;
      
      day_of_week := EXTRACT(ISODOW FROM target_date);
      
      IF (recurring_record.recurrence_pattern = 'daily') OR
         (recurring_record.recurrence_pattern = 'weekly' AND day_of_week = ANY(recurring_record.recurrence_days)) OR
         (recurring_record.recurrence_pattern = 'monthly' AND EXTRACT(DAY FROM target_date) = EXTRACT(DAY FROM recurring_record.start_date))
      THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.rn_diary_entries 
          WHERE rn_id = recurring_record.rn_id 
          AND scheduled_date = target_date
          AND parent_recurring_id = recurring_record.id
        ) THEN
          INSERT INTO public.rn_diary_entries (
            rn_id,
            title,
            description,
            category,
            priority,
            scheduled_date,
            scheduled_time,
            completion_status,
            parent_recurring_id,
            estimated_duration_minutes
          ) VALUES (
            recurring_record.rn_id,
            recurring_record.title,
            recurring_record.description,
            recurring_record.category,
            recurring_record.priority,
            target_date,
            recurring_record.scheduled_time,
            'pending',
            recurring_record.id,
            NULL
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rn_diary_templates_created_by ON public.rn_diary_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_rn_diary_recurring_rn_id ON public.rn_diary_recurring(rn_id);
CREATE INDEX IF NOT EXISTS idx_rn_diary_entries_parent_recurring ON public.rn_diary_entries(parent_recurring_id) WHERE parent_recurring_id IS NOT NULL;