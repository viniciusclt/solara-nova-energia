import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios no arquivo .env');
  process.exit(1);
}

// Cliente Supabase (simulando o frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Testes de integração com as tabelas do módulo de treinamentos
const TRAINING_TABLES = [
  'training_modules',
  'training_content', 
  'user_training_progress',
  'training_assessments',
  'assessment_results'
];

async function testTableConnection(tableName) {
  try {
    console.log(`\n🔄 Testando conexão com a tabela: ${tableName}`);
    
    // Tentar buscar dados da tabela
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error(`❌ Erro ao acessar ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Tabela ${tableName} acessível`);
    console.log(`   📊 Total de registros: ${count || 0}`);
    console.log(`   📋 Registros retornados: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      console.log(`   🔍 Exemplo de dados:`);
      console.log(`   ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro inesperado ao testar ${tableName}: ${error.message}`);
    return false;
  }
}

async function testTrainingModulesQueries() {
  console.log('\n🎯 Testando consultas específicas do módulo de treinamentos...');
  
  try {
    // Teste 1: Buscar módulos ativos
    console.log('\n📚 Teste 1: Buscar módulos de treinamento ativos');
    const { data: activeModules, error: error1 } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error1) {
      console.error(`❌ Erro: ${error1.message}`);
    } else {
      console.log(`✅ Encontrados ${activeModules?.length || 0} módulos ativos`);
    }
    
    // Teste 2: Buscar conteúdo de um módulo
    if (activeModules && activeModules.length > 0) {
      console.log('\n📖 Teste 2: Buscar conteúdo do primeiro módulo');
      const moduleId = activeModules[0].id;
      
      const { data: content, error: error2 } = await supabase
        .from('training_content')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index');
      
      if (error2) {
        console.error(`❌ Erro: ${error2.message}`);
      } else {
        console.log(`✅ Encontrados ${content?.length || 0} itens de conteúdo para o módulo`);
      }
    }
    
    // Teste 3: Buscar avaliações
    console.log('\n📝 Teste 3: Buscar avaliações disponíveis');
    const { data: assessments, error: error3 } = await supabase
      .from('training_assessments')
      .select('*')
      .eq('is_active', true);
    
    if (error3) {
      console.error(`❌ Erro: ${error3.message}`);
    } else {
      console.log(`✅ Encontradas ${assessments?.length || 0} avaliações ativas`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro nos testes de consulta: ${error.message}`);
    return false;
  }
}

async function testUserProgressSimulation() {
  console.log('\n👤 Testando simulação de progresso do usuário...');
  
  try {
    // Simular um usuário fictício para teste
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    // Buscar progresso do usuário
    const { data: progress, error } = await supabase
      .from('user_training_progress')
      .select(`
        *,
        training_modules(title, description),
        training_content(title, content_type)
      `)
      .eq('user_id', testUserId);
    
    if (error) {
      console.error(`❌ Erro ao buscar progresso: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Consulta de progresso executada com sucesso`);
    console.log(`   📊 Registros de progresso encontrados: ${progress?.length || 0}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro no teste de progresso: ${error.message}`);
    return false;
  }
}

async function testStorageAccess() {
  console.log('\n💾 Testando acesso aos buckets de storage...');
  
  try {
    // Listar buckets disponíveis
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error(`❌ Erro ao acessar storage: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Storage acessível`);
    console.log(`   📁 Buckets disponíveis: ${buckets?.length || 0}`);
    
    const trainingBuckets = buckets?.filter(bucket => 
      bucket.name.startsWith('training-')
    ) || [];
    
    console.log(`   🎯 Buckets de treinamento: ${trainingBuckets.length}`);
    trainingBuckets.forEach(bucket => {
      console.log(`      - ${bucket.name}`);
    });
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro no teste de storage: ${error.message}`);
    return false;
  }
}

async function generateIntegrationReport() {
  console.log('\n📋 Gerando relatório de integração...');
  
  const report = {
    timestamp: new Date().toISOString(),
    supabaseUrl: supabaseUrl,
    tablesAccessible: 0,
    totalTables: TRAINING_TABLES.length,
    queriesWorking: false,
    storageAccessible: false,
    recommendations: []
  };
  
  // Contar tabelas acessíveis
  for (const table of TRAINING_TABLES) {
    const accessible = await testTableConnection(table);
    if (accessible) report.tablesAccessible++;
  }
  
  // Testar consultas
  report.queriesWorking = await testTrainingModulesQueries();
  
  // Testar storage
  report.storageAccessible = await testStorageAccess();
  
  // Gerar recomendações
  if (report.tablesAccessible < report.totalTables) {
    report.recommendations.push('Algumas tabelas não estão acessíveis - verificar RLS policies');
  }
  
  if (!report.queriesWorking) {
    report.recommendations.push('Consultas complexas falhando - verificar relacionamentos entre tabelas');
  }
  
  if (!report.storageAccessible) {
    report.recommendations.push('Storage não acessível - executar script setup-storage-buckets.js');
  }
  
  // Exibir relatório
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE INTEGRAÇÃO FRONTEND-BACKEND');
  console.log('='.repeat(60));
  console.log(`🕐 Data/Hora: ${report.timestamp}`);
  console.log(`🌐 Supabase URL: ${report.supabaseUrl}`);
  console.log(`📊 Tabelas acessíveis: ${report.tablesAccessible}/${report.totalTables}`);
  console.log(`🔍 Consultas funcionando: ${report.queriesWorking ? '✅' : '❌'}`);
  console.log(`💾 Storage acessível: ${report.storageAccessible ? '✅' : '❌'}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n🔧 Recomendações:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  const overallScore = (
    (report.tablesAccessible / report.totalTables) * 40 +
    (report.queriesWorking ? 30 : 0) +
    (report.storageAccessible ? 30 : 0)
  );
  
  console.log(`\n🎯 Score geral: ${overallScore.toFixed(0)}%`);
  
  if (overallScore >= 90) {
    console.log('🎉 Integração frontend-backend está funcionando perfeitamente!');
  } else if (overallScore >= 70) {
    console.log('⚠️  Integração funcionando com algumas limitações.');
  } else {
    console.log('❌ Integração precisa de ajustes antes do uso em produção.');
  }
  
  console.log('='.repeat(60));
  
  return report;
}

async function main() {
  console.log('🚀 Iniciando testes de integração frontend-backend...');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}`);
  
  // Executar todos os testes
  await generateIntegrationReport();
  
  console.log('\n✨ Testes de integração concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Corrigir problemas identificados no relatório');
  console.log('   2. Executar setup-storage-buckets.js se necessário');
  console.log('   3. Testar componentes React reais com essas consultas');
  console.log('   4. Implementar autenticação de usuários');
}

// Executar o script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  testTableConnection,
  testTrainingModulesQueries,
  testUserProgressSimulation,
  testStorageAccess,
  generateIntegrationReport
};