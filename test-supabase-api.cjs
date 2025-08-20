require('dotenv').config();
const https = require('https');
const http = require('http');

console.log('🔍 TESTE COMPLETO DA API SUPABASE SELF-HOSTED');
console.log('============================================================');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log(`🔐 Service Key: ${SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log('');

function makeRequest(url, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Test/1.0',
        ...headers
      },
      timeout: 10000
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

    req.end();
  });
}

async function testSupabaseAPI() {
  const tests = [
    {
      name: '🏠 Teste de Health Check',
      url: `${SUPABASE_URL}/rest/v1/`,
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    },
    {
      name: '📊 Teste de Acesso às Tabelas',
      url: `${SUPABASE_URL}/rest/v1/profiles?select=count`,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'count=exact'
      }
    },
    {
      name: '🏢 Teste de Tabela Companies',
      url: `${SUPABASE_URL}/rest/v1/companies?select=count`,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'count=exact'
      }
    },
    {
      name: '👥 Teste de Tabela Leads',
      url: `${SUPABASE_URL}/rest/v1/leads?select=count`,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'count=exact'
      }
    },
    {
      name: '🔐 Teste com Service Role Key',
      url: `${SUPABASE_URL}/rest/v1/profiles?select=count`,
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('─'.repeat(60));
    
    try {
      const result = await makeRequest(test.url, test.headers);
      
      console.log(`✅ Status: ${result.status}`);
      
      if (result.status === 200) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`📊 Dados recebidos:`, jsonData);
        } catch (e) {
          console.log(`📄 Resposta (texto):`, result.data.substring(0, 200));
        }
      } else {
        console.log(`❌ Erro: ${result.data}`);
      }
      
      // Mostrar headers importantes
      if (result.headers['content-range']) {
        console.log(`📈 Content-Range: ${result.headers['content-range']}`);
      }
      
    } catch (error) {
      console.log(`❌ Falhou: ${error.message}`);
      if (error.code) {
        console.log(`🔍 Código: ${error.code}`);
      }
    }
  }
}

async function testPostgreSQLPorts() {
  console.log('\n\n🔌 TESTE DE PORTAS POSTGRESQL');
  console.log('============================================================');
  
  const hostname = new URL(SUPABASE_URL).hostname;
  const ports = [5432, 6543, 54322];
  
  for (const port of ports) {
    console.log(`\n🔌 Testando porta ${port}...`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const net = require('net');
        const socket = new net.Socket();
        
        socket.setTimeout(3000);
        
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Timeout'));
        });
        
        socket.on('error', (err) => {
          reject(err);
        });
        
        socket.connect(port, hostname);
      });
      
      console.log(`✅ Porta ${port}: ABERTA`);
    } catch (error) {
      console.log(`❌ Porta ${port}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await testSupabaseAPI();
    await testPostgreSQLPorts();
    
    console.log('\n\n📋 RESUMO DOS TESTES');
    console.log('============================================================');
    console.log('✅ Testes de API REST concluídos');
    console.log('✅ Testes de conectividade de portas concluídos');
    console.log('\n💡 Se todos os testes falharam, verifique:');
    console.log('   🔍 Se o Supabase está rodando (docker ps)');
    console.log('   🌐 Se o DNS está resolvendo corretamente');
    console.log('   🔥 Se não há firewall bloqueando as conexões');
    console.log('   🔑 Se as chaves de API estão corretas');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

main();