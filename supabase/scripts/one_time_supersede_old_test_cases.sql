-- One-time script: mark old "duplicate-like" rc_cases as superseded (is_superseded=true).
-- Run manually after migration 20260205100000_rc_cases_is_superseded_flag.
--
-- Heuristic: group by (client_id, date_of_injury, case_type). Within each cluster with count>1,
-- keep the most recently updated row (is_superseded=false), mark older rows (is_superseded=true).
--
-- Exclusions (we do NOT supersede):
--   - released_at IS NOT NULL
--   - case_status = 'closed'
--
-- Reversible: UPDATE rc_cases SET is_superseded = false WHERE id IN (...);

DO $$
DECLARE
  r RECORD;
  keep_id uuid;
  dup_id uuid;
  rows_marked int := 0;
  clusters_processed int := 0;
BEGIN
  FOR r IN
    SELECT
      c.client_id,
      c.date_of_injury,
      c.case_type,
      array_agg(c.id ORDER BY COALESCE(c.updated_at, c.created_at) DESC NULLS LAST) AS ids
    FROM public.rc_cases c
    WHERE c.is_superseded = false
      AND c.released_at IS NULL
      AND (c.case_status IS NULL OR c.case_status <> 'closed')
    GROUP BY c.client_id, c.date_of_injury, c.case_type
    HAVING count(*) > 1
  LOOP
    clusters_processed := clusters_processed + 1;
    keep_id := r.ids[1];

    FOREACH dup_id IN ARRAY r.ids
    LOOP
      IF dup_id IS DISTINCT FROM keep_id THEN
        UPDATE public.rc_cases
        SET is_superseded = true
        WHERE id = dup_id;
        rows_marked := rows_marked + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'one_time_supersede_old_test_cases: clusters_processed=%, rows_marked=%', clusters_processed, rows_marked;
END $$;
