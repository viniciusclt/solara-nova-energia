require('dotenv').config();
const https = require('https');
const http = require('http');
const { URL } = require('url');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!serviceKey);
  process.exit(1);
}

console.log('🔧 Criando tabela user_settings via SQL direto...');

// SQL para criar a tabela
const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_api_key TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
`;

// Função para fazer requisição HTTP
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function createTable() {
  try {
    // Tentar diferentes endpoints
    const endpoints = [
      '/rest/v1/rpc/exec',
      '/rest/v1/rpc/execute_sql',
      '/sql'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`🔄 Tentando endpoint: ${endpoint}`);
      
      try {
        const response = await makeRequest(`${supabaseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceKey
          }
        }, JSON.stringify({ sql: createTableSQL }));
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📝 Resposta: ${response.body.substring(0, 200)}...`);
        
        if (response.status === 200 || response.status === 201) {
          console.log('✅ Tabela criada com sucesso!');
          return;
        }
      } catch (error) {
        console.log(`⚠️ Erro no endpoint ${endpoint}:`, error.message);
      }
    }
    
    console.log('❌ Nenhum endpoint funcionou');
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('1. Abra o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o seguinte SQL:');
    console.log('\n' + createTableSQL);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Verificar se a tabela já existe
async function checkTable() {
  try {
    console.log('🔍 Verificando se user_settings existe...');
    
    const response = await makeRequest(`${supabaseUrl}/rest/v1/user_settings?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Tabela user_settings já existe!');
      return true;
    } else {
      console.log('❌ Tabela user_settings não existe');
      return false;
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar tabela:', error.message);
    return false;
  }
}

async function main() {
  const exists = await checkTable();
  if (!exists) {
    await createTable();
  }
}

main();