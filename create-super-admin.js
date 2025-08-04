import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

// Criar cliente Supabase com service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  try {
    console.log('🔄 Criando usuário super admin...');
    
    // Criar usuário usando admin API
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'vinicius@energiacactos.com.br',
      password: 'MinhaSenh@123',
      email_confirm: true
    });

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError.message);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email:', user.user.email);
    console.log('🆔 UUID:', user.user.id);
    
    // Agora vamos executar o script SQL para configurar a empresa e perfil
    console.log('\n🔄 Configurando empresa e perfil...');
    
    // Inserir empresa Cactos
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Cactos - Soluções Energia',
        cnpj: '12.345.678/0001-90',
        email: 'contato@energiacactos.com.br',
        phone: '(11) 99999-9999',
        address: 'Rua das Energias, 123',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01234-567',
        num_employees: 50,
        subscription_type: 'premium',
        is_active: true
      })
      .select()
      .single();

    if (companyError) {
      console.error('❌ Erro ao criar empresa:', companyError.message);
      return;
    }

    console.log('✅ Empresa criada com sucesso!');
    console.log('🏢 Nome:', company.name);
    console.log('🆔 Company ID:', company.id);

    // Criar perfil do super admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        email: user.user.email,
        full_name: 'Vinícius - Super Admin',
        access_type: 'super_admin',
        company_id: company.id,
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      return;
    }

    console.log('✅ Perfil criado com sucesso!');
    console.log('👤 Nome:', profile.full_name);
    console.log('🔑 Tipo de acesso:', profile.access_type);
    
    console.log('\n🎉 Configuração completa!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('📧 Email: vinicius@energiacactos.com.br');
    console.log('🔒 Senha: MinhaSenh@123');
    console.log('\n✅ O sistema está pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar a função
createSuperAdmin();