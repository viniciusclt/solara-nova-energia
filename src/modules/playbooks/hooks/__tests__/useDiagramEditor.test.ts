/**
 * Testes unitários para useDiagramEditor hook
 * 
 * Testa funcionalidades de edição de diagramas,
 * gerenciamento de estado, operações CRUD de nós e conexões
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDiagramEditor } from '../useDiagramEditor';
import { DiagramNode, DiagramConnection } from '../../types/diagram';

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock do editorService
vi.mock('../../services/editorService', () => ({
  editorService: {
    saveDiagram: vi.fn(),
    loadDiagram: vi.fn(),
    exportDiagram: vi.fn(),
    importDiagram: vi.fn(),
    validateDiagram: vi.fn(),
    optimizeLayout: vi.fn(),
    calculateAutoRoute: vi.fn(),
  },
}));

import { editorService } from '../../services/editorService';

describe('useDiagramEditor', () => {
  const mockDiagramId = 'test-diagram-123';
  
  const mockNode: DiagramNode = {
    id: 'node-1',
    type: 'rectangle',
    position: { x: 100, y: 100 },
    size: { width: 120, height: 80 },
    data: {
      label: 'Test Node',
      color: '#3b82f6',
    },
    style: {},
  };

  const mockConnection: DiagramConnection = {
    id: 'connection-1',
    sourceId: 'node-1',
    targetId: 'node-2',
    type: 'straight',
    style: {},
    data: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialização', () => {
    it('deve inicializar com estado vazio', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      expect(result.current.nodes).toEqual([]);
      expect(result.current.connections).toEqual([]);
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.selectedConnections).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('deve carregar dados do localStorage se disponível', () => {
      const savedData = {
        nodes: [mockNode],
        connections: [mockConnection],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      expect(result.current.nodes).toEqual([mockNode]);
      expect(result.current.connections).toEqual([mockConnection]);
    });
  });

  describe('Gerenciamento de Nós', () => {
    it('deve adicionar nó corretamente', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
      });

      expect(result.current.nodes).toContain(mockNode);
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('deve atualizar nó existente', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
      });

      const updatedNode = {
        ...mockNode,
        data: { ...mockNode.data, label: 'Updated Label' },
      };

      act(() => {
        result.current.updateNode(mockNode.id, updatedNode);
      });

      expect(result.current.nodes[0].data.label).toBe('Updated Label');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('deve remover nó e suas conexões', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
        result.current.addConnection(mockConnection);
      });

      act(() => {
        result.current.removeNode(mockNode.id);
      });

      expect(result.current.nodes).not.toContain(mockNode);
      expect(result.current.connections).not.toContain(mockConnection);
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('deve duplicar nó com nova posição', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
      });

      act(() => {
        result.current.duplicateNode(mockNode.id);
      });

      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes[1].id).not.toBe(mockNode.id);
      expect(result.current.nodes[1].position.x).toBe(mockNode.position.x + 20);
      expect(result.current.nodes[1].position.y).toBe(mockNode.position.y + 20);
    });
  });

  describe('Gerenciamento de Conexões', () => {
    it('deve adicionar conexão corretamente', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addConnection(mockConnection);
      });

      expect(result.current.connections).toContain(mockConnection);
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('deve atualizar conexão existente', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addConnection(mockConnection);
      });

      const updatedConnection = {
        ...mockConnection,
        type: 'curved' as const,
      };

      act(() => {
        result.current.updateConnection(mockConnection.id, updatedConnection);
      });

      expect(result.current.connections[0].type).toBe('curved');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('deve remover conexão', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addConnection(mockConnection);
      });

      act(() => {
        result.current.removeConnection(mockConnection.id);
      });

      expect(result.current.connections).not.toContain(mockConnection);
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('deve validar conexão antes de adicionar', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      // Tentar adicionar conexão sem nós de origem e destino
      const invalidConnection = {
        ...mockConnection,
        sourceId: 'non-existent',
        targetId: 'also-non-existent',
      };

      act(() => {
        result.current.addConnection(invalidConnection);
      });

      expect(result.current.connections).not.toContain(invalidConnection);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Seleção', () => {
    it('deve selecionar nó', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
      });

      act(() => {
        result.current.selectNode(mockNode.id);
      });

      expect(result.current.selectedNodes).toContain(mockNode.id);
    });

    it('deve selecionar múltiplos nós', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));
      const node2 = { ...mockNode, id: 'node-2' };

      act(() => {
        result.current.addNode(mockNode);
        result.current.addNode(node2);
      });

      act(() => {
        result.current.selectNode(mockNode.id);
        result.current.selectNode(node2.id, true); // multi-select
      });

      expect(result.current.selectedNodes).toContain(mockNode.id);
      expect(result.current.selectedNodes).toContain(node2.id);
    });

    it('deve limpar seleção', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
        result.current.selectNode(mockNode.id);
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.selectedConnections).toEqual([]);
    });
  });

  describe('Operações de Clipboard', () => {
    it('deve copiar nós selecionados', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
        result.current.selectNode(mockNode.id);
      });

      act(() => {
        result.current.copy();
      });

      // Verificar se o clipboard interno foi preenchido
      expect(result.current.clipboard).toHaveLength(1);
    });

    it('deve colar nós do clipboard', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
        result.current.selectNode(mockNode.id);
        result.current.copy();
      });

      act(() => {
        result.current.paste({ x: 200, y: 200 });
      });

      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes[1].position.x).toBe(200);
      expect(result.current.nodes[1].position.y).toBe(200);
    });

    it('deve cortar nós selecionados', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
        result.current.selectNode(mockNode.id);
      });

      act(() => {
        result.current.cut();
      });

      expect(result.current.nodes).toHaveLength(0);
      expect(result.current.clipboard).toHaveLength(1);
    });
  });

  describe('Histórico (Undo/Redo)', () => {
    it('deve desfazer última ação', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
      });

      expect(result.current.nodes).toHaveLength(1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('deve refazer ação desfeita', () => {
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('Persistência', () => {
    it('deve salvar diagrama', async () => {
      vi.mocked(editorService.saveDiagram).mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
      });

      await act(async () => {
        await result.current.save();
      });

      expect(editorService.saveDiagram).toHaveBeenCalledWith(
        mockDiagramId,
        expect.objectContaining({
          nodes: [mockNode],
          connections: [],
        })
      );
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('deve carregar diagrama', async () => {
      const diagramData = {
        nodes: [mockNode],
        connections: [mockConnection],
      };
      vi.mocked(editorService.loadDiagram).mockResolvedValue(diagramData);
      
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      await act(async () => {
        await result.current.load();
      });

      expect(result.current.nodes).toEqual([mockNode]);
      expect(result.current.connections).toEqual([mockConnection]);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('deve exportar diagrama', async () => {
      const exportData = 'exported-data';
      vi.mocked(editorService.exportDiagram).mockResolvedValue(exportData);
      
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      let exportResult: string | undefined;
      await act(async () => {
        exportResult = await result.current.exportDiagram('json');
      });

      expect(exportResult).toBe(exportData);
      expect(editorService.exportDiagram).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: [],
          connections: [],
        }),
        'json'
      );
    });
  });

  describe('Auto-save', () => {
    it('deve salvar automaticamente após mudanças', async () => {
      vi.useFakeTimers();
      vi.mocked(editorService.saveDiagram).mockResolvedValue(undefined);
      
      const { result } = renderHook(() => 
        useDiagramEditor(mockDiagramId, { autoSave: true, autoSaveInterval: 1000 })
      );

      act(() => {
        result.current.addNode(mockNode);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(editorService.saveDiagram).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Validação', () => {
    it('deve validar diagrama', async () => {
      const validationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };
      vi.mocked(editorService.validateDiagram).mockResolvedValue(validationResult);
      
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      let validation: any;
      await act(async () => {
        validation = await result.current.validate();
      });

      expect(validation).toEqual(validationResult);
      expect(editorService.validateDiagram).toHaveBeenCalled();
    });
  });

  describe('Layout Automático', () => {
    it('deve otimizar layout do diagrama', async () => {
      const optimizedData = {
        nodes: [{ ...mockNode, position: { x: 150, y: 150 } }],
        connections: [],
      };
      vi.mocked(editorService.optimizeLayout).mockResolvedValue(optimizedData);
      
      const { result } = renderHook(() => useDiagramEditor(mockDiagramId));

      act(() => {
        result.current.addNode(mockNode);
      });

      await act(async () => {
        await result.current.optimizeLayout();
      });

      expect(result.current.nodes[0].position.x).toBe(150);
      expect(result.current.nodes[0].position.y).toBe(150);
    });
  });
});