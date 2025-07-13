-- Security Fix Migration: Privilege Escalation and Enhanced Security

-- 1. CRITICAL FIX: Prevent users from changing their own access_type
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create restricted policy that prevents access_type changes
CREATE POLICY "Users can update their own profile (restricted)" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND (
    -- Prevent changing access_type
    access_type = (SELECT access_type FROM public.profiles WHERE id = auth.uid())
  )
);

-- 2. Create secure admin-only role change function
CREATE OR REPLACE FUNCTION public.change_user_access_type(
  target_user_id UUID,
  new_access_type user_access_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_access_type user_access_type;
  old_access_type user_access_type;
  admin_company_id UUID;
  target_company_id UUID;
BEGIN
  -- Get admin's access type and company
  SELECT access_type, company_id INTO admin_access_type, admin_company_id
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Only admins and super_admins can change roles
  IF admin_access_type NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to change user access type';
  END IF;
  
  -- Get target user's current access type and company
  SELECT access_type, company_id INTO old_access_type, target_company_id
  FROM public.profiles 
  WHERE id = target_user_id;
  
  IF old_access_type IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Super admins can change anyone, regular admins only within their company
  IF admin_access_type = 'admin' AND (admin_company_id != target_company_id OR admin_company_id IS NULL) THEN
    RAISE EXCEPTION 'Can only change access type for users in your company';
  END IF;
  
  -- Regular admins cannot promote to admin or super_admin
  IF admin_access_type = 'admin' AND new_access_type IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Cannot promote users to admin level or above';
  END IF;
  
  -- Update the access type
  UPDATE public.profiles 
  SET access_type = new_access_type, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the change in audit_logs
  INSERT INTO public.audit_logs (
    user_id, 
    action, 
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'access_type_changed',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_access_type', old_access_type,
      'new_access_type', new_access_type,
      'admin_id', auth.uid()
    ),
    inet_client_addr()
  );
  
  RETURN TRUE;
END;
$$;

-- 3. Enhanced input validation functions
CREATE OR REPLACE FUNCTION public.validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove non-numeric characters
  cnpj := regexp_replace(cnpj, '[^0-9]', '', 'g');
  
  -- Check length
  IF length(cnpj) != 14 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for known invalid patterns
  IF cnpj IN ('00000000000000', '11111111111111', '22222222222222', 
              '33333333333333', '44444444444444', '55555555555555',
              '66666666666666', '77777777777777', '88888888888888', 
              '99999999999999') THEN
    RETURN FALSE;
  END IF;
  
  -- Basic CNPJ validation would go here (simplified for now)
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- 4. Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  event_details JSONB DEFAULT '{}'::jsonb,
  target_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    event_type,
    event_details || jsonb_build_object(
      'timestamp', extract(epoch from now()),
      'target_user_id', target_user_id,
      'session_id', current_setting('request.jwt.claims', true)::jsonb->>'session_id'
    ),
    inet_client_addr()
  );
END;
$$;

-- 5. Add constraints to prevent data integrity issues
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_format_check 
CHECK (validate_email(email));

-- 6. Create policy for the new admin function access
CREATE POLICY "Admins can use role change function" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND access_type IN ('admin', 'super_admin')
  )
);

-- 7. Enhanced audit log policies for better security
DROP POLICY IF EXISTS "All authenticated users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert audit logs (validated)" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
  AND action IS NOT NULL
  AND length(action) <= 100
);

-- 8. Add trigger for automatic security event logging on profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log access_type changes (should only happen through admin function now)
  IF OLD.access_type != NEW.access_type THEN
    PERFORM public.log_security_event(
      'unauthorized_access_type_change',
      jsonb_build_object(
        'old_access_type', OLD.access_type,
        'new_access_type', NEW.access_type,
        'profile_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_security_log_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();