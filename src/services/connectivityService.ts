/**
 * Serviço de Conectividade
 * Gerencia verificação de conectividade, retry automático e fallback para cache local
 */

interface ConnectivityStatus {
  isOnline: boolean;
  lastChecked: Date;
  latency?: number;
  quality: 'excellent' | 'good' | 'poor' | 'offline';
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

class ConnectivityService {
  private status: ConnectivityStatus = {
    isOnline: navigator.onLine,
    lastChecked: new Date(),
    quality: 'good'
  };

  private listeners: ((status: ConnectivityStatus) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  constructor() {
    this.setupEventListeners();
    this.startPeriodicCheck();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada');
      this.updateStatus({ isOnline: true });
      this.checkConnectivity();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Conexão perdida');
      this.updateStatus({ isOnline: false, quality: 'offline' });
    });
  }

  private startPeriodicCheck() {
    // Verificar conectividade a cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 30000);
  }

  private updateStatus(updates: Partial<ConnectivityStatus>) {
    this.status = {
      ...this.status,
      ...updates,
      lastChecked: new Date()
    };

    // Notificar listeners
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Verifica a conectividade fazendo uma requisição de teste
   */
  async checkConnectivity(): Promise<ConnectivityStatus> {
    if (!navigator.onLine) {
      this.updateStatus({ isOnline: false, quality: 'offline' });
      return this.status;
    }

    try {
      const startTime = Date.now();
      
      // Fazer uma requisição simples para verificar conectividade
      // Usando um endpoint que não cause ERR_ABORTED
      const response = await fetch('data:text/plain;base64,dGVzdA==', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });

      const latency = Date.now() - startTime;
      const isOnline = response.ok;

      let quality: ConnectivityStatus['quality'] = 'good';
      if (latency < 200) quality = 'excellent';
      else if (latency < 1000) quality = 'good';
      else quality = 'poor';

      this.updateStatus({
        isOnline,
        latency,
        quality: isOnline ? quality : 'offline'
      });

    } catch (error) {
      console.warn('⚠️ Falha na verificação de conectividade:', error);
      this.updateStatus({
        isOnline: false,
        quality: 'offline'
      });
    }

    return this.status;
  }

  /**
   * Executa uma função com retry automático em caso de falha
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customConfig };
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Verificar conectividade antes de tentar
        if (attempt > 0) {
          await this.checkConnectivity();
          if (!this.status.isOnline) {
            throw new Error('Sem conectividade de rede');
          }
        }

        const result = await operation();
        
        // Se chegou aqui, a operação foi bem-sucedida
        if (attempt > 0) {
          console.log(`✅ Operação bem-sucedida após ${attempt} tentativas`);
        }
        
        return result;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxRetries) {
          console.error(`❌ Operação falhou após ${config.maxRetries + 1} tentativas:`, error);
          break;
        }

        // Calcular delay para próxima tentativa
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );

        console.warn(`⚠️ Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms:`, error);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Verifica se uma operação deve usar fallback baseado no erro
   */
  shouldUseFallback(error: unknown): boolean {
    if (!error || typeof error !== 'object') return true;

    const errorObj = error as { code?: string; message?: string; name?: string };

    // Erros de rede que justificam fallback
    const networkErrors = [
      'NetworkError',
      'TypeError', // Fetch errors
      'AbortError',
      'TimeoutError'
    ];

    // Códigos Supabase que justificam fallback
    const supabaseNetworkCodes = [
      'PGRST301', // JWT expired
      'PGRST116', // Table not found (pode ser temporário)
      '42501'     // Permission denied (pode ser temporário)
    ];

    if (errorObj.name && networkErrors.includes(errorObj.name)) {
      return true;
    }

    if (errorObj.code && supabaseNetworkCodes.includes(errorObj.code)) {
      return true;
    }

    if (errorObj.message) {
      const message = errorObj.message.toLowerCase();
      const networkKeywords = ['connection', 'network', 'timeout', 'fetch', 'cors'];
      return networkKeywords.some(keyword => message.includes(keyword));
    }

    return false;
  }

  /**
   * Adiciona um listener para mudanças de conectividade
   */
  addListener(listener: (status: ConnectivityStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Retorna função para remover o listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Obtém o status atual de conectividade
   */
  getStatus(): ConnectivityStatus {
    return { ...this.status };
  }

  /**
   * Verifica se está online
   */
  isOnline(): boolean {
    return this.status.isOnline;
  }

  /**
   * Obtém a qualidade da conexão
   */
  getQuality(): ConnectivityStatus['quality'] {
    return this.status.quality;
  }

  /**
   * Para o serviço e limpa recursos
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instância singleton
export const connectivityService = new ConnectivityService();

// Hook para usar o serviço em componentes React
export function useConnectivity() {
  const [status, setStatus] = React.useState<ConnectivityStatus>(
    connectivityService.getStatus()
  );

  React.useEffect(() => {
    const unsubscribe = connectivityService.addListener(setStatus);
    return unsubscribe;
  }, []);

  return {
    ...status,
    checkConnectivity: () => connectivityService.checkConnectivity(),
    withRetry: connectivityService.withRetry.bind(connectivityService),
    shouldUseFallback: connectivityService.shouldUseFallback.bind(connectivityService)
  };
}

// Importar React para o hook
import React from 'react';

export default connectivityService;