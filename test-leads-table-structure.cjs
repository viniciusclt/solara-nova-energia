const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeadsTableStructure() {
  console.log('🔍 Verificando estrutura da tabela leads...');
  console.log('=' .repeat(50));
  
  try {
    // Tentar buscar um lead com o máximo de colunas possíveis
    console.log('\n1. Testando busca com todas as colunas possíveis:');
    const { data: allLeads, error: allError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (allError) {
      console.log('❌ Erro ao buscar todas as colunas:', allError.message);
    } else {
      console.log('✅ Busca com * funcionou!');
      if (allLeads && allLeads.length > 0) {
        console.log('\nColunas disponíveis na tabela leads:');
        const columns = Object.keys(allLeads[0]);
        columns.forEach(col => {
          console.log(`  - ${col}: ${typeof allLeads[0][col]} (${allLeads[0][col]})`);
        });
        
        console.log('\nEstrutura completa do primeiro lead:');
        console.log(JSON.stringify(allLeads[0], null, 2));
      } else {
        console.log('Nenhum lead encontrado na tabela.');
      }
    }
    
    // Verificar se as colunas específicas existem
    const columnsToTest = [
      'consumo_medio',
      'consumo_mensal', 
      'address',
      'status',
      'cpf_cnpj',
      'phone',
      'email'
    ];
    
    console.log('\n2. Testando colunas específicas:');
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select(`id, ${column}`)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${column}: ${error.message}`);
        } else {
          console.log(`✅ ${column}: existe`);
        }
      } catch (err) {
        console.log(`❌ ${column}: erro - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testLeadsTableStructure().then(() => {
  console.log('\n🏁 Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});