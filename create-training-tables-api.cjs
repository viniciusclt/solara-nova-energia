#!/usr/bin/env node

/**
 * Script para criar tabelas do módulo de treinamentos no Supabase self-hosted
 * Usa a API REST do Supabase para executar SQL diretamente
 * 
 * Uso: node create-training-tables-api.js
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
 * Executa SQL via API REST do Supabase
 */
async function executeSQL(sql, description = 'SQL') {
    try {
        console.log(`🔄 Executando: ${description}...`);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ sql_query: sql })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ ${description} executado com sucesso`);
        return result;
        
    } catch (error) {
        console.error(`❌ Erro ao executar ${description}:`, error.message);
        throw error;
    }
}

/**
 * Executa SQL diretamente via PostgREST
 */
async function executeDirectSQL(sql, description = 'SQL') {
    try {
        console.log(`🔄 Executando via PostgREST: ${description}...`);
        
        // Tenta diferentes endpoints do PostgREST
        const endpoints = [
            `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
            `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
            `${SUPABASE_URL}/rest/v1/rpc/run_sql`
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'apikey': SERVICE_ROLE_KEY,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ 
                        sql_query: sql,
                        query: sql,
                        sql: sql 
                    })
                });

                if (response.ok) {
                    console.log(`✅ ${description} executado com sucesso via ${endpoint}`);
                    return await response.json();
                }
                
            } catch (err) {
                console.log(`⚠️  Endpoint ${endpoint} não funcionou, tentando próximo...`);
            }
        }
        
        throw new Error('Nenhum endpoint de execução SQL funcionou');
        
    } catch (error) {
        console.error(`❌ Erro ao executar ${description}:`, error.message);
        throw error;
    }
}

/**
 * Cria uma função SQL personalizada para execução
 */
async function createSQLExecutorFunction() {
    const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            result json;
        BEGIN
            EXECUTE sql_query;
            result := json_build_object('status', 'success', 'message', 'SQL executed successfully');
            RETURN result;
        EXCEPTION
            WHEN OTHERS THEN
                result := json_build_object('status', 'error', 'message', SQLERRM);
                RETURN result;
        END;
        $$;
    `;
    
    try {
        await executeDirectSQL(createFunctionSQL, 'Criação da função exec_sql');
        return true;
    } catch (error) {
        console.log('⚠️  Não foi possível criar função personalizada, tentando métodos alternativos...');
        return false;
    }
}

/**
 * Executa SQL dividido em blocos menores
 */
async function executeSQLInChunks(sql) {
    // Divide o SQL em comandos individuais
    const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (command.length > 10) { // Ignora comandos muito pequenos
            try {
                console.log(`🔄 Comando ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
                await executeDirectSQL(command + ';', `Comando ${i + 1}`);
                
                // Pequena pausa entre comandos
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Erro no comando ${i + 1}:`, error.message);
                // Continua com os próximos comandos mesmo se um falhar
            }
        }
    }
}

/**
 * Verifica se as tabelas foram criadas
 */
async function verifyTables() {
    const checkTablesSQL = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'training_modules',
            'training_content', 
            'user_training_progress',
            'training_assessments',
            'assessment_results'
        )
        ORDER BY table_name;
    `;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ sql_query: checkTablesSQL })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Verificação de tabelas concluída:', result);
            return result;
        } else {
            console.log('⚠️  Verificação via API não funcionou, tentando método alternativo...');
            return await checkTablesAlternative();
        }
        
    } catch (error) {
        console.log('⚠️  Erro na verificação, tentando método alternativo...');
        return await checkTablesAlternative();
    }
}

/**
 * Método alternativo para verificar tabelas
 */
async function checkTablesAlternative() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/training_modules?select=count`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY,
                'Prefer': 'count=exact'
            }
        });

        if (response.ok) {
            console.log('✅ Tabela training_modules existe e está acessível');
            return { status: 'success', message: 'Tabelas verificadas via REST API' };
        } else {
            console.log('❌ Tabela training_modules não encontrada ou inacessível');
            return { status: 'error', message: 'Tabelas não encontradas' };
        }
        
    } catch (error) {
        console.log('❌ Erro na verificação alternativa:', error.message);
        return { status: 'error', message: error.message };
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 Iniciando criação das tabelas do módulo de treinamentos...');
    console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
    console.log(`🔑 Service Role Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...`);
    
    try {
        // Lê o arquivo SQL
        const sqlFilePath = path.join(__dirname, 'training-module-setup.sql');
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
        }
        
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log(`📄 Arquivo SQL carregado: ${sqlContent.length} caracteres`);
        
        // Tenta criar função personalizada primeiro
        console.log('\n🔧 Tentando criar função de execução SQL...');
        await createSQLExecutorFunction();
        
        // Executa o SQL em blocos
        console.log('\n📝 Executando SQL do módulo de treinamentos...');
        await executeSQLInChunks(sqlContent);
        
        // Verifica se as tabelas foram criadas
        console.log('\n🔍 Verificando se as tabelas foram criadas...');
        const verification = await verifyTables();
        
        console.log('\n🎉 Processo concluído!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Verifique as tabelas no Supabase Dashboard');
        console.log('2. Teste a integração com o frontend');
        console.log('3. Configure os buckets de storage se necessário');
        
    } catch (error) {
        console.error('\n💥 Erro durante a execução:', error.message);
        console.log('\n🔧 Soluções possíveis:');
        console.log('1. Verifique se as credenciais do .env estão corretas');
        console.log('2. Confirme se o Supabase self-hosted está rodando');
        console.log('3. Execute o SQL manualmente no Dashboard do Supabase');
        process.exit(1);
    }
}

// Executa o script
if (require.main === module) {
    main();
}

module.exports = { executeSQL, executeDirectSQL, verifyTables };