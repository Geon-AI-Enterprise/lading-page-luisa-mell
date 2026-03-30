// ========================================
// Configuração do Ambiente - EXEMPLO
// Instituto Luisa Mell
// ========================================
// 
// INSTRUÇÕES:
// 1. Copie este arquivo para: assets/js/config.js
// 2. Substitua os valores pelas suas chaves reais
// 3. NÃO commite o config.js no Git (já está no .gitignore)
// 4. Faça upload do config.js via FTP para o servidor
//

window.APP_CONFIG = {
    // URL base do seu projeto Supabase
    SUPABASE_URL: 'https://SEU_PROJECT_ID.supabase.co',
    
    // Chave pública (anon key) do Supabase
    // Encontre em: Supabase Dashboard > Settings > API > anon public
    SUPABASE_ANON_KEY: 'SUA_ANON_KEY_AQUI',
    
    // URL base das Edge Functions
    EDGE_FUNCTION_BASE: 'https://SEU_PROJECT_ID.supabase.co/functions/v1'
};
