require('dotenv').config();
const https = require('https');
const http = require('http');

console.log('🚀 TESTE DAS EDGE FUNCTIONS DO SUPABASE');
console.log('============================================================');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log('');

function makeRequest(url, headers = {}, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-EdgeFunction-Test/1.0',
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

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testEdgeFunctions() {
  const tests = [
    {
      name: '🔍 Verificar se Edge Functions estão disponíveis',
      url: `${SUPABASE_URL}/functions/v1/`,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    },
    {
      name: '📊 Testar Edge Function: sync-google-sheets',
      url: `${SUPABASE_URL}/functions/v1/sync-google-sheets`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: {
        test: true,
        spreadsheetId: 'test-id',
        range: 'A1:H100'
      }
    },
    {
      name: '🔄 Testar Edge Function: sync-google-sheets (GET)',
      url: `${SUPABASE_URL}/functions/v1/sync-google-sheets`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    },
    {
      name: '📈 Verificar outras Edge Functions disponíveis',
      url: `${SUPABASE_URL}/functions/v1/hello`,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('─'.repeat(60));
    
    try {
      const result = await makeRequest(
        test.url, 
        test.headers, 
        test.method || 'GET',
        test.body
      );
      
      console.log(`✅ Status: ${result.status}`);
      
      if (result.status >= 200 && result.status < 300) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`📊 Resposta JSON:`, JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log(`📄 Resposta (texto):`, result.data.substring(0, 300));
        }
        results.push({ test: test.name, status: 'SUCCESS', code: result.status });
      } else if (result.status === 404) {
        console.log(`⚠️  Edge Function não encontrada (404)`);
        console.log(`📄 Resposta:`, result.data.substring(0, 200));
        results.push({ test: test.name, status: 'NOT_FOUND', code: result.status });
      } else if (result.status === 500) {
        console.log(`❌ Erro interno do servidor (500)`);
        console.log(`📄 Resposta:`, result.data.substring(0, 200));
        results.push({ test: test.name, status: 'SERVER_ERROR', code: result.status });
      } else {
        console.log(`⚠️  Status inesperado: ${result.status}`);
        console.log(`📄 Resposta:`, result.data.substring(0, 200));
        results.push({ test: test.name, status: 'UNEXPECTED', code: result.status });
      }
      
    } catch (error) {
      console.log(`❌ Falhou: ${error.message}`);
      if (error.code) {
        console.log(`🔍 Código: ${error.code}`);
      }
      results.push({ test: test.name, status: 'FAILED', error: error.message });
    }
  }

  return results;
}

async function testSupabaseServices() {
  console.log('\n\n🔧 TESTE DE SERVIÇOS DO SUPABASE');
  console.log('============================================================');
  
  const services = [
    {
      name: '🗄️  Database (REST API)',
      url: `${SUPABASE_URL}/rest/v1/`
    },
    {
      name: '🔐 Auth Service',
      url: `${SUPABASE_URL}/auth/v1/`
    },
    {
      name: '📁 Storage Service',
      url: `${SUPABASE_URL}/storage/v1/`
    },
    {
      name: '⚡ Realtime Service',
      url: `${SUPABASE_URL}/realtime/v1/`
    }
  ];

  for (const service of services) {
    console.log(`\n${service.name}`);
    console.log('─'.repeat(40));
    
    try {
      const result = await makeRequest(service.url, {
        'apikey': SUPABASE_ANON_KEY
      });
      
      console.log(`✅ Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`🟢 Serviço funcionando`);
      } else if (result.status === 404) {
        console.log(`🟡 Serviço não encontrado ou não configurado`);
      } else {
        console.log(`🔍 Status: ${result.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Falhou: ${error.message}`);
    }
  }
}

async function main() {
  try {
    const edgeFunctionResults = await testEdgeFunctions();
    await testSupabaseServices();
    
    console.log('\n\n📋 RESUMO FINAL DOS TESTES');
    console.log('============================================================');
    
    console.log('\n🚀 Edge Functions:');
    edgeFunctionResults.forEach(result => {
      const icon = result.status === 'SUCCESS' ? '✅' : 
                   result.status === 'NOT_FOUND' ? '⚠️' : '❌';
      console.log(`   ${icon} ${result.test}: ${result.status} (${result.code || result.error})`);
    });
    
    const successCount = edgeFunctionResults.filter(r => r.status === 'SUCCESS').length;
    const totalCount = edgeFunctionResults.length;
    
    console.log(`\n📊 Taxa de sucesso: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === 0) {
      console.log('\n❌ PROBLEMA CRÍTICO: Nenhuma Edge Function está funcionando!');
      console.log('💡 Possíveis causas:');
      console.log('   🔍 Edge Functions não foram deployadas');
      console.log('   🔧 Supabase não está configurado corretamente');
      console.log('   🌐 Problemas de conectividade');
      console.log('   🔑 Chaves de API incorretas');
    } else if (successCount < totalCount) {
      console.log('\n⚠️  ATENÇÃO: Algumas Edge Functions não estão funcionando');
      console.log('💡 Verifique se todas as funções foram deployadas corretamente');
    } else {
      console.log('\n✅ SUCESSO: Todas as Edge Functions estão funcionando!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

main();