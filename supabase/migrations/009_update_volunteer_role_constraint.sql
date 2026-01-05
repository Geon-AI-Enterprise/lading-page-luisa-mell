-- ============================================
-- Instituto Luisa Mell - Database Migration
-- Atualiza CHECK constraint para volunteer_role
-- Execute estas queries no Supabase SQL Editor
-- ============================================

-- Primeiro, remover o constraint existente
ALTER TABLE volunteers DROP CONSTRAINT IF EXISTS volunteers_volunteer_role_check;

-- Adicionar novo constraint com todos os valores válidos
ALTER TABLE volunteers ADD CONSTRAINT volunteers_volunteer_role_check 
CHECK (volunteer_role IN (
  'resgates', 
  'clinica', 
  'eventos', 
  'comunicacao', 
  'administrativo',
  'manutencao',
  'cuidados',
  'socializacao',
  'outros'
));

-- Adiciona campo motivation se não existir
ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS motivation TEXT;

-- Comentários nos campos
COMMENT ON COLUMN volunteers.volunteer_role IS 'Área de interesse: resgates, clinica, eventos, comunicacao, administrativo, manutencao, cuidados, socializacao, outros';
COMMENT ON COLUMN volunteers.motivation IS 'Motivação do voluntário para ajudar o instituto';
