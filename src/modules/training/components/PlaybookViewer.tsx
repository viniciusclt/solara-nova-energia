import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrainingPlaybook } from '@/types/training';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Eye,
  Calendar,
  FileType
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaybookViewerProps {
  playbooks: TrainingPlaybook[];
  className?: string;
}

export function PlaybookViewer({ playbooks, className }: PlaybookViewerProps) {
  const [selectedPlaybook, setSelectedPlaybook] = useState<TrainingPlaybook | null>(null);

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'presentation':
        return <FileType className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFileTypeBadge = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <Badge variant="destructive">PDF</Badge>;
      case 'presentation':
        return <Badge variant="default">Apresentação</Badge>;
      default:
        return <Badge variant="secondary">Arquivo</Badge>;
    }
  };

  const handleDownload = (playbook: TrainingPlaybook) => {
    window.open(playbook.file_url, '_blank');
  };

  const handleView = (playbook: TrainingPlaybook) => {
    setSelectedPlaybook(playbook);
  };

  if (playbooks.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum playbook disponível
        </h3>
        <p className="text-gray-500">
          Os playbooks serão exibidos aqui quando estiverem disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Lista de playbooks */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {playbooks.map((playbook) => (
          <Card key={playbook.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getFileTypeIcon(playbook.file_type)}
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {playbook.title}
                  </CardTitle>
                </div>
                {getFileTypeBadge(playbook.file_type)}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {playbook.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {playbook.description}
                </p>
              )}
              
              <div className="flex items-center text-xs text-gray-500 mb-3">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(playbook.created_at).toLocaleDateString('pt-BR')}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(playbook)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(playbook)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de visualização */}
      {selectedPlaybook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                {getFileTypeIcon(selectedPlaybook.file_type)}
                <h2 className="text-lg font-semibold">{selectedPlaybook.title}</h2>
                {getFileTypeBadge(selectedPlaybook.file_type)}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedPlaybook)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedPlaybook.file_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir em nova aba
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlaybook(null)}
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Conteúdo do modal */}
            <div className="flex-1 p-4">
              {selectedPlaybook.file_type === 'pdf' ? (
                <iframe
                  src={`${selectedPlaybook.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full border rounded"
                  title={selectedPlaybook.title}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileType className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Visualização não disponível
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Este tipo de arquivo não pode ser visualizado diretamente no navegador.
                    </p>
                    <Button onClick={() => handleDownload(selectedPlaybook)}>
                      <Download className="h-4 w-4 mr-2" />
                      Fazer Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaybookViewer;