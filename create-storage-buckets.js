import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🚀 Criando buckets de storage para o módulo de treinamentos...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const buckets = [
  {
    name: 'training-videos',
    public: false,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    fileSizeLimit: 100 * 1024 * 1024 // 100MB
  },
  {
    name: 'training-documents', 
    public: false,
    allowedMimeTypes: ['application/pdf', 'application/msword'],
    fileSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  {
    name: 'training-certificates',
    public: false,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    fileSizeLimit: 5 * 1024 * 1024 // 5MB
  }
];

async function createBuckets() {
  console.log('\n📁 Criando buckets...');
  
  for (const bucket of buckets) {
    try {
      console.log(`\n🔄 Criando bucket: ${bucket.name}`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: bucket.fileSizeLimit
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket '${bucket.name}' já existe`);
        } else {
          console.error(`❌ Erro ao criar '${bucket.name}': ${error.message}`);
        }
      } else {
        console.log(`✅ Bucket '${bucket.name}' criado com sucesso`);
      }
      
    } catch (error) {
      console.error(`❌ Erro inesperado em '${bucket.name}': ${error.message}`);
    }
  }
}

async function verifyBuckets() {
  console.log('\n🔍 Verificando buckets criados...');
  
  try {
    const { data: allBuckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro ao listar buckets:', error.message);
      return;
    }
    
    console.log(`\n📊 Total de buckets: ${allBuckets?.length || 0}`);
    
    const trainingBuckets = allBuckets?.filter(b => b.name.startsWith('training-')) || [];
    console.log(`🎯 Buckets de treinamento: ${trainingBuckets.length}/3`);
    
    trainingBuckets.forEach(bucket => {
      console.log(`   ✅ ${bucket.name}`);
    });
    
    if (trainingBuckets.length === 3) {
      console.log('\n🎉 Todos os buckets de storage foram configurados!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar buckets:', error.message);
  }
}

async function main() {
  await createBuckets();
  await verifyBuckets();
  
  console.log('\n✨ Configuração de storage concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Configurar políticas RLS para os buckets');
  console.log('   2. Testar upload de arquivos');
  console.log('   3. Integrar com componentes React');
}

main().catch(console.error);