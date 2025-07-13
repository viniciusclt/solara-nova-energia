-- Create leads table for storing imported data
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  rg TEXT,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  address JSONB,
  concessionaria TEXT,
  grupo TEXT,
  tipo_fornecimento TEXT,
  cdd INTEGER,
  tensao_alimentacao TEXT,
  modalidade_tarifaria TEXT,
  numero_cliente TEXT,
  numero_instalacao TEXT,
  consumo_mensal JSONB, -- Array de 12 valores
  consumo_medio NUMERIC,
  incremento_consumo NUMERIC,
  comentarios TEXT,
  source TEXT DEFAULT 'manual', -- manual, google_sheets, etc
  source_ref TEXT, -- Reference to original source
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import logs table
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  source_type TEXT NOT NULL, -- google_sheets, excel, etc
  source_url TEXT,
  total_records INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  error_details JSONB,
  import_settings JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress' -- in_progress, completed, failed
);

-- Create settings table for Google Sheets and other integrations
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  integration_type TEXT NOT NULL, -- google_sheets, zapier, etc
  settings JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, integration_type)
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view company leads" 
ON public.leads 
FOR SELECT 
USING (
  company_id = get_current_user_company_id() OR 
  get_current_user_access_type() = 'super_admin'::user_access_type
);

CREATE POLICY "Users can insert company leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  company_id = get_current_user_company_id()
);

CREATE POLICY "Users can update company leads" 
ON public.leads 
FOR UPDATE 
USING (
  company_id = get_current_user_company_id() OR 
  get_current_user_access_type() = 'super_admin'::user_access_type
);

CREATE POLICY "Admins can delete company leads" 
ON public.leads 
FOR DELETE 
USING (
  company_id = get_current_user_company_id() AND
  get_current_user_access_type() = ANY(ARRAY['admin'::user_access_type, 'super_admin'::user_access_type])
);

-- RLS Policies for import_logs
CREATE POLICY "Users can view company import logs" 
ON public.import_logs 
FOR SELECT 
USING (
  company_id = get_current_user_company_id() OR 
  get_current_user_access_type() = 'super_admin'::user_access_type
);

CREATE POLICY "Users can insert import logs" 
ON public.import_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  company_id = get_current_user_company_id()
);

CREATE POLICY "Users can update their import logs" 
ON public.import_logs 
FOR UPDATE 
USING (
  user_id = auth.uid() AND 
  company_id = get_current_user_company_id()
);

-- RLS Policies for integration_settings
CREATE POLICY "Users can view company integration settings" 
ON public.integration_settings 
FOR SELECT 
USING (
  company_id = get_current_user_company_id() OR 
  get_current_user_access_type() = 'super_admin'::user_access_type
);

CREATE POLICY "Admins can manage integration settings" 
ON public.integration_settings 
FOR ALL
USING (
  company_id = get_current_user_company_id() AND
  get_current_user_access_type() = ANY(ARRAY['admin'::user_access_type, 'super_admin'::user_access_type])
);

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();