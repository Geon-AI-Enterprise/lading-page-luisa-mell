-- ============================================
-- Instituto Luisa Mell - Database Migration
-- Adiciona campo motivation na tabela volunteers
-- Execute estas queries no Supabase SQL Editor
-- ============================================

-- Campo para motivação do voluntário
ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS motivation TEXT;

-- Comentário no campo
COMMENT ON COLUMN volunteers.motivation IS 'Motivação do voluntário para ajudar o instituto';
