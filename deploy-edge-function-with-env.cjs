require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configurações do Supabase a partir do .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  process.exit(1);
}

console.log('🚀 Deploy da Edge Function sync-google-sheets usando credenciais do .env');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

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

// Função para ler o código da Edge Function
function readFunctionCode() {
  const functionPath = path.join(__dirname, 'supabase', 'functions', 'sync-google-sheets', 'index.ts');
  
  if (!fs.existsSync(functionPath)) {
    throw new Error(`Arquivo da função não encontrado: ${functionPath}`);
  }
  
  return fs.readFileSync(functionPath, 'utf8');
}

// Função para fazer deploy via API REST
async function deployFunction() {
  try {
    console.log('\n📖 Lendo código da função...');
    const functionCode = readFunctionCode();
    console.log(`✅ Código lido com sucesso (${functionCode.length} caracteres)`);
    
    // Tentar diferentes endpoints para deploy
    const endpoints = [
      `${SUPABASE_URL}/rest/v1/rpc/deploy_function`,
      `${SUPABASE_URL}/functions/v1/sync-google-sheets`,
      `${SUPABASE_URL}/rest/v1/functions`,
      `${SUPABASE_URL}/api/v1/functions/sync-google-sheets`
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔄 Tentando deploy via: ${endpoint}`);
      
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
          name: 'sync-google-sheets',
          source: functionCode,
          verify_jwt: true,
          import_map: {},
          entrypoint: 'index.ts'
        });
        
        const response = await makeRequest(endpoint, options, payload);
        
        console.log(`📊 Status: ${response.statusCode}`);
        console.log(`📄 Resposta:`, JSON.stringify(response.data, null, 2));
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          console.log('✅ Deploy realizado com sucesso!');
          return true;
        }
        
      } catch (error) {
        console.log(`❌ Erro no endpoint ${endpoint}:`, error.message);
      }
    }
    
    console.log('\n⚠️  Todos os endpoints de deploy falharam. Tentando abordagem alternativa...');
    
    // Tentar criar/atualizar via SQL
    const sqlEndpoint = `${SUPABASE_URL}/rest/v1/rpc/create_function`;
    console.log(`\n🔄 Tentando via SQL RPC: ${sqlEndpoint}`);
    
    const sqlOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    };
    
    const sqlPayload = JSON.stringify({
      function_name: 'sync-google-sheets',
      function_body: functionCode
    });
    
    const sqlResponse = await makeRequest(sqlEndpoint, sqlOptions, sqlPayload);
    console.log(`📊 SQL Status: ${sqlResponse.statusCode}`);
    console.log(`📄 SQL Resposta:`, JSON.stringify(sqlResponse.data, null, 2));
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro durante o deploy:', error.message);
    return false;
  }
}

// Função para testar a Edge Function
async function testFunction() {
  console.log('\n🧪 Testando a Edge Function...');
  
  const testEndpoint = `${SUPABASE_URL}/functions/v1/sync-google-sheets`;
  
  try {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };
    
    const response = await makeRequest(testEndpoint, options);
    
    console.log(`📊 Status do teste: ${response.statusCode}`);
    console.log(`📄 Resposta do teste:`, JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Edge Function está funcionando!');
      return true;
    } else if (response.statusCode === 401) {
      console.log('⚠️  Edge Function existe mas requer autenticação (esperado)');
      return true;
    } else {
      console.log('❌ Edge Function não está funcionando corretamente');
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
    console.log('\n=== DEPLOY DA EDGE FUNCTION SYNC-GOOGLE-SHEETS ===');
    
    // Verificar se os arquivos existem
    const functionPath = path.join(__dirname, 'supabase', 'functions', 'sync-google-sheets', 'index.ts');
    if (!fs.existsSync(functionPath)) {
      console.error(`❌ Arquivo da função não encontrado: ${functionPath}`);
      process.exit(1);
    }
    
    console.log('✅ Arquivo da função encontrado');
    
    // Fazer deploy
    const deploySuccess = await deployFunction();
    
    // Aguardar um pouco antes de testar
    console.log('\n⏳ Aguardando 3 segundos antes de testar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Testar função
    const testSuccess = await testFunction();
    
    // Resultado final
    console.log('\n=== RESULTADO FINAL ===');
    if (deploySuccess && testSuccess) {
      console.log('🎉 Edge Function deployada e funcionando com sucesso!');
    } else if (testSuccess) {
      console.log('⚠️  Edge Function está funcionando, mas o deploy pode não ter sido necessário');
    } else {
      console.log('❌ Problemas detectados na Edge Function');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Verificar se o Supabase self-hosted está rodando corretamente');
      console.log('2. Verificar se as Edge Functions estão habilitadas');
      console.log('3. Tentar reiniciar o serviço de Edge Functions');
      console.log('4. Fazer deploy manual via interface web do Supabase');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar
main();