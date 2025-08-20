import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase:', SUPABASE_URL);

// Cria o cliente Supabase com a service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyTrainingSetup() {
  console.log('\n🔍 VERIFICAÇÃO DO SETUP DO MÓDULO DE TREINAMENTOS');
  console.log('=' .repeat(60));
  
  const tables = [
    'training_modules',
    'training_content', 
    'user_training_progress',
    'training_assessments',
    'assessment_results'
  ];
  
  let successCount = 0;
  let totalTables = tables.length;
  
  // Verifica cada tabela
  for (const table of tables) {
    try {
      console.log(`\n📋 Verificando tabela: ${table}`);
      
      // Testa se a tabela existe e pode ser acessada
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        
        // Verifica se é erro de permissão ou se a tabela não existe
        if (error.message.includes('does not exist')) {
          console.log(`   💡 Solução: Execute o arquivo training-module-setup.sql`);
        } else if (error.message.includes('permission denied')) {
          console.log(`   💡 Solução: Verifique as permissões RLS da tabela`);
        }
      } else {
        console.log(`✅ ${table}: OK (${count || 0} registros)`);
        successCount++;
        
        // Mostra alguns dados de exemplo se existirem
        if (data && data.length > 0) {
          console.log(`   📊 Exemplo de dados:`);
          if (table === 'training_modules') {
            data.forEach(item => {
              console.log(`      - ${item.title} (${item.category})`);
            });
          } else if (table === 'training_content') {
            data.forEach(item => {
              console.log(`      - ${item.title} (${item.content_type})`);
            });
          } else {
            console.log(`      - ${data.length} registro(s) encontrado(s)`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ ${table}: Erro inesperado - ${error.message}`);
    }
  }
  
  // Resumo final
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 RESUMO: ${successCount}/${totalTables} tabelas funcionando`);
  
  if (successCount === totalTables) {
    console.log('🎉 SUCESSO! Todas as tabelas estão funcionando corretamente!');
    console.log('\n✅ Próximos passos:');
    console.log('   1. Testar a integração com o frontend');
    console.log('   2. Verificar se os componentes de treinamento carregam');
    console.log('   3. Testar criação de progresso de usuário');
    console.log('   4. Verificar se as avaliações funcionam');
    
    // Testa operações básicas
    await testBasicOperations();
    
  } else if (successCount === 0) {
    console.log('❌ ERRO: Nenhuma tabela foi encontrada!');
    console.log('\n💡 Solução:');
    console.log('   1. Execute o arquivo training-module-setup.sql no seu Supabase');
    console.log('   2. Acesse a interface web do Supabase');
    console.log('   3. Vá para SQL Editor');
    console.log('   4. Cole e execute o conteúdo do arquivo training-module-setup.sql');
    
  } else {
    console.log('⚠️  PARCIAL: Algumas tabelas estão faltando ou com problemas');
    console.log('\n💡 Solução:');
    console.log('   1. Verifique os erros acima');
    console.log('   2. Execute novamente o arquivo training-module-setup.sql');
    console.log('   3. Verifique as permissões RLS se necessário');
  }
  
  return successCount === totalTables;
}

async function testBasicOperations() {
  console.log('\n🧪 TESTANDO OPERAÇÕES BÁSICAS');
  console.log('=' .repeat(40));
  
  try {
    // Testa busca de módulos
    console.log('\n📚 Testando busca de módulos...');
    const { data: modules, error: moduleError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true);
    
    if (moduleError) {
      console.log(`❌ Erro ao buscar módulos: ${moduleError.message}`);
    } else {
      console.log(`✅ Módulos encontrados: ${modules?.length || 0}`);
      modules?.forEach(module => {
        console.log(`   - ${module.title} (${module.difficulty_level})`);
      });
    }
    
    // Testa busca de conteúdo
    if (modules && modules.length > 0) {
      console.log('\n📝 Testando busca de conteúdo...');
      const { data: content, error: contentError } = await supabase
        .from('training_content')
        .select('*')
        .eq('module_id', modules[0].id);
      
      if (contentError) {
        console.log(`❌ Erro ao buscar conteúdo: ${contentError.message}`);
      } else {
        console.log(`✅ Conteúdo encontrado: ${content?.length || 0}`);
        content?.forEach(item => {
          console.log(`   - ${item.title} (${item.content_type})`);
        });
      }
    }
    
    // Testa busca de avaliações
    console.log('\n📊 Testando busca de avaliações...');
    const { data: assessments, error: assessmentError } = await supabase
      .from('training_assessments')
      .select('*')
      .eq('is_active', true);
    
    if (assessmentError) {
      console.log(`❌ Erro ao buscar avaliações: ${assessmentError.message}`);
    } else {
      console.log(`✅ Avaliações encontradas: ${assessments?.length || 0}`);
      assessments?.forEach(assessment => {
        console.log(`   - ${assessment.title} (nota mínima: ${assessment.passing_score})`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Erro durante os testes: ${error.message}`);
  }
}

async function checkPermissions() {
  console.log('\n🔐 VERIFICANDO PERMISSÕES');
  console.log('=' .repeat(30));
  
  // Simula acesso como usuário anônimo
  const anonClient = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Testa acesso anônimo aos módulos
    const { data: anonModules, error: anonError } = await anonClient
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    if (anonError) {
      console.log(`❌ Acesso anônimo aos módulos: ${anonError.message}`);
    } else {
      console.log(`✅ Acesso anônimo aos módulos: OK`);
    }
    
  } catch (error) {
    console.log(`❌ Erro ao testar permissões: ${error.message}`);
  }
}

// Executa a verificação
verifyTrainingSetup()
  .then(async (success) => {
    if (success) {
      await checkPermissions();
    }
    console.log('\n🏁 Verificação concluída!');
  })
  .catch(error => {
    console.error('❌ Erro fatal durante a verificação:', error.message);
    process.exit(1);
  });