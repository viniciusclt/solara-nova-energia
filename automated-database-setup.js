import { createClient } from '@supabase/supabase-js';
import process from 'process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis do arquivo .env
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de serviço (não anônima)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  console.log('💡 A chave de serviço pode ser encontrada em: Settings > API > service_role');
  process.exit(1);
}

console.log('🚀 Iniciando configuração automatizada do banco de dados...');

async function setupDatabase() {
  try {
    // Usar chave de serviço para ter permissões administrativas
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Cliente Supabase inicializado com chave de serviço');
    
    // Ler o arquivo SQL completo
    const sqlFilePath = path.join(process.cwd(), 'complete-database-setup.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Arquivo complete-database-setup.sql não encontrado');
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 Arquivo SQL carregado com sucesso');
    
    // Dividir o SQL em blocos menores para execução
    const sqlBlocks = sqlContent
      .split('-- ========================================')
      .filter(block => block.trim().length > 0);
    
    console.log(`📦 Executando ${sqlBlocks.length} blocos de SQL...`);
    
    for (let i = 0; i < sqlBlocks.length; i++) {
      const block = sqlBlocks[i].trim();
      if (!block) continue;
      
      console.log(`\n🔄 Executando bloco ${i + 1}/${sqlBlocks.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: block
        });
        
        if (error) {
          console.log(`⚠️  Aviso no bloco ${i + 1}:`, error.message);
          // Continuar mesmo com avisos (algumas operações podem já existir)
        } else {
          console.log(`✅ Bloco ${i + 1} executado com sucesso`);
        }
      } catch (e) {
        console.log(`⚠️  Erro no bloco ${i + 1}:`, e.message);
        // Continuar com próximo bloco
      }
    }
    
    console.log('\n🎯 Verificando tabelas criadas...');
    
    // Verificar tabelas criadas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'companies', 'profiles', 'subscriptions', 'audit_logs',
        'notifications', 'instituicoes_financeiras', 'financial_kits',
        'shared_proposals', 'solar_modules', 'inverters'
      ]);
    
    if (tablesError) {
      console.log('⚠️  Não foi possível verificar tabelas:', tablesError.message);
    } else {
      console.log('✅ Tabelas encontradas:', tables?.map(t => t.table_name).join(', '));
    }
    
    // Verificar empresa Cactos
    console.log('\n🏢 Verificando empresa Cactos...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('cnpj', '00.000.000/0001-00');
    
    if (companiesError) {
      console.log('⚠️  Erro ao verificar empresa:', companiesError.message);
    } else if (companies && companies.length > 0) {
      console.log('✅ Empresa Cactos encontrada:', companies[0].name);
    } else {
      console.log('⚠️  Empresa Cactos não encontrada');
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS MANUAIS:');
    console.log('1. Vá para o Supabase Dashboard > Authentication > Users');
    console.log('2. Clique em "Add user"');
    console.log('3. Email: vinicius@energiacactos.com.br');
    console.log('4. Password: [escolha uma senha segura]');
    console.log('5. Email Confirm: true');
    console.log('6. Copie o UUID do usuário criado');
    console.log('7. Execute: node update-super-admin.js [UUID_DO_USUARIO]');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante configuração:', error.message);
    return false;
  }
}

// Função para criar usuário via API (requer chave de serviço)
async function createUserViaAPI(email, password) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log(`🔐 Tentando criar usuário: ${email}`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: 'Vinícius'
      }
    });
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return null;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📋 UUID do usuário:', data.user.id);
    
    return data.user.id;
    
  } catch (error) {
    console.error('❌ Erro na criação do usuário:', error.message);
    return null;
  }
}

// Executar configuração
if (process.argv.includes('--create-user')) {
  const email = 'vinicius@energiacactos.com.br';
  const password = process.argv[process.argv.indexOf('--create-user') + 1] || 'SenhaSegura123!';
  
  createUserViaAPI(email, password)
    .then((userId) => {
      if (userId) {
        console.log('\n🎯 Execute agora:');
        console.log(`node update-super-admin.js ${userId}`);
      }
    });
} else {
  setupDatabase()
    .then((success) => {
      if (success) {
        console.log('\n✅ Configuração do banco concluída!');
        console.log('\n💡 Para criar o usuário automaticamente, execute:');
        console.log('node automated-database-setup.js --create-user [SENHA_OPCIONAL]');
      } else {
        console.log('\n⚠️  Configuração concluída com problemas');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}