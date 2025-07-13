
-- Ensure the enums exist, create them if they don't
DO $$
BEGIN
    -- Create user_access_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_access_type') THEN
        CREATE TYPE user_access_type AS ENUM ('vendedor', 'engenheiro', 'admin', 'super_admin');
    END IF;
    
    -- Create subscription_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('ativa', 'expirada', 'gratuita', 'cancelada');
    END IF;
END
$$;

-- Drop and recreate the handle_new_user function with proper error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, name, access_type)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'vendedor'::user_access_type
    );
    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error and still return NEW to allow user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
  END;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
