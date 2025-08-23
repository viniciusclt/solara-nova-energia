import { supabase } from '@/integrations/supabase/client';
import { 
  DashboardData, 
  DashboardMetrics, 
  ChartData, 
  ActivityItem, 
  QuickStats,
  DashboardFilters,
  ExportOptions,
  KPITarget,
  TeamMember,
  CompanyMetrics
} from '@/types/dashboard';

export class DashboardService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static circuitBreaker = {
    failures: 0,
    lastFailure: 0,
    threshold: 3,
    timeout: 30000 // 30 segundos
  };
  /**
   * Busca todos os dados do dashboard para um usuário
   */
  static async getDashboardData(userId: string, filters?: DashboardFilters): Promise<DashboardData> {
    try {
      const [metrics, charts, activity, stats] = await Promise.all([
        this.getMetrics(userId, filters),
        this.getChartData(userId),
        this.getRecentActivity(userId),
        this.getQuickStats(userId)
      ]);

      return {
        metrics,
        charts,
        recentActivity: activity,
        quickStats: stats
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw new Error('Falha ao carregar dados do dashboard');
    }
  }

  /**
   * Busca métricas principais do dashboard
   */
  static async getMetrics(userId: string, filters?: DashboardFilters): Promise<DashboardMetrics> {
    try {
      console.log(`[DashboardService] 🔄 Usando dados locais para usuário: ${userId}`);
      
      // Como estamos usando banco local, retornamos diretamente os dados de fallback
      // que simulam um usuário com empresa e dados realistas
      const mockUser = {
        id: userId,
        email: 'usuario@solara.com.br',
        full_name: 'Usuário Demo',
        company_id: 'company-demo-123'
      };

      console.log(`[DashboardService] ✅ Retornando métricas de fallback para usuário local`);
      return this.getFallbackMetrics(userId, mockUser);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      throw error;
    }
  }

  /**
   * Busca dados para gráficos
   */
  static async getChartData(userId: string): Promise<ChartData[]> {
    try {
      console.log(`[DashboardService] 📊 Usando dados locais para gráficos do usuário: ${userId}`);
      
      // Retornamos diretamente os dados de fallback para o banco local
      console.log(`[DashboardService] ✅ Retornando gráficos de fallback para usuário local`);
      return this.getFallbackChartData();
    } catch (error) {
      console.error('Erro ao buscar dados de gráficos:', error);
      return [];
    }
  }

  /**
   * Busca atividades recentes
   */
  static async getRecentActivity(userId: string, limit: number = 10): Promise<ActivityItem[]> {
    return this.executeWithCircuitBreaker(
      async () => {
        console.log(`[DashboardService] 📋 Usando dados locais para atividades do usuário: ${userId}`);
        
        // Retornamos diretamente os dados de fallback para o banco local
        console.log(`[DashboardService] ✅ Retornando atividades de fallback para usuário local`);
        return this.getFallbackActivities(limit);
      },
      () => this.getFallbackActivities(limit),
      'getRecentActivity'
    );
  }

  /**
   * Busca estatísticas rápidas
   */
  static async getQuickStats(userId: string): Promise<QuickStats> {
    try {
      console.log(`[DashboardService] 📈 Usando dados locais para estatísticas do usuário: ${userId}`);
      
      // Retornamos diretamente os dados de fallback para o banco local
      console.log(`[DashboardService] ✅ Retornando estatísticas de fallback para usuário local`);
      return this.getFallbackQuickStats();
    } catch (error) {
      console.error('Erro ao buscar estatísticas rápidas:', error);
      return {
        activeUsers: 0,
        completedTrainings: 0,
        pendingTasks: 0,
        systemHealth: 'critical'
      };
    }
  }

  /**
   * Busca métricas de receita
   */
  private static async getRevenueMetrics(companyId: string, dateFilter: { start: string; end: string }) {
    // Por enquanto, retornar dados simulados
    // TODO: Implementar busca real de dados de receita
    const thisMonth = 85000;
    const lastMonth = 72000;
    const growth = ((thisMonth - lastMonth) / lastMonth) * 100;

    return {
      total: 450000,
      thisMonth,
      lastMonth,
      growth: Math.round(growth * 100) / 100,
      target: 100000
    };
  }

  /**
   * Busca métricas de performance
   */
  private static async getPerformanceMetrics(companyId: string, dateFilter: { start: string; end: string }) {
    // Por enquanto, retornar dados simulados
    // TODO: Implementar busca real de dados de performance
    return {
      avgResponseTime: 2.3,
      customerSatisfaction: 4.7,
      teamEfficiency: 87,
      goalCompletion: 92
    };
  }

  /**
   * Gera dados para gráfico de receita
   */
  private static async generateRevenueChart(companyId: string): Promise<ChartData> {
    // Gerar dados dos últimos 6 meses
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      const value = 60000 + Math.random() * 40000; // Dados simulados
      
      months.push({
        month: monthName,
        value: Math.round(value)
      });
    }

    return {
      id: 'revenue',
      type: 'line',
      title: 'Receita Mensal',
      data: months,
      config: {
        xKey: 'month',
        yKey: 'value',
        color: '#0EA5E9',
        gradient: true
      }
    };
  }

  /**
   * Gera dados para gráfico de propostas
   */
  private static async generateProposalsChart(companyId: string): Promise<ChartData> {
    try {
      const { data: proposals } = await supabase
        .from('proposals')
        .select('status')
        .eq('company_id', companyId);

      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0
      };

      proposals?.forEach(proposal => {
        if (proposal.status in statusCounts) {
          statusCounts[proposal.status as keyof typeof statusCounts]++;
        }
      });

      return {
        id: 'proposals',
        type: 'pie',
        title: 'Propostas por Status',
        data: [
          { name: 'Pendentes', value: statusCounts.pending, color: '#F59E0B' },
          { name: 'Aprovadas', value: statusCounts.approved, color: '#10B981' },
          { name: 'Rejeitadas', value: statusCounts.rejected, color: '#EF4444' }
        ],
        config: {
          xKey: 'name',
          yKey: 'value',
          color: '#0EA5E9'
        }
      };
    } catch (error) {
      console.error('Erro ao gerar gráfico de propostas:', error);
      return {
        id: 'proposals',
        type: 'pie',
        title: 'Propostas por Status',
        data: [],
        config: { xKey: 'name', yKey: 'value', color: '#0EA5E9' }
      };
    }
  }

  /**
   * Gera dados para gráfico de performance
   */
  private static async generatePerformanceChart(companyId: string): Promise<ChartData> {
    // Dados simulados de performance da equipe
    const teamData = [
      { name: 'Vendas', efficiency: 92, satisfaction: 4.8 },
      { name: 'Suporte', efficiency: 88, satisfaction: 4.6 },
      { name: 'Técnico', efficiency: 95, satisfaction: 4.9 },
      { name: 'Comercial', efficiency: 85, satisfaction: 4.5 }
    ];

    return {
      id: 'performance',
      type: 'bar',
      title: 'Performance por Equipe',
      data: teamData,
      config: {
        xKey: 'name',
        yKey: 'efficiency',
        color: '#8B5CF6'
      }
    };
  }

  /**
   * Exporta dados do dashboard
   */
  static async exportDashboard(userId: string, options: ExportOptions): Promise<Blob> {
    try {
      const data = await this.getDashboardData(userId);
      
      switch (options.format) {
        case 'json':
          return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        case 'csv':
          const csv = this.convertToCSV(data);
          return new Blob([csv], { type: 'text/csv' });
        
        default:
          throw new Error(`Formato ${options.format} não suportado`);
      }
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      throw error;
    }
  }

  /**
   * Converte dados para formato CSV
   */
  private static convertToCSV(data: DashboardData): string {
    const lines = [];
    
    // Cabeçalho
    lines.push('Tipo,Métrica,Valor');
    
    // Métricas de propostas
    lines.push(`Propostas,Total,${data.metrics.proposals.total}`);
    lines.push(`Propostas,Este Mês,${data.metrics.proposals.thisMonth}`);
    lines.push(`Propostas,Pendentes,${data.metrics.proposals.pending}`);
    lines.push(`Propostas,Aprovadas,${data.metrics.proposals.approved}`);
    lines.push(`Propostas,Rejeitadas,${data.metrics.proposals.rejected}`);
    lines.push(`Propostas,Taxa de Conversão,${data.metrics.proposals.conversionRate}%`);
    
    // Métricas de receita
    lines.push(`Receita,Total,R$ ${data.metrics.revenue.total.toLocaleString('pt-BR')}`);
    lines.push(`Receita,Este Mês,R$ ${data.metrics.revenue.thisMonth.toLocaleString('pt-BR')}`);
    lines.push(`Receita,Mês Anterior,R$ ${data.metrics.revenue.lastMonth.toLocaleString('pt-BR')}`);
    lines.push(`Receita,Crescimento,${data.metrics.revenue.growth}%`);
    
    return lines.join('\n');
  }

  /**
   * Busca KPIs e metas
   */
  static async getKPITargets(userId: string): Promise<KPITarget[]> {
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (!user?.company_id) {
        return [];
      }

      // Por enquanto, retornar dados simulados
      // TODO: Implementar tabela de KPIs no banco
      return [
        {
          id: '1',
          name: 'Propostas Mensais',
          currentValue: 45,
          targetValue: 50,
          unit: 'propostas',
          period: 'monthly',
          status: 'at-risk',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Taxa de Conversão',
          currentValue: 68,
          targetValue: 70,
          unit: '%',
          period: 'monthly',
          status: 'at-risk',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Receita Mensal',
          currentValue: 85000,
          targetValue: 100000,
          unit: 'R$',
          period: 'monthly',
          status: 'behind',
          lastUpdated: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
      return [];
    }
  }

  /**
   * Busca membros da equipe
   */
  static async getTeamMembers(userId: string): Promise<TeamMember[]> {
    try {
      console.log(`[DashboardService] 👥 Usando dados locais para membros da equipe do usuário: ${userId}`);
      
      // Retornamos dados de fallback para membros da equipe
      const mockTeamMembers: TeamMember[] = [
        {
          id: 'member-1',
          name: 'Ana Silva',
          email: 'ana.silva@empresa.com',
          avatar: undefined,
          role: 'Gerente de Vendas',
          department: 'Vendas',
          isOnline: true,
          lastActive: new Date().toISOString(),
          performance: {
            score: 85,
            trend: 'up',
            completedTasks: 15,
            pendingTasks: 3
          }
        },
        {
          id: 'member-2',
          name: 'Carlos Santos',
          email: 'carlos.santos@empresa.com',
          avatar: undefined,
          role: 'Analista',
          department: 'Operações',
          isOnline: false,
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          performance: {
            score: 78,
            trend: 'stable',
            completedTasks: 12,
            pendingTasks: 5
          }
        },
        {
          id: 'member-3',
          name: 'Maria Oliveira',
          email: 'maria.oliveira@empresa.com',
          avatar: undefined,
          role: 'Coordenadora',
          department: 'Marketing',
          isOnline: true,
          lastActive: new Date().toISOString(),
          performance: {
            score: 92,
            trend: 'up',
            completedTasks: 18,
            pendingTasks: 2
          }
        }
      ];
      
      console.log(`[DashboardService] ✅ Retornando ${mockTeamMembers.length} membros da equipe`);
      return mockTeamMembers;
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
      return [];
    }
  }

  /**
   * Atualiza cache do dashboard
   */
  static async refreshCache(userId: string): Promise<void> {
    try {
      // Implementar lógica de cache se necessário
      console.log('Cache do dashboard atualizado para usuário:', userId);
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
    }
  }

  /**
   * Subscreve a atualizações em tempo real
   */
  static subscribeToUpdates(userId: string, callback: (data: Record<string, unknown>) => void): () => void {
    try {
      // Mock subscription para atualizações em tempo real
      // Como estamos usando banco local, simulamos atualizações periódicas
      console.log('📡 Iniciando mock subscription para atualizações do dashboard');
      
      const interval = setInterval(() => {
        // Simula uma atualização periódica com dados mock
        callback({
          type: 'dashboard_update',
          timestamp: new Date().toISOString(),
          data: {
            proposals_count: Math.floor(Math.random() * 10) + 1,
            revenue: Math.floor(Math.random() * 50000) + 10000
          }
        });
      }, 30000); // Atualiza a cada 30 segundos

      return () => {
        clearInterval(interval);
        console.log('📡 Mock subscription cancelada');
      };
    } catch (error) {
      console.error('Erro ao subscrever atualizações:', error);
      return () => {};
    }
  }

  // ========================================
  // FUNÇÕES DE FALLBACK PARA USUÁRIOS SEM EMPRESA
  // ========================================

  /**
   * Retorna métricas padrão para usuários sem empresa
   */
  private static async getFallbackMetrics(userId: string, user: Record<string, unknown> | null): Promise<DashboardMetrics> {
    console.log(`[DashboardService] 📊 Aplicando fallback de métricas locais para usuário ${userId}`);
    
    // Retornamos métricas simuladas para o banco local
    return {
      proposals: {
        total: 25,
        thisMonth: 8,
        pending: 3,
        approved: 4,
        rejected: 1,
        conversionRate: 80
      },
      revenue: {
        total: 125000,
        thisMonth: 45000,
        lastMonth: 38000,
        growth: 18.4,
        target: 50000,
        forecast: 52000
      },
      performance: {
        efficiency: 85,
        productivity: 78,
        quality: 92,
        satisfaction: 88
      }
    };
  }

  /**
   * Retorna gráficos vazios para usuários sem empresa
   */
  private static getFallbackChartData(): ChartData[] {
    console.log(`[DashboardService] Retornando gráficos de fallback`);
    
    return [
      {
        id: 'revenue-fallback',
        type: 'line',
        title: 'Receita Mensal',
        data: [],
        config: {
          xKey: 'month',
          yKey: 'value',
          color: '#10B981'
        }
      },
      {
        id: 'proposals-fallback',
        type: 'bar',
        title: 'Propostas por Status',
        data: [],
        config: {
          xKey: 'status',
          yKey: 'count',
          color: '#3B82F6'
        }
      },
      {
        id: 'performance-fallback',
        type: 'area',
        title: 'Performance da Equipe',
        data: [],
        config: {
          xKey: 'name',
          yKey: 'efficiency',
          color: '#8B5CF6'
        }
      }
    ];
  }

  /**
   * Retorna atividades de demonstração quando o Supabase falhar
   */
  private static getFallbackActivities(limit: number = 10): ActivityItem[] {
    console.log(`[DashboardService] Retornando atividades de fallback`);
    
    const now = new Date();
    const activities: ActivityItem[] = [
      {
        id: 'demo-1',
        type: 'proposal',
        title: 'Proposta criada',
        description: 'Sistema Solar Residencial - 5kWp',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        user: {
          id: 'demo-user',
          name: 'Usuário Demo',
          avatar: undefined
        },
        metadata: {
          proposalId: 'demo-proposal-1',
          status: 'pending'
        }
      },
      {
        id: 'demo-2',
        type: 'training',
        title: 'Treinamento concluído',
        description: 'Módulo: Dimensionamento de Sistemas Fotovoltaicos',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
        user: {
          id: 'demo-user',
          name: 'Usuário Demo',
          avatar: undefined
        },
        metadata: {
          trainingId: 'demo-training-1'
        }
      }
    ];
    
    return activities.slice(0, limit);
  }

  /**
   * Retorna estatísticas padrão para usuários sem empresa
   */
  private static getFallbackQuickStats(): QuickStats {
    console.log(`[DashboardService] Retornando estatísticas de fallback`);
    
    return {
      activeUsers: 1, // O próprio usuário
      completedTrainings: 0,
      pendingTasks: 0,
      systemHealth: 'good' as const
    };
  }

  /**
   * Cria empresa padrão se não existir
   */
  static async ensureDefaultCompany(): Promise<string | null> {
    try {
      console.log(`[DashboardService] 🏢 Usando empresa padrão local`);
      
      // Retornamos sempre o ID da empresa padrão local
      const defaultCompanyId = 'local-company-default';
      console.log(`[DashboardService] ✅ Empresa padrão local: ${defaultCompanyId}`);
      return defaultCompanyId;
    } catch (error) {
      console.error(`[DashboardService] Erro ao garantir empresa padrão:`, error);
      return null;
    }
  }

  /**
   * Associa usuário órfão à empresa padrão
   */
  static async assignUserToDefaultCompany(userId: string): Promise<boolean> {
    try {
      console.log(`[DashboardService] 👤 Associando usuário ${userId} à empresa padrão local`);
      
      const defaultCompanyId = await this.ensureDefaultCompany();
      
      if (!defaultCompanyId) {
        console.error(`[DashboardService] Não foi possível criar/encontrar empresa padrão`);
        return false;
      }

      // Como estamos usando dados locais, simulamos a associação
      console.log(`[DashboardService] ✅ Usuário ${userId} associado à empresa padrão local: ${defaultCompanyId}`);
      return true;
    } catch (error) {
      console.error(`[DashboardService] Erro ao associar usuário à empresa padrão:`, error);
      return false;
    }
  }

  // ========================================
  // FUNÇÕES AUXILIARES PARA TRATAMENTO DE ERRO
  // ========================================

  /**
   * Executa uma operação com retry em caso de falha
   */
  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[DashboardService] Tentativa ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error: Error) {
        lastError = error;
        console.warn(`[DashboardService] Tentativa ${attempt} falhou:`, error.message);
        
        // Se não for erro de conectividade, não tentar novamente
        if (!this.isConnectivityError(error)) {
          throw error;
        }
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          console.log(`[DashboardService] Aguardando ${delayMs}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Backoff exponencial
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Verifica se o erro é relacionado à conectividade
   */
  private static isConnectivityError(error: Error): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';
    
    // Verificar mensagens comuns de erro de conectividade
    const connectivityErrors = [
      'failed to fetch',
      'network error',
      'connection refused',
      'timeout',
      'network request failed',
      'fetch error',
      'connection timeout',
      'network timeout',
      'connection reset',
      'connection aborted'
    ];
    
    // Verificar códigos de erro de rede
    const networkErrorCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'CONNECTION_ERROR',
      'FETCH_ERROR'
    ];
    
    return connectivityErrors.some(msg => errorMessage.includes(msg)) ||
           networkErrorCodes.includes(errorCode);
  }

  /**
   * Registra erro de conectividade para monitoramento
   */
  private static logConnectivityError(error: Error, context: string): void {
    console.error(`[DashboardService] Erro de conectividade em ${context}:`, {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      context
    });
    
    // Atualizar circuit breaker
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
  }

  /**
   * Verifica se o circuit breaker está aberto (evita tentativas desnecessárias)
   */
  private static isCircuitBreakerOpen(): boolean {
    const now = Date.now();
    const timeSinceLastFailure = now - this.circuitBreaker.lastFailure;
    
    // Se passou o timeout, resetar o circuit breaker
    if (timeSinceLastFailure > this.circuitBreaker.timeout) {
      this.circuitBreaker.failures = 0;
      return false;
    }
    
    // Se excedeu o threshold de falhas, circuit breaker está aberto
    return this.circuitBreaker.failures >= this.circuitBreaker.threshold;
  }

  /**
   * Executa operação com circuit breaker
   */
  private static async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    context: string
  ): Promise<T> {
    // Se circuit breaker está aberto, retornar fallback imediatamente
    if (this.isCircuitBreakerOpen()) {
      console.warn(`[DashboardService] Circuit breaker aberto para ${context}, usando fallback`);
      return fallback();
    }
    
    try {
      const result = await operation();
      // Sucesso - resetar failures se houver
      if (this.circuitBreaker.failures > 0) {
        console.log(`[DashboardService] Operação ${context} bem-sucedida, resetando circuit breaker`);
        this.circuitBreaker.failures = 0;
      }
      return result;
    } catch (error) {
      if (this.isConnectivityError(error)) {
        this.logConnectivityError(error, context);
      }
      return fallback();
    }
  }
}

export default DashboardService;