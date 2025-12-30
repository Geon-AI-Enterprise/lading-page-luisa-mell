// ========================================
// Edge Function: get-animals
// Instituto Luisa Mell - API Segura
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ========================================
// CONFIGURAÇÃO DE CORS - PRODUÇÃO
// ========================================

// Lista de domínios permitidos (Instituto Luisa Mell)
const ALLOWED_ORIGINS = [
  // Produção - Domínio Principal
  'https://institutoluisamell.com',
  'https://www.institutoluisamell.com',
  
  // Produção - Aliases
  'https://institutoluisamell.org',
  'https://www.institutoluisamell.org',
  'https://luisamell.com',
  'https://www.luisamell.com',
  
  // Staging/Preview (Vercel, Netlify, etc.)
  'https://instituto-luisa-mell.vercel.app',
  'https://instituto-luisa-mell.netlify.app',
  
  // Desenvolvimento local
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5173', // Vite
]

/**
 * Verifica se a origem é permitida
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  
  // Em desenvolvimento, permitir file:// protocol
  if (origin === 'null') return true // file:// protocol envia 'null'
  
  return ALLOWED_ORIGINS.some(allowed => {
    // Suporta wildcards para subdomínios (ex: *.vercel.app)
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*')
      return new RegExp(`^${pattern}$`).test(origin)
    }
    return allowed === origin
  })
}

/**
 * Retorna headers CORS baseado na origem
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight por 24h
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  }
}

// Interface para tipagem dos filtros
interface AnimalFilters {
  type?: 'dog' | 'cat'
  size?: 'p' | 'm' | 'g'
  gender?: 'male' | 'female'
  isPuppy?: boolean
  pageType?: 'adoption' | 'sponsorship'
  limit?: number
  offset?: number
}

console.log("🐾 Edge Function get-animals iniciada!")

Deno.serve(async (req) => {
  // Obter origem da requisição
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Verificar se origem é permitida (exceto para preflight)
  if (req.method !== 'OPTIONS' && !isAllowedOrigin(origin)) {
    console.warn(`⚠️ Origem não permitida: ${origin}`)
    return new Response(
      JSON.stringify({ success: false, error: 'Origem não permitida' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service_role (credenciais protegidas no servidor)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse dos filtros (suporta GET e POST)
    let filters: AnimalFilters = {}
    
    if (req.method === 'POST') {
      try {
        filters = await req.json()
      } catch {
        filters = {}
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url)
      filters = {
        type: url.searchParams.get('type') as 'dog' | 'cat' | undefined,
        size: url.searchParams.get('size') as 'p' | 'm' | 'g' | undefined,
        gender: url.searchParams.get('gender') as 'male' | 'female' | undefined,
        isPuppy: url.searchParams.get('isPuppy') === 'true' ? true : undefined,
        pageType: url.searchParams.get('pageType') as 'adoption' | 'sponsorship' | undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      }
      
      // Limpar valores undefined/null
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof AnimalFilters] === undefined || filters[key as keyof AnimalFilters] === null) {
          delete filters[key as keyof AnimalFilters]
        }
      })
    }

    console.log("📋 Filtros recebidos:", filters)

    // Construir query base
    let query = supabaseAdmin
      .from('animals')
      .select('*')
      .eq('status', 'available')

    // Aplicar filtro por tipo de página (adoção ou apadrinhamento)
    if (filters.pageType === 'adoption') {
      query = query.eq('available_for_adoption', true)
    } else if (filters.pageType === 'sponsorship') {
      query = query.eq('available_for_sponsorship', true)
    }

    // Aplicar filtro por tipo de animal
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    // Aplicar filtro por tamanho
    if (filters.size) {
      query = query.eq('size', filters.size)
    }

    // Aplicar filtro por gênero
    if (filters.gender) {
      query = query.eq('gender', filters.gender)
    }

    // Aplicar filtro por filhote
    if (filters.isPuppy !== undefined) {
      query = query.eq('is_puppy', filters.isPuppy)
    }

    // Ordenação (mais recentes primeiro)
    query = query.order('created_at', { ascending: false })

    // Paginação
    const limit = filters.limit || 12
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + limit - 1)
    } else {
      query = query.limit(limit)
    }

    // Executar query
    const { data, error } = await query

    if (error) {
      console.error("❌ Erro na query:", error)
      throw error
    }

    console.log(`✅ Retornando ${data?.length || 0} animais`)

    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        count: data?.length || 0,
        filters: filters
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error("❌ Erro na Edge Function:", error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: []
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
})

/* 
  Para invocar localmente:
  
  1. Inicie o Supabase local: npx supabase start
  2. Faça uma requisição HTTP:

  # GET - Buscar todos
  curl "http://127.0.0.1:54321/functions/v1/get-animals"

  # GET - Com filtros
  curl "http://127.0.0.1:54321/functions/v1/get-animals?type=dog&size=m"

  # POST - Com filtros no body
  curl -X POST "http://127.0.0.1:54321/functions/v1/get-animals" \
    -H "Content-Type: application/json" \
    -d '{"type": "dog", "pageType": "adoption"}'
*/

