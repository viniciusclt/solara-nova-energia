import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Download, 
  Maximize2, 
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChartData, ChartProps } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ChartWidgetProps extends ChartProps {
  data: ChartData;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: 'png' | 'svg' | 'pdf') => void;
  onMaximize?: () => void;
  className?: string;
}

const COLORS = {
  primary: '#0EA5E9',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  gray: '#6B7280'
};

const PIE_COLORS = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: string | number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' 
              ? entry.value.toLocaleString('pt-BR')
              : entry.value
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartTypeIcon = ({ type }: { type: ChartData['type'] }) => {
  switch (type) {
    case 'line':
      return <TrendingUp className="h-4 w-4" />;
    case 'bar':
      return <BarChart3 className="h-4 w-4" />;
    case 'pie':
      return <PieChartIcon className="h-4 w-4" />;
    case 'area':
      return <Activity className="h-4 w-4" />;
    default:
      return <BarChart3 className="h-4 w-4" />;
  }
};

const ChartWidget: React.FC<ChartWidgetProps> = ({
  data,
  loading = false,
  onRefresh,
  onExport,
  onMaximize,
  className,
  height = 300,
  showLegend = true,
  showGrid = true,
  animate = true
}) => {
  const chartColor = useMemo(() => {
    return data.config.color || COLORS.primary;
  }, [data.config.color]);

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      );
    }

    if (!data.data || data.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <ChartTypeIcon type={data.type} />
            <p className="mt-2 text-sm">Nenhum dado disponível</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: data.data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (data.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={data.config.xKey} 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => 
                typeof value === 'number' ? value.toLocaleString('pt-BR') : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={data.config.yKey}
              stroke={chartColor}
              strokeWidth={2}
              dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2 }}
              animationDuration={animate ? 1000 : 0}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={data.config.xKey} 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => 
                typeof value === 'number' ? value.toLocaleString('pt-BR') : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={data.config.yKey}
              stroke={chartColor}
              fill={data.config.gradient ? `url(#gradient-${data.id})` : chartColor}
              fillOpacity={0.6}
              animationDuration={animate ? 1000 : 0}
            />
            {data.config.gradient && (
              <defs>
                <linearGradient id={`gradient-${data.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} />
                </linearGradient>
              </defs>
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={data.config.xKey} 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => 
                typeof value === 'number' ? value.toLocaleString('pt-BR') : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar
              dataKey={data.config.yKey}
              fill={chartColor}
              radius={[4, 4, 0, 0]}
              animationDuration={animate ? 1000 : 0}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={data.config.yKey}
              animationDuration={animate ? 1000 : 0}
            >
              {data.data.map((entry: Record<string, unknown>, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Tipo de gráfico não suportado</p>
          </div>
        );
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <ChartTypeIcon type={data.type} />
          <CardTitle className="text-lg font-semibold">
            {data.title}
          </CardTitle>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn(
                'h-4 w-4',
                loading && 'animate-spin'
              )} />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onMaximize && (
                <DropdownMenuItem onClick={onMaximize}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Expandir
                </DropdownMenuItem>
              )}
              {onExport && (
                <>
                  <DropdownMenuItem onClick={() => onExport('png')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('svg')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartWidget;