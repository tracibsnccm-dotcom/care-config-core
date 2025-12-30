-- Tags and Categories
CREATE TABLE IF NOT EXISTS public.rn_diary_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tag_name)
);

CREATE TABLE IF NOT EXISTS public.rn_diary_entry_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.rn_diary_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(entry_id, tag_id)
);

-- Saved Filters
CREATE TABLE IF NOT EXISTS public.rn_saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rn_id UUID NOT NULL REFERENCES auth.users(id),
  filter_name TEXT NOT NULL,
  filter_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Suggestions and Smart Scheduling
CREATE TABLE IF NOT EXISTS public.rn_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rn_id UUID NOT NULL REFERENCES auth.users(id),
  case_id UUID REFERENCES public.cases(id),
  suggestion_type TEXT NOT NULL, -- 'entry', 'schedule', 'priority', 'duplicate'
  suggestion_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.80,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actioned_at TIMESTAMP WITH TIME ZONE
);

-- Team Handoffs and Shared Entries
CREATE TABLE IF NOT EXISTS public.rn_team_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id),
  from_rn_id UUID NOT NULL REFERENCES auth.users(id),
  to_rn_id UUID NOT NULL REFERENCES auth.users(id),
  handoff_type TEXT NOT NULL, -- 'shift_change', 'case_transfer', 'vacation_coverage'
  handoff_notes TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  action_items JSONB DEFAULT '[]'::jsonb,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workload Analytics (aggregated metrics)
CREATE TABLE IF NOT EXISTS public.rn_workload_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rn_id UUID NOT NULL REFERENCES auth.users(id),
  analysis_date DATE NOT NULL,
  total_entries INTEGER DEFAULT 0,
  by_entry_type JSONB DEFAULT '{}'::jsonb,
  by_priority JSONB DEFAULT '{}'::jsonb,
  time_allocation JSONB DEFAULT '{}'::jsonb,
  completion_rate DECIMAL(5,2),
  avg_completion_time_minutes INTEGER,
  overdue_count INTEGER DEFAULT 0,
  peak_hours JSONB DEFAULT '[]'::jsonb,
  team_comparison JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(rn_id, analysis_date)
);

-- Quality and Compliance Scores
CREATE TABLE IF NOT EXISTS public.rn_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  completeness_score INTEGER DEFAULT 0, -- 0-100
  timeliness_score INTEGER DEFAULT 0, -- 0-100
  documentation_quality INTEGER DEFAULT 0, -- 0-100
  compliance_flags JSONB DEFAULT '[]'::jsonb,
  required_fields_met BOOLEAN DEFAULT true,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  calculated_by TEXT DEFAULT 'system'
);

-- Enable RLS
ALTER TABLE public.rn_diary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_diary_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_team_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_workload_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_quality_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tags
CREATE POLICY "RN can view all tags" ON public.rn_diary_tags FOR SELECT USING (true);
CREATE POLICY "RN can create tags" ON public.rn_diary_tags FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "RN can view entry tags" ON public.rn_diary_entry_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rn_diary_entries WHERE id = entry_id AND rn_id = auth.uid())
);
CREATE POLICY "RN can manage entry tags" ON public.rn_diary_entry_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rn_diary_entries WHERE id = entry_id AND rn_id = auth.uid())
);

-- RLS Policies for Saved Filters
CREATE POLICY "RN can manage own filters" ON public.rn_saved_filters FOR ALL USING (rn_id = auth.uid());

-- RLS Policies for AI Suggestions
CREATE POLICY "RN can view own suggestions" ON public.rn_ai_suggestions FOR SELECT USING (rn_id = auth.uid());
CREATE POLICY "RN can update own suggestions" ON public.rn_ai_suggestions FOR UPDATE USING (rn_id = auth.uid());
CREATE POLICY "System can create suggestions" ON public.rn_ai_suggestions FOR INSERT WITH CHECK (true);

-- RLS Policies for Team Handoffs
CREATE POLICY "RN can view handoffs to/from them" ON public.rn_team_handoffs FOR SELECT USING (
  from_rn_id = auth.uid() OR to_rn_id = auth.uid() OR 
  has_role('RN_CCM_DIRECTOR') OR has_role('STAFF') OR has_role('SUPER_ADMIN')
);
CREATE POLICY "RN can create handoffs" ON public.rn_team_handoffs FOR INSERT WITH CHECK (from_rn_id = auth.uid());
CREATE POLICY "RN can acknowledge handoffs" ON public.rn_team_handoffs FOR UPDATE USING (to_rn_id = auth.uid());

-- RLS Policies for Workload Analytics
CREATE POLICY "RN can view own analytics" ON public.rn_workload_analytics FOR SELECT USING (
  rn_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('STAFF') OR has_role('SUPER_ADMIN')
);
CREATE POLICY "System can manage analytics" ON public.rn_workload_analytics FOR ALL USING (
  has_role('STAFF') OR has_role('SUPER_ADMIN')
);

-- RLS Policies for Quality Scores
CREATE POLICY "RN can view quality scores" ON public.rn_quality_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rn_diary_entries WHERE id = entry_id AND rn_id = auth.uid())
);
CREATE POLICY "System can manage quality scores" ON public.rn_quality_scores FOR ALL USING (true);

-- Indexes for Performance
CREATE INDEX idx_diary_entry_tags_entry ON public.rn_diary_entry_tags(entry_id);
CREATE INDEX idx_diary_entry_tags_tag ON public.rn_diary_entry_tags(tag_id);
CREATE INDEX idx_saved_filters_rn ON public.rn_saved_filters(rn_id);
CREATE INDEX idx_ai_suggestions_rn ON public.rn_ai_suggestions(rn_id, status);
CREATE INDEX idx_team_handoffs_to_rn ON public.rn_team_handoffs(to_rn_id, acknowledged);
CREATE INDEX idx_workload_analytics_rn_date ON public.rn_workload_analytics(rn_id, analysis_date);
CREATE INDEX idx_quality_scores_entry ON public.rn_quality_scores(entry_id);

-- Function to calculate quality score
CREATE OR REPLACE FUNCTION calculate_entry_quality_score(p_entry_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_entry RECORD;
  v_completeness INTEGER := 0;
  v_timeliness INTEGER := 100;
  v_quality INTEGER := 100;
  v_flags JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_entry FROM public.rn_diary_entries WHERE id = p_entry_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Entry not found');
  END IF;
  
  -- Completeness scoring
  IF v_entry.title IS NOT NULL AND length(v_entry.title) > 5 THEN v_completeness := v_completeness + 20; END IF;
  IF v_entry.description IS NOT NULL AND length(v_entry.description) > 20 THEN v_completeness := v_completeness + 30; END IF;
  IF v_entry.case_id IS NOT NULL THEN v_completeness := v_completeness + 20; END IF;
  IF v_entry.scheduled_time IS NOT NULL THEN v_completeness := v_completeness + 15; END IF;
  IF v_entry.actual_duration_minutes IS NOT NULL THEN v_completeness := v_completeness + 15; END IF;
  
  -- Timeliness scoring
  IF v_entry.completion_status = 'overdue' THEN 
    v_timeliness := 50;
    v_flags := v_flags || jsonb_build_object('type', 'overdue', 'message', 'Entry is overdue');
  ELSIF v_entry.completion_status = 'completed' AND v_entry.completed_at IS NOT NULL THEN
    IF v_entry.completed_at > (v_entry.scheduled_date + v_entry.scheduled_time) THEN
      v_timeliness := 80;
    END IF;
  END IF;
  
  -- Documentation quality
  IF v_entry.description IS NULL OR length(v_entry.description) < 10 THEN
    v_quality := 60;
    v_flags := v_flags || jsonb_build_object('type', 'insufficient_detail', 'message', 'Description too brief');
  END IF;
  
  RETURN jsonb_build_object(
    'completeness_score', v_completeness,
    'timeliness_score', v_timeliness,
    'documentation_quality', v_quality,
    'compliance_flags', v_flags,
    'overall_score', ((v_completeness + v_timeliness + v_quality) / 3)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;