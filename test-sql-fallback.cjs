const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Carregar variáveis do .env
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Erro ao carregar .env:', error.message);
    return {};
  }
}

async function testSqlFallback() {
  console.log('🔧 Testando função SQL de fallback para sincronização Google Sheets\n');
  
  const env = loadEnvVars();
  
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_URL ou SUPABASE_ANON_KEY não encontrados no .env');
    return;
  }
  
  console.log('📋 Configuração:');
  console.log(`   URL: ${env.SUPABASE_URL}`);
  console.log(`   Anon Key: ${env.SUPABASE_ANON_KEY.substring(0, 20)}...\n`);
  
  // Testar função SQL de fallback
  try {
    console.log('🧪 Testando função sync_google_sheets_fallback...');
    
    const fallbackUrl = `${env.SUPABASE_URL}/rest/v1/rpc/sync_google_sheets_fallback`;
    const fallbackOptions = {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    };
    
    const fallbackResponse = await makeRequest(fallbackUrl, fallbackOptions);
    
    if (fallbackResponse.status === 200) {
      console.log('✅ Função SQL de fallback funcionando!');
      console.log('📊 Resposta:', JSON.stringify(fallbackResponse.data, null, 2));
      
      // Testar logs
      console.log('\n📝 Verificando logs de sincronização...');
      const logsUrl = `${env.SUPABASE_URL}/rest/v1/sync_logs?order=created_at.desc&limit=5`;
      const logsOptions = {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
        }
      };
      
      const logsResponse = await makeRequest(logsUrl, logsOptions);
      
      if (logsResponse.status === 200 && Array.isArray(logsResponse.data)) {
        console.log('✅ Logs encontrados:');
        logsResponse.data.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.operation} - ${log.status} (${log.created_at})`);
        });
      } else {
        console.log('⚠️  Não foi possível acessar os logs');
      }
      
    } else {
      console.error('❌ Função SQL de fallback falhou:');
      console.error(`   Status: ${fallbackResponse.status}`);
      console.error(`   Resposta: ${JSON.stringify(fallbackResponse.data, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função SQL de fallback:', error.message);
  }
  
  // Instruções finais
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Execute o SQL no SQL Editor do Supabase Dashboard:');
  console.log('   - Abra o Supabase Dashboard');
  console.log('   - Vá para SQL Editor');
  console.log('   - Copie e cole o conteúdo de sql-fallback-sync-google-sheets.sql');
  console.log('   - Execute o script');
  console.log('\n2. Teste a função via API REST:');
  console.log(`   curl -X POST '${env.SUPABASE_URL}/rest/v1/rpc/sync_google_sheets_fallback' \\`);
  console.log(`        -H 'apikey: ${env.SUPABASE_ANON_KEY}' \\`);
  console.log(`        -H 'Authorization: Bearer ${env.SUPABASE_ANON_KEY}' \\`);
  console.log(`        -H 'Content-Type: application/json'`);
  console.log('\n3. Integre no frontend substituindo a chamada da Edge Function');
  console.log('\n✨ Esta solução funciona até que as Edge Functions sejam configuradas!');
}

// Executar teste
testSqlFallback().catch(console.error);