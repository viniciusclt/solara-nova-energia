-- Create storage bucket for datasheets
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('datasheets', 'datasheets', true, false)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the datasheets bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  (
    'Public Read Access',
    '(bucket_id = ''datasheets''::text)',
    'datasheets'
  ),
  (
    'Authenticated Users can upload',
    '((bucket_id = ''datasheets''::text) AND (auth.role() = ''authenticated''::text))',
    'datasheets'
  ),
  (
    'Authenticated Users can update own files',
    '((bucket_id = ''datasheets''::text) AND (auth.role() = ''authenticated''::text))',
    'datasheets'
  ),
  (
    'Authenticated Users can delete own files',
    '((bucket_id = ''datasheets''::text) AND (auth.role() = ''authenticated''::text))',
    'datasheets'
  )
ON CONFLICT (name, bucket_id) DO NOTHING;