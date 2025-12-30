// ========================================
// Edge Function: submit-report
// Instituto Luisa Mell - Formulário de Denúncia
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts"

interface ReportData {
  name: string
  email: string
  address: string
  whatsapp: string
  message: string
  proofUrl?: string
}

console.log("🚨 Edge Function submit-report iniciada!")

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verificar origem
  if (!isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Origem não permitida' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse do body
    const data: ReportData = await req.json()

    // Validação básica
    if (!data.name || !data.email || !data.address || !data.whatsapp || !data.message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'E-mail inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inserir no banco
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_name: data.name,
        reporter_email: data.email,
        reporter_whatsapp: data.whatsapp,
        incident_address: data.address,
        description: data.message,
        proof_url: data.proofUrl || null,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao salvar denúncia:", error)
      throw error
    }

    console.log(`✅ Denúncia registrada: ${report.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Denúncia enviada com sucesso! Entraremos em contato em breve.',
        reportId: report.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("❌ Erro na Edge Function:", error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar denúncia. Tente novamente mais tarde.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
