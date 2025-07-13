import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserAccessType } from '@/contexts/AuthContext';

export const useSecureRoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const changeUserAccessType = async (
    targetUserId: string, 
    newAccessType: UserAccessType
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('change_user_access_type', {
        target_user_id: targetUserId,
        new_access_type: newAccessType
      });

      if (error) {
        toast({
          title: "Erro ao alterar permissão",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Permissão alterada",
        description: "Nível de acesso do usuário foi atualizado com sucesso",
        variant: "default",
      });

      return { success: true };
    } catch (error) {
      const errorMessage = "Erro interno ao alterar permissão";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const validateRoleChangePermission = async (
    currentUserAccessType: UserAccessType,
    targetAccessType: UserAccessType
  ): Promise<{ canChange: boolean; reason?: string }> => {
    // Super admins can change anything
    if (currentUserAccessType === 'super_admin') {
      return { canChange: true };
    }

    // Regular admins cannot promote to admin or super_admin
    if (currentUserAccessType === 'admin' && 
        ['admin', 'super_admin'].includes(targetAccessType)) {
      return { 
        canChange: false, 
        reason: 'Você não pode promover usuários para administrador ou super administrador' 
      };
    }

    // Admins can change vendedor and engenheiro roles
    if (currentUserAccessType === 'admin' && 
        ['vendedor', 'engenheiro'].includes(targetAccessType)) {
      return { canChange: true };
    }

    // Non-admins cannot change roles
    return { 
      canChange: false, 
      reason: 'Você não tem permissão para alterar níveis de acesso' 
    };
  };

  return {
    changeUserAccessType,
    validateRoleChangePermission,
    loading
  };
};