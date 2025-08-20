# 🔧 Guia: Execução Manual do SQL de Diagnóstico

## ❌ Problema Identificado

A conexão direta PostgreSQL não está acessível (timeout em todas as configurações testadas). Isso indica que:
- A porta 5432 pode estar bloqueada por firewall
- O PostgreSQL pode não estar exposto externamente
- A configuração de rede do Supabase self-hosted pode estar restrita

## ✅ Solução: Interface Web do Supabase

### 📋 Passo a Passo

#### 1. **Acesse a Interface Web**
```
URL: https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br
```

#### 2. **Faça Login**
- Use suas credenciais de administrador
- Se não tiver acesso, solicite ao responsável pela infraestrutura

#### 3. **Navegue para o SQL Editor**
- No menu lateral, clique em **"SQL Editor"**
- Ou acesse diretamente: `[URL]/project/default/sql`

#### 4. **Execute o SQL de Diagnóstico**

Copie e cole o seguinte SQL no editor:

```sql
-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO: Usuários sem company_id
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'companies')
ORDER BY tablename;

-- 2. ANALISAR USUÁRIOS SEM COMPANY_ID
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

-- 3. LISTAR USUÁRIOS ÓRFÃOS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  p.company_id
FROM profiles p
WHERE p.company_id IS NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. VERIFICAR SE EXISTE EMPRESA PADRÃO
SELECT 
  id,
  name,
  slug,
  created_at
FROM companies 
WHERE slug = 'empresa-padrao' OR name ILIKE '%padrão%' OR name ILIKE '%default%'
LIMIT 5;

-- 5. CRIAR EMPRESA PADRÃO (SE NÃO EXISTIR)
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

-- 6. CORRIGIR USUÁRIOS ÓRFÃOS
UPDATE profiles 
SET 
  company_id = (
    SELECT id FROM companies WHERE slug = 'empresa-padrao' LIMIT 1
  ),
  updated_at = NOW()
WHERE company_id IS NULL;

-- 7. VERIFICAÇÃO FINAL
SELECT 
  COUNT(*) as usuarios_sem_empresa
FROM profiles 
WHERE company_id IS NULL;

-- 8. ESTATÍSTICAS FINAIS
SELECT 
  c.name as empresa,
  COUNT(p.id) as total_usuarios
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GRUP BY c.id, c.name
ORDER BY total_usuarios DESC;
```

#### 5. **Executar o SQL**
- Clique no botão **"Run"** ou pressione `Ctrl+Enter`
- Aguarde a execução completa
- Verifique os resultados de cada etapa

#### 6. **Verificar Resultados**

Após a execução, você deve ver:
- ✅ Empresa padrão criada (se não existia)
- ✅ Usuários órfãos corrigidos
- ✅ Contagem final de usuários sem empresa = 0

## 🔍 Verificação de Sucesso

### Indicadores de Correção Bem-Sucedida:

1. **Última query deve retornar:**
   ```
   usuarios_sem_empresa: 0
   ```

2. **Estatísticas finais devem mostrar:**
   ```
   Empresa Padrão: [número] usuários
   [outras empresas]: [números] usuários
   ```

## 🚀 Próximos Passos

Após executar o SQL com sucesso:

### 1. **Testar o DashboardService**
```bash
# No terminal do projeto
npm run dev
```

### 2. **Verificar Logs de Erro**
- Acesse o dashboard da aplicação
- Verifique se os erros "Usuário ou empresa não encontrados" desapareceram
- Monitore o console do navegador

### 3. **Validar Funcionalidade**
- Teste login de usuários
- Verifique carregamento do dashboard
- Confirme que métricas são exibidas corretamente

## 🔧 Troubleshooting

### Se o SQL falhar:

1. **Verificar permissões:**
   ```sql
   SELECT current_user, session_user;
   ```

2. **Verificar se as tabelas existem:**
   ```sql
   \dt profiles
   \dt companies
   ```

3. **Executar por partes:**
   - Execute cada seção do SQL separadamente
   - Identifique onde está falhando

### Se não conseguir acessar a interface:

1. **Verificar se o Supabase está rodando:**
   ```bash
   docker compose ps
   ```

2. **Verificar logs:**
   ```bash
   docker compose logs kong
   docker compose logs db
   ```

3. **Reiniciar serviços:**
   ```bash
   docker compose restart
   ```

## 📝 Registro da Execução

Após executar o SQL, documente:
- ✅ Data e hora da execução
- ✅ Número de usuários corrigidos
- ✅ Resultados dos testes posteriores
- ✅ Qualquer erro encontrado

---

## 💡 Resumo

**Problema:** Usuários sem `company_id` causando erros no DashboardService

**Solução:** Execução manual do SQL via interface web para:
1. Criar empresa padrão
2. Associar usuários órfãos à empresa padrão
3. Verificar correção

**Resultado Esperado:** Dashboard funcionando sem erros de "Usuário ou empresa não encontrados"