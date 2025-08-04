/**
 * Cliente Supabase Seguro
 * Configuração centralizada e segura para conexão com Supabase
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseConfig } from '../../config/environment';
import { logAuth, logError } from '../../utils/secureLogger';

// Obter configuração segura do ambiente
const config = getSupabaseConfig();

// Validar configuração
if (!config.url || !config.anonKey) {
  logError('Configuração do Supabase inválida', 'SupabaseClient');
  throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.');
}

logAuth('Inicializando cliente Supabase', 'SupabaseClient');

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'solara-nova-energia'
    }
  }
});

// Log de inicialização bem-sucedida
logAuth('Cliente Supabase inicializado com sucesso', 'SupabaseClient');