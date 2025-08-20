# Design System Solara - Guia Completo

## 📋 Índice

1. [Introdução](#introdução)
2. [Instalação e Configuração](#instalação-e-configuração)
3. [Tokens de Design](#tokens-de-design)
4. [Componentes Base](#componentes-base)
5. [Sistema de Responsividade](#sistema-de-responsividade)
6. [Micro-interações e Animações](#micro-interações-e-animações)
7. [Melhores Práticas](#melhores-práticas)
8. [Exemplos de Uso](#exemplos-de-uso)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Introdução

O Design System Solara é um sistema de design completo e modular, criado especificamente para aplicações de energia solar. Ele fornece:

- **Consistência Visual**: Tokens de design padronizados
- **Componentes Reutilizáveis**: Biblioteca completa de componentes React
- **Responsividade**: Sistema adaptativo para todos os dispositivos
- **Micro-interações**: Animações e transições suaves
- **TypeScript**: Tipagem completa para maior segurança

### Domínios Específicos

- **Financeiro**: Componentes para dashboards e métricas
- **Vídeo**: Players e upload de mídia
- **Propostas**: Formulários e apresentações

---

## 🚀 Instalação e Configuração

### Importação Básica

```typescript
// Importar tudo
import { DesignSystem } from '@/design-system';

// Importações específicas
import { Button, Card, Input } from '@/design-system';
import { useDesignTokens, useResponsive } from '@/design-system';
import { AnimatedButton, ResponsiveContainer } from '@/design-system';
```

### Configuração Global

```typescript
// App.tsx
import { DESIGN_CONFIG } from '@/design-system';

function App() {
  // Aplicar configurações globais se necessário
  return (
    <div className="app">
      {/* Sua aplicação */}
    </div>
  );
}
```

---

## 🎨 Tokens de Design

### Cores

```typescript
import { tokens, useDesignTokens } from '@/design-system';

function MyComponent() {
  const { getColor } = useDesignTokens();
  
  return (
    <div 
      style={{ 
        backgroundColor: getColor('primary', 500),
        color: getColor('neutral', 50)
      }}
    >
      Conteúdo
    </div>
  );
}
```

#### Paleta de Cores Disponíveis

- **Primary**: Azul principal da marca
- **Secondary**: Verde complementar
- **Solar**: Tons específicos para energia solar
- **Success**: Verde para sucessos
- **Warning**: Amarelo para avisos
- **Error**: Vermelho para erros
- **Neutral**: Escala de cinzas

### Tipografia

```typescript
const { typography } = tokens;

// Tamanhos disponíveis
const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];

// Pesos disponíveis
const weights = [300, 400, 500, 600, 700, 800];
```

### Espaçamentos

```typescript
const { spacing } = tokens;

// Escala: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
// Valores em rem: 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16
```

---

## 🧩 Componentes Base

### Button

```typescript
import { Button } from '@/design-system';

// Variações básicas
<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="success">Sucesso</Button>
<Button variant="warning">Aviso</Button>
<Button variant="error">Erro</Button>
<Button variant="ghost">Ghost</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>
<Button size="xl">Extra Grande</Button>

// Estados
<Button loading>Carregando...</Button>
<Button disabled>Desabilitado</Button>

// Com ícones
<Button leftIcon={<PlusIcon />}>Adicionar</Button>
<Button rightIcon={<ArrowRightIcon />}>Continuar</Button>

// Componentes especializados
<FinancialButton>Dashboard Financeiro</FinancialButton>
<VideoUploadButton>Upload de Vídeo</VideoUploadButton>
<ProposalButton>Nova Proposta</ProposalButton>
```

### Card

```typescript
import { Card, CardHeader, CardBody, CardFooter } from '@/design-system';

// Card básico
<Card>
  <CardHeader>
    <h3>Título do Card</h3>
  </CardHeader>
  <CardBody>
    <p>Conteúdo do card</p>
  </CardBody>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>

// Variações
<Card variant="financial" size="lg">
  <CardBody>
    <MetricCard 
      title="Receita Total"
      value="R$ 125.000"
      change="+12%"
      trend="up"
    />
  </CardBody>
</Card>

<VideoCard 
  title="Instalação Solar"
  duration="5:30"
  thumbnail="/video-thumb.jpg"
/>

<ProposalCard 
  title="Proposta Residencial"
  status="pending"
  value="R$ 45.000"
/>
```

### Input

```typescript
import { Input, FinancialInput, SearchInput } from '@/design-system';

// Input básico
<Input 
  label="Nome"
  placeholder="Digite seu nome"
  required
/>

// Estados
<Input 
  label="Email"
  type="email"
  error="Email inválido"
  variant="error"
/>

<Input 
  label="Confirmação"
  variant="success"
  helperText="Email confirmado"
/>

// Com ícones
<Input 
  label="Buscar"
  leftIcon={<SearchIcon />}
  placeholder="Buscar projetos..."
/>

// Componentes especializados
<FinancialInput 
  label="Valor do Investimento"
  currency="BRL"
  placeholder="0,00"
/>

<SearchInput 
  placeholder="Buscar clientes..."
  onSearch={handleSearch}
/>

<PasswordInput 
  label="Senha"
  showStrength
/>
```

### Loading

```typescript
import { 
  Spinner, 
  DotsLoading, 
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable
} from '@/design-system';

// Spinners
<Spinner size="sm" />
<Spinner size="lg" color="primary" />
<DotsLoading />

// Skeletons
<SkeletonText lines={3} />
<SkeletonCard />
<SkeletonTable rows={5} columns={4} />
<SkeletonChart type="bar" />
<SkeletonVideoPlayer />
<SkeletonFinancialDashboard />
```

---

## 📱 Sistema de Responsividade

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
  const { 
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    screenSize
  } = useResponsive();
  
  return (
    <div>
      <p>Breakpoint atual: {currentBreakpoint}</p>
      <p>É mobile: {isMobile ? 'Sim' : 'Não'}</p>
      <p>Orientação: {orientation}</p>
    </div>
  );
}
```

### Componentes Responsivos

```typescript
import { 
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveShowHide
} from '@/design-system';

// Container responsivo
<ResponsiveContainer 
  type="content"
  padding={{ xs: "4", lg: "8" }}
>
  Conteúdo
</ResponsiveContainer>

// Grid responsivo
<ResponsiveGrid 
  type="financial"
  columns={{ xs: 1, md: 2, lg: 3 }}
  gap={{ xs: "4", lg: "6" }}
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ResponsiveGrid>

// Stack responsivo
<ResponsiveStack 
  direction={{ xs: "column", lg: "row" }}
  spacing={{ xs: "4", lg: "6" }}
  align={{ xs: "stretch", lg: "center" }}
>
  <Button>Ação 1</Button>
  <Button>Ação 2</Button>
</ResponsiveStack>

// Texto responsivo
<ResponsiveText 
  size={{ xs: "lg", lg: "2xl" }}
  weight={{ xs: "medium", lg: "bold" }}
>
  Título Responsivo
</ResponsiveText>

// Mostrar/Ocultar por dispositivo
<ResponsiveShowHide hideOn="mobile">
  <p>Visível apenas em tablet e desktop</p>
</ResponsiveShowHide>

<ResponsiveShowHide showOn="mobile">
  <p>Visível apenas em mobile</p>
</ResponsiveShowHide>
```

---

## ✨ Micro-interações e Animações

### Componentes Animados

```typescript
import { 
  AnimatedButton,
  AnimatedCard,
  AnimatedContainer,
  AnimatedList
} from '@/design-system';

// Botão com animações
<AnimatedButton 
  variant="primary"
  hoverEffect="scale"
  clickEffect="bounce"
>
  Clique em mim
</AnimatedButton>

// Card com entrada animada
<AnimatedCard 
  entranceType="slideUp"
  hoverEffect="lift"
  delay={200}
>
  <CardBody>Conteúdo animado</CardBody>
</AnimatedCard>

// Container com animação de entrada
<AnimatedContainer 
  entranceType="fade"
  staggerChildren
  staggerDelay={100}
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</AnimatedContainer>

// Lista com animação escalonada
<AnimatedList 
  items={items}
  entranceType="slideUp"
  staggerDelay={50}
  renderItem={(item) => <Card key={item.id}>{item.name}</Card>}
/>
```

### Hook useMicroInteractions

```typescript
import { useMicroInteractions } from '@/design-system';

function InteractiveComponent() {
  const { 
    animateElement,
    getButtonClasses,
    getHoverClasses,
    createEntranceAnimation
  } = useMicroInteractions();
  
  const handleClick = () => {
    animateElement('#my-element', 'bounce');
  };
  
  return (
    <div 
      id="my-element"
      className={getHoverClasses('scale')}
      onClick={handleClick}
    >
      Elemento interativo
    </div>
  );
}
```

---

## 🎯 Melhores Práticas

### 1. Consistência de Design

```typescript
// ✅ Bom: Usar tokens de design
const { getColor, getSpacing } = useDesignTokens();

const styles = {
  backgroundColor: getColor('primary', 500),
  padding: getSpacing(4),
  margin: getSpacing(2)
};

// ❌ Evitar: Valores hardcoded
const badStyles = {
  backgroundColor: '#3B82F6',
  padding: '16px',
  margin: '8px'
};
```

### 2. Responsividade

```typescript
// ✅ Bom: Mobile-first
<ResponsiveGrid 
  columns={{ xs: 1, md: 2, lg: 3 }}
  gap={{ xs: "4", lg: "6" }}
>

// ❌ Evitar: Desktop-first
<div className="grid-cols-3 lg:grid-cols-2 sm:grid-cols-1">
```

### 3. Performance

```typescript
// ✅ Bom: Lazy loading para componentes pesados
const HeavyChart = lazy(() => import('./HeavyChart'));

// ✅ Bom: Usar Skeleton durante carregamento
{loading ? <SkeletonChart /> : <Chart data={data} />}

// ✅ Bom: Otimizar animações
<AnimatedContainer 
  entranceType="fade"
  reduceMotion // Respeita preferências do usuário
>
```

### 4. Acessibilidade

```typescript
// ✅ Bom: Labels e ARIA
<Input 
  label="Email"
  aria-describedby="email-help"
  required
/>
<p id="email-help">Seu email será mantido privado</p>

// ✅ Bom: Contraste adequado
<Button variant="primary"> // Já tem contraste adequado
  Ação Principal
</Button>
```

### 5. TypeScript

```typescript
// ✅ Bom: Tipagem específica
interface DashboardProps {
  metrics: FinancialMetric[];
  period: 'month' | 'quarter' | 'year';
  onPeriodChange: (period: string) => void;
}

// ❌ Evitar: Tipos genéricos demais
interface BadProps {
  data: unknown;
  onChange: (value: unknown) => void;
}
```

---

## 💡 Exemplos de Uso

### Dashboard Financeiro

```typescript
import { 
  ResponsiveGrid,
  FinancialCard,
  MetricCard,
  AnimatedContainer
} from '@/design-system';

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
        <MetricCard 
          title="Projetos Ativos"
          value="23"
          change="+3"
          trend="up"
        />
        <MetricCard 
          title="Economia Gerada"
          value="45.2 MWh"
          change="+8%"
          trend="up"
        />
        <MetricCard 
          title="Clientes Satisfeitos"
          value="98%"
          change="+2%"
          trend="up"
        />
      </ResponsiveGrid>
    </AnimatedContainer>
  );
}
```

### Formulário de Proposta

```typescript
import { 
  ResponsiveStack,
  Input,
  FinancialInput,
  Button,
  Card,
  CardBody
} from '@/design-system';

function ProposalForm() {
  return (
    <Card variant="proposal">
      <CardBody>
        <ResponsiveStack spacing="6">
          <Input 
            label="Nome do Cliente"
            placeholder="Digite o nome completo"
            required
          />
          
          <ResponsiveStack 
            direction={{ xs: "column", md: "row" }}
            spacing="4"
          >
            <Input 
              label="Email"
              type="email"
              placeholder="cliente@email.com"
            />
            <Input 
              label="Telefone"
              placeholder="(11) 99999-9999"
            />
          </ResponsiveStack>
          
          <FinancialInput 
            label="Valor do Investimento"
            currency="BRL"
            placeholder="0,00"
          />
          
          <ResponsiveStack 
            direction={{ xs: "column", sm: "row" }}
            spacing="4"
          >
            <Button variant="secondary" fullWidth>
              Salvar Rascunho
            </Button>
            <Button variant="primary" fullWidth>
              Enviar Proposta
            </Button>
          </ResponsiveStack>
        </ResponsiveStack>
      </CardBody>
    </Card>
  );
}
```

### Player de Vídeo

```typescript
import { 
  VideoCard,
  ResponsiveAspectRatio,
  AnimatedContainer,
  Button
} from '@/design-system';

function VideoGallery({ videos }) {
  return (
    <ResponsiveGrid 
      columns={{ xs: 1, md: 2, lg: 3 }}
      gap="6"
    >
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

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Estilos não aplicados

```typescript
// Verifique se o Tailwind está configurado corretamente
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/design-system/**/*.{js,ts,jsx,tsx}'
  ],
  // ...
};
```

#### 2. Animações não funcionando

```typescript
// Verifique se o usuário não tem preferência por movimento reduzido
const { prefersReducedMotion } = useMicroInteractions();

if (prefersReducedMotion) {
  // Desabilitar animações ou usar alternativas
}
```

#### 3. Responsividade não funcionando

```typescript
// Verifique se está usando o hook corretamente
const { isMobile } = useResponsive();

// Aguarde a hidratação no SSR
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return <SkeletonComponent />;
```

#### 4. Performance lenta

```typescript
// Use React.memo para componentes que não mudam frequentemente
const OptimizedCard = React.memo(Card);

// Use lazy loading para componentes pesados
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Otimize animações
<AnimatedContainer 
  entranceType="fade"
  useGPU // Força aceleração por GPU
  reduceMotion // Respeita preferências
>
```

### Debugging

```typescript
// Ativar modo debug
import { DESIGN_CONFIG } from '@/design-system';

// No desenvolvimento
if (process.env.NODE_ENV === 'development') {
  DESIGN_CONFIG.debug = true;
}

// Verificar tokens aplicados
const { debugTokens } = useDesignTokens();
console.log('Tokens ativos:', debugTokens());

// Verificar breakpoint atual
const { debugInfo } = useResponsive();
console.log('Info responsiva:', debugInfo());
```

---

## 📚 Recursos Adicionais

- **Storybook**: Documentação interativa dos componentes
- **Figma**: Design tokens e componentes visuais
- **GitHub**: Código fonte e issues
- **Changelog**: Histórico de versões e mudanças

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025  
**Mantido por**: Equipe Solara