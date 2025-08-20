// Dashboard Components
export { default as MetricsGrid, MetricCard } from './MetricsGrid';
export { default as ChartWidget } from './ChartWidget';
export { default as ActivityFeed, ActivityItemComponent } from './ActivityFeed';
export { default as QuickActions } from './QuickActions';

// Re-export types for convenience
export type {
  DashboardData,
  DashboardMetrics,
  ChartData,
  ActivityItem,
  QuickStats,
  MetricCard as MetricCardType,
  DashboardWidget,
  DashboardLayout,
  DashboardFilters,
  DashboardPreferences,
  KPITarget,
  DashboardAlert,
  RealtimeUpdate,
  ExportOptions,
  DashboardPermissions,
  TeamMember,
  CompanyMetrics,
  NotificationSettings,
  DashboardError,
  LoadingState,
  RefreshState,
  DashboardState,
  DashboardAction,
  DashboardContextValue,
  WidgetProps,
  ChartProps,
  MetricProps,
  ActivityProps,
  QuickActionProps,
  DashboardLayoutProps,
  MetricsGridProps,
  QuickActionsProps,
  UseDashboardReturn,
  UseMetricsReturn,
  UseChartsReturn,
  DashboardServiceConfig,
  DashboardAPI
} from '@/types/dashboard';