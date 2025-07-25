-- Criação da tabela de instituições financeiras
CREATE TABLE IF NOT EXISTS instituicoes_financeiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('banco', 'financeira', 'cooperativa', 'fintech')),
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(500),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  contato_principal VARCHAR(255),
  cargo_contato VARCHAR(100),
  telefone_contato VARCHAR(20),
  email_contato VARCHAR(255),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  favorito BOOLEAN DEFAULT false,
  taxa_juros_min DECIMAL(5,2),
  taxa_juros_max DECIMAL(5,2),
  prazo_min_meses INTEGER,
  prazo_max_meses INTEGER,
  valor_min_financiamento DECIMAL(15,2),
  valor_max_financiamento DECIMAL(15,2),
  aceita_pessoa_fisica BOOLEAN DEFAULT true,
  aceita_pessoa_juridica BOOLEAN DEFAULT true,
  documentos_necessarios TEXT[], -- Array de strings para documentos
  tempo_aprovacao_dias INTEGER,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_empresa_id ON instituicoes_financeiras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_tipo ON instituicoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_ativo ON instituicoes_financeiras(ativo);
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_favorito ON instituicoes_financeiras(favorito);
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_nome ON instituicoes_financeiras(nome);
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_cnpj ON instituicoes_financeiras(cnpj);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instituicoes_financeiras_updated_at
    BEFORE UPDATE ON instituicoes_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para garantir que usuários só vejam instituições da sua empresa
ALTER TABLE instituicoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver apenas instituições da sua empresa
CREATE POLICY "Usuários podem ver instituições da sua empresa" ON instituicoes_financeiras
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para INSERT: usuários podem criar instituições apenas para sua empresa
CREATE POLICY "Usuários podem criar instituições para sua empresa" ON instituicoes_financeiras
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para UPDATE: usuários podem atualizar apenas instituições da sua empresa
CREATE POLICY "Usuários podem atualizar instituições da sua empresa" ON instituicoes_financeiras
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    ) WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para DELETE: usuários podem excluir apenas instituições da sua empresa
CREATE POLICY "Usuários podem excluir instituições da sua empresa" ON instituicoes_financeiras
    FOR DELETE USING (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Comentários para documentação
COMMENT ON TABLE instituicoes_financeiras IS 'Tabela para armazenar informações de instituições financeiras para financiamento de projetos';
COMMENT ON COLUMN instituicoes_financeiras.tipo IS 'Tipo da instituição: banco, financeira, cooperativa ou fintech';
COMMENT ON COLUMN instituicoes_financeiras.documentos_necessarios IS 'Array de documentos necessários para financiamento';
COMMENT ON COLUMN instituicoes_financeiras.taxa_juros_min IS 'Taxa de juros mínima em porcentagem';
COMMENT ON COLUMN instituicoes_financeiras.taxa_juros_max IS 'Taxa de juros máxima em porcentagem';
COMMENT ON COLUMN instituicoes_financeiras.valor_min_financiamento IS 'Valor mínimo de financiamento em reais';
COMMENT ON COLUMN instituicoes_financeiras.valor_max_financiamento IS 'Valor máximo de financiamento em reais';
COMMENT ON COLUMN instituicoes_financeiras.tempo_aprovacao_dias IS 'Tempo médio de aprovação em dias';

-- Inserir algumas instituições de exemplo (opcional)
INSERT INTO instituicoes_financeiras (
    nome, tipo, cnpj, telefone, email, website, cidade, estado,
    contato_principal, cargo_contato, ativo, favorito,
    taxa_juros_min, taxa_juros_max, prazo_min_meses, prazo_max_meses,
    valor_min_financiamento, valor_max_financiamento,
    aceita_pessoa_fisica, aceita_pessoa_juridica,
    documentos_necessarios, tempo_aprovacao_dias, empresa_id
) VALUES 
(
    'Banco do Brasil',
    'banco',
    '00.000.000/0001-91',
    '(11) 4004-0001',
    'energia@bb.com.br',
    'https://www.bb.com.br',
    'São Paulo',
    'SP',
    'João Silva',
    'Gerente de Energia Renovável',
    true,
    true,
    1.5,
    3.2,
    12,
    120,
    50000.00,
    2000000.00,
    true,
    true,
    ARRAY['CPF/CNPJ', 'Comprovante de renda', 'Projeto técnico', 'Licenças ambientais'],
    15,
    (SELECT id FROM empresas LIMIT 1) -- Usar primeira empresa como exemplo
),
(
    'Caixa Econômica Federal',
    'banco',
    '00.360.305/0001-04',
    '(11) 4004-0104',
    'sustentabilidade@caixa.gov.br',
    'https://www.caixa.gov.br',
    'Brasília',
    'DF',
    'Maria Santos',
    'Superintendente de Sustentabilidade',
    true,
    true,
    1.8,
    3.5,
    24,
    180,
    30000.00,
    5000000.00,
    true,
    true,
    ARRAY['CPF/CNPJ', 'Comprovante de renda', 'Projeto executivo', 'ART/RRT'],
    20,
    (SELECT id FROM empresas LIMIT 1)
),
(
    'Santander Brasil',
    'banco',
    '90.400.888/0001-42',
    '(11) 4004-3535',
    'energia.renovavel@santander.com.br',
    'https://www.santander.com.br',
    'São Paulo',
    'SP',
    'Carlos Oliveira',
    'Diretor de Sustentabilidade',
    true,
    false,
    2.1,
    4.0,
    12,
    144,
    100000.00,
    3000000.00,
    false,
    true,
    ARRAY['CNPJ', 'Demonstrações financeiras', 'Projeto básico', 'Garantias'],
    25,
    (SELECT id FROM empresas LIMIT 1)
),
(
    'BNDES',
    'banco',
    '33.657.248/0001-89',
    '(21) 2172-8888',
    'energia@bndes.gov.br',
    'https://www.bndes.gov.br',
    'Rio de Janeiro',
    'RJ',
    'Ana Costa',
    'Gerente de Energia',
    true,
    true,
    0.8,
    2.5,
    36,
    240,
    500000.00,
    50000000.00,
    false,
    true,
    ARRAY['CNPJ', 'Projeto detalhado', 'Licenças', 'Estudos ambientais', 'Garantias'],
    45,
    (SELECT id FROM empresas LIMIT 1)
),
(
    'Sicredi',
    'cooperativa',
    '01.181.521/0001-52',
    '(51) 3358-4000',
    'agronegocio@sicredi.com.br',
    'https://www.sicredi.com.br',
    'Porto Alegre',
    'RS',
    'Pedro Ferreira',
    'Coordenador de Agronegócio',
    true,
    false,
    1.2,
    2.8,
    12,
    96,
    25000.00,
    800000.00,
    true,
    true,
    ARRAY['CPF/CNPJ', 'Comprovante de renda', 'Projeto simplificado'],
    10,
    (SELECT id FROM empresas LIMIT 1)
) ON CONFLICT DO NOTHING; -- Evita erro se já existirem registros

-- Verificar se a migração foi aplicada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instituicoes_financeiras') THEN
        RAISE NOTICE 'Tabela instituicoes_financeiras criada com sucesso!';
    ELSE
        RAISE EXCEPTION 'Erro: Tabela instituicoes_financeiras não foi criada!';
    END IF;
END $$;