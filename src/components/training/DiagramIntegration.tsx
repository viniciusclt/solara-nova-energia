// ============================================================================
// DiagramIntegration - Componente integrado para ferramentas de diagramas
// ============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Plus,
  Save,
  Download,
  Upload,
  Share2,
  Settings,
  Grid,
  Eye,
  EyeOff,
  FileText,
  Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDiagramIntegration, DiagramType, NodeType, ToolType } from '@/hooks/useDiagramIntegration';
import { DiagramToolPalette } from '@/components/diagrams/DiagramToolPalette';
import { DiagramPropertiesPanel } from '@/components/diagrams/DiagramPropertiesPanel';

// ============================================================================
// Types & Interfaces
// ============================================================================

// Os tipos são importados do hook useDiagramIntegration

interface DiagramIntegrationProps {
  initialData?: DiagramData;
  type?: DiagramType;
  readOnly?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  onSave?: (data: DiagramData) => void;
  onExport?: (data: DiagramData, format: 'png' | 'svg' | 'json' | 'pdf') => void;
  onShare?: (data: DiagramData) => void;
  className?: string;
}

// ============================================================================
// Templates & Presets
// ============================================================================

const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'flowchart-basic',
    name: 'Fluxograma Básico',
    description: 'Template para processos simples',
    type: 'flowchart',
    preview: '🔄',
    data: {
      title: 'Novo Fluxograma',
      type: 'flowchart',
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Início', color: '#10b981', backgroundColor: '#d1fae5' }
        },
        {
          id: 'process',
          type: 'process',
          position: { x: 250, y: 150 },
          data: { label: 'Processo', color: '#3b82f6', backgroundColor: '#dbeafe' }
        },
        {
          id: 'decision',
          type: 'decision',
          position: { x: 250, y: 250 },
          data: { label: 'Decisão?', color: '#f59e0b', backgroundColor: '#fef3c7' }
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 250, y: 350 },
          data: { label: 'Fim', color: '#ef4444', backgroundColor: '#fee2e2' }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'process', type: 'straight' },
        { id: 'e2', source: 'process', target: 'decision', type: 'straight' },
        { id: 'e3', source: 'decision', target: 'end', type: 'straight' }
      ]
    }
  },
  {
    id: 'mindmap-basic',
    name: 'Mapa Mental Básico',
    description: 'Template para brainstorming',
    type: 'mindmap',
    preview: '🧠',
    data: {
      title: 'Novo Mapa Mental',
      type: 'mindmap',
      nodes: [
        {
          id: 'root',
          type: 'root',
          position: { x: 400, y: 200 },
          data: { label: 'Ideia Central', color: '#8b5cf6', backgroundColor: '#f3e8ff' }
        },
        {
          id: 'branch1',
          type: 'branch',
          position: { x: 200, y: 100 },
          data: { label: 'Tópico 1', color: '#06b6d4', backgroundColor: '#cffafe' }
        },
        {
          id: 'branch2',
          type: 'branch',
          position: { x: 600, y: 100 },
          data: { label: 'Tópico 2', color: '#84cc16', backgroundColor: '#ecfccb' }
        },
        {
          id: 'branch3',
          type: 'branch',
          position: { x: 200, y: 300 },
          data: { label: 'Tópico 3', color: '#f97316', backgroundColor: '#fed7aa' }
        }
      ],
      edges: [
        { id: 'e1', source: 'root', target: 'branch1', type: 'curved' },
        { id: 'e2', source: 'root', target: 'branch2', type: 'curved' },
        { id: 'e3', source: 'root', target: 'branch3', type: 'curved' }
      ]
    }
  },
  {
    id: 'organogram-basic',
    name: 'Organograma Básico',
    description: 'Template para estrutura organizacional',
    type: 'organogram',
    preview: '👥',
    data: {
      title: 'Nova Estrutura Organizacional',
      type: 'organogram',
      nodes: [
        {
          id: 'ceo',
          type: 'ceo',
          position: { x: 400, y: 50 },
          data: { label: 'CEO', description: 'Chief Executive Officer', color: '#dc2626', backgroundColor: '#fee2e2' }
        },
        {
          id: 'director1',
          type: 'director',
          position: { x: 200, y: 150 },
          data: { label: 'Diretor Técnico', color: '#2563eb', backgroundColor: '#dbeafe' }
        },
        {
          id: 'director2',
          type: 'director',
          position: { x: 600, y: 150 },
          data: { label: 'Diretor Comercial', color: '#7c3aed', backgroundColor: '#ede9fe' }
        },
        {
          id: 'manager1',
          type: 'manager',
          position: { x: 100, y: 250 },
          data: { label: 'Gerente TI', color: '#059669', backgroundColor: '#d1fae5' }
        },
        {
          id: 'manager2',
          type: 'manager',
          position: { x: 300, y: 250 },
          data: { label: 'Gerente Projetos', color: '#059669', backgroundColor: '#d1fae5' }
        }
      ],
      edges: [
        { id: 'e1', source: 'ceo', target: 'director1', type: 'straight' },
        { id: 'e2', source: 'ceo', target: 'director2', type: 'straight' },
        { id: 'e3', source: 'director1', target: 'manager1', type: 'straight' },
        { id: 'e4', source: 'director1', target: 'manager2', type: 'straight' }
      ]
    }
  }
];

const NODE_TYPES = {
  flowchart: [
    { type: 'start', label: 'Início', icon: Play, color: '#10b981' },
    { type: 'process', label: 'Processo', icon: Square, color: '#3b82f6' },
    { type: 'decision', label: 'Decisão', icon: Diamond, color: '#f59e0b' },
    { type: 'end', label: 'Fim', icon: CheckCircle, color: '#ef4444' },
    { type: 'data', label: 'Dados', icon: FileText, color: '#8b5cf6' },
    { type: 'document', label: 'Documento', icon: FileText, color: '#06b6d4' }
  ],
  mindmap: [
    { type: 'root', label: 'Raiz', icon: Brain, color: '#8b5cf6' },
    { type: 'branch', label: 'Ramo', icon: GitBranch, color: '#06b6d4' },
    { type: 'leaf', label: 'Folha', icon: Circle, color: '#84cc16' },
    { type: 'idea', label: 'Ideia', icon: AlertTriangle, color: '#f97316' }
  ],
  organogram: [
    { type: 'ceo', label: 'CEO', icon: Users, color: '#dc2626' },
    { type: 'director', label: 'Diretor', icon: Users, color: '#2563eb' },
    { type: 'manager', label: 'Gerente', icon: Users, color: '#059669' },
    { type: 'employee', label: 'Funcionário', icon: Users, color: '#64748b' },
    { type: 'department', label: 'Departamento', icon: Users, color: '#7c3aed' }
  ]
};

// ============================================================================
// Main Component
// ============================================================================

export const DiagramIntegration: React.FC<DiagramIntegrationProps> = ({
  initialData,
  type = 'flowchart',
  readOnly = false,
  showToolbar = true,
  showSidebar = true,
  onSave,
  onExport,
  onShare,
  className
}) => {
  // ============================================================================
  // Hook de Integração de Diagramas
  // ============================================================================
  
  const {
    diagramData,
    selectedNodes,
    selectedEdges,
    selectedTool,
    showGrid,
    showMinimap,
    history,
    historyIndex,
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    addEdge,
    updateEdge,
    deleteEdge,
    selectNodes,
    selectEdges,
    setSelectedTool,
    setShowGrid,
    setShowMinimap,
    undo,
    redo,
    saveDiagram,
    exportDiagram,
    importDiagram,
    validateDiagram,
    canUndo,
    canRedo
  } = useDiagramIntegration(initialData || {
    id: `diagram-${Date.now()}`,
    title: `Novo ${type === 'flowchart' ? 'Fluxograma' : type === 'mindmap' ? 'Mapa Mental' : 'Organograma'}`,
    type,
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Usuário',
      version: '1.0',
      tags: []
    }
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleSave = useCallback(() => {
    if (onSave) {
      const updatedData = {
        ...diagramData,
        metadata: {
          ...diagramData.metadata,
          updatedAt: new Date()
        }
      };
      onSave(updatedData);
      setHasUnsavedChanges(false);
      toast.success('Diagrama salvo com sucesso!');
    }
  }, [diagramData, onSave]);

  const handleExport = useCallback((format: 'png' | 'svg' | 'json' | 'pdf') => {
    if (onExport) {
      onExport(diagramData, format);
      toast.success(`Diagrama exportado como ${format.toUpperCase()}!`);
    }
  }, [diagramData, onExport]);

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(diagramData);
      toast.success('Link de compartilhamento copiado!');
    }
  }, [diagramData, onShare]);

  const handleTemplateSelect = useCallback((template: DiagramTemplate) => {
    setDiagramData({
      ...diagramData,
      ...template.data,
      id: diagramData.id,
      metadata: diagramData.metadata
    } as DiagramData);
    setShowTemplates(false);
    setHasUnsavedChanges(true);
    toast.success(`Template "${template.name}" aplicado!`);
  }, [diagramData]);

  const handleAddNode = useCallback((nodeType: NodeType) => {
    const newNode: DiagramNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: { x: 200, y: 200 },
      data: {
        label: `Novo ${nodeType}`,
        color: NODE_TYPES[diagramData.type].find(n => n.type === nodeType)?.color || '#64748b'
      }
    };

    setDiagramData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setHasUnsavedChanges(true);
  }, [diagramData.type]);

  const handleDeleteSelected = useCallback(() => {
    setDiagramData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => !selectedNodes.includes(node.id)),
      edges: prev.edges.filter(edge => 
        !selectedEdges.includes(edge.id) &&
        !selectedNodes.includes(edge.source) &&
        !selectedNodes.includes(edge.target)
      )
    }));
    setSelectedNodes([]);
    setSelectedEdges([]);
    setHasUnsavedChanges(true);
    toast.success('Elementos removidos!');
  }, [selectedNodes, selectedEdges]);

  // ============================================================================
  // Render Components
  // ============================================================================





  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <ReactFlowProvider>
      <TooltipProvider>
        <div className={cn('flex flex-col h-full bg-gray-100', className)}>
          {renderToolbar()}
          
          <div className="flex flex-1 overflow-hidden">
            {/* Tool Palette */}
            <DiagramToolPalette
              selectedTool={selectedTool}
              onToolChange={setSelectedTool}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              showMinimap={showMinimap}
              onToggleMinimap={() => setShowMinimap(!showMinimap)}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onSave={() => {
                saveDiagram();
                onSave?.(diagramData);
                setHasUnsavedChanges(false);
                toast.success('Diagrama salvo!');
              }}
              onExport={() => {
                const exported = exportDiagram();
                onExport?.(exported);
                toast.success('Diagrama exportado!');
              }}
              onImport={(file) => {
                // Implementar importação
                toast.success('Diagrama importado!');
              }}
              diagramType={diagramData.type}
              onAddNode={(nodeType) => {
                const newNode = {
                  id: `node-${Date.now()}`,
                  type: nodeType,
                  position: { x: 100, y: 100 },
                  data: {
                    label: `Novo ${nodeType}`,
                    description: ''
                  }
                };
                addNode(newNode);
                setHasUnsavedChanges(true);
              }}
            />
            
            {/* Canvas */}
            <div className="flex-1 relative">
              <ReactFlow
                nodes={diagramData.nodes}
                edges={diagramData.edges}
                onNodesChange={(changes) => {
                  // Implementar mudanças nos nós
                  setHasUnsavedChanges(true);
                }}
                onEdgesChange={(changes) => {
                  // Implementar mudanças nas arestas
                  setHasUnsavedChanges(true);
                }}
                onConnect={(connection) => {
                  const newEdge = {
                    id: `edge-${Date.now()}`,
                    source: connection.source!,
                    target: connection.target!,
                    type: 'default'
                  };
                  addEdge(newEdge);
                  setHasUnsavedChanges(true);
                }}
                onSelectionChange={(params) => {
                  selectNodes(params.nodes.map(n => n.id));
                  selectEdges(params.edges.map(e => e.id));
                }}
                fitView
                className="bg-white"
              >
                {showGrid && <Background />}
                <Controls />
                {showMinimap && <MiniMap />}
              </ReactFlow>
            </div>
            
            {/* Properties Panel */}
            {showProperties && (
              <DiagramPropertiesPanel
                selectedNodes={selectedNodes.map(id => 
                  diagramData.nodes.find(n => n.id === id)!
                ).filter(Boolean)}
                selectedEdges={selectedEdges.map(id => 
                  diagramData.edges.find(e => e.id === id)!
                ).filter(Boolean)}
                onUpdateNode={(nodeId, updates) => {
                  updateNode(nodeId, updates);
                  setHasUnsavedChanges(true);
                }}
                onUpdateEdge={(edgeId, updates) => {
                  updateEdge(edgeId, updates);
                  setHasUnsavedChanges(true);
                }}
                onDuplicateNode={(nodeId) => {
                  duplicateNode(nodeId);
                  setHasUnsavedChanges(true);
                }}
                onDeleteNode={(nodeId) => {
                  deleteNode(nodeId);
                  setHasUnsavedChanges(true);
                }}
                onDeleteEdge={(edgeId) => {
                  deleteEdge(edgeId);
                  setHasUnsavedChanges(true);
                }}
                diagramType={diagramData.type}
              />
            )}
          </div>

          {renderTemplateDialog()}
        </div>
      </TooltipProvider>
    </ReactFlowProvider>
  );
};

export default DiagramIntegration;