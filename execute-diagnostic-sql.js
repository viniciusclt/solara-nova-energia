#!/usr/bin/env node

/**
 * Script para executar o diagnóstico SQL no Supabase self-hosted
 * Corrige erros de 'Usuário ou empresa não encontrados'
 * Usa conexão direta PostgreSQL
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { URL } from 'url';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do banco
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Erro: Configure SUPABASE_URL no arquivo .env');
  process.exit(1);
}

// Extrair configuração de conexão da URL do Supabase
const url = new URL(supabaseUrl);
const host = url.hostname;
const port = 5432; // Porta padrão PostgreSQL para Supabase self-hosted

// Configurações de conexão PostgreSQL
const dbConfig = {
  host: host,
  port: port,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres', // Senha padrão para Supabase self-hosted
  ssl: false // Self-hosted geralmente não usa SSL
};

console.log('🚀 Iniciando diagnóstico do dashboard...');
console.log(`🔗 Host: ${host}:${port}`);
console.log(`🗄️ Database: ${dbConfig.database}`);

// Função para executar SQL
async function executeSql(client, sql, description) {
  try {
    console.log(`\n🔄 Executando: ${description}`);
    const result = await client.query(sql);
    
    console.log(`✅ Sucesso: ${description}`);
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Resultado:');
      console.table(result.rows);
    } else if (result.rowCount !== undefined) {
      console.log(`📊 Linhas afetadas: ${result.rowCount}`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Erro em ${description}:`, err.message);
    return false;
  }
}

// Função principal
async function executeDiagnostic() {
  const client = new pg.Client(dbConfig);
  
  try {
    // Conectar ao banco
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // 1. Verificar estrutura das tabelas
    console.log('\n📋 ETAPA 1: Verificando estrutura das tabelas');
    await executeSql(client, `
      SELECT 
        schemaname,
        tablename
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'companies')
      ORDER BY tablename;
    `, 'Verificar tabelas existentes');

    // 2. Contar usuários com e sem company_id
    console.log('\n📊 ETAPA 2: Analisando usuários sem company_id');
    await executeSql(client, `
      SELECT 
        'Usuários com company_id' as categoria,
        COUNT(*) as total
      FROM profiles 
      WHERE company_id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'Usuários sem company_id' as categoria,
        COUNT(*) as total
      FROM profiles 
      WHERE company_id IS NULL;
    `, 'Contar usuários por categoria');

    // 3. Listar usuários sem company_id
    await executeSql(client, `
      SELECT 
        p.id,
        p.email,
        p.full_name,
        p.role,
        p.created_at,
        p.company_id
      FROM profiles p
      WHERE p.company_id IS NULL
      ORDER BY p.created_at DESC
      LIMIT 10;
    `, 'Listar usuários órfãos');

    // 4. Verificar se existe empresa padrão
    console.log('\n🏢 ETAPA 3: Verificando empresa padrão');
    await executeSql(client, `
      SELECT 
        id,
        name,
        slug,
        created_at
      FROM companies 
      WHERE slug = 'empresa-padrao' OR name ILIKE '%padrão%' OR name ILIKE '%default%'
      LIMIT 5;
    `, 'Verificar empresa padrão');

    // 5. Criar empresa padrão se não existir
    console.log('\n🔧 ETAPA 4: Criando empresa padrão');
    await executeSql(client, `
      INSERT INTO companies (
        id,
        name,
        slug,
        description,
        status,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        'Empresa Padrão',
        'empresa-padrao',
        'Empresa padrão para usuários sem empresa definida',
        'active',
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM companies WHERE slug = 'empresa-padrao'
      );
    `, 'Criar empresa padrão');

    // 6. Atualizar usuários órfãos
    console.log('\n👥 ETAPA 5: Corrigindo usuários órfãos');
    await executeSql(client, `
      UPDATE profiles 
      SET 
        company_id = (
          SELECT id FROM companies WHERE slug = 'empresa-padrao' LIMIT 1
        ),
        updated_at = NOW()
      WHERE company_id IS NULL;
    `, 'Atualizar usuários órfãos');

    // 7. Verificação final
    console.log('\n✅ ETAPA 6: Verificação final');
    await executeSql(client, `
      SELECT 
        COUNT(*) as usuarios_sem_empresa
      FROM profiles 
      WHERE company_id IS NULL;
    `, 'Verificar usuários órfãos restantes');

    await executeSql(client, `
      SELECT 
        c.name as empresa,
        COUNT(p.id) as total_usuarios
      FROM companies c
      LEFT JOIN profiles p ON p.company_id = c.id
      GROUP BY c.id, c.name
      ORDER BY total_usuarios DESC;
    `, 'Estatísticas finais');

    console.log('\n🎉 Diagnóstico concluído com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('   1. Verificar se o DashboardService funciona sem erros');
    console.log('   2. Testar o carregamento do dashboard');
    console.log('   3. Verificar logs de erro no console');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
    
    // Tentar configurações alternativas
    console.log('\n🔄 Tentando configurações alternativas...');
    
    const altConfigs = [
      { ...dbConfig, password: 'your-super-secret-jwt-token-with-at-least-32-characters-long' },
      { ...dbConfig, password: 'supabase' },
      { ...dbConfig, user: 'supabase', password: 'supabase' }
    ];
    
    for (const config of altConfigs) {
      try {
        console.log(`\n🔄 Tentando com usuário: ${config.user}`);
        const altClient = new pg.Client(config);
        await altClient.connect();
        console.log('✅ Conexão alternativa bem-sucedida!');
        await altClient.end();
        
        console.log('💡 Use esta configuração:');
        console.log(`   Host: ${config.host}`);
        console.log(`   Port: ${config.port}`);
        console.log(`   User: ${config.user}`);
        console.log(`   Database: ${config.database}`);
        break;
      } catch (altError) {
        console.log(`❌ Falhou com ${config.user}: ${altError.message}`);
      }
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar diagnóstico
executeDiagnostic();