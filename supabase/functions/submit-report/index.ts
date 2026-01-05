// ========================================
// Edge Function: submit-report
// Instituto Luisa Mell - Formulário de Denúncia
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts"

interface ProofFile {
  name: string
  type: string
  base64: string
}

interface AddressData {
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}

interface ReportData {
  name: string
  email: string
  address: string
  addressData?: AddressData
  whatsapp: string
  message: string
  reportType?: string
  proofFile?: ProofFile
}

console.log("🚨 Edge Function submit-report iniciada!")

/**
 * Decode base64 to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Generate unique filename
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop() || 'jpg'
  return `report_${timestamp}_${random}.${extension}`
}

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

    // Upload do arquivo de prova se existir
    let proofUrl: string | null = null
    
    if (data.proofFile && data.proofFile.base64) {
      try {
        const fileName = generateFileName(data.proofFile.name)
        const filePath = `reports/${fileName}`
        const fileData = base64ToUint8Array(data.proofFile.base64)
        
        console.log(`📤 Fazendo upload do arquivo: ${filePath}`)
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('reports')
          .upload(filePath, fileData, {
            contentType: data.proofFile.type,
            upsert: false
          })
        
        if (uploadError) {
          console.error("❌ Erro no upload:", uploadError)
          // Continue sem a prova se houver erro no upload
        } else {
          // Gerar URL pública
          const { data: urlData } = supabaseAdmin
            .storage
            .from('reports')
            .getPublicUrl(filePath)
          
          proofUrl = urlData.publicUrl
          console.log(`✅ Arquivo enviado: ${proofUrl}`)
        }
      } catch (uploadErr) {
        console.error("❌ Erro ao processar upload:", uploadErr)
        // Continue sem a prova
      }
    }

    // Inserir no banco
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_name: data.name,
        reporter_email: data.email,
        reporter_whatsapp: data.whatsapp,
        incident_address: data.address,
        // Structured address fields
        address_cep: data.addressData?.cep || null,
        address_street: data.addressData?.street || null,
        address_number: data.addressData?.number || null,
        address_complement: data.addressData?.complement || null,
        address_neighborhood: data.addressData?.neighborhood || null,
        address_city: data.addressData?.city || null,
        address_state: data.addressData?.state || null,
        description: data.message,
        report_type: data.reportType || 'other',
        proof_url: proofUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao salvar denúncia:", error)
      throw error
    }

    console.log(`✅ Denúncia registrada: ${report.id}, proof_url: ${proofUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Denúncia enviada com sucesso! Entraremos em contato em breve.',
        reportId: report.id,
        proofUrl: proofUrl // Retornar a URL para debug
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
