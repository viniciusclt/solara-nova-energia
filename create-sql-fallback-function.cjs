require('dotenv').config();
const https = require('https');
const http = require('http');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Criando função SQL de fallback para sync-google-sheets');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// SQL para criar função de fallback
const createFallbackFunctionSQL = `
-- Função de fallback para sync-google-sheets
CREATE OR REPLACE FUNCTION sync_google_sheets_fallback(
  spreadsheet_url TEXT,
  user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  result JSON;
BEGIN
  -- Verificar se o usuário está autenticado
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  -- Verificar se a URL foi fornecida
  IF spreadsheet_url IS NULL OR spreadsheet_url = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Spreadsheet URL is required'
    );
  END IF;
  
  -- Criar log de importação
  INSERT INTO import_logs (user_id, spreadsheet_url, status)
  VALUES (user_id, spreadsheet_url, 'processing')
  RETURNING id INTO log_id;
  
  -- Simular processamento (em uma implementação real, aqui faria a chamada para Google Sheets)
  -- Por enquanto, retorna uma mensagem informativa
  
  -- Atualizar log com status de fallback
  UPDATE import_logs 
  SET 
    status = 'failed',
    error_message = 'Edge Function indisponível. Use o deploy manual via interface web.',
    updated_at = NOW()
  WHERE id = log_id;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', false,
    'error', 'Edge Function sync-google-sheets está indisponível',
    'message', 'Por favor, faça o deploy manual da Edge Function via interface web do Supabase',
    'guide_url', 'Consulte o arquivo manual-edge-function-deploy-guide.md',
    'log_id', log_id,
    'fallback', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, tentar atualizar o log
    BEGIN
      UPDATE import_logs 
      SET 
        status = 'failed',
        error_message = SQLERRM,
        updated_at = NOW()
      WHERE id = log_id;
    EXCEPTION
      WHEN OTHERS THEN
        NULL; -- Ignorar erros na atualização do log
    END;
    
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'fallback', true
    );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION sync_google_sheets_fallback TO authenticated;
GRANT EXECUTE ON FUNCTION sync_google_sheets_fallback TO anon;

-- Comentário explicativo
COMMENT ON FUNCTION sync_google_sheets_fallback IS 'Função de fallback temporária para sync-google-sheets enquanto a Edge Function não estiver disponível';
`;

// Função para executar SQL
async function executeSQL(sql, description) {
  console.log(`\n🔄 ${description}`);
  
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      }
    };
    
    const payload = JSON.stringify({ query: sql });
    const endpoint = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    
    console.log(`📡 Tentando endpoint: ${endpoint}`);
    
    const response = await makeRequest(endpoint, options, payload);
    
    console.log(`📊 Status: ${response.statusCode}`);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ SQL executado com sucesso!');
      return true;
    } else {
      console.log(`❌ Erro na execução:`, JSON.stringify(response.data, null, 2));
      
      // Tentar endpoint alternativo
      const altEndpoint = `${SUPABASE_URL}/rest/v1/rpc`;
      console.log(`\n🔄 Tentando endpoint alternativo: ${altEndpoint}`);
      
      const altPayload = JSON.stringify({
        sql: sql
      });
      
      const altResponse = await makeRequest(altEndpoint, options, altPayload);
      console.log(`📊 Status alternativo: ${altResponse.statusCode}`);
      
      if (altResponse.statusCode >= 200 && altResponse.statusCode < 300) {
        console.log('✅ SQL executado com sucesso via endpoint alternativo!');
        return true;
      } else {
        console.log(`❌ Erro no endpoint alternativo:`, JSON.stringify(altResponse.data, null, 2));
      }
      
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Erro na execução do SQL:`, error.message);
    return false;
  }
}

// Função para testar a função criada
async function testFallbackFunction() {
  console.log('\n🧪 Testando função de fallback...');
  
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    };
    
    const payload = JSON.stringify({
      spreadsheet_url: 'https://docs.google.com/spreadsheets/d/test/edit',
      user_id: '00000000-0000-0000-0000-000000000000' // UUID de teste
    });
    
    const endpoint = `${SUPABASE_URL}/rest/v1/rpc/sync_google_sheets_fallback`;
    
    const response = await makeRequest(endpoint, options, payload);
    
    console.log(`📊 Status do teste: ${response.statusCode}`);
    console.log(`📄 Resposta:`, JSON.stringify(response.data, null, 2));
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ Função de fallback está funcionando!');
      return true;
    } else {
      console.log('❌ Função de fallback não está funcionando');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  try {
    console.log('\n=== CRIAÇÃO DE FUNÇÃO SQL DE FALLBACK ===');
    
    // Executar SQL para criar a função
    const sqlSuccess = await executeSQL(createFallbackFunctionSQL, 'Criando função de fallback');
    
    if (!sqlSuccess) {
      console.log('\n⚠️  Não foi possível criar a função via API REST.');
      console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE:');
      console.log('1. Acesse o SQL Editor no dashboard do Supabase');
      console.log('2. Cole e execute o seguinte SQL:');
      console.log('\n```sql');
      console.log(createFallbackFunctionSQL);
      console.log('```\n');
      return;
    }
    
    // Aguardar um pouco
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Testar a função
    const testSuccess = await testFallbackFunction();
    
    // Resultado final
    console.log('\n=== RESULTADO FINAL ===');
    
    if (sqlSuccess && testSuccess) {
      console.log('🎉 Função de fallback criada e funcionando!');
      console.log('\n📋 COMO USAR:');
      console.log('1. No frontend, chame a função SQL em vez da Edge Function:');
      console.log(`   POST ${SUPABASE_URL}/rest/v1/rpc/sync_google_sheets_fallback`);
      console.log('2. A função retornará uma mensagem explicativa sobre o problema');
      console.log('3. Use o guia manual-edge-function-deploy-guide.md para corrigir definitivamente');
    } else if (sqlSuccess) {
      console.log('⚠️  Função criada mas com problemas no teste');
    } else {
      console.log('❌ Não foi possível criar a função automaticamente');
    }
    
    console.log('\n🔗 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Siga o guia: manual-edge-function-deploy-guide.md');
    console.log('2. 🔧 Faça o deploy manual da Edge Function via interface web');
    console.log('3. 🧪 Teste a Edge Function após o deploy manual');
    console.log('4. 🗑️  Remova a função de fallback quando a Edge Function estiver funcionando');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar
main();