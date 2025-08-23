/**
 * Testes unitários para useCollaboration hook
 * 
 * Testa funcionalidades de colaboração em tempo real,
 * sincronização de estado, resolução de conflitos
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCollaboration } from '../useCollaboration';
import { RealtimeCollaboration } from '../../services/RealtimeCollaboration';

// Mock do serviço de colaboração
vi.mock('../../services/RealtimeCollaboration');

const mockRealtimeCollaboration = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  inviteUser: vi.fn(),
  removeUser: vi.fn(),
  updateUserRole: vi.fn(),
  addComment: vi.fn(),
  replyToComment: vi.fn(),
  resolveConflict: vi.fn(),
  goToCursor: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getUsers: vi.fn(() => []),
  getComments: vi.fn(() => []),
  getPendingConflicts: vi.fn(() => []),
  isConnected: vi.fn(() => false),
};

vi.mocked(RealtimeCollaboration).mockImplementation(() => mockRealtimeCollaboration as any);

describe('useCollaboration', () => {
  const mockDiagramId = 'test-diagram-123';
  const mockOptions = {
    autoResolveConflicts: false,
    enableCursorBroadcast: true,
    enablePresence: true,
    syncInterval: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialização', () => {
    it('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.users).toEqual([]);
      expect(result.current.comments).toEqual([]);
      expect(result.current.pendingConflicts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve criar instância do RealtimeCollaboration', () => {
      renderHook(() => useCollaboration(mockDiagramId, mockOptions));
      
      expect(RealtimeCollaboration).toHaveBeenCalledWith(
        mockDiagramId,
        mockOptions
      );
    });
  });

  describe('Conexão', () => {
    it('deve conectar com sucesso', async () => {
      mockRealtimeCollaboration.connect.mockResolvedValue(undefined);
      mockRealtimeCollaboration.isConnected.mockReturnValue(true);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.connect();
      });

      expect(mockRealtimeCollaboration.connect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(true);
    });

    it('deve lidar com erro de conexão', async () => {
      const errorMessage = 'Falha na conexão';
      mockRealtimeCollaboration.connect.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isConnected).toBe(false);
    });

    it('deve desconectar corretamente', async () => {
      mockRealtimeCollaboration.disconnect.mockResolvedValue(undefined);
      mockRealtimeCollaboration.isConnected.mockReturnValue(false);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockRealtimeCollaboration.disconnect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Gerenciamento de Usuários', () => {
    it('deve convidar usuário com sucesso', async () => {
      const email = 'test@example.com';
      const role = 'editor';
      mockRealtimeCollaboration.inviteUser.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.inviteUser(email, role);
      });

      expect(mockRealtimeCollaboration.inviteUser).toHaveBeenCalledWith(email, role);
    });

    it('deve remover usuário com sucesso', async () => {
      const userId = 'user-123';
      mockRealtimeCollaboration.removeUser.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.removeUser(userId);
      });

      expect(mockRealtimeCollaboration.removeUser).toHaveBeenCalledWith(userId);
    });

    it('deve atualizar papel do usuário', async () => {
      const userId = 'user-123';
      const newRole = 'viewer';
      mockRealtimeCollaboration.updateUserRole.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.updateUserRole(userId, newRole);
      });

      expect(mockRealtimeCollaboration.updateUserRole).toHaveBeenCalledWith(userId, newRole);
    });
  });

  describe('Sistema de Comentários', () => {
    it('deve adicionar comentário com sucesso', async () => {
      const comment = {
        content: 'Teste de comentário',
        position: { x: 100, y: 200 },
        elementId: 'element-123',
      };
      mockRealtimeCollaboration.addComment.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.addComment(comment);
      });

      expect(mockRealtimeCollaboration.addComment).toHaveBeenCalledWith(comment);
    });

    it('deve responder a comentário', async () => {
      const commentId = 'comment-123';
      const reply = 'Resposta ao comentário';
      mockRealtimeCollaboration.replyToComment.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.replyToComment(commentId, reply);
      });

      expect(mockRealtimeCollaboration.replyToComment).toHaveBeenCalledWith(commentId, reply);
    });
  });

  describe('Resolução de Conflitos', () => {
    it('deve resolver conflito mantendo versão local', async () => {
      const conflictId = 'conflict-123';
      const resolution = 'local';
      mockRealtimeCollaboration.resolveConflict.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.resolveConflict(conflictId, resolution);
      });

      expect(mockRealtimeCollaboration.resolveConflict).toHaveBeenCalledWith(conflictId, resolution);
    });

    it('deve resolver conflito aceitando versão remota', async () => {
      const conflictId = 'conflict-123';
      const resolution = 'remote';
      mockRealtimeCollaboration.resolveConflict.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.resolveConflict(conflictId, resolution);
      });

      expect(mockRealtimeCollaboration.resolveConflict).toHaveBeenCalledWith(conflictId, resolution);
    });
  });

  describe('Navegação de Cursor', () => {
    it('deve navegar para cursor do usuário', async () => {
      const userId = 'user-123';
      mockRealtimeCollaboration.goToCursor.mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.goToCursor(userId);
      });

      expect(mockRealtimeCollaboration.goToCursor).toHaveBeenCalledWith(userId);
    });
  });

  describe('Eventos em Tempo Real', () => {
    it('deve configurar listeners de eventos na inicialização', () => {
      renderHook(() => useCollaboration(mockDiagramId, mockOptions));

      expect(mockRealtimeCollaboration.on).toHaveBeenCalledWith('usersChanged', expect.any(Function));
      expect(mockRealtimeCollaboration.on).toHaveBeenCalledWith('commentsChanged', expect.any(Function));
      expect(mockRealtimeCollaboration.on).toHaveBeenCalledWith('conflictsChanged', expect.any(Function));
      expect(mockRealtimeCollaboration.on).toHaveBeenCalledWith('connectionChanged', expect.any(Function));
    });

    it('deve limpar listeners na desmontagem', () => {
      const { unmount } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      unmount();

      expect(mockRealtimeCollaboration.off).toHaveBeenCalledWith('usersChanged', expect.any(Function));
      expect(mockRealtimeCollaboration.off).toHaveBeenCalledWith('commentsChanged', expect.any(Function));
      expect(mockRealtimeCollaboration.off).toHaveBeenCalledWith('conflictsChanged', expect.any(Function));
      expect(mockRealtimeCollaboration.off).toHaveBeenCalledWith('connectionChanged', expect.any(Function));
    });
  });

  describe('Estados de Loading e Error', () => {
    it('deve definir loading durante operações assíncronas', async () => {
      let resolveConnect: () => void;
      const connectPromise = new Promise<void>((resolve) => {
        resolveConnect = resolve;
      });
      mockRealtimeCollaboration.connect.mockReturnValue(connectPromise);

      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      act(() => {
        result.current.connect();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveConnect!();
        await connectPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('deve limpar erro ao executar nova operação', async () => {
      // Primeiro, simular um erro
      mockRealtimeCollaboration.connect.mockRejectedValueOnce(new Error('Erro inicial'));
      
      const { result } = renderHook(() => 
        useCollaboration(mockDiagramId, mockOptions)
      );

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBe('Erro inicial');

      // Agora, simular sucesso
      mockRealtimeCollaboration.connect.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBeNull();
    });
  });
});