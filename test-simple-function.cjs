require('dotenv').config();
const https = require('https');
const http = require('http');

console.log('🧪 TESTANDO EDGE FUNCTION SIMPLIFICADA');
console.log('============================================================');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log(`🔓 Anon Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log('');

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
        'User-Agent': 'Test-Simple/1.0',
        ...headers
      },
      timeout: 15000
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

async function testBothFunctions() {
  console.log('🔄 COMPARANDO AMBAS AS EDGE FUNCTIONS');
  console.log('─'.repeat(50));
  
  const functions = [
    { name: 'test-simple', url: `${SUPABASE_URL}/functions/v1/test-simple` },
    { name: 'sync-google-sheets', url: `${SUPABASE_URL}/functions/v1/sync-google-sheets` }
  ];
  
  for (const func of functions) {
    console.log(`\n🧪 Testando função: ${func.name}`);
    console.log('─'.repeat(30));
    
    try {
      const result = await makeRequest(
        func.url,
        'GET',
        {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      );
      
      console.log(`   Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log('   ✅ Função funcionando corretamente!');
        try {
          const responseData = JSON.parse(result.data);
          console.log(`   📊 Resposta: ${JSON.stringify(responseData, null, 2)}`);
        } catch (e) {
          console.log(`   📄 Resposta: ${result.data.substring(0, 200)}`);
        }
      } else if (result.status === 500) {
        console.log('   ❌ Erro 500 detectado');
        try {
          const errorData = JSON.parse(result.data);
          console.log(`   📄 Erro: ${JSON.stringify(errorData, null, 2)}`);
        } catch (e) {
          console.log(`   📄 Resposta bruta: ${result.data.substring(0, 200)}`);
        }
      } else if (result.status === 404) {
        console.log('   ⚠️  Função não encontrada (404)');
        console.log('   💡 A função pode não estar deployada');
      } else {
        console.log(`   ⚠️  Status inesperado: ${result.status}`);
        console.log(`   📄 Resposta: ${result.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro na requisição: ${error.message}`);
    }
  }
}

async function checkFunctionsList() {
  console.log('\n📋 LISTANDO TODAS AS EDGE FUNCTIONS');
  console.log('─'.repeat(50));
  
  const endpoints = [
    `${SUPABASE_URL}/functions/v1/`,
    `${SUPABASE_URL}/functions/`,
    `${SUPABASE_URL}/rest/v1/functions`
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Tentando listar via: ${endpoint}`);
      
      const result = await makeRequest(
        endpoint,
        'GET',
        {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      );
      
      console.log(`   Status: ${result.status}`);
      
      if (result.status === 200) {
        try {
          const functions = JSON.parse(result.data);
          if (Array.isArray(functions)) {
            console.log(`   ✅ ${functions.length} funções encontradas:`);
            functions.forEach((func, index) => {
              console.log(`      ${index + 1}. ${func.name || func.id || JSON.stringify(func)}`);
            });
          } else {
            console.log(`   📄 Resposta: ${JSON.stringify(functions, null, 2)}`);
          }
        } catch (e) {
          console.log(`   📄 Resposta não-JSON: ${result.data.substring(0, 300)}`);
        }
      } else {
        console.log(`   ❌ Falhou com status ${result.status}`);
        console.log(`   📄 Resposta: ${result.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await testBothFunctions();
    await checkFunctionsList();
    
    console.log('\n📋 CONCLUSÕES DO TESTE');
    console.log('============================================================');
    console.log('🔍 Se test-simple funcionar e sync-google-sheets não:');
    console.log('   → O problema é específico do código da sync-google-sheets');
    console.log('   → Dependências ou sintaxe podem estar causando o erro');
    console.log('');
    console.log('🔍 Se ambas falharem com o mesmo erro:');
    console.log('   → O problema é no sistema de Edge Functions do Supabase');
    console.log('   → Configuração ou deploy das funções está incorreto');
    console.log('');
    console.log('🔍 Se test-simple não for encontrada (404):');
    console.log('   → As funções não estão sendo deployadas automaticamente');
    console.log('   → É necessário deploy manual via interface web');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

main();