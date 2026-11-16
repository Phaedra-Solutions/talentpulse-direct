-- ==============================================================================
-- MIGRATION: 20261116000003_add_hire_requests_pagination_index.sql
-- Description: Adds composite (status, created_at DESC) index on
--              public.hire_requests to speed up paginated and status-filtered
--              admin hire request listings.
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_hire_requests_status_created_at
  ON public.hire_requests(status, created_at DESC);
