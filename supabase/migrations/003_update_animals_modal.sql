-- ============================================
-- Instituto Luisa Mell - Animals Modal Schema
-- Campos adicionais para o modal de perfil do animal
-- Execute estas queries no Supabase SQL Editor
-- ============================================

-- =============================================
-- ALTERAR TABELA: animals (adicionar campos para modal)
-- =============================================

-- Foto de antes (resgate)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS photo_before_url TEXT;

-- Foto de depois (recuperado)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS photo_after_url TEXT;

-- Galeria de fotos (array de até 4 URLs)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- Descrição completa do animal
ALTER TABLE animals ADD COLUMN IF NOT EXISTS description TEXT;

-- Custo mensal de manutenção
ALTER TABLE animals ADD COLUMN IF NOT EXISTS monthly_cost DECIMAL(10,2);

-- Características/cuidados especiais (array de tags)
-- Valores possíveis: 'food', 'vet', 'medicine', 'hygiene', 'shelter'
ALTER TABLE animals ADD COLUMN IF NOT EXISTS care_features TEXT[] DEFAULT '{}';

-- =============================================
-- COMENTÁRIOS NAS COLUNAS
-- =============================================

COMMENT ON COLUMN animals.photo_before_url IS 'URL da foto do animal antes do resgate';
COMMENT ON COLUMN animals.photo_after_url IS 'URL da foto do animal após recuperação';
COMMENT ON COLUMN animals.gallery_urls IS 'Array com até 4 URLs de fotos adicionais';
COMMENT ON COLUMN animals.description IS 'Descrição completa do animal para o modal';
COMMENT ON COLUMN animals.monthly_cost IS 'Custo mensal de manutenção em R$';
COMMENT ON COLUMN animals.care_features IS 'Array de características de cuidado: food, vet, medicine, hygiene, shelter';

-- =============================================
-- ATUALIZAR DADOS DE EXEMPLO (se existirem)
-- =============================================

-- UPDATE animals 
-- SET 
--     photo_before_url = 'https://exemplo.com/antes.jpg',
--     photo_after_url = 'https://exemplo.com/depois.jpg',
--     gallery_urls = ARRAY['https://exemplo.com/foto1.jpg', 'https://exemplo.com/foto2.jpg'],
--     description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam convallis neque in lorem egestas, at ultrices erat pulvinar.',
--     monthly_cost = 196.60,
--     care_features = ARRAY['food', 'vet', 'medicine', 'hygiene', 'shelter']
-- WHERE id = 'seu-uuid-aqui';
