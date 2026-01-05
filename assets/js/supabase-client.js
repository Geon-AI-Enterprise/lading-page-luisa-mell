// ========================================
// API Client - Edge Function Segura
// Instituto Luisa Mell
// ========================================

// Configuração carregada de config.js (não commitado no Git)
const getConfig = () => window.APP_CONFIG || {};
const EDGE_FUNCTION_URL = () => `${getConfig().EDGE_FUNCTION_BASE || ''}/get-animals`;
const SUPABASE_ANON_KEY = () => getConfig().SUPABASE_ANON_KEY || '';

/**
 * Busca animais via Edge Function (método seguro)
 * @param {Object} filters - Filtros de busca
 * @returns {Promise<Object>} Resposta da API
 */
export async function fetchAnimalsSecure(filters = {}) {
    try {
        const response = await fetch(EDGE_FUNCTION_URL(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY()}`,
                'apikey': SUPABASE_ANON_KEY()
            },
            body: JSON.stringify(filters)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar animais');
        }

        return result;

    } catch (error) {
        console.error('❌ Erro ao buscar animais:', error);
        throw error;
    }
}

/**
 * Busca animais via GET com query string
 * @param {Object} filters - Filtros de busca
 * @returns {Promise<Object>} Resposta da API
 */
export async function fetchAnimalsGet(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        const url = params.toString() 
            ? `${EDGE_FUNCTION_URL()}?${params.toString()}`
            : EDGE_FUNCTION_URL();
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY()}`,
                'apikey': SUPABASE_ANON_KEY()
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar animais');
        }

        return result;

    } catch (error) {
        console.error('❌ Erro ao buscar animais:', error);
        throw error;
    }
}

/**
 * Testa conexão com a Edge Function
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
    try {
        const result = await fetchAnimalsSecure({ limit: 1 });
        console.log('✅ Conexão com Edge Function estabelecida!');
        return true;
    } catch (error) {
        console.error('❌ Falha na conexão:', error);
        return false;
    }
}

// Exportar URL para debug (seguro - é apenas a URL pública)
export const getEndpointUrl = () => EDGE_FUNCTION_URL();

