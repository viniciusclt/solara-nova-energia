/**
 * Sistema de Logger Seguro
 * Evita vazamento de informações sensíveis em logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

class SecureLogger {
  private static instance: SecureLogger;
  private isDevelopment: boolean;
  private sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'apikey', 'api_key',
    'authorization', 'auth', 'credential', 'private', 'confidential'
  ];

  private constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  public static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  /**
   * Mascara dados sensíveis em objetos
   */
  private maskSensitiveData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Mascarar strings que parecem ser tokens/chaves
      if (data.length > 20 && /^[a-zA-Z0-9+/=_-]+$/.test(data)) {
        return `${data.substring(0, 4)}****${data.substring(data.length - 4)}`;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    if (data && typeof data === 'object') {
      const masked: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = this.sensitiveKeys.some(sensitiveKey => 
          lowerKey.includes(sensitiveKey)
        );

        if (isSensitive) {
          masked[key] = '****';
        } else {
          masked[key] = this.maskSensitiveData(value);
        }
      }
      
      return masked;
    }

    return data;
  }

  /**
   * Cria entrada de log formatada
   */
  private createLogEntry(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data: data ? this.maskSensitiveData(data) : undefined
    };
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  public debug(message: string, context?: string, data?: unknown): void {
    if (!this.isDevelopment) return;
    
    const entry = this.createLogEntry('debug', message, context, data);
    console.debug(`🔍 [${entry.timestamp}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
  }

  /**
   * Log de informação
   */
  public info(message: string, context?: string, data?: unknown): void {
    const entry = this.createLogEntry('info', message, context, data);
    
    if (this.isDevelopment) {
      console.info(`ℹ️ [${entry.timestamp}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
    }
  }

  /**
   * Log de aviso
   */
  public warn(message: string, context?: string, data?: unknown): void {
    const entry = this.createLogEntry('warn', message, context, data);
    console.warn(`⚠️ [${entry.timestamp}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
  }

  /**
   * Log de erro
   */
  public error(message: string | object, context?: string, data?: unknown): void {
    // Se o primeiro parâmetro for um objeto, reorganizar os parâmetros
    let actualMessage: string;
    let actualContext: string | undefined;
    let actualData: unknown;
    
    if (typeof message === 'object' && message !== null) {
      // Primeiro parâmetro é um objeto - usar como data
      actualMessage = 'Erro detectado';
      actualContext = context;
      actualData = message;
    } else {
      // Uso normal
      actualMessage = message as string;
      actualContext = context;
      actualData = data;
    }
    
    const entry = this.createLogEntry('error', actualMessage, actualContext, actualData);
    
    try {
      if (entry.data && typeof entry.data === 'object') {
        // Set para rastrear referências circulares
        const seen = new Set();
        
        // Tentar serializar JSON com tratamento de referências circulares
        const serializedData = JSON.stringify(entry.data, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            // Evitar referências circulares
            if (seen.has(value)) {
              return '[Circular Reference]';
            }
            seen.add(value);
          }
          return value;
        }, 2);
        
        console.error(`❌ [${entry.timestamp}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`);
        console.error('Dados do erro:', serializedData);
      } else {
        console.error(`❌ [${entry.timestamp}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
      }
    } catch (serializationError) {
      // Fallback se a serialização falhar
      console.error(`❌ [${entry.timestamp}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`);
      console.error('Erro na serialização dos dados:', String(entry.data));
    }
  }

  /**
   * Log para operações financeiras (sempre mascarado)
   */
  public financial(message: string, context?: string, data?: unknown): void {
    const entry = this.createLogEntry('info', message, context, data);
    
    if (this.isDevelopment) {
      console.info(`💰 [${entry.timestamp}] [FINANCIAL] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
    }
  }

  /**
   * Log para operações de API (sempre mascarado)
   */
  public api(message: string, context?: string, data?: unknown): void {
    const entry = this.createLogEntry('info', message, context, data);
    
    if (this.isDevelopment) {
      console.info(`🌐 [${entry.timestamp}] [API] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
    }
  }

  /**
   * Log para operações de autenticação (sempre mascarado)
   */
  public auth(message: string, context?: string, data?: unknown): void {
    const entry = this.createLogEntry('info', message, context, data);
    
    if (this.isDevelopment) {
      console.info(`🔐 [${entry.timestamp}] [AUTH] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
    }
  }
}

// Instância singleton
export const logger = SecureLogger.getInstance();

// Funções de conveniência
export const logDebug = (message: string, context?: string, data?: unknown) => 
  logger.debug(message, context, data);

export const logInfo = (message: string, context?: string, data?: unknown) => 
  logger.info(message, context, data);

export const logWarn = (message: string, context?: string, data?: unknown) => 
  logger.warn(message, context, data);

export const logError = (message: string | object, context?: string, data?: unknown) => 
  logger.error(message, context, data);

export const logFinancial = (message: string, context?: string, data?: unknown) => 
  logger.financial(message, context, data);

export const logApi = (message: string, context?: string, data?: unknown) => 
  logger.api(message, context, data);

export const logAuth = (message: string, context?: string, data?: unknown) => 
  logger.auth(message, context, data);