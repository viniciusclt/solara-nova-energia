import React from 'react';
import { useParams } from 'react-router-dom';
import { FlowchartEditor } from '@/components/flowchart';

// Página do Editor de Fluxogramas
// - Rota sem :id abre um editor para novo fluxograma
// - Rota com :id abre o fluxograma existente
export const FlowchartEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="h-screen bg-background">
      <FlowchartEditor flowchartId={id} />
    </div>
  );
};

export default FlowchartEditorPage;