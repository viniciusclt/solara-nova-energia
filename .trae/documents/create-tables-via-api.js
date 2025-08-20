// =====================================================================================
// SCRIPT PARA CRIAR TABELAS VIA API REST - SUPABASE SELF-HOSTED
// =====================================================================================
// Este script tenta criar as tabelas do módulo de treinamentos usando a API REST
// do Supabase self-hosted com as credenciais do arquivo .env
// =====================================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// =====================================================================================
// CONFIGURAÇÕES
// =====================================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no .env');
    process.exit(1);
}

console.log('🔧 Configurações carregadas:');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log('');

// =====================================================================================
// FUNÇÕES AUXILIARES
// =====================================================================================

/**
 * Executa uma query SQL via API REST do Supabase
 */
async function executeSQL(sql, description = '') {
    try {
        console.log(`🔄 Executando: ${description}`);
        
        // Tenta diferentes endpoints da API REST
        const endpoints = [
            '/rest/v1/rpc/exec_sql',
            '/rest/v1/rpc/execute_sql',
            '/database/sql',
            '/sql',
            '/rest/v1/sql'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        sql: sql,
                        query: sql
                    })
                });
                
                console.log(`   📡 Tentativa endpoint: ${endpoint}`);
                console.log(`   📊 Status: ${response.status}`);
                
                if (response.ok) {
                    const result = await response.text();
                    console.log(`   ✅ Sucesso: ${description}`);
                    return { success: true, data: result };
                } else {
                    const error = await response.text();
                    console.log(`   ❌ Erro ${response.status}: ${error}`);
                }
            } catch (err) {
                console.log(`   ❌ Erro na requisição: ${err.message}`);
            }
        }
        
        return { success: false, error: 'Nenhum endpoint funcionou' };
        
    } catch (error) {
        console.error(`❌ Erro ao executar SQL: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Verifica se uma tabela existe
 */
async function checkTableExists(tableName) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            }
        });
        
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

/**
 * Testa conectividade básica com o Supabase
 */
async function testConnection() {
    try {
        console.log('🔍 Testando conectividade com Supabase...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            }
        });
        
        console.log(`📊 Status da conexão: ${response.status}`);
        
        if (response.ok) {
            console.log('✅ Conexão com Supabase estabelecida!');
            return true;
        } else {
            console.log('❌ Falha na conexão com Supabase');
            return false;
        }
    } catch (error) {
        console.error(`❌ Erro de conectividade: ${error.message}`);
        return false;
    }
}

// =====================================================================================
// FUNÇÃO PRINCIPAL
// =====================================================================================

async function createTrainingTables() {
    console.log('🚀 Iniciando criação das tabelas do módulo de treinamentos...');
    console.log('');
    
    // 1. Testa conectividade
    const connected = await testConnection();
    if (!connected) {
        console.log('❌ Não foi possível conectar ao Supabase. Verifique as credenciais.');
        return;
    }
    
    console.log('');
    
    // 2. Verifica se as tabelas já existem
    console.log('🔍 Verificando tabelas existentes...');
    const tables = ['training_modules', 'training_content', 'user_training_progress', 'training_assessments', 'assessment_results'];
    
    for (const table of tables) {
        const exists = await checkTableExists(table);
        console.log(`   📋 ${table}: ${exists ? '✅ Existe' : '❌ Não existe'}`);
    }
    
    console.log('');
    
    // 3. Lê o arquivo SQL
    const sqlFilePath = path.join(__dirname, '..', '..', 'training-module-setup.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
        console.error(`❌ Arquivo SQL não encontrado: ${sqlFilePath}`);
        return;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`📄 Arquivo SQL carregado: ${sqlContent.length} caracteres`);
    
    // 4. Divide o SQL em comandos individuais
    const sqlCommands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📝 Total de comandos SQL: ${sqlCommands.length}`);
    console.log('');
    
    // 5. Tenta executar via API REST
    console.log('🔄 Tentando executar SQL via API REST...');
    
    // Tenta executar o SQL completo primeiro
    let result = await executeSQL(sqlContent, 'SQL completo');
    
    if (!result.success) {
        console.log('⚠️  Execução do SQL completo falhou. Tentando comandos individuais...');
        
        // Tenta executar comandos individuais
        for (let i = 0; i < Math.min(sqlCommands.length, 10); i++) {
            const command = sqlCommands[i];
            if (command.length > 10) {
                await executeSQL(command, `Comando ${i + 1}`);
            }
        }
    }
    
    console.log('');
    
    // 6. Verifica novamente se as tabelas foram criadas
    console.log('🔍 Verificação final das tabelas...');
    let tablesCreated = 0;
    
    for (const table of tables) {
        const exists = await checkTableExists(table);
        console.log(`   📋 ${table}: ${exists ? '✅ Criada' : '❌ Não criada'}`);
        if (exists) tablesCreated++;
    }
    
    console.log('');
    console.log('📊 RESULTADO FINAL:');
    console.log(`   📋 Tabelas criadas: ${tablesCreated}/${tables.length}`);
    
    if (tablesCreated === tables.length) {
        console.log('🎉 SUCESSO! Todas as tabelas foram criadas via API!');
    } else if (tablesCreated > 0) {
        console.log('⚠️  PARCIAL: Algumas tabelas foram criadas. Verifique manualmente.');
    } else {
        console.log('❌ FALHA: Nenhuma tabela foi criada via API.');
        console.log('');
        console.log('💡 SOLUÇÃO ALTERNATIVA:');
        console.log('   1. Acesse o Supabase Dashboard: ' + SUPABASE_URL.replace('/rest/v1', ''));
        console.log('   2. Vá para SQL Editor');
        console.log('   3. Execute o arquivo: training-module-setup.sql');
        console.log('   4. Verifique se todas as tabelas foram criadas');
    }
}

// =====================================================================================
// EXECUÇÃO
// =====================================================================================

if (require.main === module) {
    createTrainingTables().catch(console.error);
}

module.exports = { createTrainingTables, executeSQL, checkTableExists, testConnection };