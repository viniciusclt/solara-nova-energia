/**
 * Script de diagnóstico para importação do Google Sheets
 * Identifica problemas específicos na importação de leads
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const googleApiKey = process.env.VITE_GOOGLE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  process.exit(1);
}

if (!googleApiKey) {
  console.error('❌ Google API Key não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGoogleSheetsImport() {
  console.log('🔍 Iniciando diagnóstico da importação do Google Sheets...');
  
  try {
    // 1. Verificar configurações salvas
    console.log('\n1️⃣ Verificando configurações salvas...');
    const { data: settings, error: settingsError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'google_sheets')
      .single();
    
    if (settingsError) {
      console.error('❌ Erro ao buscar configurações:', settingsError.message);
      return;
    }
    
    if (!settings) {
      console.error('❌ Nenhuma configuração do Google Sheets encontrada');
      return;
    }
    
    console.log('✅ Configurações encontradas:', {
      url: settings.settings.spreadsheetUrl,
      sheetName: settings.settings.sheetName,
      columnMapping: Object.keys(settings.settings.columnMapping).length + ' colunas mapeadas'
    });
    
    // 2. Extrair ID da planilha
    console.log('\n2️⃣ Extraindo ID da planilha...');
    const spreadsheetId = extractSpreadsheetId(settings.settings.spreadsheetUrl);
    if (!spreadsheetId) {
      console.error('❌ URL da planilha inválida:', settings.settings.spreadsheetUrl);
      return;
    }
    console.log('✅ ID da planilha extraído:', spreadsheetId);
    
    // 3. Testar acesso à API do Google Sheets
    console.log('\n3️⃣ Testando acesso à API do Google Sheets...');
    const sheetName = settings.settings.sheetName || 'Sheet1';
    const range = `${sheetName}!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${googleApiKey}`;
    
    console.log('📡 Fazendo requisição para:', url.replace(googleApiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    console.log('📡 Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API do Google:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos:', {
      hasValues: !!data.values,
      rowCount: data.values?.length || 0,
      firstRow: data.values?.[0] || null
    });
    
    if (!data.values || data.values.length === 0) {
      console.error('❌ Planilha vazia ou sem dados');
      return;
    }
    
    // 4. Analisar estrutura dos dados
    console.log('\n4️⃣ Analisando estrutura dos dados...');
    const headers = data.values[0];
    const dataRows = data.values.slice(1);
    
    console.log('📋 Cabeçalhos encontrados:', headers);
    console.log('📊 Total de linhas de dados:', dataRows.length);
    
    // Filtrar linhas vazias
    const validRows = dataRows.filter(row => {
      return row && Array.isArray(row) && row.some(cell => 
        cell !== null && cell !== undefined && cell.toString().trim() !== ''
      );
    });
    
    console.log('📊 Linhas válidas (não vazias):', validRows.length);
    
    if (validRows.length === 0) {
      console.error('❌ Nenhuma linha válida encontrada na planilha');
      return;
    }
    
    // 5. Testar processamento de uma linha
    console.log('\n5️⃣ Testando processamento de linha...');
    const testRow = validRows[0];
    console.log('📝 Linha de teste:', testRow);
    
    const columnMapping = settings.settings.columnMapping;
    console.log('🗺️ Mapeamento de colunas:', columnMapping);
    
    // Simular processamento
    const getValue = (column) => {
      if (!column || column === 'none') return '';
      const index = columnToIndex(column);
      if (index < 0 || index >= testRow.length) return '';
      const value = testRow[index];
      return value ? String(value).trim() : '';
    };
    
    const processedData = {
      name: getValue(columnMapping.name),
      email: getValue(columnMapping.email),
      phone: getValue(columnMapping.phone),
      cpfCnpj: getValue(columnMapping.cpfCnpj),
      address: getValue(columnMapping.address),
      consumoMedio: getValue(columnMapping.consumoMedio)
    };
    
    console.log('✅ Dados processados:', processedData);
    
    // 6. Verificar validação
    console.log('\n6️⃣ Verificando validação...');
    const validationErrors = [];
    
    if (!processedData.name || processedData.name.length < 2) {
      validationErrors.push('Nome inválido ou muito curto');
    }
    
    if (!processedData.email || processedData.email.length < 5) {
      validationErrors.push('Email inválido ou muito curto');
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (processedData.email && !emailRegex.test(processedData.email)) {
      validationErrors.push('Formato de email inválido');
    }
    
    if (validationErrors.length > 0) {
      console.error('❌ Erros de validação:', validationErrors);
    } else {
      console.log('✅ Validação passou');
    }
    
    // 7. Verificar estrutura da tabela leads
    console.log('\n7️⃣ Verificando estrutura da tabela leads...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela leads:', tableError.message);
      return;
    }
    
    console.log('✅ Tabela leads acessível');
    
    // 8. Resumo do diagnóstico
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
    console.log('✅ Configurações: OK');
    console.log('✅ API Google Sheets: OK');
    console.log('✅ Dados da planilha: OK');
    console.log(`✅ Linhas válidas: ${validRows.length}`);
    console.log('✅ Tabela leads: OK');
    
    if (validationErrors.length > 0) {
      console.log('❌ Problemas encontrados:');
      validationErrors.forEach(error => console.log(`   - ${error}`));
      console.log('\n💡 SOLUÇÃO: Verifique os dados na planilha e o mapeamento de colunas');
    } else {
      console.log('\n🎉 Tudo parece estar funcionando corretamente!');
      console.log('💡 Se ainda assim não está importando, verifique:');
      console.log('   - Se todas as linhas têm nome e email válidos');
      console.log('   - Se o mapeamento de colunas está correto');
      console.log('   - Se não há caracteres especiais nos dados');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
  }
}

function extractSpreadsheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function columnToIndex(column) {
  if (!column || column === 'none') return -1;
  
  const normalizedColumn = column.trim().toUpperCase();
  
  if (!/^[A-Z]+$/.test(normalizedColumn)) {
    return -1;
  }
  
  let result = 0;
  for (let i = 0; i < normalizedColumn.length; i++) {
    result = result * 26 + (normalizedColumn.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
}

// Executar diagnóstico
testGoogleSheetsImport().catch(console.error);