// ============================================================================
// RealtimeCollaboration Service - Serviço de colaboração em tempo real
// ============================================================================

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogger';
import type { DiagramNode, DiagramEdge } from '@/components/diagrams/types';
import type { CollaborationUser } from './types';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface DiagramChange {
  id: string;
  type: 'node_add' | 'node_update' | 'node_delete' | 'edge_add' | 'edge_update' | 'edge_delete';
  userId: string;
  timestamp: Date;
  data: {
    nodeId?: string;
    edgeId?: string;
    node?: DiagramNode;
    edge?: DiagramEdge;
    changes?: Record<string, unknown>;
    position?: { x: number; y: number };
  };
  version: number;
}

export interface Conflict {
  id: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'permission_denied';
  changeId: string;
  userId: string;
  conflictingUserId: string;
  timestamp: Date;
  resolution?: 'accept' | 'reject' | 'merge';
  data: {
    localChange: DiagramChange;
    remoteChange: DiagramChange;
  };
}

// CollaborationUser agora é importado de types.ts

export interface CollaborationState {
  users: Map<string, CollaborationUser>;
  changes: DiagramChange[];
  conflicts: Conflict[];
  version: number;
  lastSync: Date;
}

export interface CollaborationConfig {
  diagramId: string;
  userId: string;
  autoResolveConflicts: boolean;
  syncInterval: number;
  maxHistorySize: number;
  enableCursorBroadcast: boolean;
  enablePresence: boolean;
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class RealtimeCollaboration {
  private channel: RealtimeChannel | null = null;
  private config: CollaborationConfig;
  private state: CollaborationState;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private operationQueue: DiagramChange[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: CollaborationConfig) {
    this.config = config;
    this.state = {
      users: new Map(),
      changes: [],
      conflicts: [],
      version: 0,
      lastSync: new Date()
    };
    
    this.initializeEventListeners();
  }

  // ============================================================================
  // CONEXÃO E CONFIGURAÇÃO
  // ============================================================================

  async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        secureLogger.warn('Já conectado à colaboração', { diagramId: this.config.diagramId });
        return;
      }

      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Criar canal do Supabase Realtime
      this.channel = supabase.channel(`diagram:${this.config.diagramId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id }
        }
      });

      // Configurar handlers
      this.setupChannelHandlers();

      // Subscrever ao canal
      await new Promise<void>((resolve, reject) => {
        this.channel!.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Enviar presença inicial
            if (this.config.enablePresence) {
              await this.broadcastPresence();
            }
            
            secureLogger.info('Conectado à colaboração', { 
              diagramId: this.config.diagramId,
              userId: this.config.userId 
            });
            
            this.emit('connected');
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error('Erro ao conectar ao canal'));
          }
        });
      });

    } catch (error) {
      secureLogger.error('Erro ao conectar colaboração', error);
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    
    this.isConnected = false;
    this.state.users.clear();
    
    secureLogger.info('Desconectado da colaboração', { 
      diagramId: this.config.diagramId 
    });
    
    this.emit('disconnected');
  }

  // ============================================================================
  // SINCRONIZAÇÃO DE MUDANÇAS
  // ============================================================================

  syncDiagramChanges(diagramId: string, changes: DiagramChange[]): void {
    if (!this.isConnected || !this.channel) {
      // Adicionar à fila para sincronização posterior
      this.operationQueue.push(...changes);
      return;
    }

    try {
      // Processar cada mudança
      changes.forEach(change => {
        // Validar mudança
        if (!this.validateChange(change)) {
          secureLogger.warn('Mudança inválida ignorada', { change });
          return;
        }

        // Adicionar ao histórico local
        this.addChangeToHistory(change);

        // Broadcast para outros usuários
        this.channel!.send({
          type: 'broadcast',
          event: 'diagram_change',
          payload: {
            ...change,
            diagramId,
            version: this.state.version
          }
        });
      });

      this.state.lastSync = new Date();
      this.emit('changes_synced', changes);
      
    } catch (error) {
      secureLogger.error('Erro ao sincronizar mudanças', error);
      this.emit('sync_error', error);
    }
  }

  // ============================================================================
  // RESOLUÇÃO DE CONFLITOS
  // ============================================================================

  handleConflictResolution(conflicts: Conflict[]): void {
    conflicts.forEach(conflict => {
      try {
        switch (conflict.resolution) {
          case 'accept':
            this.acceptRemoteChange(conflict);
            break;
          case 'reject':
            this.rejectRemoteChange(conflict);
            break;
          case 'merge':
            this.mergeChanges(conflict);
            break;
          default:
            if (this.config.autoResolveConflicts) {
              this.autoResolveConflict(conflict);
            }
        }
        
        // Remover conflito resolvido
        this.removeConflict(conflict.id);
        
      } catch (error) {
        secureLogger.error('Erro ao resolver conflito', { conflict, error });
      }
    });
  }

  private autoResolveConflict(conflict: Conflict): void {
    // Estratégia simples: último timestamp vence
    const localTime = conflict.data.localChange.timestamp.getTime();
    const remoteTime = conflict.data.remoteChange.timestamp.getTime();
    
    if (remoteTime > localTime) {
      this.acceptRemoteChange(conflict);
    } else {
      this.rejectRemoteChange(conflict);
    }
    
    secureLogger.info('Conflito resolvido automaticamente', { 
      conflictId: conflict.id,
      resolution: remoteTime > localTime ? 'accept' : 'reject'
    });
  }

  private acceptRemoteChange(conflict: Conflict): void {
    const remoteChange = conflict.data.remoteChange;
    this.applyChange(remoteChange);
    this.emit('conflict_resolved', { conflict, resolution: 'accept' });
  }

  private rejectRemoteChange(conflict: Conflict): void {
    // Manter mudança local, ignorar remota
    this.emit('conflict_resolved', { conflict, resolution: 'reject' });
  }

  private mergeChanges(conflict: Conflict): void {
    const { localChange, remoteChange } = conflict.data;
    
    // Estratégia de merge simples para propriedades de nó
    if (localChange.type === 'node_update' && remoteChange.type === 'node_update') {
      const mergedChanges = {
        ...localChange.data.changes,
        ...remoteChange.data.changes
      };
      
      const mergedChange: DiagramChange = {
        ...remoteChange,
        data: {
          ...remoteChange.data,
          changes: mergedChanges
        }
      };
      
      this.applyChange(mergedChange);
    }
    
    this.emit('conflict_resolved', { conflict, resolution: 'merge' });
  }

  // ============================================================================
  // BROADCAST DE CURSOR
  // ============================================================================

  broadcastCursorPosition(position: { x: number; y: number; nodeId?: string }): void {
    if (!this.isConnected || !this.channel || !this.config.enableCursorBroadcast) {
      return;
    }

    this.channel.send({
      type: 'broadcast',
      event: 'cursor_position',
      payload: {
        userId: this.config.userId,
        position,
        timestamp: new Date().toISOString()
      }
    });
  }

  // ============================================================================
  // GERENCIAMENTO DE PRESENÇA
  // ============================================================================

  private async broadcastPresence(): Promise<void> {
    if (!this.channel) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const presence: CollaborationUser = {
      id: user.id,
      name: user.user_metadata?.name || user.email || 'Usuário',
      email: user.email || '',
      role: 'editor', // Será determinado pela permissão real
      status: 'online',
      lastSeen: new Date()
    };

    await this.channel.track(presence);
  }

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================

  private setupChannelHandlers(): void {
    if (!this.channel) return;

    // Handler para mudanças de diagrama
    this.channel.on('broadcast', { event: 'diagram_change' }, ({ payload }) => {
      this.handleRemoteChange(payload as DiagramChange & { diagramId: string; version: number });
    });

    // Handler para posição do cursor
    this.channel.on('broadcast', { event: 'cursor_position' }, ({ payload }) => {
      this.handleRemoteCursor(payload);
    });

    // Handler para presença
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel!.presenceState();
      this.updateUserPresence(state);
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      secureLogger.info('Usuário entrou', { userId: key, presences: newPresences });
      this.emit('user_joined', { userId: key, presences: newPresences });
    });

    this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      secureLogger.info('Usuário saiu', { userId: key, presences: leftPresences });
      this.emit('user_left', { userId: key, presences: leftPresences });
    });
  }

  private handleRemoteChange(payload: DiagramChange & { diagramId: string; version: number }): void {
    // Ignorar mudanças próprias
    if (payload.userId === this.config.userId) {
      return;
    }

    try {
      // Verificar versão para detectar conflitos
      if (payload.version < this.state.version) {
        this.handleVersionConflict(payload);
        return;
      }

      // Aplicar mudança
      this.applyChange(payload);
      this.addChangeToHistory(payload);
      
      this.emit('remote_change', payload);
      
    } catch (error) {
      secureLogger.error('Erro ao processar mudança remota', { payload, error });
    }
  }

  private handleRemoteCursor(payload: { userId: string; position: { x: number; y: number; nodeId?: string }; timestamp: string }): void {
    if (payload.userId === this.config.userId) return;

    // Atualizar cursor do usuário
    const user = this.state.users.get(payload.userId);
    if (user) {
      user.cursor = payload.position;
      this.state.users.set(payload.userId, user);
    }

    this.emit('cursor_update', payload);
  }

  private updateUserPresence(presenceState: Record<string, any>): void {
    const users = new Map<string, CollaborationUser>();
    
    Object.entries(presenceState).forEach(([userId, presences]) => {
      const presence = Array.isArray(presences) ? presences[0] : presences;
      if (presence) {
        users.set(userId, presence as CollaborationUser);
      }
    });
    
    this.state.users = users;
    this.emit('presence_update', Array.from(users.values()));
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  private validateChange(change: DiagramChange): boolean {
    // Validações básicas
    if (!change.id || !change.type || !change.userId) {
      return false;
    }

    // Validar dados específicos do tipo
    switch (change.type) {
      case 'node_add':
        return !!change.data.node;
      case 'node_update':
        return !!change.data.nodeId && !!change.data.changes;
      case 'node_delete':
        return !!change.data.nodeId;
      case 'edge_add':
        return !!change.data.edge;
      case 'edge_update':
        return !!change.data.edgeId && !!change.data.changes;
      case 'edge_delete':
        return !!change.data.edgeId;
      default:
        return false;
    }
  }

  private applyChange(change: DiagramChange): void {
    this.emit('apply_change', change);
  }

  private addChangeToHistory(change: DiagramChange): void {
    this.state.changes.push(change);
    this.state.version++;
    
    // Limitar tamanho do histórico
    if (this.state.changes.length > this.config.maxHistorySize) {
      this.state.changes = this.state.changes.slice(-this.config.maxHistorySize);
    }
  }

  private handleVersionConflict(remoteChange: DiagramChange): void {
    // Encontrar mudança local conflitante
    const localChange = this.state.changes.find(change => 
      change.type === remoteChange.type &&
      (change.data.nodeId === remoteChange.data.nodeId || 
       change.data.edgeId === remoteChange.data.edgeId)
    );

    if (localChange) {
      const conflict: Conflict = {
        id: crypto.randomUUID(),
        type: 'version_mismatch',
        changeId: remoteChange.id,
        userId: this.config.userId,
        conflictingUserId: remoteChange.userId,
        timestamp: new Date(),
        data: {
          localChange,
          remoteChange
        }
      };

      this.state.conflicts.push(conflict);
      this.emit('conflict_detected', conflict);
    }
  }

  private removeConflict(conflictId: string): void {
    this.state.conflicts = this.state.conflicts.filter(c => c.id !== conflictId);
  }

  private handleConnectionError(error: Error): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      secureLogger.info('Tentando reconectar', { 
        attempt: this.reconnectAttempts,
        delay 
      });
      
      setTimeout(() => {
        this.connect().catch(err => {
          secureLogger.error('Falha na reconexão', err);
        });
      }, delay);
    } else {
      secureLogger.error('Máximo de tentativas de reconexão atingido', error);
      this.emit('connection_failed', error);
    }
  }

  // ============================================================================
  // SISTEMA DE EVENTOS
  // ============================================================================

  private initializeEventListeners(): void {
    this.eventListeners.set('connected', new Set());
    this.eventListeners.set('disconnected', new Set());
    this.eventListeners.set('changes_synced', new Set());
    this.eventListeners.set('sync_error', new Set());
    this.eventListeners.set('remote_change', new Set());
    this.eventListeners.set('cursor_update', new Set());
    this.eventListeners.set('presence_update', new Set());
    this.eventListeners.set('user_joined', new Set());
    this.eventListeners.set('user_left', new Set());
    this.eventListeners.set('conflict_detected', new Set());
    this.eventListeners.set('conflict_resolved', new Set());
    this.eventListeners.set('apply_change', new Set());
    this.eventListeners.set('connection_failed', new Set());
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          secureLogger.error('Erro no listener de evento', { event, error });
        }
      });
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get isConnectedToCollaboration(): boolean {
    return this.isConnected;
  }

  get collaborationState(): CollaborationState {
    return { ...this.state };
  }

  get activeUsers(): CollaborationUser[] {
    return Array.from(this.state.users.values()).filter(user => user.status === 'online');
  }

  get pendingConflicts(): Conflict[] {
    return this.state.conflicts.filter(conflict => !conflict.resolution);
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
    this.operationQueue = [];
    this.state.changes = [];
    this.state.conflicts = [];
    this.state.users.clear();
  }
}