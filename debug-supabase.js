import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🚀 Iniciando debug do Supabase...');
console.log('📡 URL:', process.env.SUPABASE_URL);
console.log('🔑 ANON_KEY disponível:', !!process.env.SUPABASE_ANON_KEY);
console.log('🔐 SERVICE_ROLE disponível:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('\n🔄 Testando conexão básica...');
    
    // Teste simples de conexão
    const { data, error } = await supabase
      .from('training_modules')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalhes:', error.details);
      return false;
    }
    
    console.log('✅ Conexão com Supabase funcionando!');
    console.log('📊 Dados retornados:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

async function listTables() {
  try {
    console.log('\n📋 Testando acesso às tabelas...');
    
    const tables = ['training_modules', 'training_content', 'user_training_progress'];
    
    for (const table of tables) {
      console.log(`\n🔍 Testando tabela: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error(`❌ Erro em ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: ${count || 0} registros`);
        if (data && data.length > 0) {
          console.log(`   📄 Exemplo:`, Object.keys(data[0]).join(', '));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error.message);
  }
}

async function testStorage() {
  try {
    console.log('\n💾 Testando storage...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro no storage:', error.message);
      return;
    }
    
    console.log('✅ Storage acessível!');
    console.log(`📁 Buckets encontrados: ${buckets?.length || 0}`);
    
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de storage:', error.message);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('🔧 DEBUG SUPABASE - MÓDULO DE TREINAMENTOS');
  console.log('='.repeat(50));
  
  const connected = await testConnection();
  
  if (connected) {
    await listTables();
    await testStorage();
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Debug concluído!');
  console.log('='.repeat(50));
}

main().catch(console.error);