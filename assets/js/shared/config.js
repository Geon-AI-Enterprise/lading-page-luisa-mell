// ========================================
// Configuração do Ambiente
// Instituto Luisa Mell
// ========================================

// Detecta o ambiente automaticamente pelo hostname
(function () {
    const hostname = window.location.hostname;

    // Credenciais compartilhadas (mesmo banco para todos os ambientes)
    const SUPABASE_URL = 'https://iakcrxcpumsffcogmbhz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha2NyeGNwdW1zZmZjb2dtYmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDQ0NjIsImV4cCI6MjA4MjYyMDQ2Mn0.r5HGvjc1mtoONDS0dpKW78w8XXfEohTNFGwbAPx2cso';
    const EDGE_FUNCTION_BASE = 'https://iakcrxcpumsffcogmbhz.supabase.co/functions/v1';

    // Determina o ambiente
    let ENV = 'production';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        ENV = 'development';
    } else if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
        ENV = 'staging';
    }

    window.APP_CONFIG = {
        ENV,
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        EDGE_FUNCTION_BASE,
    };

    if (ENV !== 'production') {
        console.log(`🔧 Ambiente: ${ENV} | Host: ${hostname}`);
    }
})();
