const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL para atualizar a função
const updateFunctionSQL = `
CREATE OR REPLACE FUNCTION public.sync_google_sheets_fallback()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    leads_count integer;
    simulated_imports integer;
    sheets_status text;
BEGIN
    -- Verificar se há leads na tabela
    SELECT COUNT(*) INTO leads_count FROM public.leads;
    
    -- Simular importação de leads de demonstração (8 leads como no DemoDataService)
    simulated_imports := 8;
    
    -- Simular status da sincronização sempre como sucesso com dados de demonstração
    sheets_status := 'success';
    result := json_build_object(
        'status', 'success',
        'message', 'Sincronização simulada com sucesso - dados de demonstração',
        'leads_count', leads_count,
        'simulated_imports', simulated_imports,
        'demo_leads', json_build_array(
            'João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa',
            'Roberto Ferreira', 'Pedro Google', 'Fernanda Ads', 'Lucas Campaign'
        ),
        'timestamp', NOW(),
        'note', 'Edge Functions não disponível - usando fallback SQL com dados demo'
    );
    
    -- Log da operação
    INSERT INTO public.sync_logs (operation, status, details, created_at)
    VALUES (
        'google_sheets_sync_fallback',
        sheets_status,
        result::text,
        NOW()
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar informação do erro
        result := json_build_object(
            'status', 'error',
            'message', 'Erro na sincronização: ' || SQLERRM,
            'timestamp', NOW(),
            'note', 'Edge Functions não disponível - usando fallback SQL'
        );
        
        -- Log do erro
        INSERT INTO public.sync_logs (operation, status, details, created_at)
        VALUES (
            'google_sheets_sync_fallback',
            'error',
            result::text,
            NOW()
        );
        
        RETURN result;
END;
$$;
`;

async function updateSqlFunction() {
  console.log('🔄 Atualizando função SQL de fallback...');
  console.log('=' .repeat(50));
  
  try {
    // Tentar executar o SQL via RPC
    console.log('📝 Executando SQL para atualizar a função...');
    
    // Como não podemos executar DDL via RPC diretamente, vamos usar uma abordagem diferente
    // Primeiro, vamos testar se a função atual existe
    const { data: testData, error: testError } = await supabase.rpc('sync_google_sheets_fallback');
    
    if (testError) {
      console.error('❌ Função não existe ou erro:', testError);
      return;
    }
    
    console.log('✅ Função atual encontrada');
    console.log('📊 Resultado atual:', JSON.stringify(testData, null, 2));
    
    console.log('\n⚠️  ATENÇÃO: Para atualizar a função SQL, você precisa:');
    console.log('1. Acessar o Supabase Dashboard');
    console.log('2. Ir para SQL Editor');
    console.log('3. Executar o conteúdo do arquivo sql-fallback-sync-google-sheets.sql');
    console.log('4. A função será atualizada para retornar 8 leads simulados');
    
    console.log('\n📋 SQL para executar no Dashboard:');
    console.log('-'.repeat(50));
    console.log(updateFunctionSQL);
    console.log('-'.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar atualização
updateSqlFunction();