#!/usr/bin/env node

/**
 * Script para testar conectividade HTTP com Supabase self-hosted
 * Verifica se a API REST está acessível
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erro: Configure SUPABASE_URL no arquivo .env');
  process.exit(1);
}

console.log('🔍 Testando conectividade HTTP com Supabase...');
console.log(`🔗 URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseAnonKey ? 'Configurada' : 'Não configurada'}`);
console.log(`🔐 Service Key: ${supabaseServiceKey ? 'Configurada' : 'Não configurada'}`);

// Função para testar uma requisição HTTP
async function testHttpRequest(url, headers, description) {
  console.log(`\n🔄 Testando: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
    
    if (response.ok) {
      console.log('   ✅ Sucesso!');
      
      // Tentar ler o corpo da resposta
      try {
        const text = await response.text();
        if (text) {
          console.log(`   📄 Resposta (primeiros 200 chars): ${text.substring(0, 200)}...`);
        }
      } catch (e) {
        console.log('   📄 Resposta: (não foi possível ler o corpo)');
      }
      
      return true;
    } else {
      console.log(`   ❌ Falhou: ${response.status} ${response.statusText}`);
      
      // Tentar ler erro
      try {
        const errorText = await response.text();
        console.log(`   📄 Erro: ${errorText}`);
      } catch (e) {
        console.log('   📄 Erro: (não foi possível ler o erro)');
      }
      
      return false;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('   ❌ Falhou: Timeout (10s)');
    } else {
      console.log(`   ❌ Falhou: ${error.message}`);
    }
    return false;
  }
}

// Função principal
async function testSupabaseConnectivity() {
  console.log('\n🚀 Iniciando testes de conectividade HTTP...');
  
  const tests = [
    {
      name: 'Teste 1: Endpoint básico (sem autenticação)',
      url: `${supabaseUrl}/rest/v1/`,
      headers: {
        'Accept': 'application/json'
      }
    },
    {
      name: 'Teste 2: Health check',
      url: `${supabaseUrl}/rest/v1/`,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'test-script'
      }
    }
  ];
  
  // Adicionar testes com chaves se disponíveis
  if (supabaseAnonKey) {
    tests.push({
      name: 'Teste 3: Com Anon Key',
      url: `${supabaseUrl}/rest/v1/`,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      }
    });
    
    tests.push({
      name: 'Teste 4: Tabela profiles (com Anon Key)',
      url: `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      }
    });
  }
  
  if (supabaseServiceKey) {
    tests.push({
      name: 'Teste 5: Com Service Role Key',
      url: `${supabaseUrl}/rest/v1/`,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });
    
    tests.push({
      name: 'Teste 6: Tabela profiles (com Service Key)',
      url: `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });
  }
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testHttpRequest(test.url, test.headers, test.name);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Resultados: ${successCount}/${tests.length} testes bem-sucedidos`);
  
  if (successCount === 0) {
    console.log('\n❌ FALHA TOTAL: Nenhuma conexão HTTP funcionou');
    console.log('\n🔧 Possíveis causas:');
    console.log('   1. Supabase não está rodando');
    console.log('   2. Firewall bloqueando conexões HTTP/HTTPS');
    console.log('   3. URL incorreta no .env');
    console.log('   4. Problema de rede/DNS');
    
    console.log('\n🔍 Verificações recomendadas:');
    console.log('   1. Ping do host:');
    console.log(`      ping ${new URL(supabaseUrl).hostname}`);
    console.log('   2. Verificar se Supabase está rodando:');
    console.log('      docker compose ps');
    console.log('   3. Verificar logs:');
    console.log('      docker compose logs kong');
    console.log('   4. Testar no navegador:');
    console.log(`      ${supabaseUrl}`);
    
  } else if (successCount < tests.length) {
    console.log('\n⚠️ PARCIAL: Algumas conexões funcionaram, outras falharam');
    console.log('\n🔧 Possíveis problemas:');
    console.log('   1. Chaves de API incorretas ou expiradas');
    console.log('   2. Permissões de tabela insuficientes');
    console.log('   3. Configuração de CORS');
    
  } else {
    console.log('\n✅ SUCESSO: Todas as conexões HTTP funcionaram!');
    console.log('\n🔧 O problema pode ser:');
    console.log('   1. Configuração de CORS para localhost:8080');
    console.log('   2. Problema específico do navegador');
    console.log('   3. Configuração de SSL/certificados');
    
    console.log('\n📝 Próximos passos:');
    console.log('   1. Verificar configuração de CORS no Supabase');
    console.log('   2. Testar com HTTPS em vez de HTTP');
    console.log('   3. Verificar certificados SSL');
  }
}

// Executar testes
testSupabaseConnectivity().catch(console.error);