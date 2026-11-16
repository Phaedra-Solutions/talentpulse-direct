-- ==============================================================================
-- MIGRATION: 20261116000001_add_candidates_performance_indexes.sql
-- Description: Adds performance and partial indexes on public.candidates for
--              dashboard KPI queries, English proficiency filtering, and
--              non-timing-out batched resume transfer queries.
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_candidates_has_resume
  ON public.candidates ((resume_url IS NOT NULL AND resume_url <> ''));

CREATE INDEX IF NOT EXISTS idx_candidates_pending_resume_migration
  ON public.candidates(id)
  WHERE (resume_url IS NOT NULL AND resume_url <> '' AND resume_url NOT LIKE 'Talent Pulse/%');

CREATE INDEX IF NOT EXISTS idx_candidates_has_video_pitch
  ON public.candidates ((video_pitch_url IS NOT NULL AND video_pitch_url <> ''));

CREATE INDEX IF NOT EXISTS idx_candidates_english_proficiency
  ON public.candidates(english_proficiency);
