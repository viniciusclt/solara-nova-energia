import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Obter UUID do usuário dos argumentos
const userUuid = process.argv[2];

if (!userUuid) {
  console.error('❌ Erro: UUID do usuário é obrigatório');
  console.log('💡 Uso: node update-super-admin.js [UUID_DO_USUARIO]');
  console.log('💡 Exemplo: node update-super-admin.js 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

// Validar formato UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userUuid)) {
  console.error('❌ Erro: UUID inválido');
  console.log('💡 O UUID deve ter o formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
  process.exit(1);
}

console.log('🔧 Atualizando perfil do usuário para Super Admin...');
console.log(`👤 UUID: ${userUuid}`);

async function updateUserToSuperAdmin() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Cliente Supabase inicializado');
    
    // Primeiro, verificar se o usuário existe
    console.log('\n1️⃣ Verificando se o usuário existe...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userUuid)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário:', checkError.message);
      return false;
    }
    
    if (!existingProfile) {
      console.log('⚠️  Perfil não encontrado. Criando perfil...');
      
      // Buscar dados do usuário na tabela auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userUuid);
      
      if (authError) {
        console.error('❌ Usuário não encontrado na autenticação:', authError.message);
        return false;
      }
      
      console.log('✅ Usuário encontrado na autenticação:', authUser.user.email);
      
      // Criar perfil
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userUuid,
          email: authUser.user.email,
          name: authUser.user.user_metadata?.name || 'Vinícius',
          access_type: 'vendedor'
        });
      
      if (createError) {
        console.error('❌ Erro ao criar perfil:', createError.message);
        return false;
      }
      
      console.log('✅ Perfil criado com sucesso');
    } else {
      console.log('✅ Perfil encontrado:', existingProfile.email);
    }
    
    // Buscar ID da empresa Cactos
    console.log('\n2️⃣ Buscando empresa Cactos...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('cnpj', '00.000.000/0001-00')
      .single();
    
    if (companyError) {
      console.error('❌ Empresa Cactos não encontrada:', companyError.message);
      console.log('💡 Execute primeiro: node automated-database-setup.js');
      return false;
    }
    
    console.log('✅ Empresa encontrada:', company.name);
    console.log('🏢 Company ID:', company.id);
    
    // Atualizar perfil para super_admin
    console.log('\n3️⃣ Atualizando perfil para Super Admin...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        name: 'Vinícius',
        access_type: 'super_admin',
        company_id: company.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userUuid)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError.message);
      return false;
    }
    
    console.log('✅ Perfil atualizado com sucesso!');
    
    // Verificação final
    console.log('\n4️⃣ Verificação final...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        access_type,
        companies!inner(name, cnpj)
      `)
      .eq('id', userUuid)
      .single();
    
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError.message);
      return false;
    }
    
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=' .repeat(50));
    console.log('👤 Nome:', finalProfile.name);
    console.log('📧 Email:', finalProfile.email);
    console.log('🔑 Tipo de Acesso:', finalProfile.access_type);
    console.log('🏢 Empresa:', finalProfile.companies.name);
    console.log('📋 CNPJ:', finalProfile.companies.cnpj);
    console.log('=' .repeat(50));
    
    console.log('\n✅ O usuário Vinícius agora é Super Admin da empresa Cactos!');
    console.log('🚀 Pode fazer login na aplicação com as credenciais criadas.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante atualização:', error.message);
    return false;
  }
}

// Executar atualização
updateUserToSuperAdmin()
  .then((success) => {
    if (success) {
      console.log('\n🎯 PRÓXIMOS PASSOS:');
      console.log('1. Teste o login na aplicação');
      console.log('2. Verifique as permissões de super admin');
      console.log('3. Configure dados adicionais conforme necessário');
    } else {
      console.log('\n⚠️  Atualização falhou. Verifique os logs acima.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });