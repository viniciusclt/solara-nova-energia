// ============================================================================
// Unified Diagram Editor - Editor unificado de diagramas
// ============================================================================
// Consolidação dos editores de /training e /flowcharts/editor
// Seguindo padrões BPMN 2.0 e referências do MindMeister
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  SelectionMode
} from 'reactflow';
import { cn } from '../../lib/utils';
import { useUnifiedDiagramEditor } from '../../hooks/useUnifiedDiagramEditor';
import {
  UnifiedDiagramEditorProps,
  UnifiedNodeType,
  DiagramType
} from '../../types/unified-diagram';



// Componentes do editor
import { UnifiedToolbar } from './toolbar/UnifiedToolbar';
import { UnifiedSidebar } from './sidebar/UnifiedSidebar';
import { UnifiedPropertiesPanel } from './properties/UnifiedPropertiesPanel';
import { UnifiedNodePalette } from './palette/UnifiedNodePalette';
import { ValidationPanel } from './panels/ValidationPanel';
import { CollaborationPanel } from './panels/CollaborationPanel';
import { CollaborationOverlay } from './collaboration/CollaborationOverlay';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useCustomValidation } from './hooks/useCustomValidation';
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization';
import { useRBACPermissions } from './hooks/useRBACPermissions';
import { PerformanceMonitor } from './performance/PerformanceMonitor';

// Nós BPMN unificados
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { ProcessNode } from './nodes/ProcessNode';
import { DecisionNode } from './nodes/DecisionNode';
import { SubprocessNode } from './nodes/SubprocessNode';
import { DocumentNode } from './nodes/DocumentNode';
import { DataNode } from './nodes/DataNode';
import { AnnotationNode } from './nodes/AnnotationNode';
import { IntermediateNode } from './nodes/IntermediateNode';
import { ParallelGatewayNode } from './nodes/ParallelGatewayNode';
import { InclusiveGatewayNode } from './nodes/InclusiveGatewayNode';
import { ExclusiveGatewayNode } from './nodes/ExclusiveGatewayNode';
import { ComplexGatewayNode } from './nodes/ComplexGatewayNode';
import { EventBasedGatewayNode } from './nodes/EventBasedGatewayNode';
import { ManualTaskNode } from './nodes/ManualTaskNode';
import { UserTaskNode } from './nodes/UserTaskNode';
import { ServiceTaskNode } from './nodes/ServiceTaskNode';
import { ScriptTaskNode } from './nodes/ScriptTaskNode';
import { BusinessRuleTaskNode } from './nodes/BusinessRuleTaskNode';
import { ReceiveTaskNode } from './nodes/ReceiveTaskNode';
import { SendTaskNode } from './nodes/SendTaskNode';
import { DatabaseNode } from './nodes/DatabaseNode';
import { GroupNode } from './nodes/GroupNode';

// Nós específicos para MindMap
import { MindMapRootNode } from './nodes/mindmap/MindMapRootNode';
import { MindMapMainNode } from './nodes/mindmap/MindMapMainNode';
import { MindMapBranchNode } from './nodes/mindmap/MindMapBranchNode';
import { MindMapLeafNode } from './nodes/mindmap/MindMapLeafNode';

// Nós específicos para Organograma
import { OrgCEONode } from './nodes/organogram/OrgCEONode';
import { OrgManagerNode } from './nodes/organogram/OrgManagerNode';
import { OrgEmployeeNode } from './nodes/organogram/OrgEmployeeNode';
import { OrgDepartmentNode } from './nodes/organogram/OrgDepartmentNode';

// Arestas customizadas
import { StraightEdge } from './edges/StraightEdge';
import { SmoothStepEdge } from './edges/SmoothStepEdge';
import { BezierEdge } from './edges/BezierEdge';
import { MindMapCurveEdge } from './edges/MindMapCurveEdge';
import { OrgHierarchyEdge } from './edges/OrgHierarchyEdge';

// Utilitários
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '../../shared/ui/resizable';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Maximize2,
  Minimize2,
  Users,
  Shield
} from 'lucide-react';
import diagramTemplateService from '../../services/DiagramTemplateService';
import { DiagramTemplate, ApplyTemplateData } from '../../types/diagramTemplates';
import TemplateSelector from './TemplateSelector';
import ExportDialog from './ExportDialog';
import { DiagramExportData, ExportResult } from '../../types/diagramExport';

// ============================================================================
// TIPOS DE NÓS E ARESTAS
// ============================================================================

const nodeTypes: NodeTypes = {
  // Eventos BPMN
  start: StartNode,
  end: EndNode,
  intermediate: IntermediateNode,
  
  // Atividades BPMN
  process: ProcessNode,
  subprocess: SubprocessNode,
  manual: ManualTaskNode,
  user: UserTaskNode,
  service: ServiceTaskNode,
  script: ScriptTaskNode,
  'business-rule': BusinessRuleTaskNode,
  receive: ReceiveTaskNode,
  send: SendTaskNode,
  
  // Gateways BPMN
  decision: DecisionNode,
  parallel: ParallelGatewayNode,
  inclusive: InclusiveGatewayNode,
  exclusive: ExclusiveGatewayNode,
  complex: ComplexGatewayNode,
  'event-based': EventBasedGatewayNode,
  
  // Artefatos BPMN
  document: DocumentNode,
  data: DataNode,
  database: DatabaseNode,
  annotation: AnnotationNode,
  group: GroupNode,
  
  // MindMap
  'mindmap-root': MindMapRootNode,
  'mindmap-main': MindMapMainNode,
  'mindmap-branch': MindMapBranchNode,
  'mindmap-leaf': MindMapLeafNode,
  
  // Organogram
  'org-ceo': OrgCEONode,
  'org-manager': OrgManagerNode,
  'org-employee': OrgEmployeeNode,
  'org-department': OrgDepartmentNode
};

const edgeTypes: EdgeTypes = {
  straight: StraightEdge,
  smoothstep: SmoothStepEdge,
  step: SmoothStepEdge, // Alias
  bezier: BezierEdge,
  'mindmap-curve': MindMapCurveEdge,
  'org-hierarchy': OrgHierarchyEdge
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

// Componente interno que usa os hooks do ReactFlow
const UnifiedDiagramEditorContent: React.FC<UnifiedDiagramEditorProps> = ({
  diagramId,
  initialDocument,
  type = 'flowchart',
  readOnly = false,
  showToolbar = true,
  showSidebar = true,
  showProperties = true,
  className,
  onSave,
  onClose,
  onExport,
  onShare,
  onCollaboratorJoin,
  onValidationChange
}) => {
  // ============================================================================
  // ESTADO E HOOKS
  // ============================================================================
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<UnifiedNodeType>('process');
  const [showValidation, setShowValidation] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  // Hook de permissões RBAC
  const rbacPermissions = useRBACPermissions({
    diagramId: diagramId || undefined,
    enableRealTimeUpdates: true
  });
  
  // Hook de colaboração
  const collaboration = useCollaboration({
    diagramId: diagramId || 'default',
    enabled: !readOnly && rbacPermissions.canPerformAction('edit_node'),
    onDiagramChange: (changes) => {
      // Verificar permissões antes de aplicar mudanças colaborativas
      if (!rbacPermissions.canPerformAction('edit_node')) {
        console.warn('Tentativa de aplicar mudanças colaborativas sem permissão');
        return;
      }
      
      // Aplicar mudanças colaborativas ao diagrama
      if (changes.nodes) {
        changes.nodes.forEach(nodeChange => {
          if (nodeChange.type === 'add' && rbacPermissions.canPerformAction('create_node')) {
            // Adicionar nó colaborativo
          } else if (nodeChange.type === 'update' && rbacPermissions.canPerformAction('edit_node')) {
            updateNode(nodeChange.id, nodeChange.data);
          } else if (nodeChange.type === 'delete' && rbacPermissions.canPerformAction('delete_node')) {
            deleteNode(nodeChange.id);
          }
        });
      }
      if (changes.edges) {
        changes.edges.forEach(edgeChange => {
          if (edgeChange.type === 'add' && rbacPermissions.canPerformAction('create_edge')) {
            // Adicionar aresta colaborativa
          } else if (edgeChange.type === 'update' && rbacPermissions.canPerformAction('edit_edge')) {
            updateEdge(edgeChange.id, edgeChange.data);
          } else if (edgeChange.type === 'delete' && rbacPermissions.canPerformAction('delete_edge')) {
            deleteEdge(edgeChange.id);
          }
        });
      }
    },
    onUserJoin: (user) => {
      toast.success(`${user.name} entrou na colaboração`);
      onCollaboratorJoin?.(user);
    },
    onUserLeave: (user) => {
      toast.info(`${user.name} saiu da colaboração`);
    }
  });

  // Hook de validação customizável
  const customValidation = useCustomValidation({
    nodes: editorState.document.nodes,
    edges: editorState.document.edges,
    diagramType: editorState.document.type,
    enabled: !readOnly
  });
  
  // Hook de otimização de performance
  const performanceOptimization = usePerformanceOptimization({
    nodes: editorState.document.nodes,
    edges: editorState.document.edges,
    config: {
      enableVirtualization: editorState.document.nodes.length > 100,
      enableLazyLoading: editorState.document.nodes.length > 200,
      enableLevelOfDetail: true,
      performanceThreshold: 100
    },
    onMetricsUpdate: (metrics) => {
      // Log métricas para debugging
      if (metrics.renderTime > 50) {
        console.warn('Performance: Render time alto:', metrics.renderTime + 'ms');
      }
    }
  });
  
  const {
    editorState,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    saveDocument,
    loadDocument,
    createNewDocument,
    exportDocument,
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    addEdgeConnection,
    updateEdge,
    deleteEdge,
    selectNodes,
    selectEdges,
    selectAll,
    clearSelection,
    copySelection,
    cutSelection,
    pasteFromClipboard,
    undo,
    redo,
    canUndo,
    canRedo,
    zoomToFit,
    zoomIn,
    zoomOut,
    centerView,
    validateDocument,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange
  } = useUnifiedDiagramEditor({
    diagramId,
    initialDocument,
    type,
    readOnly,
    onSave,
    onValidationChange
  });
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleNodeDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handlers para sincronização colaborativa com RBAC
  const handleNodesChangeWithCollaboration = useCallback((changes: NodeChange[]) => {
    // Verificar permissões antes de aplicar mudanças
    const filteredChanges = changes.filter(change => {
      if (change.type === 'remove' && !rbacPermissions.canPerformAction('delete_node')) {
        console.warn('Tentativa de remoção de nó sem permissão', { userRole: rbacPermissions.userRole });
        return false;
      }
      if ((change.type === 'position' || change.type === 'dimensions') && !rbacPermissions.canPerformAction('edit_node')) {
        console.warn('Tentativa de edição de nó sem permissão', { userRole: rbacPermissions.userRole });
        return false;
      }
      return true;
    });
    
    onNodesChange(filteredChanges);
    
    // Sincronizar mudanças com colaboração
    if (!readOnly && collaboration.isConnected && rbacPermissions.canPerformAction('edit_node')) {
      filteredChanges.forEach(change => {
        if (change.type === 'position' && change.position) {
          collaboration.syncDiagramChange({
            type: 'node_update',
            nodeId: change.id,
            data: { position: change.position },
            timestamp: Date.now()
          });
        } else if (change.type === 'select') {
          collaboration.syncDiagramChange({
            type: 'node_select',
            nodeId: change.id,
            data: { selected: change.selected },
            timestamp: Date.now()
          });
        }
      });
    }
  }, [onNodesChange, readOnly, collaboration, rbacPermissions]);
  
  const handleEdgesChangeWithCollaboration = useCallback((changes: EdgeChange[]) => {
    // Verificar permissões antes de aplicar mudanças
    const filteredChanges = changes.filter(change => {
      if (change.type === 'remove' && !rbacPermissions.canPerformAction('delete_edge')) {
        console.warn('Tentativa de remoção de aresta sem permissão', { userRole: rbacPermissions.userRole });
        return false;
      }
      return true;
    });
    
    onEdgesChange(filteredChanges);
    
    // Sincronizar mudanças com colaboração
    if (!readOnly && collaboration.isConnected && rbacPermissions.canPerformAction('edit_edge')) {
      filteredChanges.forEach(change => {
        if (change.type === 'select') {
          collaboration.syncDiagramChange({
            type: 'edge_select',
            edgeId: change.id,
            data: { selected: change.selected },
            timestamp: Date.now()
          });
        }
      });
    }
  }, [onEdgesChange, readOnly, collaboration, rbacPermissions]);
  
  const handleConnectWithCollaboration = useCallback((connection: Connection) => {
    // Verificar permissões antes de criar conexão
    if (!rbacPermissions.canPerformAction('create_edge')) {
      console.warn('Tentativa de criação de aresta sem permissão', { userRole: rbacPermissions.userRole });
      toast.error('Você não tem permissão para criar conexões');
      return;
    }
    
    onConnect(connection);
    
    // Sincronizar nova conexão com colaboração
    if (!readOnly && collaboration.isConnected) {
      collaboration.syncDiagramChange({
        type: 'edge_add',
        data: connection,
        timestamp: Date.now()
      });
    }
  }, [onConnect, readOnly, collaboration, rbacPermissions]);
  
  const handleNodeDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    
    // Verificar permissões antes de criar nó
    if (!rbacPermissions.canPerformAction('create_node')) {
      console.warn('Tentativa de criação de nó via drag and drop sem permissão', { userRole: rbacPermissions.userRole });
      toast.error('Você não tem permissão para criar nós');
      return;
    }
    
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;
    
    const reactFlowBounds = (event.target as Element).getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    };
    
    await addNode(nodeType as UnifiedNodeType, position);
  }, [addNode, rbacPermissions]);
  
  const handleCanvasClick = useCallback(async (event: React.MouseEvent) => {
    // Adicionar nó no clique duplo (inspirado no MindMeister)
    if (event.detail === 2 && selectedNodeType) {
      // Verificar permissões antes de criar nó
      if (!rbacPermissions.canPerformAction('create_node')) {
        console.warn('Tentativa de criação de nó via clique duplo sem permissão', { userRole: rbacPermissions.userRole });
        toast.error('Você não tem permissão para criar nós');
        return;
      }
      
      const rect = (event.target as Element).getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      await addNode(selectedNodeType, position);
    }
  }, [selectedNodeType, addNode, rbacPermissions]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Prevenir propagação para evitar conflitos com atalhos globais
    if (event.ctrlKey || event.metaKey) {
      event.stopPropagation();
    }
  }, []);
  
  const handleExport = useCallback(async (format: string) => {
    // Verificar permissões antes de exportar
    if (!rbacPermissions.canPerformAction('export_diagram')) {
      console.warn('Tentativa de exportação sem permissão', { userRole: rbacPermissions.userRole });
      toast.error('Você não tem permissão para exportar diagramas');
      return;
    }
    
    try {
      await exportDocument(format);
      if (onExport) {
        onExport(format, editorState.document);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar diagrama');
    }
  }, [exportDocument, onExport, editorState.document, rbacPermissions]);

  const handleOpenExportDialog = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleExportComplete = useCallback((result: ExportResult) => {
    if (result.success) {
      toast.success(`Diagrama exportado como ${result.format.toUpperCase()}`);
    } else {
      toast.error(`Erro na exportação: ${result.error}`);
    }
  }, []);

  // Preparar dados para exportação
  const exportData: DiagramExportData = useMemo(() => ({
    nodes: editorState.document.nodes,
    edges: editorState.document.edges,
    viewport: editorState.document.viewport,
    metadata: {
      title: editorState.document.title,
      description: editorState.document.description,
      type: editorState.document.type,
      version: editorState.document.version,
      createdAt: editorState.document.createdAt,
      updatedAt: editorState.document.updatedAt
    },
    styles: {
      theme: editorState.document.settings?.theme,
      customCSS: editorState.document.settings?.customCSS
    }
  }), [editorState.document]);
  
  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(editorState.document);
    } else {
      // Implementação padrão de compartilhamento
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência');
    }
  }, [onShare, editorState.document]);

  const handleApplyTemplate = useCallback(async (data: ApplyTemplateData) => {
    try {
      const template = await diagramTemplateService.getTemplate(data.templateId);
      if (!template) {
        toast.error('Template não encontrado');
        return;
      }

      // Se replaceExisting for true, limpar o diagrama atual
      if (data.replaceExisting) {
        // Limpar nós e arestas existentes
        editorState.document.nodes.forEach(node => deleteNode(node.id));
        editorState.document.edges.forEach(edge => deleteEdge(edge.id));
      }

      // Calcular offset de posição se especificado
      const offsetX = data.position?.x || 0;
      const offsetY = data.position?.y || 0;
      const scale = data.scale || 1;

      // Adicionar nós do template
      for (const templateNode of template.nodes) {
        const newNode = {
          ...templateNode,
          id: `${templateNode.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: templateNode.position.x * scale + offsetX,
            y: templateNode.position.y * scale + offsetY
          }
        };
        await addNode(templateNode.type as UnifiedNodeType, newNode.position, newNode.data);
      }

      // Mapear IDs antigos para novos
      const nodeIdMap = new Map();
      template.nodes.forEach((templateNode, index) => {
        const newNodeId = editorState.document.nodes[editorState.document.nodes.length - template.nodes.length + index]?.id;
        if (newNodeId) {
          nodeIdMap.set(templateNode.id, newNodeId);
        }
      });

      // Adicionar arestas do template
      for (const templateEdge of template.edges) {
        const sourceId = nodeIdMap.get(templateEdge.source);
        const targetId = nodeIdMap.get(templateEdge.target);
        
        if (sourceId && targetId) {
          await addEdgeConnection({
            source: sourceId,
            target: targetId,
            type: templateEdge.type,
            label: templateEdge.label,
            style: templateEdge.style
          });
        }
      }

      toast.success(`Template "${template.name}" aplicado com sucesso!`);
      
      // Ajustar visualização para mostrar todo o conteúdo
      setTimeout(() => {
        zoomToFit();
      }, 100);
      
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast.error('Erro ao aplicar template');
    }
  }, [addNode, deleteNode, deleteEdge, addEdgeConnection, editorState.document, zoomToFit]);
  
  const handleTemplateSelect = useCallback(async (template: DiagramTemplate) => {
    try {
      // Criar novo diagrama a partir do template
      const newDiagram = diagramTemplateService.createDiagramFromTemplate(template.id);
      
      if (newDiagram) {
        // Carregar o diagrama criado a partir do template
        await loadDocument(newDiagram);
        toast.success(`Template "${template.name}" aplicado com sucesso!`);
      } else {
        toast.error('Erro ao carregar template');
      }
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast.error('Erro ao aplicar template');
    }
  }, [loadDocument]);
  
  // ============================================================================
  // HANDLER PARA GERAÇÃO NLP
  // ============================================================================
  
  const handleNLPDiagramGenerated = useCallback((nodes: any[], edges: any[]) => {
    if (!permissions.canCreateNodes) {
      toast.error('Você não tem permissão para criar nós');
      return;
    }
    
    try {
      // Limpar diagrama atual se solicitado
      const shouldClear = nodes.length > 3; // Se muitos nós, sugerir limpeza
      
      if (shouldClear && editorState.document.nodes.length > 0) {
        const confirmed = window.confirm(
          'O diagrama atual será substituído pelo gerado pela IA. Deseja continuar?'
        );
        if (!confirmed) return;
        
        // Limpar nós e arestas existentes
        editorState.document.nodes.forEach(node => {
          deleteNode(node.id);
        });
        editorState.document.edges.forEach(edge => {
          deleteEdge(edge.id);
        });
      }
      
      // Adicionar nós gerados
      nodes.forEach(node => {
        addNode({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        });
      });
      
      // Adicionar arestas geradas
      edges.forEach(edge => {
        addEdgeConnection({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'smoothstep'
        });
      });
      
      // Ajustar visualização
      setTimeout(() => {
        zoomToFit();
      }, 100);
      
      toast.success(`Diagrama gerado com sucesso! ${nodes.length} nós e ${edges.length} conexões adicionados.`);
      
    } catch (error) {
      console.error('Erro ao aplicar diagrama NLP:', error);
      toast.error('Erro ao aplicar diagrama gerado pela IA');
    }
  }, [permissions.canCreateNodes, editorState.document, addNode, deleteNode, deleteEdge, addEdgeConnection, zoomToFit]);
  
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);
  
  // ============================================================================
  // CONFIGURAÇÕES DO REACTFLOW
  // ============================================================================
  
  const reactFlowProps = useMemo(() => ({
    nodes: performanceOptimization.optimizedNodes,
    edges: performanceOptimization.optimizedEdges,
    nodeTypes,
    edgeTypes,
    onNodesChange: handleNodesChangeWithCollaboration,
    onEdgesChange: handleEdgesChangeWithCollaboration,
    onConnect: handleConnectWithCollaboration,
    onSelectionChange,
    onDragOver: handleNodeDragOver,
    onDrop: handleNodeDrop,
    onClick: handleCanvasClick,
    onKeyDown: handleKeyDown,
    connectionMode: ConnectionMode.Loose,
    selectionMode: SelectionMode.Partial,
    multiSelectionKeyCode: editorState.document.settings.canvas.multiSelectionKeyCode,
    deleteKeyCode: editorState.document.settings.canvas.deleteKeyCode,
    panOnDrag: editorState.document.settings.canvas.panOnDrag,
    zoomOnScroll: editorState.document.settings.canvas.zoomOnScroll,
    zoomOnPinch: editorState.document.settings.canvas.zoomOnPinch,
    preventScrolling: editorState.document.settings.canvas.preventScrolling,
    nodesDraggable: editorState.document.settings.canvas.nodesDraggable && !readOnly,
    nodesConnectable: editorState.document.settings.canvas.nodesConnectable && !readOnly,
    elementsSelectable: editorState.document.settings.canvas.elementsSelectable,
    selectNodesOnDrag: editorState.document.settings.canvas.selectNodesOnDrag,
    fitView: true,
    fitViewOptions: { padding: 0.1 },
    attributionPosition: 'bottom-left' as const
  }), [
    editorState.document,
    handleNodesChangeWithCollaboration,
    handleEdgesChangeWithCollaboration,
    handleConnectWithCollaboration,
    onSelectionChange,
    handleNodeDragOver,
    handleNodeDrop,
    handleCanvasClick,
    handleKeyDown,
    readOnly
  ]);
  
  // ============================================================================
  // INDICADORES DE STATUS
  // ============================================================================
  
  const validationSummary = useMemo(() => {
    const { errors } = editorState.validation;
    const errorCount = errors.filter(e => e.type === 'error').length;
    const warningCount = errors.filter(e => e.type === 'warning').length;
    const infoCount = errors.filter(e => e.type === 'info').length;
    
    return { errorCount, warningCount, infoCount };
  }, [editorState.validation]);
  
  const collaborationSummary = useMemo(() => {
    const { activeUsers } = editorState.collaboration;
    return {
      userCount: activeUsers.length,
      isConnected: editorState.collaboration.isConnected
    };
  }, [editorState.collaboration]);

  // Estado para o UnifiedToolbar
  const toolbarState = useMemo(() => {
    const selectedNodes = editorState.document.nodes.filter(node => 
      editorState.selection.selectedNodes.includes(node.id)
    );
    const selectedEdges = editorState.document.edges.filter(edge => 
      editorState.selection.selectedEdges.includes(edge.id)
    );

    return {
      ...editorState,
      diagramType: type,
      canUndo,
      canRedo,
      selectedNodes,
      selectedEdges,
      clipboard: editorState.editing.clipboard,
      isReadOnly: readOnly,
      showGrid: editorState.ui.showGrid,
      showMinimap: editorState.ui.showMinimap
    };
  }, [editorState, type, canUndo, canRedo, readOnly]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando diagrama...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        'flex flex-col h-full bg-background',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <UnifiedToolbar
            state={toolbarState}
            onAction={(action, payload) => {
              // Handle toolbar actions
              switch (action) {
                case 'file.save':
                  saveDocument();
                  break;
                case 'file.export.advanced':
                  handleOpenExportDialog();
                  break;
                case 'edit.undo':
                  undo();
                  break;
                case 'edit.redo':
                  redo();
                  break;
                case 'edit.copy':
                  copySelection();
                  break;
                case 'edit.cut':
                  cutSelection();
                  break;
                case 'edit.paste':
                  pasteFromClipboard();
                  break;
                case 'edit.delete':
                  editorState.selection.selectedNodes.forEach(deleteNode);
                  editorState.selection.selectedEdges.forEach(deleteEdge);
                  break;
                case 'view.zoomIn':
                  zoomIn();
                  break;
                case 'view.zoomOut':
                  zoomOut();
                  break;
                case 'view.zoomToFit':
                  zoomToFit();
                  break;
                case 'file.export':
                  handleExport(payload);
                  break;
                case 'file.share':
                  handleShare();
                  break;
                case 'tools.validate':
                  validateDocument();
                  break;
                case 'tools.templates':
                  setShowTemplateSelector(true);
                  break;
                case 'tools.collaboration':
                  setShowCollaboration(!showCollaboration);
                  break;
                case 'tools.performance':
                  setShowPerformanceMonitor(!showPerformanceMonitor);
                  break;
                default:
                  console.warn('Ação não reconhecida:', action);
              }
            }}
            readOnly={readOnly}
          />
          
          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground border-t">
            <div className="flex items-center gap-4">
              <span>{editorState.document.title}</span>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs">
                  Não salvo
                </Badge>
              )}
              {isSaving && (
                <Badge variant="outline" className="text-xs">
                  Salvando...
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Indicador de Permissões RBAC */}
              <div className="flex items-center gap-2">
                <Shield className={cn(
                  "h-4 w-4",
                  rbacPermissions.userRole === 'owner' && "text-green-600",
                  rbacPermissions.userRole === 'editor' && "text-blue-600",
                  rbacPermissions.userRole === 'viewer' && "text-yellow-600",
                  rbacPermissions.userRole === 'none' && "text-red-600"
                )} />
                <Badge 
                  variant={rbacPermissions.userRole === 'owner' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {rbacPermissions.userRole === 'owner' && 'Proprietário'}
                  {rbacPermissions.userRole === 'editor' && 'Editor'}
                  {rbacPermissions.userRole === 'viewer' && 'Visualizador'}
                  {rbacPermissions.userRole === 'commenter' && 'Comentarista'}
                  {rbacPermissions.userRole === 'none' && 'Sem Acesso'}
                </Badge>
                {rbacPermissions.accessType && (
                  <Badge variant="outline" className="text-xs">
                    {rbacPermissions.accessType === 'super_admin' && 'Super Admin'}
                    {rbacPermissions.accessType === 'admin' && 'Admin'}
                    {rbacPermissions.accessType === 'engenheiro' && 'Engenheiro'}
                    {rbacPermissions.accessType === 'vendedor' && 'Vendedor'}
                  </Badge>
                )}
              </div>
              
              {/* Colaboração */}
              {!readOnly && rbacPermissions.canPerformAction('edit_node') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (collaboration.isConnected) {
                      collaboration.disconnect();
                    } else {
                      collaboration.connect();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    collaboration.isConnected && "text-green-600"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {collaboration.isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                  {collaboration.users.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {collaboration.users.length}
                    </Badge>
                  )}
                </Button>
              )}
              
              {/* Painel de Colaboração */}
              {!readOnly && collaboration.isConnected && (
                <Button
                  variant={showCollaboration ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowCollaboration(!showCollaboration)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Colaboração</span>
                </Button>
              )}
              
              {/* Validação */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValidation(!showValidation)}
                className="h-6 px-2"
              >
                {validationSummary.errorCount > 0 ? (
                  <AlertTriangle className="h-3 w-3 text-destructive mr-1" />
                ) : validationSummary.warningCount > 0 ? (
                  <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-success mr-1" />
                )}
                {validationSummary.errorCount + validationSummary.warningCount + validationSummary.infoCount}
              </Button>
              
              {/* Colaboração */}
              {editorState.document.settings.collaboration.enabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCollaboration(!showCollaboration)}
                  className="h-6 px-2"
                >
                  <Info className="h-3 w-3 mr-1" />
                  {collaborationSummary.userCount}
                </Button>
              )}
              
              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-6 px-2"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {showSidebar && (
            <>
              <ResizablePanel 
                defaultSize={editorState.ui.sidebarWidth} 
                minSize={200} 
                maxSize={500}
              >
                <UnifiedSidebar
                  diagramType={editorState.document.type}
                  selectedNodeType={selectedNodeType}
                  onNodeTypeSelect={setSelectedNodeType}
                  onCreateNew={createNewDocument}
                  onLoad={loadDocument}
                  onTemplateSelect={handleTemplateSelect}
                  onNLPDiagramGenerated={handleNLPDiagramGenerated}
                  readOnly={readOnly}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          {/* Canvas */}
          <ResizablePanel defaultSize={showSidebar && showProperties ? 50 : 70}>
            <div 
              ref={performanceOptimization.containerRef}
              className="relative h-full"
            >
              <ReactFlow {...reactFlowProps}>
                {/* Background */}
                {editorState.document.settings.canvas.showGrid && (
                  <Background
                    gap={editorState.document.settings.canvas.gridSize}
                    color="#e2e8f0"
                    variant="dots"
                  />
                )}
                
                {/* Controls */}
                {editorState.document.settings.canvas.showControls && (
                  <Controls
                    position="bottom-right"
                    showZoom
                    showFitView
                    showInteractive={!readOnly}
                  />
                )}
                
                {/* MiniMap */}
                {editorState.document.settings.canvas.showMinimap && (
                  <MiniMap
                    position="bottom-left"
                    nodeColor={(node) => {
                      switch (node.type) {
                        case 'start': return '#22c55e';
                        case 'end': return '#ef4444';
                        case 'decision': return '#f59e0b';
                        case 'process': return '#3b82f6';
                        default: return '#6b7280';
                      }
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                  />
                )}
                
                {/* Panels */}
                <Panel position="top-left">
                  <UnifiedNodePalette
                    diagramType={editorState.document.type}
                    onNodeSelect={setSelectedNodeType}
                    selectedNodeType={selectedNodeType}
                  />
                </Panel>
                
                {/* Validation Panel */}
                {showValidation && (
                  <Panel position="top-right" className="w-80">
                    <ValidationPanel
                      issues={customValidation.validationState.issues}
                      isValidating={customValidation.validationState.isValidating}
                      lastValidation={customValidation.validationState.lastValidation}
                      score={customValidation.validationState.score}
                      summary={customValidation.validationState.summary}
                      onRevalidate={customValidation.revalidate}
                      onExportReport={() => {
                         console.log('Relatório de validação exportado com sucesso');
                       }}
                      onCustomRulesChange={customValidation.updateCustomRules}
                      onClose={() => setShowValidation(false)}
                    />
                  </Panel>
                )}
                
                {/* Collaboration Overlay */}
                {!readOnly && collaboration.isConnected && (
                  <CollaborationOverlay
                    users={collaboration.users}
                    cursors={collaboration.cursors}
                    selections={collaboration.selections}
                  />
                )}
                
                {/* Collaboration Panel */}
                {showCollaboration && (
                  <Panel position="bottom-right">
                    <CollaborationPanel
                      users={collaboration.users}
                      comments={collaboration.comments}
                      conflicts={collaboration.conflicts}
                      isConnected={collaboration.isConnected}
                      onClose={() => setShowCollaboration(false)}
                      onInviteUser={collaboration.inviteUser}
                      onRemoveUser={collaboration.removeUser}
                      onUpdateUserRole={collaboration.updateUserRole}
                      onAddComment={collaboration.addComment}
                      onReplyToComment={collaboration.replyToComment}
                      onResolveComment={collaboration.resolveComment}
                      onDeleteComment={collaboration.deleteComment}
                      onResolveConflict={collaboration.resolveConflict}
                      onResolveAllConflicts={collaboration.resolveAllConflicts}
                    />
                  </Panel>
                )}
                
                {/* Performance Monitor */}
                {showPerformanceMonitor && (
                  <Panel position="bottom-left" className="w-96 h-80">
                    <PerformanceMonitor
                      metrics={performanceOptimization.metrics}
                      config={performanceOptimization.config}
                      onConfigChange={performanceOptimization.setConfig}
                      onClose={() => setShowPerformanceMonitor(false)}
                      virtualizationStats={performanceOptimization.virtualizationStats}
                    />
                  </Panel>
                )}
              </ReactFlow>
            </div>
          </ResizablePanel>
          
          {/* Properties Panel */}
          {showProperties && (
            <>
              <ResizableHandle />
              <ResizablePanel 
                defaultSize={editorState.ui.propertiesWidth} 
                minSize={250} 
                maxSize={500}
              >
                <UnifiedPropertiesPanel
                  selectedNodes={editorState.document.nodes.filter(n => 
                    editorState.selection.selectedNodes.includes(n.id)
                  )}
                  selectedEdges={editorState.document.edges.filter(e => 
                    editorState.selection.selectedEdges.includes(e.id)
                  )}
                  onNodeUpdate={updateNode}
                  onEdgeUpdate={updateEdge}
                  onDelete={() => {
                    editorState.selection.selectedNodes.forEach(deleteNode);
                    editorState.selection.selectedEdges.forEach(deleteEdge);
                  }}
                  onDuplicate={() => {
                    editorState.selection.selectedNodes.forEach(duplicateNode);
                  }}
                  readOnly={readOnly}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      
      {/* Template Selector */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onApplyTemplate={handleApplyTemplate}
      />
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        diagramData={exportData}
        onExport={handleExportComplete}
      />
      
      {/* Close Button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 z-10"
        >
          ×
        </Button>
      )}
    </div>
  );
};

// Componente principal que envolve com ReactFlowProvider
export const UnifiedDiagramEditor: React.FC<UnifiedDiagramEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <UnifiedDiagramEditorContent {...props} />
    </ReactFlowProvider>
  );
};

export default UnifiedDiagramEditor;