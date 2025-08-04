# 🔑 Verificar e Corrigir Credenciais do Supabase

## ❌ Problema Identificado

Todas as tentativas de autenticação com o Supabase estão falhando com "Invalid authentication credentials". Isso indica que as chaves no arquivo `.env` podem estar incorretas ou o projeto Supabase pode ter configurações restritivas.

## 🔍 Diagnóstico Realizado

### Tentativas de Autenticação Falharam:
- ✅ PowerShell Invoke-RestMethod com Service Role Key
- ✅ PowerShell Invoke-RestMethod com Anon Key  
- ✅ Script Node.js com biblioteca oficial
- ✅ Curl direto com apikey e Authorization headers
- ✅ Teste de conectividade básica com REST API
- ✅ Teste de login com credenciais existentes

### Endpoints Testados:
- `/auth/v1/admin/users`
- `/auth/v1/signup`
- `/auth/v1/token`
- `/rest/v1/`

## 🔧 Soluções Possíveis

### 1. Verificar Credenciais no Supabase Dashboard

1. **Acesse o Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione o projeto correto:**
   - Procure pelo projeto com URL: `supabasekong-z8g8g44wsw44wc048kksoww8.plexus.tec.br`

3. **Vá para Settings > API:**
   - Verifique se a **Project URL** está correta
   - Copie a **anon public key**
   - Copie a **service_role key**

4. **Atualize o arquivo `.env`:**
   ```env
   VITE_SUPABASE_URL=https://supabasekong-z8g8g44wsw44wc048kksoww8.plexus.tec.br
   VITE_SUPABASE_ANON_KEY=sua_nova_anon_key_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_nova_service_role_key_aqui
   ```

### 2. Verificar Configurações do Projeto

1. **Authentication Settings:**
   - Vá para Authentication > Settings
   - Verifique se "Enable email confirmations" está desabilitado (para testes)
   - Verifique se "Enable phone confirmations" está desabilitado

2. **RLS (Row Level Security):**
   - Vá para Database > Tables
   - Verifique se as tabelas `profiles` e `companies` existem
   - Verifique as políticas RLS se estiverem habilitadas

3. **API Settings:**
   - Vá para Settings > API
   - Verifique se não há restrições de CORS
   - Verifique se a API está habilitada

### 3. Testar Conectividade

Após atualizar as credenciais, execute:

```bash
node test-login.js
```

Se ainda falhar, tente:

```bash
curl -X GET "https://supabasekong-z8g8g44wsw44wc048kksoww8.plexus.tec.br/rest/v1/" \
  -H "apikey: SUA_NOVA_ANON_KEY" \
  -H "Authorization: Bearer SUA_NOVA_ANON_KEY"
```

### 4. Verificar Logs do Supabase

1. **Vá para Logs no Dashboard:**
   - Logs > Auth Logs
   - Procure por tentativas de autenticação falhadas
   - Verifique se há mensagens de erro específicas

2. **Logs de API:**
   - Logs > API Logs
   - Verifique se as requisições estão chegando
   - Procure por erros de autorização

## 🚨 Se o Problema Persistir

### Opção 1: Criar Novo Projeto Supabase

1. Crie um novo projeto no Supabase
2. Configure as tabelas necessárias
3. Atualize as credenciais no `.env`
4. Execute as migrações do banco

### Opção 2: Usar Criação Manual

1. Siga o guia: `CRIAR-USUARIO-MANUAL.md`
2. Crie o usuário diretamente no Dashboard
3. Execute o script SQL para configurar empresa e perfil

## 📋 Credenciais Atuais no .env

```env
VITE_SUPABASE_URL=https://supabasekong-z8g8g44wsw44wc048kksoww8.plexus.tec.br
VITE_SUPABASE_ANON_KEY=XPvZneJUtcRs/1SeOhiVZjoDb6KuNiPFPKSAimSHkFkaKT1Eg9r6pQIiGrjKfcPOOrLq+mTknLWU/gh6yGWwzg==
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NDA0NzYyMCwiZXhwIjo0OTA5NzIxMjIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.nKrrjGeJEsHByZtaA9KXnjUeS9Kue_TomZlOhKUJD3o
```

⚠️ **Importante:** Verifique se essas chaves estão corretas no Dashboard do Supabase.

## ✅ Próximos Passos

1. **Verificar credenciais no Dashboard**
2. **Atualizar arquivo `.env` se necessário**
3. **Testar conectividade com `node test-login.js`**
4. **Se funcionar, executar criação do usuário**
5. **Se não funcionar, seguir guia manual**

---

**📞 Suporte:** Se precisar de ajuda, verifique os logs do Supabase Dashboard para mensagens de erro mais específicas.