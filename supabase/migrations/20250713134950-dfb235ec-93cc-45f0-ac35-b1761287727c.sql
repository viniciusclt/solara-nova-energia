-- Create the user_access_type enum
CREATE TYPE user_access_type AS ENUM ('vendedor', 'engenheiro', 'admin', 'super_admin');

-- Create the subscription_status enum  
CREATE TYPE subscription_status AS ENUM ('ativa', 'expirada', 'gratuita', 'cancelada');