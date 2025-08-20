#!/usr/bin/env node

/**
 * Script para testar múltiplas configurações de conexão com Supabase self-hosted
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

// Carrega variáveis de ambiente
dotenv.config();

const { Client } = pg;

console.log('🚀 Testando múltiplas configurações de conexão...');
console.log('');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.log('❌ URL do Supabase não encontrada!');
  process.exit(1);
}

const url = new URL(supabaseUrl);
const host = url.hostname;

console.log('🔗 URL do Supabase:', supabaseUrl);
console.log('🏠 Host:', host);
console.log('');

// Teste 1: Conexão via Supabase Client (API)
async function testSupabaseClient() {
  console.log('📡 TESTE 1: Conexão via Supabase Client (API)');
  
  try {
    if (!supabaseKey) {
      console.log('⚠️  Chave anon não encontrada, pulando teste...');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste simples de conexão
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    
    if (error) {
      console.log('❌ Erro na API:', error.message);
      return false;
    }
    
    console.log('✅ Conexão via API funcionando!');
    return true;
    
  } catch (error) {
    console.log('❌ Erro no cliente Supabase:', error.message);
    return false;
  }
}

// Teste 2: Conexão direta PostgreSQL
async function testPostgresConnection(config, description) {
  console.log(`🔌 TESTE: ${description}`);
  
  const client = new Client(config);
  
  try {
    await client.connect();
    
    const result = await client.query('SELECT version();');
    console.log('✅ Sucesso:', description);
    console.log('   PostgreSQL:', result.rows[0].version.split(' ')[1]);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log('❌ Falhou:', description);
    console.log('   Erro:', error.message);
    console.log('   Código:', error.code || 'N/A');
    
    try {
      await client.end();
    } catch (e) {
      // Ignora erro ao fechar conexão
    }
    
    return false;
  }
}

// Configurações de teste
const testConfigs = [
  {
    config: {
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: false,
      connectionTimeoutMillis: 3000
    },
    description: 'PostgreSQL direto (5432) - sem SSL'
  },
  {
    config: {
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    },
    description: 'PostgreSQL direto (5432) - com SSL'
  },
  {
    config: {
      host: host,
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: false,
      connectionTimeoutMillis: 3000
    },
    description: 'Pooler transacional (6543) - sem SSL'
  },
  {
    config: {
      host: host,
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    },
    description: 'Pooler transacional (6543) - com SSL'
  },
  {
    config: {
      host: host,
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: false,
      connectionTimeoutMillis: 3000
    },
    description: 'Porta alternativa (54322) - sem SSL'
  }
];

// Função principal
async function runTests() {
  const results = [];
  
  // Teste da API Supabase
  console.log('=' .repeat(60));
  const apiResult = await testSupabaseClient();
  results.push({ type: 'API', success: apiResult });
  
  console.log('');
  console.log('=' .repeat(60));
  console.log('🔧 TESTES DE CONEXÃO DIRETA POSTGRESQL');
  console.log('=' .repeat(60));
  
  // Testes de conexão direta
  for (const { config, description } of testConfigs) {
    const result = await testPostgresConnection(config, description);
    results.push({ type: 'PostgreSQL', description, success: result, config });
    console.log('');
  }
  
  // Resumo
  console.log('=' .repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('✅ Conexões bem-sucedidas:');
    successful.forEach(result => {
      if (result.type === 'API') {
        console.log('   🌐 API Supabase');
      } else {
        console.log(`   🔗 ${result.description}`);
      }
    });
  }
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ Conexões que falharam:');
    failed.forEach(result => {
      if (result.type === 'API') {
        console.log('   🌐 API Supabase');
      } else {
        console.log(`   🔗 ${result.description}`);
      }
    });
  }
  
  console.log('');
  console.log('💡 PRÓXIMOS PASSOS:');
  
  if (successful.some(r => r.type === 'API')) {
    console.log('   ✅ Use a API do Supabase para operações normais');
    console.log('   📝 Configure o frontend para usar a API');
  }
  
  const pgSuccess = successful.find(r => r.type === 'PostgreSQL');
  if (pgSuccess) {
    console.log('   ✅ Use conexão PostgreSQL para setup de tabelas');
    console.log('   🔧 Execute o SQL de criação das tabelas');
  }
  
  if (successful.length === 0) {
    console.log('   🔍 Verifique se o Supabase está rodando');
    console.log('   🌐 Teste o acesso via browser ao Dashboard');
    console.log('   🔑 Confirme as credenciais e configurações');
    console.log('   🔥 Verifique firewall e portas abertas');
  }
  
  console.log('');
}

// Executa os testes
runTests().catch(error => {
  console.log('❌ Erro geral:', error.message);
  process.exit(1);
});