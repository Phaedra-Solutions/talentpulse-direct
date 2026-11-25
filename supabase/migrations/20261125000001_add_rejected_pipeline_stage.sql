-- ==============================================================================
-- MIGRATION: 20261125000001_add_rejected_pipeline_stage.sql
-- Description: Adds 'rejected' (Rejected / Archived) stage to pipeline_stage_enum
--              on public.candidates and adds composite index for active pipeline
--              stage filtering and stage statistics aggregation.
-- ==============================================================================

DO $$ BEGIN
    ALTER TYPE pipeline_stage_enum ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_stage_created_at
  ON public.candidates(pipeline_stage, created_at DESC);
