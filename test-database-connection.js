#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase self-hosted
 * Testa diferentes configurações baseadas na documentação
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { URL } from 'url';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Erro: Configure SUPABASE_URL no arquivo .env');
  process.exit(1);
}

// Extrair host da URL
const url = new URL(supabaseUrl);
const host = url.hostname;

console.log('🔍 Testando conexões com Supabase self-hosted...');
console.log(`🔗 Host extraído: ${host}`);
console.log(`📋 URL completa: ${supabaseUrl}`);

// Configurações de teste baseadas na documentação
const testConfigs = [
  {
    name: 'Configuração 1: Senha padrão documentação',
    config: {
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: false
    }
  },
  {
    name: 'Configuração 2: Senha do .env (se existir)',
    config: {
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      ssl: false
    }
  },
  {
    name: 'Configuração 3: Senha JWT token',
    config: {
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-jwt-token-with-at-least-32-characters-long',
      ssl: false
    }
  },
  {
    name: 'Configuração 4: Usuário supabase',
    config: {
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'supabase',
      password: 'supabase',
      ssl: false
    }
  },
  {
    name: 'Configuração 5: Porta 6543 (Transaction Mode)',
    config: {
      host: host,
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: false
    }
  },
  {
    name: 'Configuração 6: Com SSL',
    config: {
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'your-super-secret-and-long-postgres-password',
      ssl: { rejectUnauthorized: false }
    }
  }
];

// Função para testar uma configuração
async function testConnection(name, config) {
  console.log(`\n🔄 Testando: ${name}`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   SSL: ${config.ssl ? 'Habilitado' : 'Desabilitado'}`);
  
  const client = new pg.Client(config);
  
  try {
    // Timeout de 5 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de conexão (5s)')), 5000);
    });
    
    await Promise.race([
      client.connect(),
      timeoutPromise
    ]);
    
    console.log('   ✅ Conexão estabelecida!');
    
    // Testar uma query simples
    const result = await client.query('SELECT version(), current_database(), current_user;');
    console.log('   📊 Informações do banco:');
    console.log(`      Versão: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`      Database: ${result.rows[0].current_database}`);
    console.log(`      Usuário: ${result.rows[0].current_user}`);
    
    // Testar se as tabelas existem
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'companies')
      ORDER BY table_name;
    `);
    
    console.log(`   📋 Tabelas encontradas: ${tablesResult.rows.map(r => r.table_name).join(', ') || 'Nenhuma'}`);
    
    await client.end();
    
    console.log('   🎉 CONFIGURAÇÃO VÁLIDA! Use esta para o diagnóstico.');
    
    // Retornar configuração válida
    return config;
    
  } catch (error) {
    console.log(`   ❌ Falhou: ${error.message}`);
    try {
      await client.end();
    } catch (e) {
      // Ignorar erro ao fechar conexão
    }
    return null;
  }
}

// Função principal
async function testAllConnections() {
  console.log('\n🚀 Iniciando testes de conexão...');
  
  let validConfig = null;
  
  for (const { name, config } of testConfigs) {
    const result = await testConnection(name, config);
    if (result) {
      validConfig = result;
      break; // Parar no primeiro que funcionar
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (validConfig) {
    console.log('🎉 SUCESSO! Configuração válida encontrada:');
    console.log('\n📋 Use estas configurações no script de diagnóstico:');
    console.log(`   Host: ${validConfig.host}`);
    console.log(`   Port: ${validConfig.port}`);
    console.log(`   User: ${validConfig.user}`);
    console.log(`   Database: ${validConfig.database}`);
    console.log(`   Password: ${validConfig.password}`);
    console.log(`   SSL: ${validConfig.ssl ? 'Habilitado' : 'Desabilitado'}`);
    
    console.log('\n🔧 Próximos passos:');
    console.log('   1. Atualize o script execute-diagnostic-sql.js com essas configurações');
    console.log('   2. Execute: node execute-diagnostic-sql.js');
    console.log('   3. Verifique se os usuários órfãos foram corrigidos');
    
  } else {
    console.log('❌ FALHA: Nenhuma configuração funcionou.');
    console.log('\n🔧 Soluções alternativas:');
    console.log('   1. Verifique se o Supabase está rodando: docker compose ps');
    console.log('   2. Verifique logs: docker compose logs db');
    console.log('   3. Use a interface web do Supabase para executar o SQL');
    console.log('   4. Verifique firewall e portas bloqueadas');
    
    console.log('\n📋 Configuração manual via interface web:');
    console.log(`   1. Acesse: ${supabaseUrl}`);
    console.log('   2. Vá para SQL Editor');
    console.log('   3. Execute o arquivo: diagnostico-dashboard-errors.sql');
  }
}

// Executar testes
testAllConnections().catch(console.error);