import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Buckets necessários para o módulo de treinamentos
const TRAINING_BUCKETS = [
  {
    name: 'training-videos',
    public: false,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
    description: 'Vídeos dos módulos de treinamento'
  },
  {
    name: 'training-documents',
    public: false,
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    description: 'Documentos e materiais de apoio dos treinamentos'
  },
  {
    name: 'training-certificates',
    public: false,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    description: 'Certificados de conclusão dos treinamentos'
  }
];

async function createStorageBucket(bucketConfig) {
  try {
    console.log(`\n🔄 Criando bucket: ${bucketConfig.name}`);
    
    // Verificar se o bucket já existe
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Erro ao listar buckets: ${listError.message}`);
      return false;
    }
    
    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketConfig.name);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketConfig.name}' já existe`);
      return true;
    }
    
    // Criar o bucket
    const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
      public: bucketConfig.public,
      allowedMimeTypes: bucketConfig.allowedMimeTypes,
      fileSizeLimit: bucketConfig.fileSizeLimit
    });
    
    if (error) {
      console.error(`❌ Erro ao criar bucket '${bucketConfig.name}': ${error.message}`);
      return false;
    }
    
    console.log(`✅ Bucket '${bucketConfig.name}' criado com sucesso`);
    console.log(`   📝 Descrição: ${bucketConfig.description}`);
    console.log(`   🔒 Público: ${bucketConfig.public ? 'Sim' : 'Não'}`);
    console.log(`   📏 Limite de tamanho: ${(bucketConfig.fileSizeLimit / 1024 / 1024).toFixed(0)}MB`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro inesperado ao criar bucket '${bucketConfig.name}': ${error.message}`);
    return false;
  }
}

async function setupStoragePolicies() {
  console.log('\n🔐 Configurando políticas de acesso aos buckets...');
  
  // Políticas RLS para storage (executar no SQL Editor do Supabase)
  const storagePolicies = `
-- Políticas para o bucket training-videos
CREATE POLICY "Usuários autenticados podem visualizar vídeos de treinamento"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Administradores podem fazer upload de vídeos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-videos' AND auth.jwt() ->> 'role' = 'admin');

-- Políticas para o bucket training-documents
CREATE POLICY "Usuários autenticados podem visualizar documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Administradores podem fazer upload de documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-documents' AND auth.jwt() ->> 'role' = 'admin');

-- Políticas para o bucket training-certificates
CREATE POLICY "Usuários podem visualizar seus próprios certificados"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sistema pode gerar certificados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-certificates' AND auth.role() = 'service_role');
  `;
  
  console.log('📋 Execute o seguinte SQL no Supabase Dashboard para configurar as políticas:');
  console.log('\n' + '='.repeat(80));
  console.log(storagePolicies);
  console.log('='.repeat(80));
}

async function verifyStorageSetup() {
  console.log('\n🔍 Verificando configuração dos buckets...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error(`❌ Erro ao verificar buckets: ${error.message}`);
      return false;
    }
    
    const trainingBuckets = buckets.filter(bucket => 
      bucket.name.startsWith('training-')
    );
    
    console.log(`\n📊 Buckets de treinamento encontrados: ${trainingBuckets.length}/3`);
    
    trainingBuckets.forEach(bucket => {
      console.log(`   ✅ ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    
    if (trainingBuckets.length === 3) {
      console.log('\n🎉 Todos os buckets de storage foram configurados com sucesso!');
      return true;
    } else {
      console.log('\n⚠️  Alguns buckets ainda precisam ser criados.');
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Erro ao verificar buckets: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando configuração dos buckets de storage para o módulo de treinamentos...');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}`);
  
  let successCount = 0;
  
  // Criar todos os buckets
  for (const bucketConfig of TRAINING_BUCKETS) {
    const success = await createStorageBucket(bucketConfig);
    if (success) successCount++;
  }
  
  console.log(`\n📈 Resultado: ${successCount}/${TRAINING_BUCKETS.length} buckets configurados`);
  
  // Verificar configuração final
  await verifyStorageSetup();
  
  // Mostrar políticas de segurança
  await setupStoragePolicies();
  
  console.log('\n✨ Configuração de storage concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Execute as políticas SQL mostradas acima no Supabase Dashboard');
  console.log('   2. Teste o upload de arquivos nos buckets criados');
  console.log('   3. Verifique as permissões de acesso');
}

// Executar o script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  createStorageBucket,
  verifyStorageSetup,
  TRAINING_BUCKETS
};