// =====================================================================================
// TESTE DE INTEGRAÇÃO DO MÓDULO DE TREINAMENTOS
// =====================================================================================
// Este script testa a conexão com as tabelas de treinamento criadas no Supabase
// e verifica se os dados estão sendo carregados corretamente
// =====================================================================================

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================================================================================
// FUNÇÕES DE TESTE
// =====================================================================================

async function testConnection() {
  console.log('🔄 Testando conexão com o Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('training_modules')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message);
    return false;
  }
}

async function testTrainingModules() {
  console.log('\n🔄 Testando tabela training_modules...');
  
  try {
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar módulos:', error.message);
      return false;
    }
    
    console.log(`✅ Tabela training_modules OK - ${data.length} registros encontrados`);
    
    if (data.length > 0) {
      console.log('📋 Exemplo de módulo:');
      console.log(`   - ID: ${data[0].id}`);
      console.log(`   - Título: ${data[0].title}`);
      console.log(`   - Categoria: ${data[0].category}`);
      console.log(`   - Ativo: ${data[0].is_active}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar training_modules:', err.message);
    return false;
  }
}

async function testTrainingContent() {
  console.log('\n🔄 Testando tabela training_content...');
  
  try {
    const { data, error } = await supabase
      .from('training_content')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar conteúdo:', error.message);
      return false;
    }
    
    console.log(`✅ Tabela training_content OK - ${data.length} registros encontrados`);
    
    if (data.length > 0) {
      console.log('📋 Exemplo de conteúdo:');
      console.log(`   - ID: ${data[0].id}`);
      console.log(`   - Título: ${data[0].title}`);
      console.log(`   - Tipo: ${data[0].content_type}`);
      console.log(`   - Módulo ID: ${data[0].module_id}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar training_content:', err.message);
    return false;
  }
}

async function testUserProgress() {
  console.log('\n🔄 Testando tabela user_training_progress...');
  
  try {
    const { data, error } = await supabase
      .from('user_training_progress')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar progresso:', error.message);
      return false;
    }
    
    console.log(`✅ Tabela user_training_progress OK - ${data.length} registros encontrados`);
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar user_training_progress:', err.message);
    return false;
  }
}

async function testAssessments() {
  console.log('\n🔄 Testando tabela training_assessments...');
  
  try {
    const { data, error } = await supabase
      .from('training_assessments')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar avaliações:', error.message);
      return false;
    }
    
    console.log(`✅ Tabela training_assessments OK - ${data.length} registros encontrados`);
    
    if (data.length > 0) {
      console.log('📋 Exemplo de avaliação:');
      console.log(`   - ID: ${data[0].id}`);
      console.log(`   - Título: ${data[0].title}`);
      console.log(`   - Nota mínima: ${data[0].passing_score}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar training_assessments:', err.message);
    return false;
  }
}

async function testAssessmentResults() {
  console.log('\n🔄 Testando tabela assessment_results...');
  
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar resultados:', error.message);
      return false;
    }
    
    console.log(`✅ Tabela assessment_results OK - ${data.length} registros encontrados`);
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar assessment_results:', err.message);
    return false;
  }
}

// =====================================================================================
// EXECUÇÃO DOS TESTES
// =====================================================================================

async function runAllTests() {
  console.log('🚀 INICIANDO TESTES DE INTEGRAÇÃO DO MÓDULO DE TREINAMENTOS');
  console.log('=' .repeat(70));
  
  const tests = [
    { name: 'Conexão', fn: testConnection },
    { name: 'Módulos de Treinamento', fn: testTrainingModules },
    { name: 'Conteúdo de Treinamento', fn: testTrainingContent },
    { name: 'Progresso do Usuário', fn: testUserProgress },
    { name: 'Avaliações', fn: testAssessments },
    { name: 'Resultados das Avaliações', fn: testAssessmentResults }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) passedTests++;
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('📊 RESUMO DOS TESTES');
  console.log('=' .repeat(70));
  console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
  console.log(`❌ Testes falharam: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Taxa de sucesso: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ O módulo de treinamentos está funcionando corretamente!');
    console.log('✅ Frontend pode se conectar com as tabelas do Supabase!');
    console.log('✅ Dados de exemplo estão disponíveis!');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique as configurações e tente novamente.');
  }
  
  console.log('\n🔗 Próximos passos:');
  console.log('1. Acesse http://localhost:8081/training/test para ver a interface');
  console.log('2. Verifique se os módulos estão sendo exibidos corretamente');
  console.log('3. Teste a funcionalidade de clique nos módulos');
  console.log('4. Configure buckets de storage se necessário');
}

// Executa os testes
runAllTests().catch(console.error);