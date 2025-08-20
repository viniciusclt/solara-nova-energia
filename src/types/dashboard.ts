// Dashboard Types
export interface DashboardData {
  metrics: DashboardMetrics;
  charts: ChartData[];
  recentActivity: ActivityItem[];
  quickStats: QuickStats;
}

export interface DashboardMetrics {
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

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export interface ChartConfig {
  xKey: string;
  yKey: string;
  color: string;
  gradient?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
}

export interface ActivityItem {
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
  metadata?: Record<string, unknown>;
}

export interface QuickStats {
  activeUsers: number;
  completedTrainings: number;
  pendingTasks: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

export interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: string;
  color?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'activity';
  size: 'small' | 'medium' | 'large';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  company?: string;
  department?: string;
  user?: string;
  status?: string[];
}

export interface DashboardPreferences {
  userId: string;
  defaultLayout: string;
  refreshInterval: number;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  language: string;
}

export interface KPITarget {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'on-track' | 'at-risk' | 'behind';
  lastUpdated: string;
}

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface RealtimeUpdate {
  type: 'metric' | 'activity' | 'alert';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'png';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeMetrics: boolean;
  includeActivity: boolean;
}

export interface DashboardPermissions {
  canView: boolean;
  canEdit: boolean;
  canExport: boolean;
  canShare: boolean;
  canManageLayouts: boolean;
  restrictedWidgets?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  isOnline: boolean;
  lastActive: string;
  performance: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    completedTasks: number;
    pendingTasks: number;
  };
}

export interface CompanyMetrics {
  totalEmployees: number;
  activeProjects: number;
  monthlyRevenue: number;
  customerSatisfaction: number;
  marketShare: number;
  growthRate: number;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  types: {
    proposals: boolean;
    training: boolean;
    system: boolean;
    alerts: boolean;
  };
}

export interface DashboardError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

export interface RefreshState {
  lastRefresh: string;
  isRefreshing: boolean;
  autoRefresh: boolean;
  interval: number;
}

export interface DashboardState {
  data: DashboardData | null;
  loading: LoadingState;
  error: DashboardError | null;
  refresh: RefreshState;
  filters: DashboardFilters;
  preferences: DashboardPreferences;
  permissions: DashboardPermissions;
}

export interface DashboardAction {
  type: string;
  payload?: Record<string, unknown>;
  meta?: {
    timestamp: string;
    userId: string;
  };
}

export interface DashboardContextValue {
  state: DashboardState;
  dispatch: (action: DashboardAction) => void;
  refreshData: () => Promise<void>;
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  updatePreferences: (preferences: Partial<DashboardPreferences>) => void;
  exportData: (options: ExportOptions) => Promise<void>;
}

export interface WidgetProps {
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onEdit?: () => void;
  className?: string;
}

export interface ChartProps extends WidgetProps {
  type: ChartData['type'];
  width?: number;
  height?: number;
  responsive?: boolean;
  animation?: boolean;
}

export interface MetricProps extends WidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ComponentType;
  color?: string;
  format?: 'number' | 'currency' | 'percentage';
}

export interface ActivityProps extends WidgetProps {
  items: ActivityItem[];
  maxItems?: number;
  showTimestamp?: boolean;
  showUser?: boolean;
  onItemClick?: (item: ActivityItem) => void;
}

export interface QuickActionProps {
  label: string;
  icon: React.ComponentType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export interface MetricsGridProps {
  data: DashboardData;
  onRefresh: () => void;
  loading?: boolean;
  error?: string;
}

export interface QuickActionsProps {
  actions?: QuickActionProps[];
  maxActions?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

// Hook return types
export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: DashboardError | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  exportData: (options: ExportOptions) => Promise<void>;
}

export interface UseMetricsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  subscribe: (callback: (metrics: DashboardMetrics) => void) => () => void;
}

export interface UseChartsReturn {
  charts: ChartData[];
  loading: boolean;
  error: string | null;
  addChart: (chart: Omit<ChartData, 'id'>) => void;
  updateChart: (id: string, updates: Partial<ChartData>) => void;
  removeChart: (id: string) => void;
  refresh: () => Promise<void>;
}

// Service types
export interface DashboardServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  cache: boolean;
  realtime: boolean;
}

export interface DashboardAPI {
  getDashboardData: (userId: string, filters?: DashboardFilters) => Promise<DashboardData>;
  getMetrics: (userId: string, filters?: DashboardFilters) => Promise<DashboardMetrics>;
  getChartData: (userId: string, chartId?: string) => Promise<ChartData[]>;
  getRecentActivity: (userId: string, limit?: number) => Promise<ActivityItem[]>;
  getQuickStats: (userId: string) => Promise<QuickStats>;
  updatePreferences: (userId: string, preferences: Partial<DashboardPreferences>) => Promise<void>;
  exportDashboard: (userId: string, options: ExportOptions) => Promise<Blob>;
  subscribeTo: (event: string, callback: (data: Record<string, unknown>) => void) => () => void;
}

// Utility types
export type DashboardTheme = 'light' | 'dark' | 'auto';
export type MetricFormat = 'number' | 'currency' | 'percentage' | 'duration';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
export type WidgetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AlertType = 'info' | 'warning' | 'error' | 'success';
export type HealthStatus = 'good' | 'warning' | 'critical';
export type TrendDirection = 'up' | 'down' | 'stable';
export type RefreshInterval = 30 | 60 | 300 | 600 | 1800 | 3600; // seconds

// Constants
export const DASHBOARD_CONSTANTS = {
  DEFAULT_REFRESH_INTERVAL: 300, // 5 minutes
  MAX_CHART_DATA_POINTS: 100,
  MAX_ACTIVITY_ITEMS: 50,
  CHART_COLORS: [
    '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ],
  WIDGET_SIZES: {
    xs: { w: 1, h: 1 },
    sm: { w: 2, h: 2 },
    md: { w: 3, h: 2 },
    lg: { w: 4, h: 3 },
    xl: { w: 6, h: 4 }
  },
  BREAKPOINTS: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  }
} as const;

// Type guards
export const isDashboardData = (data: unknown): data is DashboardData => {
  return data && 
    typeof data === 'object' &&
    'metrics' in data &&
    'charts' in data &&
    'recentActivity' in data &&
    'quickStats' in data;
};

export const isChartData = (data: unknown): data is ChartData => {
  return data &&
    typeof data === 'object' &&
    'id' in data &&
    'type' in data &&
    'title' in data &&
    'data' in data &&
    Array.isArray(data.data);
};

export const isActivityItem = (item: unknown): item is ActivityItem => {
  return item &&
    typeof item === 'object' &&
    'id' in item &&
    'type' in item &&
    'title' in item &&
    'timestamp' in item &&
    'user' in item;
};

// Helper functions
export const formatMetricValue = (value: number, format: MetricFormat): string => {
  switch (format) {
    case 'currency': {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    case 'percentage': {
      return `${value.toFixed(1)}%`;
    }
    case 'duration': {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    default: {
      return new Intl.NumberFormat('pt-BR').format(value);
    }
  }
};

export const getHealthStatusColor = (status: HealthStatus): string => {
  switch (status) {
    case 'good': {
      return '#10B981'; // green
    }
    case 'warning': {
      return '#F59E0B'; // yellow
    }
    case 'critical': {
      return '#EF4444'; // red
    }
    default: {
      return '#6B7280'; // gray
    }
  }
};

export const getTrendIcon = (direction: TrendDirection): string => {
  switch (direction) {
    case 'up': {
      return '↗️';
    }
    case 'down': {
      return '↘️';
    }
    case 'stable': {
      return '→';
    }
    default: {
      return '—';
    }
  }
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  return `${Math.floor(diffInSeconds / 86400)}d atrás`;
};

export const generateChartColors = (count: number): string[] => {
  const colors = DASHBOARD_CONSTANTS.CHART_COLORS;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export const validateDashboardData = (data: unknown): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!isDashboardData(data)) {
    errors.push('Dados do dashboard inválidos');
    return { isValid: false, errors };
  }

  if (!data.metrics) {
    errors.push('Métricas não encontradas');
  }

  if (!Array.isArray(data.charts)) {
    errors.push('Dados de gráficos inválidos');
  }

  if (!Array.isArray(data.recentActivity)) {
    errors.push('Dados de atividade inválidos');
  }

  return { isValid: errors.length === 0, errors };
};