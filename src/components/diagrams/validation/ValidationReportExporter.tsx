import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Settings } from 'lucide-react';
import { ValidationIssue, ValidationSummary } from '../panels/ValidationPanel';

export interface ValidationReportExporterProps {
  issues: ValidationIssue[];
  summary: ValidationSummary;
  score: number;
  diagramName?: string;
  onExport?: (format: string, options: ExportOptions) => void;
}

export interface ExportOptions {
  format: 'pdf' | 'html' | 'json' | 'csv';
  includeDetails: boolean;
  includeSummary: boolean;
  includeRecommendations: boolean;
  groupByCategory: boolean;
  filterBySeverity: string[];
}

const SEVERITY_OPTIONS = [
  { value: 'error', label: 'Erros', color: 'text-red-600' },
  { value: 'warning', label: 'Avisos', color: 'text-yellow-600' },
  { value: 'info', label: 'Informações', color: 'text-blue-600' }
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF', description: 'Relatório completo em PDF' },
  { value: 'html', label: 'HTML', description: 'Página web interativa' },
  { value: 'json', label: 'JSON', description: 'Dados estruturados' },
  { value: 'csv', label: 'CSV', description: 'Planilha de dados' }
];

export function ValidationReportExporter({
  issues,
  summary,
  score,
  diagramName = 'Diagrama',
  onExport
}: ValidationReportExporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeDetails: true,
    includeSummary: true,
    includeRecommendations: true,
    groupByCategory: true,
    filterBySeverity: ['error', 'warning', 'info']
  });

  const handleExport = () => {
    onExport?.(exportOptions.format, exportOptions);
    setIsOpen(false);
  };

  const toggleSeverityFilter = (severity: string) => {
    setExportOptions(prev => ({
      ...prev,
      filterBySeverity: prev.filterBySeverity.includes(severity)
        ? prev.filterBySeverity.filter(s => s !== severity)
        : [...prev.filterBySeverity, severity]
    }));
  };

  const filteredIssues = issues.filter(issue => 
    exportOptions.filterBySeverity.includes(issue.severity)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Relatório de Validação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Diagrama:</span>
                <span className="font-medium">{diagramName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pontuação de Qualidade:</span>
                <span className="font-medium">{score}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total de Issues:</span>
                <span className="font-medium">{filteredIssues.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Data:</span>
                <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Formato de Exportação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato de Exportação</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-xs text-muted-foreground">{format.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros de Severidade */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Incluir Severidades</Label>
            <div className="flex gap-4">
              {SEVERITY_OPTIONS.map(severity => (
                <div key={severity.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={severity.value}
                    checked={exportOptions.filterBySeverity.includes(severity.value)}
                    onCheckedChange={() => toggleSeverityFilter(severity.value)}
                  />
                  <Label
                    htmlFor={severity.value}
                    className={`text-sm ${severity.color}`}
                  >
                    {severity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Opções de Conteúdo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Conteúdo do Relatório</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={exportOptions.includeSummary}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeSummary: !!checked }))
                  }
                />
                <Label htmlFor="includeSummary" className="text-sm">
                  Incluir resumo executivo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={exportOptions.includeDetails}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeDetails: !!checked }))
                  }
                />
                <Label htmlFor="includeDetails" className="text-sm">
                  Incluir detalhes dos issues
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRecommendations"
                  checked={exportOptions.includeRecommendations}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeRecommendations: !!checked }))
                  }
                />
                <Label htmlFor="includeRecommendations" className="text-sm">
                  Incluir recomendações
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="groupByCategory"
                  checked={exportOptions.groupByCategory}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, groupByCategory: !!checked }))
                  }
                />
                <Label htmlFor="groupByCategory" className="text-sm">
                  Agrupar por categoria
                </Label>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Função utilitária para gerar o relatório
export function generateValidationReport(
  issues: ValidationIssue[],
  summary: ValidationSummary,
  score: number,
  options: ExportOptions,
  diagramName: string = 'Diagrama'
): string {
  const filteredIssues = issues.filter(issue => 
    options.filterBySeverity.includes(issue.severity)
  );

  switch (options.format) {
    case 'json':
      return JSON.stringify({
        diagram: diagramName,
        timestamp: new Date().toISOString(),
        score,
        summary: options.includeSummary ? summary : undefined,
        issues: options.includeDetails ? filteredIssues : undefined
      }, null, 2);

    case 'csv':
      const headers = ['Tipo', 'Severidade', 'Categoria', 'Título', 'Descrição', 'Nó/Aresta'];
      const rows = filteredIssues.map(issue => [
        issue.type,
        issue.severity,
        issue.category,
        issue.title,
        issue.description,
        issue.nodeId || issue.edgeId || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');

    case 'html':
      return generateHtmlReport(filteredIssues, summary, score, options, diagramName);

    default:
      return '';
  }
}

function generateHtmlReport(
  issues: ValidationIssue[],
  summary: ValidationSummary,
  score: number,
  options: ExportOptions,
  diagramName: string
): string {
  const groupedIssues = options.groupByCategory
    ? issues.reduce((acc, issue) => {
        if (!acc[issue.category]) acc[issue.category] = [];
        acc[issue.category].push(issue);
        return acc;
      }, {} as Record<string, ValidationIssue[]>)
    : { 'Todos os Issues': issues };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Validação - ${diagramName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .issue { border-left: 4px solid #ccc; padding: 10px; margin: 10px 0; }
        .error { border-left-color: #dc2626; }
        .warning { border-left-color: #d97706; }
        .info { border-left-color: #2563eb; }
        .category { margin: 20px 0; }
        .category h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Validação</h1>
        <p><strong>Diagrama:</strong> ${diagramName}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        <p><strong>Pontuação de Qualidade:</strong> ${score}%</p>
      </div>
      
      ${options.includeSummary ? `
        <div class="summary">
          <h2>Resumo</h2>
          <p><strong>Total de Issues:</strong> ${issues.length}</p>
          <p><strong>Erros:</strong> ${summary.errors}</p>
          <p><strong>Avisos:</strong> ${summary.warnings}</p>
          <p><strong>Informações:</strong> ${summary.infos}</p>
        </div>
      ` : ''}
      
      ${options.includeDetails ? Object.entries(groupedIssues).map(([category, categoryIssues]) => `
        <div class="category">
          <h3>${category}</h3>
          ${categoryIssues.map(issue => `
            <div class="issue ${issue.severity}">
              <h4>${issue.title}</h4>
              <p>${issue.description}</p>
              <small><strong>Tipo:</strong> ${issue.type} | <strong>Severidade:</strong> ${issue.severity}</small>
            </div>
          `).join('')}
        </div>
      `).join('') : ''}
    </body>
    </html>
  `;
}