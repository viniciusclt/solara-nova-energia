-- Script para diagnosticar e corrigir erros 'Usuário ou empresa não encontrados'
-- Data: 2025-01-17
-- Objetivo: Eliminar os 2 erros que impedem o carregamento do dashboard

-- ========================================
-- 1. DIAGNÓSTICO: Verificar estrutura atual
-- ========================================

-- Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'companies', 'auth_users')
ORDER BY tablename;

-- Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- 2. ANÁLISE: Usuários sem company_id
-- ========================================

-- Contar usuários com e sem company_id
SELECT 
    'Usuários com company_id' as categoria,
    COUNT(*) as total
FROM profiles 
WHERE company_id IS NOT NULL

UNION ALL

SELECT 
    'Usuários sem company_id' as categoria,
    COUNT(*) as total
FROM profiles 
WHERE company_id IS NULL;

-- Listar usuários sem company_id (detalhado)
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.company_id
FROM profiles p
WHERE p.company_id IS NULL
ORDER BY p.created_at DESC;

-- Verificar se existe empresa padrão
SELECT 
    id,
    name,
    slug,
    created_at
FROM companies 
WHERE slug = 'empresa-padrao' OR name ILIKE '%padrão%' OR name ILIKE '%default%'
LIMIT 5;

-- ========================================
-- 3. CORREÇÃO: Criar empresa padrão
-- ========================================

-- Inserir empresa padrão se não existir
INSERT INTO companies (
    id,
    name,
    slug,
    description,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Empresa Padrão',
    'empresa-padrao',
    'Empresa padrão para usuários sem empresa definida',
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE slug = 'empresa-padrao'
);

-- Obter ID da empresa padrão
DO $$
DECLARE
    default_company_id UUID;
    orphan_users_count INTEGER;
BEGIN
    -- Buscar ID da empresa padrão
    SELECT id INTO default_company_id 
    FROM companies 
    WHERE slug = 'empresa-padrao'
    LIMIT 1;
    
    IF default_company_id IS NULL THEN
        RAISE EXCEPTION 'Empresa padrão não encontrada. Execute a inserção primeiro.';
    END IF;
    
    -- Contar usuários órfãos
    SELECT COUNT(*) INTO orphan_users_count
    FROM profiles 
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Empresa padrão ID: %', default_company_id;
    RAISE NOTICE 'Usuários órfãos encontrados: %', orphan_users_count;
    
    -- Atualizar usuários órfãos
    IF orphan_users_count > 0 THEN
        UPDATE profiles 
        SET 
            company_id = default_company_id,
            updated_at = NOW()
        WHERE company_id IS NULL;
        
        RAISE NOTICE 'Usuários órfãos atualizados: %', orphan_users_count;
    END IF;
END $$;

-- ========================================
-- 4. VERIFICAÇÃO: Confirmar correções
-- ========================================

-- Verificar se ainda existem usuários sem company_id
SELECT 
    COUNT(*) as usuarios_sem_empresa
FROM profiles 
WHERE company_id IS NULL;

-- Estatísticas finais
SELECT 
    c.name as empresa,
    COUNT(p.id) as total_usuarios
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GROUP BY c.id, c.name
ORDER BY total_usuarios DESC;

-- ========================================
-- 5. LOGS: Registrar ações no audit_log
-- ========================================

-- Inserir log da correção
INSERT INTO audit_logs (
    id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    created_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    'UPDATE',
    'profiles',
    p.id,
    jsonb_build_object('company_id', NULL),
    jsonb_build_object('company_id', p.company_id),
    '127.0.0.1',
    'Sistema - Correção Dashboard',
    NOW()
FROM profiles p
WHERE p.company_id = (
    SELECT id FROM companies WHERE slug = 'empresa-padrao' LIMIT 1
)
AND p.updated_at > NOW() - INTERVAL '1 hour';

-- ========================================
-- 6. PERMISSÕES: Verificar RLS
-- ========================================

-- Verificar políticas RLS para profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'profiles'
ORDER BY policyname;

-- Verificar permissões para roles anon e authenticated
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'companies')
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- ========================================
-- 7. TESTE: Simular busca do dashboard
-- ========================================

-- Simular a query que falha no DashboardService
SELECT 
    p.id as user_id,
    p.email,
    p.company_id,
    c.name as company_name,
    c.status as company_status
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email = 'vinicius@energiacactos.com.br'
LIMIT 1;

-- Verificar se existem propostas para a empresa
SELECT 
    COUNT(*) as total_propostas
FROM proposals pr
JOIN profiles p ON p.id = pr.user_id
WHERE p.company_id = (
    SELECT company_id 
    FROM profiles 
    WHERE email = 'vinicius@energiacactos.com.br'
    LIMIT 1
);

-- ========================================
-- 8. RELATÓRIO FINAL
-- ========================================

SELECT 
    'DIAGNÓSTICO COMPLETO' as status,
    (
        SELECT COUNT(*) 
        FROM profiles 
        WHERE company_id IS NULL
    ) as usuarios_sem_empresa,
    (
        SELECT COUNT(*) 
        FROM companies
    ) as total_empresas,
    (
        SELECT COUNT(*) 
        FROM profiles
    ) as total_usuarios,
    NOW() as executado_em;

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'DIAGNÓSTICO DASHBOARD CONCLUÍDO';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Verificar se ainda existem usuários sem company_id';
    RAISE NOTICE '2. Testar o DashboardService novamente';
    RAISE NOTICE '3. Verificar logs de erro no frontend';
    RAISE NOTICE '4. Aplicar melhorias no tratamento de erro';
    RAISE NOTICE '=========================================';
END $$;