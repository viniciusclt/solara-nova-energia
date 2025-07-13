import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserAccessType } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

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

  if (!user || !profile) {
    return null;
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