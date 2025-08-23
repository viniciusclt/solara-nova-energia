// ============================================================================
// useRBACPermissions Hook - Gerenciamento de permissões RBAC para diagramas
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { diagramService } from '@/services/DiagramServiceFactory';
import { secureLogger } from '@/utils/secureLogger';
import type { UserAccessType } from '@/contexts/AuthContext';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type DiagramPermission = 'owner' | 'editor' | 'viewer' | 'commenter' | 'none';

// Padrão de convite: novos colaboradores entram como viewer
export const DEFAULT_INVITE_PERMISSION: DiagramPermission = 'viewer';

export interface RBACPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
  canComment: boolean;
  canManageCollaborators: boolean;
  canCreateTemplates: boolean;
  canAccessAdvancedFeatures: boolean;
}

export interface UseRBACPermissionsOptions {
  diagramId?: string;
  ownerId?: string;
  enableRealTimeUpdates?: boolean;
}

export interface RBACState {
  permissions: RBACPermissions;
  userRole: DiagramPermission;
  accessType: UserAccessType | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// CONFIGURAÇÕES DE PERMISSÕES POR TIPO DE USUÁRIO
// ============================================================================

const getBasePermissionsByAccessType = (accessType: UserAccessType): Partial<RBACPermissions> => {
  switch (accessType) {
    case 'super_admin':
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        canExport: true,
        canComment: true,
        canManageCollaborators: true,
        canCreateTemplates: true,
        canAccessAdvancedFeatures: true
      };
    
    case 'admin':
      return {
        canView: true,
        canEdit: true,
        canDelete: false,
        canShare: true,
        canExport: true,
        canComment: true,
        // Ajuste: admin pode gerenciar colaboradores
        canManageCollaborators: true,
        canCreateTemplates: true,
        canAccessAdvancedFeatures: true
      };
    
    case 'engenheiro':
      return {
        canView: true,
        canEdit: true,
        // Ajuste: engenheiro pode deletar
        canDelete: true,
        canShare: true,
        canExport: true,
        canComment: true,
        canManageCollaborators: false,
        canCreateTemplates: true,
        canAccessAdvancedFeatures: true
      };
    
    case 'vendedor':
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canExport: false,
        canComment: true,
        canManageCollaborators: false,
        canCreateTemplates: false,
        canAccessAdvancedFeatures: false
      };

    case 'instalador':
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canExport: false,
        canComment: true,
        canManageCollaborators: false,
        canCreateTemplates: false,
        canAccessAdvancedFeatures: false
      };
    
    default:
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canExport: false,
        canComment: false,
        canManageCollaborators: false,
        canCreateTemplates: false,
        canAccessAdvancedFeatures: false
      };
  }
};

const getPermissionsByRole = (role: DiagramPermission, basePermissions: Partial<RBACPermissions>): RBACPermissions => {
  const defaultPermissions: RBACPermissions = {
    canView: false,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canExport: false,
    canComment: false,
    canManageCollaborators: false,
    canCreateTemplates: false,
    canAccessAdvancedFeatures: false
  };

  switch (role) {
    case 'owner':
      return {
        ...defaultPermissions,
        ...basePermissions,
        canEdit: true,
        canDelete: true,
        canManageCollaborators: true
      };
    
    case 'editor':
      return {
        ...defaultPermissions,
        ...basePermissions,
        canEdit: true,
        canDelete: false,
        // Admins continuam podendo gerenciar colaboradores mesmo se forem apenas editores
        canManageCollaborators: basePermissions.canManageCollaborators || false
      };
    
    case 'viewer':
      return {
        ...defaultPermissions,
        canView: true,
        canExport: basePermissions.canExport || false,
        canComment: basePermissions.canComment || false,
        // Admins podem gerenciar colaboradores mesmo como viewers
        canManageCollaborators: basePermissions.canManageCollaborators || false
      };
    
    case 'commenter':
      return {
        ...defaultPermissions,
        canView: true,
        canComment: true,
        canExport: basePermissions.canExport || false,
        // Admins podem gerenciar colaboradores mesmo como commenters
        canManageCollaborators: basePermissions.canManageCollaborators || false
      };
    
    case 'none':
    default:
      return defaultPermissions;
  }
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useRBACPermissions = (options: UseRBACPermissionsOptions = {}) => {
  const { user } = useAuth();
  const { diagramId, ownerId, enableRealTimeUpdates = false } = options;
  
  const [state, setState] = useState<RBACState>({
    permissions: {
      canView: false,
      canEdit: false,
      canDelete: false,
      canShare: false,
      canExport: false,
      canComment: false,
      canManageCollaborators: false,
      canCreateTemplates: false,
      canAccessAdvancedFeatures: false
    },
    userRole: 'none',
    accessType: null,
    isLoading: true,
    error: null
  });

  // ============================================================================
  // FUNÇÕES DE VERIFICAÇÃO DE PERMISSÕES
  // ============================================================================

  const checkDiagramPermission = useCallback(async (diagramId: string): Promise<DiagramPermission> => {
    try {
      if (!user) return 'none';
      
      const diagram = await diagramService.getDiagram(diagramId);
      if (!diagram) return 'none';
      
      // Verificar se é o proprietário
      if ((diagram as any).owner_id === user.id || (diagram as any).ownerId === user.id) {
        return 'owner';
      }
      
      // Verificar permissões de colaboração
      const permission = await diagramService.getUserPermission(diagramId, user.id);
      return permission || 'none';
    } catch (error) {
      secureLogger.error('Erro ao verificar permissão do diagrama', { error, diagramId });
      return 'none';
    }
  }, [user]);

  const updatePermissions = useCallback(async () => {
    if (!user) {
      setState(prev => ({
        ...prev,
        permissions: getPermissionsByRole('none', {}),
        userRole: 'none',
        accessType: null,
        isLoading: false,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const rawAccess = user.user_metadata?.access_type as string | undefined;
      const allowed: UserAccessType[] = ['super_admin', 'admin', 'engenheiro', 'vendedor', 'instalador'];
      const accessType = allowed.includes(rawAccess as UserAccessType) ? (rawAccess as UserAccessType) : null;

      // Categoria desconhecida: somente viewer
      const basePermissions = accessType
        ? getBasePermissionsByAccessType(accessType)
        : {
            canView: true,
            canEdit: false,
            canDelete: false,
            canShare: false,
            canExport: false,
            canComment: false,
            canManageCollaborators: false,
            canCreateTemplates: false,
            canAccessAdvancedFeatures: false
          };
      
      let userRole: DiagramPermission = 'viewer';
      
      if (diagramId) {
        userRole = await checkDiagramPermission(diagramId);
      } else if (ownerId && ownerId === user.id) {
        userRole = 'owner';
      }
      
      const finalPermissions = getPermissionsByRole(userRole, basePermissions);
      
      setState({
        permissions: finalPermissions,
        userRole,
        accessType,
        isLoading: false,
        error: null
      });
      
      secureLogger.info('Permissões RBAC atualizadas', {
        userId: user.id,
        accessType,
        userRole,
        diagramId,
        permissions: finalPermissions
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      secureLogger.error('Erro ao atualizar permissões RBAC', { error, userId: user?.id, diagramId });
    }
  }, [user, diagramId, ownerId, checkDiagramPermission]);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  useEffect(() => {
    updatePermissions();
  }, [updatePermissions]);

  // Atualização em tempo real (se habilitada)
  useEffect(() => {
    if (!enableRealTimeUpdates || !diagramId || !user) return;

    const interval = setInterval(() => {
      updatePermissions();
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, diagramId, user, updatePermissions]);

  // ============================================================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================================================

  const hasPermission = useCallback((permission: keyof RBACPermissions): boolean => {
    return state.permissions[permission];
  }, [state.permissions]);

  const canPerformAction = useCallback((action: string): boolean => {
    switch (action) {
      case 'create_node':
      case 'edit_node':
      case 'delete_node':
      case 'create_edge':
      case 'edit_edge':
      case 'delete_edge':
        return hasPermission('canEdit');
      
      case 'view_diagram':
        return hasPermission('canView');
      
      case 'export_diagram':
        return hasPermission('canExport');
      
      case 'share_diagram':
        return hasPermission('canShare');
      
      case 'delete_diagram':
        return hasPermission('canDelete');
      
      case 'add_comment':
        return hasPermission('canComment');
      
      case 'manage_collaborators':
        return hasPermission('canManageCollaborators');
      
      case 'create_template':
        return hasPermission('canCreateTemplates');
      
      case 'access_advanced_features':
        return hasPermission('canAccessAdvancedFeatures');
      
      default:
        return false;
    }
  }, [hasPermission]);

  const getPermissionLevel = useCallback((): 'none' | 'basic' | 'advanced' | 'full' => {
    if (state.userRole === 'owner' || state.accessType === 'super_admin') {
      return 'full';
    }
    
    if (state.userRole === 'editor' || state.accessType === 'admin') {
      return 'advanced';
    }
    
    if (state.userRole === 'viewer' || state.userRole === 'commenter') {
      return 'basic';
    }
    
    return 'none';
  }, [state.userRole, state.accessType]);

  // ============================================================================
  // MEMOIZAÇÃO
  // ============================================================================

  const memoizedPermissions = useMemo(() => state.permissions, [state.permissions]);
  
  const permissionSummary = useMemo(() => ({
    level: getPermissionLevel(),
    role: state.userRole,
    accessType: state.accessType,
    canEdit: hasPermission('canEdit'),
    canView: hasPermission('canView'),
    canDelete: hasPermission('canDelete')
  }), [state.userRole, state.accessType, hasPermission, getPermissionLevel]);

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================

  return {
    // Estado
    permissions: memoizedPermissions,
    userRole: state.userRole,
    accessType: state.accessType,
    isLoading: state.isLoading,
    error: state.error,
    
    // Funções utilitárias
    hasPermission,
    canPerformAction,
    getPermissionLevel,
    updatePermissions,
    
    // Resumo
    summary: permissionSummary
  };
};

export default useRBACPermissions;