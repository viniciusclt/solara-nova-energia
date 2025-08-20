-- Políticas de Storage para o bucket 'training-content'
-- Execute estas políticas após criar o bucket no painel do Supabase

-- Política para permitir upload de arquivos (INSERT)
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'training-content' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir visualização de arquivos (SELECT)
CREATE POLICY "Usuários autenticados podem visualizar arquivos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'training-content' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir atualização de arquivos (UPDATE)
CREATE POLICY "Proprietários podem atualizar arquivos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'training-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'training-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir exclusão de arquivos (DELETE)
CREATE POLICY "Proprietários podem deletar arquivos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'training-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Estrutura de pastas sugerida no bucket:
-- training-content/
-- ├── {user_id}/
-- │   ├── videos/
-- │   │   ├── {module_id}/
-- │   │   │   └── {video_id}.mp4
-- │   ├── playbooks/
-- │   │   ├── {module_id}/
-- │   │   │   └── {playbook_id}.pdf
-- │   ├── thumbnails/
-- │   │   └── {video_id}.jpg
-- │   └── certificates/
-- │       └── {certificate_id}.pdf

