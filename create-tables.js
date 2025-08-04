import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Criar cliente Supabase com service role (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql, description) {
  try {
    console.log(`🔄 ${description}...`);
    
    // Usar fetch direto para a API REST do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes('already exists') || 
          errorText.includes('duplicate key') ||
          errorText.includes('does not exist')) {
        console.log(`⚠️  ${description}: ${errorText}`);
        return true;
      } else {
        console.log(`❌ ${description}: ${errorText}`);
        return false;
      }
    }
    
    console.log(`✅ ${description}: Concluído`);
    return true;
  } catch (err) {
    console.log(`❌ ${description}: ${err.message}`);
    return false;
  }
}

async function createTables() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...');
    
    // Como a função exec_sql pode não existir, vamos usar uma abordagem alternativa
    // Vamos tentar criar as tabelas diretamente usando o cliente Supabase
    
    console.log('🔄 Criando empresa Cactos...');
    
    // Primeiro, vamos tentar inserir dados para ver se as tabelas existem
    // Se não existirem, vamos criar manualmente
    
    try {
      // Tentar inserir empresa para verificar se a tabela existe
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .upsert({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Cactos Energia Solar',
          cnpj: '12.345.678/0001-90',
          email: 'contato@cactosenergia.com.br',
          phone: '(11) 99999-9999',
          address: 'Rua das Energias Renováveis, 123',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234-567'
        }, {
          onConflict: 'id'
        });
      
      if (companyError || (companyError && companyError.message && companyError.message.includes('does not exist'))) {
         console.log('❌ Tabelas não existem. Você precisa executar o SQL manualmente.');
         console.log('\n📋 INSTRUÇÕES PARA CRIAR AS TABELAS:');
         console.log('1. Abra o Supabase Dashboard (https://supabase.com/dashboard)');
         console.log('2. Vá para o seu projeto');
         console.log('3. Clique em "SQL Editor"');
         console.log('4. Execute o seguinte SQL:');
         console.log('\n--- COPIE E COLE O SQL ABAIXO ---');
        
        const createTablesSQL = `
-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    access_type VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    consumption_kwh DECIMAL(10,2),
    energy_bill_value DECIMAL(10,2),
    roof_area DECIMAL(10,2),
    roof_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipamentos (módulos solares)
CREATE TABLE IF NOT EXISTS public.solar_modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    power_wp INTEGER NOT NULL,
    efficiency DECIMAL(5,2),
    voltage_voc DECIMAL(6,2),
    current_isc DECIMAL(6,2),
    voltage_vmp DECIMAL(6,2),
    current_imp DECIMAL(6,2),
    temperature_coefficient DECIMAL(5,3),
    dimensions_length DECIMAL(6,2),
    dimensions_width DECIMAL(6,2),
    dimensions_height DECIMAL(6,2),
    weight DECIMAL(6,2),
    warranty_years INTEGER,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de inversores
CREATE TABLE IF NOT EXISTS public.inverters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    power_kw DECIMAL(8,2) NOT NULL,
    efficiency DECIMAL(5,2),
    input_voltage_min DECIMAL(6,2),
    input_voltage_max DECIMAL(6,2),
    mppt_channels INTEGER,
    output_voltage DECIMAL(6,2),
    output_frequency DECIMAL(4,1),
    protection_ip VARCHAR(10),
    dimensions_length DECIMAL(6,2),
    dimensions_width DECIMAL(6,2),
    dimensions_height DECIMAL(6,2),
    weight DECIMAL(6,2),
    warranty_years INTEGER,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de propostas
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    proposal_number VARCHAR(50),
    title VARCHAR(255),
    system_power_kw DECIMAL(8,2),
    estimated_generation_kwh DECIMAL(10,2),
    total_investment DECIMAL(12,2),
    payback_years DECIMAL(4,1),
    savings_25_years DECIMAL(12,2),
    modules_quantity INTEGER,
    module_id UUID REFERENCES public.solar_modules(id),
    inverter_id UUID REFERENCES public.inverters(id),
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir empresa Cactos Energia Solar
INSERT INTO public.companies (
    id,
    name,
    cnpj,
    email,
    phone,
    address,
    city,
    state,
    zip_code
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Cactos Energia Solar',
    '12.345.678/0001-90',
    'contato@cactosenergia.com.br',
    '(11) 99999-9999',
    'Rua das Energias Renováveis, 123',
    'São Paulo',
    'SP',
    '01234-567'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    cnpj = EXCLUDED.cnpj,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    updated_at = NOW();

-- Inserir perfil do usuário super admin
INSERT INTO public.profiles (
    id,
    company_id,
    full_name,
    email,
    access_type,
    is_active
) VALUES (
    '4f689ba6-1e12-41fb-8619-5d1dcae4d0a9',
    '550e8400-e29b-41d4-a716-446655440000',
    'Vinícius - Super Admin',
    'vinicius@energiacactos.com.br',
    'super_admin',
    true
) ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    access_type = EXCLUDED.access_type,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Inserir módulos solares de exemplo
INSERT INTO public.solar_modules (
    company_id,
    manufacturer,
    model,
    power_wp,
    efficiency,
    price,
    is_active
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Canadian Solar',
    'CS3W-400P',
    400,
    20.3,
    450.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Jinko Solar',
    'JKM410M-54HL4-V',
    410,
    21.0,
    470.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Trina Solar',
    'TSM-DE09.08',
    405,
    20.8,
    460.00,
    true
)
ON CONFLICT DO NOTHING;

-- Inserir inversores de exemplo
INSERT INTO public.inverters (
    company_id,
    manufacturer,
    model,
    power_kw,
    efficiency,
    price,
    is_active
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Fronius',
    'Primo 5.0-1',
    5.0,
    96.8,
    3500.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'SMA',
    'Sunny Boy 6.0',
    6.0,
    97.1,
    4200.00,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'ABB',
    'UNO-DM-5.0-TL-PLUS',
    5.0,
    96.5,
    3800.00,
    true
)
ON CONFLICT DO NOTHING;
        `;
        
        console.log(createTablesSQL);
        console.log('\n--- FIM DO SQL ---');
        console.log('\n5. Após executar o SQL, execute novamente: node create-tables.js');
        
        return;
      } else if (companyError) {
        console.log('❌ Erro ao inserir empresa:', companyError.message);
      } else {
        console.log('✅ Empresa Cactos inserida/atualizada!');
      }
      
      // Inserir perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: '4f689ba6-1e12-41fb-8619-5d1dcae4d0a9',
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          full_name: 'Vinícius - Super Admin',
          email: 'vinicius@energiacactos.com.br',
          access_type: 'super_admin',
          is_active: true
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.log('❌ Erro ao inserir perfil:', profileError.message);
      } else {
        console.log('✅ Perfil do usuário inserido/atualizado!');
      }
      
      // Inserir módulos solares
      const modules = [
        {
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          manufacturer: 'Canadian Solar',
          model: 'CS3W-400P',
          power_wp: 400,
          efficiency: 20.3,
          price: 450.00,
          is_active: true
        },
        {
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          manufacturer: 'Jinko Solar',
          model: 'JKM410M-54HL4-V',
          power_wp: 410,
          efficiency: 21.0,
          price: 470.00,
          is_active: true
        },
        {
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          manufacturer: 'Trina Solar',
          model: 'TSM-DE09.08',
          power_wp: 405,
          efficiency: 20.8,
          price: 460.00,
          is_active: true
        }
      ];
      
      const { data: modulesData, error: modulesError } = await supabase
        .from('solar_modules')
        .upsert(modules);
      
      if (modulesError) {
        console.log('❌ Erro ao inserir módulos:', modulesError.message);
      } else {
        console.log('✅ Módulos solares inseridos!');
      }
      
      // Inserir inversores
      const inverters = [
        {
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          manufacturer: 'Fronius',
          model: 'Primo 5.0-1',
          power_kw: 5.0,
          efficiency: 96.8,
          price: 3500.00,
          is_active: true
        },
        {
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          manufacturer: 'SMA',
          model: 'Sunny Boy 6.0',
          power_kw: 6.0,
          efficiency: 97.1,
          price: 4200.00,
          is_active: true
        },
        {
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          manufacturer: 'ABB',
          model: 'UNO-DM-5.0-TL-PLUS',
          power_kw: 5.0,
          efficiency: 96.5,
          price: 3800.00,
          is_active: true
        }
      ];
      
      const { data: invertersData, error: invertersError } = await supabase
        .from('inverters')
        .upsert(inverters);
      
      if (invertersError) {
        console.log('❌ Erro ao inserir inversores:', invertersError.message);
      } else {
        console.log('✅ Inversores inseridos!');
      }
      
      // Verificar se as tabelas foram criadas
      console.log('\n🔍 Verificando tabelas criadas...');
      
      const tables = ['companies', 'profiles', 'leads', 'solar_modules', 'inverters', 'proposals'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ Tabela ${table}: ${error.message}`);
          } else {
            console.log(`✅ Tabela ${table}: OK`);
          }
        } catch (err) {
          console.log(`❌ Tabela ${table}: ${err.message}`);
        }
      }
      
      console.log('\n🎉 Configuração do banco de dados concluída!');
      console.log('\n📋 Credenciais de acesso:');
      console.log('📧 Email: vinicius@energiacactos.com.br');
      console.log('🔒 Senha: MinhaSenh@123');
      console.log('\n✅ Você pode fazer login no sistema!');
      
    } catch (error) {
      console.error('❌ Erro inesperado:', error.message);
      
      console.log('\n📋 INSTRUÇÕES MANUAIS:');
      console.log('1. Abra o Supabase Dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o arquivo: setup-database-manual.sql');
      console.log('4. Teste o login novamente');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('1. Abra o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o arquivo: setup-database-manual.sql');
    console.log('4. Teste o login novamente');
  }
}

// Executar a criação das tabelas
createTables();