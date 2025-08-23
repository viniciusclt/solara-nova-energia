#!/usr/bin/env tsx

/**
 * Script para inicializar o banco de dados local SQLite
 * 
 * Este script:
 * 1. Executa as migrações do banco
 * 2. Insere dados de exemplo (seed)
 * 3. Verifica a saúde do banco
 * 
 * Uso: npm run init-db
 */

import { runMigrations, seedDatabase, checkDatabaseHealth } from '../src/db/index';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function initializeDatabase() {
  console.log('🚀 Inicializando banco de dados local SQLite...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Executar migrações
    console.log('\n📋 Passo 1: Executando migrações...');
    await runMigrations();
    
    // 2. Inserir dados de exemplo
    console.log('\n🌱 Passo 2: Inserindo dados de exemplo...');
    await seedDatabase();
    
    // 3. Verificar saúde do banco
    console.log('\n🏥 Passo 3: Verificando saúde do banco...');
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      console.log('\n✅ Banco de dados local inicializado com sucesso!');
      console.log('=' .repeat(50));
      console.log('📊 Resumo:');
      console.log(`  • Empresas: ${health.companies}`);
      console.log(`  • Perfis: ${health.profiles}`);
      console.log(`  • Templates: ${health.templates}`);
      console.log('\n🎯 Próximos passos:');
      console.log('  1. Execute: npm run dev');
      console.log('  2. Acesse: http://localhost:8080');
      console.log('  3. Login: admin@solara.com.br');
      console.log('\n💡 O banco local está em: ./local-database.db');
    } else {
      throw new Error('Banco não está saudável após inicialização');
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao inicializar banco de dados:');
    console.error(error);
    process.exit(1);
  }
}

// Verificar se o script está sendo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };