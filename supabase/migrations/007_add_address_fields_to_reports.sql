-- ============================================
-- Instituto Luisa Mell - Database Migration
-- Adiciona campos de endereço estruturados na tabela reports
-- Execute estas queries no Supabase SQL Editor
-- ============================================

-- =============================================
-- ADICIONAR CAMPOS DE ENDEREÇO ESTRUTURADOS
-- =============================================

-- Campo para CEP
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS address_cep VARCHAR(8);

-- Campo para logradouro (rua/avenida)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);

-- Campo para número
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);

-- Campo para complemento
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);

-- Campo para bairro
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);

-- Campo para cidade
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);

-- Campo para estado (UF)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);

-- Campo para tipo de denúncia (se não existir)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'other';

-- =============================================
-- ÍNDICES PARA OS NOVOS CAMPOS
-- =============================================

-- Índice para cidade (útil para filtrar por localização)
CREATE INDEX IF NOT EXISTS idx_reports_address_city 
ON reports(address_city);

-- Índice para estado (útil para filtrar por localização)
CREATE INDEX IF NOT EXISTS idx_reports_address_state 
ON reports(address_state);

-- Índice para tipo de denúncia
CREATE INDEX IF NOT EXISTS idx_reports_report_type 
ON reports(report_type);

-- Índice composto para busca por localização
CREATE INDEX IF NOT EXISTS idx_reports_location 
ON reports(address_state, address_city);

-- =============================================
-- COMENTÁRIOS NOS CAMPOS (para documentação)
-- =============================================

COMMENT ON COLUMN reports.address_cep IS 'CEP do local da ocorrência (8 dígitos, sem formatação)';
COMMENT ON COLUMN reports.address_street IS 'Logradouro (rua, avenida, etc.)';
COMMENT ON COLUMN reports.address_number IS 'Número do endereço';
COMMENT ON COLUMN reports.address_complement IS 'Complemento (apto, bloco, etc.)';
COMMENT ON COLUMN reports.address_neighborhood IS 'Bairro';
COMMENT ON COLUMN reports.address_city IS 'Cidade';
COMMENT ON COLUMN reports.address_state IS 'Estado (UF - 2 caracteres)';
COMMENT ON COLUMN reports.report_type IS 'Tipo de denúncia: abandono, maus_tratos, negligencia, acumulador, outros';
