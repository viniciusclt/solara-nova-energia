// ============================================================================
// useCollaboration Hook - Gerenciamento de colaboração em tempo real
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { secureLogger } from '@/utils/secureLogger';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeCollaboration } from '@/services/collaboration/RealtimeCollaboration';
import type { CollaborationConfig, DiagramChange, Conflict, CollaborationUser } from '../services/collaboration';
import type { DiagramNode, DiagramEdge } from '@/components/diagrams/types';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface UseCollaborationOptions {
  diagramId: string;
  autoResolveConflicts?: boolean;
  enableCursorBroadcast?: boolean;
  enablePresence?: boolean;
  syncInterval?: number;
  maxHistorySize?: number;
}

export interface CollaborationState {
  isConnected: boolean;
  users: CollaborationUser[];
  changes: DiagramChange[];
  conflicts: Conflict[];
  currentUser?: CollaborationUser;
  diagramId?: string;
  version: number;
  lastSync: Date;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useCollaboration(options: UseCollaborationOptions) {
  const { user } = useAuth();
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    users: [],
    changes: [],
    conflicts: [],
    version: 0,
    lastSync: new Date()
  });
  
  const collaborationRef = useRef<RealtimeCollaboration | null>(null);

  // ============================================================================
  // INICIALIZAÇÃO E CONFIGURAÇÃO
  // ============================================================================

  const initializeCollaboration = useCallback(() => {
    if (!user || collaborationRef.current) return;

    const config: CollaborationConfig = {
      diagramId: options.diagramId,
      userId: user.id,
      autoResolveConflicts: options.autoResolveConflicts ?? true,
      syncInterval: options.syncInterval ?? 1000,
      maxHistorySize: options.maxHistorySize ?? 100,
      enableCursorBroadcast: options.enableCursorBroadcast ?? true,
      enablePresence: options.enablePresence ?? true
    };

    const collaboration = new RealtimeCollaboration(config);
    
    // Configurar event listeners
    collaboration.on('connected', () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        diagramId: options.diagramId,
        currentUser: {
          id: user.id,
          name: user.user_metadata?.name || user.email || 'Usuário',
          email: user.email || '',
          role: 'editor',
          status: 'online',
          lastSeen: new Date()
        }
      }));
      
      toast.success('Conectado à colaboração');
      secureLogger.info('Colaboração conectada', { diagramId: options.diagramId });
    });

    collaboration.on('disconnected', () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        users: []
      }));
      
      toast.info('Desconectado da colaboração');
    });

    collaboration.on('changes_synced', (changes: DiagramChange[]) => {
      setState(prev => ({
        ...prev,
        changes: [...prev.changes, ...changes],
        lastSync: new Date()
      }));
    });

    collaboration.on('remote_change', (change: DiagramChange) => {
      setState(prev => ({
        ...prev,
        changes: [...prev.changes, change]
      }));
    });

    collaboration.on('presence_update', (users: CollaborationUser[]) => {
      setState(prev => ({ ...prev, users }));
    });

    collaboration.on('user_joined', ({ userId, presences }) => {
      const userName = presences[0]?.name || 'Usuário';
      toast.success(`${userName} entrou na colaboração`);
    });

    collaboration.on('user_left', ({ userId, presences }) => {
      const userName = presences[0]?.name || 'Usuário';
      toast.info(`${userName} saiu da colaboração`);
    });

    collaboration.on('conflict_detected', (conflict: Conflict) => {
      setState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, conflict]
      }));
      
      toast.warning('Conflito detectado na colaboração');
    });

    collaboration.on('conflict_resolved', ({ conflict, resolution }) => {
      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflict.id)
      }));
      
      toast.success(`Conflito resolvido: ${resolution}`);
    });

    collaboration.on('sync_error', (error: Error) => {
      secureLogger.error('Erro de sincronização', error);
      toast.error('Erro na sincronização da colaboração');
    });

    collaboration.on('connection_failed', (error: Error) => {
      secureLogger.error('Falha na conexão da colaboração', error);
      toast.error('Falha na conexão da colaboração');
    });

    collaborationRef.current = collaboration;
  }, [user, options]);

  // ============================================================================
  // CONEXÃO E DESCONEXÃO
  // ============================================================================

  const connect = useCallback(async () => {
    if (!collaborationRef.current) {
      initializeCollaboration();
    }
    
    if (collaborationRef.current && !collaborationRef.current.isConnectedToCollaboration) {
      try {
        await collaborationRef.current.connect();
      } catch (error) {
        secureLogger.error('Erro ao conectar colaboração', error);
        toast.error('Erro ao conectar à colaboração');
        throw error;
      }
    }
  }, [initializeCollaboration]);

  const disconnect = useCallback(() => {
    if (collaborationRef.current) {
      collaborationRef.current.disconnect();
    }
  }, []);

  // ============================================================================
  // OPERAÇÕES DE DIAGRAMA
  // ============================================================================

  const syncDiagramChanges = useCallback((changes: DiagramChange[]) => {
    if (collaborationRef.current) {
      collaborationRef.current.syncDiagramChanges(options.diagramId, changes);
    }
  }, [options.diagramId]);

  const broadcastCursor = useCallback((position: { x: number; y: number; nodeId?: string }) => {
    if (collaborationRef.current) {
      collaborationRef.current.broadcastCursorPosition(position);
    }
  }, []);

  // ============================================================================
  // RESOLUÇÃO DE CONFLITOS
  // ============================================================================

  const resolveConflict = useCallback((conflictId: string, resolution: 'accept' | 'reject' | 'merge') => {
    if (!collaborationRef.current) return;

    const conflict = state.conflicts.find(c => c.id === conflictId);
    if (conflict) {
      const resolvedConflict = { ...conflict, resolution };
      collaborationRef.current.handleConflictResolution([resolvedConflict]);
    }
  }, [state.conflicts]);

  const resolveAllConflicts = useCallback((resolution: 'accept' | 'reject' | 'merge') => {
    if (!collaborationRef.current) return;

    const resolvedConflicts = state.conflicts.map(conflict => ({
      ...conflict,
      resolution
    }));
    
    collaborationRef.current.handleConflictResolution(resolvedConflicts);
  }, [state.conflicts]);

  // ============================================================================
  // GERENCIAMENTO DE USUÁRIOS
  // ============================================================================

  const inviteUser = useCallback(async (email: string, role: 'editor' | 'viewer' = 'viewer') => {
    try {
      const { error } = await supabase
        .from('diagram_collaborators')
        .insert({
          diagram_id: options.diagramId,
          user_email: email,
          role,
          invited_by: user?.id,
          invited_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`Convite enviado para ${email}`);
      secureLogger.info('Usuário convidado', { email, role });
    } catch (error) {
      secureLogger.error('Erro ao convidar usuário', error);
      toast.error('Erro ao enviar convite');
      throw error;
    }
  }, [options.diagramId, user?.id]);

  const removeUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('diagram_collaborators')
        .delete()
        .eq('diagram_id', options.diagramId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Usuário removido da colaboração');
      secureLogger.info('Usuário removido', { userId });
    } catch (error) {
      secureLogger.error('Erro ao remover usuário', error);
      toast.error('Erro ao remover usuário');
      throw error;
    }
  }, [options.diagramId]);

  const updateUserRole = useCallback(async (userId: string, role: 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('diagram_collaborators')
        .update({ role })
        .eq('diagram_id', options.diagramId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Papel do usuário atualizado');
      secureLogger.info('Papel do usuário atualizado', { userId, role });
    } catch (error) {
      secureLogger.error('Erro ao atualizar papel do usuário', error);
      toast.error('Erro ao atualizar papel do usuário');
      throw error;
    }
  }, [options.diagramId]);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  useEffect(() => {
    if (options.diagramId && user) {
      initializeCollaboration();
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [options.diagramId, user, initializeCollaboration, connect, disconnect]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (collaborationRef.current) {
        collaborationRef.current.destroy();
        collaborationRef.current = null;
      }
    };
  }, []);

  // Atualizar estado com dados do serviço
  useEffect(() => {
    if (collaborationRef.current) {
      const collaborationState = collaborationRef.current.collaborationState;
      setState(prev => ({
        ...prev,
        version: collaborationState.version,
        lastSync: collaborationState.lastSync
      }));
    }
  }, [state.changes.length]); // Trigger quando mudanças são adicionadas

  return {
    // Estado
    ...state,
    
    // Ações
    connect,
    disconnect,
    syncDiagramChanges,
    broadcastCursor,
    resolveConflict,
    resolveAllConflicts,
    
    // Gerenciamento de usuários
    inviteUser,
    removeUser,
    updateUserRole,
    
    // Utilitários
    isOwner: state.currentUser?.role === 'owner',
    canEdit: state.currentUser?.role === 'owner' || state.currentUser?.role === 'editor',
    activeUsers: state.users.filter(u => u.status === 'online'),
    pendingConflicts: state.conflicts.filter(c => !c.resolution),
    
    // Instância do serviço (para casos avançados)
    collaborationService: collaborationRef.current
  };
}

// ============================================================================
// HOOKS AUXILIARES
// ============================================================================

/**
 * Hook para operações colaborativas de nós e arestas
 */
export function useCollaborationOperations(diagramId: string) {
  const collaboration = useCollaboration({ diagramId });
  
  const addNodeCollaboratively = useCallback((node: DiagramNode) => {
    const change: DiagramChange = {
      id: crypto.randomUUID(),
      type: 'node_add',
      userId: collaboration.currentUser?.id || '',
      timestamp: new Date(),
      data: { node },
      version: collaboration.version + 1
    };
    
    collaboration.syncDiagramChanges([change]);
  }, [collaboration]);
  
  const updateNodeCollaboratively = useCallback((nodeId: string, changes: Partial<DiagramNode>) => {
    const change: DiagramChange = {
      id: crypto.randomUUID(),
      type: 'node_update',
      userId: collaboration.currentUser?.id || '',
      timestamp: new Date(),
      data: { nodeId, changes },
      version: collaboration.version + 1
    };
    
    collaboration.syncDiagramChanges([change]);
  }, [collaboration]);
  
  const deleteNodeCollaboratively = useCallback((nodeId: string) => {
    const change: DiagramChange = {
      id: crypto.randomUUID(),
      type: 'node_delete',
      userId: collaboration.currentUser?.id || '',
      timestamp: new Date(),
      data: { nodeId },
      version: collaboration.version + 1
    };
    
    collaboration.syncDiagramChanges([change]);
  }, [collaboration]);
  
  const addEdgeCollaboratively = useCallback((edge: DiagramEdge) => {
    const change: DiagramChange = {
      id: crypto.randomUUID(),
      type: 'edge_add',
      userId: collaboration.currentUser?.id || '',
      timestamp: new Date(),
      data: { edge },
      version: collaboration.version + 1
    };
    
    collaboration.syncDiagramChanges([change]);
  }, [collaboration]);
  
  const updateEdgeCollaboratively = useCallback((edgeId: string, changes: Partial<DiagramEdge>) => {
    const change: DiagramChange = {
      id: crypto.randomUUID(),
      type: 'edge_update',
      userId: collaboration.currentUser?.id || '',
      timestamp: new Date(),
      data: { edgeId, changes },
      version: collaboration.version + 1
    };
    
    collaboration.syncDiagramChanges([change]);
  }, [collaboration]);
  
  const deleteEdgeCollaboratively = useCallback((edgeId: string) => {
    const change: DiagramChange = {
      id: crypto.randomUUID(),
      type: 'edge_delete',
      userId: collaboration.currentUser?.id || '',
      timestamp: new Date(),
      data: { edgeId },
      version: collaboration.version + 1
    };
    
    collaboration.syncDiagramChanges([change]);
  }, [collaboration]);
  
  return {
    ...collaboration,
    addNodeCollaboratively,
    updateNodeCollaboratively,
    deleteNodeCollaboratively,
    addEdgeCollaboratively,
    updateEdgeCollaboratively,
    deleteEdgeCollaboratively
  };
}

/**
 * Hook para indicadores visuais de colaboração
 */
export function useCollaborationIndicators(diagramId: string) {
  const collaboration = useCollaboration({ diagramId });
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; nodeId?: string }>>(new Map());
  
  useEffect(() => {
    if (!collaboration.collaborationService) return;
    
    const handleCursorUpdate = (payload: { userId: string; position: { x: number; y: number; nodeId?: string } }) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(payload.userId, payload.position);
        return newCursors;
      });
    };
    
    collaboration.collaborationService.on('cursor_update', handleCursorUpdate);
    
    return () => {
      collaboration.collaborationService?.off('cursor_update', handleCursorUpdate);
    };
  }, [collaboration.collaborationService]);
  
  const getUserCursor = useCallback((userId: string) => {
    return cursors.get(userId);
  }, [cursors]);
  
  const getUserColor = useCallback((userId: string) => {
    // Gerar cor consistente baseada no ID do usuário
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, []);
  
  return {
    ...collaboration,
    cursors: Array.from(cursors.entries()).map(([userId, position]) => ({
      userId,
      position,
      user: collaboration.users.find(u => u.id === userId),
      color: getUserColor(userId)
    })),
    getUserCursor,
    getUserColor
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

import type { CollaborationUser, DiagramChange, Conflict } from '../services/collaboration/types';
export type { UseCollaborationOptions, CollaborationState, CollaborationUser, DiagramChange, Conflict };