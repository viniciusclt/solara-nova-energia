/**
 * Sistema de Monitoramento de Performance - Solara Nova Energia
 * 
 * Monitora métricas de cache, Web Workers e performance geral da aplicação
 */

import { cacheService } from './CacheService';

export interface PerformanceMetrics {
  // Métricas de Cache
  cache: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    memoryUsage: number; // bytes
    indexedDBUsage: number; // bytes
    averageResponseTime: number; // ms
    topMissedKeys: string[];
  };
  
  // Métricas de Web Workers
  workers: {
    totalCalculations: number;
    averageCalculationTime: number; // ms
    successRate: number;
    errorRate: number;
    cancelledCalculations: number;
    activeWorkers: number;
    workerSupported: boolean;
  };
  
  // Métricas de Performance Geral
  performance: {
    pageLoadTime: number; // ms
    firstContentfulPaint: number; // ms
    largestContentfulPaint: number; // ms
    cumulativeLayoutShift: number;
    firstInputDelay: number; // ms
    memoryUsage: {
      used: number; // MB
      total: number; // MB
      percentage: number;
    };
  };
  
  // Métricas de Componentes
  components: {
    lazyLoadedComponents: number;
    averageLazyLoadTime: number; // ms
    failedLazyLoads: number;
    totalRenders: number;
    averageRenderTime: number; // ms
  };
  
  // Timestamp da coleta
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'cache' | 'worker' | 'performance' | 'component';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

export interface PerformanceThresholds {
  cache: {
    minHitRate: number; // %
    maxResponseTime: number; // ms
    maxMemoryUsage: number; // MB
  };
  workers: {
    minSuccessRate: number; // %
    maxCalculationTime: number; // ms
  };
  performance: {
    maxPageLoadTime: number; // ms
    maxFirstContentfulPaint: number; // ms
    maxLargestContentfulPaint: number; // ms
    maxCumulativeLayoutShift: number;
    maxFirstInputDelay: number; // ms
    maxMemoryUsage: number; // %
  };
  components: {
    maxLazyLoadTime: number; // ms
    maxRenderTime: number; // ms
  };
}

class PerformanceMonitorService {
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];
  private intervalId: number | null = null;
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];
  
  // Contadores para métricas
  private workerCalculations = {
    total: 0,
    successful: 0,
    failed: 0,
    cancelled: 0,
    totalTime: 0
  };
  
  private componentMetrics = {
    lazyLoaded: 0,
    lazyLoadTime: 0,
    failedLazyLoads: 0,
    totalRenders: 0,
    totalRenderTime: 0
  };

  constructor() {
    this.metrics = this.initializeMetrics();
    this.thresholds = this.getDefaultThresholds();
    this.setupPerformanceObservers();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      cache: {
        hitRate: 0,
        missRate: 0,
        totalRequests: 0,
        totalHits: 0,
        totalMisses: 0,
        memoryUsage: 0,
        indexedDBUsage: 0,
        averageResponseTime: 0,
        topMissedKeys: []
      },
      workers: {
        totalCalculations: 0,
        averageCalculationTime: 0,
        successRate: 100,
        errorRate: 0,
        cancelledCalculations: 0,
        activeWorkers: 0,
        workerSupported: typeof Worker !== 'undefined'
      },
      performance: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        memoryUsage: {
          used: 0,
          total: 0,
          percentage: 0
        }
      },
      components: {
        lazyLoadedComponents: 0,
        averageLazyLoadTime: 0,
        failedLazyLoads: 0,
        totalRenders: 0,
        averageRenderTime: 0
      },
      timestamp: Date.now()
    };
  }

  private getDefaultThresholds(): PerformanceThresholds {
    return {
      cache: {
        minHitRate: 80, // 80%
        maxResponseTime: 100, // 100ms
        maxMemoryUsage: 50 // 50MB
      },
      workers: {
        minSuccessRate: 95, // 95%
        maxCalculationTime: 5000 // 5s
      },
      performance: {
        maxPageLoadTime: 3000, // 3s
        maxFirstContentfulPaint: 1500, // 1.5s
        maxLargestContentfulPaint: 2500, // 2.5s
        maxCumulativeLayoutShift: 0.1,
        maxFirstInputDelay: 100, // 100ms
        maxMemoryUsage: 80 // 80%
      },
      components: {
        maxLazyLoadTime: 2000, // 2s
        maxRenderTime: 16 // 16ms (60fps)
      }
    };
  }

  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Observer para Web Vitals
    try {
      const vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                this.metrics.performance.firstContentfulPaint = entry.startTime;
              }
              break;
            case 'largest-contentful-paint':
              this.metrics.performance.largestContentfulPaint = entry.startTime;
              break;
            case 'layout-shift':
              if (!('hadRecentInput' in entry) || !(entry as { hadRecentInput?: boolean }).hadRecentInput) {
                this.metrics.performance.cumulativeLayoutShift += ('value' in entry ? (entry as { value: number }).value : 0);
              }
              break;
            case 'first-input':
              this.metrics.performance.firstInputDelay = ('processingStart' in entry ? (entry as { processingStart: number }).processingStart : entry.startTime) - entry.startTime;
              break;
          }
        }
        this.checkThresholds();
        this.notifyListeners();
      });

      vitalsObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
      this.observers.push(vitalsObserver);
    } catch (error) {
      console.warn('Performance Observer não suportado:', error);
    }
  }

  // Métodos públicos para coleta de métricas
  
  public trackWorkerCalculation(duration: number, success: boolean, cancelled = false): void {
    this.workerCalculations.total++;
    this.workerCalculations.totalTime += duration;
    
    if (cancelled) {
      this.workerCalculations.cancelled++;
    } else if (success) {
      this.workerCalculations.successful++;
    } else {
      this.workerCalculations.failed++;
    }
    
    this.updateWorkerMetrics();
  }

  public trackLazyLoad(componentName: string, duration: number, success: boolean): void {
    if (success) {
      this.componentMetrics.lazyLoaded++;
      this.componentMetrics.lazyLoadTime += duration;
    } else {
      this.componentMetrics.failedLazyLoads++;
    }
    
    this.updateComponentMetrics();
  }

  public trackRender(componentName: string, duration: number): void {
    this.componentMetrics.totalRenders++;
    this.componentMetrics.totalRenderTime += duration;
    
    this.updateComponentMetrics();
  }

  public startMonitoring(intervalMs = 30000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = window.setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    // Coleta inicial
    this.collectMetrics();
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public clearAlerts(): void {
    this.alerts = [];
  }

  public onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(callback);
    
    // Retorna função para remover o listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public exportMetrics(): string {
    const exportData = {
      metrics: this.metrics,
      alerts: this.alerts,
      thresholds: this.thresholds,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Métodos privados
  
  private async collectMetrics(): Promise<void> {
    await this.updateCacheMetrics();
    this.updatePerformanceMetrics();
    this.checkThresholds();
    this.notifyListeners();
  }

  private async updateCacheMetrics(): Promise<void> {
    try {
      const cacheStats = cacheService.getStats();
      
      this.metrics.cache = {
        hitRate: cacheStats.hitRate,
        missRate: 100 - cacheStats.hitRate,
        totalRequests: cacheStats.requests,
        totalHits: cacheStats.hits,
        totalMisses: cacheStats.misses,
        memoryUsage: cacheStats.memorySize,
        indexedDBUsage: cacheStats.indexedDBSize,
        averageResponseTime: cacheStats.averageResponseTime,
        topMissedKeys: cacheStats.topMissedKeys || []
      };
    } catch (error) {
      console.error('Erro ao coletar métricas de cache:', error);
    }
  }

  private updateWorkerMetrics(): void {
    const total = this.workerCalculations.total;
    
    if (total > 0) {
      this.metrics.workers = {
        totalCalculations: total,
        averageCalculationTime: this.workerCalculations.totalTime / total,
        successRate: (this.workerCalculations.successful / total) * 100,
        errorRate: (this.workerCalculations.failed / total) * 100,
        cancelledCalculations: this.workerCalculations.cancelled,
        activeWorkers: 0, // Será atualizado externamente
        workerSupported: typeof Worker !== 'undefined'
      };
    }
  }

  private updateComponentMetrics(): void {
    const lazyLoaded = this.componentMetrics.lazyLoaded;
    const totalRenders = this.componentMetrics.totalRenders;
    
    this.metrics.components = {
      lazyLoadedComponents: lazyLoaded,
      averageLazyLoadTime: lazyLoaded > 0 ? this.componentMetrics.lazyLoadTime / lazyLoaded : 0,
      failedLazyLoads: this.componentMetrics.failedLazyLoads,
      totalRenders,
      averageRenderTime: totalRenders > 0 ? this.componentMetrics.totalRenderTime / totalRenders : 0
    };
  }

  private updatePerformanceMetrics(): void {
    // Page Load Time
    if (performance.timing) {
      this.metrics.performance.pageLoadTime = 
        performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    
    // Memory Usage
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      this.metrics.performance.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      };
    }
    
    this.metrics.timestamp = Date.now();
  }

  private checkThresholds(): void {
    const newAlerts: PerformanceAlert[] = [];
    
    // Cache thresholds
    if (this.metrics.cache.hitRate < this.thresholds.cache.minHitRate) {
      newAlerts.push(this.createAlert(
        'cache',
        'warning',
        `Taxa de hit do cache baixa: ${this.metrics.cache.hitRate.toFixed(1)}%`,
        this.metrics.cache.hitRate,
        this.thresholds.cache.minHitRate
      ));
    }
    
    if (this.metrics.cache.averageResponseTime > this.thresholds.cache.maxResponseTime) {
      newAlerts.push(this.createAlert(
        'cache',
        'warning',
        `Tempo de resposta do cache alto: ${this.metrics.cache.averageResponseTime.toFixed(1)}ms`,
        this.metrics.cache.averageResponseTime,
        this.thresholds.cache.maxResponseTime
      ));
    }
    
    // Worker thresholds
    if (this.metrics.workers.successRate < this.thresholds.workers.minSuccessRate) {
      newAlerts.push(this.createAlert(
        'worker',
        'error',
        `Taxa de sucesso dos Workers baixa: ${this.metrics.workers.successRate.toFixed(1)}%`,
        this.metrics.workers.successRate,
        this.thresholds.workers.minSuccessRate
      ));
    }
    
    // Performance thresholds
    if (this.metrics.performance.memoryUsage.percentage > this.thresholds.performance.maxMemoryUsage) {
      newAlerts.push(this.createAlert(
        'performance',
        'warning',
        `Uso de memória alto: ${this.metrics.performance.memoryUsage.percentage}%`,
        this.metrics.performance.memoryUsage.percentage,
        this.thresholds.performance.maxMemoryUsage
      ));
    }
    
    // Adicionar novos alertas
    this.alerts.push(...newAlerts);
    
    // Limitar número de alertas (manter apenas os 50 mais recentes)
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  private createAlert(
    category: PerformanceAlert['category'],
    type: PerformanceAlert['type'],
    message: string,
    value: number,
    threshold: number
  ): PerformanceAlert {
    return {
      id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      message,
      value,
      threshold,
      timestamp: Date.now(),
      resolved: false
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Erro ao notificar listener de métricas:', error);
      }
    });
  }
}

// Instância singleton
export const performanceMonitor = new PerformanceMonitorService();

// Hook React para usar o monitor de performance
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);
  
  React.useEffect(() => {
    const unsubscribe = performanceMonitor.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
      setAlerts(performanceMonitor.getAlerts());
    });
    
    // Iniciar monitoramento
    performanceMonitor.startMonitoring();
    
    return () => {
      unsubscribe();
      performanceMonitor.stopMonitoring();
    };
  }, []);
  
  return {
    metrics,
    alerts,
    clearAlerts: () => {
      performanceMonitor.clearAlerts();
      setAlerts([]);
    },
    exportMetrics: performanceMonitor.exportMetrics.bind(performanceMonitor)
  };
}

// Adicionar React import
import React from 'react';