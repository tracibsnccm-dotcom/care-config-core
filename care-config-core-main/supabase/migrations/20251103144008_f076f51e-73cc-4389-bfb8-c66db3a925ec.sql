-- Create subscription tiers enum
CREATE TYPE subscription_tier AS ENUM ('trial', 'basic', 'clinical', 'comprehensive');

-- Add subscription fields to attorney_metadata
ALTER TABLE public.attorney_metadata
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS feature_usage_stats JSONB DEFAULT '{}'::jsonb;

-- Create feature definitions table
CREATE TABLE public.feature_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tier_required subscription_tier NOT NULL,
  is_core_feature BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create feature usage tracking table
CREATE TABLE public.feature_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_definitions
CREATE POLICY "Anyone can view feature definitions"
ON public.feature_definitions
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage feature definitions"
ON public.feature_definitions
FOR ALL
USING (has_role('SUPER_ADMIN'));

-- RLS Policies for feature_usage_logs
CREATE POLICY "Attorneys can view own usage logs"
ON public.feature_usage_logs
FOR SELECT
USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can insert own usage logs"
ON public.feature_usage_logs
FOR INSERT
WITH CHECK (attorney_id = auth.uid());

CREATE POLICY "Staff can view all usage logs"
ON public.feature_usage_logs
FOR SELECT
USING (has_role('STAFF') OR has_role('SUPER_ADMIN'));

-- Indexes
CREATE INDEX idx_feature_usage_attorney ON public.feature_usage_logs(attorney_id);
CREATE INDEX idx_feature_usage_feature_key ON public.feature_usage_logs(feature_key);
CREATE INDEX idx_feature_usage_last_used ON public.feature_usage_logs(last_used_at);

-- Function to check if attorney has access to feature
CREATE OR REPLACE FUNCTION public.has_feature_access(
  p_attorney_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier subscription_tier;
  v_required_tier subscription_tier;
  v_trial_ended BOOLEAN;
  v_custom_enabled BOOLEAN;
BEGIN
  -- Get attorney's subscription tier and trial status
  SELECT 
    subscription_tier,
    (trial_ends_at < now()) as trial_ended
  INTO v_tier, v_trial_ended
  FROM attorney_metadata
  WHERE user_id = p_attorney_id;
  
  -- During trial, all features available
  IF v_tier = 'trial' AND NOT v_trial_ended THEN
    RETURN true;
  END IF;
  
  -- Get required tier for feature
  SELECT tier_required INTO v_required_tier
  FROM feature_definitions
  WHERE feature_key = p_feature_key;
  
  -- Check if feature is core (always available)
  IF EXISTS (
    SELECT 1 FROM feature_definitions 
    WHERE feature_key = p_feature_key AND is_core_feature = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Check custom enabled features
  SELECT EXISTS (
    SELECT 1 FROM attorney_metadata
    WHERE user_id = p_attorney_id
    AND enabled_features @> jsonb_build_array(p_feature_key)
  ) INTO v_custom_enabled;
  
  IF v_custom_enabled THEN
    RETURN true;
  END IF;
  
  -- Check tier hierarchy: comprehensive > clinical > basic
  IF v_tier = 'comprehensive' THEN
    RETURN true;
  ELSIF v_tier = 'clinical' AND v_required_tier IN ('basic', 'clinical') THEN
    RETURN true;
  ELSIF v_tier = 'basic' AND v_required_tier = 'basic' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to log feature usage
CREATE OR REPLACE FUNCTION public.log_feature_usage(
  p_attorney_id UUID,
  p_feature_key TEXT,
  p_session_duration INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert usage log
  INSERT INTO feature_usage_logs (
    attorney_id,
    feature_key,
    usage_count,
    last_used_at,
    session_duration_seconds,
    metadata
  ) VALUES (
    p_attorney_id,
    p_feature_key,
    1,
    now(),
    p_session_duration,
    p_metadata
  )
  ON CONFLICT (attorney_id, feature_key)
  WHERE created_at::date = CURRENT_DATE
  DO UPDATE SET
    usage_count = feature_usage_logs.usage_count + 1,
    last_used_at = now(),
    session_duration_seconds = COALESCE(p_session_duration, feature_usage_logs.session_duration_seconds);
    
  -- Update feature usage stats in attorney_metadata
  UPDATE attorney_metadata
  SET feature_usage_stats = jsonb_set(
    COALESCE(feature_usage_stats, '{}'::jsonb),
    ARRAY[p_feature_key],
    to_jsonb(COALESCE((feature_usage_stats->p_feature_key)::integer, 0) + 1)
  )
  WHERE user_id = p_attorney_id;
END;
$$;

-- Function to get tier recommendation based on usage
CREATE OR REPLACE FUNCTION public.get_tier_recommendation(p_attorney_id UUID)
RETURNS TABLE(
  recommended_tier subscription_tier,
  reason TEXT,
  top_features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage_stats JSONB;
  v_clinical_features INTEGER := 0;
  v_comprehensive_features INTEGER := 0;
BEGIN
  -- Get usage stats
  SELECT feature_usage_stats INTO v_usage_stats
  FROM attorney_metadata
  WHERE user_id = p_attorney_id;
  
  -- Count usage of clinical-tier features
  SELECT COUNT(*) INTO v_clinical_features
  FROM feature_definitions fd
  WHERE fd.tier_required = 'clinical'
  AND (v_usage_stats->>fd.feature_key)::integer > 0;
  
  -- Count usage of comprehensive-tier features
  SELECT COUNT(*) INTO v_comprehensive_features
  FROM feature_definitions fd
  WHERE fd.tier_required = 'comprehensive'
  AND (v_usage_stats->>fd.feature_key)::integer > 0;
  
  -- Determine recommendation
  IF v_comprehensive_features > 2 THEN
    RETURN QUERY SELECT 
      'comprehensive'::subscription_tier,
      'You frequently use advanced features',
      v_usage_stats;
  ELSIF v_clinical_features > 2 THEN
    RETURN QUERY SELECT 
      'clinical'::subscription_tier,
      'You regularly use medical case management features',
      v_usage_stats;
  ELSE
    RETURN QUERY SELECT 
      'basic'::subscription_tier,
      'Basic features meet your current needs',
      v_usage_stats;
  END IF;
END;
$$;