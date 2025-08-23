const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProposalTables() {
  console.log('🔧 Criando tabelas de propostas...');
  
  try {
    // Primeiro, vamos verificar se a tabela companies existe
    console.log('🔍 Verificando tabela companies...');
    const { data: companies, error: companiesCheckError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (companiesCheckError) {
      console.log('⚠️ Tabela companies não encontrada:', companiesCheckError.message);
      console.log('📋 Criando tabela companies primeiro...');
      
      // Criar tabela companies se não existir
      const { error: companiesError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (companiesError) {
        console.log('⚠️ Aviso companies:', companiesError.message);
      } else {
        console.log('✅ Tabela companies criada');
      }
    } else {
      console.log('✅ Tabela companies já existe');
    }
    
    // Criar proposal_templates
    console.log('📋 Criando tabela proposal_templates...');
    const { error: templatesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.proposal_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          template_data JSONB DEFAULT '{}',
          company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
          created_by UUID,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (templatesError) {
      console.log('⚠️ Aviso proposal_templates:', templatesError.message);
    } else {
      console.log('✅ Tabela proposal_templates criada');
    }

    // Criar proposal_elements
    console.log('📋 Criando tabela proposal_elements...');
    const { error: elementsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.proposal_elements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id UUID REFERENCES public.proposal_templates(id) ON DELETE CASCADE,
          element_type VARCHAR(50) NOT NULL,
          element_data JSONB DEFAULT '{}',
          position_x FLOAT DEFAULT 0,
          position_y FLOAT DEFAULT 0,
          width FLOAT DEFAULT 100,
          height FLOAT DEFAULT 50,
          z_index INTEGER DEFAULT 0,
          is_locked BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (elementsError) {
      console.log('⚠️ Aviso proposal_elements:', elementsError.message);
    } else {
      console.log('✅ Tabela proposal_elements criada');
    }

    console.log('\n🔍 Verificando tabelas criadas...');
    
    // Verificar proposal_templates
    const { data: templates, error: templatesCheckError } = await supabase
      .from('proposal_templates')
      .select('id')
      .limit(1);
    
    if (templatesCheckError) {
      console.log('❌ proposal_templates ainda não existe:', templatesCheckError.message);
    } else {
      console.log('✅ Tabela proposal_templates: OK');
    }
    
    // Verificar proposal_elements
    const { data: elements, error: elementsCheckError } = await supabase
      .from('proposal_elements')
      .select('id')
      .limit(1);
    
    if (elementsCheckError) {
      console.log('❌ proposal_elements ainda não existe:', elementsCheckError.message);
    } else {
      console.log('✅ Tabela proposal_elements: OK');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createProposalTables();