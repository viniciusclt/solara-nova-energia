import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTrainingTables() {
  try {
    console.log('🔧 Criando tabelas do módulo de treinamento...');
    
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./database/training_module_schema.sql', 'utf8');
    
    console.log('📝 Executando SQL via API REST...');
    
    // Usar API REST direta do Supabase para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        query: sqlContent 
      })
    });
    
    if (!response.ok) {
      // Tentar abordagem alternativa - executar via psql se disponível
      console.log('⚠️ API REST falhou, tentando abordagem alternativa...');
      
      // Dividir em comandos menores
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      console.log(`📝 Executando ${commands.length} comandos individuais...`);
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (command.trim()) {
          try {
            console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
            
            // Tentar diferentes endpoints
            const endpoints = [
              '/rest/v1/rpc/exec',
              '/sql',
              '/database/sql'
            ];
            
            let success = false;
            for (const endpoint of endpoints) {
              try {
                const resp = await fetch(`${supabaseUrl}${endpoint}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey
                  },
                  body: JSON.stringify({ sql: command + ';' })
                });
                
                if (resp.ok) {
                  console.log(`✅ Comando ${i + 1} executado com sucesso`);
                  success = true;
                  break;
                }
              } catch (e) {
                // Continuar tentando outros endpoints
              }
            }
            
            if (!success) {
              console.warn(`⚠️ Não foi possível executar comando ${i + 1}`);
            }
            
          } catch (err) {
            console.warn(`⚠️ Erro no comando ${i + 1}:`, err.message);
          }
        }
      }
    } else {
      console.log('✅ SQL executado com sucesso via API REST');
    }
    
    console.log('\n🎉 Processo concluído!');
    
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
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (e) {
        console.log(`❌ Tabela ${table}: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTrainingTables();