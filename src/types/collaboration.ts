// ============================================================================
// Collaboration Types - Tipos para colaboração em tempo real
// ============================================================================

import { Node, Edge } from 'reactflow';

// ============================================================================
// User & Session Types
// ============================================================================

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string; // Cor única para identificação visual
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  isOnline: boolean;
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    visible: boolean;
  };
}

export interface CollaborationSession {
  id: string;
  diagramId: string;
  users: CollaborationUser[];
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

// ============================================================================
// Real-time Events
// ============================================================================

export type CollaborationEventType =
  | 'user_joined'
  | 'user_left'
  | 'user_cursor_moved'
  | 'node_added'
  | 'node_updated'
  | 'node_deleted'
  | 'edge_added'
  | 'edge_updated'
  | 'edge_deleted'
  | 'selection_changed'
  | 'viewport_changed'
  | 'comment_added'
  | 'comment_updated'
  | 'comment_deleted'
  | 'diagram_locked'
  | 'diagram_unlocked'
  | 'conflict_detected'
  | 'conflict_resolved';

export interface BaseCollaborationEvent {
  id: string;
  type: CollaborationEventType;
  userId: string;
  sessionId: string;
  timestamp: Date;
  version: number; // Para controle de versão otimista
}

// ============================================================================
// Specific Event Payloads
// ============================================================================

export interface UserJoinedEvent extends BaseCollaborationEvent {
  type: 'user_joined';
  payload: {
    user: CollaborationUser;
  };
}

export interface UserLeftEvent extends BaseCollaborationEvent {
  type: 'user_left';
  payload: {
    userId: string;
  };
}

export interface UserCursorMovedEvent extends BaseCollaborationEvent {
  type: 'user_cursor_moved';
  payload: {
    cursor: {
      x: number;
      y: number;
      visible: boolean;
    };
  };
}

export interface NodeEvent extends BaseCollaborationEvent {
  type: 'node_added' | 'node_updated' | 'node_deleted';
  payload: {
    node: Node;
    previousNode?: Node; // Para updates e deletes
  };
}

export interface EdgeEvent extends BaseCollaborationEvent {
  type: 'edge_added' | 'edge_updated' | 'edge_deleted';
  payload: {
    edge: Edge;
    previousEdge?: Edge; // Para updates e deletes
  };
}

export interface SelectionChangedEvent extends BaseCollaborationEvent {
  type: 'selection_changed';
  payload: {
    selectedNodes: string[];
    selectedEdges: string[];
  };
}

export interface ViewportChangedEvent extends BaseCollaborationEvent {
  type: 'viewport_changed';
  payload: {
    viewport: {
      x: number;
      y: number;
      zoom: number;
    };
  };
}

export interface CommentEvent extends BaseCollaborationEvent {
  type: 'comment_added' | 'comment_updated' | 'comment_deleted';
  payload: {
    comment: DiagramComment;
    previousComment?: DiagramComment; // Para updates e deletes
  };
}

export interface ConflictEvent extends BaseCollaborationEvent {
  type: 'conflict_detected' | 'conflict_resolved';
  payload: {
    conflictId: string;
    conflictType: 'node' | 'edge' | 'selection';
    conflictData: {
      localVersion: any;
      remoteVersion: any;
      resolvedVersion?: any;
    };
  };
}

export type CollaborationEvent =
  | UserJoinedEvent
  | UserLeftEvent
  | UserCursorMovedEvent
  | NodeEvent
  | EdgeEvent
  | SelectionChangedEvent
  | ViewportChangedEvent
  | CommentEvent
  | ConflictEvent;

// ============================================================================
// Comments System
// ============================================================================

export interface DiagramComment {
  id: string;
  diagramId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
  attachedTo?: {
    type: 'node' | 'edge';
    id: string;
  };
  thread: CommentReply[];
  status: 'open' | 'resolved' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================================================
// Conflict Resolution
// ============================================================================

export interface ConflictResolution {
  conflictId: string;
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolvedData: any;
  resolvedBy: string;
  resolvedAt: Date;
}

export interface MergeConflict {
  id: string;
  type: 'node' | 'edge' | 'selection';
  localVersion: any;
  remoteVersion: any;
  baseVersion?: any;
  conflictFields: string[];
  autoResolvable: boolean;
}

// ============================================================================
// Operational Transform
// ============================================================================

export interface Operation {
  id: string;
  type: 'insert' | 'update' | 'delete' | 'move';
  target: {
    type: 'node' | 'edge';
    id: string;
  };
  data: any;
  position?: number; // Para operações de inserção
  userId: string;
  timestamp: Date;
  version: number;
}

export interface TransformResult {
  transformedOperation: Operation;
  conflicts: MergeConflict[];
  requiresManualResolution: boolean;
}

// ============================================================================
// Presence & Awareness
// ============================================================================

export interface UserPresence {
  userId: string;
  cursor: {
    x: number;
    y: number;
    visible: boolean;
  };
  selection: {
    nodes: string[];
    edges: string[];
  };
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  isTyping: boolean;
  typingIn?: string; // ID do elemento onde está digitando
  lastActivity: Date;
}

export interface AwarenessState {
  users: Map<string, UserPresence>;
  comments: DiagramComment[];
  activeConflicts: MergeConflict[];
}

// ============================================================================
// WebSocket Messages
// ============================================================================

export interface WebSocketMessage {
  type: 'event' | 'presence' | 'sync' | 'error' | 'ack';
  payload: any;
  messageId?: string;
  timestamp: Date;
}

export interface SyncMessage extends WebSocketMessage {
  type: 'sync';
  payload: {
    nodes: Node[];
    edges: Edge[];
    version: number;
    lastSyncTime: Date;
  };
}

export interface PresenceMessage extends WebSocketMessage {
  type: 'presence';
  payload: UserPresence;
}

export interface EventMessage extends WebSocketMessage {
  type: 'event';
  payload: CollaborationEvent;
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AckMessage extends WebSocketMessage {
  type: 'ack';
  payload: {
    messageId: string;
    success: boolean;
    error?: string;
  };
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface CollaborationService {
  // Session Management
  joinSession(sessionId: string, user: CollaborationUser): Promise<void>;
  leaveSession(sessionId: string): Promise<void>;
  getActiveUsers(sessionId: string): Promise<CollaborationUser[]>;
  
  // Event Broadcasting
  broadcastEvent(event: CollaborationEvent): Promise<void>;
  subscribeToEvents(callback: (event: CollaborationEvent) => void): () => void;
  
  // Presence Management
  updatePresence(presence: UserPresence): Promise<void>;
  subscribeToPresence(callback: (users: Map<string, UserPresence>) => void): () => void;
  
  // Comments
  addComment(comment: Omit<DiagramComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiagramComment>;
  updateComment(commentId: string, updates: Partial<DiagramComment>): Promise<DiagramComment>;
  deleteComment(commentId: string): Promise<void>;
  getComments(diagramId: string): Promise<DiagramComment[]>;
  
  // Conflict Resolution
  resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>;
  getActiveConflicts(sessionId: string): Promise<MergeConflict[]>;
  
  // Synchronization
  syncDiagram(diagramId: string): Promise<{ nodes: Node[]; edges: Edge[]; version: number }>;
  requestFullSync(sessionId: string): Promise<void>;
}

// ============================================================================
// Configuration
// ============================================================================

export interface CollaborationConfig {
  websocketUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  presenceUpdateInterval: number;
  conflictResolutionTimeout: number;
  maxConcurrentUsers: number;
  enableComments: boolean;
  enablePresence: boolean;
  enableConflictResolution: boolean;
  autoSaveInterval: number;
}

// ============================================================================
// Hooks & Context
// ============================================================================

export interface CollaborationContextValue {
  // State
  isConnected: boolean;
  currentUser: CollaborationUser | null;
  activeUsers: CollaborationUser[];
  session: CollaborationSession | null;
  presence: Map<string, UserPresence>;
  comments: DiagramComment[];
  conflicts: MergeConflict[];
  
  // Actions
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  updatePresence: (presence: Partial<UserPresence>) => void;
  addComment: (comment: Omit<DiagramComment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  
  // Event Handlers
  onUserJoined: (callback: (user: CollaborationUser) => void) => () => void;
  onUserLeft: (callback: (userId: string) => void) => () => void;
  onDiagramChanged: (callback: (event: CollaborationEvent) => void) => () => void;
  onConflictDetected: (callback: (conflict: MergeConflict) => void) => () => void;
}

// ============================================================================
// Error Types
// ============================================================================

export class CollaborationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CollaborationError';
  }
}

export class ConflictError extends CollaborationError {
  constructor(
    message: string,
    public conflict: MergeConflict,
    details?: any
  ) {
    super(message, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

export class ConnectionError extends CollaborationError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type CollaborationEventHandler<T extends CollaborationEvent = CollaborationEvent> = (
  event: T
) => void | Promise<void>;

export type PresenceUpdateHandler = (
  users: Map<string, UserPresence>
) => void;

export type ConflictHandler = (
  conflict: MergeConflict
) => Promise<ConflictResolution | null>;

// ============================================================================
// Constants
// ============================================================================

export const COLLABORATION_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
] as const;

export const DEFAULT_COLLABORATION_CONFIG: CollaborationConfig = {
  websocketUrl: process.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  presenceUpdateInterval: 100,
  conflictResolutionTimeout: 10000,
  maxConcurrentUsers: 10,
  enableComments: true,
  enablePresence: true,
  enableConflictResolution: true,
  autoSaveInterval: 5000,
};