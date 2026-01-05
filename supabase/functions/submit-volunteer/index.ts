// ========================================
// Edge Function: submit-volunteer
// Instituto Luisa Mell - Formulário de Voluntário
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts"

interface VolunteerData {
  state?: string
  volunteerRole: string
  fullname: string
  email: string
  whatsapp: string
  consent?: boolean
  motivation?: string
}

console.log("🤝 Edge Function submit-volunteer iniciada!")

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
    const data: VolunteerData = await req.json()

    // Validação básica
    if (!data.volunteerRole || !data.fullname || !data.email || !data.whatsapp) {
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
    const insertData: Record<string, unknown> = {
      fullname: data.fullname,
      email: data.email,
      whatsapp: data.whatsapp,
      state: data.state || 'SP',
      volunteer_role: data.volunteerRole,
      consent_given: data.consent !== false,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    // Adiciona motivation se existir (campo pode não existir na tabela ainda)
    // if (data.motivation) {
    //   insertData.motivation = data.motivation
    // }

    const { data: volunteer, error } = await supabaseAdmin
      .from('volunteers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao salvar voluntário:", error)
      throw error
    }

    console.log(`✅ Voluntário registrado: ${volunteer.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cadastro realizado com sucesso! Entraremos em contato em breve.',
        volunteerId: volunteer.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("❌ Erro na Edge Function:", error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar cadastro. Tente novamente mais tarde.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
