# SolarCalc Pro - Sistema de Gestão para Energia Solar

## 📋 Documentação do Projeto

### Visão Geral
Sistema completo para gestão de vendas e análise técnica de sistemas de energia solar, desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## 🏗️ Arquitetura do Sistema

### Tecnologias Principais
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Authentication + RLS)
- **Roteamento**: React Router DOM v6
- **Estado**: React Context API + React Query
- **Validação**: Zod + Validações customizadas
- **Formulários**: React Hook Form

### Estrutura de Diretórios
```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base do Shadcn
│   ├── ConsumptionCalculator.tsx
│   ├── FinancialAnalysis.tsx
│   ├── LeadDataEntry.tsx
│   ├── ProposalGenerator.tsx
│   ├── SecurityAlert.tsx
│   ├── SolarDashboard.tsx
│   └── TechnicalSimulation.tsx
├── contexts/           # Contextos React (Auth, etc)
├── hooks/             # Hooks customizados
├── integrations/      # Integrações externas (Supabase)
├── lib/              # Utilitários e validações
├── pages/            # Páginas da aplicação
└── styles/           # Estilos globais
```

## 🔐 Sistema de Autenticação

### Níveis de Acesso
1. **Vendedor**: Gestão de leads e propostas
2. **Engenheiro**: Simulações técnicas + vendas
3. **Admin**: Gestão de equipe + relatórios
4. **Super Admin**: Acesso total ao sistema

### Recursos de Segurança
- ✅ Row Level Security (RLS) no Supabase
- ✅ Validação de entrada sanitizada
- ✅ Rate limiting para login
- ✅ Audit logs para ações críticas
- ✅ Mensagens de erro genéricas
- ✅ Criptografia de senhas
- ✅ Tokens JWT seguros

## 📊 Funcionalidades do Sistema

### 1. Dashboard Principal
- **Estatísticas em tempo real**: Propostas, conversões, potência
- **Navegação por abas**: Lead → Cálculo → Simulação → Financeiro → Proposta
- **Controle de permissões**: Baseado no tipo de usuário

### 2. Gestão de Leads
- Importação de dados via formulário
- Validação de CNPJ, CEP e telefone
- Histórico de interações

### 3. Calculadora de Consumo
- Análise de incremento de consumo
- Projeções mensais/anuais
- Cálculos automáticos de economia

### 4. Simulação Técnica
- Dimensionamento de sistemas
- Análise de irradiação solar
- Seleção de equipamentos

### 5. Análise Financeira
- Cálculo de ROI e payback
- Modalidades de financiamento
- Projeções de fluxo de caixa

### 6. Geração de Propostas
- Templates personalizáveis
- Exportação em PDF
- Assinatura digital

## 🎨 Design System

### Paleta de Cores Temática
```css
/* Verde Solar */
--primary: 145 84% 21%         /* Verde solar profundo */
--primary-glow: 145 75% 35%    /* Verde mais claro */

/* Azul Energia */
--secondary: 217 91% 60%       /* Azul energia */
--secondary-glow: 217 91% 75%  /* Azul claro */

/* Dourado Solar */
--accent: 45 93% 58%           /* Dourado solar */
--accent-glow: 45 93% 70%      /* Dourado claro */
```

### Componentes Customizados
- **Gradientes**: Solar, energia e hero
- **Sombras**: Solar, energia e glow
- **Transições**: Smooth e bounce
- **Cards**: Com efeitos de hover

## 🗃️ Estrutura do Banco de Dados

### Tabelas Principais

#### `profiles`
```sql
- id: UUID (FK auth.users)
- name: TEXT
- email: TEXT 
- access_type: ENUM (vendedor|engenheiro|admin|super_admin)
- company_id: UUID (FK companies)
- last_login: TIMESTAMP
- two_factor_secret: TEXT
```

#### `companies`
```sql
- id: UUID PRIMARY KEY
- name: TEXT
- cnpj: TEXT UNIQUE
- address: TEXT
- num_employees: INTEGER
```

#### `subscriptions`
```sql
- id: UUID PRIMARY KEY
- company_id: UUID (FK companies)
- status: ENUM (ativa|expirada|gratuita|cancelada)
- start_date: TIMESTAMP
- end_date: TIMESTAMP
- authorized_employees: INTEGER
- monthly_value: NUMERIC
```

#### `audit_logs`
```sql
- id: UUID PRIMARY KEY
- user_id: UUID
- action: TEXT
- details: JSONB
- ip_address: INET
- created_at: TIMESTAMP
```

### Row Level Security (RLS)

#### Políticas de Segurança
```sql
-- Usuários só veem seus próprios dados
CREATE POLICY "users_own_data" ON profiles
FOR ALL USING (auth.uid() = id);

-- Admins veem dados da empresa
CREATE POLICY "admin_company_access" ON profiles
FOR SELECT USING (
  get_current_user_access_type() IN ('admin', 'super_admin') 
  AND company_id = get_current_user_company_id()
);

-- Super admins veem tudo
CREATE POLICY "super_admin_all_access" ON profiles
FOR ALL USING (get_current_user_access_type() = 'super_admin');
```

## 🔧 Validações e Segurança

### Validações Implementadas
- **Email**: Regex RFC compliant
- **Senha**: 8+ chars, maiúscula, minúscula, número
- **CNPJ**: Algoritmo oficial brasileiro
- **CEP**: 8 dígitos, validação básica
- **Telefone**: 10-11 dígitos brasileiros
- **Rate Limiting**: 5 tentativas por 10 minutos

### Sanitização
```typescript
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"&`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 500);
};
```

## 🚀 Deployment e CI/CD

### Ambiente de Desenvolvimento
```bash
npm install
npm run dev
```

### Build de Produção
```bash
npm run build
npm run preview
```

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=https://[projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[chave_anonima]
```

## 📝 Convenções de Código

### TypeScript
- ✅ Strict mode habilitado
- ✅ Interfaces para todos os tipos
- ✅ Validação em runtime com Zod
- ✅ Tratamento explícito de nulls

### React
- ✅ Functional components + Hooks
- ✅ Custom hooks para lógica complexa
- ✅ Context para estado global
- ✅ Memoização quando necessário

### CSS/Styling
- ✅ Design system com tokens CSS
- ✅ Componentes usando Tailwind semântico
- ✅ Evitar cores hard-coded
- ✅ Classes utilitárias consistentes

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Página em branco após login
- **Causa**: RLS policies recursivas
- **Solução**: Usar `maybeSingle()` em vez de `single()`

#### 2. Erro 404 na navegação
- **Causa**: Rotas não configuradas
- **Solução**: Adicionar rotas no App.tsx

#### 3. Infinite recursion em RLS
- **Causa**: Policies que referenciam a própria tabela
- **Solução**: Usar SECURITY DEFINER functions

#### 4. Session não persiste
- **Causa**: Configuração do cliente Supabase
- **Solução**: Verificar localStorage e autoRefreshToken

## 🔄 Atualizações e Manutenção

### Dependências Críticas
- **React**: Manter atualizado para patches de segurança
- **Supabase**: Monitorar breaking changes
- **Tailwind**: Atualizações de design system
- **TypeScript**: Melhorias de tipo

### Monitoramento
- Logs de audit no Supabase
- Métricas de performance
- Alertas de segurança
- Backup automático do banco

## 📞 Suporte

Para problemas técnicos ou dúvidas sobre implementação, consulte:
1. Esta documentação
2. Logs do sistema (audit_logs)
3. Console do navegador para erros frontend
4. Logs do Supabase para erros backend

---

**Última atualização**: 2025-07-13
**Versão**: 1.0.0
**Status**: Produção