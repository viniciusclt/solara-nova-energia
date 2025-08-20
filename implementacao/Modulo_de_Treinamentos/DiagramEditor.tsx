import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrainingDiagram, DiagramData } from '@/types/training';
import { TrainingService } from '@/services/trainingService';
import { 
  Save, 
  Plus, 
  Trash2, 
  Download, 
  Upload,
  Eye,
  Edit,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Componente de nó customizado
interface NodeProps {
  data: { label: string };
  selected?: boolean;
}

const CustomNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={cn(
      "px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400",
      selected && "border-blue-500"
    )}>
      <div className="text-sm font-medium">{data.label}</div>
    </div>
  );
};

// Componente de nó de entrada
const InputNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={cn(
      "px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-400",
      selected && "border-blue-500"
    )}>
      <div className="text-sm font-medium">{data.label}</div>
    </div>
  );
};

// Componente de nó de saída
const OutputNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={cn(
      "px-4 py-2 shadow-md rounded-md bg-red-100 border-2 border-red-400",
      selected && "border-blue-500"
    )}>
      <div className="text-sm font-medium">{data.label}</div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  input: InputNode,
  output: OutputNode,
};

interface DiagramEditorProps {
  diagrams: TrainingDiagram[];
  moduleId: string;
  onDiagramSaved?: (diagram: TrainingDiagram) => void;
  className?: string;
  readOnly?: boolean;
}

export function DiagramEditor({ 
  diagrams, 
  moduleId, 
  onDiagramSaved, 
  className,
  readOnly = false 
}: DiagramEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedDiagram, setSelectedDiagram] = useState<TrainingDiagram | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [diagramTitle, setDiagramTitle] = useState('');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [diagramType, setDiagramType] = useState<'flowchart' | 'mindmap'>('flowchart');
  const [saving, setSaving] = useState(false);

  // Carregar diagrama selecionado
  useEffect(() => {
    if (selectedDiagram) {
      const diagramData = selectedDiagram.diagram_data as DiagramData;
      setNodes(diagramData.nodes || []);
      setEdges(diagramData.edges || []);
      setDiagramTitle(selectedDiagram.title);
      setDiagramDescription(selectedDiagram.description || '');
      setDiagramType(selectedDiagram.diagram_type);
    }
  }, [selectedDiagram, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    if (!newNodeLabel.trim()) return;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: newNodeLabel },
    };

    setNodes((nds) => [...nds, newNode]);
    setNewNodeLabel('');
  }, [newNodeLabel, setNodes]);

  const deleteSelectedNodes = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  const saveDiagram = async () => {
    if (!diagramTitle.trim()) {
      alert('Por favor, insira um título para o diagrama');
      return;
    }

    setSaving(true);
    try {
      const diagramData: DiagramData = { nodes, edges };
      
      if (selectedDiagram) {
        // Atualizar diagrama existente
        const updatedDiagram = await TrainingService.updateDiagram(selectedDiagram.id, {
          title: diagramTitle,
          description: diagramDescription,
          diagram_data: diagramData,
          diagram_type: diagramType
        });
        onDiagramSaved?.(updatedDiagram);
      } else {
        // Criar novo diagrama
        const newDiagram = await TrainingService.createDiagram({
          module_id: moduleId,
          title: diagramTitle,
          description: diagramDescription,
          diagram_data: diagramData,
          diagram_type: diagramType,
          order_index: diagrams.length
        });
        onDiagramSaved?.(newDiagram);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar diagrama:', error);
      alert('Erro ao salvar diagrama');
    } finally {
      setSaving(false);
    }
  };

  const startNewDiagram = () => {
    setSelectedDiagram(null);
    setNodes([]);
    setEdges([]);
    setDiagramTitle('');
    setDiagramDescription('');
    setDiagramType('flowchart');
    setIsEditing(true);
  };

  const exportDiagram = () => {
    const diagramData = { nodes, edges };
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagramTitle || 'diagrama'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (diagrams.length === 0 && !isEditing) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum diagrama disponível
        </h3>
        <p className="text-gray-500 mb-4">
          Crie fluxogramas e mapas mentais para organizar o conteúdo.
        </p>
        {!readOnly && (
          <Button onClick={startNewDiagram}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Diagrama
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Lista de diagramas */}
      {!isEditing && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Diagramas</h3>
            {!readOnly && (
              <Button onClick={startNewDiagram}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Diagrama
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {diagrams.map((diagram) => (
              <Card key={diagram.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {diagram.title}
                    </CardTitle>
                    <Badge variant={diagram.diagram_type === 'flowchart' ? 'default' : 'secondary'}>
                      {diagram.diagram_type === 'flowchart' ? 'Fluxograma' : 'Mapa Mental'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {diagram.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {diagram.description}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDiagram(diagram);
                        setIsEditing(false);
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Visualizar
                    </Button>
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDiagram(diagram);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Editor/Visualizador de diagrama */}
      {(selectedDiagram || isEditing) && (
        <div className="space-y-4">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Título do diagrama"
                    value={diagramTitle}
                    onChange={(e) => setDiagramTitle(e.target.value)}
                    className="font-semibold"
                  />
                  <Input
                    placeholder="Descrição (opcional)"
                    value={diagramDescription}
                    onChange={(e) => setDiagramDescription(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold">{selectedDiagram?.title}</h3>
                  {selectedDiagram?.description && (
                    <p className="text-gray-600">{selectedDiagram.description}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportDiagram}
                    disabled={nodes.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={saveDiagram}
                    disabled={saving || !diagramTitle.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDiagram(null);
                  setIsEditing(false);
                }}
              >
                Voltar
              </Button>
            </div>
          </div>

          {/* Ferramentas de edição */}
          {isEditing && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="node-label">Novo nó:</Label>
                    <Input
                      id="node-label"
                      placeholder="Digite o texto do nó"
                      value={newNodeLabel}
                      onChange={(e) => setNewNodeLabel(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addNode()}
                      className="w-48"
                    />
                    <Button onClick={addNode} disabled={!newNodeLabel.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={deleteSelectedNodes}
                    disabled={!nodes.some(n => n.selected) && !edges.some(e => e.selected)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Canvas do diagrama */}
          <div className="h-96 border rounded-lg">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              <Panel position="top-left">
                <div className="bg-white p-2 rounded shadow text-xs">
                  {isEditing ? 'Modo de Edição' : 'Modo de Visualização'}
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      )}
    </div>
  );
}

