# 🔧 Guia: Criar Usuário Super Admin Manualmente

## ❌ Problema Identificado
A criação automática do usuário super admin via API está falhando devido a problemas de autenticação com o Supabase. A solução é criar o usuário manualmente no Dashboard do Supabase.

## 📋 Passo a Passo

### 1️⃣ Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **supabasekong-z8g8g44wsw44wc048kksoww8**

### 2️⃣ Criar o Usuário
1. No menu lateral, clique em **"Authentication"**
2. Clique na aba **"Users"**
3. Clique no botão **"Add user"** (ou "Adicionar usuário")
4. Preencha os dados:
   - **Email**: `vinicius@energiacactos.com.br`
   - **Password**: `MinhaSenh@123`
   - **Auto Confirm User**: ✅ (marque esta opção)
5. Clique em **"Create user"**

### 3️⃣ Copiar o UUID do Usuário
1. Após criar o usuário, você verá uma lista com o usuário criado
2. **COPIE o UUID** do usuário (algo como: `12345678-1234-1234-1234-123456789abc`)
3. **GUARDE este UUID** - você precisará dele no próximo passo

### 4️⃣ Executar Script SQL
1. No Supabase Dashboard, vá para **"SQL Editor"**
2. Clique em **"New query"**
3. Cole o seguinte script SQL (substitua `SEU_UUID_AQUI` pelo UUID copiado):

```sql
-- Inserir empresa Cactos
INSERT INTO companies (
    id,
    name,
    cnpj,
    email,
    phone,
    address,
    city,
    state,
    postal_code,
    num_employees,
    subscription_type,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Cactos - Soluções Energia',
    '12.345.678/0001-90',
    'contato@energiacactos.com.br',
    '(11) 99999-9999',
    'Rua das Energias, 123',
    'São Paulo',
    'SP',
    '01234-567',
    50,
    'premium',
    true,
    NOW(),
    NOW()
) ON CONFLICT (cnpj) DO NOTHING;

-- Criar perfil do super admin
INSERT INTO profiles (
    id,
    email,
    full_name,
    access_type,
    company_id,
    is_active,
    created_at,
    updated_at
) VALUES (
    'SEU_UUID_AQUI', -- SUBSTITUA pelo UUID do usuário criado
    'vinicius@energiacactos.com.br',
    'Vinícius - Super Admin',
    'super_admin',
    (SELECT id FROM companies WHERE cnpj = '12.345.678/0001-90'),
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    access_type = 'super_admin',
    company_id = (SELECT id FROM companies WHERE cnpj = '12.345.678/0001-90'),
    updated_at = NOW();

-- Verificar se tudo foi criado corretamente
SELECT 
    'Empresa criada' as status,
    c.name as empresa_nome,
    c.cnpj
FROM companies c 
WHERE c.cnpj = '12.345.678/0001-90'

UNION ALL

SELECT 
    'Perfil criado' as status,
    p.full_name as empresa_nome,
    p.access_type as cnpj
FROM profiles p 
WHERE p.email = 'vinicius@energiacactos.com.br';
```

4. **IMPORTANTE**: Substitua `SEU_UUID_AQUI` pelo UUID real do usuário
5. Clique em **"Run"** para executar o script

### 5️⃣ Verificar o Resultado
Após executar o script, você deve ver:
- ✅ "Empresa criada" - Cactos - Soluções Energia
- ✅ "Perfil criado" - Vinícius - Super Admin

## 🎉 Teste o Login

1. Acesse o sistema: http://localhost:8081
2. Faça login com:
   - **Email**: `vinicius@energiacactos.com.br`
   - **Senha**: `MinhaSenh@123`

## ✅ Credenciais de Acesso

```
📧 Email: vinicius@energiacactos.com.br
🔒 Senha: MinhaSenh@123
🏢 Empresa: Cactos - Soluções Energia
👤 Tipo: Super Admin
```

## 🔧 Troubleshooting

### Se o login ainda falhar:
1. Verifique se o usuário foi criado em **Authentication > Users**
2. Verifique se o perfil foi criado executando:
   ```sql
   SELECT * FROM profiles WHERE email = 'vinicius@energiacactos.com.br';
   ```
3. Verifique se a empresa foi criada:
   ```sql
   SELECT * FROM companies WHERE cnpj = '12.345.678/0001-90';
   ```

### Se houver erro no script SQL:
- Certifique-se de que substituiu `SEU_UUID_AQUI` pelo UUID correto
- Verifique se todas as tabelas foram criadas corretamente
- Execute o script `verificar-usuario.sql` para diagnóstico

---

**📝 Nota**: Este processo manual é necessário devido a limitações de permissão na API do Supabase. Uma vez criado, o sistema funcionará normalmente.