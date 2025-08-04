import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('🔄 Testando login do usuário...');
    
    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'vinicius@energiacactos.com.br',
      password: 'MinhaSenh@123'
    });

    if (error) {
      console.log('❌ Login falhou:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n📋 O usuário não existe ou as credenciais estão incorretas.');
        console.log('\n🔧 Soluções possíveis:');
        console.log('1. Criar o usuário manualmente no Supabase Dashboard');
        console.log('2. Verificar se as credenciais estão corretas');
        console.log('3. Verificar se o email foi confirmado');
        
        console.log('\n📖 Siga o guia: CRIAR-USUARIO-MANUAL.md');
      } else {
        console.log('\n🔍 Erro específico:', error.message);
      }
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 UUID:', data.user.id);
    
    // Verificar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.log('⚠️ Usuário existe mas perfil não foi encontrado:', profileError.message);
      console.log('\n🔧 Execute o script SQL para criar o perfil:');
      console.log('- Abra o Supabase Dashboard');
      console.log('- Vá para SQL Editor');
      console.log('- Execute o script insert-empresa-cactos.sql');
    } else {
      console.log('✅ Perfil encontrado!');
      console.log('👤 Nome:', profile.full_name);
      console.log('🔑 Tipo de acesso:', profile.access_type);
      console.log('🏢 Company ID:', profile.company_id);
      
      console.log('\n🎉 Sistema configurado corretamente!');
      console.log('\n📋 Credenciais de acesso:');
      console.log('📧 Email: vinicius@energiacactos.com.br');
      console.log('🔒 Senha: MinhaSenh@123');
      console.log('\n✅ Você pode fazer login no sistema!');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o teste
testLogin();