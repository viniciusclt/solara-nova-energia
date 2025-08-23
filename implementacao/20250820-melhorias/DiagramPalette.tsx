import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusSquare, GitBranch, Shapes } from 'lucide-react';

const onDragStart = (event: React.DragEvent, nodeType: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

export function DiagramPalette() {
  return (
    <div className="w-56 shrink-0 border rounded-lg p-3 bg-white space-y-2">
      <div className="text-sm font-semibold mb-2">Paleta</div>
      <Button variant="outline" className="w-full justify-start" draggable onDragStart={(e) => onDragStart(e, 'custom')}>
        <Shapes className="h-4 w-4 mr-2" />
        Nó padrão
      </Button>
      <Button variant="outline" className="w-full justify-start" draggable onDragStart={(e) => onDragStart(e, 'input')}>
        <PlusSquare className="h-4 w-4 mr-2" />
        Entrada
      </Button>
      <Button variant="outline" className="w-full justify-start" draggable onDragStart={(e) => onDragStart(e, 'output')}>
        <GitBranch className="h-4 w-4 mr-2" />
        Saída
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Dica: arraste um item para o canvas para criar um nó.
      </p>
    </div>
  );
}

export default DiagramPalette;


