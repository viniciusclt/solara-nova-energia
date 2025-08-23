/**
 * Serviço de Banco de Dados Local SQLite
 * Substitui o Supabase para desenvolvimento e fallback
 */

import { logInfo, logError, logWarn } from '../utils/secureLogger';

interface DatabaseConfig {
  name: string;
  version: number;
  stores: string[];
}

interface QueryResult<T = any> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

interface SingleResult<T = any> {
  data: T | null;
  error: Error | null;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private config: DatabaseConfig = {
    name: 'solara_local_db',
    version: 2,
    stores: [
      'proposal_templates',
      'proposal_elements', 
      'proposals',
      'companies',
      'users',
      'training_modules',
      'videos',
      'audit_logs',
      // Novas stores para DiagramService
      'diagrams',
      'diagram_versions',
      'diagram_permissions',
      'diagram_thumbnails'
    ]
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        const error = new Error('Falha ao abrir banco de dados local');
        logError('Erro ao inicializar banco local', 'LocalDatabase', { error: request.error });
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        logInfo('Banco de dados local inicializado com sucesso', 'LocalDatabase');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar object stores
        this.config.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            
            // Criar índices comuns
            if (storeName === 'proposals') {
              store.createIndex('company_id', 'company_id', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }
            if (storeName === 'proposal_elements') {
              store.createIndex('proposal_id', 'proposal_id', { unique: false });
            }
            if (storeName === 'users') {
              store.createIndex('email', 'email', { unique: true });
            }
            // Índices específicos para DiagramService
            if (storeName === 'diagrams') {
              store.createIndex('createdById', 'createdById', { unique: false });
              store.createIndex('type', 'type', { unique: false });
              store.createIndex('updatedAt', 'updatedAt', { unique: false });
              store.createIndex('title', 'title', { unique: false });
            }
            if (storeName === 'diagram_versions') {
              store.createIndex('diagramId', 'diagramId', { unique: false });
              store.createIndex('versionLabel', 'versionLabel', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
            if (storeName === 'diagram_permissions') {
              store.createIndex('diagramId', 'diagramId', { unique: false });
              store.createIndex('userId', 'userId', { unique: false });
              store.createIndex('role', 'role', { unique: false });
            }
            if (storeName === 'diagram_thumbnails') {
              store.createIndex('diagramId', 'diagramId', { unique: false });
            }
            
            logInfo(`Object store '${storeName}' criado`, 'LocalDatabase');
          }
        });
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Simular API do Supabase
  from(table: string) {
    return {
      select: (columns: string = '*') => this.createQuery(table, 'select', { columns }),
      insert: (data: any) => this.createQuery(table, 'insert', { data }),
      update: (data: any) => this.createQuery(table, 'update', { data }),
      delete: () => this.createQuery(table, 'delete', {})
    };
  }

  private createQuery(table: string, operation: string, params: any) {
    const query = {
      table,
      operation,
      params,
      filters: [] as any[],
      
      eq: (column: string, value: any) => {
        query.filters.push({ type: 'eq', column, value });
        return query;
      },
      
      neq: (column: string, value: any) => {
        query.filters.push({ type: 'neq', column, value });
        return query;
      },
      
      gt: (column: string, value: any) => {
        query.filters.push({ type: 'gt', column, value });
        return query;
      },
      
      gte: (column: string, value: any) => {
        query.filters.push({ type: 'gte', column, value });
        return query;
      },
      
      lt: (column: string, value: any) => {
        query.filters.push({ type: 'lt', column, value });
        return query;
      },
      
      lte: (column: string, value: any) => {
        query.filters.push({ type: 'lte', column, value });
        return query;
      },
      
      like: (column: string, pattern: string) => {
        query.filters.push({ type: 'like', column, value: pattern });
        return query;
      },
      
      in: (column: string, values: any[]) => {
        query.filters.push({ type: 'in', column, value: values });
        return query;
      },
      
      order: (column: string, options?: { ascending?: boolean }) => {
        query.params.orderBy = { column, ascending: options?.ascending !== false };
        return query;
      },
      
      limit: (count: number) => {
        query.params.limit = count;
        return query;
      },
      
      range: (from: number, to: number) => {
        query.params.range = { from, to };
        return query;
      },
      
      single: async (): Promise<SingleResult> => {
        const result = await this.executeQuery(query);
        return {
          data: result.data && result.data.length > 0 ? result.data[0] : null,
          error: result.error
        };
      },
      
      then: async (callback?: (result: QueryResult) => void): Promise<QueryResult> => {
        const result = await this.executeQuery(query);
        if (callback) callback(result);
        return result;
      }
    };
    
    return query;
  }

  private async executeQuery(query: any): Promise<QueryResult> {
    try {
      await this.ensureInitialized();
      
      if (!this.db) {
        throw new Error('Banco de dados não inicializado');
      }

      const transaction = this.db.transaction([query.table], 
        query.operation === 'select' ? 'readonly' : 'readwrite'
      );
      const store = transaction.objectStore(query.table);

      switch (query.operation) {
        case 'select':
          return await this.handleSelect(store, query);
        case 'insert':
          return await this.handleInsert(store, query);
        case 'update':
          return await this.handleUpdate(store, query);
        case 'delete':
          return await this.handleDelete(store, query);
        default:
          throw new Error(`Operação não suportada: ${query.operation}`);
      }
    } catch (error) {
      logError('Erro ao executar query', 'LocalDatabase', { error, query });
      return { data: null, error: error as Error };
    }
  }

  private async handleSelect(store: IDBObjectStore, query: any): Promise<QueryResult> {
    return new Promise((resolve) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        let results = request.result;
        
        // Aplicar filtros
        if (query.filters.length > 0) {
          results = results.filter((item: any) => {
            return query.filters.every((filter: any) => {
              const value = item[filter.column];
              
              switch (filter.type) {
                case 'eq': return value === filter.value;
                case 'neq': return value !== filter.value;
                case 'gt': return value > filter.value;
                case 'gte': return value >= filter.value;
                case 'lt': return value < filter.value;
                case 'lte': return value <= filter.value;
                case 'like': return String(value).includes(filter.value.replace('%', ''));
                case 'in': return filter.value.includes(value);
                default: return true;
              }
            });
          });
        }
        
        // Aplicar ordenação
        if (query.params.orderBy) {
          const { column, ascending } = query.params.orderBy;
          results.sort((a: any, b: any) => {
            const aVal = a[column];
            const bVal = b[column];
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return ascending ? comparison : -comparison;
          });
        }
        
        // Aplicar paginação
        if (query.params.range) {
          const { from, to } = query.params.range;
          results = results.slice(from, to + 1);
        } else if (query.params.limit) {
          results = results.slice(0, query.params.limit);
        }
        
        resolve({ data: results, error: null, count: results.length });
      };
      
      request.onerror = () => {
        resolve({ data: null, error: new Error('Erro ao buscar dados') });
      };
    });
  }

  private async handleInsert(store: IDBObjectStore, query: any): Promise<QueryResult> {
    return new Promise((resolve) => {
      const data = Array.isArray(query.params.data) ? query.params.data : [query.params.data];
      const results: any[] = [];
      let completed = 0;
      
      data.forEach((item: any) => {
        const itemWithTimestamp = {
          ...item,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const request = store.add(itemWithTimestamp);
        
        request.onsuccess = () => {
          results.push({ ...itemWithTimestamp, id: request.result });
          completed++;
          
          if (completed === data.length) {
            resolve({ data: results, error: null });
          }
        };
        
        request.onerror = () => {
          resolve({ data: null, error: new Error('Erro ao inserir dados') });
        };
      });
    });
  }

  private async handleUpdate(store: IDBObjectStore, query: any): Promise<QueryResult> {
    return new Promise(async (resolve) => {
      // Primeiro, buscar os registros que atendem aos filtros
      const selectQuery = { ...query, operation: 'select', params: { columns: '*' } };
      const selectResult = await this.handleSelect(store, selectQuery);
      
      if (selectResult.error || !selectResult.data) {
        resolve({ data: null, error: selectResult.error });
        return;
      }
      
      const results: any[] = [];
      let completed = 0;
      
      selectResult.data.forEach((item: any) => {
        const updatedItem = {
          ...item,
          ...query.params.data,
          updated_at: new Date().toISOString()
        };
        
        const request = store.put(updatedItem);
        
        request.onsuccess = () => {
          results.push(updatedItem);
          completed++;
          
          if (completed === selectResult.data!.length) {
            resolve({ data: results, error: null });
          }
        };
        
        request.onerror = () => {
          resolve({ data: null, error: new Error('Erro ao atualizar dados') });
        };
      });
      
      if (selectResult.data.length === 0) {
        resolve({ data: [], error: null });
      }
    });
  }

  private async handleDelete(store: IDBObjectStore, query: any): Promise<QueryResult> {
    return new Promise(async (resolve) => {
      // Primeiro, buscar os registros que atendem aos filtros
      const selectQuery = { ...query, operation: 'select', params: { columns: '*' } };
      const selectResult = await this.handleSelect(store, selectQuery);
      
      if (selectResult.error || !selectResult.data) {
        resolve({ data: null, error: selectResult.error });
        return;
      }
      
      let completed = 0;
      
      selectResult.data.forEach((item: any) => {
        const request = store.delete(item.id);
        
        request.onsuccess = () => {
          completed++;
          
          if (completed === selectResult.data!.length) {
            resolve({ data: [], error: null });
          }
        };
        
        request.onerror = () => {
          resolve({ data: null, error: new Error('Erro ao deletar dados') });
        };
      });
      
      if (selectResult.data.length === 0) {
        resolve({ data: [], error: null });
      }
    });
  }

  // Métodos de autenticação simulados
  auth = {
    getUser: async () => {
      return {
        data: {
          user: {
            id: 'local-user-id',
            email: 'user@local.dev',
            user_metadata: {
              name: 'Usuário Local'
            }
          }
        },
        error: null
      };
    }
  };

  // Métodos de storage simulados
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        // Simular upload salvando no localStorage
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = () => {
            const key = `storage_${bucket}_${path}`;
            localStorage.setItem(key, reader.result as string);
            resolve({
              data: { path, fullPath: `${bucket}/${path}` },
              error: null
            });
          };
          reader.readAsDataURL(file);
        });
      },
      
      getPublicUrl: (path: string) => {
        return {
          data: {
            publicUrl: `data:application/octet-stream;base64,${localStorage.getItem(`storage_${bucket}_${path}`) || ''}`
          }
        };
      },
      
      remove: async (paths: string[]) => {
        paths.forEach(path => {
          localStorage.removeItem(`storage_${bucket}_${path}`);
        });
        return { data: null, error: null };
      }
    })
  };

  // Métodos RPC simulados
  rpc = async (functionName: string, params: any) => {
    logWarn(`RPC simulado: ${functionName}`, 'LocalDatabase', params);
    return { data: null, error: null };
  };

  // Métodos de canal simulados
  channel = (name: string) => ({
    on: () => ({}),
    subscribe: () => ({}),
    unsubscribe: () => ({})
  });

  removeChannel = () => {};
}

// Instância singleton
export const localDatabase = new LocalDatabase();

// Função para verificar se deve usar banco local
export const shouldUseLocalDatabase = (): boolean => {
  const isDev = import.meta.env.DEV;
  const hasSupabaseConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Usar banco local se:
  // 1. Estiver em desenvolvimento E não tiver configuração do Supabase
  // 2. OU se a variável VITE_USE_LOCAL_DB estiver definida como true
  return (isDev && !hasSupabaseConfig) || import.meta.env.VITE_USE_LOCAL_DB === 'true';
};