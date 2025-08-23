import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollaborationPanel } from '../CollaborationPanel';
import { useCollaboration } from '../../hooks/useCollaboration';

// Mock do hook de colaboração
vi.mock('../../hooks/useCollaboration');

// Mock de ícones
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  MessageCircle: () => <div data-testid="message-icon" />,
  Send: () => <div data-testid="send-icon" />,
  X: () => <div data-testid="close-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Reply: () => <div data-testid="reply-icon" />,
}));

const mockActiveUsers = [
  {
    id: 'user-1',
    name: 'Alice Silva',
    email: 'alice@example.com',
    role: 'admin' as const,
    cursor: { x: 100, y: 150 },
    color: '#ff6b6b',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'user-2',
    name: 'Bob Santos',
    email: 'bob@example.com',
    role: 'editor' as const,
    cursor: { x: 200, y: 250 },
    color: '#4ecdc4',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'user-3',
    name: 'Carol Lima',
    email: 'carol@example.com',
    role: 'viewer' as const,
    cursor: null,
    color: '#45b7d1',
    isOnline: false,
    lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutos atrás
  },
];

const mockComments = [
  {
    id: 'comment-1',
    userId: 'user-1',
    userName: 'Alice Silva',
    userColor: '#ff6b6b',
    text: 'Este nó precisa de mais detalhes',
    position: { x: 100, y: 100 },
    nodeId: 'node-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    resolved: false,
    replies: [
      {
        id: 'reply-1',
        userId: 'user-2',
        userName: 'Bob Santos',
        userColor: '#4ecdc4',
        text: 'Concordo, vou adicionar mais informações',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min atrás
      },
    ],
  },
  {
    id: 'comment-2',
    userId: 'user-2',
    userName: 'Bob Santos',
    userColor: '#4ecdc4',
    text: 'Conexão parece estar incorreta',
    position: { x: 200, y: 150 },
    edgeId: 'edge-1',
    timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 min atrás
    resolved: true,
    replies: [],
  },
];

const mockUseCollaboration = {
  isConnected: true,
  activeUsers: mockActiveUsers,
  comments: mockComments,
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

describe('CollaborationPanel', () => {
  beforeEach(() => {
    vi.mocked(useCollaboration).mockReturnValue(mockUseCollaboration);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o painel de colaboração corretamente', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('collaboration-panel')).toBeInTheDocument();
      expect(screen.getByText('Colaboração')).toBeInTheDocument();
    });

    it('deve mostrar status de conexão quando conectado', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      expect(screen.getByText('Conectado')).toBeInTheDocument();
    });

    it('deve mostrar status de desconectado quando não conectado', () => {
      const mockDisconnected = {
        ...mockUseCollaboration,
        isConnected: false,
      };
      vi.mocked(useCollaboration).mockReturnValue(mockDisconnected);
      
      render(<CollaborationPanel />);
      
      expect(screen.getByText('Desconectado')).toBeInTheDocument();
    });
  });

  describe('Lista de Usuários Ativos', () => {
    it('deve renderizar lista de usuários ativos', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('active-users-list')).toBeInTheDocument();
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
      expect(screen.getByText('Bob Santos')).toBeInTheDocument();
      expect(screen.getByText('Carol Lima')).toBeInTheDocument();
    });

    it('deve mostrar indicador de status online/offline', () => {
      render(<CollaborationPanel />);
      
      const aliceStatus = screen.getByTestId('user-status-user-1');
      const carolStatus = screen.getByTestId('user-status-user-3');
      
      expect(aliceStatus).toHaveClass('online');
      expect(carolStatus).toHaveClass('offline');
    });

    it('deve mostrar roles dos usuários', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('user-role-user-1')).toHaveTextContent('admin');
      expect(screen.getByTestId('user-role-user-2')).toHaveTextContent('editor');
      expect(screen.getByTestId('user-role-user-3')).toHaveTextContent('viewer');
    });

    it('deve mostrar cores dos cursores dos usuários', () => {
      render(<CollaborationPanel />);
      
      const aliceCursor = screen.getByTestId('user-cursor-user-1');
      const bobCursor = screen.getByTestId('user-cursor-user-2');
      
      expect(aliceCursor).toHaveStyle('background-color: #ff6b6b');
      expect(bobCursor).toHaveStyle('background-color: #4ecdc4');
    });
  });

  describe('Convite de Usuários', () => {
    it('deve mostrar botão de convidar usuário', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('invite-user-button')).toBeInTheDocument();
    });

    it('deve abrir modal de convite ao clicar no botão', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      await user.click(screen.getByTestId('invite-user-button'));
      
      expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
      expect(screen.getByLabelText('Email do usuário')).toBeInTheDocument();
      expect(screen.getByLabelText('Papel')).toBeInTheDocument();
    });

    it('deve enviar convite com dados corretos', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      // Abrir modal
      await user.click(screen.getByTestId('invite-user-button'));
      
      // Preencher formulário
      await user.type(screen.getByLabelText('Email do usuário'), 'novo@example.com');
      await user.selectOptions(screen.getByLabelText('Papel'), 'editor');
      
      // Enviar convite
      await user.click(screen.getByTestId('send-invite-button'));
      
      expect(mockUseCollaboration.inviteUser).toHaveBeenCalledWith({
        email: 'novo@example.com',
        role: 'editor',
      });
    });
  });

  describe('Gerenciamento de Usuários', () => {
    it('deve permitir alterar papel do usuário', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      // Clicar no menu do usuário
      await user.click(screen.getByTestId('user-menu-user-2'));
      
      // Alterar para viewer
      await user.click(screen.getByTestId('change-role-viewer'));
      
      expect(mockUseCollaboration.updateUserRole).toHaveBeenCalledWith('user-2', 'viewer');
    });

    it('deve permitir remover usuário', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      // Clicar no menu do usuário
      await user.click(screen.getByTestId('user-menu-user-2'));
      
      // Remover usuário
      await user.click(screen.getByTestId('remove-user'));
      
      // Confirmar remoção
      await user.click(screen.getByTestId('confirm-remove'));
      
      expect(mockUseCollaboration.removeUser).toHaveBeenCalledWith('user-2');
    });
  });

  describe('Sistema de Comentários', () => {
    it('deve renderizar lista de comentários', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('comments-section')).toBeInTheDocument();
      expect(screen.getByText('Este nó precisa de mais detalhes')).toBeInTheDocument();
      expect(screen.getByText('Conexão parece estar incorreta')).toBeInTheDocument();
    });

    it('deve mostrar comentários resolvidos e não resolvidos', () => {
      render(<CollaborationPanel />);
      
      const comment1 = screen.getByTestId('comment-comment-1');
      const comment2 = screen.getByTestId('comment-comment-2');
      
      expect(comment1).not.toHaveClass('resolved');
      expect(comment2).toHaveClass('resolved');
    });

    it('deve mostrar timestamp dos comentários', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByText('há 1 hora')).toBeInTheDocument();
      expect(screen.getByText('há 20 minutos')).toBeInTheDocument();
    });

    it('deve permitir adicionar novo comentário', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      const commentInput = screen.getByTestId('new-comment-input');
      const submitButton = screen.getByTestId('submit-comment');
      
      await user.type(commentInput, 'Novo comentário de teste');
      await user.click(submitButton);
      
      expect(mockUseCollaboration.addComment).toHaveBeenCalledWith({
        text: 'Novo comentário de teste',
        position: expect.any(Object),
      });
    });

    it('deve permitir responder a comentário', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      // Clicar em responder
      await user.click(screen.getByTestId('reply-button-comment-1'));
      
      // Digitar resposta
      const replyInput = screen.getByTestId('reply-input-comment-1');
      await user.type(replyInput, 'Resposta ao comentário');
      
      // Enviar resposta
      await user.click(screen.getByTestId('send-reply-comment-1'));
      
      expect(mockUseCollaboration.replyToComment).toHaveBeenCalledWith(
        'comment-1',
        'Resposta ao comentário'
      );
    });

    it('deve permitir resolver comentário', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      await user.click(screen.getByTestId('resolve-button-comment-1'));
      
      expect(mockUseCollaboration.resolveComment).toHaveBeenCalledWith('comment-1', true);
    });

    it('deve mostrar respostas dos comentários', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByText('Concordo, vou adicionar mais informações')).toBeInTheDocument();
      expect(screen.getByTestId('reply-reply-1')).toBeInTheDocument();
    });
  });

  describe('Filtros e Busca', () => {
    it('deve permitir filtrar comentários por status', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      // Filtrar apenas comentários não resolvidos
      await user.click(screen.getByTestId('filter-unresolved'));
      
      expect(screen.getByText('Este nó precisa de mais detalhes')).toBeInTheDocument();
      expect(screen.queryByText('Conexão parece estar incorreta')).not.toBeInTheDocument();
    });

    it('deve permitir buscar comentários por texto', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      const searchInput = screen.getByTestId('search-comments');
      await user.type(searchInput, 'conexão');
      
      expect(screen.getByText('Conexão parece estar incorreta')).toBeInTheDocument();
      expect(screen.queryByText('Este nó precisa de mais detalhes')).not.toBeInTheDocument();
    });
  });

  describe('Estados de Loading e Erro', () => {
    it('deve mostrar indicador de loading', () => {
      const mockWithLoading = {
        ...mockUseCollaboration,
        isLoading: true,
      };
      vi.mocked(useCollaboration).mockReturnValue(mockWithLoading);
      
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('collaboration-loading')).toBeInTheDocument();
    });

    it('deve mostrar mensagem de erro', () => {
      const mockWithError = {
        ...mockUseCollaboration,
        error: 'Erro de conexão',
      };
      vi.mocked(useCollaboration).mockReturnValue(mockWithError);
      
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('collaboration-error')).toBeInTheDocument();
      expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
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
      
      render(<CollaborationPanel />);
      
      expect(screen.getByTestId('collaboration-panel')).toHaveClass('mobile-layout');
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels acessíveis', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByLabelText('Painel de colaboração')).toBeInTheDocument();
      expect(screen.getByLabelText('Lista de usuários ativos')).toBeInTheDocument();
      expect(screen.getByLabelText('Comentários')).toBeInTheDocument();
    });

    it('deve suportar navegação por teclado', async () => {
      const user = userEvent.setup();
      render(<CollaborationPanel />);
      
      // Tab para navegar entre elementos
      await user.tab();
      expect(screen.getByTestId('invite-user-button')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('new-comment-input')).toHaveFocus();
    });

    it('deve ter roles ARIA apropriados', () => {
      render(<CollaborationPanel />);
      
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /usuários ativos/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /comentários/i })).toBeInTheDocument();
    });
  });
});