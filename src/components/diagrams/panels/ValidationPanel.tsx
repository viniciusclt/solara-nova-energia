// ============================================================================
// Validation Panel - Painel de validação de diagramas
// ============================================================================
// Painel para exibir resultados de validação e erros do diagrama
// ============================================================================

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Filter,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CustomRuleManager } from '../validation/CustomRuleManager';
import { ValidationReportExporter, generateValidationReport } from '../validation/ValidationReportExporter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  nodeId?: string;
  edgeId?: string;
  position?: { x: number; y: number };
  suggestions?: string[];
  autoFixable?: boolean;
}

export interface ValidationState {
  isValidating: boolean;
  lastValidated?: Date;
  issues: ValidationIssue[];
  score: number; // 0-100
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    total: number;
  };
}

interface ValidationPanelProps {
  validation: ValidationState;
  onClose: () => void;
  onValidate?: () => void;
  onFixIssue?: (issueId: string) => void;
  onGoToElement?: (nodeId?: string, edgeId?: string) => void;
  onExportReport?: () => void;
  onCustomRulesChange?: () => void;
  className?: string;
}

type IssueFilter = 'all' | 'errors' | 'warnings' | 'infos';
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

// ============================================================================
// UTILITÁRIOS
// ============================================================================

const getIssueIcon = (type: ValidationIssue['type']) => {
  switch (type) {
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const getIssueColor = (type: ValidationIssue['type']) => {
  switch (type) {
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'info':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getSeverityBadgeVariant = (severity: ValidationIssue['severity']) => {
  switch (severity) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excelente';
  if (score >= 70) return 'Bom';
  if (score >= 50) return 'Regular';
  return 'Precisa melhorar';
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ValidationPanel: React.FC<ValidationPanelProps> = memo(({
  validation,
  onClose,
  onValidate,
  onFixIssue,
  onGoToElement,
  onExportReport,
  onCustomRulesChange,
  className = ''
}) => {
  // Valores padrão seguros para evitar erros quando validation está incompleto
  const safeValidation = {
    isValidating: validation?.isValidating ?? false,
    lastValidated: validation?.lastValidated,
    issues: validation?.issues ?? [],
    score: validation?.score ?? 0,
    summary: validation?.summary ?? {
      errors: 0,
      warnings: 0,
      infos: 0,
      total: 0
    }
  };
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showFixableOnly, setShowFixableOnly] = useState(false);
  const [showCustomRules, setShowCustomRules] = useState(false);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const filteredIssues = useMemo(() => {
    let filtered = safeValidation.issues;

    // Filtrar por tipo
    if (issueFilter !== 'all') {
      filtered = filtered.filter(issue => {
        switch (issueFilter) {
          case 'errors':
            return issue.type === 'error';
          case 'warnings':
            return issue.type === 'warning';
          case 'infos':
            return issue.type === 'info';
          default:
            return true;
        }
      });
    }

    // Filtrar por severidade
    if (severityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.severity === severityFilter);
    }

    // Filtrar apenas corrigíveis
    if (showFixableOnly) {
      filtered = filtered.filter(issue => issue.autoFixable);
    }

    return filtered;
  }, [safeValidation.issues, issueFilter, severityFilter, showFixableOnly]);

  const groupedIssues = useMemo(() => {
    const groups: Record<string, ValidationIssue[]> = {};
    
    filteredIssues.forEach(issue => {
      if (!groups[issue.category]) {
        groups[issue.category] = [];
      }
      groups[issue.category].push(issue);
    });

    return groups;
  }, [filteredIssues]);

  const handleGoToElement = useCallback((issue: ValidationIssue) => {
    if (onGoToElement) {
      onGoToElement(issue.nodeId, issue.edgeId);
    }
  }, [onGoToElement]);

  return (
    <div className={cn('validation-panel w-80 h-full bg-background border-l flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h2 className="font-semibold text-lg">Validação</h2>
          {safeValidation.isValidating && (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {onValidate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onValidate}
                    disabled={safeValidation.isValidating}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Revalidar diagrama</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Dialog open={showCustomRules} onOpenChange={setShowCustomRules}>
            <DialogTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gerenciar regras customizadas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerenciamento de Regras de Validação</DialogTitle>
              </DialogHeader>
              <CustomRuleManager
                onClose={() => setShowCustomRules(false)}
                onRuleChange={() => {
                  onCustomRulesChange?.();
                }}
              />
            </DialogContent>
          </Dialog>
          
          {onExportReport && (
            <ValidationReportExporter
              issues={filteredIssues}
              summary={safeValidation.summary}
              score={safeValidation.score}
              diagramName="Diagrama Atual"
              onExport={(format, options) => {
                const report = generateValidationReport(
                  filteredIssues,
                  safeValidation.summary,
                  safeValidation.score,
                  options,
                  'Diagrama Atual'
                );
                
                // Download do arquivo
                const blob = new Blob([report], { 
                  type: format === 'json' ? 'application/json' : 
                        format === 'csv' ? 'text/csv' : 
                        format === 'html' ? 'text/html' : 'text/plain'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `validation-report.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                onExportReport?.();
              }}
            />
          )}
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Score Summary */}
      <div className="p-4 border-b">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Pontuação de Qualidade</span>
              <span className={cn('text-lg font-bold', getScoreColor(safeValidation.score))}>
                {safeValidation.score}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={safeValidation.score} className="mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{getScoreLabel(safeValidation.score)}</span>
              {safeValidation.lastValidated && (
                <span>
                  Última validação: {safeValidation.lastValidated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Summary */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-red-50 border border-red-200">
            <div className="text-lg font-bold text-red-600">{safeValidation.summary.errors}</div>
            <div className="text-xs text-red-600">Erros</div>
          </div>
          <div className="p-2 rounded bg-yellow-50 border border-yellow-200">
            <div className="text-lg font-bold text-yellow-600">{safeValidation.summary.warnings}</div>
            <div className="text-xs text-yellow-600">Avisos</div>
          </div>
          <div className="p-2 rounded bg-blue-50 border border-blue-200">
            <div className="text-lg font-bold text-blue-600">{safeValidation.summary.infos}</div>
            <div className="text-xs text-blue-600">Infos</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        
        <div className="space-y-2">
          <Select value={issueFilter} onValueChange={(value: IssueFilter) => setIssueFilter(value)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Tipo de issue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="errors">Apenas erros</SelectItem>
              <SelectItem value="warnings">Apenas avisos</SelectItem>
              <SelectItem value="infos">Apenas informações</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={severityFilter} onValueChange={(value: SeverityFilter) => setSeverityFilter(value)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as severidades</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={showFixableOnly ? "default" : "outline"}
              onClick={() => setShowFixableOnly(!showFixableOnly)}
              className="h-8 text-xs"
            >
              {showFixableOnly ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              Apenas corrigíveis
            </Button>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {Object.keys(groupedIssues).length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {safeValidation.issues.length === 0 
                  ? 'Nenhum problema encontrado!' 
                  : 'Nenhum problema corresponde aos filtros.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedIssues).map(([category, issues]) => {
              const isExpanded = expandedCategories.has(category);
              
              return (
                <Collapsible
                  key={category}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {issues.length}
                      </Badge>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-2 mt-2">
                    {issues.map((issue) => (
                      <Card
                        key={issue.id}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/50',
                          getIssueColor(issue.type)
                        )}
                        onClick={() => handleGoToElement(issue)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            {getIssueIcon(issue.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium truncate">
                                  {issue.title}
                                </h4>
                                <Badge 
                                  variant={getSeverityBadgeVariant(issue.severity)}
                                  className="text-xs"
                                >
                                  {issue.severity}
                                </Badge>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mb-2">
                                {issue.description}
                              </p>
                              
                              {issue.suggestions && issue.suggestions.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium mb-1">Sugestões:</p>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {issue.suggestions.map((suggestion, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        <span>{suggestion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {issue.nodeId && (
                                    <Badge variant="outline" className="text-xs">
                                      Nó: {issue.nodeId}
                                    </Badge>
                                  )}
                                  {issue.edgeId && (
                                    <Badge variant="outline" className="text-xs">
                                      Aresta: {issue.edgeId}
                                    </Badge>
                                  )}
                                </div>
                                
                                {issue.autoFixable && onFixIssue && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onFixIssue(issue.id);
                                    }}
                                  >
                                    Corrigir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

ValidationPanel.displayName = 'ValidationPanel';

export default ValidationPanel;