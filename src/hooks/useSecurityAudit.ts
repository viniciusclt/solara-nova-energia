import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  event_type: string;
  event_details?: Record<string, any>;
  target_user_id?: string;
}

export const useSecurityAudit = () => {
  const [isLogging, setIsLogging] = useState(false);
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    if (!user) return;

    setIsLogging(true);
    try {
      await supabase.rpc('log_security_event', {
        event_type: event.event_type,
        event_details: event.event_details || {},
        target_user_id: event.target_user_id
      });
    } catch (error) {
      // Fail silently for security logging to avoid disrupting user experience
    } finally {
      setIsLogging(false);
    }
  }, [user]);

  const logProfileView = useCallback((profileId: string) => {
    logSecurityEvent({
      event_type: 'profile_viewed',
      event_details: { viewed_profile_id: profileId, timestamp: new Date().toISOString() }
    });
  }, [logSecurityEvent]);

  const logDataExport = useCallback((exportType: string, recordCount: number) => {
    logSecurityEvent({
      event_type: 'data_exported',
      event_details: { 
        export_type: exportType, 
        record_count: recordCount,
        timestamp: new Date().toISOString()
      }
    });
  }, [logSecurityEvent]);

  const logFailedValidation = useCallback((field: string, value: string, reason: string) => {
    logSecurityEvent({
      event_type: 'validation_failed',
      event_details: { 
        field, 
        failed_value_length: value.length,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  }, [logSecurityEvent]);

  const logSuspiciousActivity = useCallback((activityType: string, details: Record<string, any>) => {
    logSecurityEvent({
      event_type: 'suspicious_activity',
      event_details: { 
        activity_type: activityType,
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }, [logSecurityEvent]);

  const logRoleChange = useCallback((targetUserId: string, oldRole: string, newRole: string) => {
    logSecurityEvent({
      event_type: 'role_change_attempted',
      event_details: { 
        old_role: oldRole,
        new_role: newRole,
        timestamp: new Date().toISOString()
      },
      target_user_id: targetUserId
    });
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    logProfileView,
    logDataExport,
    logFailedValidation,
    logSuspiciousActivity,
    logRoleChange,
    isLogging
  };
};