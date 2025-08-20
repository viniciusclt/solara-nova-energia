# 📋 Instruções para Atualizar Função SQL de Fallback

## 🎯 Problema Identificado
A função SQL de fallback está retornando apenas **5 leads importados** quando deveria simular **8 leads** (como no DemoDataService).

## 🔧 Solução
Atualizar a função `sync_google_sheets_fallback` no Supabase para simular corretamente 8 leads de demonstração.

## 📝 Passos para Atualização

### 1. Acessar o Supabase Dashboard
- Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Faça login na sua conta
- Selecione o projeto da aplicação

### 2. Abrir o SQL Editor
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"** para criar uma nova consulta

### 3. Executar o Script Atualizado
Copie e cole o conteúdo completo do arquivo `sql-fallback-sync-google-sheets.sql` no editor SQL.

**OU** copie o SQL abaixo:

```sql
-- Função SQL de fallback para sincronização com Google Sheets (ATUALIZADA)
CREATE OR REPLACE FUNCTION public.sync_google_sheets_fallback()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    leads_count integer;
    simulated_imports integer;
    sheets_status text;
BEGIN
    -- Verificar se há leads na tabela
    SELECT COUNT(*) INTO leads_count FROM public.leads;
    
    -- Simular importação de leads de demonstração (8 leads como no DemoDataService)
    simulated_imports := 8;
    
    -- Simular status da sincronização sempre como sucesso com dados de demonstração
    sheets_status := 'success';
    result := json_build_object(
        'status', 'success',
        'message', 'Sincronização simulada com sucesso - dados de demonstração',
        'leads_count', leads_count,
        'simulated_imports', simulated_imports,
        'demo_leads', json_build_array(
            'João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa',
            'Roberto Ferreira', 'Pedro Google', 'Fernanda Ads', 'Lucas Campaign'
        ),
        'timestamp', NOW(),
        'note', 'Edge Functions não disponível - usando fallback SQL com dados demo'
    );
    
    -- Log da operação
    INSERT INTO public.sync_logs (operation, status, details, created_at)
    VALUES (
        'google_sheets_sync_fallback',
        sheets_status,
        result::text,
        NOW()
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar informação do erro
        result := json_build_object(
            'status', 'error',
            'message', 'Erro na sincronização: ' || SQLERRM,
            'timestamp', NOW(),
            'note', 'Edge Functions não disponível - usando fallback SQL'
        );
        
        -- Log do erro
        INSERT INTO public.sync_logs (operation, status, details, created_at)
        VALUES (
            'google_sheets_sync_fallback',
            'error',
            result::text,
            NOW()
        );
        
        RETURN result;
END;
$$;
```

### 4. Executar a Query
- Clique no botão **"Run"** ou pressione `Ctrl + Enter`
- Aguarde a confirmação de que a função foi atualizada com sucesso

### 5. Testar a Atualização
Após executar o SQL, você pode testar executando:
```sql
SELECT public.sync_google_sheets_fallback();
```

## ✅ Resultado Esperado
Após a atualização, a função deve retornar:
- `simulated_imports`: 8
- `demo_leads`: Array com 8 nomes de leads
- `message`: "Sincronização simulada com sucesso - dados de demonstração"

## 🧪 Verificação
Para verificar se a atualização funcionou:
1. Execute o comando: `node test-sql-fallback-updated.cjs`
2. Ou teste diretamente na aplicação clicando em "Sincronizar Agora"
3. Deve mostrar **"8 leads importados"** ao invés de 5

## 📱 Impacto na Aplicação
Após a atualização:
- ✅ A sincronização mostrará "8 leads importados"
- ✅ A mensagem será mais clara sobre dados de demonstração
- ✅ Os logs incluirão os nomes dos leads simulados
- ✅ A experiência do usuário será mais realista

---

**Nota**: Esta é uma solução temporária até que as Edge Functions sejam configuradas corretamente no ambiente de produção.