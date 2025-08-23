import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CollaborationPanel } from '@/modules/playbooks/components/CollaborationPanel';
import { useCollaboration, useCollaborationIndicators } from '@/hooks/useCollaboration';
import { Users, Wifi, WifiOff, AlertTriangle, Eye, MousePointer } from 'lucide-react';

interface CollaborationIntegrationDemoProps {
  diagramId?: string;
}

export const CollaborationIntegrationDemo: React.FC<CollaborationIntegrationDemoProps> = ({
  diagramId = 'demo-diagram-123'
}) => {
  const [showPanel, setShowPanel] = useState(true);
  
  // Hook principal de colaboração
  const collaboration = useCollaboration({
    diagramId,
    autoResolveConflicts: false,
    enableCursorBroadcast: true,
    enablePresence: true,
    syncInterval: 1000
  });
  
  // Hook para indicadores visuais
  const indicators = useCollaborationIndicators({
    showCursors: true,
    showSelections: true,
    showConflicts: true
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demo de Colaboração em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {collaboration.isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Conectado
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive">
                      Desconectado
                    </Badge>
                  </>
                )}
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {collaboration.users.length} usuário(s)
                </span>
              </div>
              
              {collaboration.pendingConflicts.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      {collaboration.pendingConflicts.length} conflito(s)
                    </Badge>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showPanel ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
              >
                {showPanel ? 'Ocultar' : 'Mostrar'} Painel
              </Button>
              
              {!collaboration.isConnected ? (
                <Button
                  onClick={collaboration.connect}
                  disabled={collaboration.isConnecting}
                  size="sm"
                >
                  {collaboration.isConnecting ? 'Conectando...' : 'Conectar'}
                </Button>
              ) : (
                <Button
                  onClick={collaboration.disconnect}
                  variant="outline"
                  size="sm"
                >
                  Desconectar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collaboration.users.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {collaboration.users.filter(u => u.status === 'online').length} online
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Conflitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collaboration.pendingConflicts.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              pendentes
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Cursores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collaboration.users.filter(u => u.cursor).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              visíveis
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagram Area Simulation */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Área do Diagrama (Simulação)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Eye className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Área onde o diagrama seria renderizado
                  </p>
                  <p className="text-xs text-gray-400">
                    Cursores e indicadores de colaboração apareceriam aqui
                  </p>
                </div>
                
                {/* Simular cursores de outros usuários */}
                {collaboration.users
                  .filter(u => u.cursor && u.id !== collaboration.currentUser?.id)
                  .map((user, index) => (
                    <div
                      key={user.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + index * 10}%`
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <MousePointer className="h-4 w-4" style={{ color: user.cursor?.color }} />
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: user.cursor?.color + '20' }}
                        >
                          {user.name}
                        </Badge>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collaboration Panel */}
        {showPanel && (
          <div className="lg:col-span-1">
            <CollaborationPanel
              diagramId={diagramId}
              comments={[]}
              onAddComment={() => {}}
              onReplyToComment={() => {}}
            />
          </div>
        )}
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Informações de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs font-mono">
            <div>Diagram ID: {diagramId}</div>
            <div>Connected: {collaboration.isConnected.toString()}</div>
            <div>Current User: {collaboration.currentUser?.name || 'N/A'}</div>
            <div>Can Edit: {collaboration.canEdit.toString()}</div>
            <div>Users Count: {collaboration.users.length}</div>
            <div>Conflicts Count: {collaboration.pendingConflicts.length}</div>
            <div>Last Sync: {collaboration.lastSync?.toISOString() || 'Never'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborationIntegrationDemo;