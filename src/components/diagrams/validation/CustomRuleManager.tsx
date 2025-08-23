// ============================================================================
// Custom Rule Manager - Gerenciador de regras de validação customizáveis
// ============================================================================
// Interface para criar, editar e gerenciar regras de validação personalizadas
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  Play,
  Pause,
  Copy,
  Download,
  Upload,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  CustomValidationRule,
  ValidationCondition,
  ValidationAction,
  CustomValidationRuleSet,
  customValidationRuleService
} from '../../../services/validation/CustomValidationRuleService';
import { DiagramType } from '../../../types/unified-diagram';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionBuilder } from './ActionBuilder';

// ============================================================================
// INTERFACES
// ============================================================================

interface CustomRuleManagerProps {
  onClose: () => void;
  onRuleChange?: (rules: CustomValidationRule[]) => void;
  className?: string;
}

interface RuleFormData {
  name: string;
  description: string;
  category: CustomValidationRule['category'];
  severity: CustomValidationRule['severity'];
  diagramTypes: DiagramType[];
  enabled: boolean;
  conditions: ValidationCondition[];
  actions: ValidationAction[];
}

type ViewMode = 'list' | 'edit' | 'create';
type FilterCategory = 'all' | CustomValidationRule['category'];
type FilterSeverity = 'all' | CustomValidationRule['severity'];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CustomRuleManager: React.FC<CustomRuleManagerProps> = ({
  onClose,
  onRuleChange,
  className = ''
}) => {
  // Estados
  const [rules, setRules] = useState<CustomValidationRule[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [ruleSets, setRuleSets] = useState<CustomValidationRuleSet[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRule, setSelectedRule] = useState<CustomValidationRule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // Form data para criação/edição
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    category: 'custom',
    severity: 'warning',
    diagramTypes: [],
    enabled: true,
    conditions: [],
    actions: []
  });

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    loadRules();
    loadRuleSets();
  }, []);

  useEffect(() => {
    if (onRuleChange) {
      onRuleChange(rules);
    }
  }, [rules, onRuleChange]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const loadRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedRules = await customValidationRuleService.getAllRules();
      setRules(loadedRules);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
      toast.error('Erro ao carregar regras de validação');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRuleSets = useCallback(async () => {
    try {
      const loadedRuleSets = await customValidationRuleService.getAllRuleSets();
      setRuleSets(loadedRuleSets);
    } catch (error) {
      console.error('Erro ao carregar conjuntos de regras:', error);
    }
  }, []);

  const handleCreateRule = useCallback(async () => {
    try {
      setIsLoading(true);
      const newRule = await customValidationRuleService.createRule(formData);
      setRules(prev => [...prev, newRule]);
      setViewMode('list');
      resetForm();
      toast.success('Regra criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar regra:', error);
      toast.error('Erro ao criar regra');
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const handleUpdateRule = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const updatedRule = await customValidationRuleService.updateRule(id, formData);
      setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
      setViewMode('list');
      setSelectedRule(null);
      resetForm();
      toast.success('Regra atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar regra:', error);
      toast.error('Erro ao atualizar regra');
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const handleDeleteRule = useCallback(async (id: string) => {
    try {
      await customValidationRuleService.deleteRule(id);
      setRules(prev => prev.filter(rule => rule.id !== id));
      toast.success('Regra removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover regra:', error);
      toast.error('Erro ao remover regra');
    }
  }, []);

  const handleToggleRule = useCallback(async (id: string, enabled: boolean) => {
    try {
      const updatedRule = await customValidationRuleService.updateRule(id, { enabled });
      setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
      toast.success(`Regra ${enabled ? 'ativada' : 'desativada'}`);
    } catch (error) {
      console.error('Erro ao alterar status da regra:', error);
      toast.error('Erro ao alterar status da regra');
    }
  }, []);

  const handleEditRule = useCallback((rule: CustomValidationRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      category: rule.category,
      severity: rule.severity,
      diagramTypes: rule.diagramTypes,
      enabled: rule.enabled,
      conditions: rule.conditions,
      actions: rule.actions
    });
    setViewMode('edit');
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      severity: 'warning',
      diagramTypes: [],
      enabled: true,
      conditions: [],
      actions: []
    });
  }, []);

  const toggleRuleExpansion = useCallback((ruleId: string) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  }, []);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rule.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
      const matchesSeverity = filterSeverity === 'all' || rule.severity === filterSeverity;
      
      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [rules, searchTerm, filterCategory, filterSeverity]);

  const getSeverityIcon = useCallback((severity: CustomValidationRule['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getSeverityColor = useCallback((severity: CustomValidationRule['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderRulesList = () => (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar regras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as FilterCategory)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="structure">Estrutura</SelectItem>
            <SelectItem value="bpmn">BPMN</SelectItem>
            <SelectItem value="connectivity">Conectividade</SelectItem>
            <SelectItem value="labeling">Rotulagem</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="custom">Customizada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={(value) => setFilterSeverity(value as FilterSeverity)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Severidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Regras */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {filteredRules.map(rule => (
            <Card key={rule.id} className="border">
              <Collapsible
                open={expandedRules.has(rule.id)}
                onOpenChange={() => toggleRuleExpansion(rule.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedRules.has(rule.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                        {getSeverityIcon(rule.severity)}
                        <div>
                          <CardTitle className="text-sm font-medium">{rule.name}</CardTitle>
                          <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-xs', getSeverityColor(rule.severity))}>
                          {rule.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rule.category}
                        </Badge>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Tipos de Diagrama:</Label>
                        <div className="flex gap-1 mt-1">
                          {rule.diagramTypes.map(type => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Condições: {rule.conditions.length}</Label>
                        <Label className="text-xs font-medium text-gray-600 ml-4">Ações: {rule.actions.length}</Label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRule(rule);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRuleToDelete(rule.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const renderRuleForm = () => (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Regra</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Limite de Nós"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as CustomValidationRule['category'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="structure">Estrutura</SelectItem>
                  <SelectItem value="bpmn">BPMN</SelectItem>
                  <SelectItem value="connectivity">Conectividade</SelectItem>
                  <SelectItem value="labeling">Rotulagem</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="custom">Customizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o que esta regra valida..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">Severidade</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as CustomValidationRule['severity'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="enabled">Regra Ativa</Label>
            </div>
          </div>

          <div>
            <Label>Tipos de Diagrama</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(['flowchart', 'bpmn', 'uml', 'erd', 'network'] as DiagramType[]).map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`diagram-${type}`}
                    checked={formData.diagramTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          diagramTypes: [...prev.diagramTypes, type]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          diagramTypes: prev.diagramTypes.filter(t => t !== type)
                        }));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`diagram-${type}`} className="text-sm capitalize">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condições */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condições de Validação</CardTitle>
          <p className="text-sm text-gray-600">
            Defina quando esta regra deve ser aplicada
          </p>
        </CardHeader>
        <CardContent>
          <ConditionBuilder
            conditions={formData.conditions}
            onChange={(conditions) => setFormData(prev => ({ ...prev, conditions }))}
            diagramTypes={formData.diagramTypes}
          />
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações de Validação</CardTitle>
          <p className="text-sm text-gray-600">
            Defina o que acontece quando as condições são atendidas
          </p>
        </CardHeader>
        <CardContent>
          <ActionBuilder
            actions={formData.actions}
            onChange={(actions) => setFormData(prev => ({ ...prev, actions }))}
          />
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={viewMode === 'create' ? handleCreateRule : () => selectedRule && handleUpdateRule(selectedRule.id)}
          disabled={isLoading || !formData.name.trim() || formData.conditions.length === 0 || formData.actions.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          {viewMode === 'create' ? 'Criar Regra' : 'Salvar Alterações'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setViewMode('list');
            setSelectedRule(null);
            resetForm();
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );

  // ========================================================================
  // RENDER PRINCIPAL
  // ========================================================================

  return (
    <TooltipProvider>
      <Card className={cn('w-full max-w-4xl mx-auto', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gerenciador de Regras de Validação
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Crie e gerencie regras personalizadas para validação de diagramas
              </p>
            </div>
            <div className="flex gap-2">
              {viewMode === 'list' && (
                <Button
                  onClick={() => {
                    resetForm();
                    setViewMode('create');
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Lista de Regras ({rules.length})</TabsTrigger>
              <TabsTrigger value={viewMode === 'edit' ? 'edit' : 'create'}>
                {viewMode === 'edit' ? 'Editar Regra' : 'Nova Regra'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              {renderRulesList()}
            </TabsContent>
            
            <TabsContent value="create" className="mt-6">
              {renderRuleForm()}
            </TabsContent>
            
            <TabsContent value="edit" className="mt-6">
              {renderRuleForm()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialog de Confirmação de Remoção */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja remover esta regra? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setRuleToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (ruleToDelete) {
                  handleDeleteRule(ruleToDelete);
                }
                setDeleteConfirmOpen(false);
                setRuleToDelete(null);
              }}
            >
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CustomRuleManager;