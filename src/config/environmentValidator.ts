/**
 * Validador de Ambiente
 * Valida se todas as variáveis de ambiente necessárias estão configuradas
 */

import { logError, logWarn, logInfo } from '../utils/secureLogger';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvironmentRequirements {
  required: string[];
  optional: string[];
  production: string[];
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private requirements: EnvironmentRequirements;

  private constructor() {
    this.requirements = {
      required: [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
      ],
      optional: [
        'VITE_APP_VERSION',
        'VITE_GOOGLE_API_KEY',
        'VITE_OCR_API_KEY',
        'VITE_LOG_RETENTION_DAYS'
      ],
      production: [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_APP_VERSION',
        'VITE_ENABLE_SECURE_LOGGING',
        'VITE_MASK_SENSITIVE_DATA'
      ]
    };
  }

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Valida todas as variáveis de ambiente
   */
  public validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const isProduction = import.meta.env.PROD;

    // Validar variáveis obrigatórias
    for (const variable of this.requirements.required) {
      if (!this.getEnvVariable(variable)) {
        errors.push(`Variável obrigatória não configurada: ${variable}`);
      }
    }

    // Validar variáveis específicas de produção
    if (isProduction) {
      for (const variable of this.requirements.production) {
        if (!this.getEnvVariable(variable)) {
          errors.push(`Variável obrigatória para produção não configurada: ${variable}`);
        }
      }
    }

    // Verificar configurações de segurança
    this.validateSecuritySettings(errors, warnings, isProduction);

    // Verificar URLs válidas
    this.validateUrls(errors, warnings);

    // Verificar configurações de desenvolvimento
    if (!isProduction) {
      this.validateDevelopmentSettings(warnings);
    }

    const isValid = errors.length === 0;

    // Log dos resultados
    if (isValid) {
      logInfo('Validação de ambiente concluída com sucesso', 'EnvironmentValidator');
    } else {
      logError(`Validação de ambiente falhou: ${errors.join(', ')}`, 'EnvironmentValidator');
    }

    if (warnings.length > 0) {
      logWarn(`Avisos de ambiente: ${warnings.join(', ')}`, 'EnvironmentValidator');
    }

    return { isValid, errors, warnings };
  }

  /**
   * Valida configurações de segurança
   */
  private validateSecuritySettings(errors: string[], warnings: string[], isProduction: boolean): void {
    const supabaseUrl = this.getEnvVariable('VITE_SUPABASE_URL');
    const supabaseKey = this.getEnvVariable('VITE_SUPABASE_ANON_KEY');

    // Verificar se não são valores de exemplo
    if (supabaseUrl && (supabaseUrl.includes('your-project') || supabaseUrl.includes('example'))) {
      errors.push('URL do Supabase ainda está com valor de exemplo');
    }

    if (supabaseKey && (supabaseKey.includes('your-') || supabaseKey.includes('example'))) {
      errors.push('Chave do Supabase ainda está com valor de exemplo');
    }

    // Verificar configurações de produção
    if (isProduction) {
      const debugMode = this.getEnvVariable('VITE_DEBUG_MODE');
      if (debugMode === 'true') {
        warnings.push('Modo debug está ativo em produção');
      }

      const mockData = this.getEnvVariable('VITE_ENABLE_MOCK_DATA');
      if (mockData === 'true') {
        errors.push('Dados mock estão habilitados em produção');
      }
    }
  }

  /**
   * Valida URLs
   */
  private validateUrls(errors: string[], warnings: string[]): void {
    const supabaseUrl = this.getEnvVariable('VITE_SUPABASE_URL');
    
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl);
        // Aceitar URLs oficiais do Supabase, localhost e IPs para self-hosted
        const isValidHost = 
          url.hostname.includes('supabase.co') || 
          url.hostname.includes('localhost') ||
          url.hostname === '127.0.0.1' ||
          /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname); // IP válido
        
        if (!isValidHost) {
          warnings.push('URL do Supabase não parece ser válida');
        }
      } catch {
        errors.push('URL do Supabase tem formato inválido');
      }
    }
  }

  /**
   * Valida configurações de desenvolvimento
   */
  private validateDevelopmentSettings(warnings: string[]): void {
    const hasGoogleKey = this.getEnvVariable('VITE_GOOGLE_API_KEY');
    if (!hasGoogleKey) {
      warnings.push('Google API Key não configurada (opcional) - funcionalidades do Google Sheets indisponíveis');
    }

    const hasOcrKey = this.getEnvVariable('VITE_OCR_API_KEY');
    if (!hasOcrKey) {
      warnings.push('OCR API Key não configurada (opcional) - usando Tesseract.js local');
    }
  }

  /**
   * Obtém variável de ambiente de forma segura
   */
  private getEnvVariable(name: string): string | undefined {
    return import.meta.env[name];
  }

  /**
   * Gera relatório de ambiente para debug
   */
  public generateEnvironmentReport(): object {
    const isProduction = import.meta.env.PROD;
    const report = {
      environment: import.meta.env.MODE || 'development',
      isProduction,
      timestamp: new Date().toISOString(),
      variables: {
        configured: [] as string[],
        missing: [] as string[],
        optional: [] as string[]
      }
    };

    // Verificar variáveis obrigatórias
    for (const variable of this.requirements.required) {
      if (this.getEnvVariable(variable)) {
        report.variables.configured.push(variable);
      } else {
        report.variables.missing.push(variable);
      }
    }

    // Verificar variáveis opcionais
    for (const variable of this.requirements.optional) {
      if (this.getEnvVariable(variable)) {
        report.variables.configured.push(variable);
      } else {
        report.variables.optional.push(variable);
      }
    }

    return report;
  }

  /**
   * Verifica se o ambiente está pronto para produção
   */
  public isProductionReady(): boolean {
    const validation = this.validateEnvironment();
    const isProduction = import.meta.env.PROD;
    
    if (!isProduction) {
      return true; // Desenvolvimento sempre está "pronto"
    }

    return validation.isValid && validation.errors.length === 0;
  }
}

// Instância singleton
export const environmentValidator = EnvironmentValidator.getInstance();

// Funções de conveniência
export const validateEnvironment = () => environmentValidator.validateEnvironment();
export const isProductionReady = () => environmentValidator.isProductionReady();
export const generateEnvironmentReport = () => environmentValidator.generateEnvironmentReport();

// Validação automática na inicialização (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('⚠️ Problemas de configuração detectados:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.info('ℹ️ Avisos de configuração:', validation.warnings);
  }
}