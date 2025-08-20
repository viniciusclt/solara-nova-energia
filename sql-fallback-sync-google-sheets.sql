-- Função SQL de fallback para sincronização com Google Sheets
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- 1. Criar função de fallback que simula a Edge Function
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

-- 2. Criar tabela de logs se não existir
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Conceder permissões
GRANT EXECUTE ON FUNCTION public.sync_google_sheets_fallback() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_google_sheets_fallback() TO anon;
GRANT ALL ON TABLE public.sync_logs TO authenticated;
GRANT SELECT ON TABLE public.sync_logs TO anon;

-- 4. Adicionar comentário
COMMENT ON FUNCTION public.sync_google_sheets_fallback() IS 'Função de fallback para sincronização com Google Sheets quando Edge Functions não estão disponíveis';

-- 5. Teste da função (opcional)
-- SELECT public.sync_google_sheets_fallback();

-- INSTRUÇÕES DE USO:
-- 1. Copie e cole este SQL no SQL Editor do Supabase Dashboard
-- 2. Execute o script completo
-- 3. A função estará disponível via API REST em:
--    POST https://seu-supabase-url/rest/v1/rpc/sync_google_sheets_fallback
-- 4. Para testar via curl:
--    curl -X POST 'https://seu-supabase-url/rest/v1/rpc/sync_google_sheets_fallback' \
--         -H 'apikey: sua-anon-key' \
--         -H 'Authorization: Bearer sua-anon-key' \
--         -H 'Content-Type: application/json'

-- NOTA: Esta é uma solução temporária até que as Edge Functions sejam configuradas corretamente