const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyProposalTables() {
  console.log('🔍 Verificando tabelas de propostas...');
  console.log('=' .repeat(50));
  
  const tables = [
    { name: 'proposal_templates', description: 'Templates de Propostas' },
    { name: 'proposal_elements', description: 'Elementos de Propostas' }
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Verificando ${table.description} (${table.name})...`);
      
      // Tentar fazer uma consulta simples na tabela
      const { data, error, count } = await supabase
        .from(table.name)
        .select('id', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table.description}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table.description}: OK`);
        console.log(`   📊 Registros encontrados: ${count || 0}`);
        
        // Se for proposal_templates, mostrar alguns detalhes
        if (table.name === 'proposal_templates' && count > 0) {
          const { data: templates } = await supabase
            .from('proposal_templates')
            .select('name, description, is_active')
            .limit(3);
          
          if (templates && templates.length > 0) {
            console.log('   📝 Templates encontrados:');
            templates.forEach(template => {
              console.log(`      - ${template.name} (${template.is_active ? 'Ativo' : 'Inativo'})`);
            });
          }
        }
        
        // Se for proposal_elements, mostrar alguns detalhes
        if (table.name === 'proposal_elements' && count > 0) {
          const { data: elements } = await supabase
            .from('proposal_elements')
            .select('element_type, template_id')
            .limit(3);
          
          if (elements && elements.length > 0) {
            console.log('   🧩 Elementos encontrados:');
            elements.forEach(element => {
              console.log(`      - Tipo: ${element.element_type}`);
            });
          }
        }
      }
    } catch (err) {
      console.log(`❌ ${table.description}: Erro inesperado - ${err.message}`);
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (allTablesExist) {
    console.log('🎉 Todas as tabelas de propostas estão funcionando corretamente!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. As tabelas estão prontas para uso');
    console.log('   2. Você pode começar a usar o editor de propostas');
    console.log('   3. Os erros ERR_ABORTED relacionados a proposal_elements devem estar resolvidos');
  } else {
    console.log('⚠️  Algumas tabelas ainda não estão disponíveis.');
    console.log('\n📋 Para resolver:');
    console.log('   1. Execute o arquivo create-proposal-tables-manual.sql no Supabase Dashboard');
    console.log('   2. Acesse: https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br/project/default/sql');
    console.log('   3. Cole o conteúdo do arquivo e execute');
    console.log('   4. Execute este script novamente para verificar');
  }
  
  console.log('\n🔗 Links úteis:');
  console.log('   - Supabase Dashboard: https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br');
  console.log('   - SQL Editor: https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br/project/default/sql');
}

verifyProposalTables();