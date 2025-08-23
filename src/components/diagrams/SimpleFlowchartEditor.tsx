/**
 * Editor de Fluxograma Simples - Versão de teste
 * Para verificar se a página /flowcharts/editor está funcionando
 */

import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Download, Plus } from 'lucide-react';

interface SimpleFlowchartEditorProps {
  diagramType?: string;
  diagramId?: string;
  showToolbar?: boolean;
  showSidebar?: boolean;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: { label: 'Início' },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 250, y: 200 },
    data: { label: 'Processo' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
];

const SimpleFlowchartEditorContent: React.FC<SimpleFlowchartEditorProps> = ({
  diagramType = 'flowchart',
  showToolbar = true,
  showSidebar = true,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = () => {
    console.log('Salvando diagrama...', { nodes, edges });
  };

  const handleExport = () => {
    console.log('Exportando diagrama...', { nodes, edges });
  };

  const addNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `Novo Nó ${nodes.length + 1}` },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{diagramType}</Badge>
              <span className="text-sm text-gray-500">Editor Simples de Fluxograma</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={addNode}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Nó
              </Button>
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 bg-white border-r border-gray-200 p-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Elementos</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={addNode}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Nó
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>✅ Funcionando</span>
            <span>•</span>
            <span>{nodes.length} nós</span>
            <span>•</span>
            <span>{edges.length} conexões</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Zoom: 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SimpleFlowchartEditor: React.FC<SimpleFlowchartEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SimpleFlowchartEditorContent {...props} />
    </ReactFlowProvider>
  );
};

export default SimpleFlowchartEditor;