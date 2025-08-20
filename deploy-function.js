#!/usr/bin/env node

/**
 * Script para fazer deploy da função sync-google-sheets via API REST
 * Usado quando o CLI do Supabase não funciona ou o projeto está inativo
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

async function deployFunction() {
  try {
    console.log('🚀 Iniciando deploy da função sync-google-sheets...');
    
    // Ler o arquivo da função
    const functionPath = path.join(process.cwd(), 'supabase', 'functions', 'sync-google-sheets', 'index.ts');
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    
    console.log('📁 Arquivo da função carregado:', functionPath);
    
    // Fazer upload via API REST
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/deploy_function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        function_name: 'sync-google-sheets',
        function_code: functionCode,
        verify_jwt: true
      })
    });
    
    if (response.ok) {
      console.log('✅ Função deployada com sucesso!');
      console.log('🔗 URL da função:', `${SUPABASE_URL}/functions/v1/sync-google-sheets`);
    } else {
      const error = await response.text();
      console.error('❌ Erro no deploy:', error);
      
      // Tentar método alternativo - salvar no banco
      console.log('🔄 Tentando método alternativo...');
      await saveToDatabase(functionCode);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o deploy:', error.message);
    
    // Método de fallback - salvar no banco
    console.log('🔄 Usando método de fallback...');
    const functionPath = path.join(process.cwd(), 'supabase', 'functions', 'sync-google-sheets', 'index.ts');
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    await saveToDatabase(functionCode);
  }
}

async function saveToDatabase(functionCode) {
  try {
    console.log('💾 Salvando função no banco de dados...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/edge_functions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        name: 'sync-google-sheets',
        source_code: functionCode,
        verify_jwt: true,
        status: 'active'
      })
    });
    
    if (response.ok) {
      console.log('✅ Função salva no banco com sucesso!');
    } else {
      const error = await response.text();
      console.error('❌ Erro ao salvar no banco:', error);
      
      // Último recurso - criar manualmente
      console.log('📝 Instruções para deploy manual:');
      console.log('1. Acesse o dashboard do Supabase');
      console.log('2. Vá para Edge Functions');
      console.log('3. Crie uma nova função chamada "sync-google-sheets"');
      console.log('4. Cole o código do arquivo:', path.join(process.cwd(), 'supabase', 'functions', 'sync-google-sheets', 'index.ts'));
    }
    
  } catch (error) {
    console.error('❌ Erro no método de fallback:', error.message);
    console.log('📝 Deploy manual necessário via dashboard do Supabase');
  }
}

// Executar o deploy
deployFunction();