require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔧 DEPLOY MANUAL DA EDGE FUNCTION VIA API');
console.log('============================================================');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log('');

// Ler o código da Edge Function
const functionPath = path.join(__dirname, 'supabase', 'functions', 'sync-google-sheets', 'index.ts');

if (!fs.existsSync(functionPath)) {
  console.log('❌ Arquivo index.ts não encontrado');
  process.exit(1);
}

const functionCode = fs.readFileSync(functionPath, 'utf8');
console.log(`📁 Código da função carregado (${functionCode.length} caracteres)`);

function makeRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Manual-Deploy/1.0',
        ...headers
      },
      timeout: 30000
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

async function deployFunction() {
  console.log('🚀 TENTANDO DEPLOY VIA API MANAGEMENT');
  console.log('─'.repeat(50));
  
  // Primeiro, vamos tentar listar as funções existentes
  try {
    console.log('📋 Listando funções existentes...');
    const listResult = await makeRequest(
      `${SUPABASE_URL}/rest/v1/functions`,
      'GET',
      {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    );
    
    console.log(`✅ Status da listagem: ${listResult.status}`);
    if (listResult.status === 200) {
      try {
        const functions = JSON.parse(listResult.data);
        console.log(`📊 Funções encontradas: ${functions.length}`);
        functions.forEach(func => {
          console.log(`   - ${func.name || func.id}`);
        });
      } catch (e) {
        console.log('📄 Resposta da listagem:', listResult.data.substring(0, 200));
      }
    } else {
      console.log('⚠️  Não foi possível listar funções');
      console.log('📄 Resposta:', listResult.data.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Erro ao listar funções:', error.message);
  }
  
  console.log('');
  
  // Tentar fazer deploy via diferentes endpoints
  const deployEndpoints = [
    `${SUPABASE_URL}/functions/v1/deploy`,
    `${SUPABASE_URL}/rest/v1/functions`,
    `${SUPABASE_URL}/functions/deploy`,
    `${SUPABASE_URL}/api/functions/deploy`
  ];
  
  for (const endpoint of deployEndpoints) {
    console.log(`🔄 Tentando deploy via: ${endpoint}`);
    
    try {
      const deployPayload = {
        name: 'sync-google-sheets',
        source: functionCode,
        verify_jwt: true,
        import_map: {},
        entrypoint: 'index.ts'
      };
      
      const result = await makeRequest(
        endpoint,
        'POST',
        {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        deployPayload
      );
      
      console.log(`   Status: ${result.status}`);
      
      if (result.status >= 200 && result.status < 300) {
        console.log('✅ Deploy realizado com sucesso!');
        try {
          const responseData = JSON.parse(result.data);
          console.log('📊 Resposta:', JSON.stringify(responseData, null, 2));
        } catch (e) {
          console.log('📄 Resposta:', result.data.substring(0, 300));
        }
        return true;
      } else {
        console.log(`   ❌ Falhou: ${result.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('');
  }
  
  return false;
}

async function testFunctionAfterDeploy() {
  console.log('🧪 TESTANDO FUNÇÃO APÓS DEPLOY');
  console.log('─'.repeat(40));
  
  try {
    const testResult = await makeRequest(
      `${SUPABASE_URL}/functions/v1/sync-google-sheets`,
      'GET',
      {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    );
    
    console.log(`✅ Status do teste: ${testResult.status}`);
    
    if (testResult.status === 200) {
      console.log('🎉 Função está respondendo corretamente!');
    } else if (testResult.status === 500) {
      console.log('❌ Função ainda retorna erro 500');
      console.log('📄 Resposta:', testResult.data.substring(0, 300));
    } else {
      console.log(`⚠️  Status: ${testResult.status}`);
      console.log('📄 Resposta:', testResult.data.substring(0, 300));
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

async function checkSupabaseManagement() {
  console.log('🔍 VERIFICANDO INTERFACE DE MANAGEMENT');
  console.log('─'.repeat(45));
  
  const managementEndpoints = [
    `${SUPABASE_URL}/dashboard`,
    `${SUPABASE_URL}/admin`,
    `${SUPABASE_URL}/studio`,
    `${SUPABASE_URL}/functions`
  ];
  
  for (const endpoint of managementEndpoints) {
    try {
      const result = await makeRequest(endpoint, 'GET');
      console.log(`${endpoint}: Status ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ✅ Interface disponível`);
      }
    } catch (error) {
      console.log(`${endpoint}: ❌ ${error.message}`);
    }
  }
}

async function main() {
  try {
    await checkSupabaseManagement();
    console.log('');
    
    const deploySuccess = await deployFunction();
    console.log('');
    
    await testFunctionAfterDeploy();
    console.log('');
    
    console.log('📋 RESUMO FINAL');
    console.log('============================================================');
    
    if (deploySuccess) {
      console.log('✅ Deploy realizado com sucesso');
      console.log('💡 A função deve estar funcionando agora');
    } else {
      console.log('❌ Deploy não foi realizado via API');
      console.log('💡 SOLUÇÕES ALTERNATIVAS:');
      console.log('   🌐 Acesse a interface web do Supabase');
      console.log('   📁 Vá para Functions > Create Function');
      console.log('   📝 Nome: sync-google-sheets');
      console.log('   📄 Cole o código do arquivo index.ts');
      console.log('   ⚙️  Configure verify_jwt = true');
      console.log('');
      console.log('🔗 URLs para tentar:');
      console.log(`   ${SUPABASE_URL}/dashboard`);
      console.log(`   ${SUPABASE_URL}/studio`);
      console.log(`   ${SUPABASE_URL}/functions`);
    }
    
    console.log('');
    console.log('📄 CÓDIGO DA FUNÇÃO (para deploy manual):');
    console.log('─'.repeat(50));
    console.log('// Copie este código para a interface web:');
    console.log('');
    console.log(functionCode.substring(0, 500) + '...');
    console.log('');
    console.log(`// Total: ${functionCode.length} caracteres`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

main();