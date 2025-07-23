-- Create solar_modules table
CREATE TABLE IF NOT EXISTS public.solar_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  power NUMERIC NOT NULL,
  
  -- Electrical specifications
  voc NUMERIC NOT NULL,
  isc NUMERIC NOT NULL,
  vmp NUMERIC NOT NULL,
  imp NUMERIC NOT NULL,
  efficiency NUMERIC NOT NULL,
  
  -- Temperature coefficients
  temp_coeff_pmax NUMERIC NOT NULL,
  temp_coeff_voc NUMERIC NOT NULL,
  temp_coeff_isc NUMERIC NOT NULL,
  
  -- Physical dimensions
  length NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  thickness NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  area NUMERIC NOT NULL,
  
  -- Technology and characteristics
  cell_type TEXT NOT NULL,
  cell_count INTEGER NOT NULL,
  technology TEXT[] NOT NULL,
  
  -- Warranties
  product_warranty INTEGER NOT NULL,
  performance_warranty JSONB NOT NULL,
  
  -- Certifications and others
  certifications TEXT[] NOT NULL,
  datasheet TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Add RLS policies
ALTER TABLE public.solar_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" 
  ON public.solar_modules 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert for authenticated users" 
  ON public.solar_modules 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
  ON public.solar_modules 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
  ON public.solar_modules 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_solar_modules_updated_at
BEFORE UPDATE ON public.solar_modules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_solar_modules_name ON public.solar_modules(name);
CREATE INDEX idx_solar_modules_manufacturer ON public.solar_modules(manufacturer);
CREATE INDEX idx_solar_modules_power ON public.solar_modules(power);
CREATE INDEX idx_solar_modules_active ON public.solar_modules(active);