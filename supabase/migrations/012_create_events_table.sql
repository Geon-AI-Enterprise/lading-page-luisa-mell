-- ============================================
-- Instituto Luisa Mell - Tabela de Eventos
-- Migração para criar tabela de eventos
-- ============================================

-- =============================================
-- TABELA: events (Eventos/Ações)
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    venue VARCHAR(255),
    address TEXT,
    image_url TEXT,
    signup_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    all_day BOOLEAN DEFAULT FALSE,
    max_participants INTEGER,
    event_type VARCHAR(50) DEFAULT 'general' CHECK (event_type IN ('adoption_fair', 'vaccination', 'fundraising', 'volunteer', 'education', 'general')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed', 'postponed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para melhor performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON public.events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);

-- =============================================
-- FUNÇÃO AUXILIAR: Extrair data de timestamp (IMMUTABLE para usar em índice)
-- =============================================
CREATE OR REPLACE FUNCTION public.extract_date_immutable(ts TIMESTAMPTZ)
RETURNS DATE AS $$
BEGIN
    RETURN ts::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Índice para busca de eventos por data (para verificar conflitos)
CREATE INDEX IF NOT EXISTS idx_events_date_only ON public.events(public.extract_date_immutable(start_at));

-- =============================================
-- FUNÇÃO: Verificar conflito de eventos no mesmo dia
-- Impede que dois eventos sejam agendados para o mesmo dia
-- =============================================
CREATE OR REPLACE FUNCTION public.check_event_date_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se já existe um evento no mesmo dia (excluindo o próprio registro em caso de update)
    IF EXISTS (
        SELECT 1 FROM public.events 
        WHERE public.extract_date_immutable(start_at) = public.extract_date_immutable(NEW.start_at)
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND status NOT IN ('cancelled')
    ) THEN
        RAISE EXCEPTION 'Já existe um evento agendado para esta data. Por favor, escolha outra data.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Verificar conflito antes de INSERT ou UPDATE
-- =============================================
DROP TRIGGER IF EXISTS trigger_check_event_date_conflict ON public.events;
CREATE TRIGGER trigger_check_event_date_conflict
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.check_event_date_conflict();

-- =============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =============================================
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para events
-- Qualquer pessoa pode ver eventos públicos
CREATE POLICY "Qualquer pessoa pode ver eventos públicos" ON public.events
    FOR SELECT USING (is_public = true);

-- Usuários autenticados podem ver todos os eventos
CREATE POLICY "Usuários autenticados podem ver todos eventos" ON public.events
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Apenas usuários autenticados podem inserir eventos
CREATE POLICY "Apenas usuários autenticados podem inserir eventos" ON public.events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas usuários autenticados podem atualizar eventos
CREATE POLICY "Apenas usuários autenticados podem atualizar eventos" ON public.events
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Apenas usuários autenticados podem deletar eventos
CREATE POLICY "Apenas usuários autenticados podem deletar eventos" ON public.events
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =============================================
-- STORAGE BUCKET para imagens de eventos
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Política para upload de imagens de eventos
CREATE POLICY "Usuários autenticados podem fazer upload de imagens de eventos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'events' AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Qualquer pessoa pode ver imagens de eventos" ON storage.objects
    FOR SELECT USING (bucket_id = 'events');

-- =============================================
-- DADOS DE EXEMPLO (opcional - descomente se quiser)
-- =============================================
/*
INSERT INTO public.events (title, description, start_at, end_at, venue, is_public, event_type)
VALUES 
    ('Feira de Adoção - Parque Ibirapuera', 'Venha conhecer nossos peludos disponíveis para adoção!', '2026-01-15 10:00:00-03', '2026-01-15 16:00:00-03', 'Parque Ibirapuera', true, 'adoption_fair'),
    ('Campanha de Vacinação', 'Vacinação gratuita para cães e gatos', '2026-01-22 09:00:00-03', '2026-01-22 17:00:00-03', 'Sede do Instituto', true, 'vaccination'),
    ('Bazar Solidário', 'Ajude nossos animais! Todo lucro revertido para o Instituto', '2026-02-01 10:00:00-03', '2026-02-01 18:00:00-03', 'Centro de Eventos', true, 'fundraising');
*/
