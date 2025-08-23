// ============================================================================
// Collaboration Service - Serviço de colaboração em tempo real
// ============================================================================

import { Node, Edge } from 'reactflow';
import {
  CollaborationService as ICollaborationService,
  CollaborationUser,
  CollaborationEvent,
  UserPresence,
  DiagramComment,
  MergeConflict,
  ConflictResolution,
  WebSocketMessage,
  EventMessage,
  PresenceMessage,
  SyncMessage,
  ErrorMessage,
  AckMessage,
  CollaborationConfig,
  DEFAULT_COLLABORATION_CONFIG,
  CollaborationError,
  ConnectionError,
  ConflictError,
  COLLABORATION_COLORS,
} from '../types/collaboration';

// ============================================================================
// WebSocket Collaboration Service
// ============================================================================

export class CollaborationService implements ICollaborationService {
  private ws: WebSocket | null = null;
  private config: CollaborationConfig;
  private currentSessionId: string | null = null;
  private currentUser: CollaborationUser | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private presenceTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private pendingAcks = new Map<string, (success: boolean, error?: string) => void>();
  
  // Event listeners
  private eventListeners = new Set<(event: CollaborationEvent) => void>();
  private presenceListeners = new Set<(users: Map<string, UserPresence>) => void>();
  private connectionListeners = new Set<(connected: boolean) => void>();
  
  // State
  private activeUsers = new Map<string, CollaborationUser>();
  private userPresence = new Map<string, UserPresence>();
  private comments = new Map<string, DiagramComment>();
  private activeConflicts = new Map<string, MergeConflict>();
  private lastPresenceUpdate: UserPresence | null = null;
  
  constructor(config: Partial<CollaborationConfig> = {}) {
    this.config = { ...DEFAULT_COLLABORATION_CONFIG, ...config };
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.websocketUrl);
        
        this.ws.onopen = () => {
          console.log('🔗 Colaboração: Conectado ao servidor');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          this.notifyConnectionListeners(true);
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onclose = (event) => {
          console.log('🔌 Colaboração: Conexão fechada', event.code, event.reason);
          this.cleanup();
          this.notifyConnectionListeners(false);
          
          if (!event.wasClean && this.reconnectAttempts < this.config.reconnectAttempts) {
            this.scheduleReconnect();
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ Colaboração: Erro na conexão', error);
          reject(new ConnectionError('Falha na conexão WebSocket'));
        };
        
      } catch (error) {
        reject(new ConnectionError('Erro ao criar conexão WebSocket'));
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Colaboração: Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        await this.connect();
        if (this.currentSessionId && this.currentUser) {
          await this.joinSession(this.currentSessionId, this.currentUser);
        }
      } catch (error) {
        console.error('❌ Colaboração: Falha na reconexão', error);
      }
    }, delay);
  }

  private cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer);
      this.presenceTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'event',
          payload: {
            type: 'heartbeat',
            userId: this.currentUser?.id || '',
            sessionId: this.currentSessionId || '',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  // ============================================================================
  // Message Handling
  // ============================================================================

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'event':
          this.handleEventMessage(message as EventMessage);
          break;
        case 'presence':
          this.handlePresenceMessage(message as PresenceMessage);
          break;
        case 'sync':
          this.handleSyncMessage(message as SyncMessage);
          break;
        case 'error':
          this.handleErrorMessage(message as ErrorMessage);
          break;
        case 'ack':
          this.handleAckMessage(message as AckMessage);
          break;
        default:
          console.warn('⚠️ Colaboração: Tipo de mensagem desconhecido', message.type);
      }
    } catch (error) {
      console.error('❌ Colaboração: Erro ao processar mensagem', error);
    }
  }

  private handleEventMessage(message: EventMessage): void {
    const event = message.payload;
    
    // Não processar eventos do próprio usuário
    if (event.userId === this.currentUser?.id) {
      return;
    }
    
    // Atualizar estado local baseado no evento
    this.updateLocalState(event);
    
    // Notificar listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ Colaboração: Erro no listener de evento', error);
      }
    });
  }

  private handlePresenceMessage(message: PresenceMessage): void {
    const presence = message.payload;
    this.userPresence.set(presence.userId, presence);
    
    this.presenceListeners.forEach(listener => {
      try {
        listener(new Map(this.userPresence));
      } catch (error) {
        console.error('❌ Colaboração: Erro no listener de presença', error);
      }
    });
  }

  private handleSyncMessage(message: SyncMessage): void {
    // Implementar sincronização completa
    console.log('🔄 Colaboração: Sincronização recebida', message.payload);
  }

  private handleErrorMessage(message: ErrorMessage): void {
    const { code, message: errorMessage, details } = message.payload;
    console.error(`❌ Colaboração: Erro do servidor [${code}]`, errorMessage, details);
    
    // Tratar erros específicos
    switch (code) {
      case 'SESSION_NOT_FOUND':
        this.currentSessionId = null;
        break;
      case 'PERMISSION_DENIED':
        // Notificar sobre falta de permissão
        break;
      case 'CONFLICT_DETECTED':
        // Tratar conflito
        break;
    }
  }

  private handleAckMessage(message: AckMessage): void {
    const { messageId, success, error } = message.payload;
    const callback = this.pendingAcks.get(messageId);
    
    if (callback) {
      callback(success, error);
      this.pendingAcks.delete(messageId);
    }
  }

  private updateLocalState(event: CollaborationEvent): void {
    switch (event.type) {
      case 'user_joined':
        if ('user' in event.payload) {
          this.activeUsers.set(event.payload.user.id, event.payload.user);
        }
        break;
      case 'user_left':
        if ('userId' in event.payload) {
          this.activeUsers.delete(event.payload.userId);
          this.userPresence.delete(event.payload.userId);
        }
        break;
      case 'comment_added':
        if ('comment' in event.payload) {
          this.comments.set(event.payload.comment.id, event.payload.comment);
        }
        break;
      case 'comment_deleted':
        if ('comment' in event.payload) {
          this.comments.delete(event.payload.comment.id);
        }
        break;
      case 'conflict_detected':
        if ('conflictId' in event.payload) {
          // Adicionar conflito à lista de conflitos ativos
        }
        break;
    }
  }

  // ============================================================================
  // Message Sending
  // ============================================================================

  private sendMessage(message: WebSocketMessage): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          const messageId = this.generateMessageId();
          const messageWithId = { ...message, messageId };
          
          this.ws.send(JSON.stringify(messageWithId));
          
          // Aguardar ACK se necessário
          if (message.type === 'event') {
            this.pendingAcks.set(messageId, resolve);
            
            // Timeout para ACK
            setTimeout(() => {
              if (this.pendingAcks.has(messageId)) {
                this.pendingAcks.delete(messageId);
                resolve(false);
              }
            }, 5000);
          } else {
            resolve(true);
          }
        } catch (error) {
          console.error('❌ Colaboração: Erro ao enviar mensagem', error);
          resolve(false);
        }
      } else {
        // Adicionar à fila se não conectado
        this.messageQueue.push(message);
        resolve(false);
      }
    });
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // Public API - Session Management
  // ============================================================================

  async joinSession(sessionId: string, user: CollaborationUser): Promise<void> {
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this.connect();
      }
      
      this.currentSessionId = sessionId;
      this.currentUser = user;
      
      // Atribuir cor se não tiver
      if (!user.color) {
        const usedColors = Array.from(this.activeUsers.values()).map(u => u.color);
        const availableColors = COLLABORATION_COLORS.filter(color => !usedColors.includes(color));
        user.color = availableColors[0] || COLLABORATION_COLORS[0];
      }
      
      const event: CollaborationEvent = {
        id: this.generateMessageId(),
        type: 'user_joined',
        userId: user.id,
        sessionId,
        timestamp: new Date(),
        version: 1,
        payload: { user }
      };
      
      await this.sendMessage({
        type: 'event',
        payload: event,
        timestamp: new Date(),
      });
      
      // Iniciar atualizações de presença
      this.startPresenceUpdates();
      
      console.log('✅ Colaboração: Sessão iniciada', sessionId);
    } catch (error) {
      throw new CollaborationError('Falha ao entrar na sessão', 'JOIN_SESSION_FAILED', error);
    }
  }

  async leaveSession(sessionId: string): Promise<void> {
    try {
      if (this.currentUser && this.currentSessionId) {
        const event: CollaborationEvent = {
          id: this.generateMessageId(),
          type: 'user_left',
          userId: this.currentUser.id,
          sessionId: this.currentSessionId,
          timestamp: new Date(),
          version: 1,
          payload: { userId: this.currentUser.id }
        };
        
        await this.sendMessage({
          type: 'event',
          payload: event,
          timestamp: new Date(),
        });
      }
      
      this.currentSessionId = null;
      this.currentUser = null;
      this.cleanup();
      
      if (this.ws) {
        this.ws.close(1000, 'Session ended');
        this.ws = null;
      }
      
      console.log('👋 Colaboração: Sessão encerrada');
    } catch (error) {
      throw new CollaborationError('Falha ao sair da sessão', 'LEAVE_SESSION_FAILED', error);
    }
  }

  async getActiveUsers(sessionId: string): Promise<CollaborationUser[]> {
    return Array.from(this.activeUsers.values());
  }

  // ============================================================================
  // Public API - Event Broadcasting
  // ============================================================================

  async broadcastEvent(event: CollaborationEvent): Promise<void> {
    try {
      await this.sendMessage({
        type: 'event',
        payload: event,
        timestamp: new Date(),
      });
    } catch (error) {
      throw new CollaborationError('Falha ao transmitir evento', 'BROADCAST_FAILED', error);
    }
  }

  subscribeToEvents(callback: (event: CollaborationEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  // ============================================================================
  // Public API - Presence Management
  // ============================================================================

  async updatePresence(presence: UserPresence): Promise<void> {
    try {
      this.lastPresenceUpdate = presence;
      
      await this.sendMessage({
        type: 'presence',
        payload: presence,
        timestamp: new Date(),
      });
    } catch (error) {
      console.warn('⚠️ Colaboração: Falha ao atualizar presença', error);
    }
  }

  subscribeToPresence(callback: (users: Map<string, UserPresence>) => void): () => void {
    this.presenceListeners.add(callback);
    return () => this.presenceListeners.delete(callback);
  }

  private startPresenceUpdates(): void {
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer);
    }
    
    this.presenceTimer = setInterval(() => {
      if (this.lastPresenceUpdate) {
        this.updatePresence({
          ...this.lastPresenceUpdate,
          lastActivity: new Date(),
        });
      }
    }, this.config.presenceUpdateInterval);
  }

  // ============================================================================
  // Public API - Comments
  // ============================================================================

  async addComment(comment: Omit<DiagramComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiagramComment> {
    const newComment: DiagramComment = {
      ...comment,
      id: this.generateMessageId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const event: CollaborationEvent = {
      id: this.generateMessageId(),
      type: 'comment_added',
      userId: this.currentUser?.id || '',
      sessionId: this.currentSessionId || '',
      timestamp: new Date(),
      version: 1,
      payload: { comment: newComment }
    };
    
    await this.broadcastEvent(event);
    this.comments.set(newComment.id, newComment);
    
    return newComment;
  }

  async updateComment(commentId: string, updates: Partial<DiagramComment>): Promise<DiagramComment> {
    const existingComment = this.comments.get(commentId);
    if (!existingComment) {
      throw new CollaborationError('Comentário não encontrado', 'COMMENT_NOT_FOUND');
    }
    
    const updatedComment: DiagramComment = {
      ...existingComment,
      ...updates,
      updatedAt: new Date(),
    };
    
    const event: CollaborationEvent = {
      id: this.generateMessageId(),
      type: 'comment_updated',
      userId: this.currentUser?.id || '',
      sessionId: this.currentSessionId || '',
      timestamp: new Date(),
      version: 1,
      payload: {
        comment: updatedComment,
        previousComment: existingComment
      }
    };
    
    await this.broadcastEvent(event);
    this.comments.set(commentId, updatedComment);
    
    return updatedComment;
  }

  async deleteComment(commentId: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new CollaborationError('Comentário não encontrado', 'COMMENT_NOT_FOUND');
    }
    
    const event: CollaborationEvent = {
      id: this.generateMessageId(),
      type: 'comment_deleted',
      userId: this.currentUser?.id || '',
      sessionId: this.currentSessionId || '',
      timestamp: new Date(),
      version: 1,
      payload: { comment }
    };
    
    await this.broadcastEvent(event);
    this.comments.delete(commentId);
  }

  async getComments(diagramId: string): Promise<DiagramComment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.diagramId === diagramId);
  }

  // ============================================================================
  // Public API - Conflict Resolution
  // ============================================================================

  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void> {
    const event: CollaborationEvent = {
      id: this.generateMessageId(),
      type: 'conflict_resolved',
      userId: this.currentUser?.id || '',
      sessionId: this.currentSessionId || '',
      timestamp: new Date(),
      version: 1,
      payload: {
        conflictId,
        conflictType: 'node', // Será determinado dinamicamente
        conflictData: {
          localVersion: null,
          remoteVersion: null,
          resolvedVersion: resolution.resolvedData
        }
      }
    };
    
    await this.broadcastEvent(event);
    this.activeConflicts.delete(conflictId);
  }

  async getActiveConflicts(sessionId: string): Promise<MergeConflict[]> {
    return Array.from(this.activeConflicts.values());
  }

  // ============================================================================
  // Public API - Synchronization
  // ============================================================================

  async syncDiagram(diagramId: string): Promise<{ nodes: Node[]; edges: Edge[]; version: number }> {
    // Implementar sincronização completa
    // Por enquanto, retornar dados vazios
    return {
      nodes: [],
      edges: [],
      version: 1
    };
  }

  async requestFullSync(sessionId: string): Promise<void> {
    await this.sendMessage({
      type: 'sync',
      payload: {
        action: 'request_full_sync',
        sessionId
      },
      timestamp: new Date(),
    });
  }

  // ============================================================================
  // Connection Status
  // ============================================================================

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('❌ Colaboração: Erro no listener de conexão', error);
      }
    });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Service destroyed');
      this.ws = null;
    }
    
    this.eventListeners.clear();
    this.presenceListeners.clear();
    this.connectionListeners.clear();
    this.activeUsers.clear();
    this.userPresence.clear();
    this.comments.clear();
    this.activeConflicts.clear();
    this.pendingAcks.clear();
    this.messageQueue.length = 0;
    
    console.log('🧹 Colaboração: Serviço destruído');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const collaborationService = new CollaborationService();
export default collaborationService;