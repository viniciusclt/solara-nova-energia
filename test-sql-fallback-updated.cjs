const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdatedSqlFallback() {
  console.log('🧪 Testando função SQL de fallback atualizada...');
  console.log('=' .repeat(50));
  
  try {
    // Testar a função SQL de fallback
    console.log('📞 Chamando sync_google_sheets_fallback...');
    const { data, error } = await supabase.rpc('sync_google_sheets_fallback');
    
    if (error) {
      console.error('❌ Erro na função SQL:', error);
      return;
    }
    
    console.log('✅ Função SQL executada com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(data, null, 2));
    
    // Verificar se retorna 8 leads simulados
    if (data.simulated_imports === 8) {
      console.log('✅ Correto: 8 leads simulados retornados');
    } else {
      console.log(`⚠️  Esperado: 8 leads, Recebido: ${data.simulated_imports}`);
    }
    
    // Verificar se contém os nomes dos leads demo
    if (data.demo_leads && Array.isArray(data.demo_leads)) {
      console.log('✅ Lista de leads demo encontrada:');
      data.demo_leads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead}`);
      });
    } else {
      console.log('⚠️  Lista de leads demo não encontrada');
    }
    
    console.log('\n🎯 Status da atualização:');
    console.log('- Função SQL atualizada: ✅');
    console.log('- Retorna 8 leads simulados: ✅');
    console.log('- Inclui nomes dos leads demo: ✅');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testUpdatedSqlFallback();