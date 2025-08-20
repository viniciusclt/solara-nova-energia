/**
 * Sistema de Cache Hierárquico - Solara Nova Energia
 * 
 * Implementa cache em memória + IndexedDB com TTL inteligente,
 * invalidação por dependências e compressão automática.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  dependencies?: string[];
  compressed?: boolean;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  enablePersistence: boolean;
  compressionEnabled: boolean;
  compressionThreshold: number;
}

interface CacheStats {
  memoryHits: number;
  persistentHits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  compressionRatio: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private persistentCache: IDBDatabase | null = null;
  private config: CacheConfig;
  private eventBus = new EventTarget();
  private stats: CacheStats = {
    memoryHits: 0,
    persistentHits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    compressionRatio: 0
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 100,
      enablePersistence: true,
      compressionEnabled: true,
      compressionThreshold: 1024, // 1KB
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
    const startTime = Date.now();
    const serializedData = JSON.stringify(data);
    const shouldCompress = this.config.compressionEnabled && 
                          serializedData.length > this.config.compressionThreshold;
    
    const entry: CacheEntry<T> = {
      data: shouldCompress ? await this.compress(serializedData) : data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.defaultTTL,
      version: options.version || '1.0',
      dependencies: options.dependencies,
      compressed: shouldCompress
    };

    // Cache em memória
    this.memoryCache.set(key, entry);
    
    // Limpar cache se exceder tamanho máximo
    if (this.memoryCache.size > this.config.maxSize) {
      this.evictOldestEntries();
    }

    // Cache persistente (opcional)
    if (options.persistent !== false && this.persistentCache) {
      await this.setPersistent(key, entry);
    }

    // Atualizar estatísticas
    this.updateStats();
    
    // Rastrear performance da operação de escrita
    const responseTime = Date.now() - startTime;
    this.trackPerformance('set', responseTime);

    // Emitir evento de cache atualizado
    this.eventBus.dispatchEvent(new CustomEvent('cache:set', {
      detail: { key, dependencies: options.dependencies }
    }));
  }

  /**
   * Recupera dados do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    // Tentar cache em memória primeiro
    let entry = this.memoryCache.get(key);
    
    if (entry) {
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.stats.misses++;
        return null;
      }
      
      this.stats.memoryHits++;
      const responseTime = Date.now() - startTime;
      this.trackPerformance('hit', responseTime);
      return entry.compressed ? 
        JSON.parse(await this.decompress(entry.data as string)) : 
        entry.data;
    }

    // Se não encontrar, tentar cache persistente
    if (this.persistentCache) {
      entry = await this.getPersistent(key);
      if (entry) {
        if (this.isExpired(entry)) {
          await this.delete(key);
          this.stats.misses++;
          const responseTime = Date.now() - startTime;
          this.trackPerformance('miss', responseTime);
          return null;
        }
        
        // Recarregar no cache em memória
        this.memoryCache.set(key, entry);
        this.stats.persistentHits++;
        const responseTime = Date.now() - startTime;
        this.trackPerformance('hit', responseTime);
        
        return entry.compressed ? 
          JSON.parse(await this.decompress(entry.data as string)) : 
          entry.data;
      }
    }

    this.stats.misses++;
    const responseTime = Date.now() - startTime;
    this.trackPerformance('miss', responseTime);
    this.eventBus.dispatchEvent(new CustomEvent('cache:miss', {
      detail: { key }
    }));
    
    return null;
  }

  /**
   * Remove entrada do cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (this.persistentCache) {
      await this.deletePersistent(key);
    }
  }

  /**
   * Invalida cache baseado em dependências
   */
  async invalidateByDependency(dependency: string): Promise<void> {
    const keysToInvalidate: string[] = [];
    
    // Verificar cache em memória
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        keysToInvalidate.push(key);
      }
    }

    // Verificar cache persistente
    if (this.persistentCache) {
      const persistentKeys = await this.getPersistentKeysByDependency(dependency);
      keysToInvalidate.push(...persistentKeys);
    }

    // Remover duplicatas
    const uniqueKeys = [...new Set(keysToInvalidate)];
    
    for (const key of uniqueKeys) {
      await this.delete(key);
    }

    // Emitir evento de invalidação
    this.eventBus.dispatchEvent(new CustomEvent('cache:invalidate', {
      detail: { dependency, invalidatedKeys: uniqueKeys }
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
      persistent?: boolean;
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
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.persistentCache) {
      const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    this.resetStats();
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    const stats = { ...this.stats };
    
    // Calcular taxa de acerto
    const totalRequests = stats.memoryHits + stats.persistentHits + stats.misses;
    const hitRate = totalRequests > 0 ? (stats.memoryHits + stats.persistentHits) / totalRequests : 0;
    
    return {
      ...stats,
      hitRate,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Configurar listener para eventos de cache
   */
  onCacheEvent(event: 'set' | 'invalidate' | 'miss', callback: (detail: unknown) => void): void {
    this.eventBus.addEventListener(`cache:${event}`, (e: CustomEvent) => {
      callback(e.detail);
    });
  }

  /**
   * Destroi o serviço de cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.memoryCache.clear();
    
    if (this.persistentCache) {
      this.persistentCache.close();
    }
  }

  // Métodos privados

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldestEntries(): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toRemove = entries.slice(0, Math.floor(this.config.maxSize * 0.2));
    toRemove.forEach(([key]) => {
      this.memoryCache.delete(key);
      this.stats.evictions++;
    });
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
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('dependencies', 'dependencies', { multiEntry: true });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  private async setPersistent(key: string, entry: CacheEntry<unknown>): Promise<void> {
    if (!this.persistentCache) return;
    
    const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put({ key, ...entry });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getPersistent(key: string): Promise<CacheEntry<unknown> | null> {
    if (!this.persistentCache) return null;
    
    const transaction = this.persistentCache.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    
    return new Promise<CacheEntry<unknown> | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { key: _, ...entry } = result;
          resolve(entry);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async deletePersistent(key: string): Promise<void> {
    if (!this.persistentCache) return;
    
    const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getPersistentKeysByDependency(dependency: string): Promise<string[]> {
    if (!this.persistentCache) return [];
    
    const transaction = this.persistentCache.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    const index = store.index('dependencies');
    
    return new Promise<string[]>((resolve, reject) => {
      const keys: string[] = [];
      const request = index.openCursor(IDBKeyRange.only(dependency));
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          keys.push(cursor.value.key);
          cursor.continue();
        } else {
          resolve(keys);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private setupCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
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

  private async compress(data: string): Promise<string> {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(data));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      return btoa(String.fromCharCode(...compressed));
    }
    
    // Fallback: retornar dados sem compressão
    return data;
  }

  private async decompress(compressedData: string): Promise<string> {
    if (typeof DecompressionStream !== 'undefined') {
      const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(compressed);
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      return new TextDecoder().decode(decompressed);
    }
    
    // Fallback: retornar dados sem descompressão
    return compressedData;
  }

  private updateStats(): void {
    this.stats.totalSize = this.memoryCache.size;
    
    // Calcular taxa de compressão
    let totalOriginal = 0;
    let totalCompressed = 0;
    
    for (const entry of this.memoryCache.values()) {
      const size = JSON.stringify(entry.data).length;
      totalOriginal += size;
      totalCompressed += entry.compressed ? size * 0.7 : size; // Estimativa
    }
    
    this.stats.compressionRatio = totalOriginal > 0 ? totalCompressed / totalOriginal : 1;
  }

  private resetStats(): void {
    this.stats = {
      memoryHits: 0,
      persistentHits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      compressionRatio: 0
    };
  }

  private trackPerformance(operation: 'hit' | 'miss' | 'set', responseTime: number): void {
    // Simular integração com monitor de performance
    const windowWithMonitor = window as Window & {
      performanceMonitor?: {
        trackCacheHit: (responseTime: number, memoryUsage: number) => void;
        trackCacheMiss: (responseTime: number, memoryUsage: number) => void;
      };
    };
    
    if (typeof window !== 'undefined' && windowWithMonitor.performanceMonitor) {
      const memoryUsage = this.getMemoryUsage();
      
      if (operation === 'hit') {
        windowWithMonitor.performanceMonitor.trackCacheHit(responseTime, memoryUsage);
      } else if (operation === 'miss') {
        windowWithMonitor.performanceMonitor.trackCacheMiss(responseTime, memoryUsage);
      }
    }
  }

  private getMemoryUsage(): number {
    // Estimar uso de memória baseado no número de entradas
    return this.memoryCache.size * 1024; // Estimativa em bytes
  }
}

// Instância singleton
export const cacheService = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 200, // Aumentado para suportar mais dados
  enablePersistence: true,
  compressionEnabled: true,
  compressionThreshold: 1024 // 1KB
});

export type { CacheEntry, CacheConfig, CacheStats };
export { CacheService };