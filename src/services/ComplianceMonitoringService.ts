import { 
  logInfo, 
  logWarn, 
  logError, 
  logCompliance,
  searchLogs,
  generateComplianceReport,
  type LogEntry 
} from '@/utils/secureLogger';
import { REGULATORY_CONSTANTS } from '@/constants/regulatory';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'lei_14300' | 'ren_aneel' | 'concessionaria' | 'tecnico';
  severity: 'low' | 'medium' | 'high' | 'critical';
  regulatory_reference: {
    lei?: string[];
    ren?: string[];
    artigo?: string;
    procedimento?: string;
  };
  validation_function: (data: any) => ComplianceValidationResult;
  auto_check: boolean;
  check_interval_ms?: number;
}

export interface ComplianceValidationResult {
  compliant: boolean;
  score: number; // 0-100
  issues: ComplianceIssue[];
  recommendations: string[];
  evidence?: Record<string, any>;
}

export interface ComplianceIssue {
  id: string;
  type: 'violation' | 'warning' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  regulatory_reference: string;
  remediation_steps: string[];
  deadline?: Date;
}

export interface ComplianceMonitoringConfig {
  enabled: boolean;
  check_interval_ms: number;
  auto_remediation: boolean;
  notification_thresholds: {
    critical_issues: number;
    compliance_score_min: number;
  };
  rules_enabled: string[];
}

export interface ComplianceNotification {
  id: string;
  type: 'compliance_violation' | 'score_threshold' | 'rule_failure' | 'system_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, any>;
  acknowledged: boolean;
  auto_dismiss_after_ms?: number;
}

class ComplianceMonitoringService {
  private static instance: ComplianceMonitoringService;
  private config: ComplianceMonitoringConfig;
  private rules: Map<string, ComplianceRule> = new Map();
  private notifications: ComplianceNotification[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastComplianceCheck: Date | null = null;
  private complianceHistory: Array<{ timestamp: Date; score: number; issues: number }> = [];

  private constructor() {
    this.config = {
      enabled: true,
      check_interval_ms: 5 * 60 * 1000, // 5 minutos
      auto_remediation: false,
      notification_thresholds: {
        critical_issues: 1,
        compliance_score_min: 80
      },
      rules_enabled: []
    };
    
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  public static getInstance(): ComplianceMonitoringService {
    if (!ComplianceMonitoringService.instance) {
      ComplianceMonitoringService.instance = new ComplianceMonitoringService();
    }
    return ComplianceMonitoringService.instance;
  }

  // ===== CONFIGURAÇÃO E INICIALIZAÇÃO =====

  private initializeDefaultRules(): void {
    // Regra: Validação de potência máxima (Lei 14.300)
    this.addRule({
      id: 'lei_14300_potencia_maxima',
      name: 'Potência Máxima Lei 14.300',
      description: 'Verifica se a potência do sistema está dentro dos limites da Lei 14.300/2022',
      category: 'lei_14300',
      severity: 'high',
      regulatory_reference: {
        lei: ['Lei 14.300/2022'],
        artigo: 'Art. 2º, § 1º'
      },
      validation_function: (data: { potencia_kw: number; tipo_geracao: string }) => {
        const maxPower = REGULATORY_CONSTANTS.VALIDACOES_REGULAMENTARES.potencia_maxima_kw;
        const compliant = data.potencia_kw <= maxPower;
        
        return {
          compliant,
          score: compliant ? 100 : Math.max(0, 100 - ((data.potencia_kw - maxPower) / maxPower) * 100),
          issues: compliant ? [] : [{
            id: 'potencia_excedida',
            type: 'violation',
            severity: 'high',
            title: 'Potência Excede Limite Legal',
            description: `Potência de ${data.potencia_kw}kW excede o limite de ${maxPower}kW estabelecido pela Lei 14.300/2022`,
            regulatory_reference: 'Lei 14.300/2022, Art. 2º, § 1º',
            remediation_steps: [
              'Reduzir a potência do sistema para o limite legal',
              'Considerar instalação em etapas',
              'Verificar possibilidade de enquadramento em categoria diferente'
            ]
          }],
          recommendations: compliant ? [] : [
            'Revisar o dimensionamento do sistema',
            'Consultar a concessionária sobre limites específicos'
          ]
        };
      },
      auto_check: true,
      check_interval_ms: 10 * 60 * 1000 // 10 minutos
    });

    // Regra: Validação de documentação obrigatória
    this.addRule({
      id: 'documentacao_obrigatoria',
      name: 'Documentação Obrigatória ANEEL',
      description: 'Verifica se toda documentação obrigatória está presente',
      category: 'ren_aneel',
      severity: 'critical',
      regulatory_reference: {
        ren: ['REN 1000/2021'],
        procedimento: 'Procedimentos de Acesso'
      },
      validation_function: (data: { documentos: string[] }) => {
        const requiredDocs = REGULATORY_CONSTANTS.VALIDACOES_REGULAMENTARES.documentos_obrigatorios;
        const missingDocs = requiredDocs.filter(doc => !data.documentos.includes(doc));
        const compliant = missingDocs.length === 0;
        
        return {
          compliant,
          score: Math.round(((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100),
          issues: missingDocs.map(doc => ({
            id: `doc_missing_${doc.replace(/\s+/g, '_').toLowerCase()}`,
            type: 'violation' as const,
            severity: 'high' as const,
            title: 'Documento Obrigatório Ausente',
            description: `Documento obrigatório ausente: ${doc}`,
            regulatory_reference: 'REN 1000/2021 - Procedimentos de Acesso',
            remediation_steps: [
              `Providenciar o documento: ${doc}`,
              'Verificar requisitos específicos da concessionária',
              'Submeter documentação completa'
            ]
          })),
          recommendations: missingDocs.length > 0 ? [
            'Completar a documentação antes de prosseguir',
            'Verificar atualizações nos requisitos regulamentares'
          ] : []
        };
      },
      auto_check: true
    });

    // Regra: Validação de normas técnicas
    this.addRule({
      id: 'normas_tecnicas',
      name: 'Conformidade com Normas Técnicas',
      description: 'Verifica conformidade com normas técnicas aplicáveis',
      category: 'tecnico',
      severity: 'high',
      regulatory_reference: {
        ren: ['REN 1000/2021'],
        procedimento: 'Requisitos Técnicos'
      },
      validation_function: (data: { normas_atendidas: string[] }) => {
        const requiredNorms = REGULATORY_CONSTANTS.VALIDACOES_REGULAMENTARES.normas_tecnicas;
        const missingNorms = requiredNorms.filter(norm => !data.normas_atendidas.includes(norm));
        const compliant = missingNorms.length === 0;
        
        return {
          compliant,
          score: Math.round(((requiredNorms.length - missingNorms.length) / requiredNorms.length) * 100),
          issues: missingNorms.map(norm => ({
            id: `norm_missing_${norm.replace(/\s+/g, '_').toLowerCase()}`,
            type: 'violation' as const,
            severity: 'medium' as const,
            title: 'Norma Técnica Não Atendida',
            description: `Norma técnica não atendida: ${norm}`,
            regulatory_reference: 'REN 1000/2021 - Requisitos Técnicos',
            remediation_steps: [
              `Adequar sistema à norma: ${norm}`,
              'Realizar testes de conformidade',
              'Obter certificações necessárias'
            ]
          })),
          recommendations: missingNorms.length > 0 ? [
            'Revisar projeto técnico',
            'Consultar profissional habilitado'
          ] : []
        };
      },
      auto_check: true
    });

    // Regra: Validação de prazos da concessionária
    this.addRule({
      id: 'prazos_concessionaria',
      name: 'Prazos da Concessionária',
      description: 'Monitora cumprimento de prazos estabelecidos pela concessionária',
      category: 'concessionaria',
      severity: 'medium',
      regulatory_reference: {
        procedimento: 'Procedimentos Light-RJ'
      },
      validation_function: (data: { data_solicitacao: Date; prazo_dias: number }) => {
        const daysPassed = Math.floor((Date.now() - data.data_solicitacao.getTime()) / (1000 * 60 * 60 * 24));
        const compliant = daysPassed <= data.prazo_dias;
        const daysRemaining = data.prazo_dias - daysPassed;
        
        return {
          compliant,
          score: compliant ? 100 : Math.max(0, 100 - ((daysPassed - data.prazo_dias) / data.prazo_dias) * 100),
          issues: compliant ? [] : [{
            id: 'prazo_vencido',
            type: 'warning',
            severity: daysRemaining < -30 ? 'high' : 'medium',
            title: 'Prazo da Concessionária Vencido',
            description: `Prazo vencido há ${Math.abs(daysRemaining)} dias`,
            regulatory_reference: 'Procedimentos Light-RJ',
            remediation_steps: [
              'Entrar em contato com a concessionária',
              'Verificar status da solicitação',
              'Providenciar documentação adicional se necessário'
            ]
          }],
          recommendations: daysRemaining < 5 && daysRemaining > 0 ? [
            'Prazo próximo do vencimento - tomar ação urgente'
          ] : []
        };
      },
      auto_check: true,
      check_interval_ms: 24 * 60 * 60 * 1000 // 24 horas
    });

    logInfo('Regras de conformidade padrão inicializadas', 'ComplianceMonitoring', {
      total_rules: this.rules.size
    });
  }

  public updateConfig(newConfig: Partial<ComplianceMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }
    
    if (newConfig.check_interval_ms) {
      this.restartMonitoring();
    }
    
    logInfo('Configuração de monitoramento atualizada', 'ComplianceMonitoring', {
      config: this.config
    });
  }

  // ===== GERENCIAMENTO DE REGRAS =====

  public addRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);
    
    if (!this.config.rules_enabled.includes(rule.id)) {
      this.config.rules_enabled.push(rule.id);
    }
    
    logInfo(`Regra de conformidade adicionada: ${rule.name}`, 'ComplianceMonitoring', {
      rule_id: rule.id,
      category: rule.category,
      severity: rule.severity
    });
  }

  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.config.rules_enabled = this.config.rules_enabled.filter(id => id !== ruleId);
    
    logInfo(`Regra de conformidade removida: ${ruleId}`, 'ComplianceMonitoring');
  }

  public enableRule(ruleId: string): void {
    if (this.rules.has(ruleId) && !this.config.rules_enabled.includes(ruleId)) {
      this.config.rules_enabled.push(ruleId);
      logInfo(`Regra de conformidade habilitada: ${ruleId}`, 'ComplianceMonitoring');
    }
  }

  public disableRule(ruleId: string): void {
    this.config.rules_enabled = this.config.rules_enabled.filter(id => id !== ruleId);
    logInfo(`Regra de conformidade desabilitada: ${ruleId}`, 'ComplianceMonitoring');
  }

  public getRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  public getEnabledRules(): ComplianceRule[] {
    return this.config.rules_enabled
      .map(id => this.rules.get(id))
      .filter((rule): rule is ComplianceRule => rule !== undefined);
  }

  // ===== MONITORAMENTO E VALIDAÇÃO =====

  private startMonitoring(): void {
    if (!this.config.enabled || this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.performComplianceCheck();
    }, this.config.check_interval_ms);
    
    logInfo('Monitoramento de conformidade iniciado', 'ComplianceMonitoring', {
      interval_ms: this.config.check_interval_ms
    });
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      
      logInfo('Monitoramento de conformidade parado', 'ComplianceMonitoring');
    }
  }

  private restartMonitoring(): void {
    this.stopMonitoring();
    this.startMonitoring();
  }

  public async performComplianceCheck(data?: Record<string, any>): Promise<{
    overall_score: number;
    total_issues: number;
    critical_issues: number;
    results: Array<{ rule_id: string; result: ComplianceValidationResult }>;
  }> {
    const enabledRules = this.getEnabledRules();
    const results: Array<{ rule_id: string; result: ComplianceValidationResult }> = [];
    
    let totalScore = 0;
    let totalIssues = 0;
    let criticalIssues = 0;
    
    logInfo('Iniciando verificação de conformidade', 'ComplianceMonitoring', {
      rules_count: enabledRules.length,
      has_data: !!data
    });
    
    for (const rule of enabledRules) {
      try {
        // Usar dados fornecidos ou dados padrão para teste
        const testData = data || this.getDefaultTestData(rule);
        const result = rule.validation_function(testData);
        
        results.push({ rule_id: rule.id, result });
        
        totalScore += result.score;
        totalIssues += result.issues.length;
        criticalIssues += result.issues.filter(issue => issue.severity === 'critical').length;
        
        // Log do resultado da regra
        logCompliance(
          rule.name,
          result.compliant ? 'compliant' : 'non_compliant',
          {
            rule_id: rule.id,
            score: result.score,
            issues_count: result.issues.length,
            regulatory_reference: rule.regulatory_reference
          }
        );
        
        // Processar issues críticas
        if (result.issues.some(issue => issue.severity === 'critical')) {
          this.createNotification({
            type: 'compliance_violation',
            severity: 'critical',
            title: `Violação Crítica: ${rule.name}`,
            message: `Regra ${rule.name} apresentou ${result.issues.length} problema(s) crítico(s)`,
            data: {
              rule_id: rule.id,
              issues: result.issues.filter(issue => issue.severity === 'critical')
            }
          });
        }
        
      } catch (error) {
        logError(
          `Erro ao executar regra de conformidade: ${rule.name}`,
          'ComplianceMonitoring',
          { rule_id: rule.id, error: error instanceof Error ? error.message : 'Erro desconhecido' }
        );
        
        this.createNotification({
          type: 'rule_failure',
          severity: 'medium',
          title: `Falha na Regra: ${rule.name}`,
          message: `Erro ao executar regra de conformidade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      }
    }
    
    const overallScore = enabledRules.length > 0 ? Math.round(totalScore / enabledRules.length) : 100;
    
    // Verificar thresholds de notificação
    if (criticalIssues >= this.config.notification_thresholds.critical_issues) {
      this.createNotification({
        type: 'compliance_violation',
        severity: 'critical',
        title: 'Múltiplas Violações Críticas',
        message: `${criticalIssues} violações críticas de conformidade detectadas`
      });
    }
    
    if (overallScore < this.config.notification_thresholds.compliance_score_min) {
      this.createNotification({
        type: 'score_threshold',
        severity: 'high',
        title: 'Score de Conformidade Baixo',
        message: `Score de conformidade (${overallScore}%) abaixo do limite mínimo (${this.config.notification_thresholds.compliance_score_min}%)`
      });
    }
    
    // Atualizar histórico
    this.complianceHistory.push({
      timestamp: new Date(),
      score: overallScore,
      issues: totalIssues
    });
    
    // Manter apenas últimos 100 registros
    if (this.complianceHistory.length > 100) {
      this.complianceHistory = this.complianceHistory.slice(-100);
    }
    
    this.lastComplianceCheck = new Date();
    
    logInfo('Verificação de conformidade concluída', 'ComplianceMonitoring', {
      overall_score: overallScore,
      total_issues: totalIssues,
      critical_issues: criticalIssues,
      rules_checked: enabledRules.length
    });
    
    return {
      overall_score: overallScore,
      total_issues: totalIssues,
      critical_issues: criticalIssues,
      results
    };
  }

  private getDefaultTestData(rule: ComplianceRule): any {
    // Dados padrão para teste das regras quando dados reais não estão disponíveis
    const defaultData: Record<string, any> = {
      lei_14300_potencia_maxima: {
        potencia_kw: 75, // Dentro do limite
        tipo_geracao: 'fotovoltaica'
      },
      documentacao_obrigatoria: {
        documentos: [
          'Projeto elétrico',
          'ART/RRT',
          'Formulário de solicitação'
        ]
      },
      normas_tecnicas: {
        normas_atendidas: [
          'NBR 5410',
          'NBR 16274'
        ]
      },
      prazos_concessionaria: {
        data_solicitacao: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 dias atrás
        prazo_dias: 30
      }
    };
    
    return defaultData[rule.id] || {};
  }

  // ===== NOTIFICAÇÕES =====

  private createNotification(notification: Omit<ComplianceNotification, 'id' | 'timestamp' | 'acknowledged'>): void {
    const newNotification: ComplianceNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date(),
      acknowledged: false,
      ...notification
    };
    
    this.notifications.unshift(newNotification);
    
    // Limitar a 100 notificações
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    logWarn(
      `Nova notificação de conformidade: ${notification.title}`,
      'ComplianceMonitoring',
      { notification: newNotification }
    );
  }

  public getNotifications(unacknowledgedOnly: boolean = false): ComplianceNotification[] {
    return unacknowledgedOnly 
      ? this.notifications.filter(n => !n.acknowledged)
      : this.notifications;
  }

  public acknowledgeNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
      logInfo(`Notificação reconhecida: ${notificationId}`, 'ComplianceMonitoring');
    }
  }

  public clearNotifications(): void {
    this.notifications = [];
    logInfo('Todas as notificações foram limpas', 'ComplianceMonitoring');
  }

  // ===== RELATÓRIOS E MÉTRICAS =====

  public getComplianceHistory(): Array<{ timestamp: Date; score: number; issues: number }> {
    return [...this.complianceHistory];
  }

  public getLastComplianceCheck(): Date | null {
    return this.lastComplianceCheck;
  }

  public getConfig(): ComplianceMonitoringConfig {
    return { ...this.config };
  }

  public generateDetailedReport(): {
    summary: {
      overall_score: number;
      total_rules: number;
      enabled_rules: number;
      last_check: Date | null;
      notifications_count: number;
    };
    rules_status: Array<{
      rule: ComplianceRule;
      enabled: boolean;
      last_result?: ComplianceValidationResult;
    }>;
    recent_history: Array<{ timestamp: Date; score: number; issues: number }>;
    active_notifications: ComplianceNotification[];
  } {
    const enabledRules = this.getEnabledRules();
    
    return {
      summary: {
        overall_score: this.complianceHistory.length > 0 
          ? this.complianceHistory[this.complianceHistory.length - 1].score 
          : 0,
        total_rules: this.rules.size,
        enabled_rules: enabledRules.length,
        last_check: this.lastComplianceCheck,
        notifications_count: this.getNotifications(true).length
      },
      rules_status: Array.from(this.rules.values()).map(rule => ({
        rule,
        enabled: this.config.rules_enabled.includes(rule.id)
      })),
      recent_history: this.complianceHistory.slice(-10),
      active_notifications: this.getNotifications(true)
    };
  }
}

// Instância singleton
export const complianceMonitoring = ComplianceMonitoringService.getInstance();

// Funções de conveniência
export const startComplianceMonitoring = () => complianceMonitoring.updateConfig({ enabled: true });
export const stopComplianceMonitoring = () => complianceMonitoring.updateConfig({ enabled: false });
export const performComplianceCheck = (data?: Record<string, any>) => complianceMonitoring.performComplianceCheck(data);
export const getComplianceNotifications = (unacknowledgedOnly?: boolean) => complianceMonitoring.getNotifications(unacknowledgedOnly);
export const acknowledgeComplianceNotification = (id: string) => complianceMonitoring.acknowledgeNotification(id);
export const getComplianceReport = () => complianceMonitoring.generateDetailedReport();

export default ComplianceMonitoringService;