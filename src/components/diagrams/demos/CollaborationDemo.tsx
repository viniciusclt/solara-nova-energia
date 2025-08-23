// ============================================================================
// CollaborationDemo - Demonstração do sistema de colaboração em tempo real
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  UserMinus,
  Wifi,
  WifiOff,
  MousePointer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit3,
  Crown
} from 'lucide-react';
import { useCollaboration, useCollaborationIndicators } from '@/hooks/useCollaboration';
import type { CollaborationUser, Conflict } from '@/services/collaboration/types';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface CollaborationDemoProps {
  diagramId?: string;
  className?: string;
}

interface UserCardProps {
  user: CollaborationUser;
  isCurrentUser?: boolean;
  onRemove?: (userId: string) => void;
  onUpdateRole?: (userId: string, role: 'editor' | 'viewer') => void;
}

interface ConflictCardProps {
  conflict: Conflict;
  onResolve: (conflictId: string, resolution: 'accept' | 'reject' | 'merge') => void;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  isCurrentUser = false, 
  onRemove, 
  onUpdateRole 
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'editor': return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div 
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
              getStatusColor(user.status)
            }`}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium truncate">
              {user.name}
              {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(você)</span>}
            </p>
            {getRoleIcon(user.role)}
          </div>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            Última atividade: {user.lastSeen.toLocaleTimeString()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge variant={user.status === 'online' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
        
        {!isCurrentUser && onUpdateRole && (
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateRole(user.id, user.role === 'editor' ? 'viewer' : 'editor')}
            >
              {user.role === 'editor' ? 'Tornar Viewer' : 'Tornar Editor'}
            </Button>
          </div>
        )}
        
        {!isCurrentUser && onRemove && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemove(user.id)}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const ConflictCard: React.FC<ConflictCardProps> = ({ conflict, onResolve }) => {
  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'concurrent_edit': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'version_mismatch': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'permission_denied': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {getConflictIcon(conflict.type)}
          <div className="flex-1">
            <p className="text-sm font-medium">Conflito detectado</p>
            <p className="text-xs text-muted-foreground">
              Tipo: {conflict.type} • {conflict.timestamp.toLocaleTimeString()}
            </p>
            {conflict.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {conflict.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(conflict.id, 'accept')}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(conflict.id, 'reject')}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(conflict.id, 'merge')}
          >
            Mesclar
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CollaborationDemo: React.FC<CollaborationDemoProps> = ({ 
  diagramId = 'demo-diagram-001',
  className = ''
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  
  // Hooks de colaboração
  const collaboration = useCollaboration({
    diagramId,
    autoResolveConflicts: false,
    enableCursorBroadcast: true,
    enablePresence: true,
    syncInterval: 1000
  });
  
  const indicators = useCollaborationIndicators(diagramId);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleConnect = useCallback(async () => {
    try {
      await collaboration.connect();
      toast.success('Conectado à colaboração!');
    } catch (error) {
      toast.error('Erro ao conectar à colaboração');
    }
  }, [collaboration]);
  
  const handleDisconnect = useCallback(() => {
    collaboration.disconnect();
    toast.info('Desconectado da colaboração');
  }, [collaboration]);
  
  const handleInviteUser = useCallback(async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido');
      return;
    }
    
    try {
      await collaboration.inviteUser(inviteEmail, inviteRole);
      setInviteEmail('');
      toast.success(`Convite enviado para ${inviteEmail}`);
    } catch (error) {
      toast.error('Erro ao enviar convite');
    }
  }, [collaboration, inviteEmail, inviteRole]);
  
  const handleRemoveUser = useCallback(async (userId: string) => {
    try {
      await collaboration.removeUser(userId);
      toast.success('Usuário removido da colaboração');
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  }, [collaboration]);
  
  const handleUpdateUserRole = useCallback(async (userId: string, role: 'editor' | 'viewer') => {
    try {
      await collaboration.updateUserRole(userId, role);
      toast.success('Papel do usuário atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar papel do usuário');
    }
  }, [collaboration]);
  
  const handleResolveConflict = useCallback((conflictId: string, resolution: 'accept' | 'reject' | 'merge') => {
    collaboration.resolveConflict(conflictId, resolution);
    toast.success(`Conflito resolvido: ${resolution}`);
  }, [collaboration]);
  
  const handleResolveAllConflicts = useCallback((resolution: 'accept' | 'reject' | 'merge') => {
    collaboration.resolveAllConflicts(resolution);
    toast.success(`Todos os conflitos resolvidos: ${resolution}`);
  }, [collaboration]);
  
  // Simular movimento do cursor
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (collaboration.isConnected) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      collaboration.broadcastCursor({ x, y });
    }
  }, [collaboration]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Colaboração em Tempo Real</span>
            <Badge variant={collaboration.isConnected ? 'default' : 'secondary'}>
              {collaboration.isConnected ? (
                <><Wifi className="h-3 w-3 mr-1" />Conectado</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" />Desconectado</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleConnect} 
              disabled={collaboration.isConnected}
              variant="default"
            >
              Conectar
            </Button>
            <Button 
              onClick={handleDisconnect} 
              disabled={!collaboration.isConnected}
              variant="outline"
            >
              Desconectar
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Diagrama ID: {diagramId}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Versão: {collaboration.version}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Última sincronização: {collaboration.lastSync.toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Área de demonstração com cursors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MousePointer className="h-5 w-5" />
            <span>Área de Demonstração</span>
            <Badge variant="outline">
              {indicators.cursors.length} cursor{indicators.cursors.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="relative h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
            onMouseMove={handleMouseMove}
          >
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Mova o mouse aqui para demonstrar cursors colaborativos
            </div>
            
            {/* Render cursors de outros usuários */}
            {indicators.cursors.map(({ userId, position, user, color }) => (
              <div
                key={userId}
                className="absolute pointer-events-none z-10"
                style={{
                  left: position.x,
                  top: position.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: color }}
                />
                <div 
                  className="absolute top-5 left-0 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: color }}
                >
                  {user?.name || 'Usuário'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Usuários conectados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Usuários Conectados</span>
              <Badge variant="outline">
                {collaboration.activeUsers.length} online
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Email do usuário"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-48"
              />
              <select 
                value={inviteRole} 
                onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <Button onClick={handleInviteUser} size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Convidar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {collaboration.users.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum usuário conectado
                </div>
              ) : (
                collaboration.users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isCurrentUser={user.id === collaboration.currentUser?.id}
                    onRemove={collaboration.canEdit ? handleRemoveUser : undefined}
                    onUpdateRole={collaboration.canEdit ? handleUpdateUserRole : undefined}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Conflitos */}
      {collaboration.pendingConflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Conflitos Pendentes</span>
                <Badge variant="destructive">
                  {collaboration.pendingConflicts.length}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleResolveAllConflicts('accept')}
                >
                  Aceitar Todos
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleResolveAllConflicts('reject')}
                >
                  Rejeitar Todos
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {collaboration.pendingConflicts.map((conflict) => (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  onResolve={handleResolveConflict}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas da Colaboração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {collaboration.users.length}
              </div>
              <div className="text-sm text-muted-foreground">Usuários Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {collaboration.activeUsers.length}
              </div>
              <div className="text-sm text-muted-foreground">Usuários Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {collaboration.changes.length}
              </div>
              <div className="text-sm text-muted-foreground">Mudanças Sincronizadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {collaboration.conflicts.length}
              </div>
              <div className="text-sm text-muted-foreground">Conflitos Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborationDemo;