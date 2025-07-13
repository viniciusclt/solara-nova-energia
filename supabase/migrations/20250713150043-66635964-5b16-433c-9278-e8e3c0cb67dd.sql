-- Update the user viniciusclt@hotmail.com to be super_admin
UPDATE public.profiles 
SET access_type = 'super_admin'::user_access_type 
WHERE email = 'viniciusclt@hotmail.com';

-- Also ensure we have a profile for this user if it doesn't exist
INSERT INTO public.profiles (id, email, name, access_type)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Super Admin'),
  'super_admin'::user_access_type
FROM auth.users au
WHERE au.email = 'viniciusclt@hotmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'viniciusclt@hotmail.com')
ON CONFLICT (id) DO UPDATE SET 
  access_type = 'super_admin'::user_access_type;