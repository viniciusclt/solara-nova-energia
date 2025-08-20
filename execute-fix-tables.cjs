require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.log('KEY:', supabaseKey ? 'OK' : 'MISSING');
  process.exit(1);
}

console.log('🔧 Conectando ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLStatements() {
  try {
    console.log('📝 Executando comandos SQL individuais...');
    
    // Criar tabela user_settings
    console.log('1. Criando tabela user_settings...');
    const { error: error1 } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          google_api_key TEXT,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    });
    
    if (error1) {
      console.log('⚠️ user_settings:', error1.message);
    } else {
      console.log('✅ user_settings criada');
    }
    
    // Habilitar RLS para user_settings
    console.log('2. Habilitando RLS para user_settings...');
    await supabase.rpc('exec', {
      sql: 'ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;'
    });
    
    // Criar política para user_settings
    console.log('3. Criando política para user_settings...');
    await supabase.rpc('exec', {
      sql: `
        CREATE POLICY "Users can manage their own settings" ON public.user_settings
        FOR ALL USING (auth.uid() = user_id);
      `
    });
    
    // Verificar se integration_settings existe
    console.log('4. Verificando integration_settings...');
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'integration_settings');
    
    if (!tables || tables.length === 0) {
      console.log('5. Criando tabela integration_settings...');
      await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.integration_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            integration_type TEXT NOT NULL,
            settings JSONB NOT NULL DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, integration_type)
          );
        `
      });
      console.log('✅ integration_settings criada');
    } else {
      console.log('✅ integration_settings já existe');
    }
    
    console.log('\n🎉 Processo concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verifique se os erros no navegador foram resolvidos');
    console.log('2. Teste as funcionalidades de configurações');
    console.log('3. Se ainda houver erros, execute o arquivo fix-missing-tables.sql manualmente no Supabase Dashboard');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('1. Abra o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o arquivo: fix-missing-tables.sql');
    console.log('4. Teste novamente');
  }
}

executeSQLStatements();