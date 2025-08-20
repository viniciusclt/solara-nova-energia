# 🚀 Guia de Deploy Manual da Edge Function sync-google-sheets

## 📋 Situação Atual

A Edge Function `sync-google-sheets` está retornando erro 500:
```
InvalidWorkerCreation: worker boot error: failed to read path: No such file or directory (os error 2)
```

Este erro indica que o arquivo da função não está sendo encontrado pelo runtime do Supabase, mesmo que o arquivo exista localmente.

## 🔧 Solução: Deploy Manual via Interface Web

### Passo 1: Acessar o Dashboard do Supabase

1. Abra seu navegador e acesse: **https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br**
2. Faça login no dashboard
3. Navegue até **Edge Functions** no menu lateral

### Passo 2: Criar/Atualizar a Edge Function

1. Clique em **"New Function"** ou encontre a função `sync-google-sheets` existente
2. Se for uma nova função:
   - Nome: `sync-google-sheets`
   - Verificar JWT: ✅ **Habilitado**

### Passo 3: Colar o Código da Função

Cole o código completo abaixo no editor:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface ImportLog {
  id?: string
  user_id: string
  spreadsheet_url: string
  status: 'processing' | 'completed' | 'failed'
  total_rows?: number
  processed_rows?: number
  error_message?: string
  created_at?: string
  updated_at?: string
}

interface Lead {
  id?: string
  user_id: string
  company_id?: string
  nome: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  consumo_mensal?: number
  status?: string
  origem?: string
  observacoes?: string
  created_at?: string
  updated_at?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // Parse request body
    const { spreadsheetUrl } = await req.json()
    
    if (!spreadsheetUrl) {
      throw new Error('Spreadsheet URL is required')
    }

    // Create import log
    const importLog: ImportLog = {
      user_id: user.id,
      spreadsheet_url: spreadsheetUrl,
      status: 'processing'
    }

    const { data: logData, error: logError } = await supabase
      .from('import_logs')
      .insert(importLog)
      .select()
      .single()

    if (logError) {
      console.error('Error creating import log:', logError)
      throw new Error('Failed to create import log')
    }

    const logId = logData.id

    try {
      // Extract spreadsheet ID from URL
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
      if (!spreadsheetId) {
        throw new Error('Invalid Google Sheets URL')
      }

      // Fetch data from Google Sheets
      const sheetsData = await fetchGoogleSheetsData(spreadsheetId)
      
      if (!sheetsData || sheetsData.length === 0) {
        throw new Error('No data found in the spreadsheet')
      }

      // Process and validate data
      const leads: Lead[] = []
      const errors: string[] = []

      for (let i = 0; i < sheetsData.length; i++) {
        try {
          const lead = processRow(sheetsData[i], user.id)
          if (lead) {
            leads.push(lead)
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`)
        }
      }

      if (leads.length === 0) {
        throw new Error('No valid leads found in the spreadsheet')
      }

      // Insert leads into database
      const { error: insertError } = await supabase
        .from('leads')
        .insert(leads)

      if (insertError) {
        console.error('Error inserting leads:', insertError)
        throw new Error('Failed to insert leads into database')
      }

      // Update import log with success
      await supabase
        .from('import_logs')
        .update({
          status: 'completed',
          total_rows: sheetsData.length,
          processed_rows: leads.length,
          error_message: errors.length > 0 ? errors.join('; ') : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Import completed successfully',
          totalRows: sheetsData.length,
          processedRows: leads.length,
          errors: errors.length > 0 ? errors : undefined
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } catch (error) {
      // Update import log with error
      await supabase
        .from('import_logs')
        .update({
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId)

      throw error
    }

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function extractSpreadsheetId(url: string): string | null {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

async function fetchGoogleSheetsData(spreadsheetId: string): Promise<any[]> {
  try {
    // Try to get API key from database first, then fallback to environment
    let apiKey = Deno.env.get('GOOGLE_API_KEY')
    
    if (!apiKey) {
      // Try to get from database settings
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'google_api_key')
        .single()
      
      if (settings?.value) {
        apiKey = settings.value
      }
    }
    
    if (!apiKey) {
      throw new Error('Google API key not configured')
    }

    const range = 'A:Z' // Get all columns
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`)
    }
    
    const data = await response.json()
    
    if (!data.values || data.values.length === 0) {
      return []
    }
    
    // Convert to objects using first row as headers
    const headers = data.values[0]
    const rows = data.values.slice(1)
    
    return rows.map((row: any[]) => {
      const obj: any = {}
      headers.forEach((header: string, index: number) => {
        obj[header.toLowerCase().trim()] = row[index] || ''
      })
      return obj
    })
    
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error)
    throw error
  }
}

function processRow(row: any, userId: string): Lead | null {
  // Skip empty rows
  if (!row.nome && !row.name && !row.cliente) {
    return null
  }
  
  // Extract name (try different column names)
  const nome = row.nome || row.name || row.cliente || ''
  if (!nome.trim()) {
    throw new Error('Nome é obrigatório')
  }
  
  // Extract and validate email
  const email = row.email || row['e-mail'] || ''
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email inválido')
  }
  
  // Extract phone
  const telefone = row.telefone || row.phone || row.celular || ''
  
  // Extract consumption (try different column names and formats)
  let consumoMensal: number | undefined
  const consumoStr = row.consumo || row['consumo_mensal'] || row['consumo mensal'] || row.kwh || ''
  if (consumoStr) {
    const consumoNum = parseFloat(consumoStr.toString().replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(consumoNum) && consumoNum > 0) {
      consumoMensal = consumoNum
    }
  }
  
  // Extract address fields
  const endereco = row.endereco || row.address || row.rua || ''
  const cidade = row.cidade || row.city || ''
  const estado = row.estado || row.state || row.uf || ''
  const cep = row.cep || row['código postal'] || row.zipcode || ''
  
  // Extract other fields
  const observacoes = row.observacoes || row.notes || row.comentarios || ''
  
  const lead: Lead = {
    user_id: userId,
    nome: nome.trim(),
    email: email.trim() || undefined,
    telefone: telefone.trim() || undefined,
    endereco: endereco.trim() || undefined,
    cidade: cidade.trim() || undefined,
    estado: estado.trim() || undefined,
    cep: cep.trim() || undefined,
    consumo_mensal: consumoMensal,
    status: 'novo',
    origem: 'google_sheets',
    observacoes: observacoes.trim() || undefined
  }
  
  return lead
}
```

### Passo 4: Configurar Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no Supabase:

- `SUPABASE_URL`: https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br
- `SUPABASE_SERVICE_ROLE_KEY`: (sua service role key)
- `GOOGLE_API_KEY`: AIzaSyDKmKR0ukfEaMhAQh6y8r_FsjO_RHtrF6c (opcional)

### Passo 5: Salvar e Testar

1. Clique em **"Save"** ou **"Deploy"**
2. Aguarde alguns segundos para o deploy
3. Teste a função usando o endpoint: `https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br/functions/v1/sync-google-sheets`

## 🧪 Teste da Função

Após o deploy, você pode testar com:

```bash
curl -X POST "https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br/functions/v1/sync-google-sheets" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NDA4MjA2MCwiZXhwIjo0OTA5NzU1NjYwLCJyb2xlIjoiYW5vbiJ9.gXJF4pNV6yGWT59ZAZRj1f8w7cyqy34mIw9-e_Xh0KY" \
  -d '{"spreadsheetUrl": "https://docs.google.com/spreadsheets/d/SEU_SPREADSHEET_ID/edit"}'
```

## ✅ Verificação de Sucesso

Se tudo estiver funcionando, você deve receber uma resposta como:

```json
{
  "success": true,
  "message": "Import completed successfully",
  "totalRows": 10,
  "processedRows": 8
}
```

## 🔧 Troubleshooting

Se ainda houver problemas:

1. **Verifique os logs** da Edge Function no dashboard
2. **Confirme as permissões** da tabela `import_logs`
3. **Teste a Google API Key** separadamente
4. **Verifique se as tabelas** `leads` e `import_logs` existem

## 📞 Suporte

Se o problema persistir, entre em contato com o administrador do servidor Supabase (plexus.tec.br) para:

1. Verificar logs do servidor
2. Reiniciar o serviço de Edge Functions
3. Verificar configurações de rede/firewall

---

**Nota**: Este guia resolve o problema de "failed to read path" fazendo o deploy manual da função via interface web, contornando problemas de sincronização de arquivos no servidor.