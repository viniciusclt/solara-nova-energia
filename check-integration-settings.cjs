/**
 * Script para verificar configurações de integração
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIntegrationSettings() {
  console.log('🔍 Verificando configurações de integração...');
  
  try {
    // Verificar todas as configurações
    console.log('\n1️⃣ Buscando todas as configurações...');
    const { data: allSettings, error: allError } = await supabase
      .from('integration_settings')
      .select('*');
    
    if (allError) {
      console.error('❌ Erro ao buscar todas as configurações:', allError.message);
      
      // Verificar se a tabela existe
      if (allError.code === '42P01') {
        console.log('\n💡 A tabela integration_settings não existe!');
        console.log('   Isso explica por que a importação não funciona.');
        console.log('   Solução: Criar a tabela ou usar configurações padrão.');
        return;
      }
    } else {
      console.log('✅ Total de configurações encontradas:', allSettings?.length || 0);
      
      if (allSettings && allSettings.length > 0) {
        allSettings.forEach((setting, index) => {
          console.log(`   ${index + 1}. Tipo: ${setting.integration_type}, Usuário: ${setting.user_id}`);
        });
      }
    }
    
    // Verificar configurações específicas do Google Sheets
    console.log('\n2️⃣ Buscando configurações do Google Sheets...');
    const { data: googleSettings, error: googleError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'google_sheets');
    
    if (googleError) {
      console.error('❌ Erro ao buscar configurações do Google Sheets:', googleError.message);
    } else {
      console.log('✅ Configurações do Google Sheets encontradas:', googleSettings?.length || 0);
      
      if (googleSettings && googleSettings.length > 0) {
        googleSettings.forEach((setting, index) => {
          console.log(`\n   Configuração ${index + 1}:`);
          console.log(`   - ID: ${setting.id}`);
          console.log(`   - Usuário: ${setting.user_id}`);
          console.log(`   - Ativo: ${setting.is_active}`);
          console.log(`   - URL: ${setting.settings?.spreadsheetUrl || 'Não definida'}`);
          console.log(`   - Aba: ${setting.settings?.sheetName || 'Não definida'}`);
        });
      } else {
        console.log('\n💡 Nenhuma configuração do Google Sheets encontrada!');
        console.log('   Isso explica por que a importação retorna 0 leads.');
        console.log('   Solução: Configurar o Google Sheets nas configurações.');
      }
    }
    
    // Verificar usuários autenticados
    console.log('\n3️⃣ Verificando usuário atual...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Nenhum usuário autenticado encontrado');
      console.log('   Isso pode explicar por que não há configurações.');
    } else {
      console.log('✅ Usuário autenticado:', user.id);
      
      // Buscar configurações específicas deste usuário
      const { data: userSettings, error: userError } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('user_id', user.id);
      
      if (userError) {
        console.error('❌ Erro ao buscar configurações do usuário:', userError.message);
      } else {
        console.log('✅ Configurações do usuário atual:', userSettings?.length || 0);
      }
    }
    
    // Verificar estrutura da tabela
    console.log('\n4️⃣ Verificando estrutura da tabela...');
    const { data: tableStructure, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'integration_settings' })
      .limit(1);
    
    if (structureError) {
      console.log('⚠️ Não foi possível verificar a estrutura da tabela');
    } else {
      console.log('✅ Tabela integration_settings existe e é acessível');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

// Executar verificação
checkIntegrationSettings().catch(console.error);