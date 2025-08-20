require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no arquivo .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista das tabelas que devem existir
const expectedTables = [
    'training_modules',
    'training_content', 
    'user_training_progress',
    'training_assessments',
    'assessment_results'
];

async function verifyTrainingTables() {
    console.log('🔍 Verificando tabelas do módulo de treinamentos...');
    console.log('=' .repeat(60));
    
    const results = {
        tablesFound: [],
        tablesNotFound: [],
        dataExists: {},
        errors: []
    };
    
    try {
        // Verifica cada tabela
        for (const tableName of expectedTables) {
            console.log(`\n📋 Verificando tabela: ${tableName}`);
            
            try {
                // Tenta fazer uma consulta simples para verificar se a tabela existe
                const { data, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`   ❌ Erro: ${error.message}`);
                    results.tablesNotFound.push(tableName);
                    results.errors.push(`${tableName}: ${error.message}`);
                } else {
                    console.log(`   ✅ Tabela encontrada`);
                    console.log(`   📊 Registros: ${count || 0}`);
                    results.tablesFound.push(tableName);
                    results.dataExists[tableName] = count || 0;
                    
                    // Se há dados, mostra uma amostra
                    if (count > 0) {
                        const { data: sampleData } = await supabase
                            .from(tableName)
                            .select('*')
                            .limit(1);
                        
                        if (sampleData && sampleData.length > 0) {
                            console.log(`   📝 Exemplo de dados:`, Object.keys(sampleData[0]).join(', '));
                        }
                    }
                }
            } catch (err) {
                console.log(`   ❌ Erro inesperado: ${err.message}`);
                results.tablesNotFound.push(tableName);
                results.errors.push(`${tableName}: ${err.message}`);
            }
        }
        
        // Verifica políticas RLS
        console.log('\n🔒 Verificando políticas RLS...');
        try {
            const { data: policies, error: policiesError } = await supabase
                .rpc('get_policies_info');
            
            if (policiesError) {
                console.log('   ⚠️  Não foi possível verificar políticas RLS automaticamente');
                console.log('   💡 Verifique manualmente no Supabase Dashboard > Authentication > Policies');
            } else {
                console.log('   ✅ Políticas RLS verificadas');
            }
        } catch (err) {
            console.log('   ⚠️  Verificação de políticas RLS não disponível via API');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        results.errors.push(`Erro geral: ${error.message}`);
    }
    
    // Relatório final
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RELATÓRIO FINAL');
    console.log('=' .repeat(60));
    
    console.log(`\n✅ Tabelas encontradas (${results.tablesFound.length}/${expectedTables.length}):`);
    results.tablesFound.forEach(table => {
        const count = results.dataExists[table];
        console.log(`   • ${table} (${count} registros)`);
    });
    
    if (results.tablesNotFound.length > 0) {
        console.log(`\n❌ Tabelas não encontradas (${results.tablesNotFound.length}):`);
        results.tablesNotFound.forEach(table => {
            console.log(`   • ${table}`);
        });
    }
    
    if (results.errors.length > 0) {
        console.log('\n⚠️  Erros encontrados:');
        results.errors.forEach(error => {
            console.log(`   • ${error}`);
        });
    }
    
    // Status geral
    const successRate = (results.tablesFound.length / expectedTables.length) * 100;
    console.log(`\n🎯 Taxa de sucesso: ${successRate.toFixed(1)}%`);
    
    if (successRate === 100) {
        console.log('\n🎉 SUCESSO! Todas as tabelas do módulo de treinamentos foram criadas corretamente!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Testar a integração com o frontend');
        console.log('   2. Adicionar mais conteúdo de treinamento');
        console.log('   3. Configurar buckets de storage se necessário');
        console.log('   4. Realizar testes funcionais completos');
    } else if (successRate >= 80) {
        console.log('\n⚠️  PARCIALMENTE CONCLUÍDO - Algumas tabelas podem estar faltando');
        console.log('\n💡 Recomendação: Execute novamente o arquivo training-module-setup.sql');
    } else {
        console.log('\n❌ FALHA - A maioria das tabelas não foi criada');
        console.log('\n💡 Recomendação: Verifique a conexão e execute o arquivo training-module-setup.sql');
    }
    
    return results;
}

// Executa a verificação
if (require.main === module) {
    verifyTrainingTables()
        .then(results => {
            const successRate = (results.tablesFound.length / expectedTables.length) * 100;
            process.exit(successRate === 100 ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { verifyTrainingTables };