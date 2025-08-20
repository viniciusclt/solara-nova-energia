/**
 * Serviço de Notificações para o Módulo Fotovoltaico
 * 
 * Gerencia notificações, alertas e avisos do sistema
 */

import { logInfo, logError } from '@/utils/secureLogger';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  autoClose?: number; // Tempo em ms para fechar automaticamente
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationConfig {
  maxNotifications: number;
  defaultAutoClose: number;
  enableSound: boolean;
  enableBrowserNotifications: boolean;
  persistentTypes: NotificationType[];
}

export interface NotificationFilter {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private config: NotificationConfig;

  private constructor() {
    this.config = {
      maxNotifications: 100,
      defaultAutoClose: 5000,
      enableSound: true,
      enableBrowserNotifications: false,
      persistentTypes: ['error', 'warning']
    };
    
    this.loadFromStorage();
    this.requestBrowserPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Adiciona uma nova notificação
   */
  public addNotification(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority;
      persistent?: boolean;
      autoClose?: number;
      actions?: NotificationAction[];
      metadata?: Record<string, unknown>;
    }
  ): string {
    const notification: Notification = {
      id: this.generateId(),
      type,
      priority: options?.priority || 'medium',
      title,
      message,
      timestamp: new Date(),
      read: false,
      persistent: options?.persistent || this.config.persistentTypes.includes(type),
      autoClose: options?.autoClose || (options?.persistent ? undefined : this.config.defaultAutoClose),
      actions: options?.actions,
      metadata: options?.metadata
    };

    this.notifications.unshift(notification);
    this.trimNotifications();
    this.saveToStorage();
    this.notifyListeners();
    
    // Log da notificação
    logInfo('Nova notificação criada', {
      service: 'NotificationService',
      notificationId: notification.id,
      type: notification.type,
      priority: notification.priority,
      title: notification.title
    });

    // Reproduzir som se habilitado
    if (this.config.enableSound && ['warning', 'error'].includes(type)) {
      this.playNotificationSound(type);
    }

    // Mostrar notificação do browser se habilitado
    if (this.config.enableBrowserNotifications && ['warning', 'error', 'critical'].includes(notification.priority)) {
      this.showBrowserNotification(notification);
    }

    return notification.id;
  }

  /**
   * Métodos de conveniência para diferentes tipos de notificação
   */
  public info(title: string, message: string, options?: Partial<{ priority: NotificationPriority; persistent: boolean; autoClose: number; actions: NotificationAction[]; metadata: Record<string, unknown>; }>): string {
    return this.addNotification('info', title, message, options);
  }

  public success(title: string, message: string, options?: Partial<{ priority: NotificationPriority; persistent: boolean; autoClose: number; actions: NotificationAction[]; metadata: Record<string, unknown>; }>): string {
    return this.addNotification('success', title, message, options);
  }

  public warning(title: string, message: string, options?: Partial<{ priority: NotificationPriority; persistent: boolean; autoClose: number; actions: NotificationAction[]; metadata: Record<string, unknown>; }>): string {
    return this.addNotification('warning', title, message, { ...options, priority: 'high' });
  }

  public error(title: string, message: string, options?: Partial<{ priority: NotificationPriority; persistent: boolean; autoClose: number; actions: NotificationAction[]; metadata: Record<string, unknown>; }>): string {
    return this.addNotification('error', title, message, { ...options, priority: 'critical', persistent: true });
  }

  /**
   * Notificações específicas do módulo fotovoltaico
   */
  public calculationError(error: string, context?: Record<string, unknown>): string {
    return this.error(
      'Erro no Cálculo',
      `Erro durante o cálculo financeiro: ${error}`,
      {
        metadata: { context, module: 'financial-calculation' },
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => window.location.reload(),
            style: 'primary' as const
          },
          {
            label: 'Reportar Problema',
            action: () => this.reportIssue(error, context),
            style: 'secondary' as const
          }
        ]
      }
    );
  }

  public dataValidationWarning(field: string, value: unknown, expectedRange?: string): string {
    return this.warning(
      'Dados Fora do Esperado',
      `O valor "${value}" para ${field} está fora do intervalo esperado${expectedRange ? `: ${expectedRange}` : ''}.`,
      {
        metadata: { field, value, expectedRange, module: 'data-validation' }
      }
    );
  }

  public calculationSuccess(type: string, duration: number): string {
    return this.success(
      'Cálculo Concluído',
      `${type} calculado com sucesso em ${duration}ms.`,
      {
        autoClose: 3000,
        metadata: { type, duration, module: 'financial-calculation' }
      }
    );
  }

  public cacheWarning(operation: string): string {
    return this.warning(
      'Cache Indisponível',
      `Operação de cache falhou: ${operation}. Os cálculos podem ser mais lentos.`,
      {
        metadata: { operation, module: 'cache' }
      }
    );
  }

  public sensitivityAnalysisComplete(parametersCount: number, duration: number): string {
    return this.success(
      'Análise de Sensibilidade Concluída',
      `Análise de ${parametersCount} parâmetros concluída em ${(duration / 1000).toFixed(1)}s.`,
      {
        autoClose: 4000,
        metadata: { parametersCount, duration, module: 'sensitivity-analysis' }
      }
    );
  }

  /**
   * Marca uma notificação como lida
   */
  public markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  public markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Remove uma notificação
   */
  public removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Remove todas as notificações
   */
  public clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Remove notificações lidas
   */
  public clearRead(): void {
    this.notifications = this.notifications.filter(n => !n.read);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Obtém todas as notificações
   */
  public getNotifications(filter?: NotificationFilter): Notification[] {
    let filtered = [...this.notifications];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(n => n.type === filter.type);
      }
      if (filter.priority) {
        filtered = filtered.filter(n => n.priority === filter.priority);
      }
      if (filter.read !== undefined) {
        filtered = filtered.filter(n => n.read === filter.read);
      }
      if (filter.dateFrom) {
        filtered = filtered.filter(n => n.timestamp >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        filtered = filtered.filter(n => n.timestamp <= filter.dateTo!);
      }
    }

    return filtered;
  }

  /**
   * Obtém contadores de notificações
   */
  public getCounters(): {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  } {
    const unread = this.notifications.filter(n => !n.read);
    
    const byType: Record<NotificationType, number> = {
      info: 0,
      success: 0,
      warning: 0,
      error: 0
    };
    
    const byPriority: Record<NotificationPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    this.notifications.forEach(n => {
      byType[n.type]++;
      byPriority[n.priority]++;
    });

    return {
      total: this.notifications.length,
      unread: unread.length,
      byType,
      byPriority
    };
  }

  /**
   * Adiciona um listener para mudanças nas notificações
   */
  public addListener(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    
    // Retorna função para remover o listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Atualiza configurações
   */
  public updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfigToStorage();
  }

  /**
   * Obtém configurações atuais
   */
  public getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Métodos privados
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trimNotifications(): void {
    if (this.notifications.length > this.config.maxNotifications) {
      // Remove notificações mais antigas, mas preserva as persistentes
      const persistent = this.notifications.filter(n => n.persistent);
      const nonPersistent = this.notifications.filter(n => !n.persistent);
      
      const maxNonPersistent = this.config.maxNotifications - persistent.length;
      const trimmedNonPersistent = nonPersistent.slice(0, Math.max(0, maxNonPersistent));
      
      this.notifications = [...trimmedNonPersistent, ...persistent];
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback([...this.notifications]);
      } catch (error) {
        logError('Erro ao notificar listener', 'NotificationService', { error: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  private saveToStorage(): void {
    try {
      const data = {
        notifications: this.notifications,
        timestamp: Date.now()
      };
      localStorage.setItem('solar_notifications', JSON.stringify(data));
    } catch (error) {
      logError('Erro ao salvar notificações no storage', 'NotificationService', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('solar_notifications');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Verificar se os dados não são muito antigos (7 dias)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
        if (Date.now() - data.timestamp < maxAge) {
          this.notifications = data.notifications.map((n: unknown) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
        }
      }
    } catch (error) {
      logError('Erro ao carregar notificações do storage', 'NotificationService', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private saveConfigToStorage(): void {
    try {
      localStorage.setItem('solar_notification_config', JSON.stringify(this.config));
    } catch (error) {
      logError('Erro ao salvar configurações no storage', 'NotificationService', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async requestBrowserPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        this.config.enableBrowserNotifications = permission === 'granted';
      } catch (error) {
        logError('Erro ao solicitar permissão de notificação', 'NotificationService', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.priority === 'critical'
        });

        browserNotification.onclick = () => {
          window.focus();
          this.markAsRead(notification.id);
          browserNotification.close();
        };

        // Auto-close após 5 segundos se não for crítica
        if (notification.priority !== 'critical') {
          setTimeout(() => browserNotification.close(), 5000);
        }
      } catch (error) {
        logError('Erro ao mostrar notificação do browser', 'NotificationService', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  private playNotificationSound(type: NotificationType): void {
    try {
      // Criar um contexto de áudio simples para reproduzir sons
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Diferentes frequências para diferentes tipos
      const frequencies = {
        info: 800,
        success: 600,
        warning: 400,
        error: 200
      };

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Falha silenciosa para sons
    }
  }

  private reportIssue(error: string, context?: Record<string, unknown>): void {
    // Implementar relatório de problemas
    logError('Problema reportado pelo usuário', {
      service: 'NotificationService',
      userReportedError: error,
      context
    });
    
    this.info(
      'Problema Reportado',
      'Obrigado por reportar o problema. Nossa equipe foi notificada.',
      { autoClose: 3000 }
    );
  }
}

export default NotificationService;