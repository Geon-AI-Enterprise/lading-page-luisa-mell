// ========================================
// Edge Function: get-events
// Instituto Luisa Mell - API Segura
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Reaproveita o mesmo mecanismo de CORS e lista de domínios permitidos
const ALLOWED_ORIGINS = [
  'https://institutoluisamell.com',
  'https://www.institutoluisamell.com',
  'https://institutoluisamell.org',
  'https://www.institutoluisamell.org',
  'https://luisamell.com',
  'https://www.luisamell.com',
  'https://instituto-luisa-mell.vercel.app',
  'https://instituto-luisa-mell.netlify.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
]

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (origin === 'null') return true
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*')
      return new RegExp(`^${pattern}$`).test(origin)
    }
    return allowed === origin
  })
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  }
}

interface EventFilters {
  id?: string
  start?: string
  end?: string
  upcoming?: boolean
  search?: string
  venue?: string
  limit?: number
  offset?: number
}

console.log("📅 Edge Function get-events iniciada!")

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method !== 'OPTIONS' && !isAllowedOrigin(origin)) {
    console.warn(`⚠️ Origem não permitida: ${origin}`)
    return new Response(JSON.stringify({ success: false, error: 'Origem não permitida' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let filters: EventFilters = {}

    if (req.method === 'POST') {
      try { filters = await req.json() } catch { filters = {} }
    } else if (req.method === 'GET') {
      const url = new URL(req.url)
      filters = {
        id: url.searchParams.get('id') || undefined,
        start: url.searchParams.get('start') || undefined,
        end: url.searchParams.get('end') || undefined,
        upcoming: url.searchParams.get('upcoming') === 'true' ? true : undefined,
        search: url.searchParams.get('search') || undefined,
        venue: url.searchParams.get('venue') || undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      }

      Object.keys(filters).forEach(key => {
        if ((filters as any)[key] === undefined || (filters as any)[key] === null) {
          delete (filters as any)[key]
        }
      })
    }

    console.log('🔎 Filtros recebidos:', filters)

    let query = supabaseAdmin.from('events').select('*')

    if (filters.id) {
      query = query.eq('id', filters.id)
    } else {
      // Somente eventos públicos por padrão
      query = query.eq('is_public', true)

      // Filtro por intervalo de datas
      if (filters.start && filters.end) {
        query = query.gte('start_at', filters.start).lte('start_at', filters.end)
      } else if (filters.start) {
        query = query.gte('start_at', filters.start)
      } else if (filters.end) {
        query = query.lte('start_at', filters.end)
      }

      // Upcoming: eventos a partir de agora
      if (filters.upcoming) {
        query = query.gte('start_at', new Date().toISOString())
      }

      // Buscar por título/descrição
      if (filters.search) {
        const term = `%${filters.search}%`
        query = query.or(`title.ilike.${term},description.ilike.${term}`)
      }

      if (filters.venue) {
        query = query.eq('venue', filters.venue)
      }
    }

    query = query.order('start_at', { ascending: true })

    const limit = filters.limit || 20
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + limit - 1)
    } else {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro na query get-events:', error)
      throw error
    }

    console.log(`✅ Retornando ${data?.length || 0} eventos`)

    return new Response(JSON.stringify({ success: true, data: data || [], count: data?.length || 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('❌ Erro na Edge Function get-events:', error)
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', data: [] }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})

/*
  Exemplo de uso local:
  curl "http://127.0.0.1:54321/functions/v1/get-events?upcoming=true&limit=10"
*/
