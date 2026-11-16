-- ==============================================================================
-- MIGRATION: 20261116000002_add_technologies_canonical_key_and_indexes.sql
-- Description:
--   1. Adds canonical_key column to public.technologies for multi-layer
--      deduplication (race-safe DB enforcement alongside app-level matching).
--   2. Collision-safely backfills canonical_key onto canonical winner rows
--      so existing legacy duplicates do not break unique index creation.
--   3. Adds composite status/created_at index for fast paginated moderation
--      and listing queries, plus partial unique index on canonical_key.
-- ==============================================================================

ALTER TABLE public.technologies
  ADD COLUMN IF NOT EXISTS canonical_key TEXT;

CREATE INDEX IF NOT EXISTS idx_technologies_status_created_at
  ON public.technologies(status, created_at DESC);

WITH normalized AS (
  SELECT
    id,
    regexp_replace(
      lower(replace(replace(name, '++', 'plusplus'), '#', 'sharp')),
      '[^a-z0-9]',
      '',
      'g'
    ) AS computed_key,
    ROW_NUMBER() OVER (
      PARTITION BY regexp_replace(
        lower(replace(replace(name, '++', 'plusplus'), '#', 'sharp')),
        '[^a-z0-9]',
        '',
        'g'
      )
      ORDER BY
        CASE status
          WHEN 'approved' THEN 0
          WHEN 'pending' THEN 1
          ELSE 2
        END,
        is_featured DESC,
        created_at ASC,
        id ASC
    ) AS rn
  FROM public.technologies
  WHERE canonical_key IS NULL
)
UPDATE public.technologies t
SET canonical_key = n.computed_key
FROM normalized n
WHERE t.id = n.id
  AND n.rn = 1
  AND n.computed_key <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.technologies existing
    WHERE existing.canonical_key = n.computed_key
      AND existing.id <> t.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_technologies_canonical_key
  ON public.technologies(canonical_key)
  WHERE canonical_key IS NOT NULL AND canonical_key <> '';
