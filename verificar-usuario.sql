-- Script para verificar se o usuário super admin existe
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT 
  'USUÁRIO NA TABELA AUTH.USERS:' as status,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'vinicius@energiacactos.com.br';

-- 2. Verificar se o perfil existe na tabela profiles
SELECT 
  'PERFIL NA TABELA PROFILES:' as status,
  id,
  email,
  name,
  access_type,
  company_id,
  created_at
FROM profiles 
WHERE email = 'vinicius@energiacactos.com.br';

-- 3. Verificar se a empresa existe
SELECT 
  'EMPRESA CACTOS:' as status,
  id,
  name,
  cnpj,
  email,
  created_at
FROM companies 
WHERE cnpj = '35.807.980/0001-13';

-- 4. Verificar todas as tabelas existentes
SELECT 
  'TABELAS EXISTENTES:' as status,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Se o usuário não existir em auth.users, mostrar instruções
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vinicius@energiacactos.com.br') THEN
    RAISE NOTICE '⚠️  USUÁRIO NÃO ENCONTRADO EM AUTH.USERS!';
    RAISE NOTICE '📋 INSTRUÇÕES PARA CRIAR O USUÁRIO:';
    RAISE NOTICE '1. Vá para Authentication > Users no Supabase Dashboard';
    RAISE NOTICE '2. Clique em "Add user"';
    RAISE NOTICE '3. Email: vinicius@energiacactos.com.br';
    RAISE NOTICE '4. Senha: MinhaSenh@123';
    RAISE NOTICE '5. Confirme o email automaticamente';
    RAISE NOTICE '6. Execute novamente o arquivo insert-empresa-cactos.sql';
  ELSE
    RAISE NOTICE '✅ Usuário encontrado em auth.users!';
  END IF;
END $$;