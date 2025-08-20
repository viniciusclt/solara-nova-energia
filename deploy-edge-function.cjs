require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOY DA EDGE FUNCTION SYNC-GOOGLE-SHEETS');
console.log('============================================================');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log('');

// Verificar se os arquivos necessários existem
const functionPath = path.join(__dirname, 'supabase', 'functions', 'sync-google-sheets');
const indexPath = path.join(functionPath, 'index.ts');
const configPath = path.join(__dirname, 'supabase', 'config.toml');

console.log('📁 VERIFICAÇÃO DE ARQUIVOS');
console.log('─'.repeat(40));

if (fs.existsSync(indexPath)) {
  console.log('✅ index.ts encontrado');
  const stats = fs.statSync(indexPath);
  console.log(`📊 Tamanho: ${stats.size} bytes`);
  console.log(`📅 Modificado: ${stats.mtime.toISOString()}`);
} else {
  console.log('❌ index.ts NÃO encontrado');
  process.exit(1);
}

if (fs.existsSync(configPath)) {
  console.log('✅ config.toml encontrado');
  const configContent = fs.readFileSync(configPath, 'utf8');
  console.log('📄 Conteúdo do config.toml:');
  console.log(configContent);
} else {
  console.log('⚠️  config.toml não encontrado');
}

console.log('');

// Verificar se o Supabase CLI está instalado
console.log('🔧 VERIFICAÇÃO DO SUPABASE CLI');
console.log('─'.repeat(40));

try {
  const version = execSync('supabase --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Supabase CLI instalado: ${version}`);
} catch (error) {
  console.log('❌ Supabase CLI não encontrado');
  console.log('💡 Instale com: npm install -g supabase');
  process.exit(1);
}

console.log('');

// Verificar se está logado no Supabase
console.log('🔐 VERIFICAÇÃO DE AUTENTICAÇÃO');
console.log('─'.repeat(40));

try {
  const authStatus = execSync('supabase status', { encoding: 'utf8' });
  console.log('✅ Status do Supabase:');
  console.log(authStatus);
} catch (error) {
  console.log('⚠️  Não foi possível verificar o status');
  console.log('💡 Pode ser necessário fazer login ou inicializar o projeto');
}

console.log('');

// Tentar fazer o deploy da função
console.log('🚀 DEPLOY DA EDGE FUNCTION');
console.log('─'.repeat(40));

try {
  console.log('📤 Fazendo deploy da função sync-google-sheets...');
  
  // Primeiro, vamos tentar linkar o projeto
  try {
    const linkCommand = `supabase link --project-ref ${SUPABASE_URL.split('//')[1].split('.')[0]}`;
    console.log(`🔗 Executando: ${linkCommand}`);
    const linkResult = execSync(linkCommand, { encoding: 'utf8' });
    console.log('✅ Projeto linkado com sucesso');
    console.log(linkResult);
  } catch (linkError) {
    console.log('⚠️  Erro ao linkar projeto (pode já estar linkado)');
    console.log(linkError.message);
  }
  
  // Agora fazer o deploy
  const deployCommand = 'supabase functions deploy sync-google-sheets';
  console.log(`🚀 Executando: ${deployCommand}`);
  
  const deployResult = execSync(deployCommand, { 
    encoding: 'utf8',
    cwd: __dirname
  });
  
  console.log('✅ Deploy realizado com sucesso!');
  console.log(deployResult);
  
} catch (error) {
  console.log('❌ Erro durante o deploy:');
  console.log(error.message);
  
  // Tentar deploy manual via API
  console.log('');
  console.log('🔄 TENTANDO DEPLOY MANUAL VIA API');
  console.log('─'.repeat(40));
  
  try {
    const functionCode = fs.readFileSync(indexPath, 'utf8');
    
    // Criar payload para deploy manual
    const deployPayload = {
      name: 'sync-google-sheets',
      source: functionCode,
      verify_jwt: true
    };
    
    console.log('📦 Payload preparado para deploy manual');
    console.log(`📊 Tamanho do código: ${functionCode.length} caracteres`);
    
    // Aqui você poderia implementar uma chamada HTTP para fazer o deploy
    // Por enquanto, vamos apenas mostrar as informações
    console.log('💡 Para deploy manual, use a interface web do Supabase');
    console.log('📁 Copie o conteúdo de index.ts para a interface web');
    
  } catch (manualError) {
    console.log('❌ Erro no deploy manual:', manualError.message);
  }
}

console.log('');

// Testar a função após o deploy
console.log('🧪 TESTE DA EDGE FUNCTION');
console.log('─'.repeat(40));

const https = require('https');
const http = require('http');

function testEdgeFunction() {
  return new Promise((resolve, reject) => {
    const testUrl = `${SUPABASE_URL}/functions/v1/sync-google-sheets`;
    const urlObj = new URL(testUrl);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
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
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Executar teste
testEdgeFunction()
  .then(result => {
    console.log(`✅ Teste concluído - Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('🎉 Edge Function está funcionando!');
    } else if (result.status === 500) {
      console.log('❌ Edge Function retorna erro 500');
      console.log('📄 Resposta:', result.data.substring(0, 200));
    } else {
      console.log(`⚠️  Status inesperado: ${result.status}`);
      console.log('📄 Resposta:', result.data.substring(0, 200));
    }
  })
  .catch(error => {
    console.log('❌ Erro no teste:', error.message);
  })
  .finally(() => {
    console.log('');
    console.log('📋 RESUMO FINAL');
    console.log('============================================================');
    console.log('✅ Verificação de arquivos concluída');
    console.log('✅ Verificação do Supabase CLI concluída');
    console.log('✅ Tentativa de deploy concluída');
    console.log('✅ Teste da função concluído');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   🔍 Verifique os logs do Supabase para mais detalhes');
    console.log('   🌐 Acesse a interface web do Supabase para verificar o deploy');
    console.log('   🔧 Se necessário, faça o deploy manual via interface web');
  });