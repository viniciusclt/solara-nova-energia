-- Migration: Seed data para instituições financeiras
-- Criado em: 2025-01-25
-- Descrição: Adiciona dados iniciais para instituições financeiras brasileiras

-- Inserir instituições financeiras principais
INSERT INTO instituicoes_financeiras (
  nome, 
  taxa_juros, 
  prazo_max, 
  tipo, 
  descricao,
  ativo,
  created_at
) VALUES 
  (
    'Banco do Brasil', 
    1.20, 
    240, 
    'publico',
    'Maior banco público do Brasil, oferece linhas de crédito especiais para energia solar',
    true,
    NOW()
  ),
  (
    'Caixa Econômica Federal', 
    1.10, 
    240, 
    'publico',
    'Banco público com foco em habitação e sustentabilidade, oferece financiamento para energia renovável',
    true,
    NOW()
  ),
  (
    'Santander', 
    1.50, 
    180, 
    'privado',
    'Banco internacional com produtos específicos para energia solar e sustentabilidade',
    true,
    NOW()
  ),
  (
    'Itaú Unibanco', 
    1.40, 
    180, 
    'privado',
    'Maior banco privado do Brasil, oferece crédito para projetos de energia renovável',
    true,
    NOW()
  ),
  (
    'Bradesco', 
    1.30, 
    180, 
    'privado',
    'Banco privado com linhas específicas para financiamento de energia solar',
    true,
    NOW()
  ),
  (
    'Banco Safra', 
    1.60, 
    120, 
    'privado',
    'Banco privado com foco em clientes de alta renda, oferece produtos personalizados',
    true,
    NOW()
  ),
  (
    'Sicoob', 
    1.25, 
    180, 
    'cooperativo',
    'Sistema de cooperativas de crédito com taxas competitivas para energia solar',
    true,
    NOW()
  ),
  (
    'Sicredi', 
    1.35, 
    180, 
    'cooperativo',
    'Sistema de crédito cooperativo com foco em sustentabilidade e energia renovável',
    true,
    NOW()
  ),
  (
    'BV Financeira', 
    1.80, 
    120, 
    'privado',
    'Financeira especializada em crédito direto ao consumidor, incluindo energia solar',
    true,
    NOW()
  ),
  (
    'Banco Pine', 
    1.70, 
    120, 
    'privado',
    'Banco de investimento com produtos para financiamento de projetos sustentáveis',
    true,
    NOW()
  );

-- Inserir tipos de financiamento para cada instituição
-- Banco do Brasil
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Crédito Direto ao Consumidor BB',
  1.20,
  1.50,
  12,
  240,
  5000.00,
  500000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Banco do Brasil'
UNION ALL
SELECT 
  id,
  'Direto',
  'BB Crédito Energia Solar',
  1.10,
  1.30,
  24,
  240,
  10000.00,
  1000000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Banco do Brasil';

-- Caixa Econômica Federal
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Caixa Crédito Sustentável',
  1.10,
  1.40,
  12,
  240,
  5000.00,
  300000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Caixa Econômica Federal'
UNION ALL
SELECT 
  id,
  'Construcard',
  'Construcard Energia Solar',
  1.05,
  1.25,
  24,
  240,
  8000.00,
  500000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Caixa Econômica Federal';

-- Santander
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Santander Crédito Pessoal',
  1.50,
  1.80,
  12,
  180,
  3000.00,
  200000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Santander'
UNION ALL
SELECT 
  id,
  'Cartão',
  'Cartão Santander Parcelado',
  2.50,
  3.50,
  6,
  24,
  1000.00,
  50000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Santander';

-- Itaú Unibanco
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Itaú Crédito Pessoal',
  1.40,
  1.70,
  12,
  180,
  5000.00,
  300000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Itaú Unibanco'
UNION ALL
SELECT 
  id,
  'Consórcio',
  'Consórcio Itaú Energia',
  0.30,
  0.50,
  60,
  180,
  15000.00,
  500000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Itaú Unibanco';

-- Bradesco
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Bradesco Crédito Direto',
  1.30,
  1.60,
  12,
  180,
  4000.00,
  250000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Bradesco'
UNION ALL
SELECT 
  id,
  'Leasing',
  'Bradesco Leasing Solar',
  1.20,
  1.50,
  24,
  120,
  20000.00,
  1000000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Bradesco';

-- Banco Safra
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Safra Crédito Premium',
  1.60,
  1.90,
  12,
  120,
  10000.00,
  500000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Banco Safra';

-- Sicoob
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Sicoob Crédito Cooperativo',
  1.25,
  1.55,
  12,
  180,
  3000.00,
  200000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Sicoob';

-- Sicredi
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'Sicredi Energia Renovável',
  1.35,
  1.65,
  12,
  180,
  5000.00,
  300000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Sicredi';

-- BV Financeira
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'CDC',
  'BV Crédito Rápido',
  1.80,
  2.20,
  12,
  120,
  2000.00,
  100000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'BV Financeira';

-- Banco Pine
INSERT INTO tipos_financiamento (
  instituicao_id,
  tipo,
  nome_customizado,
  taxa_juros_min,
  taxa_juros_max,
  prazo_min,
  prazo_max,
  valor_min,
  valor_max,
  ativo
)
SELECT 
  id,
  'Direto',
  'Pine Energia Sustentável',
  1.70,
  2.00,
  12,
  120,
  15000.00,
  800000.00,
  true
FROM instituicoes_financeiras WHERE nome = 'Banco Pine';

-- Inserir configurações padrão para simulações
INSERT INTO configuracoes_financeiras (
  nome,
  valor,
  tipo,
  descricao,
  ativo
) VALUES 
  (
    'iof_padrao',
    '0.0038',
    'decimal',
    'Taxa de IOF padrão para financiamentos (0.38%)',
    true
  ),
  (
    'taxa_abertura_credito',
    '2.5',
    'decimal',
    'Taxa de abertura de crédito padrão (%)',
    true
  ),
  (
    'seguro_prestamista',
    '0.5',
    'decimal',
    'Taxa de seguro prestamista padrão (%)',
    true
  ),
  (
    'margem_lucro_minima',
    '15',
    'decimal',
    'Margem de lucro mínima para propostas (%)',
    true
  ),
  (
    'desconto_maximo',
    '10',
    'decimal',
    'Desconto máximo permitido em propostas (%)',
    true
  );

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_ativo ON instituicoes_financeiras(ativo);
CREATE INDEX IF NOT EXISTS idx_instituicoes_financeiras_tipo ON instituicoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_tipos_financiamento_instituicao ON tipos_financiamento(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_tipos_financiamento_ativo ON tipos_financiamento(ativo);
CREATE INDEX IF NOT EXISTS idx_configuracoes_financeiras_nome ON configuracoes_financeiras(nome);

-- Comentários para documentação
COMMENT ON TABLE instituicoes_financeiras IS 'Tabela de instituições financeiras parceiras para financiamento de energia solar';
COMMENT ON TABLE tipos_financiamento IS 'Tipos de financiamento oferecidos por cada instituição';
COMMENT ON TABLE configuracoes_financeiras IS 'Configurações gerais para cálculos financeiros';

-- Log da migration
INSERT INTO migration_logs (nome, executado_em, descricao) 
VALUES (
  '20250125_seed_financial_institutions',
  NOW(),
  'Adicionados dados seed para instituições financeiras e tipos de financiamento'
);