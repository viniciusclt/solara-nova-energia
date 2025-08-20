/**
 * Mapeadores para conversão entre tipos de Lead (UI ↔ DB)
 * Centraliza lógica de transformação de dados para evitar inconsistências
 */

import { Lead, Address } from '../../types';

// ===== TIPOS BASE =====

/**
 * Lead no formato do banco de dados (Supabase)
 * Colunas reais da tabela `leads`
 */
export interface DBLead {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cpf_cnpj?: string | null;
  rg?: string | null;
  birth_date?: string | null;
  
  // Endereço como JSON estruturado
  address?: any; // JSON object no Supabase
  
  // Dados de energia
  tipo_fornecimento?: string | null;
  cdd?: string | null;
  tensao_alimentacao?: string | null;
  modalidade_tarifaria?: string | null;
  numero_cliente?: string | null;
  numero_instalacao?: string | null;
  consumo_mensal?: any; // JSON array no Supabase
  consumo_medio?: number | null;
  incremento_consumo?: number | null;
  
  // Outros
  comentarios?: string | null;
  status?: string | null;
  user_id?: string | null;
  
  // Timestamps
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Lead no formato da UI (componentes React)
 * Tipos mais específicos e objetos estruturados
 */
export interface UILead extends Lead {
  address?: Address | string;
  consumo_mensal?: number[];
  consumo_medio?: number;
}

// ===== UTILITÁRIOS DE CONVERSÃO =====

/**
 * Normaliza endereço para o formato Address estruturado
 */
export const normalizeAddress = (address: any): Address | undefined => {
  if (!address) return undefined;
  
  if (typeof address === 'string') {
    return { street: address };
  }
  
  if (typeof address === 'object') {
    return {
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      cep: address.cep || address.zipCode || '',
      ...address
    };
  }
  
  return undefined;
};

/**
 * Normaliza consumo mensal para array de 12 posições
 */
export const normalizeMonthlyConsumption = (consumo_mensal: any): number[] => {
  if (Array.isArray(consumo_mensal)) {
    const normalized = consumo_mensal.slice(0, 12).map(val => Number(val) || 0);
    while (normalized.length < 12) {
      normalized.push(0);
    }
    return normalized;
  }
  
  return new Array(12).fill(0);
};

/**
 * Calcula consumo médio a partir do array de consumo mensal
 */
export const calculateAverageConsumption = (consumo_mensal: number[]): number => {
  if (!Array.isArray(consumo_mensal) || consumo_mensal.length === 0) {
    return 0;
  }
  
  const validValues = consumo_mensal.filter(val => typeof val === 'number' && val > 0);
  if (validValues.length === 0) return 0;
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / validValues.length) * 100) / 100;
};

// ===== MAPEADORES PRINCIPAIS =====

/**
 * Converte Lead da UI para formato do banco de dados
 */
export const toDBLead = (uiLead: UILead): DBLead => {
  const normalizedAddress = normalizeAddress(uiLead.address);
  const normalizedConsumption = normalizeMonthlyConsumption(uiLead.consumo_mensal);
  
  return {
    id: uiLead.id,
    name: uiLead.name,
    email: uiLead.email || null,
    phone: uiLead.phone || null,
    cpf_cnpj: uiLead.cpf_cnpj || null,
    rg: uiLead.rg || null,
    birth_date: uiLead.birth_date || null,
    
    // Endereço como JSON
    address: normalizedAddress || null,
    
    // Dados de energia
    tipo_fornecimento: uiLead.tipo_fornecimento || null,
    cdd: uiLead.cdd || null,
    tensao_alimentacao: uiLead.tensao_alimentacao || null,
    modalidade_tarifaria: uiLead.modalidade_tarifaria || null,
    numero_cliente: uiLead.numero_cliente || null,
    numero_instalacao: uiLead.numero_instalacao || null,
    consumo_mensal: normalizedConsumption,
    consumo_medio: uiLead.consumo_medio || calculateAverageConsumption(normalizedConsumption),
    incremento_consumo: uiLead.incremento_consumo || null,
    
    // Outros
    comentarios: uiLead.comentarios || null,
    status: uiLead.status || null,
    user_id: uiLead.user_id || null,
    
    // Timestamps
    created_at: uiLead.created_at || null,
    updated_at: uiLead.updated_at || null
  };
};

/**
 * Converte Lead do banco de dados para formato da UI
 */
export const fromDBLead = (dbLead: DBLead): UILead => {
  const normalizedAddress = normalizeAddress(dbLead.address);
  const normalizedConsumption = normalizeMonthlyConsumption(dbLead.consumo_mensal);
  
  return {
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email || undefined,
    phone: dbLead.phone || undefined,
    cpf_cnpj: dbLead.cpf_cnpj || undefined,
    rg: dbLead.rg || undefined,
    birth_date: dbLead.birth_date || undefined,
    
    // Endereço estruturado
    address: normalizedAddress,
    
    // Dados de energia
    tipo_fornecimento: dbLead.tipo_fornecimento || undefined,
    cdd: dbLead.cdd || undefined,
    tensao_alimentacao: dbLead.tensao_alimentacao || undefined,
    modalidade_tarifaria: dbLead.modalidade_tarifaria || undefined,
    numero_cliente: dbLead.numero_cliente || undefined,
    numero_instalacao: dbLead.numero_instalacao || undefined,
    consumo_mensal: normalizedConsumption,
    consumo_medio: dbLead.consumo_medio || calculateAverageConsumption(normalizedConsumption),
    incremento_consumo: dbLead.incremento_consumo || undefined,
    
    // Outros
    comentarios: dbLead.comentarios || undefined,
    status: dbLead.status || undefined,
    user_id: dbLead.user_id || undefined,
    
    // Timestamps
    created_at: dbLead.created_at || undefined,
    updated_at: dbLead.updated_at || undefined
  };
};

// ===== SANITIZAÇÃO =====

/**
 * Lista de campos permitidos na tabela leads do Supabase
 */
const ALLOWED_DB_FIELDS = [
  'id', 'name', 'email', 'phone', 'cpf_cnpj', 'rg', 'birth_date',
  'address', 'tipo_fornecimento', 'cdd', 'tensao_alimentacao',
  'modalidade_tarifaria', 'numero_cliente', 'numero_instalacao',
  'consumo_mensal', 'consumo_medio', 'incremento_consumo',
  'comentarios', 'status', 'user_id', 'created_at', 'updated_at'
] as const;

/**
 * Sanitiza payload para garantir que apenas campos válidos sejam enviados ao DB
 */
export const sanitizeDbLeadPayload = (payload: any): DBLead => {
  const sanitized: any = {};
  
  // Filtra apenas campos permitidos
  for (const field of ALLOWED_DB_FIELDS) {
    if (payload.hasOwnProperty(field)) {
      sanitized[field] = payload[field];
    }
  }
  
  // Remove valores undefined (Supabase não aceita)
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  
  // Normaliza campos específicos
  if (sanitized.address) {
    sanitized.address = normalizeAddress(sanitized.address);
  }
  
  if (sanitized.consumo_mensal) {
    sanitized.consumo_mensal = normalizeMonthlyConsumption(sanitized.consumo_mensal);
  }
  
  return sanitized as DBLead;
};

// ===== MAPEAMENTO PARA GOOGLE SHEETS =====

/**
 * Converte UILead para formato do Google Sheets
 * Mantém nomes legados por compatibilidade com planilhas antigas
 */
export const toGoogleSheetsLead = (uiLead: UILead): Record<string, any> => {
  const normalizedAddress = normalizeAddress(uiLead.address);
  const normalizedConsumption = normalizeMonthlyConsumption(uiLead.consumo_mensal);
  
  return {
    // Campos principais
    name: uiLead.name,
    email: uiLead.email || '',
    phone: uiLead.phone || '',
    cpf_cnpj: uiLead.cpf_cnpj || '',
    
    // Endereço (nomes legados para compatibilidade)
    street: normalizedAddress?.street || '',
    number: normalizedAddress?.number || '',
    complement: normalizedAddress?.complement || '',
    neighborhood: normalizedAddress?.neighborhood || '',
    city: normalizedAddress?.city || '',
    state: normalizedAddress?.state || '',
    zip_code: normalizedAddress?.cep || '', // Nome legado para sheets
    
    // Energia (nomes legados para compatibilidade)
    consumption_kwh: uiLead.consumo_medio || calculateAverageConsumption(normalizedConsumption), // Compatibilidade apenas para Google Sheets legados
    consumo_mensal: normalizedConsumption,
    
    // Outros
    status: uiLead.status || '',
    created_at: uiLead.created_at || '',
    updated_at: uiLead.updated_at || ''
  };
};

/**
 * Exportações para uso externo
 */
export {
  type DBLead,
  type UILead
};