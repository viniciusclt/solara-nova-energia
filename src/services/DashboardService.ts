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
      console.log(`[DashboardService] Buscando métricas para usuário: ${userId}`);
      
      // Buscar informações do usuário e empresa com retry
      const { data: user, error: userError } = await this.executeWithRetry(
        () => supabase
          .from('profiles')
          .select('company_id, email, full_name')
          .eq('id', userId)
          .single()
      );

      if (userError) {
        console.error(`[DashboardService] Erro ao buscar usuário ${userId}:`, userError);
        
        // Se for erro de conectividade, retornar fallback
        if (this.isConnectivityError(userError)) {
          console.warn(`[DashboardService] Erro de conectividade detectado. Retornando métricas de fallback.`);
          return this.getFallbackMetrics(userId, null);
        }
        
        throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
      }

      if (!user) {
        console.error(`[DashboardService] Usuário ${userId} não encontrado`);
        throw new Error('Usuário não encontrado');
      }

      // Verificar se usuário tem empresa associada
      if (!user.company_id) {
        console.warn(`[DashboardService] Usuário ${userId} (${user.email}) sem empresa associada. Aplicando fallback.`);
        return this.getFallbackMetrics(userId, user);
      }

      console.log(`[DashboardService] Usuário ${userId} pertence à empresa: ${user.company_id}`);

      // Definir filtros de data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Aplicar filtros customizados se fornecidos
      const dateFilter = filters?.dateRange ? {
        start: filters.dateRange.start,
        end: filters.dateRange.end
      } : {
        start: startOfMonth.toISOString(),
        end: now.toISOString()
      };

      // Buscar propostas
      const { data: proposals, error: proposalsError } = await supabase
        .from('proposals')
        .select('*')
        .eq('company_id', user.company_id)
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      if (proposalsError) {
        console.error('Erro ao buscar propostas:', proposalsError);
      }

      // Buscar propostas do mês anterior para comparação
      const { data: lastMonthProposals } = await supabase
        .from('proposals')
        .select('*')
        .eq('company_id', user.company_id)
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      // Calcular métricas de propostas
      const totalProposals = proposals?.length || 0;
      const pendingProposals = proposals?.filter(p => p.status === 'pending').length || 0;
      const approvedProposals = proposals?.filter(p => p.status === 'approved').length || 0;
      const rejectedProposals = proposals?.filter(p => p.status === 'rejected').length || 0;
      const conversionRate = totalProposals > 0 ? (approvedProposals / totalProposals) * 100 : 0;

      // Buscar dados de receita (simulado por enquanto)
      const revenueData = await this.getRevenueMetrics(user.company_id, dateFilter);

      // Buscar métricas de performance
      const performanceData = await this.getPerformanceMetrics(user.company_id, dateFilter);

      return {
        proposals: {
          total: totalProposals,
          thisMonth: totalProposals,
          pending: pendingProposals,
          approved: approvedProposals,
          rejected: rejectedProposals,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        revenue: revenueData,
        performance: performanceData
      };
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
      console.log(`[DashboardService] Buscando dados de gráficos para usuário: ${userId}`);
      
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('company_id, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error(`[DashboardService] Erro ao buscar usuário para gráficos:`, userError);
        return this.getFallbackChartData();
      }

      if (!user?.company_id) {
        console.warn(`[DashboardService] Usuário ${userId} sem empresa. Retornando gráficos vazios.`);
        return this.getFallbackChartData();
      }

      console.log(`[DashboardService] Gerando gráficos para empresa: ${user.company_id}`);

      // Gerar dados de receita mensal (últimos 6 meses)
      const revenueChart = await this.generateRevenueChart(user.company_id);
      
      // Gerar dados de propostas por status
      const proposalsChart = await this.generateProposalsChart(user.company_id);
      
      // Gerar dados de performance da equipe
      const performanceChart = await this.generatePerformanceChart(user.company_id);

      return [revenueChart, proposalsChart, performanceChart];
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
        console.log(`[DashboardService] Buscando atividades recentes para usuário: ${userId}`);
        
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('company_id, email')
          .eq('id', userId)
          .single();

        if (userError) {
          throw userError;
        }

        if (!user?.company_id) {
          console.warn(`[DashboardService] Usuário ${userId} sem empresa. Retornando atividades vazias.`);
          return [];
        }

        console.log(`[DashboardService] Buscando atividades para empresa: ${user.company_id}`);

        // Buscar atividades de propostas
        const { data: proposalActivities } = await supabase
          .from('proposals')
          .select(`
            id,
            title,
            status,
            created_at,
            updated_at,
            profiles:created_by (id, name, avatar_url)
          `)
          .eq('company_id', user.company_id)
          .order('updated_at', { ascending: false })
          .limit(limit);

        // Buscar atividades de treinamento
        const { data: trainingActivities } = await supabase
          .from('training_completions')
          .select(`
            id,
            completed_at,
            training_modules (title),
            profiles:user_id (id, name, avatar_url)
          `)
          .order('completed_at', { ascending: false })
          .limit(limit);

        // Converter para formato ActivityItem
        const activities: ActivityItem[] = [];

        // Adicionar atividades de propostas
        if (proposalActivities) {
          proposalActivities.forEach(proposal => {
            activities.push({
              id: `proposal-${proposal.id}`,
              type: 'proposal',
              title: `Proposta ${proposal.status === 'pending' ? 'criada' : proposal.status === 'approved' ? 'aprovada' : 'rejeitada'}`,
              description: proposal.title,
              timestamp: proposal.updated_at,
              user: {
                id: proposal.profiles?.id || '',
                name: proposal.profiles?.name || 'Usuário',
                avatar: proposal.profiles?.avatar_url
              },
              metadata: {
                proposalId: proposal.id,
                status: proposal.status
              }
            });
          });
        }

        // Adicionar atividades de treinamento
        if (trainingActivities) {
          trainingActivities.forEach(training => {
            activities.push({
              id: `training-${training.id}`,
              type: 'training',
              title: 'Treinamento concluído',
              description: training.training_modules?.title || 'Módulo de treinamento',
              timestamp: training.completed_at,
              user: {
                id: training.profiles?.id || '',
                name: training.profiles?.name || 'Usuário',
                avatar: training.profiles?.avatar_url
              },
              metadata: {
                trainingId: training.id
              }
            });
          });
        }

        // Ordenar por timestamp e limitar
        return activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
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
      console.log(`[DashboardService] Buscando estatísticas rápidas para usuário: ${userId}`);
      
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('company_id, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error(`[DashboardService] Erro ao buscar usuário para estatísticas:`, userError);
        return this.getFallbackQuickStats();
      }

      if (!user?.company_id) {
        console.warn(`[DashboardService] Usuário ${userId} sem empresa. Retornando estatísticas padrão.`);
        return this.getFallbackQuickStats();
      }

      console.log(`[DashboardService] Buscando estatísticas para empresa: ${user.company_id}`);

      // Buscar usuários ativos (logados nas últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', user.company_id)
        .gte('last_sign_in_at', yesterday.toISOString());

      // Buscar treinamentos concluídos no mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      const { data: completedTrainings } = await supabase
        .from('training_completions')
        .select('id')
        .gte('completed_at', startOfMonth.toISOString());

      // Buscar tarefas pendentes (propostas pendentes)
      const { data: pendingTasks } = await supabase
        .from('proposals')
        .select('id')
        .eq('company_id', user.company_id)
        .eq('status', 'pending');

      // Simular saúde do sistema (pode ser implementado com métricas reais)
      const systemHealth = 'good' as const;

      return {
        activeUsers: activeUsers?.length || 0,
        completedTrainings: completedTrainings?.length || 0,
        pendingTasks: pendingTasks?.length || 0,
        systemHealth
      };
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
      const { data: user } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (!user?.company_id) {
        return [];
      }

      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', user.company_id)
        .neq('id', userId);

      if (!members) {
        return [];
      }

      return members.map(member => ({
        id: member.id,
        name: member.name || 'Usuário',
        email: member.email || '',
        avatar: member.avatar_url,
        role: 'Usuário', // Valor padrão já que a coluna role não existe na tabela profiles
        department: member.department || 'Geral',
        isOnline: false, // TODO: Implementar status online
        lastActive: member.last_sign_in_at || new Date().toISOString(),
        performance: {
          score: Math.floor(Math.random() * 40) + 60, // Simulado
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
          completedTasks: Math.floor(Math.random() * 20) + 5,
          pendingTasks: Math.floor(Math.random() * 10) + 1
        }
      }));
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
      // Implementar subscription para atualizações em tempo real
      const channel = supabase
        .channel('dashboard-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'proposals'
        }, callback)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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
    console.log(`[DashboardService] Aplicando fallback de métricas para usuário ${userId}`);
    
    // Verificar se existe empresa padrão
    const { data: defaultCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', 'empresa-padrao')
      .single();

    if (defaultCompany) {
      console.log(`[DashboardService] Associando usuário ${userId} à empresa padrão`);
      
      // Atualizar usuário com empresa padrão
      await supabase
        .from('profiles')
        .update({ company_id: defaultCompany.id, updated_at: new Date().toISOString() })
        .eq('id', userId);

      // Tentar buscar métricas novamente
      return this.getMetrics(userId);
    }

    // Se não há empresa padrão, retornar métricas vazias
    return {
      proposals: {
        total: 0,
        thisMonth: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        conversionRate: 0
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        growth: 0,
        target: 0,
        forecast: 0
      },
      performance: {
        efficiency: 0,
        productivity: 0,
        quality: 0,
        satisfaction: 0
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
      console.log(`[DashboardService] Verificando existência de empresa padrão`);
      
      // Verificar se empresa padrão já existe
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', 'empresa-padrao')
        .single();

      if (existingCompany) {
        console.log(`[DashboardService] Empresa padrão já existe: ${existingCompany.id}`);
        return existingCompany.id;
      }

      // Criar empresa padrão
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          name: 'Empresa Padrão',
          slug: 'empresa-padrao',
          description: 'Empresa padrão para usuários sem empresa definida',
          status: 'active'
        })
        .select('id')
        .single();

      if (error) {
        console.error(`[DashboardService] Erro ao criar empresa padrão:`, error);
        return null;
      }

      console.log(`[DashboardService] Empresa padrão criada: ${newCompany.id}`);
      return newCompany.id;
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
      console.log(`[DashboardService] Associando usuário ${userId} à empresa padrão`);
      
      const defaultCompanyId = await this.ensureDefaultCompany();
      
      if (!defaultCompanyId) {
        console.error(`[DashboardService] Não foi possível criar/encontrar empresa padrão`);
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          company_id: defaultCompanyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error(`[DashboardService] Erro ao associar usuário à empresa padrão:`, error);
        return false;
      }

      console.log(`[DashboardService] Usuário ${userId} associado à empresa padrão com sucesso`);
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