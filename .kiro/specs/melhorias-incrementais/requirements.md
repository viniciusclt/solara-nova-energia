# Requirements Document - Melhorias Incrementais SolarCalc Pro

## Introduction

Este documento define os requisitos para implementar melhorias incrementais no SolarCalc Pro após a restauração bem-sucedida da versão estável. O objetivo é adicionar funcionalidades e ajustes visuais de forma controlada, com commits validados a cada etapa para garantir estabilidade contínua.

## Requirements

### Requirement 1: Melhorias de Interface e UX

**User Story:** Como usuário, eu quero uma interface mais responsiva e intuitiva, para que eu possa navegar e usar o sistema de forma mais eficiente.

#### Acceptance Criteria

1. WHEN visualizando botões na home THEN os textos dos subtítulos SHALL quebrar em duas linhas ou ser ocultados em telas pequenas
2. WHEN usando o sistema em dispositivos móveis THEN a interface SHALL ser completamente responsiva
3. WHEN digitando no campo de busca de leads THEN o sistema SHALL manter o foco no campo durante a atualização da lista
4. WHEN visualizando paginação THEN o sistema SHALL usar busca suspensa ao invés de tabela na home
5. WHEN buscando leads THEN o sistema SHALL permitir digitação contínua sem erros de validação

### Requirement 2: Melhorias no Sistema de Leads

**User Story:** Como usuário, eu quero um sistema de leads mais robusto e funcional, para que eu possa gerenciar clientes de forma mais eficiente.

#### Acceptance Criteria

1. WHEN buscando leads THEN o sistema SHALL exibir resultados em uma página dedicada com tabela completa
2. WHEN importando dados do Google Sheets THEN o sistema SHALL oferecer mapeamento de colunas expandido incluindo consumo mensal
3. WHEN inserindo CEP THEN o sistema SHALL buscar automaticamente rua e cidade
4. WHEN validando leads THEN o sistema SHALL permitir digitação sem erros prematuros de validação

### Requirement 3: Melhorias no Sistema de Equipamentos

**User Story:** Como usuário, eu quero gerenciar equipamentos de forma mais completa e detalhada, para que eu possa fazer simulações mais precisas.

#### Acceptance Criteria

1. WHEN gerenciando módulos THEN o sistema SHALL incluir campos técnicos completos (Voc, Isc, Vmp, etc.)
2. WHEN gerenciando inversores THEN o sistema SHALL incluir especificações DC e AC completas
3. WHEN adicionando equipamentos THEN o sistema SHALL permitir upload e OCR de datasheets PDF
4. WHEN categorizando módulos THEN o sistema SHALL usar "Tecnologia" com múltiplas tags selecionáveis
5. WHEN gerenciando equipamentos de consumo THEN o sistema SHALL ter interface dedicada na calculadora

### Requirement 4: Melhorias no Sistema de Simulação

**User Story:** Como usuário, eu quero opções de simulação mais avançadas e precisas, para que eu possa gerar propostas mais confiáveis.

#### Acceptance Criteria

1. WHEN usando simulação Nível 2 THEN o sistema SHALL permitir importação de dados do PV*Sol
2. WHEN configurando inversores THEN o sistema SHALL permitir especificar quantidade
3. WHEN gerenciando equipamentos THEN o sistema SHALL ter botões organizados por categoria (módulos, inversores, baterias)

### Requirement 5: Melhorias no Sistema Financeiro e Propostas

**User Story:** Como usuário, eu quero gerar propostas profissionais e gerenciar kits financeiros, para que eu possa apresentar soluções completas aos clientes.

#### Acceptance Criteria

1. WHEN gerenciando kits THEN o sistema SHALL permitir importação em massa via Excel
2. WHEN gerando propostas THEN o sistema SHALL oferecer download em PDF
3. WHEN compartilhando propostas THEN o sistema SHALL gerar links com rastreamento de visualização
4. WHEN criando propostas THEN o sistema SHALL oferecer 5 modelos profissionais editáveis

### Requirement 6: Sistema de Dados de Demonstração

**User Story:** Como desenvolvedor, eu quero dados de demonstração para localhost, para que eu possa testar o sistema sem depender do Supabase em desenvolvimento.

#### Acceptance Criteria

1. WHEN executando em localhost THEN o sistema SHALL usar dados internos de demonstração
2. WHEN executando em produção THEN o sistema SHALL usar dados do Supabase
3. WHEN demonstrando THEN o sistema SHALL ter 5 leads, 2 módulos e 2 inversores pré-cadastrados

### Requirement 7: Sistema de Versionamento

**User Story:** Como desenvolvedor, eu quero rastrear mudanças importantes do sistema, para que eu possa manter histórico de melhorias.

#### Acceptance Criteria

1. WHEN implementando melhorias THEN o sistema SHALL manter arquivo Version.md atualizado
2. WHEN fazendo commits THEN cada alteração importante SHALL ser documentada com versão
3. WHEN lançando versões THEN o sistema SHALL seguir versionamento semântico