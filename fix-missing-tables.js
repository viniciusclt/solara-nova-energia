import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Usar service role key para operações administrativas
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMissingTables() {
  try {
    console.log('🔧 Criando tabelas essenciais que estão faltando...');
    
    // 1. Criar tabela training_modules
    console.log('📝 Criando tabela training_modules...');
    const { error: error1 } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.training_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
          created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (error1) {
      console.log('⚠️ Aviso training_modules:', error1.message);
    } else {
      console.log('✅ Tabela training_modules criada');
    }
    
    // 2. Criar tabela training_content
    console.log('📝 Criando tabela training_content...');
    const { error: error2 } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.training_content (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          module_id UUID REFERENCES public.training_modules(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content_type VARCHAR(50) NOT NULL,
          content_data JSONB DEFAULT '{}',
          order_index INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (error2) {
      console.log('⚠️ Aviso training_content:', error2.message);
    } else {
      console.log('✅ Tabela training_content criada');
    }
    
    // 3. Criar tabela user_training_progress
    console.log('📝 Criando tabela user_training_progress...');
    const { error: error3 } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_training_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          content_id UUID REFERENCES public.training_content(id) ON DELETE CASCADE,
          progress_percentage INTEGER DEFAULT 0,
          completed_at TIMESTAMPTZ,
          time_spent INTEGER DEFAULT 0,
          last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, content_id)
        );
      `
    });
    
    if (error3) {
      console.log('⚠️ Aviso user_training_progress:', error3.message);
    } else {
      console.log('✅ Tabela user_training_progress criada');
    }
    
    // 4. Criar tabela training_assessments
    console.log('📝 Criando tabela training_assessments...');
    const { error: error4 } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.training_assessments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          module_id UUID REFERENCES public.training_modules(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          questions JSONB DEFAULT '[]',
          passing_score INTEGER DEFAULT 70,
          time_limit INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (error4) {
      console.log('⚠️ Aviso training_assessments:', error4.message);
    } else {
      console.log('✅ Tabela training_assessments criada');
    }
    
    // 5. Criar tabela assessment_results
    console.log('📝 Criando tabela assessment_results...');
    const { error: error5 } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.assessment_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          assessment_id UUID REFERENCES public.training_assessments(id) ON DELETE CASCADE,
          score INTEGER NOT NULL,
          passed BOOLEAN NOT NULL,
          answers JSONB DEFAULT '{}',
          time_taken INTEGER,
          completed_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (error5) {
      console.log('⚠️ Aviso assessment_results:', error5.message);
    } else {
      console.log('✅ Tabela assessment_results criada');
    }
    
    // 6. Habilitar RLS nas tabelas
    console.log('🔒 Habilitando Row Level Security...');
    const tables = [
      'training_modules',
      'training_content', 
      'user_training_progress',
      'training_assessments',
      'assessment_results'
    ];
    
    for (const table of tables) {
      const { error } = await supabase.rpc('exec', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (error) {
        console.log(`⚠️ Aviso RLS ${table}:`, error.message);
      } else {
        console.log(`🔒 RLS habilitado para ${table}`);
      }
    }
    
    console.log('\n🎉 Processo concluído!');
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createMissingTables();