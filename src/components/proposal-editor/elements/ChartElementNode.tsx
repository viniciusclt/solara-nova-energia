import React, { useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  BarChart,
  LineChart,
  PieChart,
  Settings,
  Trash2,
  Plus,
  Minus,
  Edit3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell
} from 'recharts';
import type { ProposalElement, ChartProperties, ChartType } from '../../../types/proposal-editor';

interface ChartElementData {
  element: ProposalElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<ProposalElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
}

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#8dd1e1'
];

const DEFAULT_DATA = [
  { name: 'Jan', value: 400 },
  { name: 'Fev', value: 300 },
  { name: 'Mar', value: 200 },
  { name: 'Abr', value: 278 },
  { name: 'Mai', value: 189 }
];

export const ChartElementNode: React.FC<NodeProps<ChartElementData>> = ({
  data
}) => {
  const { element, isSelected, onUpdate, onDelete, onSelect } = data;
  const properties = element.properties as ChartProperties;
  
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [editingData, setEditingData] = useState<Array<{ name: string; value: number }>>(properties.data || DEFAULT_DATA);

  const updateProperty = (key: keyof ChartProperties, value: unknown) => {
    onUpdate({
      properties: {
        ...properties,
        [key]: value
      }
    });
  };

  const chartData = useMemo(() => {
    return properties.data && properties.data.length > 0 ? properties.data : DEFAULT_DATA;
  }, [properties.data]);

  const addDataPoint = () => {
    const newPoint = {
      name: `Item ${editingData.length + 1}`,
      value: 0
    };
    setEditingData([...editingData, newPoint]);
  };

  const removeDataPoint = (index: number) => {
    if (editingData.length > 1) {
      setEditingData(editingData.filter((_, i) => i !== index));
    }
  };

  const updateDataPoint = (index: number, field: string, value: string | number) => {
    const updated = [...editingData];
    updated[index] = { ...updated[index], [field]: value };
    setEditingData(updated);
  };

  const saveData = () => {
    updateProperty('data', editingData);
    setShowDataDialog(false);
  };

  const renderChart = () => {
    const commonProps = {
      width: element.position.width - 20,
      height: element.position.height - 20,
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (properties.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                tick={{ fill: properties.textColor || '#666' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: properties.textColor || '#666' }}
              />
              <Tooltip />
              {properties.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={properties.primaryColor || CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: properties.primaryColor || CHART_COLORS[0] }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(element.position.width, element.position.height) / 4}
                fill={properties.primaryColor || CHART_COLORS[0]}
                dataKey="value"
                label={properties.showLabels ? ({ name, value }) => `${name}: ${value}` : false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              {properties.showLegend && <Legend />}
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      
      default: // bar
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                tick={{ fill: properties.textColor || '#666' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: properties.textColor || '#666' }}
              />
              <Tooltip />
              {properties.showLegend && <Legend />}
              <Bar 
                dataKey="value" 
                fill={properties.primaryColor || CHART_COLORS[0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        );
    }
  };

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'line': return <LineChart className="h-4 w-4" />;
      case 'pie': return <PieChart className="h-4 w-4" />;
      default: return <BarChart className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        'relative bg-white border-2 border-transparent rounded-lg overflow-hidden',
        'hover:border-blue-300 transition-colors',
        isSelected && 'border-blue-500 shadow-lg',
        'group cursor-pointer'
      )}
      onClick={onSelect}
      style={{
        width: element.position.width,
        height: element.position.height
      }}
    >
      {/* Handles para conexões */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 group-hover:opacity-100"
      />

      {/* Conteúdo do gráfico */}
      <div className="w-full h-full p-2">
        {properties.title && (
          <h3 
            className="text-center font-medium mb-2 text-sm"
            style={{ color: properties.textColor || '#333' }}
          >
            {properties.title}
          </h3>
        )}
        <div className="w-full h-full">
          {renderChart()}
        </div>
      </div>

      {/* Toolbar de edição */}
      {isSelected && (
        <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 z-10">
          {/* Tipo de gráfico */}
          <Select
            value={properties.chartType || 'bar'}
            onValueChange={(value: ChartType) => updateProperty('chartType', value)}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              {getChartIcon(properties.chartType || 'bar')}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">
                <div className="flex items-center space-x-2">
                  <BarChart className="h-4 w-4" />
                  <span>Barras</span>
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center space-x-2">
                  <LineChart className="h-4 w-4" />
                  <span>Linha</span>
                </div>
              </SelectItem>
              <SelectItem value="pie">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Pizza</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Editar dados */}
          <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Editar dados"
                onClick={() => setEditingData(chartData)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[80vw] max-w-2xl h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar dados do gráfico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {editingData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateDataPoint(index, 'name', e.target.value)}
                      placeholder="Nome"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={item.value}
                      onChange={(e) => updateDataPoint(index, 'value', parseFloat(e.target.value) || 0)}
                      placeholder="Valor"
                      className="w-20"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDataPoint(index)}
                      disabled={editingData.length <= 1}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDataPoint}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar ponto
                </Button>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDataDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={saveData}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Configurações */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Configurações do Gráfico</h4>
                
                <div>
                  <Label className="text-xs font-medium">Título</Label>
                  <Input
                    value={properties.title || ''}
                    onChange={(e) => updateProperty('title', e.target.value)}
                    placeholder="Título do gráfico"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor principal</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.primaryColor || CHART_COLORS[0]}
                      onChange={(e) => updateProperty('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.primaryColor || CHART_COLORS[0]}
                      onChange={(e) => updateProperty('primaryColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor do texto</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.textColor || '#666666'}
                      onChange={(e) => updateProperty('textColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.textColor || '#666666'}
                      onChange={(e) => updateProperty('textColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-legend"
                    checked={properties.showLegend || false}
                    onChange={(e) => updateProperty('showLegend', e.target.checked)}
                  />
                  <Label htmlFor="show-legend" className="text-xs">Mostrar legenda</Label>
                </div>
                
                {properties.chartType === 'pie' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-labels"
                      checked={properties.showLabels || false}
                      onChange={(e) => updateProperty('showLabels', e.target.checked)}
                    />
                    <Label htmlFor="show-labels" className="text-xs">Mostrar rótulos</Label>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Deletar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Indicador de seleção */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
        </>
      )}
    </div>
  );
};

export default ChartElementNode;