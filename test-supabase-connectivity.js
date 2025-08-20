import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testando conectividade com Supabase...');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnectivity() {
  try {
    console.log('\n🧪 Teste 1: Verificar conexão básica...');
    
    // Teste básico de conectividade
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão básica:', error.message);
      return false;
    }
    
    console.log('✅ Conexão básica funcionando');
    
    console.log('\n🧪 Teste 2: Verificar estrutura da tabela profiles...');
    
    // Verificar estrutura da tabela profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erro ao acessar tabela profiles:', profilesError.message);
      return false;
    }
    
    console.log('✅ Tabela profiles acessível');
    
    console.log('\n🧪 Teste 3: Verificar tabela companies...');
    
    // Verificar tabela companies
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ Erro ao acessar tabela companies:', companiesError.message);
      return false;
    }
    
    console.log('✅ Tabela companies acessível');
    
    console.log('\n🧪 Teste 4: Verificar autenticação...');
    
    // Verificar status de autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('⚠️ Aviso na autenticação:', authError.message);
    } else {
      console.log('✅ Sistema de autenticação funcionando');
      console.log(`👤 Usuário atual: ${user ? user.email : 'Não autenticado'}`);
    }
    
    console.log('\n🎉 Todos os testes de conectividade passaram!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
    return false;
  }
}

// Executar testes
testConnectivity()
  .then(success => {
    if (success) {
      console.log('\n✅ Conectividade com Supabase está funcionando corretamente!');
      process.exit(0);
    } else {
      console.log('\n❌ Problemas de conectividade detectados!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });