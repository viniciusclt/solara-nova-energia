# Implementation Plan - Melhorias Incrementais SolarCalc Pro

- [x] 1. Restaurar versão estável e criar ponto de partida


  - Fazer checkout do commit a3a84c3 "Fix lead listing and filtering"
  - Executar npm install para instalar dependências
  - Executar npm run build para verificar compilação
  - Testar funcionalidades básicas (navegação, autenticação, listagem de leads)
  - Fazer commit: "restore: versão estável base para melhorias incrementais"
  - Fazer push para GitHub (conectado ao Lovable) para validação inicial
  - _Requirements: Base estável para desenvolvimento_

- [x] 2. Implementar melhorias de UI/UX responsiva



  - Criar componente ResponsiveText para quebra automática de texto em botões
  - Implementar ResponsiveButton com subtítulos que se adaptam ao tamanho da tela
  - Corrigir layout dos botões da home para evitar extrapolação de texto
  - Adicionar breakpoints responsivos para ocultar subtextos em telas pequenas
  - Testar responsividade em diferentes tamanhos de tela
  - Executar build e validar funcionamento
  - Fazer commit: "feat: melhorar responsividade da interface principal"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 1.1, 1.2_

- [x] 3. Melhorar sistema de busca de leads



  - Criar componente LeadSearchDropdown com busca suspensa
  - Implementar debounce de 300ms para evitar requisições excessivas
  - Corrigir problema de perda de foco durante digitação
  - Criar página dedicada LeadTablePage para visualização completa de leads
  - Implementar filtros avançados (status, data, consumo, cidade)
  - Remover validação prematura que impede digitação contínua
  - Testar fluxo completo de busca e seleção
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar sistema de busca de leads aprimorado"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.4_

- [-] 4. Implementar busca automática por CEP

  - Criar serviço CEPService para integração com API de CEP (ViaCEP)
  - Implementar função de busca automática de endereço por CEP
  - Integrar busca de CEP nos formulários de lead
  - Adicionar validação e tratamento de erros para CEPs inválidos
  - Implementar preenchimento automático de campos de endereço
  - Testar com diferentes CEPs válidos e inválidos
  - Executar build e validar funcionamento
  - Fazer commit: "feat: adicionar busca automática de endereço por CEP"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 2.3_

- [ ] 5. Expandir mapeamento de colunas Google Sheets
  - Estender interface GoogleSheetsMapping para incluir consumo mensal
  - Adicionar campos de mapeamento para Jan-Dez no componente de importação
  - Implementar validação de dados mensais importados
  - Criar preview dos dados mapeados antes da importação
  - Adicionar opções de mapeamento para outros campos relevantes
  - Testar importação com planilha contendo dados mensais
  - Executar build e validar funcionamento
  - Fazer commit: "feat: expandir mapeamento de colunas Google Sheets"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 2.2_

- [ ] 6. Expandir modelo de dados para módulos solares
  - Estender interface SolarModule com campos técnicos completos (Voc, Isc, Vmp, Imp)
  - Adicionar campos de coeficientes de temperatura (Pmax, Voc, Isc)
  - Implementar campos de dimensões físicas (comprimento, largura, espessura, peso)
  - Adicionar sistema de tecnologias com múltiplas seleções (tags)
  - Criar campos de garantia (fábrica e performance)
  - Implementar campo para anexo de datasheet PDF
  - Atualizar formulários de cadastro de módulos
  - Executar build e validar funcionamento
  - Fazer commit: "feat: expandir especificações técnicas de módulos solares"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 3.1, 3.4_

- [ ] 7. Expandir modelo de dados para inversores
  - Estender interface Inverter com especificações DC completas
  - Adicionar especificações AC detalhadas (Pn, Pmax, Vgrid, fases)
  - Implementar campos de eficiência (máxima, EU, MPPT)
  - Adicionar sistema de proteções com múltiplas seleções
  - Criar campos de especificações físicas e ambientais
  - Implementar campos de garantia e vida útil
  - Adicionar campo para anexo de datasheet PDF
  - Atualizar formulários de cadastro de inversores
  - Executar build e validar funcionamento
  - Fazer commit: "feat: expandir especificações técnicas de inversores"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 3.1, 3.2_

- [ ] 8. Reorganizar sistema de gerenciamento de equipamentos
  - Remover botão "Gerenciar Equipamentos" da aba Calculadora
  - Renomear botão para "Gerenciar" na seção de equipamentos de consumo
  - Mover "Gerenciador de Módulos Solares" para dentro de "Gerenciar Equipamentos"
  - Organizar interface de gerenciamento por categorias (Módulos, Inversores, Baterias)
  - Criar interface unificada para gerenciamento de equipamentos
  - Implementar navegação entre diferentes tipos de equipamentos
  - Testar fluxo de navegação e gerenciamento
  - Executar build e validar funcionamento
  - Fazer commit: "feat: reorganizar sistema de gerenciamento de equipamentos"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 3.5_

- [ ] 9. Implementar sistema básico de upload de datasheets
  - Criar componente FileUpload para PDFs de datasheets
  - Implementar validação de tipo de arquivo (apenas PDF)
  - Adicionar limite de tamanho de arquivo (10MB)
  - Integrar upload com Supabase Storage
  - Criar preview de arquivo carregado
  - Implementar remoção de arquivos carregados
  - Adicionar campos de upload nos formulários de módulos e inversores
  - Testar upload, visualização e remoção de arquivos
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar upload de datasheets PDF"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 3.3_

- [ ] 10. Implementar simulação Nível 2 com importação PV*Sol
  - Criar componente PVSolImporter para importação de dados tabulares
  - Implementar parser para formato de tabela PV*Sol (Mês x Gerador)
  - Adicionar interface para colar dados de simulação externa
  - Criar validação de dados importados
  - Integrar dados PV*Sol com sistema de simulação existente
  - Implementar toggle entre simulação básica e dados PV*Sol
  - Testar importação com dados de exemplo
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar simulação Nível 2 com dados PV*Sol"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 4.1_

- [ ] 11. Adicionar quantidade de inversores na simulação
  - Estender interface de configuração de simulação
  - Adicionar campo de quantidade de inversores
  - Implementar validação de compatibilidade (potência total)
  - Atualizar cálculos de simulação para considerar múltiplos inversores
  - Integrar quantidade com cálculos financeiros
  - Testar simulações com diferentes quantidades de inversores
  - Executar build e validar funcionamento
  - Fazer commit: "feat: adicionar configuração de quantidade de inversores"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 4.2_

- [ ] 12. Implementar sistema de kits financeiros com importação Excel
  - Criar componente ExcelImporter para importação de kits
  - Implementar template de Excel para download
  - Adicionar validação de dados importados do Excel
  - Criar interface para mapeamento de colunas do Excel
  - Implementar importação em massa de kits
  - Corrigir funcionalidade do botão "+ Novo Kit"
  - Testar importação com arquivo Excel de exemplo
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar importação em massa de kits via Excel"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 5.1_

- [ ] 13. Implementar geração de PDF para propostas
  - Criar serviço ProposalPDFGenerator usando jsPDF
  - Implementar template básico de proposta em PDF
  - Adicionar geração de gráficos e tabelas no PDF
  - Integrar dados de lead, simulação e financeiro
  - Implementar botão de download de PDF
  - Corrigir funcionalidade dos botões "Visualizar" e "Imprimir"
  - Testar geração de PDF com dados reais
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar geração de propostas em PDF"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 5.2_

- [ ] 14. Implementar sistema de compartilhamento de propostas
  - Criar serviço ProposalSharingService
  - Implementar geração de links únicos para propostas
  - Adicionar sistema de rastreamento de visualizações
  - Criar página pública para visualização de propostas
  - Implementar log de acessos (IP, data, duração)
  - Adicionar expiração automática de links
  - Testar geração e acesso a links compartilhados
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar compartilhamento de propostas com tracking"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 5.3_

- [ ] 15. Criar templates profissionais de proposta
  - Implementar Template 1: Réplica do protótipo anexado
  - Criar Template 2: Metodologia AIDA com design minimalista
  - Desenvolver Template 3: Foco em dados e ROI
  - Implementar Template 4: Storytelling visual
  - Criar Template 5: Premium corporativo
  - Adicionar sistema de seleção de templates
  - Implementar customização básica de templates
  - Testar geração com todos os templates
  - Executar build e validar funcionamento
  - Fazer commit: "feat: adicionar 5 templates profissionais de proposta"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 5.4_

- [ ] 16. Implementar sistema de dados de demonstração
  - Criar serviço DemoDataService com detecção de ambiente
  - Implementar dados de demonstração (5 leads, 2 módulos, 2 inversores)
  - Criar switch condicional localhost vs produção
  - Adicionar dados realistas para demonstração
  - Implementar fallback seguro para produção
  - Testar funcionamento em localhost e produção
  - Validar que dados demo não interferem em produção
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar dados de demonstração para localhost"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 17. Implementar sistema de versionamento
  - Criar arquivo Version.md na raiz do projeto
  - Implementar estrutura de versionamento semântico
  - Documentar versão atual e histórico de mudanças
  - Adicionar todas as melhorias implementadas ao histórico
  - Criar template para futuras atualizações de versão
  - Implementar componente de exibição de versão na interface
  - Testar exibição de informações de versão
  - Executar build e validar funcionamento
  - Fazer commit: "feat: implementar sistema de versionamento"
  - Fazer push para GitHub (conectado ao Lovable) para validação
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 18. Validação final e testes de integração
  - Executar todos os testes automatizados
  - Testar fluxo completo de uso da aplicação
  - Validar todas as funcionalidades implementadas
  - Verificar responsividade em diferentes dispositivos
  - Testar performance e tempo de carregamento
  - Validar integração com Supabase
  - Confirmar que não há regressões nas funcionalidades existentes
  - Executar build de produção final
  - Fazer commit: "chore: validação final das melhorias incrementais"
  - Fazer push para GitHub (conectado ao Lovable) para validação final