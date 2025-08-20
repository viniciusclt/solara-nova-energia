# DASHBOARD HOME CENTRALIZADO - DOCUMENTAÇÃO TÉCNICA

## 1. Visão Geral

O Dashboard Home Centralizado é a página principal da plataforma Solara Nova Energia, fornecendo uma visão consolidada de métricas, KPIs e ações rápidas para todos os tipos de usuários. Esta implementação substitui a atual página Index.tsx que apenas renderiza o MainMenu.

## 2. Arquitetura de Componentes

### 2.1 Estrutura de Componentes

```typescript
interface DashboardComponents {
  layout: {
    DashboardLayout: React.FC<DashboardLayoutProps>;
    MetricsGrid: React.FC<MetricsGridProps>;
    QuickActions: React.FC<QuickActionsProps>;
  };
  widgets: {
    ProposalMetrics: React.FC<ProposalMetricsProps>;
    RevenueChart: React.FC<RevenueChartProps>;
    ActivityFeed: React.FC<ActivityFeedProps>;
    PerformanceKPIs: React.FC<PerformanceKPIsProps>;
    RecentProposals: React.FC<RecentProposalsProps>;
    TeamActivity: React.FC<TeamActivityProps>;
  };
  charts: {
    LineChart: React.FC<LineChartProps>;
    BarChart: React.FC<BarChartProps>;
    PieChart: React.FC<PieChartProps>;
    AreaChart: React.FC<AreaChartProps>;
  };
}
```

### 2.2 Tipos TypeScript

```typescript
// Dashboard Types
interface DashboardData {
  metrics: DashboardMetrics;
  charts: ChartData[];
  recentActivity: ActivityItem[];
  quickStats: QuickStats;
}

interface DashboardMetrics {
  proposals: {
    total: number;
    thisMonth: number;
    pending: number;
    approved: number;
    rejected: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    target: number;
  };
  performance: {
    avgResponseTime: number;
    customerSatisfaction: number;
    teamEfficiency: number;
    goalCompletion: number;
  };
}

interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  config: ChartConfig;
}

interface ActivityItem {
  id: string;
  type: 'proposal' | 'training' | 'roadmap' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

interface QuickStats {
  activeUsers: number;
  completedTrainings: number;
  pendingTasks: number;
  systemHealth: 'good' | 'warning' | 'critical';
}
```

## 3. Estrutura de Arquivos

```
src/
├── pages/
│   └── DashboardPage.tsx
├── components/
│   └── dashboard/
│       ├── index.ts
│       ├── DashboardLayout.tsx
│       ├── MetricsGrid.tsx
│       ├── QuickActions.tsx
│       ├── widgets/
│       │   ├── ProposalMetrics.tsx
│       │   ├── RevenueChart.tsx
│       │   ├── ActivityFeed.tsx
│       │   ├── PerformanceKPIs.tsx
│       │   ├── RecentProposals.tsx
│       │   └── TeamActivity.tsx
│       └── charts/
│           ├── LineChart.tsx
│           ├── BarChart.tsx
│           ├── PieChart.tsx
│           └── AreaChart.tsx
├── hooks/
│   ├── useDashboard.ts
│   ├── useMetrics.ts
│   └── useCharts.ts
├── services/
│   └── DashboardService.ts
└── types/
    └── dashboard.ts
```

## 4. Implementação dos Componentes

### 4.1 DashboardPage.tsx

```typescript
import React from 'react';
import { DashboardLayout, MetricsGrid, QuickActions } from '@/components/dashboard';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar dashboard: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <QuickActions />
        </div>
        
        <MetricsGrid data={data} onRefresh={refetch} />
      </div>
    </DashboardLayout>
  );
}
```

### 4.2 MetricsGrid.tsx

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ProposalMetrics, 
  RevenueChart, 
  ActivityFeed, 
  PerformanceKPIs,
  RecentProposals,
  TeamActivity 
} from './widgets';
import { DashboardData } from '@/types/dashboard';

interface MetricsGridProps {
  data: DashboardData;
  onRefresh: () => void;
}

export function MetricsGrid({ data, onRefresh }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Métricas Principais */}
      <div className="lg:col-span-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ProposalMetrics data={data.metrics.proposals} />
          <PerformanceKPIs data={data.metrics.performance} />
        </div>
        
        {/* Gráfico de Receita */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.charts.find(c => c.id === 'revenue')} />
          </CardContent>
        </Card>
        
        {/* Propostas Recentes */}
        <RecentProposals data={data.recentActivity.filter(a => a.type === 'proposal')} />
      </div>
      
      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <ActivityFeed data={data.recentActivity} />
        <TeamActivity data={data.quickStats} />
      </div>
    </div>
  );
}
```

## 5. Hooks Customizados

### 5.1 useDashboard.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '@/services/DashboardService';
import { DashboardData } from '@/types/dashboard';
import { useAuth } from '@/hooks/useAuth';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await DashboardService.getDashboardData(user.id);
      setData(dashboardData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const refetch = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch
  };
}
```

## 6. Serviços de API

### 6.1 DashboardService.ts

```typescript
import { supabase } from '@/lib/supabase';
import { DashboardData, DashboardMetrics } from '@/types/dashboard';

export class DashboardService {
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const [metrics, charts, activity, stats] = await Promise.all([
      this.getMetrics(userId),
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
  }

  private static async getMetrics(userId: string): Promise<DashboardMetrics> {
    const { data: user } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (!user?.company_id) throw new Error('Usuário sem empresa');

    // Buscar métricas de propostas
    const { data: proposals } = await supabase
      .from('proposals')
      .select('*')
      .eq('company_id', user.company_id);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const proposalsThisMonth = proposals?.filter(p => 
      new Date(p.created_at) >= thisMonth
    ) || [];

    const proposalMetrics = {
      total: proposals?.length || 0,
      thisMonth: proposalsThisMonth.length,
      pending: proposals?.filter(p => p.status === 'pending').length || 0,
      approved: proposals?.filter(p => p.status === 'approved').length || 0,
      rejected: proposals?.filter(p => p.status === 'rejected').length || 0,
      conversionRate: proposals?.length ? 
        (proposals.filter(p => p.status === 'approved').length / proposals.length) * 100 : 0
    };

    // Calcular métricas de receita (simulado)
    const revenueMetrics = {
      total: 450000,
      thisMonth: 85000,
      lastMonth: 72000,
      growth: 18.1,
      target: 100000
    };

    // Métricas de performance (simulado)
    const performanceMetrics = {
      avgResponseTime: 2.3,
      customerSatisfaction: 4.7,
      teamEfficiency: 87,
      goalCompletion: 92
    };

    return {
      proposals: proposalMetrics,
      revenue: revenueMetrics,
      performance: performanceMetrics
    };
  }

  private static async getChartData(userId: string) {
    // Implementar busca de dados para gráficos
    return [
      {
        id: 'revenue',
        type: 'line' as const,
        title: 'Receita Mensal',
        data: [
          { month: 'Jan', value: 65000 },
          { month: 'Fev', value: 72000 },
          { month: 'Mar', value: 68000 },
          { month: 'Abr', value: 85000 }
        ],
        config: {
          xKey: 'month',
          yKey: 'value',
          color: '#0EA5E9'
        }
      }
    ];
  }

  private static async getRecentActivity(userId: string) {
    // Implementar busca de atividades recentes
    return [];
  }

  private static async getQuickStats(userId: string) {
    // Implementar busca de estatísticas rápidas
    return {
      activeUsers: 24,
      completedTrainings: 156,
      pendingTasks: 8,
      systemHealth: 'good' as const
    };
  }
}
```

## 7. Integração com Roteamento

### 7.1 Atualização do App.tsx

```typescript
// Substituir a rota atual
<Route path="/" element={<DashboardPage />} />
<Route path="/dashboard" element={<DashboardPage />} />
```

### 7.2 Atualização do MainMenu

```typescript
// Adicionar link para dashboard
{
  title: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  description: "Visão geral e métricas"
}
```

## 8. Responsividade e Design

### 8.1 Breakpoints

* **Mobile (< 768px)**: Stack vertical, cards full-width

* **Tablet (768px - 1024px)**: Grid 2 colunas

* **Desktop (> 1024px)**: Grid 12 colunas com sidebar

### 8.2 Componentes de UI

* Cards com shadow e hover effects

* Gráficos responsivos com Recharts

* Loading skeletons

* Error boundaries

* Animações suaves com Framer Motion

## 9. Performance e Otimização

### 9.1 Estratégias

* Lazy loading de componentes pesados

* Memoização de cálculos complexos

* Debounce em filtros e buscas

* Cache de dados com React Query

* Virtualização para listas grandes

### 9.2 Monitoramento

* Métricas de performance com Web Vitals

* Error tracking com Sentry

* Analytics de uso

* Logs de performance

## 10. Testes

### 10.1 Testes Unitários

```typescript
// DashboardPage.test.tsx
import { render, screen } from '@testing-library/react';
import DashboardPage from '../DashboardPage';

describe('DashboardPage', () => {
  it('should render dashboard title', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });
});
```

### 10.2 Testes de Integração

* Testes de API com MSW

* Testes de fluxo completo

* Testes de responsividade

* Testes de acessibilidade

## 11. Cronograma de Implementação

### Fase 1 (3 dias)

* Estrutura básica e tipos

* Componentes de layout

* Integração com roteamento

### Fase 2 (4 dias)

* Widgets de métricas

* Gráficos com

