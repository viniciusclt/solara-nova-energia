#!/usr/bin/env node

/**
 * Script para executar automaticamente o setup do módulo de treinamentos
 * no Supabase self-hosted usando conexão direta com PostgreSQL
 * 
 * Baseado na documentação do Supabase self-hosted:
 * - Conexão direta via PostgreSQL connection string
 * - Suporte para ambientes self-hosted
 * - Execução de SQL completo com verificação
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configuração para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config();

const { Client } = pg;

// Configuração de cores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Função para logs coloridos
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para extrair configurações de conexão do Supabase URL
function parseSupabaseUrl(supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    
    // Para Supabase self-hosted, a URL geralmente é algo como:
    // https://supabasekong-xxx.domain.com
    // E o PostgreSQL está na porta 5432 (direta) ou 6543 (pooler)
    
    return {
      host: url.hostname,
      port: 5432, // Porta padrão do PostgreSQL
      database: 'postgres',
      user: 'postgres'
    };
  } catch (error) {
    throw new Error(`URL do Supabase inválida: ${error.message}`);
  }
}

// Função para obter senha do PostgreSQL
function getPostgresPassword() {
  // Tenta diferentes variáveis de ambiente comuns
  const possibleKeys = [
    'POSTGRES_PASSWORD',
    'SUPABASE_DB_PASSWORD', 
    'DB_PASSWORD',
    'DATABASE_PASSWORD'
  ];
  
  for (const key of possibleKeys) {
    if (process.env[key]) {
      return process.env[key];
    }
  }
  
  // Se não encontrar, usa uma senha padrão comum do Supabase self-hosted
  log('⚠️  Senha do PostgreSQL não encontrada nas variáveis de ambiente', 'yellow');
  log('   Tentando senha padrão do Supabase self-hosted...', 'yellow');
  return 'your-super-secret-and-long-postgres-password';
}

// Função principal
async function executeTrainingSetup() {
  let client;
  
  try {
    log('🚀 Iniciando configuração do módulo de treinamentos...', 'cyan');
    log('📋 Baseado na documentação do Supabase self-hosted', 'blue');
    
    // Verifica variáveis de ambiente obrigatórias
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('❌ SUPABASE_URL ou VITE_SUPABASE_URL não encontrada no arquivo .env');
    }
    
    log(`🔗 URL do Supabase: ${supabaseUrl}`, 'blue');
    
    // Extrai configurações de conexão
    const dbConfig = parseSupabaseUrl(supabaseUrl);
    const password = getPostgresPassword();
    
    // Configuração de conexão PostgreSQL
    const connectionConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: password,
      ssl: {
        rejectUnauthorized: false // Para self-hosted com certificados auto-assinados
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    };
    
    log(`🔌 Conectando ao PostgreSQL em ${dbConfig.host}:${dbConfig.port}...`, 'yellow');
    
    // Cria cliente PostgreSQL
    client = new Client(connectionConfig);
    
    // Conecta ao banco
    await client.connect();
    log('✅ Conexão estabelecida com sucesso!', 'green');
    
    // Lê o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'training-module-setup.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`❌ Arquivo SQL não encontrado: ${sqlFilePath}`);
    }
    
    log('📄 Lendo arquivo SQL...', 'yellow');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    log('⚡ Executando SQL no banco de dados...', 'yellow');
    log('   Isso pode levar alguns segundos...', 'blue');
    
    // Executa o SQL
    await client.query(sqlContent);
    
    log('✅ SQL executado com sucesso!', 'green');
    
    // Verifica se as tabelas foram criadas
    log('🔍 Verificando tabelas criadas...', 'yellow');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'training_%' 
      OR table_name LIKE 'assessment_%'
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    const tables = result.rows.map(row => row.table_name);
    
    if (tables.length > 0) {
      log('✅ Tabelas criadas com sucesso:', 'green');
      tables.forEach(table => {
        log(`   📋 ${table}`, 'green');
      });
    } else {
      log('⚠️  Nenhuma tabela de treinamento encontrada', 'yellow');
    }
    
    // Verifica permissões
    log('🔐 Verificando permissões...', 'yellow');
    
    const permissionsQuery = `
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'public' 
      AND grantee IN ('anon', 'authenticated') 
      AND table_name LIKE 'training_%'
      ORDER BY table_name, grantee;
    `;
    
    const permResult = await client.query(permissionsQuery);
    
    if (permResult.rows.length > 0) {
      log('✅ Permissões configuradas:', 'green');
      permResult.rows.forEach(row => {
        log(`   🔑 ${row.grantee} -> ${row.table_name} (${row.privilege_type})`, 'green');
      });
    } else {
      log('⚠️  Permissões podem precisar ser configuradas manualmente', 'yellow');
    }
    
    log('', 'reset');
    log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!', 'green');
    log('', 'reset');
    log('📋 Próximos passos:', 'cyan');
    log('   1. Teste a aplicação frontend', 'blue');
    log('   2. Verifique se os dados de exemplo foram inseridos', 'blue');
    log('   3. Configure usuários administrativos se necessário', 'blue');
    log('', 'reset');
    
  } catch (error) {
    log('', 'reset');
    log('❌ ERRO DURANTE A CONFIGURAÇÃO:', 'red');
    log(`   ${error.message}`, 'red');
    log('', 'reset');
    log('🔧 Possíveis soluções:', 'yellow');
    log('   1. Verifique se o Supabase está rodando', 'yellow');
    log('   2. Confirme as credenciais no arquivo .env', 'yellow');
    log('   3. Verifique a conectividade de rede', 'yellow');
    log('   4. Tente executar o SQL manualmente no Supabase Dashboard', 'yellow');
    log('', 'reset');
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      log('🔌 Conexão fechada', 'blue');
    }
  }
}

// Executa o script
if (import.meta.url === `file://${process.argv[1]}`) {
  executeTrainingSetup();
}

export default executeTrainingSetup;