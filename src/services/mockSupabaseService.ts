/**
 * Mock Service para substituir Supabase
 * Fornece dados locais e evita tentativas de conexão remota
 */

export interface MockResponse<T = any> {
  data: T | null;
  error: any;
  count?: number;
}

export interface MockUser {
  id: string;
  email: string;
  user_metadata: any;
}

export interface MockAuthResponse {
  data: {
    user: MockUser | null;
  };
  error: any;
}

class MockSupabaseService {
  private mockData = {
    proposals: [
      {
        id: '1',
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'pending',
        title: 'Proposta Solar Residencial',
        created_at: new Date().toISOString()
      }
    ],
    users: [
      {
        id: 'user-123',
        email: 'admin@solara.com',
        user_metadata: { name: 'Admin Local' }
      }
    ],
    diagrams: [],
    templates: []
  };

  // Mock Auth
  auth = {
    getUser: async (): Promise<MockAuthResponse> => {
      return {
        data: {
          user: this.mockData.users[0] || null
        },
        error: null
      };
    },
    signInWithPassword: async (credentials: any): Promise<MockAuthResponse> => {
      return {
        data: {
          user: this.mockData.users[0] || null
        },
        error: null
      };
    },
    signOut: async (): Promise<{ error: any }> => {
      return { error: null };
    },
    getSession: async () => {
      return {
        data: {
          session: {
            user: this.mockData.users[0] || null,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          }
        },
        error: null
      };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock implementation - simula um usuário logado
      setTimeout(() => {
        const mockSession = {
          user: this.mockData.users[0] || null,
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token'
        };
        callback('SIGNED_IN', mockSession);
      }, 100);
      
      // Retorna um objeto com subscription para compatibilidade
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              console.log('Mock auth state change unsubscribed');
            }
          }
        }
      };
    }
  };

  // Mock Database Operations
  from(table: string) {
    return {
      select: (columns?: string) => this.createQuery(table, 'select', { columns }),
      insert: (data: any) => this.createQuery(table, 'insert', { data }),
      update: (data: any) => this.createQuery(table, 'update', { data }),
      delete: () => this.createQuery(table, 'delete'),
      upsert: (data: any) => this.createQuery(table, 'upsert', { data })
    };
  }

  private createQuery(table: string, operation: string, options: any = {}) {
    const query = {
      table,
      operation,
      options,
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
        query.filters.push({ type: 'like', column, pattern });
        return query;
      },
      
      in: (column: string, values: any[]) => {
        query.filters.push({ type: 'in', column, values });
        return query;
      },
      
      order: (column: string, options?: { ascending?: boolean }) => {
        query.options.order = { column, ascending: options?.ascending ?? true };
        return query;
      },
      
      limit: (count: number) => {
        query.options.limit = count;
        return query;
      },
      
      range: (from: number, to: number) => {
        query.options.range = { from, to };
        return query;
      },
      
      single: () => {
        query.options.single = true;
        return query;
      },
      
      then: async (resolve: (result: MockResponse) => void) => {
        const result = await this.executeQuery(query);
        resolve(result);
        return result;
      }
    };
    
    return query;
  }

  private async executeQuery(query: any): Promise<MockResponse> {
    try {
      const { table, operation, options, filters } = query;
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let data = this.mockData[table as keyof typeof this.mockData] || [];
      
      // Aplicar filtros
      if (filters.length > 0) {
        data = data.filter((item: any) => {
          return filters.every(filter => {
            const value = item[filter.column];
            switch (filter.type) {
              case 'eq': return value === filter.value;
              case 'neq': return value !== filter.value;
              case 'gt': return value > filter.value;
              case 'gte': return value >= filter.value;
              case 'lt': return value < filter.value;
              case 'lte': return value <= filter.value;
              case 'like': return String(value).includes(filter.pattern.replace('%', ''));
              case 'in': return filter.values.includes(value);
              default: return true;
            }
          });
        });
      }
      
      // Aplicar ordenação
      if (options.order) {
        data.sort((a: any, b: any) => {
          const aVal = a[options.order.column];
          const bVal = b[options.order.column];
          const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return options.order.ascending ? result : -result;
        });
      }
      
      // Aplicar limite
      if (options.limit) {
        data = data.slice(0, options.limit);
      }
      
      // Aplicar range
      if (options.range) {
        data = data.slice(options.range.from, options.range.to + 1);
      }
      
      // Operações específicas
      switch (operation) {
        case 'insert':
          const newItem = { 
            id: Date.now().toString(), 
            ...options.data, 
            created_at: new Date().toISOString() 
          };
          (this.mockData[table as keyof typeof this.mockData] as any[]).push(newItem);
          data = [newItem];
          break;
          
        case 'update':
          data = data.map((item: any) => ({ ...item, ...options.data, updated_at: new Date().toISOString() }));
          break;
          
        case 'delete':
          const originalLength = (this.mockData[table as keyof typeof this.mockData] as any[]).length;
          this.mockData[table as keyof typeof this.mockData] = (this.mockData[table as keyof typeof this.mockData] as any[]).filter((item: any) => {
            return !filters.every(filter => item[filter.column] === filter.value);
          });
          data = [];
          break;
      }
      
      return {
        data: options.single ? (data[0] || null) : data,
        error: null,
        count: data.length
      };
      
    } catch (error) {
      return {
        data: null,
        error: error
      };
    }
  }

  // Mock Storage
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        return {
          data: { path: `mock/${path}` },
          error: null
        };
      },
      
      getPublicUrl: (path: string) => {
        return {
          data: { publicUrl: `http://localhost:3000/mock-storage/${path}` }
        };
      },
      
      remove: async (paths: string[]) => {
        return { error: null };
      }
    })
  };

  // Mock RPC
  rpc = async (functionName: string, params: any) => {
    console.log(`Mock RPC call: ${functionName}`, params);
    return {
      data: null,
      error: null
    };
  };

  // Mock Channel (Realtime)
  channel = (name: string, options?: any) => {
    return {
      on: (event: string, callback: Function) => ({}),
      subscribe: () => ({}),
      unsubscribe: () => ({})
    };
  };

  removeChannel = (channel: any) => {
    // Mock implementation
  };

  // Mock Functions
  functions = {
    invoke: async (functionName: string, options: any) => {
      console.log(`Mock function call: ${functionName}`, options);
      return {
        data: null,
        error: null
      };
    }
  };
}

export const mockSupabase = new MockSupabaseService();
export default mockSupabase;