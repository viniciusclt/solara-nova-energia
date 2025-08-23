import React from 'react';
import { useParams } from 'react-router-dom';
import { UnifiedDiagramEditor } from '../components/diagrams/UnifiedDiagramEditor';
// import { SimpleFlowchartEditor } from '../components/diagrams/SimpleFlowchartEditor';

// Página do Editor de Fluxogramas
// - Rota sem :id abre um editor para novo fluxograma
// - Rota com :id abre o fluxograma existente
// Migrado para usar o editor unificado
export const FlowchartEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="h-screen bg-background">
      <UnifiedDiagramEditor
        diagramType="flowchart"
        diagramId={id}
        showToolbar={true}
        showSidebar={true}
      />
    </div>
  );
};

export default FlowchartEditorPage;