/**
 * Sistema de Logger Seguro para Auditoria - Solara Nova Energia
 * 
 * Sistema de logging especializado para auditoria de conformidade regulamentar
 * conforme requisitos da ANEEL e Lei 14.300/2022.
 * 
 * CARACTERÍSTICAS:
 * - Logs estruturados para auditoria
 * - Trilha de auditoria completa
 * - Conformidade com LGPD
 * - Integridade dos logs (hash)
 * - Retenção configurável
 * 
 * @author Solara Nova Energia - Equipe de Compliance
 * @version 2.0.0
 * @since 2025-01-20
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
type LogCategory = 
  | 'calculation'
  | 'validation'
  | 'compliance'
  | 'audit'
  | 'security'
  | 'performance'
  | 'user_action'
  | 'system'
  | 'regulatory';

type LogAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'calculate'
  | 'validate'
  | 'export'
  | 'import'
  | 'authenticate'
  | 'authorize';

interface LogEntry {
  // Identificação
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  
  // Contexto
  session_id?: string;
  user_id?: string;
  ip_address?: string;
  
  // Conteúdo
  message: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  
  // Auditoria
  operation: string;
  resource: string;
  action: LogAction;
  result: 'success' | 'failure' | 'warning';
  
  // Conformidade
  regulatory_context?: {
    lei_aplicavel: string[];
    ren_aplicavel: string[];
    procedimento: string;
    validacao_executada: boolean;
  };
  
  // Segurança
  hash?: string;
  previous_hash?: string;
}

interface AuditTrail {
  operation_id: string;
  start_time: Date;
  end_time?: Date;
  duration_ms?: number;
  steps: LogEntry[];
  summary: {
    total_steps: number;
    successful_steps: number;
    failed_steps: number;
    warnings: number;
  };
  regulatory_compliance: {
    laws_applied: string[];
    validations_passed: number;
    validations_failed: number;
    compliance_score: number;
  };
}

class SecureLogger {
  private static instance: SecureLogger;
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private auditTrails: Map<string, AuditTrail> = new Map();
  private lastHash: string = '';
  private sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'apikey', 'api_key',
    'authorization', 'auth', 'credential', 'private', 'confidential',
    'cpf', 'cnpj', 'email', 'telefone', 'endereco'
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

  // ===== MÉTODOS ESPECÍFICOS PARA AUDITORIA DE CONFORMIDADE =====

  /**
   * Log específico para cálculos financeiros
   */
  public logCalculation(
    operation: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    regulatory_context?: {
      lei_aplicavel: string[];
      ren_aplicavel: string[];
      procedimento: string;
    }
  ): void {
    const entry = this.createAuditLogEntry('info', 'calculation', `Cálculo executado: ${operation}`, {
      inputs: this.maskSensitiveData(inputs),
      outputs: this.maskSensitiveData(outputs)
    }, {
      operation,
      resource: 'financial_calculation',
      action: 'calculate',
      result: 'success',
      regulatory_context: regulatory_context ? {
        ...regulatory_context,
        validacao_executada: true
      } : undefined
    });
    
    this.logBuffer.push(entry);
    
    if (this.isDevelopment) {
      console.info(`💰 [${entry.timestamp.toISOString()}] [CALCULATION] ${entry.message}`, entry.data);
    }
  }

  /**
   * Log específico para validações ANEEL
   */
  public logValidation(
    validation_type: string,
    data_validated: Record<string, any>,
    result: 'success' | 'failure' | 'warning',
    details?: Record<string, any>
  ): void {
    const entry = this.createAuditLogEntry('info', 'validation', `Validação ANEEL: ${validation_type}`, {
      data_validated: this.maskSensitiveData(data_validated),
      validation_result: result,
      details: details ? this.maskSensitiveData(details) : undefined
    }, {
      operation: validation_type,
      resource: 'aneel_validation',
      action: 'validate',
      result,
      regulatory_context: {
        lei_aplicavel: ['Lei 14.300/2022'],
        ren_aplicavel: ['REN 1000/2021'],
        procedimento: 'Validação de conformidade ANEEL',
        validacao_executada: true
      }
    });
    
    this.logBuffer.push(entry);
    
    if (this.isDevelopment) {
      console.info(`✅ [${entry.timestamp.toISOString()}] [VALIDATION] ${entry.message}`, entry.data);
    }
  }

  /**
   * Log específico para conformidade regulamentar
   */
  public logCompliance(
    compliance_check: string,
    status: 'compliant' | 'non_compliant' | 'pending',
    details: Record<string, any>
  ): void {
    const entry = this.createAuditLogEntry('info', 'compliance', `Verificação de conformidade: ${compliance_check}`, {
      compliance_status: status,
      details: this.maskSensitiveData(details)
    }, {
      operation: compliance_check,
      resource: 'regulatory_compliance',
      action: 'validate',
      result: status === 'compliant' ? 'success' : status === 'non_compliant' ? 'failure' : 'warning',
      regulatory_context: {
        lei_aplicavel: ['Lei 14.300/2022'],
        ren_aplicavel: ['REN 1000/2021', 'REN 482/2012', 'REN 687/2015'],
        procedimento: 'Verificação de conformidade regulamentar',
        validacao_executada: true
      }
    });
    
    this.logBuffer.push(entry);
    
    if (this.isDevelopment) {
      console.info(`📋 [${entry.timestamp.toISOString()}] [COMPLIANCE] ${entry.message}`, entry.data);
    }
  }

  /**
   * Log de ações do usuário
   */
  public logUserAction(
    user_id: string,
    action: string,
    resource: string,
    details?: Record<string, any>,
    session_id?: string
  ): void {
    const entry = this.createAuditLogEntry('info', 'user_action', `Ação do usuário: ${action}`, {
      details: details ? this.maskSensitiveData(details) : undefined
    }, {
      operation: action,
      resource,
      action: this.mapToLogAction(action),
      result: 'success'
    });
    
    entry.user_id = this.hashString(user_id);
    entry.session_id = session_id;
    
    this.logBuffer.push(entry);
    
    if (this.isDevelopment) {
      console.info(`👤 [${entry.timestamp.toISOString()}] [USER_ACTION] ${entry.message}`, entry.data);
    }
  }

  /**
   * Inicia uma trilha de auditoria
   */
  public startAuditTrail(operation_id: string, operation_name: string): void {
    const auditTrail: AuditTrail = {
      operation_id,
      start_time: new Date(),
      steps: [],
      summary: {
        total_steps: 0,
        successful_steps: 0,
        failed_steps: 0,
        warnings: 0
      },
      regulatory_compliance: {
        laws_applied: [],
        validations_passed: 0,
        validations_failed: 0,
        compliance_score: 0
      }
    };
    
    this.auditTrails.set(operation_id, auditTrail);
    
    const entry = this.createAuditLogEntry('info', 'audit', `Iniciando trilha de auditoria: ${operation_name}`, {
      operation_id
    }, {
      operation: operation_name,
      resource: 'audit_trail',
      action: 'create',
      result: 'success'
    });
    
    this.logBuffer.push(entry);
    
    if (this.isDevelopment) {
      console.info(`🔍 [${entry.timestamp.toISOString()}] [AUDIT_TRAIL] ${entry.message}`);
    }
  }

  /**
   * Adiciona um passo à trilha de auditoria
   */
  public addAuditStep(
    operation_id: string,
    step_name: string,
    result: 'success' | 'failure' | 'warning',
    data?: Record<string, any>
  ): void {
    const auditTrail = this.auditTrails.get(operation_id);
    if (!auditTrail) return;
    
    const logEntry = this.createAuditLogEntry('info', 'audit', `Passo de auditoria: ${step_name}`, {
      step_data: data ? this.maskSensitiveData(data) : undefined
    }, {
      operation: step_name,
      resource: 'audit_step',
      action: 'update',
      result
    });
    
    auditTrail.steps.push(logEntry);
    auditTrail.summary.total_steps++;
    
    switch (result) {
      case 'success':
        auditTrail.summary.successful_steps++;
        auditTrail.regulatory_compliance.validations_passed++;
        break;
      case 'failure':
        auditTrail.summary.failed_steps++;
        auditTrail.regulatory_compliance.validations_failed++;
        break;
      case 'warning':
        auditTrail.summary.warnings++;
        break;
    }
    
    this.logBuffer.push(logEntry);
  }

  /**
   * Finaliza uma trilha de auditoria
   */
  public finishAuditTrail(operation_id: string): AuditTrail | null {
    const auditTrail = this.auditTrails.get(operation_id);
    if (!auditTrail) return null;
    
    auditTrail.end_time = new Date();
    auditTrail.duration_ms = auditTrail.end_time.getTime() - auditTrail.start_time.getTime();
    
    // Calcular score de conformidade
    const totalValidations = auditTrail.regulatory_compliance.validations_passed + 
                           auditTrail.regulatory_compliance.validations_failed;
    auditTrail.regulatory_compliance.compliance_score = totalValidations > 0 ? 
      (auditTrail.regulatory_compliance.validations_passed / totalValidations) * 100 : 100;
    
    const entry = this.createAuditLogEntry('info', 'audit', `Finalizando trilha de auditoria: ${operation_id}`, {
      duration_ms: auditTrail.duration_ms,
      summary: auditTrail.summary,
      compliance_score: auditTrail.regulatory_compliance.compliance_score
    }, {
      operation: operation_id,
      resource: 'audit_trail',
      action: 'update',
      result: auditTrail.summary.failed_steps === 0 ? 'success' : 'warning'
    });
    
    this.logBuffer.push(entry);
    this.auditTrails.delete(operation_id);
    
    if (this.isDevelopment) {
      console.info(`✅ [${entry.timestamp.toISOString()}] [AUDIT_TRAIL] Trilha finalizada: ${operation_id}`);
    }
    
    return auditTrail;
  }

  // ===== MÉTODOS PRIVADOS PARA AUDITORIA =====

  private createAuditLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>,
    context?: Partial<LogEntry>
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      operation: context?.operation || 'unknown',
      resource: context?.resource || 'system',
      action: context?.action || 'read',
      result: context?.result || 'success',
      ...context
    };
    
    // Adicionar hash para integridade
    entry.previous_hash = this.lastHash;
    entry.hash = this.calculateHash(entry);
    this.lastHash = entry.hash;
    
    return entry;
  }

  private mapToLogAction(action: string): LogAction {
    const actionMap: Record<string, LogAction> = {
      'criar': 'create',
      'ler': 'read',
      'atualizar': 'update',
      'deletar': 'delete',
      'calcular': 'calculate',
      'validar': 'validate',
      'exportar': 'export',
      'importar': 'import',
      'login': 'authenticate',
      'autorizar': 'authorize'
    };
    
    return actionMap[action.toLowerCase()] || 'read';
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private hashString(input: string): string {
    // Implementação simplificada - em produção, usar crypto
    return `hash_${input.length}_${input.charCodeAt(0)}`;
  }

  private calculateHash(entry: LogEntry): string {
    // Implementação simplificada - em produção, usar crypto
    const content = JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      previous_hash: entry.previous_hash
    });
    return this.hashString(content);
  }

  // ===== MÉTODOS DE BUSCA E EXPORTAÇÃO =====

  /**
   * Busca logs com filtros específicos
   */
  public searchLogs(filters: {
    start_date?: Date;
    end_date?: Date;
    level?: LogLevel;
    category?: LogCategory;
    operation?: string;
    user_id?: string;
    resource?: string;
    compliance_status?: 'compliant' | 'non_compliant' | 'pending';
  }): LogEntry[] {
    return this.logBuffer.filter(entry => {
      if (filters.start_date && entry.timestamp < filters.start_date) return false;
      if (filters.end_date && entry.timestamp > filters.end_date) return false;
      if (filters.level && entry.level !== filters.level) return false;
      if (filters.category && entry.category !== filters.category) return false;
      if (filters.operation && entry.operation !== filters.operation) return false;
      if (filters.user_id && entry.user_id !== this.hashString(filters.user_id)) return false;
      if (filters.resource && entry.resource !== filters.resource) return false;
      if (filters.compliance_status && entry.regulatory_context?.compliance_status !== filters.compliance_status) return false;
      
      return true;
    });
  }

  /**
   * Exporta logs para auditoria
   */
  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'Level', 'Category', 'Message', 'Operation', 
        'Resource', 'Action', 'Result', 'User_ID', 'Session_ID', 'Hash'
      ];
      
      const csvRows = this.logBuffer.map(entry => [
        entry.id,
        entry.timestamp.toISOString(),
        entry.level,
        entry.category,
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.operation,
        entry.resource,
        entry.action,
        entry.result,
        entry.user_id || '',
        entry.session_id || '',
        entry.hash || ''
      ]);
      
      return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    }
    
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Gera relatório de conformidade
   */
  public generateComplianceReport(): {
    total_logs: number;
    compliance_summary: {
      compliant: number;
      non_compliant: number;
      pending: number;
    };
    validation_summary: {
      total_validations: number;
      passed: number;
      failed: number;
      warnings: number;
    };
    recent_activities: LogEntry[];
    integrity_check: boolean;
  } {
    const complianceLogs = this.logBuffer.filter(entry => entry.category === 'compliance');
    const validationLogs = this.logBuffer.filter(entry => entry.category === 'validation');
    
    const complianceSummary = {
      compliant: complianceLogs.filter(log => log.regulatory_context?.compliance_status === 'compliant').length,
      non_compliant: complianceLogs.filter(log => log.regulatory_context?.compliance_status === 'non_compliant').length,
      pending: complianceLogs.filter(log => log.regulatory_context?.compliance_status === 'pending').length
    };
    
    const validationSummary = {
      total_validations: validationLogs.length,
      passed: validationLogs.filter(log => log.result === 'success').length,
      failed: validationLogs.filter(log => log.result === 'failure').length,
      warnings: validationLogs.filter(log => log.result === 'warning').length
    };
    
    // Verificar integridade da cadeia de hash
    const integrityCheck = this.verifyLogIntegrity();
    
    // Atividades recentes (últimas 24 horas)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivities = this.logBuffer
      .filter(entry => entry.timestamp > yesterday)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    return {
      total_logs: this.logBuffer.length,
      compliance_summary: complianceSummary,
      validation_summary: validationSummary,
      recent_activities: recentActivities,
      integrity_check: integrityCheck
    };
  }

  /**
   * Verifica a integridade da cadeia de logs
   */
  private verifyLogIntegrity(): boolean {
    if (this.logBuffer.length === 0) return true;
    
    for (let i = 1; i < this.logBuffer.length; i++) {
      const currentEntry = this.logBuffer[i];
      const previousEntry = this.logBuffer[i - 1];
      
      if (currentEntry.previous_hash !== previousEntry.hash) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Limpa logs antigos (manter apenas últimos 30 dias)
   */
  public cleanOldLogs(daysToKeep: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.logBuffer.length;
    
    this.logBuffer = this.logBuffer.filter(entry => entry.timestamp > cutoffDate);
    
    const removedCount = initialCount - this.logBuffer.length;
    
    if (removedCount > 0) {
      this.info(`Limpeza de logs executada: ${removedCount} logs removidos`, 'SecureLogger');
    }
    
    return removedCount;
  }
}

// ===== INSTÂNCIA SINGLETON E FUNÇÕES DE CONVENIÊNCIA =====

// Instância singleton do SecureLogger
const logger = new SecureLogger();

// Funções de conveniência para logs básicos
export const logDebug = (message: string, context?: string, data?: unknown) => 
  logger.debug(message, context, data);

export const logInfo = (message: string, context?: string, data?: unknown) => 
  logger.info(message, context, data);

export const logWarn = (message: string, context?: string, data?: unknown) => 
  logger.warn(message, context, data);

export const logError = (message: string, context?: string, data?: unknown) => 
  logger.error(message, context, data);

// Funções de conveniência para logs específicos
export const logFinancial = (operation: string, amount: number, context?: string, data?: unknown) => 
  logger.financial(operation, amount, context, data);

export const logAPI = (method: string, url: string, statusCode: number, context?: string, data?: unknown) => 
  logger.api(method, url, statusCode, context, data);

export const logAuth = (message: string, context?: string, data?: unknown) => 
  logger.auth(message, context, data);

// Funções de conveniência para auditoria de conformidade
export const logCalculation = (
  operation: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  regulatory_context?: {
    lei_aplicavel: string[];
    ren_aplicavel: string[];
    procedimento: string;
  }
) => logger.logCalculation(operation, inputs, outputs, regulatory_context);

export const logValidation = (
  validation_type: string,
  data_validated: Record<string, any>,
  result: 'success' | 'failure' | 'warning',
  details?: Record<string, any>
) => logger.logValidation(validation_type, data_validated, result, details);

export const logCompliance = (
  compliance_check: string,
  status: 'compliant' | 'non_compliant' | 'pending',
  details: Record<string, any>
) => logger.logCompliance(compliance_check, status, details);

export const logUserAction = (
  user_id: string,
  action: string,
  resource: string,
  details?: Record<string, any>,
  session_id?: string
) => logger.logUserAction(user_id, action, resource, details, session_id);

// Funções de conveniência para trilhas de auditoria
export const startAuditTrail = (operation_id: string, operation_name: string) => 
  logger.startAuditTrail(operation_id, operation_name);

export const addAuditStep = (
  operation_id: string,
  step_name: string,
  result: 'success' | 'failure' | 'warning',
  data?: Record<string, any>
) => logger.addAuditStep(operation_id, step_name, result, data);

export const finishAuditTrail = (operation_id: string) => 
  logger.finishAuditTrail(operation_id);

// Funções de conveniência para busca e exportação
export const searchLogs = (filters: {
  start_date?: Date;
  end_date?: Date;
  level?: LogLevel;
  category?: LogCategory;
  operation?: string;
  user_id?: string;
  resource?: string;
  compliance_status?: 'compliant' | 'non_compliant' | 'pending';
}) => logger.searchLogs(filters);

export const exportLogs = (format: 'json' | 'csv' = 'json') => 
  logger.exportLogs(format);

export const generateComplianceReport = () => 
  logger.generateComplianceReport();

export const cleanOldLogs = (daysToKeep: number = 30) => 
  logger.cleanOldLogs(daysToKeep);

// Exportar a instância do logger para uso direto quando necessário
export { logger as secureLogger };

// Exportar tipos para uso em outros módulos
export type { LogLevel, LogCategory, LogAction, LogEntry, AuditTrail };