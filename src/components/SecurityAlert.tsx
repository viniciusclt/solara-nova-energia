import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityAlertProps {
  onSecurityIssue?: (issue: string) => void;
}

export const SecurityAlert = ({ onSecurityIssue }: SecurityAlertProps) => {
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'warning' | 'alert'>('secure');
  const [alertMessage, setAlertMessage] = useState('');
  const { user, profile } = useAuth();

  useEffect(() => {
    const checkSecurityStatus = () => {
      const issues: string[] = [];

      // Check for admin users without company association
      if (profile?.access_type === 'admin' && !profile.company_id) {
        issues.push('Admin user without company association detected');
      }

      // Check session age (warn after 8 hours)
      const lastLogin = profile?.last_login;
      if (lastLogin) {
        const sessionAge = Date.now() - new Date(lastLogin).getTime();
        const eightHours = 8 * 60 * 60 * 1000;
        if (sessionAge > eightHours) {
          issues.push('Long session detected - consider re-authentication');
        }
      }

      // Check for suspicious URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const suspiciousParams = ['admin', 'debug', 'test', 'api_key'];
      const foundSuspicious = suspiciousParams.some(param => urlParams.has(param));
      if (foundSuspicious) {
        issues.push('Suspicious URL parameters detected');
      }

      if (issues.length > 0) {
        setSecurityStatus(issues.length > 1 ? 'alert' : 'warning');
        setAlertMessage(issues[0]);
        onSecurityIssue?.(issues.join(', '));
      } else {
        setSecurityStatus('secure');
        setAlertMessage('');
      }
    };

    if (user && profile) {
      checkSecurityStatus();
    }
  }, [user, profile, onSecurityIssue]);

  if (securityStatus === 'secure') {
    return null;
  }

  return (
    <Alert variant={securityStatus === 'alert' ? 'destructive' : 'default'} className="mb-4">
      {securityStatus === 'alert' ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Shield className="h-4 w-4" />
      )}
      <AlertDescription>
        {alertMessage}
      </AlertDescription>
    </Alert>
  );
};