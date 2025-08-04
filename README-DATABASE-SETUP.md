# 🗄️ Configuração Completa do Banco de Dados Supabase

## 📋 Status da Verificação

✅ **Conectividade Supabase**: Funcionando perfeitamente  
⚠️ **Tabelas do Sistema**: Precisam ser criadas  
⚠️ **Usuário Super Admin**: Precisa ser criado manualmente  
⚠️ **Empresa Cactos**: Será criada automaticamente  

## 🚀 Opções de Configuração

### 🎯 OPÇÃO 1: Configuração Automática (Recomendada)

**Pré-requisitos:**
1. Configure a variável `SUPABASE_SERVICE_ROLE_KEY` no seu `.env`
2. A chave pode ser encontrada em: **Supabase Dashboard > Settings > API > service_role**

**Execução:**
```bash
# 1. Configurar banco de dados automaticamente
node automated-database-setup.js

# 2. Criar usuário Super Admin (opcional - senha automática)
node automated-database-setup.js --create-user

# 3. Ou criar com senha específica
node automated-database-setup.js --create-user MinhaSenh@123

# 4. Atualizar perfil para Super Admin (use o UUID retornado)
node update-super-admin.js [UUID_DO_USUARIO]
```

### 🎯 OPÇÃO 2: Configuração Manual via Dashboard

**Arquivo**: `complete-database-setup.sql`

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Cole e execute o conteúdo completo do arquivo `complete-database-setup.sql`
4. Aguarde a execução (pode levar alguns minutos)

**O que este script faz:**
- ✅ Cria todos os ENUMs necessários
- ✅ Cria todas as tabelas principais (companies, profiles, subscriptions, audit_logs)
- ✅ Cria todas as tabelas adicionais (notifications, instituicoes_financeiras, etc.)
- ✅ Configura Row Level Security (RLS) e políticas
- ✅ Cria funções e triggers automáticos
- ✅ Insere a empresa "Cactos - Soluções em Energia"
- ✅ Cria assinatura ativa e gratuita para a empresa
- ✅ Executa verificações finais

### 2️⃣ Criar Usuário Super Admin Vinícius

**IMPORTANTE**: Este passo deve ser feito manualmente no Supabase Dashboard

1. **Acesse Authentication > Users**
2. **Clique em "Add user"**
3. **Preencha os dados:**
   - **Email**: `vinicius@energiacactos.com.br`
   - **Password**: [escolha uma senha segura]
   - **Email Confirm**: ✅ true
4. **Clique em "Add user"**
5. **Copie o UUID** do usuário criado

### 3️⃣ Atualizar Perfil do Usuário

**Após criar o usuário**, execute este SQL no **SQL Editor**:

```sql
-- Substitua 'USER_UUID_AQUI' pelo UUID real do usuário criado
UPDATE public.profiles SET 
  name = 'Vinícius',
  access_type = 'super_admin'::user_access_type,
  company_id = (
    SELECT id FROM public.companies 
    WHERE cnpj = '00.000.000/0001-00' 
    LIMIT 1
  ),
  updated_at = now()
WHERE id = 'USER_UUID_AQUI';

-- Verificar se foi atualizado corretamente
SELECT 
  p.id,
  p.name,
  p.email,
  p.access_type,
  c.name as company_name,
  c.cnpj
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.email = 'vinicius@energiacactos.com.br';
```

### 4️⃣ Verificação Final

Execute este SQL para verificar se tudo está configurado:

```sql
-- Verificar todas as tabelas
SELECT 
  'TABELAS DO SISTEMA:' as categoria,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar empresa Cactos
SELECT 
  'EMPRESA CACTOS:' as categoria,
  name,
  cnpj,
  num_employees
FROM public.companies 
WHERE cnpj = '00.000.000/0001-00';

-- Verificar usuário Super Admin
SELECT 
  'SUPER ADMIN VINÍCIUS:' as categoria,
  p.name,
  p.email,
  p.access_type,
  c.name as empresa
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.email = 'vinicius@energiacactos.com.br';

-- Verificar assinatura
SELECT 
  'ASSINATURA CACTOS:' as categoria,
  s.status,
  s.is_free,
  s.authorized_employees,
  s.start_date,
  s.end_date
FROM public.subscriptions s
JOIN public.companies c ON s.company_id = c.id
WHERE c.cnpj = '00.000.000/0001-00';
```

## 📊 Tabelas Criadas

### 🏢 Tabelas Principais
- **companies** - Empresas do sistema
- **profiles** - Perfis de usuários (estende auth.users)
- **subscriptions** - Assinaturas das empresas
- **audit_logs** - Logs de auditoria

### 🔧 Tabelas Funcionais
- **notifications** - Sistema de notificações
- **instituicoes_financeiras** - Instituições financeiras
- **financial_kits** - Kits financeiros
- **shared_proposals** - Propostas compartilhadas
- **solar_modules** - Catálogo de módulos solares
- **inverters** - Catálogo de inversores

## 🔐 Configurações de Segurança

### Row Level Security (RLS)
- ✅ Habilitado em todas as tabelas
- ✅ Políticas configuradas por tipo de usuário
- ✅ Isolamento por empresa (company_id)
- ✅ Permissões especiais para super_admin

### Tipos de Acesso
- **vendedor** - Acesso básico
- **engenheiro** - Acesso técnico
- **admin** - Administrador da empresa
- **super_admin** - Administrador global

## 🎯 Empresa Cactos

**Dados configurados:**
- **Nome**: Cactos - Soluções em Energia
- **CNPJ**: 00.000.000/0001-00
- **Funcionários**: 10
- **Assinatura**: Ativa e Gratuita
- **Usuários autorizados**: 50
- **Validade**: 1 ano

## 🔄 Funções Automáticas

### Triggers Configurados
- **handle_new_user()** - Cria perfil automaticamente para novos usuários
- **update_updated_at_column()** - Atualiza timestamps automaticamente

### Políticas RLS
- Usuários só veem dados da própria empresa
- Super admins têm acesso global
- Admins podem gerenciar usuários da empresa

## 📝 Arquivos de Configuração

### 🤖 Scripts Automáticos
1. **`automated-database-setup.js`** - Configuração automática completa
2. **`update-super-admin.js`** - Atualização automática do Super Admin

### 📄 Scripts SQL Manuais
3. **`complete-database-setup.sql`** - Script SQL principal completo
4. **`setup-super-admin.sql`** - Script específico para Super Admin

### 📚 Documentação
5. **`README-DATABASE-SETUP.md`** - Esta documentação

## 🔄 Comparação dos Métodos

| Aspecto | Automático | Manual |
|---------|------------|--------|
| **Velocidade** | ⚡ Rápido (2-3 comandos) | 🐌 Lento (múltiplos passos) |
| **Facilidade** | 😊 Muito fácil | 😐 Moderado |
| **Controle** | 🤖 Automatizado | 👤 Total controle |
| **Erros** | 🛡️ Tratamento automático | ⚠️ Requer atenção manual |
| **Pré-requisitos** | 🔑 Service Role Key | 🌐 Apenas Dashboard |
| **Recomendado para** | 🚀 Desenvolvimento/Produção | 🎓 Aprendizado/Debug |

## ⚡ Scripts de Teste

### Verificação Automática
```bash
node verify-database-setup.js
```

### Teste de Conectividade
```bash
node test-supabase-connection.js
```

## 🚨 Troubleshooting

### Erro JWSError
- **Causa**: Tabelas não criadas ou RLS mal configurado
- **Solução**: Execute `complete-database-setup.sql`

### Usuário não encontrado
- **Causa**: Usuário não criado no Authentication
- **Solução**: Crie manualmente no Dashboard

### Permissões negadas
- **Causa**: RLS bloqueando acesso
- **Solução**: Verifique políticas e company_id

## ✅ Checklist Final

- [ ] Script `complete-database-setup.sql` executado com sucesso
- [ ] Todas as tabelas criadas (10 tabelas principais)
- [ ] Empresa Cactos criada com CNPJ 00.000.000/0001-00
- [ ] Assinatura ativa criada para Cactos
- [ ] Usuário Vinícius criado no Authentication
- [ ] Perfil do Vinícius atualizado para super_admin
- [ ] Vinícius associado à empresa Cactos
- [ ] Verificação final executada com sucesso
- [ ] Login do Vinícius testado na aplicação

## 🎉 Próximos Passos

Após completar toda a configuração:

1. **Teste o login** com vinicius@energiacactos.com.br
2. **Verifique as permissões** de super admin
3. **Crie outros usuários** conforme necessário
4. **Configure dados adicionais** (módulos, inversores, etc.)
5. **Importe dados** de instituições financeiras

---

**Status**: ⚠️ Configuração pendente  
**Última atualização**: Janeiro 2025  
**Responsável**: Sistema Solara Nova Energia