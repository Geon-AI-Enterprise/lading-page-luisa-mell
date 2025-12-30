-- ============================================
-- Instituto Luisa Mell - Database Schema
-- Tabelas para formulários de denúncia e voluntariado
-- Execute estas queries no Supabase SQL Editor
-- ============================================

-- =============================================
-- TABELA: reports (Denúncias)
-- =============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_email VARCHAR(255) NOT NULL,
    reporter_whatsapp VARCHAR(20) NOT NULL,
    incident_address TEXT NOT NULL,
    description TEXT NOT NULL,
    proof_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'action_taken', 'closed', 'invalid')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_email ON reports(reporter_email);

-- RLS (Row Level Security) - apenas admin pode ler/modificar
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA: volunteers (Voluntários)
-- =============================================
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    whatsapp VARCHAR(20) NOT NULL,
    state VARCHAR(2) NOT NULL,
    volunteer_role VARCHAR(50) NOT NULL CHECK (volunteer_role IN ('resgates', 'clinica', 'eventos', 'comunicacao', 'administrativo')),
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'active', 'inactive', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_created_at ON volunteers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_state ON volunteers(state);
CREATE INDEX IF NOT EXISTS idx_volunteers_role ON volunteers(volunteer_role);

-- RLS (Row Level Security) - apenas admin pode ler/modificar
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_volunteers_updated_at
    BEFORE UPDATE ON volunteers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLÍTICAS DE ACESSO (RLS Policies)
-- Descomente se quiser configurar acesso via RLS
-- =============================================

-- Permitir que service_role (Edge Functions) insira dados
-- CREATE POLICY "Service role can insert reports" ON reports
--     FOR INSERT TO service_role WITH CHECK (true);

-- CREATE POLICY "Service role can insert volunteers" ON volunteers
--     FOR INSERT TO service_role WITH CHECK (true);

-- Permitir que administradores vejam e modifiquem
-- CREATE POLICY "Admins can view reports" ON reports
--     FOR SELECT TO authenticated USING (
--         auth.jwt() ->> 'role' = 'admin'
--     );

-- CREATE POLICY "Admins can view volunteers" ON volunteers
--     FOR SELECT TO authenticated USING (
--         auth.jwt() ->> 'role' = 'admin'
--     );

-- =============================================
-- DADOS DE TESTE (Opcional)
-- =============================================

-- INSERT INTO reports (reporter_name, reporter_email, reporter_whatsapp, incident_address, description)
-- VALUES (
--     'Teste Usuario',
--     'teste@example.com',
--     '(11) 99999-9999',
--     'Rua de Teste, 123 - São Paulo, SP',
--     'Esta é uma denúncia de teste para verificar o funcionamento do sistema.'
-- );

-- INSERT INTO volunteers (fullname, email, whatsapp, state, volunteer_role, consent_given)
-- VALUES (
--     'Voluntário Teste',
--     'voluntario@example.com',
--     '(11) 98888-8888',
--     'sp',
--     'resgates',
--     true
-- );
