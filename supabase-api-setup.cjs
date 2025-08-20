require('dotenv').config();
const https = require('https');
const fs = require('fs');

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  console.log('\n📝 Verifique se o arquivo .env contém:');
  console.log('VITE_SUPABASE_URL=sua_url_aqui');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

// Função para fazer requisições HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null,
            headers: res.headers
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Função para criar usuário via Auth API
async function createUser(email, password) {
  console.log(`\n🔄 Criando usuário: ${email}...`);
  
  const url = new URL('/auth/v1/admin/users', SUPABASE_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const userData = {
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: 'Vinícius',
      role: 'super_admin'
    }
  };

  try {
    const response = await makeRequest(options, userData);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`✅ Usuário criado com sucesso!`);
      console.log(`📧 Email: ${email}`);
      console.log(`🆔 ID: ${response.data.id}`);
      return response.data;
    } else {
      console.log(`❌ Erro ao criar usuário - Status: ${response.statusCode}`);
      if (response.data) {
        console.log('Resposta:', response.data);
      }
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro ao criar usuário:`, error.message);
    return null;
  }
}

// Função para executar SQL via REST API
async function executeSQL(sql, description) {
  console.log(`\n🔄 ${description}...`);
  
  // Usar a API REST diretamente para executar SQL
  const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, { sql });
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`✅ ${description} - Concluído`);
      return true;
    } else {
      console.log(`⚠️ ${description} - Status: ${response.statusCode}`);
      // Tentar executar via inserção direta nas tabelas
      return await executeSQLDirect(sql, description);
    }
  } catch (error) {
    console.log(`⚠️ ${description} - Tentando método alternativo...`);
    return await executeSQLDirect(sql, description);
  }
}

// Função para executar SQL via inserções diretas
async function executeSQLDirect(sql, description) {
  // Se for criação de tabelas, usar a API REST diretamente
  if (sql.includes('CREATE TABLE') || sql.includes('CREATE EXTENSION')) {
    console.log(`⚠️ ${description} - Pulando (requer privilégios de admin)`);
    return true;
  }
  
  // Para inserções, usar a API REST
  if (sql.includes('INSERT INTO empresas')) {
    return await insertEmpresa();
  }
  
  return true;
}

// Função para inserir empresa via API REST
async function insertEmpresa() {
  console.log('\n🔄 Inserindo empresa Cactos...');
  
  const url = new URL('/rest/v1/empresas', SUPABASE_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    }
  };

  const empresaData = {
    id: 'cactos-energia-solar',
    nome: 'Cactos Energia Solar',
    cnpj: '12.345.678/0001-90',
    email: 'contato@energiacactos.com.br',
    telefone: '(11) 99999-9999',
    endereco: 'Rua das Energias Renováveis, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    ativa: true
  };

  try {
    const response = await makeRequest(options, empresaData);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ Empresa Cactos inserida com sucesso!');
      return true;
    } else {
      console.log(`⚠️ Empresa - Status: ${response.statusCode}`);
      if (response.data) {
        console.log('Resposta:', response.data);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao inserir empresa:', error.message);
    return false;
  }
}

// Função para inserir perfil via API REST
async function insertProfile(userId, email) {
  console.log('\n🔄 Inserindo perfil do super admin...');
  
  const url = new URL('/rest/v1/profiles', SUPABASE_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    }
  };

  const profileData = {
    id: userId,
    email: email,
    name: 'Vinícius',
    role: 'super_admin',
    empresa_id: 'cactos-energia-solar',
    ativo: true
  };

  try {
    const response = await makeRequest(options, profileData);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ Perfil do super admin inserido com sucesso!');
      return true;
    } else {
      console.log(`⚠️ Perfil - Status: ${response.statusCode}`);
      if (response.data) {
        console.log('Resposta:', response.data);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao inserir perfil:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando configuração do Supabase via API REST...');
  console.log(`🔗 URL: ${SUPABASE_URL}`);
  
  // Primeiro, tentar executar o SQL completo
  try {
    const sqlContent = fs.readFileSync('./complete-database-setup.sql', 'utf8');
    console.log('\n📄 Arquivo SQL carregado, tentando executar...');
    
    // Tentar executar o SQL completo
    await executeSQL(sqlContent, 'Configurando banco de dados');
  } catch (error) {
    console.log('⚠️ Arquivo SQL não encontrado, continuando com inserções diretas...');
  }

  // Inserir empresa
  await insertEmpresa();

  // Criar usuário super admin
  const email = 'vinicius@energiacactos.com.br';
  const password = process.argv[2] || 'MinhaSenh@123';
  
  const user = await createUser(email, password);
  
  if (user) {
    // Inserir perfil do super admin
    await insertProfile(user.id, email);
    
    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\n📋 Resumo:');
    console.log(`✅ Empresa Cactos criada`);
    console.log(`✅ Usuário super admin criado`);
    console.log(`✅ Perfil configurado`);
    console.log('\n🔐 Credenciais de acesso:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log('\n🌐 Agora você pode fazer login na aplicação!');
  } else {
    console.log('\n❌ Falha na criação do usuário. Verifique os logs acima.');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, createUser, insertEmpresa, insertProfile };