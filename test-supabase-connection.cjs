/**
 * Script simples para testar conexão com Supabase usando fetch
 */

const fs = require('fs');
const path = require('path');

// Ler arquivo .env manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

console.log('🔗 Testando conexão com Supabase...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 10) + '...');

async function testConnection() {
  try {
    console.log('\n🧪 Testando conexão básica...');
    
    // Teste básico: verificar se o servidor responde
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Servidor Supabase respondeu com sucesso!');
      console.log('📊 Status:', response.status);
      
      // Tentar listar tabelas
      console.log('\n🔍 Tentando listar tabelas...');
      const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (tablesResponse.ok) {
        const data = await tablesResponse.text();
        console.log('✅ API REST funcionando');
        console.log('📋 Resposta:', data.substring(0, 200) + '...');
      }
      
      return true;
    } else {
      console.error('❌ Servidor retornou erro:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('📄 Detalhes:', errorText.substring(0, 500));
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Conexão recusada - verifique se o servidor Supabase está rodando');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Host não encontrado - verifique a URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Timeout - verifique a conectividade de rede');
    }
    
    return false;
  }
}

async function main() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    console.log('💡 Próximos passos:');
    console.log('   1. Criar as tabelas necessárias');
    console.log('   2. Configurar RLS (Row Level Security)');
    console.log('   3. Testar funcionalidades da aplicação');
  } else {
    console.log('\n❌ Falha na conexão com Supabase');
    console.log('🔧 Verifique:');
    console.log('   1. Se o servidor Supabase está rodando em', supabaseUrl);
    console.log('   2. Se a chave de API está correta');
    console.log('   3. Se não há firewall bloqueando a conexão');
    console.log('   4. Se o servidor está acessível pela rede');
  }
}

main().catch(console.error);