// =====================================================================================
// SCRIPT PARA CRIAR TABELAS VIA SUPABASE CLIENT SDK
// =====================================================================================
// Este script usa o Supabase Client SDK para tentar criar as tabelas
// do módulo de treinamentos no Supabase self-hosted
// =====================================================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
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

// Cria cliente Supabase com service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// =====================================================================================
// FUNÇÕES AUXILIARES
// =====================================================================================

/**
 * Verifica se uma tabela existe usando o Supabase client
 */
async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        // Se não há erro, a tabela existe
        return !error || error.code !== 'PGRST116'; // PGRST116 = relation does not exist
    } catch (error) {
        return false;
    }
}

/**
 * Testa conectividade básica com o Supabase
 */
async function testConnection() {
    try {
        console.log('🔍 Testando conectividade com Supabase Client...');
        
        // Tenta fazer uma query simples
        const { data, error } = await supabase
            .from('auth.users')
            .select('count')
            .limit(1);
        
        if (!error) {
            console.log('✅ Conexão com Supabase Client estabelecida!');
            return true;
        } else {
            console.log(`⚠️  Conexão estabelecida, mas com limitações: ${error.message}`);
            return true; // Ainda consideramos como conectado
        }
    } catch (error) {
        console.error(`❌ Erro de conectividade: ${error.message}`);
        return false;
    }
}

/**
 * Executa SQL usando RPC (Remote Procedure Call) se disponível
 */
async function executeViaRPC(sql, description = '') {
    try {
        console.log(`🔄 Tentando RPC: ${description}`);
        
        // Lista de possíveis funções RPC para executar SQL
        const rpcFunctions = [
            'exec_sql',
            'execute_sql',
            'run_sql',
            'sql_exec'
        ];
        
        for (const funcName of rpcFunctions) {
            try {
                const { data, error } = await supabase.rpc(funcName, {
                    sql: sql,
                    query: sql
                });
                
                if (!error) {
                    console.log(`   ✅ Sucesso via RPC ${funcName}: ${description}`);
                    return { success: true, data };
                } else {
                    console.log(`   ❌ RPC ${funcName} falhou: ${error.message}`);
                }
            } catch (err) {
                console.log(`   ❌ Erro RPC ${funcName}: ${err.message}`);
            }
        }
        
        return { success: false, error: 'Nenhuma função RPC funcionou' };
        
    } catch (error) {
        console.error(`❌ Erro ao executar via RPC: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Tenta criar tabelas usando comandos individuais via client
 */
async function createTablesIndividually() {
    console.log('🔄 Tentando criar tabelas individualmente...');
    
    const tableDefinitions = [
        {
            name: 'training_modules',
            sql: `
                CREATE TABLE IF NOT EXISTS training_modules (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(100),
                    difficulty_level VARCHAR(50) DEFAULT 'beginner',
                    estimated_duration INTEGER,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_by UUID REFERENCES auth.users(id)
                );
            `
        },
        {
            name: 'training_content',
            sql: `
                CREATE TABLE IF NOT EXISTS training_content (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    content_type VARCHAR(50) NOT NULL,
                    content_data JSONB,
                    order_index INTEGER NOT NULL,
                    is_required BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'user_training_progress',
            sql: `
                CREATE TABLE IF NOT EXISTS user_training_progress (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
                    content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
                    status VARCHAR(50) DEFAULT 'not_started',
                    progress_percentage INTEGER DEFAULT 0,
                    time_spent INTEGER DEFAULT 0,
                    started_at TIMESTAMP WITH TIME ZONE,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_id, content_id)
                );
            `
        },
        {
            name: 'training_assessments',
            sql: `
                CREATE TABLE IF NOT EXISTS training_assessments (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    questions JSONB NOT NULL,
                    passing_score INTEGER DEFAULT 70,
                    max_attempts INTEGER DEFAULT 3,
                    time_limit INTEGER,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'assessment_results',
            sql: `
                CREATE TABLE IF NOT EXISTS assessment_results (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                    assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
                    score INTEGER NOT NULL,
                    answers JSONB NOT NULL,
                    passed BOOLEAN NOT NULL,
                    attempt_number INTEGER DEFAULT 1,
                    time_taken INTEGER,
                    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        }
    ];
    
    let successCount = 0;
    
    for (const table of tableDefinitions) {
        console.log(`   📋 Criando tabela: ${table.name}`);
        
        const result = await executeViaRPC(table.sql, `Tabela ${table.name}`);
        
        if (result.success) {
            successCount++;
        }
    }
    
    return successCount;
}

// =====================================================================================
// FUNÇÃO PRINCIPAL
// =====================================================================================

async function createTrainingTablesViaClient() {
    console.log('🚀 Iniciando criação das tabelas via Supabase Client...');
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
    
    let existingTables = 0;
    for (const table of tables) {
        const exists = await checkTableExists(table);
        console.log(`   📋 ${table}: ${exists ? '✅ Existe' : '❌ Não existe'}`);
        if (exists) existingTables++;
    }
    
    if (existingTables === tables.length) {
        console.log('🎉 Todas as tabelas já existem! Nenhuma ação necessária.');
        return;
    }
    
    console.log('');
    
    // 3. Tenta habilitar extensões necessárias
    console.log('🔧 Tentando habilitar extensões...');
    await executeViaRPC('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', 'Extensão uuid-ossp');
    await executeViaRPC('CREATE EXTENSION IF NOT EXISTS "pg_trgm";', 'Extensão pg_trgm');
    
    console.log('');
    
    // 4. Lê e tenta executar o arquivo SQL completo
    const sqlFilePath = path.join(__dirname, '..', '..', 'training-module-setup.sql');
    
    if (fs.existsSync(sqlFilePath)) {
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log(`📄 Arquivo SQL carregado: ${sqlContent.length} caracteres`);
        
        console.log('🔄 Tentando executar SQL completo via RPC...');
        const result = await executeViaRPC(sqlContent, 'SQL completo');
        
        if (!result.success) {
            console.log('⚠️  Execução do SQL completo falhou. Tentando abordagem individual...');
            await createTablesIndividually();
        }
    } else {
        console.log('⚠️  Arquivo SQL não encontrado. Tentando criar tabelas individualmente...');
        await createTablesIndividually();
    }
    
    console.log('');
    
    // 5. Verifica novamente se as tabelas foram criadas
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
        console.log('🎉 SUCESSO! Todas as tabelas foram criadas via Supabase Client!');
        console.log('');
        console.log('🔄 Próximos passos:');
        console.log('   1. Configurar políticas RLS (se necessário)');
        console.log('   2. Testar integração com o frontend');
        console.log('   3. Adicionar dados de exemplo');
    } else if (tablesCreated > 0) {
        console.log('⚠️  PARCIAL: Algumas tabelas foram criadas. Verifique manualmente.');
    } else {
        console.log('❌ FALHA: Nenhuma tabela foi criada via Supabase Client.');
        console.log('');
        console.log('💡 SOLUÇÃO MANUAL RECOMENDADA:');
        console.log('   1. Acesse o Supabase Dashboard: ' + SUPABASE_URL.replace('/rest/v1', ''));
        console.log('   2. Vá para SQL Editor');
        console.log('   3. Execute o arquivo: training-module-setup.sql');
        console.log('   4. Verifique se todas as tabelas foram criadas');
        console.log('');
        console.log('📋 LIMITAÇÃO IDENTIFICADA:');
        console.log('   O Supabase self-hosted pode não permitir execução de SQL via API/Client');
        console.log('   Esta é uma limitação de segurança comum em instalações self-hosted');
    }
}

// =====================================================================================
// EXECUÇÃO
// =====================================================================================

if (require.main === module) {
    createTrainingTablesViaClient().catch(console.error);
}

module.exports = { createTrainingTablesViaClient, executeViaRPC, checkTableExists, testConnection };