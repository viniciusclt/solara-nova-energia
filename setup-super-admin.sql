-- Script para verificar tabelas existentes e criar Super Admin Vinícius
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- ========================================
-- 1. VERIFICAÇÃO DAS TABELAS EXISTENTES
-- ========================================

-- Listar todas as tabelas do schema public
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar estrutura das tabelas principais
SELECT 'Estrutura da tabela companies:' as info;
\d public.companies;

SELECT 'Estrutura da tabela profiles:' as info;
\d public.profiles;

SELECT 'Estrutura da tabela subscriptions:' as info;
\d public.subscriptions;

-- Verificar enums existentes
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_access_type', 'subscription_status')
ORDER BY t.typname, e.enumsortorder;

-- ========================================
-- 2. VERIFICAR SE A EMPRESA CACTOS EXISTE
-- ========================================

SELECT 
  'Verificando empresa Cactos:' as status,
  id,
  name,
  cnpj,
  created_at
FROM public.companies 
WHERE name ILIKE '%cactos%' OR cnpj = '00.000.000/0001-00';

-- ========================================
-- 3. CRIAR/ATUALIZAR EMPRESA CACTOS
-- ========================================

-- Inserir ou atualizar a empresa Cactos
INSERT INTO public.companies (
  name, 
  cnpj, 
  address, 
  num_employees
) 
VALUES (
  'Cactos - Soluções em Energia', 
  '00.000.000/0001-00', 
  'Endereço a ser definido', 
  10
)
ON CONFLICT (cnpj) 
DO UPDATE SET 
  name = EXCLUDED.name,
  num_employees = EXCLUDED.num_employees,
  updated_at = now();

-- Verificar se a empresa foi criada/atualizada
SELECT 
  'Empresa Cactos após inserção:' as status,
  id,
  name,
  cnpj,
  num_employees,
  created_at
FROM public.companies 
WHERE cnpj = '00.000.000/0001-00';

-- ========================================
-- 4. CRIAR ASSINATURA PARA A EMPRESA
-- ========================================

-- Criar assinatura ativa para a empresa Cactos
INSERT INTO public.subscriptions (
  company_id, 
  status, 
  authorized_employees, 
  is_free, 
  start_date,
  end_date
)
SELECT 
  c.id,
  'ativa'::subscription_status,
  50, -- Autorizar até 50 funcionários
  true, -- Assinatura gratuita
  now(),
  now() + interval '1 year' -- Válida por 1 ano
FROM public.companies c
WHERE c.cnpj = '00.000.000/0001-00'
AND NOT EXISTS (
  SELECT 1 FROM public.subscriptions s 
  WHERE s.company_id = c.id
);

-- Verificar assinatura criada
SELECT 
  'Assinatura da empresa Cactos:' as status,
  s.id,
  s.status,
  s.authorized_employees,
  s.is_free,
  s.start_date,
  s.end_date,
  c.name as company_name
FROM public.subscriptions s
JOIN public.companies c ON s.company_id = c.id
WHERE c.cnpj = '00.000.000/0001-00';

-- ========================================
-- 5. VERIFICAR SE O USUÁRIO VINÍCIUS EXISTE
-- ========================================

-- Verificar se já existe um usuário com o email vinicius@energiacactos.com.br
SELECT 
  'Verificando usuário Vinícius:' as status,
  p.id,
  p.email,
  p.name,
  p.access_type,
  c.name as company_name
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE p.email = 'vinicius@energiacactos.com.br';

-- ========================================
-- 6. INSTRUÇÕES PARA CRIAR O USUÁRIO
-- ========================================

-- Como o usuário precisa ser criado via auth.users primeiro,
-- vamos preparar as instruções

SELECT '
========================================
INSTRUÇÕES PARA CRIAR O SUPER ADMIN VINÍCIUS:
========================================

1. CRIAR USUÁRIO VIA SUPABASE AUTH:
   - Vá para Authentication > Users no Dashboard
   - Clique em "Add user"
   - Email: vinicius@energiacactos.com.br
   - Password: [definir senha segura]
   - Email Confirm: true
   - Copie o UUID do usuário criado

2. APÓS CRIAR O USUÁRIO, EXECUTE O SQL ABAIXO:
   (Substitua USER_UUID_AQUI pelo UUID real do usuário)

' as instrucoes;

-- ========================================
-- 7. SQL PARA EXECUTAR APÓS CRIAR O USUÁRIO
-- ========================================

-- IMPORTANTE: Substitua 'USER_UUID_AQUI' pelo UUID real do usuário criado

/*
-- Atualizar o perfil do usuário Vinícius para Super Admin
UPDATE public.profiles 
SET 
  name = 'Vinícius',
  access_type = 'super_admin'::user_access_type,
  company_id = (
    SELECT id FROM public.companies 
    WHERE cnpj = '00.000.000/0001-00' 
    LIMIT 1
  ),
  updated_at = now()
WHERE id = 'USER_UUID_AQUI'; -- Substitua pelo UUID real

-- Verificar se o usuário foi atualizado corretamente
SELECT 
  'Usuário Vinícius após atualização:' as status,
  p.id,
  p.email,
  p.name,
  p.access_type,
  p.company_id,
  c.name as company_name,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.email = 'vinicius@energiacactos.com.br';
*/

-- ========================================
-- 8. VERIFICAÇÃO FINAL
-- ========================================

-- Verificar estrutura completa após configuração
SELECT 
  'RESUMO FINAL - Empresa Cactos:' as status,
  c.id as company_id,
  c.name,
  c.cnpj,
  c.num_employees,
  s.status as subscription_status,
  s.authorized_employees,
  s.is_free,
  COUNT(p.id) as total_users
FROM public.companies c
LEFT JOIN public.subscriptions s ON c.id = s.company_id
LEFT JOIN public.profiles p ON c.id = p.company_id
WHERE c.cnpj = '00.000.000/0001-00'
GROUP BY c.id, c.name, c.cnpj, c.num_employees, s.status, s.authorized_employees, s.is_free;

-- Listar todos os usuários da empresa Cactos
SELECT 
  'USUÁRIOS DA EMPRESA CACTOS:' as status,
  p.id,
  p.email,
  p.name,
  p.access_type,
  p.last_login,
  p.created_at
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE c.cnpj = '00.000.000/0001-00'
ORDER BY p.access_type DESC, p.created_at;

-- ========================================
-- 9. VERIFICAR OUTRAS TABELAS IMPORTANTES
-- ========================================

-- Verificar se existem outras tabelas importantes
SELECT 
  'TABELAS EXISTENTES NO SISTEMA:' as status,
  tablename,
  CASE 
    WHEN tablename LIKE '%audit%' THEN 'Auditoria'
    WHEN tablename LIKE '%notification%' THEN 'Notificações'
    WHEN tablename LIKE '%financial%' THEN 'Financeiro'
    WHEN tablename LIKE '%module%' THEN 'Módulos Solares'
    WHEN tablename LIKE '%inverter%' THEN 'Inversores'
    WHEN tablename LIKE '%lead%' THEN 'Leads'
    WHEN tablename LIKE '%proposal%' THEN 'Propostas'
    WHEN tablename LIKE '%equipment%' THEN 'Equipamentos'
    ELSE 'Outros'
  END as categoria
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY categoria, tablename;

SELECT '
========================================
CONCLUSÃO:
========================================

✅ Empresa Cactos criada/verificada
✅ Assinatura ativa configurada
⏳ Aguardando criação do usuário Vinícius via Dashboard
⏳ Aguardando configuração do perfil Super Admin

PRÓXIMOS PASSOS:
1. Criar usuário via Authentication > Users
2. Executar SQL de atualização do perfil
3. Verificar permissões e acesso

' as conclusao;