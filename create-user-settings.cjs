require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

console.log('🔧 Conectando ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserSettingsTable() {
  try {
    console.log('📝 Criando tabela user_settings...');
    
    // Usar uma abordagem mais direta
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        query: `
          -- Criar tabela user_settings
          CREATE TABLE IF NOT EXISTS public.user_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            google_api_key TEXT,
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
          );
          
          -- Habilitar RLS
          ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
          
          -- Criar política
          DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
          CREATE POLICY "Users can manage their own settings" ON public.user_settings
            FOR ALL USING (auth.uid() = user_id);
          
          -- Criar índice
          CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
        `
      })
    });
    
    if (response.ok) {
      console.log('✅ Tabela user_settings criada com sucesso!');
    } else {
      const error = await response.text();
      console.log('⚠️ Resposta:', error);
    }
    
    // Tentar uma abordagem alternativa se a primeira falhar
    console.log('🔄 Tentando abordagem alternativa...');
    
    // Verificar se a tabela existe
    const { data: existingTable, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_settings');
    
    if (checkError) {
      console.log('⚠️ Erro ao verificar tabela:', checkError.message);
    } else if (existingTable && existingTable.length > 0) {
      console.log('✅ Tabela user_settings já existe!');
    } else {
      console.log('❌ Tabela user_settings não foi criada');
      console.log('\n📋 INSTRUÇÕES MANUAIS:');
      console.log('1. Abra o Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o seguinte SQL:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_api_key TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 Execute manualmente no Supabase Dashboard > SQL Editor');
  }
}

createUserSettingsTable();