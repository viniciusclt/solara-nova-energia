const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProposalTables() {
  console.log('🔍 Verificando tabelas de propostas...');
  
  // Verificar proposal_elements
  try {
    const { data, error } = await supabase
      .from('proposal_elements')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Tabela proposal_elements não encontrada:', error.message);
    } else {
      console.log('✅ Tabela proposal_elements existe');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar proposal_elements:', err.message);
  }
  
  // Verificar proposal_templates
  try {
    const { data, error } = await supabase
      .from('proposal_templates')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Tabela proposal_templates não encontrada:', error.message);
    } else {
      console.log('✅ Tabela proposal_templates existe');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar proposal_templates:', err.message);
  }
}

checkProposalTables();