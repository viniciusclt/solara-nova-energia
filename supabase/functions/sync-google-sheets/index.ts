import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleSheetsSettings {
  spreadsheetUrl: string;
  autoSync: boolean;
  syncInterval: number;
  sheetName: string;
  columnMapping: {
    name: string;
    email: string;
    phone: string;
    cpfCnpj: string;
    address: string;
    tipoFornecimento: string;
    consumoMedio: string;
    incrementoConsumo: string;
    // Consumo mensal (Jan-Dez)
    consumoJan: string;
    consumoFev: string;
    consumoMar: string;
    consumoAbr: string;
    consumoMai: string;
    consumoJun: string;
    consumoJul: string;
    consumoAgo: string;
    consumoSet: string;
    consumoOut: string;
    consumoNov: string;
    consumoDez: string;
    // Campos adicionais de endereço
    cep: string;
    cidade: string;
    estado: string;
    bairro: string;
    rua: string;
    numero: string;
    // Campos elétricos adicionais
    tensaoAlimentacao: string;
    modalidadeTarifaria: string;
    numeroCliente: string;
    numeroInstalacao: string;
    cdd: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from request
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { settings }: { settings: GoogleSheetsSettings } = await req.json();
    
    console.log('Starting Google Sheets sync for user:', user.id);
    console.log('Settings:', settings);

    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(settings.spreadsheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    // Get user's company info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    // Create import log
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        user_id: user.id,
        company_id: profile.company_id,
        source_type: 'google_sheets',
        source_url: settings.spreadsheetUrl,
        import_settings: settings,
        status: 'in_progress'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating import log:', logError);
      throw logError;
    }

    try {
      // Fetch data from Google Sheets
      const sheetsData = await fetchGoogleSheetsData(spreadsheetId, settings);
      
      console.log(`Fetched ${sheetsData.length} rows from Google Sheets`);

      // Process and validate data
      const leads = sheetsData.map((row, index) => {
        try {
          return processRow(row, settings, user.id, profile.company_id);
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error);
          return null;
        }
      }).filter(lead => lead !== null);

      console.log(`Processed ${leads.length} valid leads`);

      // Insert leads into database
      let successfulImports = 0;
      let failedImports = 0;
      const errors: string[] = [];

      for (const lead of leads) {
        try {
          const { error } = await supabaseClient
            .from('leads')
            .insert(lead);

          if (error) {
            failedImports++;
            errors.push(`Error inserting lead ${lead.name}: ${error.message}`);
          } else {
            successfulImports++;
          }
        } catch (error) {
          failedImports++;
          errors.push(`Error inserting lead: ${error}`);
        }
      }

      // Update import log
      await supabaseClient
        .from('import_logs')
        .update({
          total_records: sheetsData.length,
          successful_imports: successfulImports,
          failed_imports: failedImports,
          error_details: errors.length > 0 ? { errors } : null,
          status: failedImports > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', importLog.id);

      console.log(`Import completed: ${successfulImports} successful, ${failedImports} failed`);

      return new Response(JSON.stringify({
        success: true,
        totalRecords: sheetsData.length,
        successfulImports,
        failedImports,
        errors: errors.slice(0, 10) // Return first 10 errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Update import log with error
      await supabaseClient
        .from('import_logs')
        .update({
          status: 'failed',
          error_details: { error: error.message },
          completed_at: new Date().toISOString()
        })
        .eq('id', importLog.id);

      throw error;
    }

  } catch (error) {
    console.error('Error in sync-google-sheets function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function fetchGoogleSheetsData(spreadsheetId: string, settings: GoogleSheetsSettings): Promise<string[][]> {
  // First try to get API key from the database (user's saved key)
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let apiKey = null;
  
  // Try to get API key from integration_settings
  try {
    const { data: apiKeyData } = await supabaseClient
      .from('integration_settings')
      .select('settings')
      .eq('integration_type', 'google_api')
      .eq('is_active', true)
      .single();
    
    if (apiKeyData && (apiKeyData.settings as Record<string, unknown>).api_key) {
      apiKey = (apiKeyData.settings as Record<string, unknown>).api_key as string;
      console.log('Using user-configured API key');
    }
  } catch (error) {
    console.log('No user API key found, trying environment variable');
  }

  // Fallback to environment variable
  if (!apiKey) {
    apiKey = Deno.env.get('GOOGLE_API_KEY');
  }

  if (!apiKey) {
    throw new Error('Google API key not configured. Please add your API key in the settings.');
  }

  const range = `${settings.sheetName}!A:Z`; // Fetch all columns, up to Z
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  console.log('Fetching from URL:', url);

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Sheets API error:', errorText);
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { values?: string[][] };
  return data.values || [];
}

function processRow(row: string[], settings: GoogleSheetsSettings, userId: string, companyId: string) {
  const getValue = (column: string) => {
    const colIndex = columnToIndex(column);
    return row[colIndex] || '';
  };

  const getNumericValue = (column: string, defaultValue: number = 0) => {
    const value = getValue(column);
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const name = getValue(settings.columnMapping.name);
  if (!name || name.trim() === '') {
    throw new Error('Name is required');
  }

  // Get values with fallbacks
  const tipoFornecimento = getValue(settings.columnMapping.tipoFornecimento) || 'Monofásico';
  const consumoMedio = getNumericValue(settings.columnMapping.consumoMedio);
  const incrementoConsumo = getNumericValue(settings.columnMapping.incrementoConsumo);

  // Processar consumo mensal (Jan-Dez)
  const consumoMensal = [
    getNumericValue(settings.columnMapping.consumoJan),
    getNumericValue(settings.columnMapping.consumoFev),
    getNumericValue(settings.columnMapping.consumoMar),
    getNumericValue(settings.columnMapping.consumoAbr),
    getNumericValue(settings.columnMapping.consumoMai),
    getNumericValue(settings.columnMapping.consumoJun),
    getNumericValue(settings.columnMapping.consumoJul),
    getNumericValue(settings.columnMapping.consumoAgo),
    getNumericValue(settings.columnMapping.consumoSet),
    getNumericValue(settings.columnMapping.consumoOut),
    getNumericValue(settings.columnMapping.consumoNov),
    getNumericValue(settings.columnMapping.consumoDez)
  ];

  // Validar dados mensais
  const validatedConsumoMensal = consumoMensal.map(value => {
    // Garantir que valores negativos sejam convertidos para zero
    if (value < 0) return 0;
    
    // Garantir que valores não numéricos sejam convertidos para zero
    if (isNaN(value)) return 0;
    
    // Limitar valores extremamente altos (possíveis erros de digitação)
    // Considerando 100.000 kWh como limite razoável para consumo mensal
    if (value > 100000) return 100000;
    
    return value;
  });

  // Se não há dados mensais mapeados, usar array padrão ou média
  const hasMonthlyData = validatedConsumoMensal.some(value => value > 0);
  
  // Calcular média dos valores mensais para validação
  const monthlyAverage = hasMonthlyData 
    ? validatedConsumoMensal.reduce((sum, val) => sum + val, 0) / validatedConsumoMensal.filter(val => val > 0).length
    : 0;
  
  // Se temos consumo médio mas não temos dados mensais, distribuir o consumo médio pelos meses
  let finalConsumoMensal: number[];
  if (!hasMonthlyData && consumoMedio > 0) {
    // Distribuir o consumo médio pelos 12 meses com pequenas variações (±20%)
    finalConsumoMensal = Array(12).fill(0).map(() => {
      const variation = 0.8 + Math.random() * 0.4; // Variação entre 0.8 e 1.2 (±20%)
      return Math.round(consumoMedio * variation * 10) / 10; // Arredondar para 1 casa decimal
    });
  } else if (hasMonthlyData && Math.abs(monthlyAverage - consumoMedio) > consumoMedio * 0.5 && consumoMedio > 0) {
    // Se a média mensal difere muito do consumo médio informado (mais de 50%), 
    // normalizar os valores para que a média fique próxima ao consumo médio
    const normalizationFactor = consumoMedio / monthlyAverage;
    finalConsumoMensal = validatedConsumoMensal.map(val => 
      Math.round(val * normalizationFactor * 10) / 10
    );
    console.log(`Normalizing monthly consumption values by factor ${normalizationFactor.toFixed(2)}`);
  } else {
    finalConsumoMensal = hasMonthlyData ? validatedConsumoMensal : Array(12).fill(0);
  }

  // Processar campos de endereço detalhado
  const addressFields = {
    street: getValue(settings.columnMapping.address) || getValue(settings.columnMapping.rua) || '',
    city: getValue(settings.columnMapping.cidade) || '',
    state: getValue(settings.columnMapping.estado) || 'RJ',
    cep: getValue(settings.columnMapping.cep) || '',
    neighborhood: getValue(settings.columnMapping.bairro) || '',
    number: getValue(settings.columnMapping.numero) || ''
  };

  // Processar campos elétricos adicionais
  const tensaoAlimentacao = getValue(settings.columnMapping.tensaoAlimentacao) || '220V';
  const modalidadeTarifaria = getValue(settings.columnMapping.modalidadeTarifaria) || 'Convencional';
  const numeroCliente = getValue(settings.columnMapping.numeroCliente) || '';
  const numeroInstalacao = getValue(settings.columnMapping.numeroInstalacao) || '';
  const cdd = getNumericValue(settings.columnMapping.cdd);

  return {
    user_id: userId,
    company_id: companyId,
    name: name.trim(),
    email: getValue(settings.columnMapping.email),
    phone: getValue(settings.columnMapping.phone),
    cpf_cnpj: getValue(settings.columnMapping.cpfCnpj),
    address: addressFields,
    consumo_medio: consumoMedio,
    incremento_consumo: incrementoConsumo,
    source: 'google_sheets',
    source_ref: settings.spreadsheetUrl,
    // Use mapped values or defaults
    tipo_fornecimento: tipoFornecimento,
    cdd: cdd,
    tensao_alimentacao: tensaoAlimentacao,
    modalidade_tarifaria: modalidadeTarifaria,
    numero_cliente: numeroCliente,
    numero_instalacao: numeroInstalacao,
    consumo_mensal: finalConsumoMensal,
    comentarios: 'Importado do Google Sheets'
  };
}

function columnToIndex(column: string): number {
  // Convert Excel column letters to zero-based index
  // A=0, B=1, C=2, ..., Z=25, AA=26, etc.
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
}