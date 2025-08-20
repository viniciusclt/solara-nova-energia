require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO COMPLETO DA EDGE FUNCTION');
console.log('============================================================');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
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
        'User-Agent': 'Diagnostic/1.0',
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

async function checkFileStructure() {
  console.log('📁 VERIFICANDO ESTRUTURA DE ARQUIVOS');
  console.log('─'.repeat(50));
  
  const functionDir = path.join(__dirname, 'supabase', 'functions', 'sync-google-sheets');
  const indexFile = path.join(functionDir, 'index.ts');
  const configFile = path.join(__dirname, 'supabase', 'config.toml');
  
  console.log(`📂 Diretório da função: ${fs.existsSync(functionDir) ? '✅' : '❌'} ${functionDir}`);
  console.log(`📄 Arquivo index.ts: ${fs.existsSync(indexFile) ? '✅' : '❌'} ${indexFile}`);
  console.log(`⚙️  Arquivo config.toml: ${fs.existsSync(configFile) ? '✅' : '❌'} ${configFile}`);
  
  if (fs.existsSync(indexFile)) {
    const stats = fs.statSync(indexFile);
    const content = fs.readFileSync(indexFile, 'utf8');
    console.log(`📊 Tamanho do arquivo: ${stats.size} bytes`);
    console.log(`📅 Última modificação: ${stats.mtime.toISOString()}`);
    console.log(`📝 Linhas de código: ${content.split('\n').length}`);
    
    // Verificar imports críticos
    const criticalImports = [
      'serve',
      'createClient',
      'corsHeaders'
    ];
    
    console.log('\n🔍 Verificando imports críticos:');
    criticalImports.forEach(imp => {
      const found = content.includes(imp);
      console.log(`   ${imp}: ${found ? '✅' : '❌'}`);
    });
    
    // Verificar sintaxe básica
    console.log('\n🔍 Verificando sintaxe básica:');
    const syntaxChecks = [
      { name: 'Função serve()', check: content.includes('serve(') },
      { name: 'Export default', check: content.includes('export') || content.includes('serve(') },
      { name: 'Async/await', check: content.includes('async') },
      { name: 'Try/catch', check: content.includes('try') && content.includes('catch') },
      { name: 'CORS headers', check: content.includes('corsHeaders') }
    ];
    
    syntaxChecks.forEach(check => {
      console.log(`   ${check.name}: ${check.check ? '✅' : '❌'}`);
    });
  }
  
  console.log('');
}

async function checkSupabaseServices() {
  console.log('🔧 VERIFICANDO SERVIÇOS DO SUPABASE');
  console.log('─'.repeat(50));
  
  const services = [
    { name: 'API REST', endpoint: '/rest/v1/' },
    { name: 'Auth', endpoint: '/auth/v1/' },
    { name: 'Storage', endpoint: '/storage/v1/' },
    { name: 'Realtime', endpoint: '/realtime/v1/' },
    { name: 'Functions', endpoint: '/functions/v1/' },
    { name: 'Edge Functions Health', endpoint: '/functions/v1/health' }
  ];
  
  for (const service of services) {
    try {
      const result = await makeRequest(
        `${SUPABASE_URL}${service.endpoint}`,
        'GET',
        { 'apikey': SUPABASE_ANON_KEY }
      );
      
      console.log(`${service.name}: ${result.status === 200 ? '✅' : result.status === 404 ? '⚠️' : '❌'} (${result.status})`);
      
      if (service.name === 'Edge Functions Health' && result.status === 200) {
        try {
          const healthData = JSON.parse(result.data);
          console.log(`   📊 Health: ${JSON.stringify(healthData)}`);
        } catch (e) {
          console.log(`   📄 Response: ${result.data.substring(0, 100)}`);
        }
      }
      
    } catch (error) {
      console.log(`${service.name}: ❌ ${error.message}`);
    }
  }
  
  console.log('');
}

async function testFunctionWithDifferentMethods() {
  console.log('🧪 TESTANDO FUNÇÃO COM DIFERENTES MÉTODOS');
  console.log('─'.repeat(50));
  
  const methods = ['GET', 'POST', 'OPTIONS'];
  const functionUrl = `${SUPABASE_URL}/functions/v1/sync-google-sheets`;
  
  for (const method of methods) {
    try {
      console.log(`🔄 Testando ${method}...`);
      
      const headers = {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      };
      
      if (method === 'OPTIONS') {
        headers['Access-Control-Request-Method'] = 'POST';
        headers['Access-Control-Request-Headers'] = 'authorization,x-client-info,apikey,content-type';
      }
      
      const body = method === 'POST' ? {
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/test',
        test: true
      } : null;
      
      const result = await makeRequest(functionUrl, method, headers, body);
      
      console.log(`   Status: ${result.status}`);
      
      if (result.status === 500) {
        console.log(`   ❌ Erro 500 detectado`);
        try {
          const errorData = JSON.parse(result.data);
          console.log(`   📄 Erro: ${JSON.stringify(errorData, null, 2)}`);
        } catch (e) {
          console.log(`   📄 Resposta bruta: ${result.data.substring(0, 200)}`);
        }
      } else if (result.status >= 200 && result.status < 300) {
        console.log(`   ✅ Sucesso`);
        try {
          const responseData = JSON.parse(result.data);
          console.log(`   📊 Resposta: ${JSON.stringify(responseData, null, 2)}`);
        } catch (e) {
          console.log(`   📄 Resposta: ${result.data.substring(0, 200)}`);
        }
      } else {
        console.log(`   ⚠️  Status ${result.status}`);
        console.log(`   📄 Resposta: ${result.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('');
  }
}

async function checkDatabaseTables() {
  console.log('🗄️  VERIFICANDO TABELAS DO BANCO');
  console.log('─'.repeat(50));
  
  const tables = ['profiles', 'companies', 'leads', 'import_logs'];
  
  for (const table of tables) {
    try {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
        'GET',
        {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      );
      
      console.log(`Tabela ${table}: ${result.status === 200 ? '✅' : '❌'} (${result.status})`);
      
      if (result.status === 200) {
        try {
          const data = JSON.parse(result.data);
          console.log(`   📊 Registros encontrados: ${data.length}`);
        } catch (e) {
          console.log(`   📄 Resposta: ${result.data.substring(0, 100)}`);
        }
      }
      
    } catch (error) {
      console.log(`Tabela ${table}: ❌ ${error.message}`);
    }
  }
  
  console.log('');
}

async function checkEnvironmentVariables() {
  console.log('🌍 VERIFICANDO VARIÁVEIS DE AMBIENTE');
  console.log('─'.repeat(50));
  
  const requiredVars = [
    'SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_SHEETS_API_KEY'
  ];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅' : '❌'} ${value ? `(${value.substring(0, 20)}...)` : '(não definida)'}`);
  });
  
  console.log('');
}

async function main() {
  try {
    await checkEnvironmentVariables();
    await checkFileStructure();
    await checkSupabaseServices();
    await checkDatabaseTables();
    await testFunctionWithDifferentMethods();
    
    console.log('📋 RESUMO DO DIAGNÓSTICO');
    console.log('============================================================');
    console.log('✅ Diagnóstico completo realizado');
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS DO ERRO 500:');
    console.log('1. 📁 Arquivo da função não está sendo encontrado pelo Deno runtime');
    console.log('2. 🔧 Dependências externas não estão sendo carregadas corretamente');
    console.log('3. ⚙️  Configuração do Supabase self-hosted pode estar incompleta');
    console.log('4. 🌐 Problema de rede ou timeout nas requisições HTTP');
    console.log('5. 🔑 Problemas de autenticação ou permissões');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('1. 🔄 Reiniciar o serviço Supabase self-hosted');
    console.log('2. 📝 Simplificar a Edge Function para teste básico');
    console.log('3. 🌐 Verificar logs do servidor Supabase');
    console.log('4. 📞 Contatar administrador do Supabase self-hosted');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

main();