# 🚀 Guia de Configuração Manual do Banco de Dados

## ⚠️ Problema Identificado

As chaves do Supabase não estão funcionando corretamente para automação. Isso pode acontecer quando:
- O Supabase é self-hosted (como no seu caso: plexus.tec.br)
- As chaves precisam ser regeneradas
- Há configurações específicas de segurança

### ⚠️ Status Atual:
- **Tabelas do banco:** ✅ Criadas com sucesso no Supabase
- **Usuário super admin:** ❌ Precisa ser criado manualmente no Dashboard
- **Empresa Cactos:** ⌛ Aguardando criação do usuário
- **Sistema:** ⌛ Aguardando configuração completa

### 🔍 Problema Identificado:
O usuário super admin não foi criado na tabela `auth.users` do Supabase. Isso deve ser feito manualmente no Dashboard.

## 📋 Solução: Configuração Manual via Dashboard

### 1️⃣ **Verificar Status Atual**

1. Acesse o **Supabase Dashboard**: https://supabasekong-z8g8g44wsw44wc048kksoww8.plexus.tec.br
2. Vá para **SQL Editor** → **New Query**
3. Copie e cole o conteúdo do arquivo `verificar-usuario.sql`
4. Clique em **Run** para executar
5. Analise os resultados para confirmar o que precisa ser criado

### 2️⃣ **Criar Usuário Super Admin** ❌

**Status:** Precisa ser criado manualmente!

**Passos para criar:**
1. No Supabase Dashboard, vá para **Authentication** → **Users**
2. Clique em **"Add user"**
3. Preencha os dados:
   - **Email:** `vinicius@energiacactos.com.br`
   - **Senha:** `MinhaSenh@123`
   - **Confirmar email automaticamente:** ✅ Marque esta opção
4. Clique em **"Create user"**
5. **Anote o UUID gerado** (será diferente de 2c64d4ec-a0e5-4e9d-aad7-acb19c7d02b4)

### 3️⃣ **Configurar Empresa e Perfil** ⌛

**Após criar o usuário no passo 2:**

1. **Atualize o arquivo `insert-empresa-cactos.sql`:**
   - Substitua `'2c64d4ec-a0e5-4e9d-aad7-acb19c7d02b4'` pelo UUID real do usuário criado

2. **Execute o script atualizado:**
   - Vá para **SQL Editor** → **New Query**
   - Copie e cole o conteúdo do arquivo `insert-empresa-cactos.sql` atualizado
   - Clique em **Run** para executar

3. **Verifique os resultados:**
   - Empresa "Cactos - Soluções Energia" criada
   - Perfil super admin configurado

### 4️⃣ **Teste de Login**

**Após completar todos os passos anteriores:**

1. **Acesse a aplicação:** http://localhost:8081/
2. **Faça login com:**
   - **Email:** `vinicius@energiacactos.com.br`
   - **Senha:** `MinhaSenh@123`

3. **Se o login falhar, execute novamente:**
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM auth.users WHERE email = 'vinicius@energiacactos.com.br';
   SELECT * FROM profiles WHERE email = 'vinicius@energiacactos.com.br';
   ```

4. **Verifique se:**
   - O usuário existe em `auth.users`
   - O perfil existe em `profiles` com `access_type = 'super_admin'`
   - A empresa existe em `companies`

## ✅ **Resultado Esperado**

Após seguir todos os passos, você deve ter:

- ✅ **10 tabelas criadas** (companies, profiles, subscriptions, etc.)
- ✅ **Empresa "Cactos - Soluções em Energia"** criada
- ✅ **Assinatura ativa** para a empresa Cactos
- ✅ **Usuário Vinícius** como Super Admin
- ✅ **RLS (Row Level Security)** configurado
- ✅ **Políticas de segurança** ativas

## 🔧 **Próximos Passos**

1. **Teste o login** na aplicação com as credenciais criadas
2. **Verifique as permissões** de Super Admin
3. **Configure dados adicionais** conforme necessário

## 🆘 **Troubleshooting**

### Problema: "Tabela não encontrada"
**Solução**: Execute novamente o `complete-database-setup.sql`

### Problema: "Usuário não consegue fazer login"
**Solução**: Verifique se o email foi confirmado no Dashboard

### Problema: "Acesso negado"
**Solução**: Confirme que o `access_type` está como `super_admin`

### Problema: "Empresa não encontrada"
**Solução**: Execute a parte de criação da empresa do SQL novamente

---

**💡 Dica**: Mantenha o Dashboard do Supabase aberto durante todo o processo para monitorar os resultados em tempo real.