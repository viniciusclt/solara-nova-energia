import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Usar service role key para operações administrativas
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
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
          
          // Usar query SQL direta
          const { data, error } = await supabase
            .from('_sql')
            .select('*')
            .eq('query', command + ';')
            .single();
          
          // Alternativa: usar fetch direto para SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: command + ';' })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`⚠️ Aviso no comando ${i + 1}:`, errorText);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.warn(`⚠️ Erro no comando ${i + 1}:`, err.message);
        }
      }
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
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTrainingTables();