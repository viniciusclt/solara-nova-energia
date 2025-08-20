import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carrega as variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase:', SUPABASE_URL);

// Cria o cliente Supabase com a service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL para criar as tabelas do módulo de treinamentos
const createTablesSQL = `
-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de módulos de treinamento
CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(50) DEFAULT 'beginner',
    estimated_duration INTEGER, -- em minutos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela de conteúdo dos treinamentos
CREATE TABLE IF NOT EXISTS training_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'video', 'text', 'quiz', 'interactive'
    content_data JSONB, -- dados específicos do tipo de conteúdo
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS user_training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    progress_percentage INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- em segundos
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS training_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- array de questões
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    time_limit INTEGER, -- em minutos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de resultados das avaliações
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    answers JSONB NOT NULL, -- respostas do usuário
    passed BOOLEAN NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    time_taken INTEGER, -- em segundos
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita Row Level Security (RLS)
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem visualizar módulos ativos" ON training_modules;
DROP POLICY IF EXISTS "Admins podem gerenciar módulos" ON training_modules;
DROP POLICY IF EXISTS "Usuários podem visualizar conteúdo de módulos ativos" ON training_content;
DROP POLICY IF EXISTS "Admins podem gerenciar conteúdo" ON training_content;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Usuários podem modificar seu próprio progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Admins podem ver todo progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Usuários podem visualizar avaliações ativas" ON training_assessments;
DROP POLICY IF EXISTS "Admins podem gerenciar avaliações" ON training_assessments;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios resultados" ON assessment_results;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios resultados" ON assessment_results;
DROP POLICY IF EXISTS "Admins podem ver todos os resultados" ON assessment_results;

-- Políticas RLS básicas

-- Políticas para training_modules
CREATE POLICY "Usuários podem visualizar módulos ativos" ON training_modules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins podem gerenciar módulos" ON training_modules
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para training_content
CREATE POLICY "Usuários podem visualizar conteúdo de módulos ativos" ON training_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_modules tm 
            WHERE tm.id = training_content.module_id AND tm.is_active = true
        )
    );

CREATE POLICY "Admins podem gerenciar conteúdo" ON training_content
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para user_training_progress
CREATE POLICY "Usuários podem ver seu próprio progresso" ON user_training_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso" ON user_training_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem modificar seu próprio progresso" ON user_training_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todo progresso" ON user_training_progress
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para training_assessments
CREATE POLICY "Usuários podem visualizar avaliações ativas" ON training_assessments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins podem gerenciar avaliações" ON training_assessments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para assessment_results
CREATE POLICY "Usuários podem ver seus próprios resultados" ON assessment_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios resultados" ON assessment_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os resultados" ON assessment_results
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_training_content_module_id ON training_content(module_id);
CREATE INDEX IF NOT EXISTS idx_training_content_order ON training_content(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);

-- Concede permissões básicas
GRANT SELECT ON training_modules TO anon, authenticated;
GRANT SELECT ON training_content TO anon, authenticated;
GRANT ALL ON user_training_progress TO authenticated;
GRANT SELECT ON training_assessments TO anon, authenticated;
GRANT ALL ON assessment_results TO authenticated;
`;

// Dados de exemplo
const insertSampleData = async () => {
  try {
    // Insere módulos de exemplo
    const { data: modules, error: moduleError } = await supabase
      .from('training_modules')
      .upsert([
        {
          title: 'Introdução ao Sistema Solar',
          description: 'Conceitos básicos sobre energia solar fotovoltaica',
          category: 'Fundamentos',
          difficulty_level: 'beginner',
          estimated_duration: 60
        },
        {
          title: 'Dimensionamento de Sistemas',
          description: 'Como calcular e dimensionar sistemas fotovoltaicos',
          category: 'Técnico',
          difficulty_level: 'intermediate',
          estimated_duration: 120
        },
        {
          title: 'Vendas e Atendimento',
          description: 'Técnicas de vendas para energia solar',
          category: 'Comercial',
          difficulty_level: 'beginner',
          estimated_duration: 90
        }
      ], { onConflict: 'title' })
      .select();

    if (moduleError) {
      console.log('⚠️  Erro ao inserir módulos de exemplo:', moduleError.message);
    } else {
      console.log('✅ Módulos de exemplo inseridos:', modules?.length || 0);
    }

    // Se temos módulos, insere conteúdo de exemplo
    if (modules && modules.length > 0) {
      const introModule = modules.find(m => m.title === 'Introdução ao Sistema Solar');
      if (introModule) {
        const { error: contentError } = await supabase
          .from('training_content')
          .upsert([
            {
              module_id: introModule.id,
              title: 'Vídeo Introdutório',
              content_type: 'video',
              content_data: {
                video_url: 'https://example.com/video1.mp4',
                duration: 900
              },
              order_index: 1
            }
          ], { onConflict: 'module_id,title' });

        if (contentError) {
          console.log('⚠️  Erro ao inserir conteúdo de exemplo:', contentError.message);
        } else {
          console.log('✅ Conteúdo de exemplo inserido');
        }

        // Insere avaliação de exemplo
        const { error: assessmentError } = await supabase
          .from('training_assessments')
          .upsert([
            {
              module_id: introModule.id,
              title: 'Avaliação - Introdução ao Sistema Solar',
              description: 'Teste seus conhecimentos sobre os conceitos básicos',
              questions: [
                {
                  question: 'O que é energia solar fotovoltaica?',
                  type: 'multiple_choice',
                  options: ['Conversão de luz em eletricidade', 'Aquecimento de água', 'Energia eólica'],
                  correct: 0
                }
              ],
              passing_score: 70
            }
          ], { onConflict: 'module_id,title' });

        if (assessmentError) {
          console.log('⚠️  Erro ao inserir avaliação de exemplo:', assessmentError.message);
        } else {
          console.log('✅ Avaliação de exemplo inserida');
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Erro ao inserir dados de exemplo:', error.message);
  }
};

async function executeSQL() {
  try {
    console.log('📝 Executando SQL para criar tabelas do módulo de treinamentos...');
    
    // Divide o SQL em comandos individuais
    const commands = createTablesSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📊 Total de comandos SQL: ${commands.length}`);

    // Testa a conexão primeiro
    console.log('🔍 Testando conexão com o Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('⚠️  Aviso na conexão:', testError.message);
    } else {
      console.log('✅ Conexão com Supabase estabelecida');
    }

    // Como não podemos executar SQL diretamente via Supabase JS,
    // vamos tentar criar as tabelas usando as operações disponíveis
    console.log('\n📋 SQL completo para executar manualmente:');
    console.log('=' .repeat(80));
    console.log(createTablesSQL);
    console.log('=' .repeat(80));
    
    console.log('\n⚠️  Para executar este SQL:');
    console.log('1. Acesse a interface web do seu Supabase self-hosted');
    console.log('2. Vá para a seção "SQL Editor" ou "Database"');
    console.log('3. Cole e execute o SQL acima');
    console.log('4. Verifique se todas as tabelas foram criadas');

    // Verifica se as tabelas já existem
    console.log('\n🔍 Verificando se as tabelas já existem...');
    const tables = ['training_modules', 'training_content', 'user_training_progress', 'training_assessments', 'assessment_results'];
    
    let existingTables = 0;
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.log(`❌ Tabela ${table}: ${tableError.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
          existingTables++;
        }
      } catch (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      }
    }

    if (existingTables === tables.length) {
      console.log('\n🎉 Todas as tabelas já existem! Inserindo dados de exemplo...');
      await insertSampleData();
    } else {
      console.log(`\n📊 Status: ${existingTables}/${tables.length} tabelas encontradas`);
      console.log('💡 Execute o SQL acima para criar as tabelas restantes');
    }

  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
    console.log('\n📋 SQL para executar manualmente:');
    console.log('=' .repeat(80));
    console.log(createTablesSQL);
    console.log('=' .repeat(80));
  }
}

// Executa o script
executeSQL().then(() => {
  console.log('\n🏁 Script finalizado');
}).catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});