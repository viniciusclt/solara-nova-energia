import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// Extrair informações de conexão da URL do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

// Extrair host e porta da URL
const url = new URL(supabaseUrl);
const host = url.hostname;
const port = url.port || 5432;

// Configuração de conexão PostgreSQL
const client = new Client({
  host: host,
  port: port,
  database: 'postgres', // banco padrão do Supabase
  user: 'postgres', // usuário padrão
  password: serviceKey, // usar service key como senha
  ssl: {
    rejectUnauthorized: false // para conexões self-hosted
  }
});

async function createTrainingTables() {
  try {
    console.log('🔧 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./supabase/migrations/create_training_tables.sql', 'utf8');
    
    console.log('📝 Executando SQL...');
    
    // Executar o SQL completo
    await client.query(sqlContent);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const tables = [
      'training_modules',
      'training_content', 
      'user_training_progress',
      'training_assessments',
      'assessment_results'
    ];
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Tabela ${table}: OK (${result.rows[0].count} registros)`);
      } catch (e) {
        console.log(`❌ Tabela ${table}: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    // Tentar abordagem alternativa com diferentes configurações
    console.log('\n🔄 Tentando configuração alternativa...');
    
    try {
      const altClient = new Client({
        connectionString: `postgresql://postgres:${serviceKey}@${host}:${port}/postgres?sslmode=require`
      });
      
      await altClient.connect();
      console.log('✅ Conectado com configuração alternativa!');
      
      const sqlContent = fs.readFileSync('./supabase/migrations/create_training_tables.sql', 'utf8');
      await altClient.query(sqlContent);
      
      console.log('✅ Tabelas criadas com sucesso!');
      await altClient.end();
      
    } catch (altError) {
      console.error('❌ Erro na configuração alternativa:', altError.message);
    }
    
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignorar erros ao fechar conexão
    }
  }
}

createTrainingTables();