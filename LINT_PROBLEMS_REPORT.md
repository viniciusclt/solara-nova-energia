# Relatório de Problemas do Lint

## Resumo
- **Total de problemas**: 106 (85 erros, 21 avisos)
- **Problemas corrigidos**: 7 (4 @ts-ignore → @ts-expect-error, 3 outros)
- **Redução**: 6% dos problemas foram corrigidos

## Categorias de Problemas

### 1. Tipos TypeScript (Mais Crítico)

#### Uso de `any` (@typescript-eslint/no-explicit-any)
**Arquivos afetados:**
- `ConsumptionCalculator.tsx` (linhas 24, 134)
- `DemoDataIndicator.tsx` (linha 14)
- `ExcelImporter.tsx` (linha 149)
- `FinancialAnalysis.tsx` (linhas 46, 78, 108, 179)
- `FinancialKitManager.tsx` (linhas 78, 184, 209, 244)
- `LeadDataEntry.tsx` (linhas 153, 185, 232, 406-411)

**Solução**: Substituir `any` por tipos específicos ou usar `unknown` quando apropriado.

### 2. Erros de Sintaxe

#### Parsing Error em FinalValidation.tsx
- **Arquivo**: `FinalValidation.tsx`
- **Linha**: 396
- **Erro**: `Unexpected token. Did you mean '{'>'}' or '&gt;'?`
- **Solução**: Corrigir escape de caracteres JSX

### 3. React Hooks

#### Rules of Hooks (react-hooks/rules-of-hooks)
- **Arquivo**: `ConsumptionCalculator.tsx`
- **Linha**: 226
- **Erro**: Hook "usePreset" chamado dentro de callback
- **Solução**: Mover hook para o nível do componente

#### Missing Dependencies (react-hooks/exhaustive-deps)
**Arquivos afetados:**
- `FinancialAnalysis.tsx` (linha 83)
- `FinancialKitManager.tsx` (linha 65)
- `InverterManagerAdvanced.tsx` (linha 95)
- `LeadDataEntry.tsx` (linha 129)
- `LeadList.tsx` (linhas 63, 70)
- `LeadSearchDropdown.tsx` (linha 60)

### 4. Declarações em Case Blocks (no-case-declarations)
- **Arquivo**: `LeadDataEntry.tsx`
- **Linhas**: 242, 251, 256, 261, 292, 297
- **Solução**: Envolver declarações em blocos `{}`

### 5. Escape Characters (no-useless-escape)
- **Status**: ⚠️ **PARCIALMENTE CORRIGIDO**
- **Arquivo**: `tests/functional-tests.spec.ts`
- **Linha**: 307 (ainda com 5 erros)
- **Problema**: Regex pattern `/v\d+\.\d+\.\d+/` precisa de ajuste

### 6. TypeScript Comments (@typescript-eslint/ban-ts-comment)
- **Status**: ✅ **CORRIGIDO** nos testes
- **Linhas**: 385, 392, 403, 410 (functional-tests.spec.ts)
- **Ação**: Substituído `@ts-ignore` por `@ts-expect-error`

## Prioridade de Correção

### Alta Prioridade
1. **Hook chamado em callback** (ConsumptionCalculator.tsx linha 226)
2. **Tipos `any`** - Compromete type safety (85+ ocorrências)
3. **Escape characters** - Regex em testes (5 erros restantes)

### Média Prioridade
1. **Declarações em case blocks**
2. **Missing dependencies em useEffect**

### Baixa Prioridade
1. **Escape characters desnecessários**
2. **@ts-ignore vs @ts-expect-error**

## Recomendações

1. **Corrigir erro de parsing primeiro** para garantir que o código compile
2. **Implementar tipos específicos** em vez de `any` para melhor type safety
3. **Revisar hooks do React** para seguir as regras
4. **Usar `npm run lint -- --fix`** para corrigir automaticamente 3 problemas
5. **Configurar pre-commit hooks** para evitar novos problemas de lint

## Arquivos Mais Problemáticos

1. **LeadDataEntry.tsx** - 15+ erros
2. **FinancialAnalysis.tsx** - 6+ erros
3. **FinancialKitManager.tsx** - 6+ erros
4. **ConsumptionCalculator.tsx** - 3+ erros

## Status do Build

✅ **Progresso**: 7 problemas corrigidos (6% de redução)

**Problemas restantes (106)**:
- 85 erros (principalmente tipos `any`)
- 21 avisos (dependências em useEffect)

**Próximas ações recomendadas**:
1. Corrigir regex em testes (5 erros)
2. Implementar tipos específicos em vez de `any`
3. Revisar dependências de useEffect
4. Corrigir hook em callback