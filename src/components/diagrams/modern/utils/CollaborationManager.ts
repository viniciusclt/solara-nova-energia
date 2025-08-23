import { Node, Edge } from 'reactflow';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  isActive: boolean;
  lastSeen: Date;
}

export interface CollaborationEvent {
  id: string;
  type: 'node_update' | 'edge_update' | 'cursor_move' | 'user_join' | 'user_leave' | 'selection_change';
  userId: string;
  timestamp: Date;
  data: any;
}

export interface CollaborationState {
  users: CollaborationUser[];
  events: CollaborationEvent[];
  isConnected: boolean;
  roomId: string;
}

export class CollaborationManager {
  private static instance: CollaborationManager;
  private state: CollaborationState;
  private eventListeners: Map<string, Function[]> = new Map();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {
    this.state = {
      users: [],
      events: [],
      isConnected: false,
      roomId: ''
    };
  }

  static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager();
    }
    return CollaborationManager.instance;
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Connection management
  async connect(roomId: string, user: Omit<CollaborationUser, 'isActive' | 'lastSeen'>): Promise<void> {
    this.state.roomId = roomId;
    
    // For now, we'll simulate collaboration without a real WebSocket
    // In a real implementation, you would connect to a WebSocket server
    this.simulateConnection(user);
  }

  private simulateConnection(user: Omit<CollaborationUser, 'isActive' | 'lastSeen'>): void {
    // Simulate adding the current user
    const currentUser: CollaborationUser = {
      ...user,
      isActive: true,
      lastSeen: new Date()
    };
    
    this.state.users = [currentUser];
    this.state.isConnected = true;
    
    this.emit('connected', { user: currentUser });
    this.emit('user_joined', { user: currentUser });
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.state.isConnected = false;
    this.state.users = [];
    this.emit('disconnected', {});
  }

  // User management
  getCurrentUser(): CollaborationUser | null {
    return this.state.users.find(user => user.isActive) || null;
  }

  getUsers(): CollaborationUser[] {
    return [...this.state.users];
  }

  updateUserCursor(userId: string, position: { x: number; y: number }): void {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      user.cursor = position;
      user.lastSeen = new Date();
      this.emit('cursor_updated', { userId, position });
    }
  }

  // Collaboration events
  broadcastNodeUpdate(node: Node): void {
    const event: CollaborationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'node_update',
      userId: this.getCurrentUser()?.id || 'unknown',
      timestamp: new Date(),
      data: { node }
    };
    
    this.addEvent(event);
    this.emit('node_updated', event);
  }

  broadcastEdgeUpdate(edge: Edge): void {
    const event: CollaborationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'edge_update',
      userId: this.getCurrentUser()?.id || 'unknown',
      timestamp: new Date(),
      data: { edge }
    };
    
    this.addEvent(event);
    this.emit('edge_updated', event);
  }

  broadcastSelectionChange(selectedNodes: string[], selectedEdges: string[]): void {
    const event: CollaborationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'selection_change',
      userId: this.getCurrentUser()?.id || 'unknown',
      timestamp: new Date(),
      data: { selectedNodes, selectedEdges }
    };
    
    this.addEvent(event);
    this.emit('selection_changed', event);
  }

  private addEvent(event: CollaborationEvent): void {
    this.state.events.push(event);
    
    // Keep only the last 100 events
    if (this.state.events.length > 100) {
      this.state.events = this.state.events.slice(-100);
    }
  }

  // State getters
  isConnected(): boolean {
    return this.state.isConnected;
  }

  getRoomId(): string {
    return this.state.roomId;
  }

  getEvents(): CollaborationEvent[] {
    return [...this.state.events];
  }

  // Utility methods
  generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Conflict resolution
  resolveConflict(localData: any, remoteData: any): any {
    // Simple last-write-wins strategy
    // In a real implementation, you might want more sophisticated conflict resolution
    return remoteData.timestamp > localData.timestamp ? remoteData : localData;
  }

  // Presence indicators
  showUserPresence(userId: string, element: HTMLElement): void {
    const user = this.state.users.find(u => u.id === userId);
    if (!user || !user.cursor) return;

    // Create or update presence indicator
    let indicator = document.getElementById(`presence-${userId}`);
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = `presence-${userId}`;
      indicator.className = 'collaboration-cursor';
      indicator.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${user.color};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        pointer-events: none;
        z-index: 1000;
        transition: all 0.1s ease;
      `;
      document.body.appendChild(indicator);
    }

    indicator.style.left = `${user.cursor.x}px`;
    indicator.style.top = `${user.cursor.y}px`;
  }

  hideUserPresence(userId: string): void {
    const indicator = document.getElementById(`presence-${userId}`);
    if (indicator) {
      indicator.remove();
    }
  }
}

export const collaborationManager = CollaborationManager.getInstance();