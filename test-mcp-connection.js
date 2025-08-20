#!/usr/bin/env node

/**
 * Script de teste para verificar a conexão MCP com Supabase Self-Hosted
 * 
 * Este script testa se a configuração MCP está funcionando corretamente
 * e se consegue conectar ao banco PostgreSQL do Supabase.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// Configuração baseada no .env
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env');
  process.exit(1);
}

// Extrair informações da URL
const url = new URL(supabaseUrl);
const host = url.hostname;
const port = url.port || 5432;

// String de conexão para MCP (mesma usada no .mcp.json)
const connectionString = `postgresql://postgres:${serviceKey}@${host}:${port}/postgres?sslmode=require`;

console.log('🔧 Testando conexão MCP com Supabase Self-Hosted...');
console.log(`📍 Host: ${host}:${port}`);
console.log(`🔗 Connection String: postgresql://postgres:***@${host}:${port}/postgres?sslmode=require`);

async function testMCPConnection() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    console.log('\n🔌 Conectando...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Teste básico: listar tabelas
    console.log('\n📋 Testando consulta básica...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`✅ Encontradas ${tablesResult.rows.length} tabelas públicas:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Teste específico: verificar tabela leads
    console.log('\n🎯 Verificando tabela leads...');
    try {
      const leadsResult = await client.query('SELECT COUNT(*) as total FROM leads LIMIT 1');
      console.log(`✅ Tabela leads encontrada com ${leadsResult.rows[0].total} registros`);
    } catch (leadsError) {
      console.log('⚠️  Tabela leads não encontrada ou sem permissão');
    }

    // Teste de estrutura da tabela leads
    console.log('\n🔍 Verificando estrutura da tabela leads...');
    try {
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        ORDER BY ordinal_position;
      `);
      
      if (structureResult.rows.length > 0) {
        console.log('✅ Estrutura da tabela leads:');
        structureResult.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      } else {
        console.log('⚠️  Não foi possível obter a estrutura da tabela leads');
      }
    } catch (structError) {
      console.log('⚠️  Erro ao verificar estrutura da tabela leads:', structError.message);
    }

    console.log('\n🎉 Teste de conexão MCP concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Configure sua ferramenta de IA (VS Code, Claude Code, etc.)');
    console.log('2. Use a string de conexão testada acima');
    console.log('3. Teste comandos como "Mostre todas as tabelas" na sua IA');

  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verifique se o Supabase está rodando');
    console.log('2. Confirme as credenciais no arquivo .env');
    console.log('3. Teste a conectividade de rede');
    console.log('4. Verifique as configurações de SSL/TLS');
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Conexão fechada.');
    } catch (e) {
      // Ignorar erros ao fechar
    }
  }
}

// Executar teste
testMCPConnection().catch(console.error);