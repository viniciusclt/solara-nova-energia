// ============================================================================
// NLP Text Input - Componente para entrada de texto natural
// ============================================================================

import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Wand2, 
  Loader2, 
  FileText, 
  Brain, 
  Lightbulb, 
  Download,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { DiagramType } from '../../types/diagrams';
import { useNLPDiagram } from '../../hooks/useNLPDiagram';
import { cn } from '../../lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface NLPTextInputProps {
  onDiagramGenerated?: (nodes: any[], edges: any[]) => void;
  className?: string;
  placeholder?: string;
  defaultDiagramType?: DiagramType;
  showHistory?: boolean;
  maxHeight?: string;
}

// ============================================================================
// EXEMPLOS DE TEXTO
// ============================================================================

const EXAMPLE_TEXTS = {
  flowchart: [
    "Iniciar processo de vendas. Verificar se cliente tem crédito aprovado. Se sim, processar pedido e enviar para entrega. Se não, solicitar aprovação financeira. Finalizar com confirmação de venda.",
    "Começar com recebimento de solicitação. Analisar documentos. Decidir se está completo. Se não, retornar para correção. Se sim, aprovar e arquivar."
  ],
  mindmap: [
    "Energia Solar: inclui painéis fotovoltaicos, inversores, baterias, monitoramento. Benefícios: economia, sustentabilidade, valorização imobiliária. Instalação: projeto, licenças, montagem, comissionamento.",
    "Marketing Digital: SEO, redes sociais, email marketing, conteúdo. Métricas: conversão, engajamento, ROI. Ferramentas: Analytics, CRM, automação."
  ],
  orgchart: [
    "CEO lidera a empresa. Diretor Comercial reporta ao CEO e chefia gerentes de vendas. Diretor Técnico reporta ao CEO e supervisiona engenheiros e instaladores.",
    "Presidente da empresa. Gerente de RH subordinado ao presidente. Coordenador de recrutamento reporta ao gerente de RH. Analistas de RH reportam ao coordenador."
  ]
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function NLPTextInput({
  onDiagramGenerated,
  className,
  placeholder = "Descreva seu processo, organização ou conceitos em linguagem natural...",
  defaultDiagramType,
  showHistory = true,
  maxHeight = "400px"
}: NLPTextInputProps) {
  // ============================================================================
  // HOOKS E ESTADO
  // ============================================================================
  
  const {
    state,
    processText,
    clearResult,
    retryLastProcessing,
    applyToDiagram,
    exportResult,
    getConfidenceLevel,
    getSuggestions
  } = useNLPDiagram();
  
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState<DiagramType | undefined>(defaultDiagramType);
  const [showExamples, setShowExamples] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleProcess = async () => {
    if (!inputText.trim()) return;
    
    await processText(inputText, selectedType);
  };
  
  const handleApplyToDiagram = () => {
    if (!onDiagramGenerated) return;
    
    applyToDiagram((nodes, edges) => {
      onDiagramGenerated(nodes, edges);
    });
  };
  
  const handleExampleClick = (example: string) => {
    setInputText(example);
    setShowExamples(false);
    textareaRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleProcess();
    }
  };
  
  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================
  
  const getConfidenceBadge = () => {
    const level = getConfidenceLevel();
    if (!level) return null;
    
    const variants = {
      high: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      medium: { variant: 'secondary' as const, icon: AlertCircle, color: 'text-yellow-600' },
      low: { variant: 'outline' as const, icon: AlertCircle, color: 'text-red-600' }
    };
    
    const config = variants[level];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={cn("h-3 w-3", config.color)} />
        Confiança: {level === 'high' ? 'Alta' : level === 'medium' ? 'Média' : 'Baixa'}
      </Badge>
    );
  };
  
  const getDiagramTypeLabel = (type: DiagramType) => {
    const labels = {
      flowchart: 'Fluxograma',
      bpmn: 'BPMN',
      mindmap: 'Mapa Mental',
      orgchart: 'Organograma'
    };
    return labels[type];
  };
  
  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Geração de Diagramas via IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Descreva seu processo, organização ou conceitos em linguagem natural e deixe a IA criar o diagrama para você.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Seletor de tipo */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Tipo de diagrama:</label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as DiagramType)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Detectar automaticamente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Detectar automaticamente</SelectItem>
                <SelectItem value="flowchart">Fluxograma</SelectItem>
                <SelectItem value="bpmn">BPMN</SelectItem>
                <SelectItem value="mindmap">Mapa Mental</SelectItem>
                <SelectItem value="orgchart">Organograma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Área de texto */}
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[120px] resize-none"
              style={{ maxHeight }}
              disabled={state.isProcessing}
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{inputText.length} caracteres</span>
              <span>Ctrl+Enter para processar</span>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleProcess}
              disabled={!inputText.trim() || state.isProcessing}
              className="gap-2"
            >
              {state.isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {state.isProcessing ? 'Processando...' : 'Gerar Diagrama'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowExamples(!showExamples)}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Exemplos
            </Button>
            
            {state.result && (
              <>
                <Button
                  variant="outline"
                  onClick={retryLastProcessing}
                  disabled={state.isProcessing}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <Button
                  variant="outline"
                  onClick={clearResult}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </Button>
              </>
            )}
          </div>
          
          {/* Exemplos */}
          {showExamples && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3">Exemplos por tipo:</h4>
                
                {Object.entries(EXAMPLE_TEXTS).map(([type, examples]) => (
                  <div key={type} className="mb-4 last:mb-0">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">
                      {getDiagramTypeLabel(type as DiagramType)}
                    </h5>
                    <div className="space-y-2">
                      {examples.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(example)}
                          className="w-full text-left p-2 text-xs bg-muted/50 rounded border hover:bg-muted transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      {/* Resultado */}
      {state.result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultado da Geração
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {getConfidenceBadge()}
                
                <Badge variant="outline">
                  {getDiagramTypeLabel(state.result.diagramType)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {state.result.success ? (
              <>
                {/* Informações do resultado */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nós criados:</span>
                    <p className="text-muted-foreground">{state.result.nodes.length}</p>
                  </div>
                  <div>
                    <span className="font-medium">Conexões:</span>
                    <p className="text-muted-foreground">{state.result.edges.length}</p>
                  </div>
                  <div>
                    <span className="font-medium">Confiança:</span>
                    <p className="text-muted-foreground">{Math.round(state.result.confidence * 100)}%</p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Título e descrição */}
                <div>
                  <h4 className="font-medium">{state.result.title}</h4>
                  {state.result.description && (
                    <p className="text-sm text-muted-foreground mt-1">{state.result.description}</p>
                  )}
                </div>
                
                {/* Sugestões */}
                {getSuggestions().length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Sugestões de melhoria:
                    </h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {getSuggestions().map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-xs mt-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Botões de ação */}
                <div className="flex items-center gap-2 pt-2">
                  {onDiagramGenerated && (
                    <Button onClick={handleApplyToDiagram} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Aplicar ao Diagrama
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={exportResult} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar JSON
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h4 className="font-medium text-red-700">Erro no processamento</h4>
                <p className="text-sm text-red-600 mt-1">
                  {state.result.errors?.[0] || 'Erro desconhecido'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Erro geral */}
      {state.error && !state.result && (
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h4 className="font-medium text-red-700">Erro no processamento</h4>
              <p className="text-sm text-red-600 mt-1">{state.error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NLPTextInput;