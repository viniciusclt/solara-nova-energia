-- Script para inserir dados da empresa Cactos e configurar perfil super admin
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Inserir empresa Cactos com dados atualizados
INSERT INTO companies (id, name, cnpj, email, phone, address, city, state, postal_code, num_employees)
VALUES (
  gen_random_uuid(),
  'Cactos - Soluções Energia',
  '35.807.980/0001-13',
  'contato@energiacactos.com.br',
  '(11) 97681-1065',
  'Rua das Energias Renováveis, 123, Rio de Janeiro, RJ',
  'Rio de Janeiro',
  'RJ',
  '01234-567',
  10
) ON CONFLICT (cnpj) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  postal_code = EXCLUDED.postal_code;

-- Configurar perfil super admin
INSERT INTO profiles (id, email, name, access_type, company_id)
VALUES (
  '2c64d4ec-a0e5-4e9d-aad7-acb19c7d02b4',
  'vinicius@energiacactos.com.br',
  'Vinícius',
  'super_admin'::user_access_type,
  (SELECT id FROM companies WHERE cnpj = '35.807.980/0001-13' LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  access_type = EXCLUDED.access_type,
  company_id = EXCLUDED.company_id;

-- Verificar se os dados foram inseridos corretamente
SELECT 'Empresa inserida:' as status, * FROM companies WHERE cnpj = '35.807.980/0001-13';
SELECT 'Perfil configurado:' as status, * FROM profiles WHERE id = '2c64d4ec-a0e5-4e9d-aad7-acb19c7d02b4';

-- Mensagem de sucesso
SELECT '✅ Configuração da empresa Cactos concluída com sucesso!' as resultado;
SELECT '📧 Email de acesso: vinicius@energiacactos.com.br' as credenciais;
SELECT '🔑 Senha: MinhaSenh@123' as senha;
SELECT '🆔 ID do usuário: 2c64d4ec-a0e5-4e9d-aad7-acb19c7d02b4' as user_id;