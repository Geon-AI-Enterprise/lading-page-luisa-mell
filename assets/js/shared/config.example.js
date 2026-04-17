// ========================================
// Configuração do Ambiente - EXEMPLO
// Instituto Luisa Mell
// ========================================
// 
// INSTRUÇÕES:
// 1. Copie este arquivo para: assets/js/shared/config.js
// 2. Substitua os valores pelas suas chaves reais
// 3. NÃO commite o config.js no Git (já está no .gitignore)
// 4. O ambiente é detectado automaticamente pelo hostname:
//    - localhost / 127.0.0.1 → development
//    - *.vercel.app / *.netlify.app → staging
//    - demais → production
//

(function () {
    const hostname = window.location.hostname;

    // Credenciais compartilhadas (mesmo banco para todos os ambientes)
    const SUPABASE_URL = 'https://SEU_PROJECT_ID.supabase.co';
    const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';
    const EDGE_FUNCTION_BASE = 'https://SEU_PROJECT_ID.supabase.co/functions/v1';

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
