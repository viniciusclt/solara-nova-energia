# 🎨 Design System Solara

> Sistema de design completo e modular para aplicações de energia solar

## 🚀 Visão Geral

O Design System Solara é uma biblioteca completa de componentes React, tokens de design e padrões de interface, especialmente desenvolvida para aplicações do setor de energia solar. Ele garante consistência visual, acessibilidade e uma experiência de usuário otimizada em todos os dispositivos.

### ✨ Características Principais

- **🎯 Tokens de Design**: Sistema centralizado de cores, tipografia, espaçamentos e sombras
- **🧩 Componentes Modulares**: Biblioteca completa de componentes React reutilizáveis
- **📱 Responsividade**: Sistema adaptativo mobile-first com breakpoints inteligentes
- **✨ Micro-interações**: Animações suaves e transições inteligentes
- **♿ Acessibilidade**: Componentes compatíveis com WCAG 2.1
- **🔧 TypeScript**: Tipagem completa para maior segurança e produtividade
- **⚡ Performance**: Otimizado para carregamento rápido e renderização eficiente

### 🎯 Domínios Específicos

- **💰 Financeiro**: Dashboards, métricas e componentes para análise financeira
- **🎥 Vídeo**: Players, upload e galeria de mídia
- **📋 Propostas**: Formulários e apresentações comerciais

## 📦 Instalação

### Importação Básica

```typescript
// Importar componentes específicos
import { Button, Card, Input } from '@/design-system';

// Importar hooks e utilitários
import { useDesignTokens, useResponsive } from '@/design-system';

// Importar componentes animados
import { AnimatedButton, ResponsiveContainer } from '@/design-system';
```

### Configuração do Tailwind CSS

Certifique-se de que o Tailwind CSS está configurado para incluir os arquivos do design system:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/design-system/**/*.{js,ts,jsx,tsx}'
  ],
  // ... outras configurações
};
```

## 🎨 Tokens de Design

### Cores

```typescript
import { useDesignTokens } from '@/design-system';

function MyComponent() {
  const { getColor } = useDesignTokens();
  
  return (
    <div style={{ backgroundColor: getColor('primary', 500) }}>
      Conteúdo
    </div>
  );
}
```

**Paletas Disponíveis:**
- `primary` - Azul principal da marca
- `secondary` - Verde complementar
- `solar` - Tons específicos para energia solar
- `success` - Verde para sucessos
- `warning` - Amarelo para avisos
- `error` - Vermelho para erros
- `neutral` - Escala de cinzas

### Tipografia

```typescript
// Tamanhos: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
// Pesos: 300, 400, 500, 600, 700, 800
```

### Espaçamentos

```typescript
// Escala: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
// Valores em rem: 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16
```

## 🧩 Componentes

### Button

```typescript
import { Button, FinancialButton } from '@/design-system';

// Variações
<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="success">Sucesso</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>

// Estados
<Button loading>Carregando...</Button>
<Button disabled>Desabilitado</Button>

// Especializado
<FinancialButton>Dashboard</FinancialButton>
```

### Card

```typescript
import { Card, CardHeader, CardBody, MetricCard } from '@/design-system';

<Card variant="financial">
  <CardHeader>
    <h3>Título</h3>
  </CardHeader>
  <CardBody>
    <MetricCard 
      title="Receita"
      value="R$ 125.000"
      change="+12%"
      trend="up"
    />
  </CardBody>
</Card>
```

### Input

```typescript
import { Input, FinancialInput, SearchInput } from '@/design-system';

<Input 
  label="Nome"
  placeholder="Digite seu nome"
  required
/>

<FinancialInput 
  label="Investimento"
  currency="BRL"
  placeholder="0,00"
/>

<SearchInput 
  placeholder="Buscar..."
  onSearch={handleSearch}
/>
```

## 📱 Sistema Responsivo

### Breakpoints

```typescript
const breakpoints = {
  xs: 0,     // Mobile portrait
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet portrait
  lg: 1024,  // Tablet landscape / Desktop
  xl: 1280,  // Desktop
  '2xl': 1536 // Large desktop
};
```

### Hook useResponsive

```typescript
import { useResponsive } from '@/design-system';

function ResponsiveComponent() {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive();
  
  return (
    <div>
      {isMobile ? 'Layout Mobile' : 'Layout Desktop'}
    </div>
  );
}
```

### Componentes Responsivos

```typescript
import { ResponsiveGrid, ResponsiveStack, ResponsiveText } from '@/design-system';

<ResponsiveGrid 
  columns={{ xs: 1, md: 2, lg: 3 }}
  gap={{ xs: "4", lg: "6" }}
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ResponsiveGrid>

<ResponsiveStack 
  direction={{ xs: "column", lg: "row" }}
  spacing="4"
>
  <Button>Ação 1</Button>
  <Button>Ação 2</Button>
</ResponsiveStack>

<ResponsiveText 
  size={{ xs: "lg", lg: "2xl" }}
  weight="bold"
>
  Título Responsivo
</ResponsiveText>
```

## ✨ Animações e Micro-interações

### Componentes Animados

```typescript
import { AnimatedButton, AnimatedCard, AnimatedContainer } from '@/design-system';

<AnimatedButton 
  variant="primary"
  hoverEffect="scale"
  clickEffect="bounce"
>
  Botão Animado
</AnimatedButton>

<AnimatedCard 
  entranceType="slideUp"
  hoverEffect="lift"
>
  <CardBody>Conteúdo</CardBody>
</AnimatedCard>

<AnimatedContainer 
  entranceType="fade"
  staggerChildren
  staggerDelay={100}
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</AnimatedContainer>
```

### Hook useMicroInteractions

```typescript
import { useMicroInteractions } from '@/design-system';

function InteractiveComponent() {
  const { animateElement, getHoverClasses } = useMicroInteractions();
  
  const handleClick = () => {
    animateElement('#target', 'bounce');
  };
  
  return (
    <div 
      className={getHoverClasses('scale')}
      onClick={handleClick}
    >
      Elemento Interativo
    </div>
  );
}
```

## 💡 Exemplos Práticos

### Dashboard Financeiro

```typescript
import { ResponsiveGrid, MetricCard, AnimatedContainer } from '@/design-system';

function FinancialDashboard() {
  return (
    <AnimatedContainer entranceType="fade">
      <ResponsiveGrid 
        type="financial"
        columns={{ xs: 1, md: 2, lg: 4 }}
        gap="6"
      >
        <MetricCard 
          title="Receita Total"
          value="R$ 125.000"
          change="+12%"
          trend="up"
        />
        {/* Mais métricas... */}
      </ResponsiveGrid>
    </AnimatedContainer>
  );
}
```

### Galeria de Vídeos

```typescript
import { ResponsiveGrid, VideoCard, AnimatedContainer } from '@/design-system';

function VideoGallery({ videos }) {
  return (
    <ResponsiveGrid columns={{ xs: 1, md: 2, lg: 3 }} gap="6">
      {videos.map((video, index) => (
        <AnimatedContainer 
          key={video.id}
          entranceType="slideUp"
          delay={index * 100}
        >
          <VideoCard 
            title={video.title}
            duration={video.duration}
            thumbnail={video.thumbnail}
            onPlay={() => handlePlay(video.id)}
          />
        </AnimatedContainer>
      ))}
    </ResponsiveGrid>
  );
}
```

## 🎯 Melhores Práticas

### ✅ Recomendado

```typescript
// Use tokens de design
const { getColor, getSpacing } = useDesignTokens();

// Mobile-first
<ResponsiveGrid columns={{ xs: 1, md: 2, lg: 3 }}>

// Componentes especializados
<FinancialButton>Dashboard</FinancialButton>

// Tipagem específica
interface Props {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
}
```

### ❌ Evitar

```typescript
// Valores hardcoded
const styles = { backgroundColor: '#3B82F6' };

// Desktop-first
<div className="grid-cols-3 lg:grid-cols-2 sm:grid-cols-1">

// Tipos genéricos
interface Props {
  data: unknown;
  onChange: (value: unknown) => void;
}
```

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
src/design-system/
├── tokens.ts                 # Tokens de design
├── useDesignTokens.ts       # Hook para tokens
├── components/              # Componentes base
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Loading.tsx
├── animations/              # Sistema de animações
│   ├── microInteractions.ts
│   ├── useMicroInteractions.ts
│   └── AnimatedComponents.tsx
├── responsive/              # Sistema responsivo
│   ├── breakpoints.ts
│   ├── useResponsive.ts
│   └── ResponsiveComponents.tsx
├── examples/                # Exemplos e demos
│   └── DesignSystemDemo.tsx
├── index.ts                 # Exportações principais
├── DESIGN_SYSTEM_GUIDE.md   # Guia completo
└── README.md               # Este arquivo
```

### Comandos Úteis

```bash
# Executar demo do design system
npm run dev

# Verificar tipos
npm run check

# Build do projeto
npm run build
```

## 📚 Documentação

- **[Guia Completo](./DESIGN_SYSTEM_GUIDE.md)** - Documentação detalhada com exemplos
- **[Demo Interativa](./examples/DesignSystemDemo.tsx)** - Playground com todos os componentes
- **[Tokens de Design](./tokens.ts)** - Definições de cores, tipografia e espaçamentos

## 🤝 Contribuição

### Adicionando Novos Componentes

1. Crie o componente em `components/`
2. Use os tokens de design existentes
3. Implemente variações e estados
4. Adicione tipagem TypeScript
5. Exporte no `index.ts`
6. Adicione exemplos na demo

### Padrões de Código

- Use TypeScript para tipagem
- Siga a convenção de nomenclatura existente
- Implemente props consistentes (`variant`, `size`, `disabled`, etc.)
- Adicione suporte a `className` e `...props`
- Use `forwardRef` quando necessário

## 📄 Licença

Este design system é propriedade da Solara e destinado ao uso interno em aplicações de energia solar.

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025  
**Mantido por**: Equipe Solara

---

## 🚀 Próximos Passos

- [ ] Storybook para documentação interativa
- [ ] Temas customizáveis
- [ ] Componentes de formulário avançados
- [ ] Integração com bibliotecas de gráficos
- [ ] Testes automatizados
- [ ] Performance monitoring