/**
 * Configuração de Ambiente Segura
 * Centraliza o gerenciamento de variáveis de ambiente e configurações sensíveis
 */

import { logWarn, logError, logInfo } from '../utils/secureLogger';
import { environmentValidator } from './environmentValidator';

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    environment: 'development' | 'staging' | 'production';
    version: string;
    debugMode: boolean;
  };
  features: {
    enableOCR: boolean;
    enableFinancialIntegration: boolean;
    enableGoogleSheets: boolean;
    enableAuditLogs: boolean;
  };
  security: {
    enableSecureLogging: boolean;
    maskSensitiveData: boolean;
    logRetentionDays: number;
  };
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  private isInitialized = false;

  private constructor() {
    this.config = this.loadConfiguration();
    
    // Validar ambiente na inicialização
    if (import.meta.env.DEV) {
      const validation = environmentValidator.validateEnvironment();
      if (!validation.isValid) {
        logError('Configuração de ambiente inválida detectada', 'EnvironmentManager');
      }
    }
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    // Detectar ambiente
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    const isStaging = import.meta.env.MODE === 'staging';
    const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';

    let environment: 'development' | 'staging' | 'production' = 'development';
    if (isProd) environment = 'production';
    else if (isStaging) environment = 'staging';

    // Validar variáveis obrigatórias
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logError('Variáveis de ambiente do Supabase não configuradas', 'EnvironmentManager');
      
      // Fallback para desenvolvimento (se existir configuração local)
      if (isDev) {
        logWarn('Usando configuração de fallback para desenvolvimento', 'EnvironmentManager');
      } else {
        throw new Error('Configuração de ambiente inválida para produção');
      }
    }

    return {
      supabase: {
        url: supabaseUrl || 'http://localhost:54321',
        anonKey: supabaseAnonKey || 'fallback-key-for-dev'
      },
      app: {
        environment,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        debugMode: isDev
      },
      features: {
        enableOCR: import.meta.env.VITE_ENABLE_OCR !== 'false',
        enableFinancialIntegration: import.meta.env.VITE_ENABLE_FINANCIAL !== 'false',
        enableGoogleSheets: import.meta.env.VITE_ENABLE_GOOGLE_SHEETS !== 'false',
        enableAuditLogs: import.meta.env.VITE_ENABLE_AUDIT_LOGS !== 'false'
      },
      security: {
        enableSecureLogging: environment !== 'development',
        maskSensitiveData: environment === 'production',
        logRetentionDays: parseInt(import.meta.env.VITE_LOG_RETENTION_DAYS || '30')
      }
    };
  }

  /**
   * Obtém configuração do Supabase de forma segura
   */
  public getSupabaseConfig() {
    return {
      url: this.config.supabase.url,
      anonKey: this.config.supabase.anonKey
    };
  }

  /**
   * Verifica se uma feature está habilitada
   */
  public isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Obtém configuração da aplicação
   */
  public getAppConfig() {
    return this.config.app;
  }

  /**
   * Obtém configuração de segurança
   */
  public getSecurityConfig() {
    return this.config.security;
  }

  /**
   * Verifica se está em ambiente de desenvolvimento
   */
  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  /**
   * Verifica se está em ambiente de produção
   */
  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  /**
   * Verifica se está em ambiente de staging
   */
  public isStaging(): boolean {
    return this.config.app.environment === 'staging';
  }

  /**
   * Valida configuração atual
   */
  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar Supabase
    if (!this.config.supabase.url || this.config.supabase.url === 'fallback-key-for-dev') {
      errors.push('URL do Supabase não configurada');
    }

    if (!this.config.supabase.anonKey || this.config.supabase.anonKey === 'fallback-key-for-dev') {
      errors.push('Chave anônima do Supabase não configurada');
    }

    // Validar ambiente de produção
    if (this.isProduction()) {
      if (this.config.app.debugMode) {
        errors.push('Modo debug não deve estar ativo em produção');
      }

      if (!this.config.security.enableSecureLogging) {
        errors.push('Logging seguro deve estar ativo em produção');
      }

      if (!this.config.security.maskSensitiveData) {
        errors.push('Mascaramento de dados sensíveis deve estar ativo em produção');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtém informações de ambiente para debug (dados mascarados)
   */
  public getEnvironmentInfo() {
    return {
      environment: this.config.app.environment,
      version: this.config.app.version,
      features: this.config.features,
      security: {
        secureLogging: this.config.security.enableSecureLogging,
        dataMasking: this.config.security.maskSensitiveData
      },
      supabase: {
        configured: !!(this.config.supabase.url && this.config.supabase.anonKey),
        url: this.config.supabase.url ? '****' : 'not configured'
      }
    };
  }
}

// Instância singleton
export const environmentManager = EnvironmentManager.getInstance();

// Funções de conveniência
export const getSupabaseConfig = () => environmentManager.getSupabaseConfig();
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']) => 
  environmentManager.isFeatureEnabled(feature);
export const isDevelopment = () => environmentManager.isDevelopment();
export const isProduction = () => environmentManager.isProduction();
export const isStaging = () => environmentManager.isStaging();
export const getAppConfig = () => environmentManager.getAppConfig();
export const getSecurityConfig = () => environmentManager.getSecurityConfig();
export const validateEnvironment = () => environmentManager.validateConfiguration();
export const getEnvironmentInfo = () => environmentManager.getEnvironmentInfo();

// Validação inicial
const validation = validateEnvironment();
if (!validation.isValid && isProduction()) {
  logError('Configuração de ambiente inválida para produção', 'EnvironmentManager', {
    errors: validation.errors
  });
  throw new Error('Configuração de ambiente inválida');
} else if (!validation.isValid) {
  logWarn('Problemas na configuração de ambiente detectados', 'EnvironmentManager', {
    errors: validation.errors
  });
}