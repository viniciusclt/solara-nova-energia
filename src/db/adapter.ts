// =====================================================
// ADAPTADOR DE BANCO DE DADOS LOCAL
// Substitui as chamadas do Supabase pelo SQLite local
// =====================================================

import { db } from './index';
import { 
  companies, 
  profiles, 
  subscriptions, 
  proposalTemplates, 
  proposalElements, 
  trainingModules, 
  trainingContent, 
  userTrainingProgress, 
  trainingAssessments, 
  auditLogs, 
  notifications,
  diagrams,
  diagramRevisions,
  diagramCollaborators
} from './schema';
import { eq, and, or, like, desc, asc, count, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// TIPOS PARA COMPATIBILIDADE COM SUPABASE
// =====================================================

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  insert: (data: any) => QueryBuilder;
  update: (data: any) => QueryBuilder;
  delete: () => QueryBuilder;
  eq: (column: string, value: any) => QueryBuilder;
  neq: (column: string, value: any) => QueryBuilder;
  gt: (column: string, value: any) => QueryBuilder;
  gte: (column: string, value: any) => QueryBuilder;
  lt: (column: string, value: any) => QueryBuilder;
  lte: (column: string, value: any) => QueryBuilder;
  like: (column: string, value: string) => QueryBuilder;
  ilike: (column: string, value: string) => QueryBuilder;
  in: (column: string, values: any[]) => QueryBuilder;
  is: (column: string, value: any) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  range: (from: number, to: number) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  single: () => QueryBuilder;
  overlaps: (column: string, values: any[]) => QueryBuilder;
  or: (conditions: string) => QueryBuilder;
}

// =====================================================
// CLASSE PRINCIPAL DO ADAPTADOR
// =====================================================

export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  
  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  // =====================================================
  // MÉTODO PRINCIPAL PARA SIMULAR SUPABASE.FROM()
  // =====================================================

  from(tableName: string): QueryBuilder {
    return new LocalQueryBuilder(tableName);
  }

  // =====================================================
  // MÉTODO PARA RPC (STORED PROCEDURES)
  // =====================================================

  async rpc(functionName: string, params?: any): Promise<SupabaseResponse<any>> {
    try {
      // Implementar funções específicas conforme necessário
      switch (functionName) {
        case 'get_audit_stats':
          return this.getAuditStats(params);
        case 'create_audit_log':
          return this.createAuditLog(params);
        case 'log_security_event':
          return this.logSecurityEvent(params);
        case 'sync_google_sheets_fallback':
          return this.syncGoogleSheetsFallback();
        default:
          console.warn(`RPC function '${functionName}' not implemented in local adapter`);
          return { data: null, error: new Error(`Function ${functionName} not implemented`) };
      }
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // =====================================================
  // IMPLEMENTAÇÕES DE FUNÇÕES RPC
  // =====================================================

  private async getAuditStats(params: any): Promise<SupabaseResponse<any>> {
    try {
      const stats = await db.select({
        total: count(),
      }).from(auditLogs);
      
      return { data: stats[0] || { total: 0 }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  private async createAuditLog(params: any): Promise<SupabaseResponse<any>> {
    try {
      const newLog = {
        id: uuidv4(),
        action: params.action,
        table_name: params.table_name,
        record_id: params.record_id,
        old_values: params.old_values ? JSON.stringify(params.old_values) : null,
        new_values: params.new_values ? JSON.stringify(params.new_values) : null,
        user_id: params.user_id,
        created_at: new Date(),
      };

      await db.insert(auditLogs).values(newLog);
      return { data: newLog, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  private async logSecurityEvent(params: any): Promise<SupabaseResponse<any>> {
    try {
      const securityLog = {
        id: uuidv4(),
        action: 'security_event',
        table_name: 'security_logs',
        record_id: params.event_id || uuidv4(),
        new_values: JSON.stringify(params),
        user_id: params.user_id,
        created_at: new Date(),
      };

      await db.insert(auditLogs).values(securityLog);
      return { data: securityLog, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  private async syncGoogleSheetsFallback(): Promise<SupabaseResponse<any>> {
    // Simular sincronização com dados de demonstração
    return {
      data: {
        status: 'success',
        message: 'Sincronização simulada com sucesso - dados de demonstração',
        leads_count: 8,
        simulated_imports: 8,
        demo_leads: [
          'João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa',
          'Roberto Ferreira', 'Pedro Google', 'Fernanda Ads', 'Lucas Campaign'
        ]
      },
      error: null
    };
  }
}

// =====================================================
// QUERY BUILDER LOCAL
// =====================================================

class LocalQueryBuilder implements QueryBuilder {
  private tableName: string;
  private selectColumns: string = '*';
  private whereConditions: any[] = [];
  private orderByClause: { column: string; direction: 'asc' | 'desc' }[] = [];
  private limitCount?: number;
  private offsetCount?: number;
  private insertData?: any;
  private updateData?: any;
  private isDelete = false;
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = '*'): QueryBuilder {
    this.selectColumns = columns;
    return this;
  }

  insert(data: any): QueryBuilder {
    this.insertData = { ...data, id: data.id || uuidv4(), created_at: new Date() };
    return this;
  }

  update(data: any): QueryBuilder {
    this.updateData = { ...data, updated_at: new Date() };
    return this;
  }

  delete(): QueryBuilder {
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: any): QueryBuilder {
    this.whereConditions.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any): QueryBuilder {
    this.whereConditions.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: any): QueryBuilder {
    this.whereConditions.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: any): QueryBuilder {
    this.whereConditions.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: any): QueryBuilder {
    this.whereConditions.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: any): QueryBuilder {
    this.whereConditions.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, value: string): QueryBuilder {
    this.whereConditions.push({ type: 'like', column, value });
    return this;
  }

  ilike(column: string, value: string): QueryBuilder {
    this.whereConditions.push({ type: 'ilike', column, value });
    return this;
  }

  in(column: string, values: any[]): QueryBuilder {
    this.whereConditions.push({ type: 'in', column, values });
    return this;
  }

  is(column: string, value: any): QueryBuilder {
    this.whereConditions.push({ type: 'is', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    this.orderByClause.push({
      column,
      direction: options?.ascending === false ? 'desc' : 'asc'
    });
    return this;
  }

  range(from: number, to: number): QueryBuilder {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitCount = count;
    return this;
  }

  single(): QueryBuilder {
    this.isSingle = true;
    this.limitCount = 1;
    return this;
  }

  overlaps(column: string, values: any[]): QueryBuilder {
    this.whereConditions.push({ type: 'overlaps', column, values });
    return this;
  }

  or(conditions: string): QueryBuilder {
    this.whereConditions.push({ type: 'or', conditions });
    return this;
  }

  // =====================================================
  // EXECUÇÃO DA QUERY
  // =====================================================

  async execute(): Promise<SupabaseResponse<any>> {
    try {
      const table = this.getTableSchema();
      
      if (this.insertData) {
        const result = await db.insert(table).values(this.insertData).returning();
        return { data: this.isSingle ? result[0] : result, error: null };
      }
      
      if (this.updateData) {
        const whereClause = this.buildWhereClause(table);
        const result = await db.update(table).set(this.updateData).where(whereClause).returning();
        return { data: this.isSingle ? result[0] : result, error: null };
      }
      
      if (this.isDelete) {
        const whereClause = this.buildWhereClause(table);
        await db.delete(table).where(whereClause);
        return { data: null, error: null };
      }
      
      // SELECT query
      let query = db.select().from(table);
      
      if (this.whereConditions.length > 0) {
        const whereClause = this.buildWhereClause(table);
        query = query.where(whereClause) as any;
      }
      
      if (this.orderByClause.length > 0) {
        const orderBy = this.orderByClause.map(order => 
          order.direction === 'desc' ? desc(table[order.column]) : asc(table[order.column])
        );
        query = query.orderBy(...orderBy) as any;
      }
      
      if (this.limitCount) {
        query = query.limit(this.limitCount) as any;
      }
      
      if (this.offsetCount) {
        query = query.offset(this.offsetCount) as any;
      }
      
      const result = await query;
      return { data: this.isSingle ? result[0] : result, error: null };
      
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private getTableSchema() {
    switch (this.tableName) {
      case 'companies': return companies;
      case 'profiles': return profiles;
      case 'subscriptions': return subscriptions;
      case 'proposal_templates': return proposalTemplates;
      case 'proposal_elements': return proposalElements;
      case 'training_modules': return trainingModules;
      case 'training_content': return trainingContent;
      case 'user_training_progress': return userTrainingProgress;
      case 'training_assessments': return trainingAssessments;
      case 'audit_logs': return auditLogs;
      case 'notifications': return notifications;
      case 'diagrams': return diagrams;
      case 'diagram_revisions': return diagramRevisions;
      case 'diagram_collaborators': return diagramCollaborators;
      default:
        throw new Error(`Table '${this.tableName}' not found in local schema`);
    }
  }

  private buildWhereClause(table: any) {
    if (this.whereConditions.length === 0) return undefined;
    
    const conditions = this.whereConditions.map(condition => {
      const column = table[condition.column];
      
      switch (condition.type) {
        case 'eq': return eq(column, condition.value);
        case 'neq': return sql`${column} != ${condition.value}`;
        case 'gt': return sql`${column} > ${condition.value}`;
        case 'gte': return sql`${column} >= ${condition.value}`;
        case 'lt': return sql`${column} < ${condition.value}`;
        case 'lte': return sql`${column} <= ${condition.value}`;
        case 'like': return like(column, condition.value);
        case 'ilike': return like(column, condition.value); // SQLite não diferencia case
        case 'in': return sql`${column} IN ${condition.values}`;
        case 'is': return condition.value === null ? sql`${column} IS NULL` : eq(column, condition.value);
        default: return eq(column, condition.value);
      }
    });
    
    return conditions.length === 1 ? conditions[0] : and(...conditions);
  }
}

// =====================================================
// INSTÂNCIA GLOBAL DO ADAPTADOR
// =====================================================

export const localDb = DatabaseAdapter.getInstance();

// =====================================================
// FUNÇÃO PARA SUBSTITUIR SUPABASE
// =====================================================

export const createLocalSupabaseClient = () => {
  return {
    from: (tableName: string) => {
      const builder = localDb.from(tableName);
      // Adicionar then() para compatibilidade com await
      (builder as any).then = (resolve: any, reject: any) => {
        return builder.execute().then(resolve, reject);
      };
      return builder;
    },
    rpc: (functionName: string, params?: any) => localDb.rpc(functionName, params),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      })
    }
  };
};