import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiagramEditor } from '../DiagramEditor';
import { useDiagramEditor } from '../../hooks/useDiagramEditor';
import { useCollaboration } from '../../hooks/useCollaboration';

// Mock dos hooks
vi.mock('../../hooks/useDiagramEditor');
vi.mock('../../hooks/useCollaboration');
vi.mock('../../services/AutoRoutingService');
vi.mock('../../services/RealtimeCollaboration');

// Mock do React Flow
vi.mock('reactflow', () => ({
  ReactFlow: ({ children, onNodesChange, onEdgesChange, onConnect, ...props }: any) => (
    <div data-testid="react-flow" {...props}>
      {children}
      <div data-testid="nodes-container">
        {props.nodes?.map((node: any) => (
          <div key={node.id} data-testid={`node-${node.id}`}>
            {node.data.label}
          </div>
        ))}
      </div>
      <div data-testid="edges-container">
        {props.edges?.map((edge: any) => (
          <div key={edge.id} data-testid={`edge-${edge.id}`} />
        ))}
      </div>
    </div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Panel: ({ children, position }: any) => (
    <div data-testid={`panel-${position}`}>{children}</div>
  ),
  useReactFlow: () => ({
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    fitView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }),
}));

const mockUseDiagramEditor = {
  nodes: [
    {
      id: 'node-1',
      type: 'rectangle',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node 1' },
    },
    {
      id: 'node-2',
      type: 'circle',
      position: { x: 300, y: 100 },
      data: { label: 'Test Node 2' },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'default',
    },
  ],
  selectedElements: [],
  isLoading: false,
  error: null,
  history: {
    canUndo: true,
    canRedo: false,
  },
  addNode: vi.fn(),
  updateNode: vi.fn(),
  removeNode: vi.fn(),
  duplicateNode: vi.fn(),
  addEdge: vi.fn(),
  updateEdge: vi.fn(),
  removeEdge: vi.fn(),
  selectElements: vi.fn(),
  clearSelection: vi.fn(),
  copyElements: vi.fn(),
  pasteElements: vi.fn(),
  cutElements: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  saveDiagram: vi.fn(),
  loadDiagram: vi.fn(),
  exportDiagram: vi.fn(),
  importDiagram: vi.fn(),
  optimizeLayout: vi.fn(),
  validateDiagram: vi.fn(),
  onNodesChange: vi.fn(),
  onEdgesChange: vi.fn(),
  onConnect: vi.fn(),
};

const mockUseCollaboration = {
  isConnected: false,
  activeUsers: [],
  comments: [],
  isLoading: false,
  error: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  inviteUser: vi.fn(),
  removeUser: vi.fn(),
  updateUserRole: vi.fn(),
  addComment: vi.fn(),
  replyToComment: vi.fn(),
  resolveComment: vi.fn(),
  updateCursor: vi.fn(),
};

describe('DiagramEditor', () => {
  beforeEach(() => {
    vi.mocked(useDiagramEditor).mockReturnValue(mockUseDiagramEditor);
    vi.mocked(useCollaboration).mockReturnValue(mockUseCollaboration);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o editor de diagramas corretamente', () => {
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('background')).toBeInTheDocument();
      expect(screen.getByTestId('controls')).toBeInTheDocument();
      expect(screen.getByTestId('minimap')).toBeInTheDocument();
    });

    it('deve renderizar a toolbar com ferramentas', () => {
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('tool-select')).toBeInTheDocument();
      expect(screen.getByTestId('tool-rectangle')).toBeInTheDocument();
      expect(screen.getByTestId('tool-circle')).toBeInTheDocument();
      expect(screen.getByTestId('tool-diamond')).toBeInTheDocument();
      expect(screen.getByTestId('tool-connection')).toBeInTheDocument();
    });

    it('deve renderizar nós existentes', () => {
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('node-node-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-node-2')).toBeInTheDocument();
      expect(screen.getByText('Test Node 1')).toBeInTheDocument();
      expect(screen.getByText('Test Node 2')).toBeInTheDocument();
    });

    it('deve renderizar conexões existentes', () => {
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('edge-edge-1')).toBeInTheDocument();
    });
  });

  describe('Interações da Toolbar', () => {
    it('deve selecionar ferramenta de retângulo', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      const rectangleTool = screen.getByTestId('tool-rectangle');
      await user.click(rectangleTool);
      
      expect(rectangleTool).toHaveClass('active');
    });

    it('deve selecionar ferramenta de círculo', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      const circleTool = screen.getByTestId('tool-circle');
      await user.click(circleTool);
      
      expect(circleTool).toHaveClass('active');
    });

    it('deve selecionar ferramenta de losango', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      const diamondTool = screen.getByTestId('tool-diamond');
      await user.click(diamondTool);
      
      expect(diamondTool).toHaveClass('active');
    });

    it('deve selecionar ferramenta de conexão', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      const connectionTool = screen.getByTestId('tool-connection');
      await user.click(connectionTool);
      
      expect(connectionTool).toHaveClass('active');
    });
  });

  describe('Criação de Nós', () => {
    it('deve criar nó retangular ao clicar no canvas', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      // Selecionar ferramenta de retângulo
      await user.click(screen.getByTestId('tool-rectangle'));
      
      // Clicar no canvas
      const canvas = screen.getByTestId('react-flow');
      await user.click(canvas);
      
      expect(mockUseDiagramEditor.addNode).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rectangle',
          position: expect.any(Object),
          data: expect.objectContaining({
            label: expect.any(String),
          }),
        })
      );
    });

    it('deve criar nó circular ao clicar no canvas', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      // Selecionar ferramenta de círculo
      await user.click(screen.getByTestId('tool-circle'));
      
      // Clicar no canvas
      const canvas = screen.getByTestId('react-flow');
      await user.click(canvas);
      
      expect(mockUseDiagramEditor.addNode).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'circle',
          position: expect.any(Object),
          data: expect.objectContaining({
            label: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Operações de Histórico', () => {
    it('deve executar undo quando Ctrl+Z for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Control>}z{/Control}');
      
      expect(mockUseDiagramEditor.undo).toHaveBeenCalled();
    });

    it('deve executar redo quando Ctrl+Y for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Control>}y{/Control}');
      
      expect(mockUseDiagramEditor.redo).toHaveBeenCalled();
    });

    it('deve mostrar botão de undo habilitado quando há histórico', () => {
      render(<DiagramEditor />);
      
      const undoButton = screen.getByTestId('undo-button');
      expect(undoButton).not.toBeDisabled();
    });

    it('deve mostrar botão de redo desabilitado quando não há histórico', () => {
      render(<DiagramEditor />);
      
      const redoButton = screen.getByTestId('redo-button');
      expect(redoButton).toBeDisabled();
    });
  });

  describe('Operações de Clipboard', () => {
    it('deve copiar elementos selecionados quando Ctrl+C for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Control>}c{/Control}');
      
      expect(mockUseDiagramEditor.copyElements).toHaveBeenCalled();
    });

    it('deve colar elementos quando Ctrl+V for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Control>}v{/Control}');
      
      expect(mockUseDiagramEditor.pasteElements).toHaveBeenCalled();
    });

    it('deve cortar elementos quando Ctrl+X for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Control>}x{/Control}');
      
      expect(mockUseDiagramEditor.cutElements).toHaveBeenCalled();
    });
  });

  describe('Seleção de Elementos', () => {
    it('deve selecionar todos os elementos quando Ctrl+A for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Control>}a{/Control}');
      
      expect(mockUseDiagramEditor.selectElements).toHaveBeenCalledWith(
        [...mockUseDiagramEditor.nodes, ...mockUseDiagramEditor.edges]
      );
    });

    it('deve limpar seleção quando Escape for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Escape}');
      
      expect(mockUseDiagramEditor.clearSelection).toHaveBeenCalled();
    });

    it('deve deletar elementos selecionados quando Delete for pressionado', async () => {
      const user = userEvent.setup();
      
      // Mock elementos selecionados
      const mockWithSelection = {
        ...mockUseDiagramEditor,
        selectedElements: [{ id: 'node-1', type: 'node' }],
      };
      vi.mocked(useDiagramEditor).mockReturnValue(mockWithSelection);
      
      render(<DiagramEditor />);
      
      await user.keyboard('{Delete}');
      
      expect(mockUseDiagramEditor.removeNode).toHaveBeenCalledWith('node-1');
    });
  });

  describe('Salvamento e Carregamento', () => {
    it('deve salvar diagrama quando Ctrl+S for pressionado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      await user.keyboard('{Control>}s{/Control}');
      
      expect(mockUseDiagramEditor.saveDiagram).toHaveBeenCalled();
    });

    it('deve mostrar indicador de salvamento automático', () => {
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('auto-save-indicator')).toBeInTheDocument();
    });
  });

  describe('Estados de Loading e Erro', () => {
    it('deve mostrar indicador de loading quando isLoading for true', () => {
      const mockWithLoading = {
        ...mockUseDiagramEditor,
        isLoading: true,
      };
      vi.mocked(useDiagramEditor).mockReturnValue(mockWithLoading);
      
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('deve mostrar mensagem de erro quando error estiver presente', () => {
      const mockWithError = {
        ...mockUseDiagramEditor,
        error: 'Erro ao carregar diagrama',
      };
      vi.mocked(useDiagramEditor).mockReturnValue(mockWithError);
      
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Erro ao carregar diagrama')).toBeInTheDocument();
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar layout para telas pequenas', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('toolbar')).toHaveClass('mobile-layout');
    });

    it('deve mostrar layout desktop para telas grandes', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      render(<DiagramEditor />);
      
      expect(screen.getByTestId('toolbar')).toHaveClass('desktop-layout');
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels acessíveis para ferramentas', () => {
      render(<DiagramEditor />);
      
      expect(screen.getByLabelText('Selecionar')).toBeInTheDocument();
      expect(screen.getByLabelText('Retângulo')).toBeInTheDocument();
      expect(screen.getByLabelText('Círculo')).toBeInTheDocument();
      expect(screen.getByLabelText('Losango')).toBeInTheDocument();
      expect(screen.getByLabelText('Conexão')).toBeInTheDocument();
    });

    it('deve suportar navegação por teclado', async () => {
      const user = userEvent.setup();
      render(<DiagramEditor />);
      
      // Tab para navegar entre ferramentas
      await user.tab();
      expect(screen.getByTestId('tool-select')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('tool-rectangle')).toHaveFocus();
    });

    it('deve ter roles ARIA apropriados', () => {
      render(<DiagramEditor />);
      
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});