-- Migration: 20261115000001_add_robots_llms_txt_to_seo_settings.sql
-- Description: Persist editable robots.txt and llms.txt content directly in public.seo_settings

ALTER TABLE public.seo_settings
  ADD COLUMN IF NOT EXISTS robots_txt TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS llms_txt TEXT DEFAULT '';
