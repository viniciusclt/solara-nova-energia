-- Create financial_kits table
CREATE TABLE IF NOT EXISTS financial_kits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  potencia DECIMAL(10,2) NOT NULL CHECK (potencia > 0),
  preco DECIMAL(12,2) NOT NULL CHECK (preco > 0),
  preco_wp DECIMAL(10,4) NOT NULL CHECK (preco_wp > 0),
  fabricante VARCHAR(255),
  categoria VARCHAR(100),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_financial_kits_ativo ON financial_kits(ativo);
CREATE INDEX IF NOT EXISTS idx_financial_kits_categoria ON financial_kits(categoria);
CREATE INDEX IF NOT EXISTS idx_financial_kits_potencia ON financial_kits(potencia);

-- Add RLS (Row Level Security)
ALTER TABLE financial_kits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all kits
CREATE POLICY "Allow authenticated users to read financial kits" ON financial_kits
  FOR SELECT TO authenticated USING (true);

-- Create policy to allow authenticated users to insert kits
CREATE POLICY "Allow authenticated users to insert financial kits" ON financial_kits
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create policy to allow authenticated users to update kits
CREATE POLICY "Allow authenticated users to update financial kits" ON financial_kits
  FOR UPDATE TO authenticated USING (true);

-- Create policy to allow authenticated users to delete kits
CREATE POLICY "Allow authenticated users to delete financial kits" ON financial_kits
  FOR DELETE TO authenticated USING (true);

-- Insert some default kits
INSERT INTO financial_kits (nome, potencia, preco, preco_wp, fabricante, categoria, descricao) VALUES
('Kit 5.4kWp - Astronergy', 5.4, 15500, 2.87, 'Astronergy', 'Residencial', 'Kit completo para residência pequena'),
('Kit 7.2kWp - Canadian', 7.2, 18500, 2.57, 'Canadian Solar', 'Residencial', 'Kit padrão residencial'),
('Kit 8.4kWp - Jinko', 8.4, 22000, 2.62, 'Jinko Solar', 'Residencial', 'Kit residencial premium'),
('Kit 9.6kWp - Trina', 9.6, 25500, 2.66, 'Trina Solar', 'Residencial', 'Kit residencial de alta potência'),
('Kit 10.8kWp - LONGi', 10.8, 28200, 2.61, 'LONGi Solar', 'Comercial', 'Kit para pequeno comércio'),
('Kit 15.6kWp - JA Solar', 15.6, 38500, 2.47, 'JA Solar', 'Comercial', 'Kit comercial médio porte'),
('Kit 20.4kWp - Trina', 20.4, 48200, 2.36, 'Trina Solar', 'Industrial', 'Kit para indústria pequena');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_financial_kits_updated_at 
    BEFORE UPDATE ON financial_kits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();