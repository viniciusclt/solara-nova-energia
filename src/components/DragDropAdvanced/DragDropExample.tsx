import React, { useState } from 'react';
import {
  DragDropProvider,
  DragDropContainer,
  DragDropToolbar,
  createDragDropItem,
  createDragDropContainer,
  itemTemplates,
  layoutPresets
} from './index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Type, 
  Image, 
  Square, 
  CreditCard,
  Layout,
  Layers
} from 'lucide-react';

interface DragDropExampleProps {
  className?: string;
}

export const DragDropExample: React.FC<DragDropExampleProps> = ({ className }) => {
  const [selectedLayout, setSelectedLayout] = useState<'free' | 'horizontal' | 'vertical' | 'grid'>('free');
  
  // Initial containers
  const initialContainers = [
    {
      ...createDragDropContainer('free'),
      id: 'container-1',
      items: [
        {
          ...createDragDropItem('text'),
          id: 'item-1',
          content: { title: 'Título Principal', description: 'Este é um exemplo de texto' },
          position: { x: 50, y: 50 }
        },
        {
          ...createDragDropItem('button'),
          id: 'item-2',
          content: { title: 'Clique Aqui', variant: 'default' },
          position: { x: 200, y: 100 }
        }
      ]
    },
    {
      ...createDragDropContainer(selectedLayout),
      id: 'container-2',
      items: []
    }
  ];

  const addItemToContainer = (containerId: string, itemType: keyof typeof itemTemplates) => {
    const newItem = {
      ...createDragDropItem(itemType),
      ...itemTemplates[itemType],
      position: selectedLayout === 'free' ? { x: 20, y: 20 } : undefined
    };
    
    // This would be handled by the DragDropProvider in a real implementation
    console.log('Adding item:', newItem, 'to container:', containerId);
  };

  const addContainer = () => {
    const newContainer = {
      ...createDragDropContainer(selectedLayout),
      id: `container-${Date.now()}`
    };
    
    console.log('Adding container:', newContainer);
  };

  const handleSave = () => {
    console.log('Saving layout...');
  };

  const handleExport = () => {
    console.log('Exporting layout...');
  };

  const handleImport = () => {
    console.log('Importing layout...');
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <DragDropProvider initialContainers={initialContainers}>
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <DragDropToolbar
            onSave={handleSave}
            onExport={handleExport}
            onImport={handleImport}
            className="border-b"
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar with Components */}
            <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Componentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addItemToContainer('container-2', 'text')}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Texto
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addItemToContainer('container-2', 'button')}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Botão
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addItemToContainer('container-2', 'image')}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Imagem
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addItemToContainer('container-2', 'card')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Card
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedLayout}
                    onValueChange={(value: 'free' | 'horizontal' | 'vertical' | 'grid') => setSelectedLayout(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">
                        <div className="flex items-center">
                          <Layout className="h-4 w-4 mr-2" />
                          Livre
                        </div>
                      </SelectItem>
                      <SelectItem value="horizontal">
                        <div className="flex items-center">
                          <Layers className="h-4 w-4 mr-2" />
                          Horizontal
                        </div>
                      </SelectItem>
                      <SelectItem value="vertical">
                        <div className="flex items-center">
                          <Layers className="h-4 w-4 mr-2 rotate-90" />
                          Vertical
                        </div>
                      </SelectItem>
                      <SelectItem value="grid">
                        <div className="flex items-center">
                          <Layout className="h-4 w-4 mr-2" />
                          Grade
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={addContainer}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Container
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Presets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(layoutPresets).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedLayout(preset.layout);
                        console.log('Applying preset:', key, preset);
                      }}
                    >
                      <Badge variant="outline" className="mr-2 text-xs">
                        {preset.layout}
                      </Badge>
                      {key}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 p-4 overflow-auto">
              <Tabs defaultValue="canvas" className="h-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="canvas">Canvas</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="code">Código</TabsTrigger>
                </TabsList>
                
                <TabsContent value="canvas" className="h-full space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                    <DragDropContainer
                      containerId="container-1"
                      title="Container Livre"
                      description="Posicionamento livre com grade"
                      showGrid={true}
                      onAddItem={() => addItemToContainer('container-1', 'text')}
                    />
                    
                    <DragDropContainer
                      containerId="container-2"
                      title={`Container ${selectedLayout}`}
                      description={`Layout: ${selectedLayout}`}
                      allowReorder={selectedLayout !== 'free'}
                      onAddItem={() => addItemToContainer('container-2', 'button')}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="h-full">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Preview do Layout</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Aqui seria exibida uma prévia do layout final sem as funcionalidades de edição.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="code" className="h-full">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Código Gerado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                        <code>
{`// Exemplo de uso do sistema Drag & Drop
import { 
  DragDropProvider, 
  DragDropContainer, 
  DragDropToolbar 
} from '@/components/DragDropAdvanced';

function MyComponent() {
  return (
    <DragDropProvider>
      <DragDropToolbar />
      <DragDropContainer 
        containerId="my-container"
        layout="${selectedLayout}"
      />
    </DragDropProvider>
  );
}`}
                        </code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DragDropProvider>
    </div>
  );
};

export default DragDropExample;