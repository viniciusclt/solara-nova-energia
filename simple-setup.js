#!/usr/bin/env node

/**
 * Script simplificado para configurar tabelas via Supabase API
 * Foca apenas na criação das tabelas essenciais
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carrega variáveis de ambiente
dotenv.config();

console.log('🚀 Setup simplificado do módulo de treinamentos...');
console.log('');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.log('❌ Credenciais não encontradas!');
  process.exit(1);
}

console.log('🔗 URL:', supabaseUrl);
console.log('🔑 Service Key:', serviceKey ? 'OK' : 'Faltando');
console.log('');

// Cria cliente Supabase
const supabase = createClient(supabaseUrl, serviceKey);

// Função para testar conexão básica
async function testBasicConnection() {
  console.log('🔌 Testando conexão básica...');
  
  try {
    // Testa uma operação simples
    const { data, error } = await supabase.auth.getSession();
    
    if (error && !error.message.includes('session')) {
      console.log('❌ Erro de conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão básica funcionando!');
    return true;
    
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
    return false;
  }
}

// Função para criar tabela training_modules
async function createTrainingModulesTable() {
  console.log('📋 Criando tabela training_modules...');
  
  try {
    const { data, error } = await supabase
      .from('training_modules')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('ℹ️  Tabela training_modules já existe!');
      return true;
    }
    
    // Se a tabela não existe, tenta criar via insert (vai falhar mas pode dar dica)
    console.log('⚠️  Tabela não existe, tentando operação de teste...');
    
    const { error: insertError } = await supabase
      .from('training_modules')
      .insert({
        title: 'Teste',
        description: 'Teste de criação'
      });
    
    if (insertError) {
      console.log('❌ Erro esperado:', insertError.message);
      
      if (insertError.message.includes('does not exist')) {
        console.log('💡 A tabela precisa ser criada manualmente no Supabase Dashboard');
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
    return false;
  }
}

// Função para verificar se as tabelas existem
async function checkTables() {
  console.log('🔍 Verificando tabelas existentes...');
  
  const tables = ['training_modules', 'training_content', 'user_training_progress'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results[table] = false;
      } else {
        console.log(`✅ ${table}: OK`);
        results[table] = true;
      }
      
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      results[table] = false;
    }
  }
  
  return results;
}

// Função para inserir dados de teste
async function insertTestData() {
  console.log('📝 Inserindo dados de teste...');
  
  try {
    // Tenta inserir um módulo de teste
    const { data, error } = await supabase
      .from('training_modules')
      .insert({
        title: 'Módulo de Teste',
        description: 'Módulo criado pelo script de setup',
        category: 'teste',
        difficulty_level: 'beginner',
        estimated_duration: 30
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erro ao inserir:', error.message);
      return false;
    }
    
    console.log('✅ Dados de teste inseridos!');
    console.log('   ID:', data.id);
    console.log('   Título:', data.title);
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  try {
    // Teste de conexão básica
    const connected = await testBasicConnection();
    if (!connected) {
      console.log('');
      console.log('💡 Soluções:');
      console.log('   1. Verifique se o Supabase está rodando');
      console.log('   2. Teste o acesso via browser');
      console.log('   3. Confirme as credenciais');
      return;
    }
    
    console.log('');
    
    // Verifica tabelas
    const tableResults = await checkTables();
    console.log('');
    
    const existingTables = Object.values(tableResults).filter(Boolean).length;
    const totalTables = Object.keys(tableResults).length;
    
    if (existingTables === 0) {
      console.log('📋 INSTRUÇÕES PARA CRIAR TABELAS:');
      console.log('');
      console.log('1. Acesse o Supabase Dashboard no browser:');
      console.log(`   ${supabaseUrl.replace('/rest/v1', '')}/project/default/editor`);
      console.log('');
      console.log('2. Vá para a aba "SQL Editor"');
      console.log('');
      console.log('3. Execute o SQL do arquivo: training-module-setup.sql');
      console.log('');
      console.log('4. Execute este script novamente para testar');
      
    } else if (existingTables === totalTables) {
      console.log('🎉 Todas as tabelas existem!');
      
      // Tenta inserir dados de teste
      const inserted = await insertTestData();
      
      if (inserted) {
        console.log('');
        console.log('✅ Setup concluído com sucesso!');
        console.log('📋 Próximos passos:');
        console.log('   1. Teste o frontend da aplicação');
        console.log('   2. Verifique se os dados aparecem');
        console.log('   3. Configure permissões se necessário');
      }
      
    } else {
      console.log(`⚠️  Apenas ${existingTables}/${totalTables} tabelas existem`);
      console.log('💡 Execute o SQL completo no Supabase Dashboard');
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

// Executa
main();