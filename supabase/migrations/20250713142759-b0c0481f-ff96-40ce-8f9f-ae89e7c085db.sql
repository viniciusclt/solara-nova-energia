-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;

-- Create correct RLS policies without recursion
CREATE POLICY "Enable read access for authenticated users to own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Enable insert access for authenticated users to own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for authenticated users to own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow admins and super_admins to view all profiles in their company
CREATE POLICY "Enable admin read access to company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.access_type IN ('admin', 'super_admin')
    AND (
      admin_profile.access_type = 'super_admin' 
      OR admin_profile.company_id = profiles.company_id
    )
  )
);