// ============================================================================
// useKeyboardShortcuts - Hook para gerenciar atalhos de teclado
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { useDiagramStore } from '../stores/useDiagramStore';
import { useNodeOperations } from './useNodeOperations';
import { useAdvancedConnections } from './useAdvancedConnections';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  category: 'general' | 'nodes' | 'connections' | 'view' | 'edit';
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabledCategories?: Array<'general' | 'nodes' | 'connections' | 'view' | 'edit'>;
}

export interface UseKeyboardShortcutsReturn {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  enableCategory: (category: string) => void;
  disableCategory: (category: string) => void;
  getShortcutsByCategory: (category: string) => KeyboardShortcut[];
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useKeyboardShortcuts = ({
  enabled = true,
  preventDefault = true,
  stopPropagation = true,
  enabledCategories = ['general', 'nodes', 'connections', 'view', 'edit']
}: UseKeyboardShortcutsOptions = {}): UseKeyboardShortcutsReturn => {
  const {
    nodes,
    selectedNodeIds,
    setSelectedNodeIds,
    deleteNode,
    updateNode,
    undo,
    redo,
    canUndo,
    canRedo,
    fitView,
    zoomIn,
    zoomOut,
    resetZoom
  } = useDiagramStore();

  const {
    cloneNode,
    duplicateSelectedNode,
    deleteNodeWithConnections,
    groupNodes
  } = useNodeOperations();

  const {
    optimizeAllConnections,
    deleteAllConnections,
    selectConnectedNodes
  } = useAdvancedConnections();

  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const enabledCategoriesRef = useRef<Set<string>>(new Set(enabledCategories));

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const getKeyString = useCallback((event: KeyboardEvent): string => {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }, []);

  const getSelectedNodes = useCallback(() => {
    return nodes.filter(node => selectedNodeIds.includes(node.id));
  }, [nodes, selectedNodeIds]);

  // ============================================================================
  // AÇÕES DE ATALHOS
  // ============================================================================

  const selectAll = useCallback(() => {
    const allNodeIds = nodes.map(node => node.id);
    setSelectedNodeIds(allNodeIds);
    secureLogger.info('Todos os nós selecionados', { count: allNodeIds.length });
  }, [nodes, setSelectedNodeIds]);

  const deselectAll = useCallback(() => {
    setSelectedNodeIds([]);
    secureLogger.info('Seleção limpa');
  }, [setSelectedNodeIds]);

  const deleteSelected = useCallback(() => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length === 0) return;

    selectedNodes.forEach(node => {
      deleteNodeWithConnections(node.id);
    });
    
    setSelectedNodeIds([]);
    secureLogger.info('Nós selecionados deletados', { count: selectedNodes.length });
  }, [getSelectedNodes, deleteNodeWithConnections, setSelectedNodeIds]);

  const duplicateSelected = useCallback(() => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length === 0) return;

    const newNodeIds: string[] = [];
    
    selectedNodes.forEach((node, index) => {
      const newPosition = {
        x: node.position.x + 50,
        y: node.position.y + 50
      };
      
      const newNodeId = cloneNode(node.id, newPosition);
      if (newNodeId) {
        newNodeIds.push(newNodeId);
      }
    });
    
    setSelectedNodeIds(newNodeIds);
    secureLogger.info('Nós duplicados', { count: selectedNodes.length });
  }, [getSelectedNodes, cloneNode, setSelectedNodeIds]);

  const groupSelected = useCallback(() => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length < 2) return;

    const nodeIds = selectedNodes.map(n => n.id);
    const groupId = groupNodes(nodeIds);
    
    if (groupId) {
      setSelectedNodeIds([groupId]);
      secureLogger.info('Nós agrupados', { nodeIds, groupId });
    }
  }, [getSelectedNodes, groupNodes, setSelectedNodeIds]);

  const moveSelectedNodes = useCallback(async (direction: 'up' | 'down' | 'left' | 'right', distance = 10) => {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length === 0) return;

    for (const node of selectedNodes) {
      let newPosition = { ...node.position };
      
      switch (direction) {
        case 'up':
          newPosition.y -= distance;
          break;
        case 'down':
          newPosition.y += distance;
          break;
        case 'left':
          newPosition.x -= distance;
          break;
        case 'right':
          newPosition.x += distance;
          break;
      }
      
      await updateNode(node.id, { position: newPosition });
    }
    
    secureLogger.info('Nós movidos', { direction, distance, count: selectedNodes.length });
  }, [getSelectedNodes, updateNode]);

  // ============================================================================
  // DEFINIÇÃO DE ATALHOS PADRÃO
  // ============================================================================

  const defaultShortcuts: KeyboardShortcut[] = [
    // Geral
    {
      key: 'ctrl+z',
      description: 'Desfazer',
      action: undo,
      category: 'general',
      enabled: canUndo
    },
    {
      key: 'ctrl+y',
      description: 'Refazer',
      action: redo,
      category: 'general',
      enabled: canRedo
    },
    {
      key: 'ctrl+shift+z',
      description: 'Refazer (alternativo)',
      action: redo,
      category: 'general',
      enabled: canRedo
    },
    {
      key: 'ctrl+a',
      description: 'Selecionar tudo',
      action: selectAll,
      category: 'general'
    },
    {
      key: 'escape',
      description: 'Limpar seleção',
      action: deselectAll,
      category: 'general'
    },

    // Nós
    {
      key: 'delete',
      description: 'Deletar selecionados',
      action: deleteSelected,
      category: 'nodes'
    },
    {
      key: 'backspace',
      description: 'Deletar selecionados (alternativo)',
      action: deleteSelected,
      category: 'nodes'
    },
    {
      key: 'ctrl+d',
      description: 'Duplicar selecionados',
      action: duplicateSelected,
      category: 'nodes'
    },
    {
      key: 'ctrl+g',
      description: 'Agrupar selecionados',
      action: groupSelected,
      category: 'nodes'
    },

    // Movimento de nós
    {
      key: 'arrowup',
      description: 'Mover para cima',
      action: () => moveSelectedNodes('up'),
      category: 'nodes'
    },
    {
      key: 'arrowdown',
      description: 'Mover para baixo',
      action: () => moveSelectedNodes('down'),
      category: 'nodes'
    },
    {
      key: 'arrowleft',
      description: 'Mover para esquerda',
      action: () => moveSelectedNodes('left'),
      category: 'nodes'
    },
    {
      key: 'arrowright',
      description: 'Mover para direita',
      action: () => moveSelectedNodes('right'),
      category: 'nodes'
    },
    {
      key: 'shift+arrowup',
      description: 'Mover para cima (rápido)',
      action: () => moveSelectedNodes('up', 50),
      category: 'nodes'
    },
    {
      key: 'shift+arrowdown',
      description: 'Mover para baixo (rápido)',
      action: () => moveSelectedNodes('down', 50),
      category: 'nodes'
    },
    {
      key: 'shift+arrowleft',
      description: 'Mover para esquerda (rápido)',
      action: () => moveSelectedNodes('left', 50),
      category: 'nodes'
    },
    {
      key: 'shift+arrowright',
      description: 'Mover para direita (rápido)',
      action: () => moveSelectedNodes('right', 50),
      category: 'nodes'
    },

    // Conexões
    {
      key: 'ctrl+shift+o',
      description: 'Otimizar todas as conexões',
      action: optimizeAllConnections,
      category: 'connections'
    },
    {
      key: 'ctrl+shift+c',
      description: 'Selecionar nós conectados',
      action: selectConnectedNodes,
      category: 'connections'
    },

    // Visualização
    {
      key: 'ctrl+0',
      description: 'Resetar zoom',
      action: resetZoom,
      category: 'view'
    },
    {
      key: 'ctrl+=',
      description: 'Zoom in',
      action: zoomIn,
      category: 'view'
    },
    {
      key: 'ctrl+-',
      description: 'Zoom out',
      action: zoomOut,
      category: 'view'
    },
    {
      key: 'ctrl+shift+f',
      description: 'Ajustar à tela',
      action: fitView,
      category: 'view'
    }
  ];

  // ============================================================================
  // FUNÇÕES DE GERENCIAMENTO
  // ============================================================================

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcutsRef.current.set(shortcut.key, shortcut);
    secureLogger.info('Atalho registrado', { key: shortcut.key, description: shortcut.description });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    shortcutsRef.current.delete(key);
    secureLogger.info('Atalho removido', { key });
  }, []);

  const enableCategory = useCallback((category: string) => {
    enabledCategoriesRef.current.add(category);
    secureLogger.info('Categoria de atalhos habilitada', { category });
  }, []);

  const disableCategory = useCallback((category: string) => {
    enabledCategoriesRef.current.delete(category);
    secureLogger.info('Categoria de atalhos desabilitada', { category });
  }, []);

  const getShortcutsByCategory = useCallback((category: string): KeyboardShortcut[] => {
    return Array.from(shortcutsRef.current.values())
      .filter(shortcut => shortcut.category === category);
  }, []);

  // ============================================================================
  // HANDLER DE EVENTOS
  // ============================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignorar se estiver editando texto
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    const keyString = getKeyString(event);
    const shortcut = shortcutsRef.current.get(keyString);

    if (
      shortcut &&
      enabledCategoriesRef.current.has(shortcut.category) &&
      (shortcut.enabled !== false)
    ) {
      if (preventDefault) {
        event.preventDefault();
      }
      
      if (stopPropagation) {
        event.stopPropagation();
      }

      try {
        shortcut.action();
        secureLogger.info('Atalho executado', { 
          key: keyString, 
          description: shortcut.description,
          category: shortcut.category 
        });
      } catch (error) {
        secureLogger.error('Erro ao executar atalho', { 
          key: keyString, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      }
    }
  }, [enabled, preventDefault, stopPropagation, getKeyString]);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Registrar atalhos padrão
  useEffect(() => {
    defaultShortcuts.forEach(shortcut => {
      shortcutsRef.current.set(shortcut.key, shortcut);
    });
  }, []);

  // Atualizar categorias habilitadas
  useEffect(() => {
    enabledCategoriesRef.current = new Set(enabledCategories);
  }, [enabledCategories]);

  // Adicionar/remover event listener
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // ============================================================================
  // RETORNO
  // ============================================================================

  return {
    shortcuts: Array.from(shortcutsRef.current.values()),
    registerShortcut,
    unregisterShortcut,
    enableCategory,
    disableCategory,
    getShortcutsByCategory
  };
};

export default useKeyboardShortcuts;