/**
 * Painel de Camadas para o Editor de Diagramas
 * Gerenciamento de visibilidade e organização de elementos
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Move,
  Copy
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  nodeIds: string[];
  edgeIds: string[];
  expanded: boolean;
}

interface LayersPanelProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId?: string | null;
  onUpdateNode?: (nodeId: string, updates: any) => void;
  onUpdateEdge?: (edgeId: string, updates: any) => void;
  onSelectNode?: (nodeId: string | null) => void;
  className?: string;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onUpdateNode,
  onUpdateEdge,
  onSelectNode,
  className
}) => {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'default',
      name: 'Camada Principal',
      visible: true,
      locked: false,
      color: '#3b82f6',
      nodeIds: nodes.map(n => n.id),
      edgeIds: edges.map(e => e.id),
      expanded: true
    }
  ]);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [newLayerName, setNewLayerName] = useState('');

  // Criar nova camada
  const handleCreateLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: newLayerName || `Camada ${layers.length + 1}`,
      visible: true,
      locked: false,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      nodeIds: [],
      edgeIds: [],
      expanded: true
    };
    
    setLayers(prev => [...prev, newLayer]);
    setNewLayerName('');
  }, [layers.length, newLayerName]);

  // Alternar visibilidade da camada
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const newVisible = !layer.visible;
        
        // Atualizar visibilidade dos nós
        layer.nodeIds.forEach(nodeId => {
          onUpdateNode?.(nodeId, { hidden: !newVisible });
        });
        
        // Atualizar visibilidade das arestas
        layer.edgeIds.forEach(edgeId => {
          onUpdateEdge?.(edgeId, { hidden: !newVisible });
        });
        
        return { ...layer, visible: newVisible };
      }
      return layer;
    }));
  }, [onUpdateNode, onUpdateEdge]);

  // Alternar bloqueio da camada
  const toggleLayerLock = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const newLocked = !layer.locked;
        
        // Atualizar bloqueio dos nós
        layer.nodeIds.forEach(nodeId => {
          onUpdateNode?.(nodeId, { 
            draggable: !newLocked,
            selectable: !newLocked 
          });
        });
        
        return { ...layer, locked: newLocked };
      }
      return layer;
    }));
  }, [onUpdateNode]);

  // Excluir camada
  const deleteLayer = useCallback((layerId: string) => {
    if (layerId === 'default') return; // Não permitir excluir camada padrão
    
    setLayers(prev => {
      const layerToDelete = prev.find(l => l.id === layerId);
      if (layerToDelete) {
        // Mover elementos para a camada padrão
        const defaultLayer = prev.find(l => l.id === 'default');
        if (defaultLayer) {
          defaultLayer.nodeIds.push(...layerToDelete.nodeIds);
          defaultLayer.edgeIds.push(...layerToDelete.edgeIds);
        }
      }
      
      return prev.filter(layer => layer.id !== layerId);
    });
  }, []);

  // Alternar expansão da camada
  const toggleLayerExpansion = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, expanded: !layer.expanded }
        : layer
    ));
  }, []);

  // Selecionar elemento
  const handleSelectElement = useCallback((nodeId: string) => {
    onSelectNode?.(nodeId);
  }, [onSelectNode]);

  // Obter nó por ID
  const getNodeById = useCallback((nodeId: string) => {
    return nodes.find(n => n.id === nodeId);
  }, [nodes]);

  // Obter aresta por ID
  const getEdgeById = useCallback((edgeId: string) => {
    return edges.find(e => e.id === edgeId);
  }, [edges]);

  return (
    <Card className={cn('w-64 h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Layers className="w-4 h-4" />
          <span>Camadas</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Criar Nova Camada */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex space-x-2">
            <Input
              placeholder="Nome da camada"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              className="text-xs"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateLayer()}
            />
            <Button
              size="sm"
              onClick={handleCreateLayer}
              className="px-2"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Lista de Camadas */}
        <ScrollArea className="h-96">
          <div className="p-2 space-y-1">
            {layers.map((layer) => (
              <div key={layer.id} className="space-y-1">
                {/* Header da Camada */}
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-4 w-4"
                    onClick={() => toggleLayerExpansion(layer.id)}
                  >
                    {layer.expanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Button>
                  
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: layer.color }}
                  />
                  
                  <span className="flex-1 text-xs font-medium truncate">
                    {layer.name}
                  </span>
                  
                  <Badge variant="secondary" className="text-xs px-1">
                    {layer.nodeIds.length + layer.edgeIds.length}
                  </Badge>
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-4 w-4"
                      onClick={() => toggleLayerVisibility(layer.id)}
                    >
                      {layer.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-4 w-4"
                      onClick={() => toggleLayerLock(layer.id)}
                    >
                      {layer.locked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </Button>
                    
                    {layer.id !== 'default' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-4 w-4 text-red-500 hover:text-red-700"
                        onClick={() => deleteLayer(layer.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Elementos da Camada */}
                {layer.expanded && (
                  <div className="ml-6 space-y-1">
                    {/* Nós */}
                    {layer.nodeIds.map((nodeId) => {
                      const node = getNodeById(nodeId);
                      if (!node) return null;
                      
                      return (
                        <div
                          key={nodeId}
                          className={cn(
                            'flex items-center space-x-2 p-1 rounded text-xs cursor-pointer hover:bg-gray-100',
                            selectedNodeId === nodeId && 'bg-blue-100 text-blue-700'
                          )}
                          onClick={() => handleSelectElement(nodeId)}
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded" />
                          <span className="flex-1 truncate">
                            {node.data?.label || node.id}
                          </span>
                          <Move className="w-3 h-3 opacity-50" />
                        </div>
                      );
                    })}
                    
                    {/* Arestas */}
                    {layer.edgeIds.map((edgeId) => {
                      const edge = getEdgeById(edgeId);
                      if (!edge) return null;
                      
                      return (
                        <div
                          key={edgeId}
                          className="flex items-center space-x-2 p-1 rounded text-xs cursor-pointer hover:bg-gray-100"
                        >
                          <div className="w-2 h-2 bg-gray-400 rounded" />
                          <span className="flex-1 truncate">
                            {edge.data?.label || `${edge.source} → ${edge.target}`}
                          </span>
                        </div>
                      );
                    })}
                    
                    {layer.nodeIds.length === 0 && layer.edgeIds.length === 0 && (
                      <div className="text-xs text-gray-400 italic p-1">
                        Camada vazia
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export { LayersPanel };
export type { Layer };