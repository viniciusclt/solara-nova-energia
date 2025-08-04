# 🔧 Guia de Configuração do Supabase

## ❌ Problema Identificado

O erro `net::ERR_INVALID_REDIRECT` ocorre porque:
- A URL configurada (`http://31.97.91.234:8000`) **NÃO é um servidor Supabase**
- É uma aplicação web comum (provavelmente Laravel) que retorna HTML
- O Supabase espera endpoints REST específicos (`/auth/v1/`, `/rest/v1/`, etc.)

## ✅ Soluções Disponíveis

### 1. 🌐 Supabase na Nuvem (RECOMENDADO)

**Passos:**
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a URL e a chave anon do projeto
5. Atualize o arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 2. 🐳 Supabase Local (Docker)

**Pré-requisitos:**
- Docker Desktop instalado e rodando
- Executar PowerShell como Administrador

**Comandos:**
```bash
# Inicializar Supabase local
npx supabase init

# Iniciar serviços locais
npx supabase start

# Aplicar migrações
npx supabase db push
```

**Configuração `.env` para local:**
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=chave-local-gerada
```

### 3. 🔧 Configuração Manual do Servidor

Se você tem controle sobre o servidor `31.97.91.234:8000`:
1. Instalar Supabase self-hosted
2. Configurar PostgreSQL + PostgREST + GoTrue
3. Expor nas portas corretas

## 🚀 Solução Rápida (Recomendada)

**Para resolver imediatamente:**

1. **Criar projeto Supabase gratuito:**
   - Vá para [supabase.com](https://supabase.com)
   - Clique em "Start your project"
   - Crie uma conta
   - Crie um novo projeto

2. **Copiar credenciais:**
   - Vá em Settings > API
   - Copie a "Project URL" e "anon public key"

3. **Atualizar `.env`:**
   ```env
   VITE_SUPABASE_URL=https://sua-url.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```

4. **Aplicar migrações:**
   ```bash
   npx supabase db push --db-url "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
   ```

## 📋 Checklist de Verificação

- [ ] URL termina com `.supabase.co` ou é `localhost:54321`
- [ ] Chave anon é uma string longa (JWT)
- [ ] Endpoints `/auth/v1/` e `/rest/v1/` respondem JSON
- [ ] Migrações aplicadas no banco
- [ ] RLS (Row Level Security) configurado

## 🔍 Teste de Conectividade

Após configurar, teste com:
```bash
node test-supabase-endpoints.js
```

## 💡 Dicas

- **Desenvolvimento:** Use Supabase na nuvem (mais fácil)
- **Produção:** Configure self-hosted se necessário
- **Time:** Compartilhe o mesmo projeto Supabase
- **Backup:** Sempre exporte o schema antes de mudanças

---

**Status Atual:** ❌ Configuração inválida  
**Próximo Passo:** Configurar Supabase na nuvem ou local