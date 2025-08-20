-- Remove obsolete columns from leads table
-- These columns were causing errors in Google Sheets sync

ALTER TABLE public.leads 
DROP COLUMN IF EXISTS concessionaria,
DROP COLUMN IF EXISTS grupo;

-- Add comment to document the change
COMMENT ON TABLE public.leads IS 'Leads table - removed obsolete concessionaria and grupo columns on 2025-01-17';