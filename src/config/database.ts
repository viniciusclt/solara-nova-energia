// =====================================================
// CONFIGURAÇÃO DE BANCO DE DADOS
// Permite alternar entre Supabase e banco local
// =====================================================

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// CONFIGURAÇÃO DO AMBIENTE
// =====================================================

// Por enquanto, sempre usar Supabase no browser
// O banco local será usado apenas em scripts de servidor
const USE_LOCAL_DATABASE = false;

// =====================================================
// CLIENTE DE BANCO DE DADOS
// =====================================================

/**
 * Cliente de banco de dados
 * Por enquanto sempre usa Supabase no frontend
 * O banco local está disponível para scripts de servidor
 */
export const dbClient = supabase;

// =====================================================
// UTILITÁRIOS DE CONFIGURAÇÃO
// =====================================================

/**
 * Verifica se está usando banco local
 */
export const isUsingLocalDatabase = (): boolean => {
  return USE_LOCAL_DATABASE;
};

/**
 * Obtém informações sobre a configuração atual
 */
export const getDatabaseConfig = () => {
  return {
    type: USE_LOCAL_DATABASE ? 'local' : 'supabase',
    isLocal: USE_LOCAL_DATABASE,
    isSupabase: !USE_LOCAL_DATABASE,
    environment: process.env.NODE_ENV || 'development'
  };
};

/**
 * Log da configuração atual (apenas em desenvolvimento)
 */
if (process.env.NODE_ENV === 'development') {
  const config = getDatabaseConfig();
  console.log('🗄️ Database Configuration:', config);
  
  if (config.isLocal) {
    console.log('📱 Using LOCAL SQLite database');
    console.log('💡 To use Supabase, set VITE_USE_LOCAL_DB=false in .env');
  } else {
    console.log('☁️ Using SUPABASE database');
    console.log('💡 To use local database, set VITE_USE_LOCAL_DB=true in .env');
  }
}

// =====================================================
// EXPORTAÇÕES PARA COMPATIBILIDADE
// =====================================================

// Exportar como supabase para manter compatibilidade com código existente
export { dbClient as supabase };
export default dbClient;