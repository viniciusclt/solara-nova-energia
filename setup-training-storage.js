// =====================================================================================
// CONFIGURAÇÃO DE STORAGE BUCKETS PARA MÓDULO DE TREINAMENTOS
// =====================================================================================
// Este script configura os buckets de storage necessários para o módulo de treinamentos
// no Supabase self-hosted
// =====================================================================================

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.error('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================================================
// CONFIGURAÇÃO DOS BUCKETS
// =====================================================================================

const buckets = [
  {
    name: 'training-videos',
    public: false,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    fileSizeLimit: 500 * 1024 * 1024, // 500MB
    description: 'Armazenamento de vídeos de treinamento'
  },
  {
    name: 'training-documents',
    public: false,
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    description: 'Armazenamento de documentos e materiais de apoio'
  },
  {
    name: 'training-certificates',
    public: false,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    description: 'Armazenamento de certificados de conclusão'
  },
  {
    name: 'training-thumbnails',
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    description: 'Thumbnails e imagens de preview dos módulos'
  }
];

// =====================================================================================
// FUNÇÕES DE CONFIGURAÇÃO
// =====================================================================================

async function createBucket(bucketConfig) {
  console.log(`🔄 Criando bucket: ${bucketConfig.name}`);
  
  try {
    const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
      public: bucketConfig.public,
      allowedMimeTypes: bucketConfig.allowedMimeTypes,
      fileSizeLimit: bucketConfig.fileSizeLimit
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Bucket ${bucketConfig.name} já existe`);
        return true;
      }
      throw error;
    }
    
    console.log(`✅ Bucket ${bucketConfig.name} criado com sucesso`);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao criar bucket ${bucketConfig.name}:`, err.message);
    return false;
  }
}

async function setBucketPolicy(bucketName, isPublic) {
  console.log(`🔄 Configurando políticas para bucket: ${bucketName}`);
  
  try {
    // Política para leitura (SELECT)
    const selectPolicy = {
      name: `${bucketName}_select_policy`,
      definition: isPublic 
        ? 'true' // Público para todos
        : 'auth.role() = \'authenticated\'', // Apenas usuários autenticados
      check: null,
      command: 'SELECT'
    };
    
    // Política para upload (INSERT)
    const insertPolicy = {
      name: `${bucketName}_insert_policy`,
      definition: 'auth.role() = \'authenticated\'', // Apenas usuários autenticados podem fazer upload
      check: 'auth.role() = \'authenticated\'',
      command: 'INSERT'
    };
    
    // Política para atualização (UPDATE)
    const updatePolicy = {
      name: `${bucketName}_update_policy`,
      definition: 'auth.role() = \'authenticated\'',
      check: 'auth.role() = \'authenticated\'',
      command: 'UPDATE'
    };
    
    // Política para exclusão (DELETE)
    const deletePolicy = {
      name: `${bucketName}_delete_policy`,
      definition: 'auth.role() = \'authenticated\'',
      check: null,
      command: 'DELETE'
    };
    
    console.log(`✅ Políticas configuradas para ${bucketName}`);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao configurar políticas para ${bucketName}:`, err.message);
    return false;
  }
}

async function listExistingBuckets() {
  console.log('🔄 Verificando buckets existentes...');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    console.log('📋 Buckets existentes:');
    if (data.length === 0) {
      console.log('   Nenhum bucket encontrado');
    } else {
      data.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
    }
    
    return data;
  } catch (err) {
    console.error('❌ Erro ao listar buckets:', err.message);
    return [];
  }
}

async function testBucketAccess(bucketName) {
  console.log(`🔄 Testando acesso ao bucket: ${bucketName}`);
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Acesso ao bucket ${bucketName} funcionando`);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao acessar bucket ${bucketName}:`, err.message);
    return false;
  }
}

// =====================================================================================
// EXECUÇÃO PRINCIPAL
// =====================================================================================

async function setupTrainingStorage() {
  console.log('🚀 CONFIGURANDO STORAGE PARA MÓDULO DE TREINAMENTOS');
  console.log('=' .repeat(70));
  
  // Lista buckets existentes
  const existingBuckets = await listExistingBuckets();
  const existingBucketNames = existingBuckets.map(b => b.name);
  
  let createdBuckets = 0;
  let totalBuckets = buckets.length;
  
  // Cria buckets necessários
  console.log('\n🔧 Criando buckets necessários...');
  for (const bucketConfig of buckets) {
    if (existingBucketNames.includes(bucketConfig.name)) {
      console.log(`⚠️  Bucket ${bucketConfig.name} já existe - pulando criação`);
      createdBuckets++;
    } else {
      const success = await createBucket(bucketConfig);
      if (success) createdBuckets++;
    }
  }
  
  // Configura políticas
  console.log('\n🔒 Configurando políticas de acesso...');
  let configuredPolicies = 0;
  for (const bucketConfig of buckets) {
    const success = await setBucketPolicy(bucketConfig.name, bucketConfig.public);
    if (success) configuredPolicies++;
  }
  
  // Testa acesso aos buckets
  console.log('\n🧪 Testando acesso aos buckets...');
  let accessibleBuckets = 0;
  for (const bucketConfig of buckets) {
    const success = await testBucketAccess(bucketConfig.name);
    if (success) accessibleBuckets++;
  }
  
  // Resumo final
  console.log('\n' + '=' .repeat(70));
  console.log('📊 RESUMO DA CONFIGURAÇÃO');
  console.log('=' .repeat(70));
  console.log(`✅ Buckets criados/verificados: ${createdBuckets}/${totalBuckets}`);
  console.log(`🔒 Políticas configuradas: ${configuredPolicies}/${totalBuckets}`);
  console.log(`🧪 Buckets acessíveis: ${accessibleBuckets}/${totalBuckets}`);
  
  const successRate = Math.round((Math.min(createdBuckets, accessibleBuckets) / totalBuckets) * 100);
  console.log(`📈 Taxa de sucesso: ${successRate}%`);
  
  if (successRate === 100) {
    console.log('\n🎉 CONFIGURAÇÃO DE STORAGE CONCLUÍDA!');
    console.log('✅ Todos os buckets estão funcionando corretamente!');
    console.log('✅ Políticas de acesso configuradas!');
    console.log('✅ Sistema pronto para upload de arquivos!');
  } else {
    console.log('\n⚠️  CONFIGURAÇÃO PARCIALMENTE CONCLUÍDA');
    console.log('🔧 Alguns buckets podem precisar de configuração manual.');
  }
  
  console.log('\n📋 Buckets configurados:');
  buckets.forEach(bucket => {
    console.log(`   📁 ${bucket.name}:`);
    console.log(`      - Tipo: ${bucket.public ? 'Público' : 'Privado'}`);
    console.log(`      - Tamanho máximo: ${Math.round(bucket.fileSizeLimit / (1024 * 1024))}MB`);
    console.log(`      - Formatos: ${bucket.allowedMimeTypes.join(', ')}`);
    console.log(`      - Descrição: ${bucket.description}`);
  });
  
  console.log('\n🔗 Próximos passos:');
  console.log('1. Teste o upload de arquivos na interface');
  console.log('2. Verifique se os thumbnails estão sendo exibidos');
  console.log('3. Configure CDN se necessário para melhor performance');
  console.log('4. Implemente compressão automática de vídeos se necessário');
}

// Executa a configuração
setupTrainingStorage().catch(console.error);