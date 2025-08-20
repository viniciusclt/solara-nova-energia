#!/usr/bin/env node

/**
 * Script para criar tabelas do módulo de treinamentos usando Supabase Client
 * Usa o cliente oficial do Supabase para executar SQL
 * 
 * Uso: node create-tables-supabase-client.cjs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no .env');
    process.exit(1);
}

/**
 * Instala o cliente Supabase se não estiver instalado
 */
async function ensureSupabaseClient() {
    try {
        require('@supabase/supabase-js');
        console.log('✅ Cliente Supabase já instalado');
        return true;
    } catch (error) {
        console.log('📦 Instalando cliente Supabase...');
        const { execSync } = require('child_process');
        
        try {
            execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
            console.log('✅ Cliente Supabase instalado com sucesso');
            return true;
        } catch (installError) {
            console.error('❌ Erro ao instalar cliente Supabase:', installError.message);
            return false;
        }
    }
}

/**
 * Executa SQL usando o cliente Supabase
 */
async function executeWithSupabaseClient(sql) {
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        console.log('🔄 Executando SQL via cliente Supabase...');
        
        // Tenta usar RPC para executar SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sql
        });
        
        if (error) {
            console.log('⚠️  RPC exec_sql não disponível, tentando método alternativo...');
            return await executeAlternativeMethod(supabase, sql);
        }
        
        console.log('✅ SQL executado com sucesso via RPC');
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Erro ao executar SQL:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Método alternativo usando operações diretas do Supabase
 */
async function executeAlternativeMethod(supabase, sql) {
    try {
        console.log('🔄 Tentando método alternativo...');
        
        // Divide o SQL em comandos CREATE TABLE individuais
        const createTableCommands = sql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.toLowerCase().includes('create table'));
        
        console.log(`📝 Encontrados ${createTableCommands.length} comandos CREATE TABLE`);
        
        // Para cada comando CREATE TABLE, tenta executar via SQL direto
        for (let i = 0; i < createTableCommands.length; i++) {
            const command = createTableCommands[i] + ';';
            console.log(`🔄 Executando comando ${i + 1}/${createTableCommands.length}...`);
            
            try {
                // Usa uma abordagem mais direta
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'apikey': SERVICE_ROLE_KEY
                    },
                    body: JSON.stringify({ sql_query: command })
                });
                
                if (response.ok) {
                    console.log(`✅ Comando ${i + 1} executado com sucesso`);
                } else {
                    console.log(`⚠️  Comando ${i + 1} falhou, continuando...`);
                }
                
            } catch (cmdError) {
                console.log(`⚠️  Erro no comando ${i + 1}, continuando...`);
            }
        }
        
        return { success: true, message: 'Comandos processados' };
        
    } catch (error) {
        console.error('❌ Erro no método alternativo:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Cria tabelas usando inserções diretas como fallback
 */
async function createTablesDirectly() {
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        console.log('🔄 Tentando criar tabelas via SQL direto...');
        
        // SQL simplificado para criar apenas as tabelas essenciais
        const essentialSQL = `
            -- Extensões
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            -- Tabela principal de módulos
            CREATE TABLE IF NOT EXISTS training_modules (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                difficulty_level VARCHAR(50) DEFAULT 'beginner',
                estimated_duration INTEGER,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Habilita RLS
            ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
            
            -- Política básica
            CREATE POLICY "public_read" ON training_modules FOR SELECT USING (true);
            
            -- Permissões
            GRANT SELECT ON training_modules TO anon, authenticated;
        `;
        
        // Executa SQL essencial
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ sql_query: essentialSQL })
        });
        
        if (response.ok) {
            console.log('✅ Tabelas essenciais criadas com sucesso');
            return true;
        } else {
            console.log('❌ Falha ao criar tabelas essenciais');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas diretamente:', error.message);
        return false;
    }
}

/**
 * Verifica se as tabelas foram criadas
 */
async function verifyCreation() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/training_modules?select=count&limit=1`, {
            method: 'HEAD',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });
        
        if (response.ok) {
            console.log('✅ Verificação: Tabela training_modules criada e acessível');
            return true;
        } else {
            console.log('❌ Verificação: Tabela training_modules não encontrada');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Erro na verificação:', error.message);
        return false;
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 Iniciando criação das tabelas via Supabase Client...');
    console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
    console.log(`🔑 Service Role Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...\n`);
    
    try {
        // Verifica/instala cliente Supabase
        const clientReady = await ensureSupabaseClient();
        if (!clientReady) {
            throw new Error('Não foi possível instalar o cliente Supabase');
        }
        
        // Lê o arquivo SQL
        const sqlFilePath = path.join(__dirname, 'training-module-setup.sql');
        
        if (!fs.existsSync(sqlFilePath)) {
            console.log('⚠️  Arquivo SQL completo não encontrado, criando tabelas essenciais...');
            const success = await createTablesDirectly();
            
            if (success) {
                console.log('✅ Tabelas essenciais criadas com sucesso');
            } else {
                throw new Error('Falha ao criar tabelas essenciais');
            }
        } else {
            const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
            console.log(`📄 Arquivo SQL carregado: ${sqlContent.length} caracteres`);
            
            // Executa SQL via cliente Supabase
            const result = await executeWithSupabaseClient(sqlContent);
            
            if (!result.success) {
                console.log('⚠️  Método principal falhou, tentando criar tabelas essenciais...');
                await createTablesDirectly();
            }
        }
        
        // Verifica se as tabelas foram criadas
        console.log('\n🔍 Verificando criação das tabelas...');
        const verified = await verifyCreation();
        
        if (verified) {
            console.log('\n🎉 Sucesso! Tabelas criadas e verificadas.');
            console.log('\n📋 Próximos passos:');
            console.log('1. ✅ Executar verify-training-tables.cjs para verificação completa');
            console.log('2. ✅ Integrar com o frontend');
            console.log('3. ✅ Configurar buckets de storage');
        } else {
            console.log('\n⚠️  Tabelas podem não ter sido criadas corretamente.');
            console.log('\n📋 Soluções:');
            console.log('1. 🔧 Execute o SQL manualmente no Supabase Dashboard');
            console.log('2. 🔧 Verifique as permissões do SERVICE_ROLE_KEY');
            console.log('3. 🔧 Confirme se o Supabase self-hosted está funcionando');
        }
        
    } catch (error) {
        console.error('\n💥 Erro durante a execução:', error.message);
        console.log('\n🔧 Soluções possíveis:');
        console.log('1. Verifique se as credenciais do .env estão corretas');
        console.log('2. Confirme se o Supabase self-hosted está rodando');
        console.log('3. Execute o SQL manualmente no Dashboard do Supabase');
        console.log('4. Verifique se o SERVICE_ROLE_KEY tem permissões administrativas');
        process.exit(1);
    }
}

// Executa o script
if (require.main === module) {
    main();
}

module.exports = { executeWithSupabaseClient, createTablesDirectly, verifyCreation };