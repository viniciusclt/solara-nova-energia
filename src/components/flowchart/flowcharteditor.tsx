// ============================================================================
// FlowchartEditor - Componente principal do editor de fluxogramas
// ============================================================================

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowProvider,
  ReactFlowInstance,
  BackgroundVariant,
  Panel,
  MarkerType,
  EdgeLabelRenderer,
  getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';

// Importar nós customizados
import { StartNode } from './nodes/StartNode';
import { ProcessNode } from './nodes/ProcessNode';
import { DecisionNode } from './nodes/DecisionNode';
import { EndNode } from './nodes/EndNode';
import { ConnectorNode } from './nodes/ConnectorNode';
import { DocumentNode } from './nodes/DocumentNode';
import { DataNode } from './nodes/DataNode';
import { CustomNode } from './nodes/CustomNode';
import { IntermediateNode } from './nodes/IntermediateNode';
import { SubprocessNode } from './nodes/SubprocessNode';
import { ParallelNode } from './nodes/ParallelNode';
import { InclusiveNode } from './nodes/InclusiveNode';
import { AnnotationNode } from './nodes/AnnotationNode';
import { MindMapNode } from './nodes/MindMapNode';
import { OrganogramNode } from './nodes/OrganogramNode';
import {
  FlowchartDocument,
  FlowchartNode,
  FlowchartEdge,
  FlowchartNodeType,
  FlowchartPosition,
  FLOWCHART_NODE_TYPES,
  FLOWCHART_CATEGORIES,
  FLOWCHART_STATUS_OPTIONS
} from '@/types/flowchart';
import { useFlowchartEditor, useFlowchart } from '@/hooks/useflowchart';
import { useMindMap } from '@/hooks/useMindMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Save,
  Download,
  Upload,
  Share2,
  Settings,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Copy,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Eye,
  EyeOff,
  MousePointer,
  Move,
  Square,
  Circle,
  Diamond,
  Triangle,
  ArrowRight,
  Plus,
  Trash2,
  MessageSquare,
  Users,
  History,
  CheckCircle,
  AlertTriangle,
  FileText,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Interfaces
// ============================================================================

export interface FlowchartEditorProps {
  flowchartId?: string;
  onSave?: (flowchart: FlowchartDocument) => void;
  onClose?: () => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  className?: string;
}

interface ToolbarProps {
  editorState: {
    history: {
      past: unknown[];
      future: unknown[];
    };
    viewport: {
      zoom: number;
    };
    showGrid: boolean;
    showMinimap: boolean;
    validationErrors: unknown[];
  };
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onToggleGrid: () => void;
  onToggleMinimap: () => void;
  onExport: (format: string) => void;
  onImportHTML: (file: File) => void;
  onValidate: () => void;
  edgeStyle: string;
  onEdgeStyleChange: (style: string) => void;
  connectionLineType: string;
  onConnectionLineTypeChange: (type: string) => void;
  viewMode: 'flowchart' | 'mindmap';
  onViewModeChange: (mode: 'flowchart' | 'mindmap') => void;
}

interface SidebarProps {
  onAddNode: (type: FlowchartNodeType, position: FlowchartPosition) => void;
  selectedNodes: string[];
  selectedEdges: string[];
  onDeleteSelected: () => void;
  viewMode: 'flowchart' | 'mindmap';
  onCreateMindMap?: (topic: string) => void;
  onAddMindMapChild?: (parentId: string, label: string, category?: string) => void;
  onArrangeRadial?: () => void;
  mindMapStats?: {
    totalNodes: number;
    levels: number;
    nodesByLevel: { [level: number]: number };
    hasRoot: boolean;
  };
}

interface NodePaletteProps {
  onAddNode: (type: FlowchartNodeType) => void;
}

// ============================================================================
// Componentes
// ============================================================================

const Toolbar: React.FC<ToolbarProps> = ({
  editorState,
  hasUnsavedChanges,
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleGrid,
  onToggleMinimap,
  onExport,
  onImportHTML,
  onValidate,
  edgeStyle,
  onEdgeStyleChange,
  connectionLineType,
  onConnectionLineTypeChange,
  viewMode,
  onViewModeChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportHTML(file);
    }
  }, [onImportHTML]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200 shadow-sm">
        {/* Salvar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasUnsavedChanges ? "default" : "outline"}
              size="sm"
              onClick={onSave}
              className={hasUnsavedChanges ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Salvar {hasUnsavedChanges ? "(alterações pendentes)" : ""}</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Desfazer/Refazer */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={editorState.history.past.length === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Desfazer (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={editorState.history.future.length === 0}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refazer (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Copiar/Recortar/Colar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copiar (Ctrl+C)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onCut}>
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recortar (Ctrl+X)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onPaste}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Colar (Ctrl+V)</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Zoom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Diminuir zoom</p>
          </TooltipContent>
        </Tooltip>

        <span className="text-sm text-gray-600 min-w-[60px] text-center">
          {Math.round(editorState.viewport.zoom * 100)}%
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Aumentar zoom</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onFitView}>
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ajustar à tela</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Alternar Grade */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editorState.showGrid ? "default" : "outline"}
              size="sm"
              onClick={onToggleGrid}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Alternar grade</p>
          </TooltipContent>
        </Tooltip>

        {/* Alternar Minimapa */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editorState.showMinimap ? "default" : "outline"}
              size="sm"
              onClick={onToggleMinimap}
            >
              {editorState.showMinimap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Alternar minimapa</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Estilo de Conexão */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Estilo:</span>
          <Select value={edgeStyle} onValueChange={onEdgeStyleChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="straight">Reta</SelectItem>
              <SelectItem value="step">Degrau</SelectItem>
              <SelectItem value="smoothstep">Suave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Linha de Conexão */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Linha:</span>
          <Select value={connectionLineType} onValueChange={onConnectionLineTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Curva</SelectItem>
              <SelectItem value="straight">Reta</SelectItem>
              <SelectItem value="step">Degrau</SelectItem>
              <SelectItem value="smoothstep">Degrau Suave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Modo de Visualização */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Modo:</span>
          <Select value={viewMode} onValueChange={(value: 'flowchart' | 'mindmap') => onViewModeChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flowchart">Fluxograma</SelectItem>
              <SelectItem value="mindmap">Mapa Mental</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {/* Validação */}
        {editorState.validationErrors.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onValidate}>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="ml-1">{editorState.validationErrors.length}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{editorState.validationErrors.length} erro(s) de validação</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Exportar */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('png')}
              >
                Exportar como PNG
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('svg')}
              >
                Exportar como SVG
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('json')}
              >
                Exportar como JSON
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Importar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Importar arquivo</p>
          </TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.html"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
};

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const nodeCategories = {
    'Básicos': [
      { type: 'start' as FlowchartNodeType, label: 'Início', icon: Circle, color: 'bg-green-100 text-green-700' },
      { type: 'process' as FlowchartNodeType, label: 'Processo', icon: Square, color: 'bg-blue-100 text-blue-700' },
      { type: 'decision' as FlowchartNodeType, label: 'Decisão', icon: Diamond, color: 'bg-yellow-100 text-yellow-700' },
      { type: 'end' as FlowchartNodeType, label: 'Fim', icon: Circle, color: 'bg-red-100 text-red-700' },
    ],
    'Avançados': [
      { type: 'connector' as FlowchartNodeType, label: 'Conector', icon: Circle, color: 'bg-gray-100 text-gray-700' },
      { type: 'document' as FlowchartNodeType, label: 'Documento', icon: FileText, color: 'bg-purple-100 text-purple-700' },
      { type: 'data' as FlowchartNodeType, label: 'Dados', icon: Database, color: 'bg-indigo-100 text-indigo-700' },
      { type: 'subprocess' as FlowchartNodeType, label: 'Subprocesso', icon: Square, color: 'bg-orange-100 text-orange-700' },
    ],
    'Especiais': [
      { type: 'parallel' as FlowchartNodeType, label: 'Paralelo', icon: ArrowRight, color: 'bg-teal-100 text-teal-700' },
      { type: 'inclusive' as FlowchartNodeType, label: 'Inclusivo', icon: Diamond, color: 'bg-pink-100 text-pink-700' },
      { type: 'annotation' as FlowchartNodeType, label: 'Anotação', icon: MessageSquare, color: 'bg-amber-100 text-amber-700' },
      { type: 'organogram' as FlowchartNodeType, label: 'Organograma', icon: Users, color: 'bg-violet-100 text-violet-700' },
      { type: 'custom' as FlowchartNodeType, label: 'Customizado', icon: Settings, color: 'bg-slate-100 text-slate-700' },
    ]
  };

  const onDragStart = (event: React.DragEvent, nodeType: FlowchartNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="space-y-4">
      {Object.entries(nodeCategories).map(([category, nodes]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
          <div className="grid grid-cols-2 gap-2">
            {nodes.map((node) => {
              const IconComponent = node.icon;
              return (
                <Button
                  key={node.type}
                  variant="outline"
                  size="sm"
                  className={`h-auto p-3 flex flex-col items-center gap-1 ${node.color} border-2 hover:border-gray-400 cursor-grab active:cursor-grabbing`}
                  onClick={() => onAddNode(node.type)}
                  draggable
                  onDragStart={(event) => onDragStart(event, node.type)}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs">{node.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  onAddNode,
  selectedNodes,
  selectedEdges,
  onDeleteSelected,
  viewMode,
  onCreateMindMap,
  onAddMindMapChild,
  onArrangeRadial,
  mindMapStats
}) => {
  const [newMindMapTopic, setNewMindMapTopic] = useState('');
  const [newChildLabel, setNewChildLabel] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');

  const handleAddNode = useCallback((type: FlowchartNodeType) => {
    // Adicionar nó no centro da tela
    const position: FlowchartPosition = { x: 400, y: 300 };
    onAddNode(type, position);
  }, [onAddNode]);

  const handleCreateMindMap = useCallback(() => {
    if (newMindMapTopic.trim() && onCreateMindMap) {
      onCreateMindMap(newMindMapTopic.trim());
      setNewMindMapTopic('');
      toast.success('Mapa mental criado!');
    }
  }, [newMindMapTopic, onCreateMindMap]);

  const handleAddMindMapChild = useCallback(() => {
    if (newChildLabel.trim() && selectedParentId && onAddMindMapChild) {
      onAddMindMapChild(selectedParentId, newChildLabel.trim());
      setNewChildLabel('');
      toast.success('Nó filho adicionado!');
    }
  }, [newChildLabel, selectedParentId, onAddMindMapChild]);

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      {viewMode === 'flowchart' ? (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Elementos</h3>
            <NodePalette onAddNode={handleAddNode} />
          </div>

          {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Selecionados</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {selectedNodes.length} nó(s), {selectedEdges.length} conexão(ões)
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteSelected}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Selecionados
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Mapa Mental</h3>
            
            {/* Criar novo mapa mental */}
            <div className="space-y-2 mb-4">
              <Input
                placeholder="Tópico central"
                value={newMindMapTopic}
                onChange={(e) => setNewMindMapTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateMindMap()}
              />
              <Button
                onClick={handleCreateMindMap}
                disabled={!newMindMapTopic.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Mapa Mental
              </Button>
            </div>

            {/* Adicionar nó filho */}
            {selectedNodes.length === 1 && (
              <div className="space-y-2 mb-4">
                <Input
                  placeholder="Novo tópico filho"
                  value={newChildLabel}
                  onChange={(e) => setNewChildLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMindMapChild()}
                />
                <Button
                  onClick={handleAddMindMapChild}
                  disabled={!newChildLabel.trim()}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Filho
                </Button>
              </div>
            )}

            {/* Arranjo radial */}
            {onArrangeRadial && (
              <Button
                onClick={onArrangeRadial}
                className="w-full mb-4"
                variant="outline"
              >
                <Move className="h-4 w-4 mr-2" />
                Arranjo Radial
              </Button>
            )}

            {/* Estatísticas */}
            {mindMapStats && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total de nós:</span>
                    <Badge variant="secondary">{mindMapStats.totalNodes}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Níveis:</span>
                    <Badge variant="secondary">{mindMapStats.levels}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tem raiz:</span>
                    <Badge variant={mindMapStats.hasRoot ? "default" : "destructive"}>
                      {mindMapStats.hasRoot ? "Sim" : "Não"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// Componente Principal
// ============================================================================

export const FlowchartEditor: React.FC<FlowchartEditorProps> = ({
  flowchartId,
  onSave,
  onClose,
  readOnly = false,
  showToolbar = true,
  showSidebar = true,
  className = ''
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [edgeStyle, setEdgeStyle] = useState('default');
  const [connectionLineType, setConnectionLineType] = useState('default');
  const [viewMode, setViewMode] = useState<'flowchart' | 'mindmap'>('flowchart');

  // Hooks
  const {
    editorState,
    hasUnsavedChanges,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    selectNode,
    selectEdge,
    setEditorState,
    undo,
    redo,
    copy,
    cut,
    paste,
    save,
    load,
    exportFlowchart,
    importFlowchart,
    validate,
    deselectAllNodes,
    deselectAllEdges,
    selectAllNodes,
    selectAllEdges,
  } = useFlowchartEditor(flowchartId);

  // Tipos de nós
  const nodeTypes = useMemo(() => ({
    start: StartNode,
    process: ProcessNode,
    decision: DecisionNode,
    end: EndNode,
    connector: ConnectorNode,
    document: DocumentNode,
    data: DataNode,
    custom: CustomNode,
    intermediate: IntermediateNode,
    subprocess: SubprocessNode,
    parallel: ParallelNode,
    inclusive: InclusiveNode,
    annotation: AnnotationNode,
    mindmap: MindMapNode,
    organogram: OrganogramNode,
  }), []);

  // Handlers para seleção
  const handleDeleteSelected = useCallback(() => {
    editorState.selectedNodes.forEach(nodeId => deleteNode(nodeId));
    editorState.selectedEdges.forEach(edgeId => deleteEdge(edgeId));
  }, [editorState.selectedNodes, editorState.selectedEdges, deleteNode, deleteEdge]);

  // Event listener para deletar elementos com a tecla Delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar se não estamos editando um input ou textarea
      const target = event.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (isEditing) return;

      if (!readOnly && (event.key === 'Delete' || event.key === 'Backspace')) {
        // Verificar se há elementos selecionados
        const hasSelectedElements = editorState.selectedNodes.length > 0 || editorState.selectedEdges.length > 0;
        
        if (hasSelectedElements) {
          event.preventDefault();
          handleDeleteSelected();
          toast.success(`${editorState.selectedNodes.length + editorState.selectedEdges.length} elemento(s) deletado(s)`);
        }
      }

      // Atalhos padrão de editor
      if (!readOnly && isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
          case 'c':
            event.preventDefault();
            copy();
            break;
          case 'x':
            event.preventDefault();
            cut();
            break;
          case 'v':
            event.preventDefault();
            paste();
            break;
          case 'a':
            event.preventDefault();
            selectAllNodes();
            selectAllEdges();
            break;
        }
      }

      // Limpar seleção com ESC
      if (event.key === 'Escape') {
        event.preventDefault();
        deselectAllNodes();
        deselectAllEdges();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editorState.selectedNodes, editorState.selectedEdges, readOnly, handleDeleteSelected, undo, redo, copy, cut, paste, selectAllNodes, selectAllEdges, deselectAllNodes, deselectAllEdges]);

  // Transformar nós para incluir funções de adicionar nós e arestas
  const enhancedNodes = useMemo(() => {
    return (editorState.history.present.nodes || []).map(node => ({
      ...node,
      selected: editorState.selectedNodes.includes(node.id),
      data: {
        ...node.data,
        isSelected: editorState.selectedNodes.includes(node.id),
        onAddNode: !readOnly ? addNode : undefined,
        onAddEdge: !readOnly ? addEdge : undefined,
        onUpdateNode: (nodeId: string, updates: Partial<FlowchartNode>) => {
          updateNode(nodeId, updates);
        }
      }
    }));
  }, [editorState.history.present.nodes, editorState.selectedNodes, addNode, addEdge, updateNode, readOnly]);

  // Handlers para React Flow
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        updateNode(change.id, { position: change.position });
      } else if (change.type === 'select') {
        // Atualizar estado de seleção
        setEditorState(prev => ({
          ...prev,
          selectedNodes: change.selected 
            ? [...prev.selectedNodes.filter(id => id !== change.id), change.id]
            : prev.selectedNodes.filter(id => id !== change.id)
        }));
      } else if (change.type === 'remove') {
        deleteNode(change.id);
      }
    });
  }, [updateNode, deleteNode, setEditorState]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'select') {
        // Atualizar estado de seleção de arestas
        setEditorState(prev => ({
          ...prev,
          selectedEdges: change.selected 
            ? [...prev.selectedEdges.filter(id => id !== change.id), change.id]
            : prev.selectedEdges.filter(id => id !== change.id)
        }));
      } else if (change.type === 'remove') {
        deleteEdge(change.id);
      }
    });
  }, [deleteEdge, setEditorState]);

  const mindMapHook = useMindMap({
    nodes: enhancedNodes,
    edges: editorState.history.present.edges || [],
    onNodesChange,
    onEdgesChange
  });

  // Handlers para toolbar
  const handleSave = useCallback(async () => {
    try {
      const flowchart = await save();
      if (onSave && flowchart) {
        onSave(flowchart);
      }
      toast.success('Fluxograma salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar fluxograma');
    }
  }, [save, onSave]);

  const handleExport = useCallback((format: string) => {
    exportFlowchart(format);
    toast.success(`Fluxograma exportado como ${format.toUpperCase()}`);
  }, [exportFlowchart]);

  const handleImport = useCallback((file: File) => {
    importFlowchart(file);
    toast.success('Fluxograma importado com sucesso!');
  }, [importFlowchart]);

  const handleValidate = useCallback(() => {
    const errors = validate();
    if (errors.length === 0) {
      toast.success('Fluxograma válido!');
    } else {
      toast.error(`${errors.length} erro(s) encontrado(s)`);
    }
  }, [validate]);

  // Handlers para viewport
  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  }, [reactFlowInstance]);

  // Handlers para configurações
  const handleToggleGrid = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showGrid: !prev.showGrid
    }));
  }, [setEditorState]);

  const handleToggleMinimap = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showMinimap: !prev.showMinimap
    }));
  }, [setEditorState]);

  // Handlers para mindmap
  const handleCreateMindMap = useCallback((centerTopic: string) => {
    mindMapHook.createInitialMindMap(centerTopic);
    setViewMode('mindmap');
  }, [mindMapHook]);

  const handleConvertToMindMap = useCallback(() => {
    mindMapHook.convertToMindMap();
    setViewMode('mindmap');
  }, [mindMapHook]);

  const handleAddMindMapChild = useCallback((parentId: string, label: string, category?: string) => {
    mindMapHook.addChildNode(parentId, label, category);
  }, [mindMapHook]);

  const handleArrangeRadial = useCallback(() => {
    mindMapHook.arrangeRadial();
  }, [mindMapHook]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      addEdge(connection.source, connection.target);
    }
  }, [addEdge]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type || !reactFlowBounds || !reactFlowInstance) {
      return;
    }

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    addNode(type as FlowchartNodeType, position);
  }, [reactFlowInstance, addNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showToolbar && (
        <Toolbar
          editorState={editorState}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onUndo={undo}
          onRedo={redo}
          onCopy={copy}
          onCut={cut}
          onPaste={paste}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onToggleGrid={handleToggleGrid}
          onToggleMinimap={handleToggleMinimap}
          onExport={handleExport}
          onImportHTML={handleImport}
          onValidate={handleValidate}
          edgeStyle={edgeStyle}
          onEdgeStyleChange={setEdgeStyle}
          connectionLineType={connectionLineType}
          onConnectionLineTypeChange={setConnectionLineType}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={enhancedNodes}
              edges={editorState.history.present.edges || []}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodesDraggable={!readOnly}
              nodesConnectable={!readOnly}
              elementsSelectable={!readOnly}
              selectNodesOnDrag={!readOnly}
              onPaneClick={handlePaneClick}
              connectionLineType={connectionLineType as any}
              defaultEdgeOptions={{
                type: edgeStyle,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: '#6B7280',
                },
                style: {
                  strokeWidth: 2,
                  stroke: '#6B7280',
                },
              }}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
              {editorState.showMinimap && <MiniMap />}
              {editorState.showGrid && (
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1}
                  color="#e5e7eb"
                />
              )}
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {showSidebar && (
          <Sidebar
            onAddNode={addNode}
            selectedNodes={editorState.selectedNodes}
            selectedEdges={editorState.selectedEdges}
            onDeleteSelected={handleDeleteSelected}
            viewMode={viewMode}
            onCreateMindMap={handleCreateMindMap}
            onAddMindMapChild={handleAddMindMapChild}
            onArrangeRadial={handleArrangeRadial}
            mindMapStats={mindMapHook.mindMapStats}
          />
        )}
      </div>
    </div>
  );
};

export default FlowchartEditor;