// ============================================================================
// Sistema de Diagramas - Store Zustand (Optimized with Memoization)
// ============================================================================

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useMemo } from 'react';
import {
  DiagramState,
  DiagramActions,
  DiagramDocument,
  DiagramNode,
  DiagramEdge,
  DiagramType,
  DiagramConfig,
  DiagramViewport,
  DiagramSettings,
  NodeCategory,
  DEFAULT_DIAGRAM_CONFIG,
  DEFAULT_DIAGRAM_SETTINGS,
  DEFAULT_DIAGRAM_VIEWPORT
} from '../types';
import { secureLogger } from '@/utils/secureLogger';
import { diagramService } from '@/services/DiagramServiceFactory';

// ============================================================================
// Estado Inicial
// ============================================================================

const initialState: DiagramState = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  viewport: DEFAULT_DIAGRAM_VIEWPORT,
  isLoading: false,
  isDirty: false,
  lastSaved: undefined,
  error: undefined
};

// ============================================================================
// Estado Interno do Store (não exposto)
// ============================================================================

interface InternalStoreState {
  document: DiagramDocument | null;
  settings: DiagramSettings;
  history: {
    past: DiagramState[];
    present: DiagramState | null;
    future: DiagramState[];
  };
  editor: {
    mode: 'select' | 'pan' | 'connect';
    snapToGrid: boolean;
    gridSize: number;
    connectionLineType: 'bezier' | 'straight' | 'step' | 'smoothstep';
    edgeStyle: 'default' | 'animated';
  };
}

// ============================================================================
// Helper para verificar permissões RBAC
// ============================================================================

const checkEditPermission = async (documentId: string): Promise<boolean> => {
  try {
    const user = await diagramService.getCurrentUser();
    if (!user) {
      secureLogger.warn('Usuário não autenticado');
      return false;
    }

    const diagramRecord = await diagramService.getDiagram(documentId);
    if (diagramRecord) {
      const allowed = await diagramService.canEdit(documentId, user.id);
      if (!allowed) {
        secureLogger.warn('Usuário sem permissão para editar diagrama', {
          userId: user.id,
          documentId
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    secureLogger.error('Erro ao verificar permissões', { error, documentId });
    return false;
  }
};

// ============================================================================
// Store Principal
// ============================================================================

export const useDiagramStore = create<DiagramState & DiagramActions & InternalStoreState>()
  (devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Estado interno
        document: null,
        settings: DEFAULT_DIAGRAM_SETTINGS,
        history: {
          past: [],
          present: null,
          future: []
        },
        editor: {
          mode: 'select',
          snapToGrid: true,
          gridSize: 20,
          connectionLineType: 'bezier',
          edgeStyle: 'default'
        },

        // ============================================================================
        // Documento
        // ============================================================================

        loadDocument: (document: DiagramDocument) => {
          secureLogger.info('Carregando documento de diagrama', {
            documentId: document.id,
            title: document.config?.title,
            type: document.config?.type,
            nodeCount: document.nodes?.length || 0,
            edgeCount: document.edges?.length || 0,
            hasViewport: !!document.viewport,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
            version: document.version
          });
          
          set((state) => {
            state.document = document;
            state.nodes = document.nodes;
            state.edges = document.edges;
            state.viewport = document.viewport;
            state.selectedNodes = [];
            state.selectedEdges = [];
            state.isLoading = false;
            state.isDirty = false;
            state.error = undefined;
            
            // Atualizar histórico
            const currentState = {
              nodes: document.nodes,
              edges: document.edges,
              selectedNodes: [],
              selectedEdges: [],
              viewport: document.viewport,
              isLoading: false,
              isDirty: false
            };
            state.history.present = currentState;
            state.history.past = [];
            state.history.future = [];
            
            secureLogger.debug('Documento carregado com sucesso', {
              documentId: document.id,
              finalNodeCount: state.nodes.length,
              finalEdgeCount: state.edges.length
            });
          });
        },

        saveDocument: async () => {
          const state = get();
          if (!state.document) {
            secureLogger.warn('Tentativa de salvar documento: nenhum documento carregado');
            return;
          }

          try {
            // Verificar permissões RBAC antes de salvar
            if (!(await checkEditPermission(state.document.id))) {
              set((draft) => {
                draft.error = 'Sem permissão para editar este diagrama';
              });
              return;
            }

            const user = await diagramService.getCurrentUser();

            secureLogger.info('Iniciando salvamento do documento', {
              documentId: state.document.id,
              title: state.document.config?.title,
              type: state.document.config?.type,
              nodeCount: state.nodes.length,
              edgeCount: state.edges.length,
              isDirty: state.isDirty,
              currentVersion: state.document.version,
              userId: user?.id
            });
            
            set((draft) => {
              draft.isLoading = true;
              draft.error = undefined;
            });

            // Atualizar documento com estado atual
            const updatedDocument: DiagramDocument = {
              ...state.document,
              nodes: state.nodes,
              edges: state.edges,
              viewport: state.viewport,
              updatedAt: new Date().toISOString()
            };

            // Persistência via DiagramService
            await diagramService.saveFromStore(updatedDocument as any);

            set((draft) => {
              draft.document = updatedDocument;
              draft.isDirty = false;
              draft.isLoading = false;
              draft.lastSaved = new Date().toISOString();
            });

            secureLogger.info('Documento salvo com sucesso', {
              documentId: state.document.id,
              updatedAt: updatedDocument.updatedAt,
              finalNodeCount: state.nodes.length,
              finalEdgeCount: state.edges.length
            });
          } catch (error) {
            secureLogger.error('Erro ao salvar documento', {
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              documentId: state.document.id,
              stack: error instanceof Error ? error.stack : undefined
            });
            
            set((draft) => {
              draft.isLoading = false;
              draft.error = error instanceof Error ? error.message : 'Erro desconhecido';
            });
            
            throw error;
          }
        },

        createNewDocument: (type: DiagramType, title: string) => {
          const now = new Date().toISOString();
          const documentId = uuidv4();
          const configId = uuidv4();
          
          secureLogger.info('Criando novo documento', {
            type,
            title,
            documentId,
            configId,
            timestamp: now
          });
          
          const newDocument: DiagramDocument = {
            id: documentId,
            config: {
              ...DEFAULT_DIAGRAM_CONFIG,
              id: configId,
              type,
              title,
              category: type as NodeCategory,
              metadata: {
                version: '1.0.0',
                lastModified: now
              }
            },
            nodes: [],
            edges: [],
            viewport: DEFAULT_DIAGRAM_VIEWPORT,
            history: {
              past: [],
              present: {
                nodes: [],
                edges: [],
                selectedNodes: [],
                selectedEdges: [],
                viewport: DEFAULT_DIAGRAM_VIEWPORT,
                isLoading: false,
                isDirty: false
              },
              future: []
            },
            createdAt: now,
            updatedAt: now,
            version: '1.0.0'
          };
          
          set((state) => {
            state.document = newDocument;
            state.nodes = [];
            state.edges = [];
            state.selectedNodes = [];
            state.selectedEdges = [];
            state.viewport = DEFAULT_DIAGRAM_VIEWPORT;
            state.isLoading = false;
            state.isDirty = false;
            state.error = undefined;
            
            const currentState = {
              nodes: [],
              edges: [],
              selectedNodes: [],
              selectedEdges: [],
              viewport: DEFAULT_DIAGRAM_VIEWPORT,
              isLoading: false,
              isDirty: false
            };
            state.history.present = currentState;
            state.history.past = [];
            state.history.future = [];
          });
          
          secureLogger.debug('Novo documento criado com sucesso', {
            documentId: newDocument.id,
            configId: newDocument.config.id,
            initialState: 'empty'
          });
        },

        // ============================================================================
        // Nodes
        // ============================================================================

        addNode: async (nodeData: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
          const state = get();
          
          // Verificar permissões RBAC antes de adicionar nó
          if (state.document && !(await checkEditPermission(state.document.id))) {
            return;
          }

          const now = new Date().toISOString();
          const newNode: DiagramNode = {
            ...nodeData,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            version: 1
          };

          secureLogger.info('Adicionando novo nó', { nodeId: newNode.id, type: newNode.type });
          
          set((state) => {
            state.nodes.push(newNode);
            state.isDirty = true;
            
            if (state.document) {
              state.document.nodes = state.nodes;
              state.document.updatedAt = now;
            }
          });
          
          get().pushToHistory();
        },

        updateNode: async (nodeId: string, updates: Partial<Omit<DiagramNode, 'id' | 'createdAt' | 'version'>>) => {
          const state = get();
          
          // Verificar permissões RBAC antes de atualizar nó
          if (state.document && !(await checkEditPermission(state.document.id))) {
            return;
          }

          const now = new Date().toISOString();
          secureLogger.info('Atualizando nó', { nodeId, updates });
          
          set((state) => {
            const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex !== -1) {
              const currentNode = state.nodes[nodeIndex];
              state.nodes[nodeIndex] = {
                ...currentNode,
                ...updates,
                id: nodeId, // Garantir que o ID não seja alterado
                updatedAt: now,
                version: currentNode.version + 1
              };
              state.isDirty = true;
              
              if (state.document) {
                state.document.nodes = state.nodes;
                state.document.updatedAt = now;
              }
            }
          });
          
          get().pushToHistory();
        },

        deleteNode: async (nodeId: string) => {
          const state = get();
          
          // Verificar permissões RBAC antes de deletar nó
          if (state.document && !(await checkEditPermission(state.document.id))) {
            return;
          }

          const now = new Date().toISOString();
          const nodeToDelete = state.nodes.find(node => node.id === nodeId);
          
          if (nodeToDelete) {
            secureLogger.info('Deletando nó', { 
              nodeId, 
              nodeType: nodeToDelete.type,
              nodeLabel: nodeToDelete.data.label 
            });
          }
          
          set((state) => {
            // Remove o nó
            state.nodes = state.nodes.filter(n => n.id !== nodeId);
            
            // Remove arestas conectadas ao nó
            const connectedEdges = state.edges.filter(
              e => e.source === nodeId || e.target === nodeId
            );
            
            if (connectedEdges.length > 0) {
              secureLogger.info('Removendo arestas conectadas', { 
                nodeId, 
                edgeCount: connectedEdges.length,
                edgeIds: connectedEdges.map(e => e.id)
              });
            }
            
            state.edges = state.edges.filter(
              e => e.source !== nodeId && e.target !== nodeId
            );
            
            // Remove das seleções
            state.selectedNodes = state.selectedNodes.filter(id => id !== nodeId);
            
            state.isDirty = true;
            
            if (state.document) {
              state.document.nodes = state.nodes;
              state.document.edges = state.edges;
              state.document.updatedAt = now;
            }
          });
          
          get().pushToHistory();
        },

        duplicateNode: (nodeId: string) => {
          const state = get();
          (async () => {
            try {
              if (state.document && !(await checkEditPermission(state.document.id))) {
                return;
              }

              const originalNode = state.nodes.find(node => node.id === nodeId);
              if (!originalNode) return;

              const now = new Date().toISOString();
              const duplicatedNode: DiagramNode = {
                ...originalNode,
                id: uuidv4(),
                position: {
                  x: originalNode.position.x + 50,
                  y: originalNode.position.y + 50
                },
                data: {
                  ...originalNode.data,
                  label: `${originalNode.data.label} (Cópia)`
                },
                createdAt: now,
                updatedAt: now,
                version: 1
              };

              secureLogger.info('Duplicando nó', { originalId: nodeId, newId: duplicatedNode.id });

              set((state) => {
                state.nodes.push(duplicatedNode);
                state.isDirty = true;

                if (state.document) {
                  state.document.nodes = state.nodes;
                  state.document.updatedAt = now;
                }
              });

              get().pushToHistory();
            } catch (error) {
              secureLogger.error('Erro ao duplicar nó', {
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                nodeId,
                documentId: state.document?.id
              });
            }
          })();
        },

        // ============================================================================
        // Edges
        // ============================================================================

        addEdge: async (edgeData: Omit<DiagramEdge, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
          const state = get();
          
          // Verificar permissões RBAC antes de adicionar aresta
          if (state.document && !(await checkEditPermission(state.document.id))) {
            return;
          }

          const now = new Date().toISOString();
          const newEdge: DiagramEdge = {
            ...edgeData,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            version: 1
          };

          secureLogger.info('Adicionando nova conexão', { 
            edgeId: newEdge.id, 
            source: newEdge.source, 
            target: newEdge.target 
          });
          
          set((state) => {
            state.edges.push(newEdge);
            state.isDirty = true;
            
            if (state.document) {
              state.document.edges = state.edges;
              state.document.updatedAt = now;
            }
          });
          
          get().pushToHistory();
        },

        updateEdge: async (edgeId: string, updates: Partial<Omit<DiagramEdge, 'id' | 'createdAt' | 'version'>>) => {
          const state = get();
          
          // Verificar permissões RBAC antes de atualizar aresta
          if (state.document && !(await checkEditPermission(state.document.id))) {
            return;
          }

          const now = new Date().toISOString();
          secureLogger.info('Atualizando conexão', { edgeId, updates });
          
          set((state) => {
            const edgeIndex = state.edges.findIndex(e => e.id === edgeId);
            if (edgeIndex !== -1) {
              const currentEdge = state.edges[edgeIndex];
              state.edges[edgeIndex] = {
                ...currentEdge,
                ...updates,
                id: edgeId, // Garantir que o ID não seja alterado
                updatedAt: now,
                version: currentEdge.version + 1
              };
              state.isDirty = true;
              
              if (state.document) {
                state.document.edges = state.edges;
                state.document.updatedAt = now;
              }
            }
          });
          
          get().pushToHistory();
        },

        deleteEdge: async (edgeId: string) => {
          const state = get();
          
          // Verificar permissões RBAC antes de deletar aresta
          if (state.document && !(await checkEditPermission(state.document.id))) {
            return;
          }

          const now = new Date().toISOString();
          const edgeToDelete = state.edges.find(edge => edge.id === edgeId);
          
          if (edgeToDelete) {
            secureLogger.info('Deletando aresta', { 
              edgeId, 
              source: edgeToDelete.source,
              target: edgeToDelete.target,
              type: edgeToDelete.type
            });
          }
          
          set((state) => {
            // Remove a aresta
            state.edges = state.edges.filter(e => e.id !== edgeId);
            
            // Remove das seleções
            state.selectedEdges = state.selectedEdges.filter(id => id !== edgeId);
            
            state.isDirty = true;
            
            if (state.document) {
              state.document.edges = state.edges;
              state.document.updatedAt = now;
            }
          });
          
          get().pushToHistory();
        },

        // ============================================================================
        // Seleção
        // ============================================================================

        selectNode: (nodeId: string, multiSelect = false) => {
          set((state) => {
            if (multiSelect) {
              if (!state.selectedNodes.includes(nodeId)) {
                state.selectedNodes.push(nodeId);
              }
            } else {
              state.selectedNodes = [nodeId];
              state.selectedEdges = []; // Limpar seleção de arestas
            }
          });
        },

        selectNodes: (nodeIds: string[]) => {
          set((state) => {
            state.selectedNodes = [...new Set(nodeIds)];
          });
        },

        deselectNode: (nodeId: string) => {
          set((state) => {
            state.selectedNodes = state.selectedNodes.filter(id => id !== nodeId);
          });
        },

        selectEdge: (edgeId: string, multiSelect = false) => {
          set((state) => {
            if (multiSelect) {
              if (!state.selectedEdges.includes(edgeId)) {
                state.selectedEdges.push(edgeId);
              }
            } else {
              state.selectedEdges = [edgeId];
              state.selectedNodes = []; // Limpar seleção de nós
            }
          });
        },

        selectEdges: (edgeIds: string[]) => {
          set((state) => {
            state.selectedEdges = [...new Set(edgeIds)];
          });
        },

        deselectEdge: (edgeId: string) => {
          set((state) => {
            state.selectedEdges = state.selectedEdges.filter(id => id !== edgeId);
          });
        },

        clearSelection: () => {
          const state = get();
          const hadSelection = state.selectedNodes.length > 0 || state.selectedEdges.length > 0;
          
          if (hadSelection) {
            secureLogger.debug('Limpando seleção', { 
              selectedNodes: state.selectedNodes.length,
              selectedEdges: state.selectedEdges.length
            });
          }
          
          set((state) => {
            state.selectedNodes = [];
            state.selectedEdges = [];
          });
        },

        selectAll: () => {
          const state = get();
          
          secureLogger.debug('Selecionando todos os elementos', { 
            nodeCount: state.nodes.length,
            edgeCount: state.edges.length
          });
          
          set((state) => {
            state.selectedNodes = state.nodes.map(node => node.id);
            state.selectedEdges = state.edges.map(edge => edge.id);
          });
        },

        // ============================================================================
        // Viewport
        // ============================================================================

        setViewport: (viewport: DiagramViewport) => {
          secureLogger.debug('Atualizando viewport', { 
            x: viewport.x,
            y: viewport.y,
            zoom: viewport.zoom
          });
          
          set((state) => {
            state.viewport = viewport;
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        updateViewport: (updates: Partial<DiagramViewport>) => {
          set((state) => {
            state.viewport = { ...state.viewport, ...updates };
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = state.viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        zoomIn: (factor = 1.2) => {
          const currentZoom = get().viewport.zoom;
          const newZoom = Math.min(currentZoom * factor, 3);
          
          secureLogger.debug('Aumentando zoom', { 
            from: currentZoom,
            to: newZoom,
            factor
          });
          
          set((state) => {
            state.viewport.zoom = newZoom;
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = state.viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        zoomOut: (factor = 1.2) => {
          const currentZoom = get().viewport.zoom;
          const newZoom = Math.max(currentZoom / factor, 0.1);
          
          secureLogger.debug('Diminuindo zoom', { 
            from: currentZoom,
            to: newZoom,
            factor
          });
          
          set((state) => {
            state.viewport.zoom = newZoom;
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = state.viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        setZoom: (zoom: number) => {
          set((state) => {
            state.viewport.zoom = Math.max(0.1, Math.min(zoom, 3));
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = state.viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        resetZoom: () => {
          const currentZoom = get().viewport.zoom;
          
          secureLogger.debug('Resetando zoom', { 
            from: currentZoom,
            to: 1
          });
          
          set((state) => {
            state.viewport.zoom = 1;
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = state.viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        centerView: () => {
          secureLogger.debug('Centralizando visualização');
          
          set((state) => {
            state.viewport.x = 0;
            state.viewport.y = 0;
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = state.viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        fitToScreen: () => {
          const state = get();
          if (state.nodes.length === 0) {
            secureLogger.debug('Não é possível ajustar à tela: nenhum nó presente');
            return;
          }
          
          secureLogger.debug('Ajustando visualização para caber todos os elementos', {
            nodeCount: state.nodes.length
          });
          
          // Calcular bounds dos nós
          const bounds = state.nodes.reduce(
            (acc, node) => {
              const x = node.position.x;
              const y = node.position.y;
              const width = node.size?.width || 100;
              const height = node.size?.height || 50;
              
              return {
                minX: Math.min(acc.minX, x),
                minY: Math.min(acc.minY, y),
                maxX: Math.max(acc.maxX, x + width),
                maxY: Math.max(acc.maxY, y + height)
              };
            },
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
          );
          
          const padding = 50;
          const contentWidth = bounds.maxX - bounds.minX + padding * 2;
          const contentHeight = bounds.maxY - bounds.minY + padding * 2;
          
          // Assumir viewport de 800x600 como padrão
          const viewportWidth = 800;
          const viewportHeight = 600;
          
          const scaleX = viewportWidth / contentWidth;
          const scaleY = viewportHeight / contentHeight;
          const scale = Math.min(scaleX, scaleY, 1); // Não fazer zoom in além de 100%
          
          const centerX = (bounds.minX + bounds.maxX) / 2;
          const centerY = (bounds.minY + bounds.maxY) / 2;
          
          const newViewport = {
            x: -centerX * scale + viewportWidth / 2,
            y: -centerY * scale + viewportHeight / 2,
            zoom: scale
          };
          
          secureLogger.debug('Viewport calculado para fit-to-screen', {
            bounds,
            scale,
            viewport: newViewport
          });
          
          set((state) => {
            state.viewport = newViewport;
            state.isDirty = true;
            
            if (state.document) {
              state.document.viewport = state.viewport;
              state.document.updatedAt = new Date().toISOString();
            }
          });
        },

        // ============================================================================
        // Histórico
        // ============================================================================

        undo: () => {
          const state = get();
          
          if (state.history.past.length === 0) {
            secureLogger.debug('Undo não disponível: histórico vazio');
            return;
          }

          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          secureLogger.info('Executando undo', {
            currentNodes: state.nodes.length,
            currentEdges: state.edges.length,
            previousNodes: previous.nodes.length,
            previousEdges: previous.edges.length,
            historyPastLength: state.history.past.length,
            historyFutureLength: state.history.future.length
          });
          
          set((draft) => {
            // Salvar estado atual no future
            if (draft.history.present) {
              draft.history.future.unshift(draft.history.present);
            }
            draft.history.present = previous;
            draft.history.past = newPast;
            
            // Atualizar estado principal
            draft.nodes = previous.nodes;
            draft.edges = previous.edges;
            draft.selectedNodes = previous.selectedNodes;
            draft.selectedEdges = previous.selectedEdges;
            draft.viewport = previous.viewport;
            draft.isLoading = previous.isLoading;
            draft.isDirty = true; // Marcar como modificado
            
            // Atualizar documento
            if (draft.document) {
              draft.document.nodes = previous.nodes;
              draft.document.edges = previous.edges;
              draft.document.viewport = previous.viewport;
              draft.document.updatedAt = new Date().toISOString();
            }
          });
        },

        redo: () => {
          const state = get();
          
          if (state.history.future.length === 0) {
            secureLogger.debug('Redo não disponível: futuro vazio');
            return;
          }

          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          secureLogger.info('Executando redo', {
            currentNodes: state.nodes.length,
            currentEdges: state.edges.length,
            nextNodes: next.nodes.length,
            nextEdges: next.edges.length,
            historyPastLength: state.history.past.length,
            historyFutureLength: state.history.future.length
          });
          
          set((draft) => {
            // Salvar estado atual no past
            if (draft.history.present) {
              draft.history.past.push(draft.history.present);
            }
            draft.history.present = next;
            draft.history.future = newFuture;
            
            // Atualizar estado principal
            draft.nodes = next.nodes;
            draft.edges = next.edges;
            draft.selectedNodes = next.selectedNodes;
            draft.selectedEdges = next.selectedEdges;
            draft.viewport = next.viewport;
            draft.isLoading = next.isLoading;
            draft.isDirty = true; // Marcar como modificado
            
            // Atualizar documento
            if (draft.document) {
              draft.document.nodes = next.nodes;
              draft.document.edges = next.edges;
              draft.document.viewport = next.viewport;
              draft.document.updatedAt = new Date().toISOString();
            }
          });
        },

        pushToHistory: () => {
          const state = get();

          const currentState = {
            nodes: [...state.nodes],
            edges: [...state.edges],
            selectedNodes: [...state.selectedNodes],
            selectedEdges: [...state.selectedEdges],
            viewport: { ...state.viewport },
            isLoading: state.isLoading,
            isDirty: state.isDirty
          };

          secureLogger.debug('Adicionando estado ao histórico', {
            nodeCount: currentState.nodes.length,
            edgeCount: currentState.edges.length,
            historyLength: state.history.past.length
          });

          set((draft) => {
            if (draft.history.present) {
              draft.history.past.push(draft.history.present);
              
              // Limitar histórico a 50 estados
              if (draft.history.past.length > 50) {
                draft.history.past = draft.history.past.slice(-50);
                secureLogger.debug('Histórico limitado a 50 estados');
              }
            }
            
            draft.history.present = currentState;
            draft.history.future = []; // Limpar future ao fazer nova ação
          });
        },

        // ============================================================================
        // Editor
        // ============================================================================

        setMode: (mode: 'select' | 'pan' | 'connect') => {
          set((state) => {
            state.editor.mode = mode;
          });
        },

        setSnapToGrid: (snap: boolean) => {
          set((state) => {
            state.editor.snapToGrid = snap;
          });
        },

        setGridSize: (size: number) => {
          set((state) => {
            state.editor.gridSize = size;
          });
        }
      }))
    ),
    {
      name: 'diagram-store',
      partialize: (state) => ({
        editor: state.editor,
        ui: {
          showGrid: state.ui.showGrid,
          showMinimap: state.ui.showMinimap,
          showControls: state.ui.showControls
        }
      })
    }
  ));

// ============================================================================
// Seletores Otimizados (with Memoization)
// ============================================================================

// Seletores de dados principais com shallow comparison
export const useDiagramDocument = () => useDiagramStore(state => state.document);
export const useDiagramNodes = () => useDiagramStore(state => state.nodes);
export const useDiagramEdges = () => useDiagramStore(state => state.edges);
export const useDiagramViewport = () => useDiagramStore(state => state.viewport);

// Seletores de seleção com memoização
export const useDiagramSelection = () => {
  return useDiagramStore(
    useMemo(() => (state) => ({
      selectedNodes: state.selectedNodes,
      selectedEdges: state.selectedEdges,
      hasSelection: state.selectedNodes.length > 0 || state.selectedEdges.length > 0
    }), [])
  );
};

// Seletores de nós e arestas selecionados com memoização
export const useSelectedNodes = () => {
  return useDiagramStore(
    useMemo(() => (state) => 
      state.nodes.filter(node => state.selectedNodes.includes(node.id))
    , [])
  );
};

export const useSelectedEdges = () => {
  return useDiagramStore(
    useMemo(() => (state) => 
      state.edges.filter(edge => state.selectedEdges.includes(edge.id))
    , [])
  );
};

// Seletores de estado
export const useDiagramState = () => useDiagramStore(state => ({
  isLoading: state.isLoading,
  isDirty: state.isDirty,
  error: state.error,
  lastSaved: state.lastSaved
}));

// Seletores de histórico
export const useDiagramHistory = () => useDiagramStore(state => ({
  canUndo: state.history.past.length > 0,
  canRedo: state.history.future.length > 0,
  historyLength: state.history.past.length
}));

export const useCanUndo = () => useDiagramStore(state => state.history.past.length > 0);
export const useCanRedo = () => useDiagramStore(state => state.history.future.length > 0);

// Seletores de configuração
export const useDiagramConfig = () => useDiagramStore(state => state.document?.config);
export const useDiagramSettings = () => useDiagramStore(state => state.settings);
export const useDiagramEditor = () => useDiagramStore(state => state.editor);

// Seletores de nós por tipo com memoização
export const useNodesByType = (nodeType: string) => {
  return useDiagramStore(
    useMemo(() => (state) => 
      state.nodes.filter(node => node.type === nodeType)
    , [nodeType])
  );
};

export const useFlowchartNodes = () => useNodesByType('flowchart');
export const useMindMapNodes = () => useNodesByType('mindmap');
export const useOrganogramNodes = () => useNodesByType('organogram');

// Seletores de métricas com memoização
export const useDiagramMetrics = () => {
  return useDiagramStore(
    useMemo(() => (state) => ({
      nodeCount: state.nodes.length,
      edgeCount: state.edges.length,
      selectedCount: state.selectedNodes.length + state.selectedEdges.length,
      diagramType: state.document?.config?.type || 'flowchart'
    }), [])
  );
};

// Seletores de ações
export const useDiagramActions = () => useDiagramStore(state => ({
  // Document actions
  loadDocument: state.loadDocument,
  saveDocument: state.saveDocument,
  createNewDocument: state.createNewDocument,
  
  // Node actions
  addNode: state.addNode,
  updateNode: state.updateNode,
  deleteNode: state.deleteNode,
  duplicateNode: state.duplicateNode,
  
  // Edge actions
  addEdge: state.addEdge,
  updateEdge: state.updateEdge,
  deleteEdge: state.deleteEdge,
  
  // Selection actions
  selectNode: state.selectNode,
  selectNodes: state.selectNodes,
  deselectNode: state.deselectNode,
  selectEdge: state.selectEdge,
  selectEdges: state.selectEdges,
  deselectEdge: state.deselectEdge,
  clearSelection: state.clearSelection,
  selectAll: state.selectAll,
  
  // Viewport actions
  setViewport: state.setViewport,
  updateViewport: state.updateViewport,
  zoomIn: state.zoomIn,
  zoomOut: state.zoomOut,
  setZoom: state.setZoom,
  resetZoom: state.resetZoom,
  centerView: state.centerView,
  fitToScreen: state.fitToScreen,
  
  // History actions
  undo: state.undo,
  redo: state.redo,
  pushToHistory: state.pushToHistory,
  
  // Editor actions
  setMode: state.setMode,
  setSnapToGrid: state.setSnapToGrid,
  setGridSize: state.setGridSize
}));

// Seletores compostos para componentes específicos (Optimized)
export const useDiagramEditorHook = () => {
  const nodes = useDiagramNodes();
  const edges = useDiagramEdges();
  const viewport = useDiagramViewport();
  const selection = useDiagramSelection();
  const state = useDiagramState();
  const history = useDiagramHistory();
  const actions = useDiagramActions();
  
  return useMemo(() => ({
    nodes,
    edges,
    viewport,
    selection,
    state,
    history,
    actions
  }), [nodes, edges, viewport, selection, state, history, actions]);
};

export const useDiagramCanvas = () => {
  const nodes = useDiagramNodes();
  const edges = useDiagramEdges();
  const viewport = useDiagramViewport();
  const actions = useDiagramActions();
  
  return useMemo(() => ({
    nodes,
    edges,
    viewport,
    selectNode: actions.selectNode,
    selectEdge: actions.selectEdge,
    clearSelection: actions.clearSelection,
    updateViewport: actions.updateViewport,
    addNode: actions.addNode
  }), [nodes, edges, viewport, actions]);
};

export const useDiagramToolbar = () => {
  const state = useDiagramState();
  const history = useDiagramHistory();
  const config = useDiagramConfig();
  const actions = useDiagramActions();
  
  return useMemo(() => ({
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    diagramType: config?.type,
    saveDocument: actions.saveDocument,
    undo: actions.undo,
    redo: actions.redo,
    zoomIn: actions.zoomIn,
    zoomOut: actions.zoomOut,
    resetZoom: actions.resetZoom,
    fitToScreen: actions.fitToScreen
  }), [state, history, config, actions]);
};

export const useDiagramPalette = () => {
  const config = useDiagramConfig();
  const actions = useDiagramActions();
  
  return useMemo(() => ({
    diagramType: config?.type || 'flowchart',
    addNode: actions.addNode
  }), [config, actions]);
};