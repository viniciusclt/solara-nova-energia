import { Node, Edge } from 'reactflow';

export interface HistoryAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'connect' | 'style';
  timestamp: Date;
  description: string;
  data: {
    nodeId?: string;
    edgeId?: string;
    oldValue?: any;
    newValue?: any;
    position?: { x: number; y: number };
  };
}

export class HistoryManager {
  private history: HistoryAction[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;

  addAction(action: Omit<HistoryAction, 'id' | 'timestamp'>): void {
    // Remove any actions after current index (when undoing and then making new changes)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    const newAction: HistoryAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    this.history.push(newAction);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  undo(): HistoryAction | null {
    if (!this.canUndo()) return null;
    
    const action = this.history[this.currentIndex];
    this.currentIndex--;
    return action;
  }

  redo(): HistoryAction | null {
    if (!this.canRedo()) return null;
    
    this.currentIndex++;
    const action = this.history[this.currentIndex];
    return action;
  }

  getHistory(): HistoryAction[] {
    return [...this.history];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // Helper methods for common actions
  recordNodeCreation(nodeId: string, nodeData: any): void {
    this.addAction({
      type: 'create',
      description: `Created node: ${nodeData.label || nodeId}`,
      data: { nodeId, newValue: nodeData }
    });
  }

  recordNodeUpdate(nodeId: string, oldData: any, newData: any): void {
    this.addAction({
      type: 'update',
      description: `Updated node: ${newData.label || nodeId}`,
      data: { nodeId, oldValue: oldData, newValue: newData }
    });
  }

  recordNodeDeletion(nodeId: string, nodeData: any): void {
    this.addAction({
      type: 'delete',
      description: `Deleted node: ${nodeData.label || nodeId}`,
      data: { nodeId, oldValue: nodeData }
    });
  }

  recordNodeMove(nodeId: string, oldPosition: { x: number; y: number }, newPosition: { x: number; y: number }): void {
    this.addAction({
      type: 'move',
      description: `Moved node: ${nodeId}`,
      data: { nodeId, oldValue: oldPosition, newValue: newPosition }
    });
  }

  recordEdgeCreation(edgeId: string, edgeData: any): void {
    this.addAction({
      type: 'connect',
      description: `Connected: ${edgeData.source} → ${edgeData.target}`,
      data: { edgeId, newValue: edgeData }
    });
  }

  recordEdgeDeletion(edgeId: string, edgeData: any): void {
    this.addAction({
      type: 'delete',
      description: `Disconnected: ${edgeData.source} → ${edgeData.target}`,
      data: { edgeId, oldValue: edgeData }
    });
  }

  recordStyleChange(nodeId: string, oldStyle: any, newStyle: any): void {
    this.addAction({
      type: 'style',
      description: `Estilo alterado para nó ${nodeId}`,
      data: { nodeId, oldValue: oldStyle, newValue: newStyle }
    });
  }

  saveState(state: { nodes: Node[]; edges: Edge[] }): void {
    // Salva o estado atual para permitir undo/redo
    // Por enquanto, apenas registra uma ação genérica
    this.addAction({
      type: 'update',
      description: `Estado salvo com ${state.nodes.length} nós e ${state.edges.length} conexões`,
      data: { 
        oldValue: null, 
        newValue: { 
          nodes: state.nodes.map(n => ({ ...n })), 
          edges: state.edges.map(e => ({ ...e })) 
        } 
      }
    });
  }
}

export const historyManager = new HistoryManager();