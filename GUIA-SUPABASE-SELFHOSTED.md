# 🚀 Guia Completo: Configuração do Supabase Self-Hosted

## 📋 Análise da Documentação

Baseado na documentação oficial do Supabase self-hosted, existem várias formas de configurar o banco de dados diretamente da aplicação:

### 🔗 Métodos de Conexão Disponíveis

#### 1. **Conexão Direta PostgreSQL** (Recomendada)
```bash
# Porta 5432 - Conexão direta ao PostgreSQL
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

#### 2. **Supavisor Session Mode** (IPv4/IPv6)
```bash
# Porta 5432 - Para clientes persistentes
postgres://postgres.[TENANT_ID]:[PASSWORD]@[HOST]:5432/postgres
```

#### 3. **Supavisor Transaction Mode** (Serverless)
```bash
# Porta 6543 - Para funções serverless/edge
postgres://postgres.[TENANT_ID]:[PASSWORD]@[HOST]:6543/postgres
```

## 🛠️ Configuração Automática vs Manual

### ✅ **OPÇÃO 1: Configuração Automática (Scripts Node.js)**

Criamos scripts automatizados que conectam diretamente ao PostgreSQL:

#### Scripts Disponíveis:
1. **`execute-training-setup.js`** - Executa o SQL completo automaticamente
2. **`test-supabase-connection.js`** - Testa diferentes configurações de conexão

#### Como Executar:
```bash
# Teste de conexão primeiro
node test-supabase-connection.js

# Execução do setup completo
node execute-training-setup.js
```

### 🔧 **OPÇÃO 2: Configuração Manual (Interface Web)**

Se os scripts automatizados não funcionarem, use a interface web:

#### Passos:
1. Acesse seu Supabase Dashboard: `https://[SEU-DOMINIO]:8000`
2. Vá para **SQL Editor**
3. Execute o arquivo: `training-module-setup.sql`

## 🔍 Diagnóstico de Problemas

### Problema: Scripts não executam completamente

**Possíveis Causas:**
1. **Senha do PostgreSQL incorreta**
2. **Porta bloqueada ou inacessível**
3. **Configuração SSL/TLS**
4. **Firewall bloqueando conexão**

### 🔧 Soluções Baseadas na Documentação:

#### 1. **Verificar Status do Supabase**
```bash
# No diretório do docker-compose
docker compose ps
```

#### 2. **Verificar Logs do PostgreSQL**
```bash
docker compose logs db
```

#### 3. **Testar Conexão Manual**
```bash
# Teste com psql (se disponível)
psql 'postgres://postgres:[PASSWORD]@[HOST]:5432/postgres'
```

#### 4. **Configurações de Senha Padrão**

Segundo a documentação, a senha padrão é:
```
your-super-secret-and-long-postgres-password
```

## 📝 Configuração de Variáveis de Ambiente

### Arquivo `.env` - Configurações Necessárias:

```env
# Supabase Self-Hosted
SUPABASE_URL=https://[SEU-DOMINIO]
SUPABASE_ANON_KEY=[SUA-CHAVE-ANON]
SUPABASE_SERVICE_ROLE_KEY=[SUA-CHAVE-SERVICE]

# PostgreSQL (Opcional - para conexão direta)
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
POSTGRES_HOST=[SEU-DOMINIO]
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
```

## 🔐 Configuração de Segurança

### Row Level Security (RLS)

O SQL inclui configuração completa de RLS:
- ✅ Políticas para usuários autenticados
- ✅ Políticas para administradores
- ✅ Isolamento de dados por usuário
- ✅ Permissões para roles `anon` e `authenticated`

### Permissões Básicas
```sql
-- Já incluído no SQL
GRANT SELECT ON training_modules TO anon, authenticated;
GRANT ALL ON user_training_progress TO authenticated;
```

## 📊 Verificação Pós-Configuração

### 1. **Verificar Tabelas Criadas**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'training_%';
```

### 2. **Verificar Permissões**
```sql
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated');
```

### 3. **Testar Dados de Exemplo**
```sql
SELECT COUNT(*) FROM training_modules;
SELECT COUNT(*) FROM training_content;
```

## 🚀 Próximos Passos

### Após Configuração Bem-Sucedida:

1. **✅ Teste a aplicação frontend**
   - Acesse o módulo de treinamentos
   - Verifique se os dados aparecem

2. **✅ Configure usuários administrativos**
   - Crie usuários com role 'admin'
   - Teste permissões de administração

3. **✅ Adicione conteúdo real**
   - Substitua dados de exemplo
   - Configure módulos específicos

## 📚 Referências da Documentação

- **Conexão PostgreSQL**: [Supabase Self-Hosting Docker](https://supabase.com/docs/guides/self-hosting/docker#accessing-postgres)
- **Connection Strings**: [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- **Configuração SSL**: [Edge Functions Postgres](https://supabase.com/docs/guides/functions/connect-to-postgres)

## 🔄 Alternativas de Implementação

### Se a Conexão Direta Falhar:

1. **Use a Interface Web** (100% confiável)
2. **Configure via Docker** (para ambientes containerizados)
3. **Use Supabase CLI** (se disponível)

### Comando Docker Alternativo:
```bash
# Executar SQL via Docker
docker exec -i [CONTAINER_NAME] psql -U postgres -d postgres < training-module-setup.sql
```

---

## 💡 Resumo Executivo

**✅ O que foi criado:**
- Scripts automatizados para conexão direta
- SQL completo com RLS e permissões
- Guia de troubleshooting baseado na documentação
- Múltiplas opções de configuração

**🎯 Recomendação:**
1. Tente primeiro os scripts automatizados
2. Se falharem, use a interface web do Supabase
3. Verifique sempre as permissões após a configuração

**⏱️ Tempo estimado:** 5-15 minutos (dependendo do método escolhido)