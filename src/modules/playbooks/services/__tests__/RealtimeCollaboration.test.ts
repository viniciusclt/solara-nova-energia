/**
 * Testes unitários para RealtimeCollaboration service
 * 
 * Testa funcionalidades de colaboração em tempo real,
 * WebSocket, sincronização, resolução de conflitos
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealtimeCollaboration } from '../RealtimeCollaboration';
import { CollaborationUser, Conflict } from '../../../../services/collaboration/types';
import { Comment } from '../../types/collaboration';

// Mock do WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simular conexão assíncrona
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  });

  // Método para simular recebimento de mensagem
  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  // Método para simular erro
  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Mock global do WebSocket
Object.defineProperty(global, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
});

describe('RealtimeCollaboration', () => {
  let service: RealtimeCollaboration;
  let mockWebSocket: MockWebSocket;
  const diagramId = 'test-diagram-123';
  
  const mockUser: CollaborationUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'editor',
    avatar: 'https://example.com/avatar.jpg',
    cursor: { x: 100, y: 100 },
    isOnline: true,
    lastSeen: new Date(),
  };

  const mockComment: Comment = {
    id: 'comment-1',
    content: 'Test comment',
    authorId: 'user-1',
    authorName: 'Test User',
    position: { x: 200, y: 150 },
    elementId: 'element-1',
    timestamp: new Date(),
    status: 'pending',
    replies: [],
  };

  const mockConflict: Conflict = {
    id: 'conflict-1',
    type: 'edit',
    elementId: 'element-1',
    localVersion: { data: 'local' },
    remoteVersion: { data: 'remote' },
    timestamp: new Date(),
    userId: 'user-2',
    userName: 'Other User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RealtimeCollaboration(diagramId);
    
    // Aguardar a criação do WebSocket
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        mockWebSocket = (service as any).ws;
        resolve();
      }, 20);
    });
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('Inicialização', () => {
    it('deve criar instância com configurações padrão', () => {
      expect(service).toBeInstanceOf(RealtimeCollaboration);
      expect(service.isConnected()).toBe(false);
    });

    it('deve aceitar configurações customizadas', () => {
      const customService = new RealtimeCollaboration(diagramId, {
        autoResolveConflicts: false,
        enableCursorBroadcast: false,
        enablePresence: false,
        syncInterval: 2000,
      });

      expect(customService).toBeInstanceOf(RealtimeCollaboration);
    });
  });

  describe('Conexão WebSocket', () => {
    it('deve conectar com sucesso', async () => {
      await service.connect();
      
      expect(service.isConnected()).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'join',
          diagramId,
          userId: expect.any(String),
        })
      );
    });

    it('deve lidar com erro de conexão', async () => {
      const errorSpy = vi.fn();
      service.on('error', errorSpy);

      // Simular erro antes da conexão
      setTimeout(() => {
        mockWebSocket.simulateError();
      }, 5);

      await expect(service.connect()).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('deve desconectar corretamente', async () => {
      await service.connect();
      
      service.disconnect();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('deve reconectar automaticamente após desconexão', async () => {
      await service.connect();
      
      const reconnectSpy = vi.spyOn(service, 'connect');
      
      // Simular desconexão
      mockWebSocket.onclose?.(new CloseEvent('close'));
      
      // Aguardar tentativa de reconexão
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(reconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Gerenciamento de Usuários', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('deve convidar usuário', async () => {
      const email = 'newuser@example.com';
      const role = 'viewer';
      
      await service.inviteUser(email, role);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'invite_user',
          email,
          role,
        })
      );
    });

    it('deve remover usuário', async () => {
      const userId = 'user-to-remove';
      
      await service.removeUser(userId);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'remove_user',
          userId,
        })
      );
    });

    it('deve atualizar papel do usuário', async () => {
      const userId = 'user-1';
      const newRole = 'admin';
      
      await service.updateUserRole(userId, newRole);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'update_user_role',
          userId,
          role: newRole,
        })
      );
    });

    it('deve atualizar lista de usuários quando receber evento', () => {
      const usersSpy = vi.fn();
      service.on('usersChanged', usersSpy);
      
      const users = [mockUser];
      mockWebSocket.simulateMessage({
        type: 'users_updated',
        users,
      });
      
      expect(usersSpy).toHaveBeenCalledWith(users);
      expect(service.getUsers()).toEqual(users);
    });
  });

  describe('Sistema de Comentários', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('deve adicionar comentário', async () => {
      const commentData = {
        content: 'New comment',
        position: { x: 300, y: 250 },
        elementId: 'element-2',
      };
      
      await service.addComment(commentData);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'add_comment',
          ...commentData,
        })
      );
    });

    it('deve responder a comentário', async () => {
      const commentId = 'comment-1';
      const reply = 'This is a reply';
      
      await service.replyToComment(commentId, reply);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'reply_comment',
          commentId,
          content: reply,
        })
      );
    });

    it('deve resolver comentário', async () => {
      const commentId = 'comment-1';
      
      await service.resolveComment(commentId);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'resolve_comment',
          commentId,
        })
      );
    });

    it('deve atualizar lista de comentários quando receber evento', () => {
      const commentsSpy = vi.fn();
      service.on('commentsChanged', commentsSpy);
      
      const comments = [mockComment];
      mockWebSocket.simulateMessage({
        type: 'comments_updated',
        comments,
      });
      
      expect(commentsSpy).toHaveBeenCalledWith(comments);
      expect(service.getComments()).toEqual(comments);
    });
  });

  describe('Resolução de Conflitos', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('deve resolver conflito mantendo versão local', async () => {
      const conflictId = 'conflict-1';
      const resolution = 'local';
      
      await service.resolveConflict(conflictId, resolution);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'resolve_conflict',
          conflictId,
          resolution,
        })
      );
    });

    it('deve resolver conflito aceitando versão remota', async () => {
      const conflictId = 'conflict-1';
      const resolution = 'remote';
      
      await service.resolveConflict(conflictId, resolution);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'resolve_conflict',
          conflictId,
          resolution,
        })
      );
    });

    it('deve criar conflito personalizado', async () => {
      const conflictId = 'conflict-1';
      const customResolution = { merged: 'data' };
      
      await service.resolveConflict(conflictId, 'custom', customResolution);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'resolve_conflict',
          conflictId,
          resolution: 'custom',
          customResolution,
        })
      );
    });

    it('deve detectar conflito automaticamente', () => {
      const conflictsSpy = vi.fn();
      service.on('conflictsChanged', conflictsSpy);
      
      const conflicts = [mockConflict];
      mockWebSocket.simulateMessage({
        type: 'conflict_detected',
        conflicts,
      });
      
      expect(conflictsSpy).toHaveBeenCalledWith(conflicts);
      expect(service.getPendingConflicts()).toEqual(conflicts);
    });

    it('deve resolver conflitos automaticamente quando habilitado', () => {
      const autoResolveService = new RealtimeCollaboration(diagramId, {
        autoResolveConflicts: true,
      });
      
      const resolveSpy = vi.spyOn(autoResolveService, 'resolveConflict');
      
      // Simular conflito simples
      const simpleConflict = {
        ...mockConflict,
        type: 'position' as const,
      };
      
      (autoResolveService as any).handleConflictDetection([simpleConflict]);
      
      expect(resolveSpy).toHaveBeenCalledWith(simpleConflict.id, 'remote');
    });
  });

  describe('Sincronização de Cursor', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('deve broadcast posição do cursor', () => {
      const position = { x: 150, y: 200 };
      
      service.updateCursor(position);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'cursor_update',
          position,
        })
      );
    });

    it('deve navegar para cursor de outro usuário', async () => {
      const userId = 'user-2';
      
      await service.goToCursor(userId);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'goto_cursor',
          userId,
        })
      );
    });

    it('deve receber atualizações de cursor de outros usuários', () => {
      const cursorSpy = vi.fn();
      service.on('cursorUpdate', cursorSpy);
      
      const cursorData = {
        userId: 'user-2',
        position: { x: 300, y: 400 },
      };
      
      mockWebSocket.simulateMessage({
        type: 'cursor_updated',
        ...cursorData,
      });
      
      expect(cursorSpy).toHaveBeenCalledWith(cursorData);
    });
  });

  describe('Sincronização de Dados', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('deve sincronizar mudanças no diagrama', () => {
      const changes = {
        type: 'node_update',
        nodeId: 'node-1',
        data: { label: 'Updated Node' },
      };
      
      service.syncChanges(changes);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'sync_changes',
          changes,
        })
      );
    });

    it('deve receber mudanças de outros usuários', () => {
      const changesSpy = vi.fn();
      service.on('changesReceived', changesSpy);
      
      const changes = {
        type: 'node_added',
        node: { id: 'new-node', type: 'rectangle' },
        userId: 'user-2',
      };
      
      mockWebSocket.simulateMessage({
        type: 'changes_received',
        changes,
      });
      
      expect(changesSpy).toHaveBeenCalledWith(changes);
    });

    it('deve solicitar sincronização completa', async () => {
      await service.requestFullSync();
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'request_full_sync',
        })
      );
    });
  });

  describe('Presença de Usuários', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('deve atualizar status de presença', () => {
      const status = 'away';
      
      service.updatePresence(status);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'presence_update',
          status,
        })
      );
    });

    it('deve receber atualizações de presença', () => {
      const presenceSpy = vi.fn();
      service.on('presenceUpdate', presenceSpy);
      
      const presenceData = {
        userId: 'user-2',
        status: 'typing',
      };
      
      mockWebSocket.simulateMessage({
        type: 'presence_updated',
        ...presenceData,
      });
      
      expect(presenceSpy).toHaveBeenCalledWith(presenceData);
    });
  });

  describe('Eventos e Listeners', () => {
    it('deve registrar e remover listeners corretamente', () => {
      const listener = vi.fn();
      
      service.on('usersChanged', listener);
      service.off('usersChanged', listener);
      
      // Simular evento
      mockWebSocket.simulateMessage({
        type: 'users_updated',
        users: [mockUser],
      });
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('deve emitir evento de conexão', async () => {
      const connectionSpy = vi.fn();
      service.on('connectionChanged', connectionSpy);
      
      await service.connect();
      
      expect(connectionSpy).toHaveBeenCalledWith(true);
    });

    it('deve emitir evento de desconexão', async () => {
      await service.connect();
      
      const connectionSpy = vi.fn();
      service.on('connectionChanged', connectionSpy);
      
      service.disconnect();
      
      expect(connectionSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com mensagens malformadas', () => {
      const errorSpy = vi.fn();
      service.on('error', errorSpy);
      
      // Simular mensagem inválida
      mockWebSocket.onmessage?.(new MessageEvent('message', { 
        data: 'invalid json' 
      }));
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('deve lidar com tipos de mensagem desconhecidos', () => {
      const errorSpy = vi.fn();
      service.on('error', errorSpy);
      
      mockWebSocket.simulateMessage({
        type: 'unknown_type',
        data: 'some data',
      });
      
      // Não deve gerar erro, apenas ignorar
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('deve tentar reconectar após erro de rede', async () => {
      await service.connect();
      
      const reconnectSpy = vi.spyOn(service, 'connect');
      
      // Simular erro de rede
      mockWebSocket.simulateError();
      
      // Aguardar tentativa de reconexão
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(reconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Performance e Otimizações', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('deve throttle atualizações de cursor', () => {
      const position1 = { x: 100, y: 100 };
      const position2 = { x: 101, y: 101 };
      const position3 = { x: 102, y: 102 };
      
      service.updateCursor(position1);
      service.updateCursor(position2);
      service.updateCursor(position3);
      
      // Deve enviar apenas a última posição devido ao throttling
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
    });

    it('deve batch mudanças pequenas', () => {
      const changes1 = { type: 'node_move', nodeId: 'node-1', position: { x: 100, y: 100 } };
      const changes2 = { type: 'node_move', nodeId: 'node-1', position: { x: 101, y: 101 } };
      
      service.syncChanges(changes1);
      service.syncChanges(changes2);
      
      // Deve fazer batch das mudanças
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'sync_changes',
          changes: expect.arrayContaining([changes1, changes2]),
        })
      );
    });

    it('deve limitar número de mensagens por segundo', async () => {
      const startTime = Date.now();
      
      // Enviar muitas mensagens rapidamente
      for (let i = 0; i < 100; i++) {
        service.updateCursor({ x: i, y: i });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Deve ter limitado a taxa de envio
      expect(duration).toBeGreaterThan(50); // Pelo menos 50ms para processar
    });
  });
});