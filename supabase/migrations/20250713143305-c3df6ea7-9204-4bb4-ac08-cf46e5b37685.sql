-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_access_type()
RETURNS user_access_type AS $$
  SELECT access_type FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can use role change function" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can insert team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can update team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable admin read access to company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for authenticated users to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (restricted)" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Allow users to read own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow super admins to see all profiles
CREATE POLICY "Allow super admins to view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_access_type() = 'super_admin');

-- Allow admins to see profiles in their company
CREATE POLICY "Allow admins to view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.get_current_user_access_type() IN ('admin', 'super_admin') 
  AND company_id = public.get_current_user_company_id()
);