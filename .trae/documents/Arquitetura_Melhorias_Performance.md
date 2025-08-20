# Arquitetura Técnica - Melhorias de Performance e Funcionalidades

**Data:** Janeiro 2025\
**Versão:** 1.0\
**Tipo:** Documento de Arquitetura

***

## 🎯 Objetivo

Este documento detalha a arquitetura técnica para implementação das melhorias de performance e novas funcionalidades do módulo fotovoltaico, incluindo sistema de cache, web workers, lazy loading e componentes avançados.

## 🚀 Arquitetura de Performance

### 1. Sistema de Cache Hierárquico

#### Estrutura do CacheService

```typescript
// src/services/CacheService.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  dependencies?: string[];
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  enablePersistence: boolean;
  compressionEnabled: boolean;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private persistentCache: IDBDatabase | null = null;
  private config: CacheConfig;
  private eventBus = new EventTarget();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 100,
      enablePersistence: true,
      compressionEnabled: true,
      ...config
    };
    
    this.initializePersistentCache();
    this.setupCleanupInterval();
  }

  /**
   * Armazena dados no cache com TTL e dependências
   */
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      dependencies?: string[];
      version?: string;
      persistent?: boolean;
    } = {}
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.defaultTTL,
      version: options.version || '1.0',
      dependencies: options.dependencies
    };

    // Cache em memória
    this.memoryCache.set(key, entry);
    
    // Limpar cache se exceder tamanho máximo
    if (this.memoryCache.size > this.config.maxSize) {
      this.evictOldestEntries();
    }

    // Cache persistente (opcional)
    if (options.persistent && this.persistentCache) {
      await this.setPersistent(key, entry);
    }

    // Emitir evento de cache atualizado
    this.eventBus.dispatchEvent(new CustomEvent('cache:set', {
      detail: { key, dependencies: options.dependencies }
    }));
  }

  /**
   * Recupera dados do cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Tentar cache em memória primeiro
    let entry = this.memoryCache.get(key);
    
    // Se não encontrar, tentar cache persistente
    if (!entry && this.persistentCache) {
      entry = await this.getPersistent(key);
      if (entry) {
        // Recarregar no cache em memória
        this.memoryCache.set(key, entry);
      }
    }

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (this.isExpired(entry)) {
      await this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Invalida cache baseado em dependências
   */
  async invalidateByDependency(dependency: string): Promise<void> {
    const keysToInvalidate: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        keysToInvalidate.push(key);
      }
    }

    for (const key of keysToInvalidate) {
      await this.delete(key);
    }

    // Emitir evento de invalidação
    this.eventBus.dispatchEvent(new CustomEvent('cache:invalidate', {
      detail: { dependency, invalidatedKeys: keysToInvalidate }
    }));
  }

  /**
   * Cache com função de fallback
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: {
      ttl?: number;
      dependencies?: string[];
      version?: string;
    } = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fallbackFn();
    await this.set(key, data, options);
    
    return data;
  }

  /**
   * Configurar listener para eventos de cache
   */
  onCacheEvent(event: 'set' | 'invalidate' | 'miss', callback: (detail: any) => void): void {
    this.eventBus.addEventListener(`cache:${event}`, (e: any) => {
      callback(e.detail);
    });
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldestEntries(): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toRemove = entries.slice(0, Math.floor(this.config.maxSize * 0.2));
    toRemove.forEach(([key]) => this.memoryCache.delete(key));
  }

  private async initializePersistentCache(): Promise<void> {
    if (!this.config.enablePersistence || typeof indexedDB === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SolaraCacheDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.persistentCache = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Limpar a cada minuto
  }

  private cleanupExpiredEntries(): void {
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Instância singleton
export const cacheService = new CacheService();
```

#### Integração com TarifaService

```typescript
// src/services/TarifaService.ts (atualizado)
import { cacheService } from './CacheService';

class TarifaService {
  /**
   * Buscar tarifa com cache inteligente
   */
  async buscarTarifa(concessionariaId: string): Promise<TarifaConcessionaria> {
    const cacheKey = `tarifa:${concessionariaId}`;
    
    return cacheService.getOrSet(
      cacheKey,
      () => this.buscarTarifaFromAPI(concessionariaId),
      {
        ttl: 24 * 60 * 60 * 1000, // 24 horas
        dependencies: ['tarifas', `concessionaria:${concessionariaId}`],
        version: '2.0'
      }
    );
  }

  /**
   * Atualizar tarifa e invalidar cache
   */
  async atualizarTarifa(concessionariaId: string, novaTarifa: TarifaConcessionaria): Promise<void> {
    await this.salvarTarifaAPI(concessionariaId, novaTarifa);
    
    // Invalidar caches relacionados
    await cacheService.invalidateByDependency(`concessionaria:${concessionariaId}`);
    await cacheService.invalidateByDependency('tarifas');
  }

  /**
   * Calcular tarifa com cache por faixa de consumo
   */
  async calcularTarifaComCache(
    consumo_kwh: number,
    concessionariaId: string,
    incluir_fio_b: boolean = true
  ): Promise<CalculoTarifa> {
    const faixaConsumo = this.determinarFaixaConsumo(consumo_kwh);
    const cacheKey = `calculo:${concessionariaId}:${faixaConsumo}:${incluir_fio_b}`;
    
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const tarifa = await this.buscarTarifa(concessionariaId);
        return this.calcularTarifaFinal(consumo_kwh, tarifa, incluir_fio_b);
      },
      {
        ttl: 60 * 60 * 1000, // 1 hora
        dependencies: [`concessionaria:${concessionariaId}`, 'calculos']
      }
    );
  }

  private determinarFaixaConsumo(consumo_kwh: number): string {
    if (consumo_kwh <= 50) return 'baixo';
    if (consumo_kwh <= 200) return 'medio';
    if (consumo_kwh <= 500) return 'alto';
    return 'muito-alto';
  }
}
```

### 2. Web Workers para Cálculos Pesados

#### Worker Principal

```typescript
// src/workers/financialCalculationWorker.ts
import { CalculadoraSolarService } from '../services/CalculadoraSolarService';

interface WorkerMessage {
  id: string;
  type: 'CALCULATE_FINANCIAL' | 'CALCULATE_VPL' | 'CALCULATE_TIR';
  payload: any;
}

interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  payload: any;
}

class FinancialWorker {
  private calculadora = new CalculadoraSolarService();

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private async handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
    const { id, type, payload } = event.data;

    try {
      switch (type) {
        case 'CALCULATE_FINANCIAL':
          await this.calculateFinancial(id, payload);
          break;
        
        case 'CALCULATE_VPL':
          await this.calculateVPL(id, payload);
          break;
        
        case 'CALCULATE_TIR':
          await this.calculateTIR(id, payload);
          break;
        
        default:
          throw new Error(`Tipo de cálculo não suportado: ${type}`);
      }
    } catch (error) {
      this.postMessage({
        id,
        type: 'ERROR',
        payload: { error: error.message }
      });
    }
  }

  private async calculateFinancial(id: string, params: any): Promise<void> {
    // Emitir progresso inicial
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 0, stage: 'Iniciando cálculos...' }
    });

    // Calcular economia e fluxo de caixa
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 25, stage: 'Calculando economia mensal...' }
    });
    
    const resultado = await this.calculadora.calcularEconomiaFluxoCaixa(params);
    
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 75, stage: 'Calculando indicadores financeiros...' }
    });

    // Calcular indicadores adicionais
    const indicadores = await this.calcularIndicadoresAdicionais(resultado);
    
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 100, stage: 'Finalizando...' }
    });

    // Resultado final
    this.postMessage({
      id,
      type: 'SUCCESS',
      payload: {
        ...resultado,
        indicadores
      }
    });
  }

  private async calculateVPL(id: string, { fluxos, taxa }: any): Promise<void> {
    const vpl = this.calculadora['calcularVPL'](fluxos, taxa);
    
    this.postMessage({
      id,
      type: 'SUCCESS',
      payload: { vpl }
    });
  }

  private async calculateTIR(id: string, { fluxos }: any): Promise<void> {
    const tir = this.calculadora['calcularTIR'](fluxos);
    
    this.postMessage({
      id,
      type: 'SUCCESS',
      payload: { tir }
    });
  }

  private async calcularIndicadoresAdicionais(resultado: any): Promise<any> {
    // Simular cálculos adicionais pesados
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      roi_anual: resultado.economia_total / resultado.investimento_inicial * 100,
      economia_acumulada_10_anos: resultado.fluxo_caixa.slice(0, 120).reduce((acc, val) => acc + val, 0),
      reducao_co2: resultado.geracao_total * 0.0817, // kg CO2/kWh
      arvores_equivalentes: (resultado.geracao_total * 0.0817) / 22 // 22kg CO2/árvore/ano
    };
  }

  private postMessage(response: WorkerResponse): void {
    self.postMessage(response);
  }
}

// Inicializar worker
new FinancialWorker();
```

#### Hook para Interação com Worker

```typescript
// src/hooks/useFinancialWorker.ts
import { useCallback, useEffect, useRef, useState } from 'react';

interface WorkerState {
  loading: boolean;
  progress: number;
  stage: string;
  result: any;
  error: string | null;
}

interface UseFinancialWorkerReturn {
  calculateFinancial: (params: any) => Promise<any>;
  calculateVPL: (fluxos: number[], taxa: number) => Promise<number>;
  calculateTIR: (fluxos: number[]) => Promise<number>;
  state: WorkerState;
  cancelCalculation: () => void;
}

export function useFinancialWorker(): UseFinancialWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingCalculations = useRef(new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>());
  
  const [state, setState] = useState<WorkerState>({
    loading: false,
    progress: 0,
    stage: '',
    result: null,
    error: null
  });

  // Inicializar worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/financialCalculationWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event) => {
        const { id, type, payload } = event.data;
        const pending = pendingCalculations.current.get(id);

        if (!pending) return;

        switch (type) {
          case 'SUCCESS':
            setState(prev => ({ ...prev, loading: false, result: payload, error: null }));
            pending.resolve(payload);
            pendingCalculations.current.delete(id);
            break;

          case 'ERROR':
            setState(prev => ({ ...prev, loading: false, error: payload.error }));
            pending.reject(new Error(payload.error));
            pendingCalculations.current.delete(id);
            break;

          case 'PROGRESS':
            setState(prev => ({
              ...prev,
              progress: payload.progress,
              stage: payload.stage
            }));
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setState(prev => ({ ...prev, loading: false, error: 'Erro no worker' }));
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const executeCalculation = useCallback(
    (type: string, payload: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker não disponível'));
          return;
        }

        const id = `calc_${Date.now()}_${Math.random()}`;
        pendingCalculations.current.set(id, { resolve, reject });

        setState(prev => ({ ...prev, loading: true, progress: 0, stage: '', error: null }));

        workerRef.current.postMessage({ id, type, payload });

        // Timeout de 30 segundos
        setTimeout(() => {
          if (pendingCalculations.current.has(id)) {
            pendingCalculations.current.delete(id);
            setState(prev => ({ ...prev, loading: false, error: 'Timeout na operação' }));
            reject(new Error('Timeout na operação'));
          }
        }, 30000);
      });
    },
    []
  );

  const calculateFinancial = useCallback(
    (params: any) => executeCalculation('CALCULATE_FINANCIAL', params),
    [executeCalculation]
  );

  const calculateVPL = useCallback(
    (fluxos: number[], taxa: number) => executeCalculation('CALCULATE_VPL', { fluxos, taxa }),
    [executeCalculation]
  );

  const calculateTIR = useCallback(
    (fluxos: number[]) => executeCalculation('CALCULATE_TIR', { fluxos }),
    [executeCalculation]
  );

  const cancelCalculation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      // Recriar worker
      workerRef.current = new Worker(
        new URL('../workers/financialCalculationWorker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    
    pendingCalculations.current.clear();
    setState(prev => ({ ...prev, loading: false, progress: 0, stage: '', error: null }));
  }, []);

  return {
    calculateFinancial,
    calculateVPL,
    calculateTIR,
    state,
    cancelCalculation
  };
}
```

### 3. Lazy Loading e Code Splitting

#### Componentes Lazy

```typescript
// src/components/FinancialAnalysis/FinancialAnalysisLazy.tsx
import React, { Suspense } from 'react';
import { LoadingBoundary } from '../ui/LoadingBoundary';

// Lazy loading do componente principal
const FinancialAnalysisComplete = React.lazy(() => 
  import('./FinancialAnalysisComplete').then(module => ({
    default: module.FinancialAnalysisComplete
  }))
);

// Lazy loading dos sub-componentes
const FinancialCharts = React.lazy(() => 
  import('./FinancialCharts').then(module => ({
    default: module.FinancialCharts
  }))
);

const FinancialReport = React.lazy(() => 
  import('./FinancialReport').then(module => ({
    default: module.FinancialReport
  }))
);

interface FinancialAnalysisLazyProps {
  currentLead: any;
  onResultsChange?: (results: any) => void;
}

export function FinancialAnalysisLazy(props: FinancialAnalysisLazyProps) {
  return (
    <LoadingBoundary 
      fallback="Carregando análise financeira..."
      errorMessage="Erro ao carregar análise financeira"
    >
      <Suspense fallback={<FinancialAnalysisSkeleton />}>
        <FinancialAnalysisComplete {...props} />
      </Suspense>
    </LoadingBoundary>
  );
}

// Skeleton loading
function FinancialAnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}
```

#### LoadingBoundary Component

```typescript
// src/components/ui/LoadingBoundary.tsx
import React, { Component, ReactNode, Suspense } from 'react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | string;
  errorMessage?: string;
  onRetry?: () => void;
}

interface LoadingBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LoadingBoundary extends Component<LoadingBoundaryProps, LoadingBoundaryState> {
  constructor(props: LoadingBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LoadingBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LoadingBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>
              {this.props.errorMessage || 'Erro ao carregar componente'}
              {this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Detalhes do erro</summary>
                  <pre className="mt-1 text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    const fallback = typeof this.props.fallback === 'string' 
      ? <div className="flex items-center justify-center p-8 text-muted-foreground">
          {this.props.fallback}
        </div>
      : this.props.fallback;

    return (
      <Suspense fallback={fallback}>
        {this.props.children}
      </Suspense>
    );
  }
}
```

## 📊 Métricas de Performance

### Benchmarks Esperados

| Métrica                     | Antes   | Depois  | Melhoria |
| --------------------------- | ------- | ------- | -------- |
| Tempo de cálculo financeiro | 2-5s    | 0.5-1s  | 75%      |
| Carregamento inicial        | 3-4s    | 1-2s    | 60%      |
| Uso de memória              | 50-80MB | 30-50MB | 40%      |
| Cache hit rate              | 0%      | 80%+    | N/A      |
| Bundle size                 | 2MB     | 1.2MB   | 40%      |

### Monitoramento

```typescript
// src/utils/performanceMonitor.ts
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, number[]>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Manter apenas os últimos 100 valores
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(label: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) {
      return null;
    }

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  exportMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [label, values] of this.metrics.entries()) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
```

***

**Documento criado por:** SOLO Document\
**Última atualização:** Janeiro 2025
