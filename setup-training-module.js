const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTrainingModule() {
  console.log('🚀 Iniciando setup do módulo de treinamentos...');
  
  try {
    // 1. Executar schema do banco de dados
    console.log('📊 Executando schema do banco de dados...');
    const schemaPath = path.join(__dirname, 'database', 'training_module_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Arquivo de schema não encontrado:', schemaPath);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o schema em comandos individuais
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️ Aviso ao executar comando:', error.message);
        }
      }
    }
    
    console.log('✅ Schema do banco de dados executado com sucesso!');
    
    // 2. Configurar bucket de storage
    console.log('📁 Configurando bucket de storage...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
    }
    
    const trainingBucketExists = buckets?.some(bucket => bucket.name === 'training-videos');
    
    if (!trainingBucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('training-videos', {
        public: false,
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'application/pdf'],
        fileSizeLimit: 524288000 // 500MB
      });
      
      if (bucketError) {
        console.error('❌ Erro ao criar bucket:', bucketError.message);
      } else {
        console.log('✅ Bucket training-videos criado com sucesso!');
      }
    } else {
      console.log('✅ Bucket training-videos já existe!');
    }
    
    // 3. Inserir dados iniciais
    console.log('📝 Inserindo dados iniciais...');
    
    // Categorias padrão
    const categories = [
      { name: 'Fundamentos', description: 'Conceitos básicos de energia solar' },
      { name: 'Técnico', description: 'Aspectos técnicos e instalação' },
      { name: 'Comercial', description: 'Vendas e relacionamento com cliente' },
      { name: 'Segurança', description: 'Normas e procedimentos de segurança' },
      { name: 'Manutenção', description: 'Manutenção e troubleshooting' }
    ];
    
    for (const category of categories) {
      const { error } = await supabase
        .from('training_categories')
        .upsert(category, { onConflict: 'name' });
      
      if (error && !error.message.includes('duplicate')) {
        console.warn('⚠️ Aviso ao inserir categoria:', error.message);
      }
    }
    
    // Badges padrão
    const badges = [
      {
        name: 'Primeiro Passo',
        description: 'Completou o primeiro módulo de treinamento',
        icon: 'trophy',
        color: '#10B981',
        criteria: { modules_completed: 1 }
      },
      {
        name: 'Estudioso',
        description: 'Completou 5 módulos de treinamento',
        icon: 'book',
        color: '#3B82F6',
        criteria: { modules_completed: 5 }
      },
      {
        name: 'Expert',
        description: 'Completou 10 módulos de treinamento',
        icon: 'star',
        color: '#8B5CF6',
        criteria: { modules_completed: 10 }
      },
      {
        name: 'Perfeição',
        description: 'Obteve nota máxima em uma avaliação',
        icon: 'award',
        color: '#F59E0B',
        criteria: { perfect_score: true }
      },
      {
        name: 'Sequência',
        description: 'Estudou por 7 dias consecutivos',
        icon: 'flame',
        color: '#EF4444',
        criteria: { study_streak: 7 }
      }
    ];
    
    for (const badge of badges) {
      const { error } = await supabase
        .from('gamification_badges')
        .upsert(badge, { onConflict: 'name' });
      
      if (error && !error.message.includes('duplicate')) {
        console.warn('⚠️ Aviso ao inserir badge:', error.message);
      }
    }
    
    console.log('✅ Dados iniciais inseridos com sucesso!');
    
    // 4. Verificar configurações
    console.log('🔍 Verificando configurações...');
    
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('count')
      .limit(1);
    
    if (modulesError) {
      console.error('❌ Erro ao verificar tabela de módulos:', modulesError.message);
    } else {
      console.log('✅ Tabela de módulos acessível!');
    }
    
    console.log('\n🎉 Setup do módulo de treinamentos concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Acesse o sistema e vá para a seção "Treinamentos"');
    console.log('2. Crie seu primeiro módulo de treinamento');
    console.log('3. Faça upload de vídeos e materiais');
    console.log('4. Configure avaliações e certificados');
    console.log('\n🔗 Acesse: http://localhost:8080/training');
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
    process.exit(1);
  }
}

// Executar setup
setupTrainingModule();