#!/usr/bin/env node

/**
 * Script para verificar se as tabelas do módulo de treinamentos foram criadas
 * no Supabase self-hosted
 * 
 * Uso: node verify-training-tables.js
 */

require('dotenv').config();

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
    console.error('❌ Erro: SUPABASE_URL é obrigatória no .env');
    process.exit(1);
}

if (!SERVICE_ROLE_KEY && !ANON_KEY) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY é obrigatória no .env');
    process.exit(1);
}

const API_KEY = SERVICE_ROLE_KEY || ANON_KEY;

/**
 * Verifica se uma tabela existe e está acessível
 */
async function checkTable(tableName) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=count&limit=1`, {
            method: 'HEAD',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'apikey': API_KEY,
                'Prefer': 'count=exact'
            }
        });

        if (response.ok) {
            console.log(`✅ ${tableName}: Existe e está acessível`);
            return true;
        } else {
            console.log(`❌ ${tableName}: Não encontrada ou inacessível (${response.status})`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ${tableName}: Erro na verificação - ${error.message}`);
        return false;
    }
}

/**
 * Verifica permissões RLS
 */
async function checkRLSPermissions(tableName) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ANON_KEY || API_KEY}`,
                'apikey': ANON_KEY || API_KEY
            }
        });

        if (response.ok) {
            console.log(`✅ ${tableName}: Permissões RLS configuradas corretamente`);
            return true;
        } else if (response.status === 401 || response.status === 403) {
            console.log(`⚠️  ${tableName}: RLS ativo (esperado para usuários não autenticados)`);
            return true;
        } else {
            console.log(`❌ ${tableName}: Problema nas permissões RLS (${response.status})`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ${tableName}: Erro na verificação RLS - ${error.message}`);
        return false;
    }
}

/**
 * Testa inserção de dados de exemplo
 */
async function testDataInsertion() {
    try {
        // Tenta inserir um módulo de teste
        const testModule = {
            title: 'Módulo de Teste - API',
            description: 'Teste de inserção via API REST',
            category: 'Teste',
            difficulty_level: 'beginner',
            estimated_duration: 30
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/training_modules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'apikey': API_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testModule)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Inserção de dados: Funcionando corretamente');
            
            // Remove o dado de teste
            if (result && result[0] && result[0].id) {
                await fetch(`${SUPABASE_URL}/rest/v1/training_modules?id=eq.${result[0].id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'apikey': API_KEY
                    }
                });
                console.log('🧹 Dados de teste removidos');
            }
            
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ Inserção de dados: Falhou (${response.status}) - ${errorText}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Inserção de dados: Erro - ${error.message}`);
        return false;
    }
}

/**
 * Verifica a estrutura das tabelas
 */
async function checkTableStructure() {
    try {
        // Usa uma query simples para verificar se as colunas existem
        const response = await fetch(`${SUPABASE_URL}/rest/v1/training_modules?select=id,title,description,category&limit=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'apikey': API_KEY
            }
        });

        if (response.ok) {
            console.log('✅ Estrutura das tabelas: Colunas principais verificadas');
            return true;
        } else {
            console.log(`❌ Estrutura das tabelas: Problema na verificação (${response.status})`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Estrutura das tabelas: Erro - ${error.message}`);
        return false;
    }
}

/**
 * Função principal de verificação
 */
async function main() {
    console.log('🔍 Verificando tabelas do módulo de treinamentos...');
    console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
    console.log(`🔑 Usando chave: ${API_KEY.substring(0, 20)}...\n`);
    
    const tables = [
        'training_modules',
        'training_content',
        'user_training_progress',
        'training_assessments',
        'assessment_results'
    ];
    
    let allTablesOk = true;
    
    // Verifica existência das tabelas
    console.log('📋 Verificando existência das tabelas:');
    for (const table of tables) {
        const exists = await checkTable(table);
        if (!exists) allTablesOk = false;
    }
    
    console.log('\n🔒 Verificando permissões RLS:');
    for (const table of tables) {
        await checkRLSPermissions(table);
    }
    
    console.log('\n🏗️  Verificando estrutura das tabelas:');
    await checkTableStructure();
    
    console.log('\n💾 Testando inserção de dados:');
    const insertionWorks = await testDataInsertion();
    
    // Resumo final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(50));
    
    if (allTablesOk) {
        console.log('✅ Todas as tabelas foram criadas com sucesso');
    } else {
        console.log('❌ Algumas tabelas não foram encontradas');
    }
    
    if (insertionWorks) {
        console.log('✅ Sistema pronto para uso');
    } else {
        console.log('⚠️  Sistema criado mas pode ter problemas de permissão');
    }
    
    console.log('\n📋 Próximos passos:');
    if (allTablesOk && insertionWorks) {
        console.log('1. ✅ Integrar com o frontend');
        console.log('2. ✅ Configurar buckets de storage');
        console.log('3. ✅ Realizar testes funcionais');
    } else {
        console.log('1. 🔧 Executar o script create-training-tables-api.js');
        console.log('2. 🔧 Verificar permissões no Supabase Dashboard');
        console.log('3. 🔧 Executar SQL manualmente se necessário');
    }
    
    console.log('\n🎯 Status: ' + (allTablesOk && insertionWorks ? 'PRONTO' : 'REQUER AÇÃO'));
}

// Executa o script
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Erro durante a verificação:', error.message);
        process.exit(1);
    });
}

module.exports = { checkTable, checkRLSPermissions, testDataInsertion };