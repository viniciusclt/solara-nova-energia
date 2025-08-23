export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    nodeId?: string;
  };
}

export interface DiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, unknown>;
}

export interface DiagramChange {
  id: string;
  type: 'node-add' | 'node-update' | 'node-delete' | 'edge-add' | 'edge-update' | 'edge-delete';
  nodeId?: string;
  edgeId?: string;
  data: unknown;
  timestamp: number;
  userId: string;
}

export interface Conflict {
  id: string;
  type: 'concurrent-edit' | 'version-mismatch';
  nodeId?: string;
  edgeId?: string;
  changes: DiagramChange[];
  users: string[];
  timestamp: number;
}

export interface CollaborationState {
  isConnected: boolean;
  users: Map<string, CollaborationUser>;
  changes: DiagramChange[];
  conflicts: Conflict[];
}

export interface CollaborationConfig {
  roomId: string;
  userId: string;
  userName: string;
  websocketUrl: string;
  autoResolveConflicts: boolean;
  maxUsers: number;
}
