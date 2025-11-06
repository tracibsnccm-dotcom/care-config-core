-- Harden view to avoid SECURITY DEFINER behavior flagged by linter
-- Switch management_team_cases to run with invoker privileges
ALTER VIEW public.management_team_cases SET (security_invoker = true);