import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserAccessType } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAccess?: UserAccessType[];
  requiresSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredAccess,
  requiresSubscription = true 
}) => {
  const { user, profile, loading, isSubscriptionActive } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertDescription className="space-y-4">
            <p>Erro ao carregar perfil do usuário. Tente fazer logout e login novamente.</p>
            <Button 
              onClick={() => supabase.auth.signOut()} 
              variant="outline" 
              className="w-full"
            >
              Fazer Logout
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check access level requirement
  if (requiredAccess && !requiredAccess.includes(profile.access_type)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check subscription requirement
  if (requiresSubscription && !isSubscriptionActive && profile.access_type !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            Sua assinatura expirou ou não está ativa. Entre em contato com o administrador da empresa.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};