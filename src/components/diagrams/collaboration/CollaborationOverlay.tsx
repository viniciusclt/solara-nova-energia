// ============================================================================
// CollaborationOverlay - Overlay de colaboração em tempo real
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MousePointer, Eye, Edit3, MessageSquare } from 'lucide-react';
import type { CollaborationUser, UserPresence } from '@/types/collaboration';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CollaborationOverlayProps {
  users: CollaborationUser[];
  currentUserId: string;
  userPresence: Map<string, UserPresence>;
  onCursorMove?: (position: { x: number; y: number }) => void;
  className?: string;
  showUserList?: boolean;
  showCursors?: boolean;
  showSelections?: boolean;
}

interface UserCursorProps {
  user: CollaborationUser;
  presence: UserPresence;
  color: string;
}

interface UserSelectionProps {
  user: CollaborationUser;
  presence: UserPresence;
  color: string;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Cursor de usuário colaborativo
 */
const UserCursor: React.FC<UserCursorProps> = ({ user, presence, color }) => {
  if (!presence.cursor.visible) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: presence.cursor.x,
        top: presence.cursor.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor pointer */}
      <div className="relative">
        <MousePointer 
          className="h-5 w-5 drop-shadow-lg" 
          style={{ color, fill: color }}
        />
        
        {/* User label */}
        <div 
          className="absolute top-6 left-0 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap max-w-32 truncate"
          style={{ backgroundColor: color }}
        >
          {user.name}
          {presence.isTyping && (
            <span className="ml-1 animate-pulse">✏️</span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Seleção de usuário colaborativo
 */
const UserSelection: React.FC<UserSelectionProps> = ({ user, presence, color }) => {
  if (presence.selection.nodes.length === 0 && presence.selection.edges.length === 0) {
    return null;
  }

  return (
    <>
      {/* Renderizar seleções de nós */}
      {presence.selection.nodes.map(nodeId => (
        <div
          key={`selection-node-${user.id}-${nodeId}`}
          className="absolute pointer-events-none z-40"
          style={{
            border: `2px solid ${color}`,
            borderRadius: '4px',
            backgroundColor: `${color}20`,
            // Posição seria calculada baseada no nó real
          }}
        >
          <div 
            className="absolute -top-6 left-0 px-1 py-0.5 text-xs text-white rounded text-nowrap"
            style={{ backgroundColor: color }}
          >
            {user.name}
          </div>
        </div>
      ))}
      
      {/* Renderizar seleções de arestas */}
      {presence.selection.edges.map(edgeId => (
        <div
          key={`selection-edge-${user.id}-${edgeId}`}
          className="absolute pointer-events-none z-40"
          style={{
            border: `2px solid ${color}`,
            // Posição seria calculada baseada na aresta real
          }}
        />
      ))}
    </>
  );
};

/**
 * Lista de usuários online
 */
const UserList: React.FC<{
  users: CollaborationUser[];
  currentUserId: string;
  getUserColor: (userId: string) => string;
}> = ({ users, currentUserId, getUserColor }) => {
  const onlineUsers = users.filter(u => u.isOnline && u.id !== currentUserId);
  
  if (onlineUsers.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-3 min-w-48">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {onlineUsers.length} online
          </span>
        </div>
        
        <div className="space-y-2">
          {onlineUsers.map(user => {
            const color = getUserColor(user.id);
            return (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-50">
                      <div 
                        className="w-3 h-3 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {user.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs h-5"
                        style={{ borderColor: color, color }}
                      >
                        {user.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                        {user.role === 'editor' && <Edit3 className="h-3 w-3 mr-1" />}
                        {user.role === 'viewer' && <Eye className="h-3 w-3 mr-1" />}
                        {user.role === 'commenter' && <MessageSquare className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Última atividade: {user.lastSeen.toLocaleTimeString()}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CollaborationOverlay: React.FC<CollaborationOverlayProps> = ({
  users,
  currentUserId,
  userPresence,
  onCursorMove,
  className,
  showUserList = true,
  showCursors = true,
  showSelections = true
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Gerar cor consistente para usuário
  const getUserColor = useCallback((userId: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Capturar movimento do mouse
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    setMousePosition(position);
    onCursorMove?.(position);
  }, [onCursorMove]);

  // Filtrar usuários online (exceto o atual)
  const otherUsers = users.filter(u => u.isOnline && u.id !== currentUserId);

  return (
    <div 
      ref={overlayRef}
      className={cn(
        "absolute inset-0 pointer-events-none",
        className
      )}
      onMouseMove={handleMouseMove}
      style={{ pointerEvents: 'none' }}
    >
      {/* Cursores de outros usuários */}
      {showCursors && otherUsers.map(user => {
        const presence = userPresence.get(user.id);
        if (!presence) return null;
        
        return (
          <UserCursor
            key={`cursor-${user.id}`}
            user={user}
            presence={presence}
            color={getUserColor(user.id)}
          />
        );
      })}

      {/* Seleções de outros usuários */}
      {showSelections && otherUsers.map(user => {
        const presence = userPresence.get(user.id);
        if (!presence) return null;
        
        return (
          <UserSelection
            key={`selection-${user.id}`}
            user={user}
            presence={presence}
            color={getUserColor(user.id)}
          />
        );
      })}

      {/* Lista de usuários online */}
      {showUserList && (
        <div style={{ pointerEvents: 'auto' }}>
          <UserList 
            users={users}
            currentUserId={currentUserId}
            getUserColor={getUserColor}
          />
        </div>
      )}
    </div>
  );
};

export default CollaborationOverlay;