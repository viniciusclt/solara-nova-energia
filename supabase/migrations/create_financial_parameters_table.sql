-- Criar tabela para armazenar parâmetros financeiros por empresa
CREATE TABLE IF NOT EXISTS public.financial_parameters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Parâmetros econômicos
  taxa_desconto_anual DECIMAL(5,4) DEFAULT 0.08, -- 8%
  inflacao_anual DECIMAL(5,4) DEFAULT 0.045, -- 4.5%
  reajuste_tarifario_anual DECIMAL(5,4) DEFAULT 0.06, -- 6%
  
  -- Parâmetros operacionais
  custo_om_anual DECIMAL(10,2) DEFAULT 200.00, -- R$ 200
  taxa_juros_financiamento DECIMAL(5,4) DEFAULT 0.12, -- 12%
  prazo_financiamento_anos INTEGER DEFAULT 15,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraint para garantir um registro por empresa
  CONSTRAINT unique_company_financial_params UNIQUE (company_id)
);

-- Habilitar RLS
ALTER TABLE public.financial_parameters ENABLE ROW LEVEL SECURITY;

-- Política para visualização - usuários podem ver parâmetros da sua empresa
CREATE POLICY "Users can view their company financial parameters" ON public.financial_parameters
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Política para inserção/atualização - apenas admins e super admins
CREATE POLICY "Admins can manage financial parameters" ON public.financial_parameters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND access_type IN ('admin', 'super_admin')
      AND (
        access_type = 'super_admin' OR 
        company_id = financial_parameters.company_id
      )
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_financial_parameters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_financial_parameters_updated_at
  BEFORE UPDATE ON public.financial_parameters
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_parameters_updated_at();

-- Inserir parâmetros padrão para a empresa Cactos
INSERT INTO public.financial_parameters (
  company_id,
  taxa_desconto_anual,
  inflacao_anual,
  reajuste_tarifario_anual,
  custo_om_anual,
  taxa_juros_financiamento,
  prazo_financiamento_anos
) 
SELECT 
  id,
  0.08, -- 8%
  0.045, -- 4.5%
  0.06, -- 6%
  200.00, -- R$ 200
  0.12, -- 12%
  15 -- 15 anos
FROM public.companies 
WHERE cnpj = '00.000.000/0001-00'
ON CONFLICT (company_id) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.financial_parameters IS 'Parâmetros financeiros configuráveis por empresa para análises financeiras';
COMMENT ON COLUMN public.financial_parameters.taxa_desconto_anual IS 'Taxa de desconto anual para cálculo do VPL (valor entre 0 e 1)';
COMMENT ON COLUMN public.financial_parameters.inflacao_anual IS 'Taxa de inflação anual esperada (valor entre 0 e 1)';
COMMENT ON COLUMN public.financial_parameters.reajuste_tarifario_anual IS 'Taxa de reajuste tarifário anual da energia elétrica (valor entre 0 e 1)';
COMMENT ON COLUMN public.financial_parameters.custo_om_anual IS 'Custo anual de operação e manutenção em reais';
COMMENT ON COLUMN public.financial_parameters.taxa_juros_financiamento IS 'Taxa de juros para financiamento do sistema (valor entre 0 e 1)';
COMMENT ON COLUMN public.financial_parameters.prazo_financiamento_anos IS 'Prazo padrão para financiamento em anos';