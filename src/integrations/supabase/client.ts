/**
 * Cliente Mock Supabase
 * Substituição local para evitar conexões remotas
 */
import { mockSupabase } from '../../services/mockSupabaseService';
import { logAuth } from '../../utils/secureLogger';

logAuth('Inicializando cliente Mock Supabase (modo local)', 'MockSupabaseClient');

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Exportar o mock como se fosse o cliente real
export const supabase = mockSupabase;

// Log de inicialização bem-sucedida
logAuth('Cliente Mock Supabase inicializado com sucesso', 'MockSupabaseClient');

// Manter compatibilidade com código existente
export default supabase;

// Função para verificar se está usando banco local
export const isUsingLocalDatabase = () => true;

// Função para forçar uso do banco local
export const switchToLocalDatabase = async () => {
  // Já está usando mock local
};