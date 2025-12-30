// ========================================
// Configuração CORS Compartilhada
// Instituto Luisa Mell
// ========================================

// Lista de domínios permitidos
export const ALLOWED_ORIGINS = [
  // Produção - Domínio Principal
  'https://institutoluisamell.com',
  'https://www.institutoluisamell.com',
  
  // Produção - Aliases
  'https://institutoluisamell.org',
  'https://www.institutoluisamell.org',
  'https://luisamell.com',
  'https://www.luisamell.com',
  
  // Staging/Preview
  'https://instituto-luisa-mell.vercel.app',
  'https://instituto-luisa-mell.netlify.app',
  
  // Desenvolvimento local
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
]

/**
 * Verifica se a origem é permitida
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (origin === 'null') return true // file:// protocol
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Retorna headers CORS
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
}
