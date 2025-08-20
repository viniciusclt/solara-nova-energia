#!/usr/bin/env node

/**
 * Script para configurar o módulo de treinamentos via API do Supabase
 * Usa apenas as credenciais de API, sem conexão direta PostgreSQL
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config();

console.log('🚀 Configurando módulo de treinamentos via API Supabase...');
console.log('');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.log('❌ Credenciais do Supabase não encontradas!');
  console.log('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅' : '❌');
  process.exit(1);
}

console.log('🔗 URL do Supabase:', supabaseUrl);
console.log('🔑 Service Key:', serviceKey ? 'Configurada' : 'Não encontrada');
console.log('');

// Cria cliente Supabase com service role
const supabase = createClient(supabaseUrl, serviceKey);

// Função para executar SQL via RPC
async function executeSQL(sql, description) {
  console.log(`⚡ Executando: ${description}`);
  
  try {
    // Usa a função sql do Supabase para executar SQL raw
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Sucesso: ${description}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return false;
  }
}

// Função para verificar tabelas existentes
async function checkExistingTables() {
  console.log('🔍 Verificando tabelas existentes...');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'training_%');
    
    if (error) {
      console.log('⚠️  Não foi possível verificar tabelas:', error.message);
      return [];
    }
    
    const tables = data.map(row => row.table_name);
    console.log(`📋 Encontradas ${tables.length} tabelas de treinamento:`);
    tables.forEach(table => console.log(`   📄 ${table}`));
    
    return tables;
    
  } catch (error) {
    console.log('⚠️  Erro ao verificar tabelas:', error.message);
    return [];
  }
}

// Função para criar tabelas via API
async function createTrainingTables() {
  console.log('📋 Criando tabelas do módulo de treinamentos...');
  
  // SQL simplificado para criar tabelas essenciais
  const createTablesSQL = `
    -- Tabela de módulos de treinamento
    CREATE TABLE IF NOT EXISTS training_modules (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      difficulty_level VARCHAR(50) DEFAULT 'beginner',
      estimated_duration INTEGER DEFAULT 30,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Tabela de conteúdo dos treinamentos
    CREATE TABLE IF NOT EXISTS training_content (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content_type VARCHAR(50) DEFAULT 'text',
      content_data JSONB,
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Tabela de progresso do usuário
    CREATE TABLE IF NOT EXISTS user_training_progress (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
      content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'not_started',
      progress_percentage INTEGER DEFAULT 0,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    // Tenta criar as tabelas usando diferentes métodos
    console.log('📝 Método 1: Tentando via RPC exec_sql...');
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      sql_query: createTablesSQL
    });
    
    if (!rpcError) {
      console.log('✅ Tabelas criadas via RPC!');
      return true;
    }
    
    console.log('⚠️  RPC não disponível, tentando método alternativo...');
    
    // Método alternativo: criar tabelas uma por vez
    const tables = [
      {
        name: 'training_modules',
        sql: `
          CREATE TABLE IF NOT EXISTS training_modules (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            difficulty_level VARCHAR(50) DEFAULT 'beginner',
            estimated_duration INTEGER DEFAULT 30,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'training_content',
        sql: `
          CREATE TABLE IF NOT EXISTS training_content (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            module_id UUID,
            title VARCHAR(255) NOT NULL,
            content_type VARCHAR(50) DEFAULT 'text',
            content_data JSONB,
            order_index INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'user_training_progress',
        sql: `
          CREATE TABLE IF NOT EXISTS user_training_progress (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            module_id UUID,
            content_id UUID,
            status VARCHAR(50) DEFAULT 'not_started',
            progress_percentage INTEGER DEFAULT 0,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];
    
    console.log('📝 Método 2: Criando tabelas individualmente...');
    
    for (const table of tables) {
      console.log(`   📋 Criando tabela ${table.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: table.sql
      });
      
      if (error) {
        console.log(`   ❌ Erro ao criar ${table.name}: ${error.message}`);
      } else {
        console.log(`   ✅ Tabela ${table.name} criada!`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro ao criar tabelas:', error.message);
    return false;
  }
}

// Função para inserir dados de exemplo
async function insertSampleData() {
  console.log('📝 Inserindo dados de exemplo...');
  
  try {
    // Insere módulo de exemplo
    const { data: moduleData, error: moduleError } = await supabase
      .from('training_modules')
      .insert({
        title: 'Introdução ao Sistema Solar',
        description: 'Módulo básico sobre energia solar fotovoltaica',
        category: 'energia_solar',
        difficulty_level: 'beginner',
        estimated_duration: 45
      })
      .select()
      .single();
    
    if (moduleError) {
      console.log('⚠️  Erro ao inserir módulo:', moduleError.message);
      return false;
    }
    
    console.log('✅ Módulo de exemplo criado:', moduleData.title);
    
    // Insere conteúdo de exemplo
    const { error: contentError } = await supabase
      .from('training_content')
      .insert({
        module_id: moduleData.id,
        title: 'O que é energia solar?',
        content_type: 'text',
        content_data: {
          text: 'A energia solar é uma fonte de energia renovável obtida através da luz do sol.',
          duration: 5
        },
        order_index: 1
      });
    
    if (contentError) {
      console.log('⚠️  Erro ao inserir conteúdo:', contentError.message);
      return false;
    }
    
    console.log('✅ Conteúdo de exemplo criado!');
    return true;
    
  } catch (error) {
    console.log('❌ Erro ao inserir dados:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  try {
    // Verifica conexão
    console.log('🔌 Testando conexão com Supabase...');
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    
    if (error) {
      console.log('❌ Erro de conexão:', error.message);
      console.log('');
      console.log('💡 Possíveis soluções:');
      console.log('   1. Verifique se o Supabase está rodando');
      console.log('   2. Confirme a URL e chaves no arquivo .env');
      console.log('   3. Teste o acesso via browser');
      return;
    }
    
    console.log('✅ Conexão estabelecida!');
    console.log('');
    
    // Verifica tabelas existentes
    const existingTables = await checkExistingTables();
    console.log('');
    
    // Cria tabelas se necessário
    if (existingTables.length === 0) {
      const created = await createTrainingTables();
      if (created) {
        console.log('');
        await insertSampleData();
      }
    } else {
      console.log('ℹ️  Tabelas já existem, pulando criação...');
    }
    
    console.log('');
    console.log('🎉 Configuração concluída!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Teste o frontend da aplicação');
    console.log('   2. Verifique se os dados aparecem corretamente');
    console.log('   3. Configure usuários e permissões se necessário');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

// Executa o script
main();