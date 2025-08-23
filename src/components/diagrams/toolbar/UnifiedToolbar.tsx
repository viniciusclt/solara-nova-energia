// ============================================================================
// Unified Toolbar - Barra de ferramentas unificada para o editor de diagramas
// ============================================================================
// Toolbar consolidada com todas as funcionalidades dos editores existentes
// ============================================================================

import React, { memo, useState, useCallback } from 'react';
import {
  Save,
  Download,
  Upload,
  FileText,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Play,
  Pause,
  Square,
  Settings,
  Grid,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Palette,
  Type,
  MousePointer,
  Move,
  Plus,
  Minus,
  MoreHorizontal,
  ChevronDown,
  HelpCircle,
  Keyboard,
  Search,
  Filter,
  SortAsc,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Group,
  Ungroup,
  BringToFront,
  SendToBack,
  Image,
  Link,
  Hash,
  Tag,
  Bookmark,
  Star,
  Heart,
  Flag,
  Target,
  Zap,
  Lightbulb,
  Brain,
  Users,
  Building,
  Briefcase,
  Crown,
  Shield,
  Activity
} from 'lucide-react';
import { DiagramType, UnifiedDiagramState } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface UnifiedToolbarProps {
  state: UnifiedDiagramState;
  onAction: (action: string, payload?: any) => void;
  className?: string;
}

interface ToolbarSection {
  id: string;
  title: string;
  items: ToolbarItem[];
  visible?: boolean;
  collapsible?: boolean;
}

interface ToolbarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  payload?: any;
  disabled?: boolean;
  active?: boolean;
  shortcut?: string;
  tooltip?: string;
  type?: 'button' | 'dropdown' | 'toggle' | 'separator';
  items?: ToolbarItem[];
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: ToolbarItem[];
  onSelect: (item: ToolbarItem) => void;
  disabled?: boolean;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Componente de Dropdown
 */
const Dropdown: React.FC<DropdownProps> = memo(({ trigger, items, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = useCallback((item: ToolbarItem) => {
    onSelect(item);
    setIsOpen(false);
  }, [onSelect]);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md
          ${disabled 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
          ${isOpen ? 'bg-gray-100' : ''}
        `}
      >
        {trigger}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    ${item.disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-xs text-gray-400">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

/**
 * Botão da Toolbar
 */
const ToolbarButton: React.FC<{
  item: ToolbarItem;
  onAction: (action: string, payload?: any) => void;
}> = memo(({ item, onAction }) => {
  const handleClick = useCallback(() => {
    if (!item.disabled) {
      onAction(item.action, item.payload);
    }
  }, [item, onAction]);
  
  if (item.type === 'separator') {
    return <div className="w-px h-6 bg-gray-300 mx-1" />;
  }
  
  if (item.type === 'dropdown' && item.items) {
    return (
      <Dropdown
        trigger={
          <>
            {item.icon}
            <span>{item.label}</span>
          </>
        }
        items={item.items}
        onSelect={(selectedItem) => onAction(selectedItem.action, selectedItem.payload)}
        disabled={item.disabled}
      />
    );
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={item.disabled}
      title={item.tooltip || item.label}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
        ${item.disabled 
          ? 'text-gray-400 cursor-not-allowed' 
          : item.active 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {item.icon}
      <span className="hidden sm:inline">{item.label}</span>
      {item.shortcut && (
        <span className="hidden lg:inline text-xs text-gray-400 ml-1">{item.shortcut}</span>
      )}
    </button>
  );
});

// ============================================================================
// CONFIGURAÇÕES DA TOOLBAR
// ============================================================================

/**
 * Gera as seções da toolbar baseado no tipo de diagrama e estado
 */
const getToolbarSections = (state: UnifiedDiagramState): ToolbarSection[] => {
  // Verificação de segurança para evitar erros de propriedades indefinidas
  if (!state) {
    return [];
  }
  
  const { 
    diagramType = 'flowchart', 
    canUndo = false, 
    canRedo = false, 
    selectedNodes = [], 
    selectedEdges = [], 
    clipboard = { nodes: [], edges: [] }, 
    isReadOnly = false,
    showGrid = true,
    showMinimap = true
  } = state;
  
  const sections: ToolbarSection[] = [
    // Seção de Arquivo
    {
      id: 'file',
      title: 'Arquivo',
      items: [
        {
          id: 'new',
          label: 'Novo',
          icon: <Plus size={16} />,
          action: 'file.new',
          shortcut: 'Ctrl+N',
          tooltip: 'Criar novo diagrama',
          type: 'dropdown',
          items: [
            {
              id: 'new-bpmn',
              label: 'Novo BPMN',
              icon: <Layout size={16} />,
              action: 'file.new',
              payload: { type: 'bpmn' }
            },
            {
              id: 'new-mindmap',
              label: 'Novo MindMap',
              icon: <Brain size={16} />,
              action: 'file.new',
              payload: { type: 'mindmap' }
            },
            {
              id: 'new-org',
              label: 'Novo Organograma',
              icon: <Users size={16} />,
              action: 'file.new',
              payload: { type: 'organogram' }
            }
          ]
        },
        {
          id: 'open',
          label: 'Abrir',
          icon: <Upload size={16} />,
          action: 'file.open',
          shortcut: 'Ctrl+O',
          tooltip: 'Abrir diagrama existente'
        },
        {
          id: 'save',
          label: 'Salvar',
          icon: <Save size={16} />,
          action: 'file.save',
          shortcut: 'Ctrl+S',
          tooltip: 'Salvar diagrama',
          disabled: isReadOnly
        },
        {
          id: 'export',
          label: 'Exportar',
          icon: <Download size={16} />,
          action: 'file.export',
          tooltip: 'Exportar diagrama',
          type: 'dropdown',
          items: [
            {
              id: 'export-advanced',
              label: 'Exportação Avançada...',
              icon: <Settings size={16} />,
              action: 'file.export.advanced',
              tooltip: 'Abrir dialog de exportação com configurações avançadas'
            },
            { type: 'separator' },
            {
              id: 'export-png',
              label: 'PNG (Rápido)',
              icon: <Image size={16} />,
              action: 'file.export',
              payload: { format: 'png' }
            },
            {
              id: 'export-svg',
              label: 'SVG (Rápido)',
              icon: <Image size={16} />,
              action: 'file.export',
              payload: { format: 'svg' }
            },
            {
              id: 'export-pdf',
              label: 'PDF (Rápido)',
              icon: <FileText size={16} />,
              action: 'file.export',
              payload: { format: 'pdf' }
            },
            {
              id: 'export-json',
              label: 'JSON',
              icon: <FileText size={16} />,
              action: 'file.export',
              payload: { format: 'json' }
            }
          ]
        }
      ]
    },
    
    // Seção de Edição
    {
      id: 'edit',
      title: 'Edição',
      items: [
        {
          id: 'undo',
          label: 'Desfazer',
          icon: <Undo size={16} />,
          action: 'edit.undo',
          shortcut: 'Ctrl+Z',
          tooltip: 'Desfazer última ação',
          disabled: !canUndo || isReadOnly
        },
        {
          id: 'redo',
          label: 'Refazer',
          icon: <Redo size={16} />,
          action: 'edit.redo',
          shortcut: 'Ctrl+Y',
          tooltip: 'Refazer última ação',
          disabled: !canRedo || isReadOnly
        },
        { id: 'sep1', label: '', icon: null, action: '', type: 'separator' },
        {
          id: 'copy',
          label: 'Copiar',
          icon: <Copy size={16} />,
          action: 'edit.copy',
          shortcut: 'Ctrl+C',
          tooltip: 'Copiar seleção',
          disabled: selectedNodes.length === 0 && selectedEdges.length === 0
        },
        {
          id: 'cut',
          label: 'Recortar',
          icon: <Scissors size={16} />,
          action: 'edit.cut',
          shortcut: 'Ctrl+X',
          tooltip: 'Recortar seleção',
          disabled: selectedNodes.length === 0 && selectedEdges.length === 0 || isReadOnly
        },
        {
          id: 'paste',
          label: 'Colar',
          icon: <Clipboard size={16} />,
          action: 'edit.paste',
          shortcut: 'Ctrl+V',
          tooltip: 'Colar da área de transferência',
          disabled: !clipboard || isReadOnly
        },
        { id: 'sep2', label: '', icon: null, action: '', type: 'separator' },
        {
          id: 'delete',
          label: 'Excluir',
          icon: <Minus size={16} />,
          action: 'edit.delete',
          shortcut: 'Del',
          tooltip: 'Excluir seleção',
          disabled: selectedNodes.length === 0 && selectedEdges.length === 0 || isReadOnly
        }
      ]
    },
    
    // Seção de Visualização
    {
      id: 'view',
      title: 'Visualização',
      items: [
        {
          id: 'zoom-in',
          label: 'Ampliar',
          icon: <ZoomIn size={16} />,
          action: 'view.zoomIn',
          shortcut: 'Ctrl++',
          tooltip: 'Ampliar visualização'
        },
        {
          id: 'zoom-out',
          label: 'Reduzir',
          icon: <ZoomOut size={16} />,
          action: 'view.zoomOut',
          shortcut: 'Ctrl+-',
          tooltip: 'Reduzir visualização'
        },
        {
          id: 'fit-view',
          label: 'Ajustar',
          icon: <Maximize size={16} />,
          action: 'view.fitView',
          shortcut: 'Ctrl+0',
          tooltip: 'Ajustar à tela'
        },
        {
          id: 'center',
          label: 'Centralizar',
          icon: <RotateCcw size={16} />,
          action: 'view.center',
          tooltip: 'Centralizar diagrama'
        },
        { id: 'sep3', label: '', icon: null, action: '', type: 'separator' },
        {
          id: 'grid',
          label: 'Grade',
          icon: <Grid size={16} />,
          action: 'view.toggleGrid',
          tooltip: 'Mostrar/ocultar grade',
          type: 'toggle',
          active: showGrid
        },
        {
          id: 'minimap',
          label: 'Minimapa',
          icon: <Eye size={16} />,
          action: 'view.toggleMinimap',
          tooltip: 'Mostrar/ocultar minimapa',
          type: 'toggle',
          active: showMinimap
        }
      ]
    },
    
    // Seção de Layout (específica para cada tipo)
    {
      id: 'layout',
      title: 'Layout',
      items: getLayoutItems(diagramType, selectedNodes.length > 1),
      visible: selectedNodes.length > 1
    },
    
    // Seção de Nós (específica para cada tipo)
    {
      id: 'nodes',
      title: 'Elementos',
      items: getNodeItems(diagramType, isReadOnly)
    },
    
    // Seção de Ferramentas
    {
      id: 'tools',
      title: 'Ferramentas',
      items: [
        {
          id: 'templates',
          label: 'Templates',
          icon: <Layout size={16} />,
          action: 'tools.templates',
          tooltip: 'Abrir galeria de templates'
        },
        {
          id: 'validate',
          label: 'Validar',
          icon: <Target size={16} />,
          action: 'tools.validate',
          tooltip: 'Validar diagrama'
        },
        {
          id: 'performance',
          label: 'Performance',
          icon: <Activity size={16} />,
          action: 'tools.performance',
          tooltip: 'Monitor de performance'
        },
        {
          id: 'search',
          label: 'Buscar',
          icon: <Search size={16} />,
          action: 'tools.search',
          shortcut: 'Ctrl+F',
          tooltip: 'Buscar elementos'
        },
        {
          id: 'help',
          label: 'Ajuda',
          icon: <HelpCircle size={16} />,
          action: 'tools.help',
          tooltip: 'Mostrar ajuda',
          type: 'dropdown',
          items: [
            {
              id: 'shortcuts',
              label: 'Atalhos',
              icon: <Keyboard size={16} />,
              action: 'tools.shortcuts'
            },
            {
              id: 'guide',
              label: 'Guia',
              icon: <HelpCircle size={16} />,
              action: 'tools.guide'
            }
          ]
        }
      ]
    }
  ];
  
  return sections.filter(section => section.visible !== false);
};

/**
 * Gera itens de layout baseado no tipo de diagrama
 */
const getLayoutItems = (diagramType: DiagramType, hasMultipleSelected: boolean): ToolbarItem[] => {
  const baseItems: ToolbarItem[] = [
    {
      id: 'align-left',
      label: 'Alinhar Esquerda',
      icon: <AlignLeft size={16} />,
      action: 'layout.align',
      payload: { direction: 'left' },
      disabled: !hasMultipleSelected
    },
    {
      id: 'align-center',
      label: 'Alinhar Centro',
      icon: <AlignCenter size={16} />,
      action: 'layout.align',
      payload: { direction: 'center' },
      disabled: !hasMultipleSelected
    },
    {
      id: 'align-right',
      label: 'Alinhar Direita',
      icon: <AlignRight size={16} />,
      action: 'layout.align',
      payload: { direction: 'right' },
      disabled: !hasMultipleSelected
    },
    { id: 'sep-align', label: '', icon: null, action: '', type: 'separator' },
    {
      id: 'distribute-h',
      label: 'Distribuir Horizontal',
      icon: <AlignHorizontalDistributeCenter size={16} />,
      action: 'layout.distribute',
      payload: { direction: 'horizontal' },
      disabled: !hasMultipleSelected
    },
    {
      id: 'distribute-v',
      label: 'Distribuir Vertical',
      icon: <AlignVerticalDistributeCenter size={16} />,
      action: 'layout.distribute',
      payload: { direction: 'vertical' },
      disabled: !hasMultipleSelected
    }
  ];
  
  if (diagramType === 'bpmn') {
    baseItems.push(
      { id: 'sep-auto', label: '', icon: null, action: '', type: 'separator' },
      {
        id: 'auto-layout',
        label: 'Layout Automático',
        icon: <Layout size={16} />,
        action: 'layout.auto',
        payload: { type: 'hierarchical' },
        tooltip: 'Aplicar layout automático'
      }
    );
  }
  
  if (diagramType === 'organogram') {
    baseItems.push(
      { id: 'sep-org', label: '', icon: null, action: '', type: 'separator' },
      {
        id: 'org-layout',
        label: 'Layout Hierárquico',
        icon: <Users size={16} />,
        action: 'layout.auto',
        payload: { type: 'tree' },
        tooltip: 'Aplicar layout hierárquico'
      }
    );
  }
  
  return baseItems;
};

/**
 * Gera itens de nós baseado no tipo de diagrama
 */
const getNodeItems = (diagramType: DiagramType, isReadOnly: boolean): ToolbarItem[] => {
  const baseItems: ToolbarItem[] = [];
  
  if (diagramType === 'bpmn') {
    baseItems.push(
      {
        id: 'add-start',
        label: 'Evento Início',
        icon: <Play size={16} />,
        action: 'nodes.add',
        payload: { type: 'bpmn-start-event' },
        disabled: isReadOnly
      },
      {
        id: 'add-task',
        label: 'Tarefa',
        icon: <Square size={16} />,
        action: 'nodes.add',
        payload: { type: 'bpmn-task' },
        disabled: isReadOnly
      },
      {
        id: 'add-gateway',
        label: 'Gateway',
        icon: <Target size={16} />,
        action: 'nodes.add',
        payload: { type: 'bpmn-exclusive-gateway' },
        disabled: isReadOnly
      },
      {
        id: 'add-end',
        label: 'Evento Fim',
        icon: <Square size={16} />,
        action: 'nodes.add',
        payload: { type: 'bpmn-end-event' },
        disabled: isReadOnly
      }
    );
  }
  
  if (diagramType === 'mindmap') {
    baseItems.push(
      {
        id: 'add-root',
        label: 'Tópico Principal',
        icon: <Brain size={16} />,
        action: 'nodes.add',
        payload: { type: 'mindmap-root' },
        disabled: isReadOnly
      },
      {
        id: 'add-branch',
        label: 'Ramo',
        icon: <Lightbulb size={16} />,
        action: 'nodes.add',
        payload: { type: 'mindmap-branch' },
        disabled: isReadOnly
      },
      {
        id: 'add-leaf',
        label: 'Item',
        icon: <Tag size={16} />,
        action: 'nodes.add',
        payload: { type: 'mindmap-leaf' },
        disabled: isReadOnly
      }
    );
  }
  
  if (diagramType === 'organogram') {
    baseItems.push(
      {
        id: 'add-ceo',
        label: 'CEO',
        icon: <Crown size={16} />,
        action: 'nodes.add',
        payload: { type: 'org-ceo' },
        disabled: isReadOnly
      },
      {
        id: 'add-director',
        label: 'Diretor',
        icon: <Shield size={16} />,
        action: 'nodes.add',
        payload: { type: 'org-director' },
        disabled: isReadOnly
      },
      {
        id: 'add-manager',
        label: 'Gerente',
        icon: <Users size={16} />,
        action: 'nodes.add',
        payload: { type: 'org-manager' },
        disabled: isReadOnly
      },
      {
        id: 'add-employee',
        label: 'Funcionário',
        icon: <Users size={16} />,
        action: 'nodes.add',
        payload: { type: 'org-employee' },
        disabled: isReadOnly
      },
      {
        id: 'add-department',
        label: 'Departamento',
        icon: <Building size={16} />,
        action: 'nodes.add',
        payload: { type: 'org-department' },
        disabled: isReadOnly
      }
    );
  }
  
  return baseItems;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Barra de ferramentas unificada
 */
export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = memo(({ 
  state, 
  onAction, 
  className = '' 
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  const sections = getToolbarSections(state);
  
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);
  
  return (
    <div className={`unified-toolbar bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id);
          
          return (
            <div key={section.id} className="flex items-center gap-1">
              {section.collapsible && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title={`${isCollapsed ? 'Expandir' : 'Recolher'} ${section.title}`}
                >
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} 
                  />
                </button>
              )}
              
              {!isCollapsed && (
                <>
                  {section.items.map((item) => (
                    <ToolbarButton
                      key={item.id}
                      item={item}
                      onAction={onAction}
                    />
                  ))}
                  
                  {/* Separador entre seções */}
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default UnifiedToolbar;