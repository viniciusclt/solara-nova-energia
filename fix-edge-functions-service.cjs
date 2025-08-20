require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const SUPABASE_URL = process.env.SUPABASE_URL;

console.log('🔧 Script para corrigir serviço de Edge Functions do Supabase Self-hosted');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

// Função para executar comandos
async function runCommand(command, description) {
  console.log(`\n🔄 ${description}`);
  console.log(`💻 Executando: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) {
      console.log('📤 Saída:');
      console.log(stdout);
    }
    
    if (stderr) {
      console.log('⚠️  Avisos/Erros:');
      console.log(stderr);
    }
    
    return { success: true, stdout, stderr };
  } catch (error) {
    console.log('❌ Erro:', error.message);
    return { success: false, error: error.message };
  }
}

// Função principal
async function main() {
  console.log('\n=== DIAGNÓSTICO E CORREÇÃO DO SERVIÇO DE EDGE FUNCTIONS ===');
  
  // 1. Verificar se Docker está rodando
  console.log('\n📋 ETAPA 1: Verificando Docker');
  const dockerCheck = await runCommand('docker --version', 'Verificando versão do Docker');
  
  if (!dockerCheck.success) {
    console.log('❌ Docker não está disponível. Instale o Docker Desktop primeiro.');
    return;
  }
  
  // 2. Listar containers do Supabase
  console.log('\n📋 ETAPA 2: Verificando containers do Supabase');
  await runCommand('docker ps --filter "name=supabase" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', 'Listando containers do Supabase');
  
  // 3. Verificar logs do container de Edge Functions
  console.log('\n📋 ETAPA 3: Verificando logs das Edge Functions');
  await runCommand('docker logs supabase_edge_runtime --tail 50', 'Logs do Edge Runtime (últimas 50 linhas)');
  
  // 4. Tentar reiniciar o serviço de Edge Functions
  console.log('\n📋 ETAPA 4: Reiniciando serviço de Edge Functions');
  
  const restartCommands = [
    {
      cmd: 'docker restart supabase_edge_runtime',
      desc: 'Reiniciando container Edge Runtime'
    },
    {
      cmd: 'docker restart supabase_functions',
      desc: 'Reiniciando container Functions (se existir)'
    },
    {
      cmd: 'docker restart supabase-edge-runtime',
      desc: 'Reiniciando container Edge Runtime (nome alternativo)'
    }
  ];
  
  let restartSuccess = false;
  for (const { cmd, desc } of restartCommands) {
    const result = await runCommand(cmd, desc);
    if (result.success) {
      restartSuccess = true;
      break;
    }
  }
  
  if (!restartSuccess) {
    console.log('\n⚠️  Não foi possível reiniciar containers específicos. Tentando reiniciar todo o stack...');
    
    // Tentar encontrar e reiniciar todo o stack do Supabase
    const stackCommands = [
      'docker-compose -f docker-compose.yml restart',
      'docker compose restart',
      'docker restart $(docker ps -q --filter "name=supabase")',
    ];
    
    for (const cmd of stackCommands) {
      const result = await runCommand(cmd, `Tentando: ${cmd}`);
      if (result.success) {
        restartSuccess = true;
        break;
      }
    }
  }
  
  // 5. Aguardar e verificar se os serviços subiram
  if (restartSuccess) {
    console.log('\n⏳ Aguardando 10 segundos para os serviços iniciarem...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n📋 ETAPA 5: Verificando status após reinicialização');
    await runCommand('docker ps --filter "name=supabase" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', 'Status dos containers após reinicialização');
  }
  
  // 6. Testar Edge Function novamente
  console.log('\n📋 ETAPA 6: Testando Edge Function');
  const testCommand = `curl -X GET "${SUPABASE_URL}/functions/v1/sync-google-sheets" -H "Authorization: Bearer ${process.env.SUPABASE_ANON_KEY}" -H "apikey: ${process.env.SUPABASE_ANON_KEY}"`;
  
  await runCommand(testCommand, 'Testando Edge Function via curl');
  
  // 7. Verificar configuração do Supabase
  console.log('\n📋 ETAPA 7: Verificando configuração');
  
  const configChecks = [
    {
      cmd: 'docker exec supabase_kong cat /etc/kong/kong.yml',
      desc: 'Verificando configuração do Kong (proxy)'
    },
    {
      cmd: 'docker logs supabase_kong --tail 20',
      desc: 'Logs do Kong (últimas 20 linhas)'
    }
  ];
  
  for (const { cmd, desc } of configChecks) {
    await runCommand(cmd, desc);
  }
  
  // 8. Resultado final e recomendações
  console.log('\n=== RESULTADO E RECOMENDAÇÕES ===');
  
  if (restartSuccess) {
    console.log('✅ Serviços foram reiniciados com sucesso');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Aguarde mais alguns minutos para estabilização completa');
    console.log('2. Teste a Edge Function novamente');
    console.log('3. Se ainda não funcionar, verifique os logs acima para erros específicos');
  } else {
    console.log('❌ Não foi possível reiniciar os serviços automaticamente');
    console.log('\n📋 AÇÕES MANUAIS RECOMENDADAS:');
    console.log('1. Navegue até o diretório onde está o docker-compose.yml do Supabase');
    console.log('2. Execute: docker-compose down && docker-compose up -d');
    console.log('3. Aguarde alguns minutos para todos os serviços subirem');
    console.log('4. Verifique os logs: docker-compose logs -f edge_runtime');
  }
  
  console.log('\n🔗 LINKS ÚTEIS:');
  console.log(`📊 Dashboard: ${SUPABASE_URL}`);
  console.log(`🔧 API Health: ${SUPABASE_URL}/rest/v1/`);
  console.log(`⚡ Functions: ${SUPABASE_URL}/functions/v1/`);
  
  console.log('\n💡 DICA: Se o problema persistir, pode ser necessário:');
  console.log('   - Recriar os volumes do Docker');
  console.log('   - Verificar permissões de arquivo');
  console.log('   - Atualizar a versão do Supabase self-hosted');
}

// Executar
main().catch(console.error);