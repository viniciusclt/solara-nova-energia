-- Create inverters table
CREATE TABLE IF NOT EXISTS public.inverters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  power NUMERIC NOT NULL,
  
  -- DC specifications
  max_dc_power NUMERIC NOT NULL,
  max_dc_voltage NUMERIC NOT NULL,
  startup_voltage NUMERIC NOT NULL,
  nominal_dc_voltage NUMERIC NOT NULL,
  max_dc_current NUMERIC NOT NULL,
  mppt_channels INTEGER NOT NULL,
  max_inputs_per_mppt INTEGER NOT NULL,
  
  -- AC specifications
  nominal_ac_power NUMERIC NOT NULL,
  max_ac_power NUMERIC NOT NULL,
  nominal_ac_voltage NUMERIC NOT NULL,
  ac_voltage_range TEXT NOT NULL,
  nominal_frequency NUMERIC NOT NULL,
  frequency_range TEXT NOT NULL,
  phases INTEGER NOT NULL,
  max_ac_current NUMERIC NOT NULL,
  power_factor NUMERIC NOT NULL,
  
  -- Efficiency
  max_efficiency NUMERIC NOT NULL,
  european_efficiency NUMERIC NOT NULL,
  mppt_efficiency NUMERIC NOT NULL,
  
  -- Protections
  protections TEXT[] NOT NULL,
  
  -- Physical and environmental specifications
  dimensions JSONB NOT NULL,
  weight NUMERIC NOT NULL,
  operating_temperature TEXT NOT NULL,
  storage_temperature TEXT NOT NULL,
  humidity TEXT NOT NULL,
  altitude NUMERIC NOT NULL,
  cooling_method TEXT NOT NULL,
  enclosure_rating TEXT NOT NULL,
  
  -- Warranties and life
  product_warranty INTEGER NOT NULL,
  performance_warranty INTEGER NOT NULL,
  design_life INTEGER NOT NULL,
  
  -- Certifications and communication
  certifications TEXT[] NOT NULL,
  communication_interfaces TEXT[] NOT NULL,
  monitoring_capability BOOLEAN NOT NULL,
  
  -- Others
  topology TEXT NOT NULL,
  display_type TEXT NOT NULL,
  datasheet TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Add RLS policies
ALTER TABLE public.inverters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" 
  ON public.inverters 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert for authenticated users" 
  ON public.inverters 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
  ON public.inverters 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
  ON public.inverters 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE TRIGGER update_inverters_updated_at
BEFORE UPDATE ON public.inverters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_inverters_name ON public.inverters(name);
CREATE INDEX idx_inverters_manufacturer ON public.inverters(manufacturer);
CREATE INDEX idx_inverters_power ON public.inverters(power);
CREATE INDEX idx_inverters_active ON public.inverters(active);