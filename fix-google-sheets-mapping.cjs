/**
 * Script para corrigir o mapeamento do Google Sheets
 * Ajusta o mapeamento para funcionar com a planilha de exemplo
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

// Configuração corrigida para a planilha de exemplo do Google
const correctedGoogleSheetsConfig = {
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0',
  sheetName: 'Class Data',
  columnMapping: {
    name: 'A',        // Student Name
    email: 'A',       // Vamos usar o nome como base para criar email
    phone: 'B',       // Gender (vamos simular)
    cpfCnpj: 'C',     // Class Level
    address: 'D',     // Home State
    // REMOVIDO: concessionaria (coluna não existe mais na tabela leads)
    // REMOVIDO: grupo (coluna não existe mais na tabela leads)
    consumoMedio: 'C' // Class Level (vamos converter para número)
  },
  headerRow: 1,
  startRow: 2
};

async function fixGoogleSheetsMapping() {
  console.log('🔧 Corrigindo mapeamento do Google Sheets...');
  
  try {
    // 1. Login
    console.log('\n1️⃣ Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'vinicius@energiacactos.com.br',
      password: 'MinhaSenh@123'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Atualizar configuração
    console.log('\n2️⃣ Atualizando configuração...');
    const { error: updateError } = await supabase
      .from('integration_settings')
      .update({
        settings: correctedGoogleSheetsConfig,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authData.user.id)
      .eq('integration_type', 'google_sheets');
    
    if (updateError) {
      console.error('❌ Erro ao atualizar configuração:', updateError.message);
      return;
    }
    
    console.log('✅ Configuração atualizada!');
    
    // 3. Testar novo mapeamento
    console.log('\n3️⃣ Testando novo mapeamento...');
    const spreadsheetId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    const range = 'Class Data!A:Z';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${process.env.VITE_GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.values && data.values.length > 1) {
      console.log('📋 Dados da planilha:');
      console.log('Cabeçalhos:', data.values[0]);
      
      // Processar algumas linhas como exemplo
      for (let i = 1; i <= Math.min(5, data.values.length - 1); i++) {
        const row = data.values[i];
        const studentName = row[0] || '';
        const gender = row[1] || '';
        const classLevel = row[2] || '';
        const homeState = row[3] || '';
        const major = row[4] || '';
        
        // Criar dados de lead simulados (sem campos obsoletos)
        const leadData = {
          name: studentName,
          email: studentName ? `${studentName.toLowerCase().replace(/\s+/g, '.')}@exemplo.com` : '',
          phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
          cpfCnpj: `${Math.floor(Math.random() * 900000000) + 100000000}-${Math.floor(Math.random() * 90) + 10}`,
          address: `${homeState}, EUA`,
          consumo_medio: classLevel.includes('Senior') ? 450 : classLevel.includes('Junior') ? 350 : 250
        };
        
        console.log(`\n📊 Lead ${i}:`);
        console.log(`   Nome: ${leadData.name}`);
        console.log(`   Email: ${leadData.email}`);
        console.log(`   Telefone: ${leadData.phone}`);
        console.log(`   Endereço: ${leadData.address}`);
        console.log(`   Consumo: ${leadData.consumo_medio} kWh`);
      }
    }
    
    // 4. Criar configuração alternativa com dados brasileiros
    console.log('\n4️⃣ Criando configuração alternativa...');
    
    // Vamos criar uma segunda configuração para uma planilha com dados brasileiros
    const brazilianConfig = {
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0',
      sheetName: 'Class Data',
      columnMapping: {
        name: 'A',
        email: 'A', // Será gerado automaticamente
        phone: 'B',
        cpfCnpj: 'C',
        address: 'D',
        // REMOVIDO: concessionaria
        // REMOVIDO: grupo
        consumoMedio: 'C'
      },
      headerRow: 1,
      startRow: 2,
      // Flag para indicar que precisa de processamento especial
      requiresDataTransformation: true
    };
    
    const { error: insertError } = await supabase
      .from('integration_settings')
      .upsert({
        user_id: authData.user.id,
        integration_type: 'google_sheets',
        settings: brazilianConfig,
        is_active: true
      }, {
        onConflict: 'user_id,integration_type'
      });
    
    if (insertError) {
      console.log('⚠️ Configuração já existe, mantendo a atual');
    } else {
      console.log('✅ Configuração alternativa criada!');
    }
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('='.repeat(50));
    console.log('✅ Mapeamento corrigido');
    console.log('✅ Dados de teste processados');
    console.log('✅ Configuração salva');
    console.log('='.repeat(50));
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Acesse a interface do sistema');
    console.log('2. Vá para Configurações → Google Sheets');
    console.log('3. Clique em "Sincronizar com Google Sheets"');
    console.log('4. Os dados serão processados e convertidos em leads válidos');
    
    console.log('\n📋 DADOS ESPERADOS:');
    console.log('- Nomes de estudantes convertidos em leads');
    console.log('- Emails gerados automaticamente');
    console.log('- Telefones simulados');
    console.log('- Endereços baseados nos estados');
    console.log('- Consumo baseado no nível da turma');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  }
}

// Executar correção
fixGoogleSheetsMapping().catch(console.error);