/**
 * Página do Editor Moderno de Fluxogramas
 * Interface principal para criação de diagramas modernos
 */

import React from 'react';
import { ModernDiagramEditor } from '@/components/diagrams/modern/ModernDiagramEditor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Share2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModernFlowchartEditor: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = () => {
    // Implementar salvamento
    console.log('Salvando diagrama...');
  };

  const handleShare = () => {
    // Implementar compartilhamento
    console.log('Compartilhando diagrama...');
  };

  const handleExport = () => {
    // Implementar exportação
    console.log('Exportando diagrama...');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/flowcharts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">
                Editor Moderno
              </h1>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <ModernDiagramEditor
          diagramType="flowchart"
          initialNodes={[]}
          initialEdges={[]}
          enableCollaboration={false}
          onSave={handleSave}
          onExport={handleExport}
        />
      </div>
      
      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Pronto</span>
            <span>•</span>
            <span>Salvamento automático ativado</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Zoom: 100%</span>
            <span>•</span>
            <span>0 elementos selecionados</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernFlowchartEditor;
export { ModernFlowchartEditor };