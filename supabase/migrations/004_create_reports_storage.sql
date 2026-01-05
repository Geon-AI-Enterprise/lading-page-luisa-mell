-- ============================================
-- Instituto Luisa Mell - Storage Setup
-- Bucket para armazenar evidências de denúncias
-- ============================================

-- =============================================
-- PASSO 1: Criar o bucket via Dashboard do Supabase
-- =============================================
-- Acesse: Dashboard > Storage > New Bucket
-- Nome: reports
-- Public: ATIVADO (toggle ON)
-- File size limit: 10485760 (10MB)
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm

-- =============================================
-- PASSO 2: Execute as políticas abaixo no SQL Editor
-- =============================================

-- Política para permitir upload público (formulário de denúncia)
DROP POLICY IF EXISTS "Allow public uploads to reports bucket" ON storage.objects;
CREATE POLICY "Allow public uploads to reports bucket"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'reports');

-- Política para permitir leitura pública
DROP POLICY IF EXISTS "Allow public read access to reports bucket" ON storage.objects;
CREATE POLICY "Allow public read access to reports bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'reports');

-- Política para permitir que service_role faça tudo (Edge Functions)
DROP POLICY IF EXISTS "Allow service role full access to reports bucket" ON storage.objects;
CREATE POLICY "Allow service role full access to reports bucket"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'reports')
WITH CHECK (bucket_id = 'reports');

-- =============================================
-- PASSO 3: Verificar se o bucket foi criado
-- =============================================
-- Execute esta query para verificar:
-- SELECT * FROM storage.buckets WHERE id = 'reports';

-- =============================================
-- PASSO 4: Redeploy da Edge Function
-- =============================================
-- Execute no terminal:
-- cd lading-page-luisa-mell
-- supabase functions deploy submit-report

