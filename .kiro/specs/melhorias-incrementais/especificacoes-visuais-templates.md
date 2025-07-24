# 🎨 Especificações Visuais - Templates Profissionais

## 📐 Layouts Detalhados por Página

### **PÁGINA 1: CAPA PROFISSIONAL**

```
┌─────────────────────────────────────────────────────────────┐
│                    [LOGO_EMPRESA]                          │
│                     (max 80px)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              PRÉ-PROPOSTA COMERCIAL                        │
│           SISTEMA FOTOVOLTAICO CONECTADO À REDE            │
│                    ═══════════════                          │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ DADOS DO CLIENTE    │    │ DADOS DA PROPOSTA   │        │
│  │                     │    │                     │        │
│  │ Cliente:            │    │ Nº Proposta:        │        │
│  │ [NOME_CLIENTE]      │    │ [NUMERO_PROPOSTA]   │        │
│  │                     │    │                     │        │
│  │ Endereço:           │    │ Data:               │        │
│  │ [ENDERECO_CLIENTE]  │    │ [DATA_PROPOSTA]     │        │
│  │                     │    │                     │        │
│  │ Responsável:        │    │ Validade:           │        │
│  │ [RESP_TECNICO]      │    │ [VALIDADE_PROPOSTA] │        │
│  │                     │    │                     │        │
│  │ CREA: [NUMERO_CREA] │    │                     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [NOME_EMPRESA] | CNPJ: [CNPJ] | Tel: [TELEFONE]            │
│ Email: [EMAIL] | Site: [WEBSITE]                           │
└─────────────────────────────────────────────────────────────┘
```

**Especificações CSS:**
```css
.capa-container {
  padding: 40px;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.logo-section {
  text-align: center;
  margin-bottom: 60px;
}

.title-section {
  text-align: center;
  margin-bottom: 80px;
}

.main-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 18px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 20px;
}

.decorative-line {
  width: 200px;
  height: 3px;
  background: linear-gradient(90deg, #f59e0b, #0ea5e9);
  margin: 0 auto;
}

.data-cards {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 60px;
}

.data-card {
  flex: 1;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #f59e0b;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-row {
  display: flex;
  margin-bottom: 12px;
}

.field-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 100px;
}

.field-value {
  color: #1f2937;
  font-weight: 400;
}
```

---

### **PÁGINA 2: BENEFÍCIOS E FUNCIONAMENTO**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ POR QUE TER         │    │ COMO FUNCIONA?      │        │
│  │ ENERGIA SOLAR?      │    │                     │        │
│  │                     │    │ Na Geração          │        │
│  │ 1. Redução na       │    │ Distribuída (GD)... │        │
│  │    fatura           │    │                     │        │
│  │ 2. Mais conforto    │    │ • A rede funciona   │        │
│  │ 3. Reinvestir na    │    │   como 'bateria'    │        │
│  │    empresa          │    │ • Excedente vira    │        │
│  │ 4. Viajar mais      │    │   créditos          │        │
│  │ 5. Aumentar poder   │    │ • Medidor           │        │
│  │    de compra        │    │   bidirecional      │        │
│  │ 6. Proteção contra  │    │                     │        │
│  │    inflação         │    │ ┌─────────────────┐ │        │
│  │ 7. Melhor custo/    │    │ │                 │ │        │
│  │    benefício        │    │ │ [DIAGRAMA_FUNC] │ │        │
│  │ 8. Baixa            │    │ │                 │ │        │
│  │    manutenção       │    │ │                 │ │        │
│  │ 9. Valorização      │    │ └─────────────────┘ │        │
│  │    do imóvel        │    │                     │        │
│  │ 10. Energia limpa   │    │                     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificações CSS:**
```css
.benefits-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 40px;
}

.benefits-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 24px;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #f59e0b;
}

.benefits-list {
  list-style: none;
  padding: 0;
}

.benefit-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
}

.benefit-item:hover {
  background: #e2e8f0;
  transform: translateX(4px);
}

.benefit-number {
  background: #f59e0b;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  margin-right: 12px;
  flex-shrink: 0;
}

.benefit-text {
  color: #374151;
  font-weight: 500;
}

.how-it-works {
  text-align: left;
}

.explanation-text {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 20px;
}

.bullet-points {
  list-style: none;
  padding: 0;
}

.bullet-point {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #374151;
}

.bullet-point::before {
  content: '•';
  color: #10b981;
  font-weight: bold;
  font-size: 18px;
  margin-right: 12px;
}

.diagram-container {
  margin-top: 24px;
  text-align: center;
}

.diagram-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

---

### **PÁGINA 3: SOBRE A EMPRESA (4 PILARES)**

```
┌─────────────────────────────────────────────────────────────┐
│                    SOBRE A [NOME_EMPRESA]                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────┐ │
│  │     🎓      │  │     🛡️      │  │     ⭐      │  │ ⚖️  │ │
│  │CONHECIMENTO │  │ SEGURANÇA   │  │CONFIABILID. │  │PONHA│ │
│  │             │  │             │  │             │  │ NA  │ │
│  │ A [EMPRESA] │  │ Nossa equipe│  │ Já atendemos│  │BALAN│ │
│  │ possui mais │  │ possui todas│  │ diversas    │  │ ÇA  │ │
│  │ de [ANOS]   │  │ as certific.│  │ cidades do  │  │     │ │
│  │ anos de exp.│  │ necessárias │  │ [ESTADO]... │  │Toda │ │
│  │ com Energia │  │ para realiz.│  │             │  │prop.│ │
│  │ Solar...    │  │ do trabalho │  │ Temos 100%  │  │é    │ │
│  │             │  │ seja relac. │  │ de aprovação│  │dife-│ │
│  │             │  │ a install.  │  │ dos nossos  │  │rente│ │
│  │             │  │ elétricas   │  │ clientes... │  │...  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificações CSS:**
```css
.pillars-container {
  padding: 40px;
}

.pillars-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 48px;
}

.pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.pillar-card {
  background: white;
  padding: 32px 20px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-top: 4px solid #f59e0b;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.pillar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.1), transparent);
  transition: left 0.5s;
}

.pillar-card:hover::before {
  left: 100%;
}

.pillar-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
}

.pillar-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.pillar-title {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pillar-content {
  color: #6b7280;
  line-height: 1.5;
  font-size: 14px;
  text-align: left;
}

/* Responsive para mobile */
@media (max-width: 768px) {
  .pillars-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .pillars-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### **PÁGINA 5: ANÁLISE DE CONSUMO (TÉCNICA)**

```
┌─────────────────────────────────────────────────────────────┐
│                    ANÁLISE DE CONSUMO                      │
│                                                             │
│ Para este estudo foi previsto um aumento no consumo de     │
│ [PERCENTUAL_AUMENTO]% e consumo diurno de [PERC_DIURNO]%   │
│                                                             │
│ ┌─────────────────────┐    ┌─────────────────────┐        │
│ │ CENÁRIO ATUAL       │    │ CENÁRIO FUTURO      │        │
│ │                     │    │                     │        │
│ │ Consumo Médio:      │    │ Consumo Médio:      │        │
│ │ [CONSUMO_ATUAL] kWh │    │ [CONSUMO_FUTURO] kWh│        │
│ │                     │    │                     │        │
│ │ Consumo Anual:      │    │ Consumo Anual:      │        │
│ │ [CONS_ANUAL] kWh    │    │ [CONS_ANUAL_F] kWh  │        │
│ │                     │    │                     │        │
│ │ Valor da Fatura:    │    │ Valor da Fatura:    │        │
│ │ R$ [VALOR_FATURA]   │    │ R$ [VALOR_FATURA_F] │        │
│ └─────────────────────┘    └─────────────────────┘        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              SISTEMA PROPOSTO                           │ │
│ │                                                         │ │
│ │ Potência: [POTENCIA] kWp  │  Módulos: [NUM_MODULOS]    │ │
│ │ Área: [AREA] m²           │  LCOE: R$ [LCOE]/kWh       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                 GRÁFICO DE GERAÇÃO                     │ │
│ │                                                         │ │
│ │     [GRÁFICO_BARRAS_GERAÇÃO_MENSAL]                    │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Especificações CSS:**
```css
.analysis-container {
  padding: 40px;
}

.analysis-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 32px;
}

.intro-text {
  text-align: center;
  color: #6b7280;
  margin-bottom: 32px;
  font-style: italic;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.scenarios-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.scenario-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-top: 3px solid #f59e0b;
}

.scenario-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  text-align: center;
  text-transform: uppercase;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-label {
  font-weight: 500;
  color: #6b7280;
}

.metric-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.system-proposed {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 32px;
}

.system-title {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.system-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.spec-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.chart-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
}
```

---

### **PÁGINA 8: ANÁLISE ECONÔMICA**

```
┌─────────────────────────────────────────────────────────────┐
│                   ANÁLISE ECONÔMICA                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RESUMO FINANCEIRO                                       │ │
│ │ Fatura sem geração: R$ [VALOR_FATURA_MENSAL]           │ │
│ │ Gasto em 10 anos: R$ [GASTO_10_ANOS_SEM_SOLAR]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │    VPL      │ │    TIR      │ │  PAYBACK    │ │RENTABIL.│ │
│ │             │ │             │ │             │ │         │ │
│ │R$ [VPL]     │ │ [TIR]%      │ │ [PAYBACK]   │ │[RENT]%  │ │
│ │             │ │             │ │             │ │a.m.     │ │
│ │Valor de     │ │Taxa de      │ │Tempo em que │ │Rentab.  │ │
│ │economia     │ │retorno      │ │a economia   │ │mensal   │ │
│ │futura...    │ │(comparar    │ │pagará o     │ │comparada│ │
│ │             │ │com Selic)   │ │investimento │ │com inv. │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                OPÇÕES DE PAGAMENTO                     │ │
│ │                                                         │ │
│ │ À Vista: R$ [VALOR_AVISTA] - Payback: [PAYBACK_AVISTA] │ │
│ │                                                         │ │
│ │ Financ. 1: [PARC_1]x R$ [VALOR_1] = R$ [TOTAL_1]      │ │
│ │ Payback: [PAYBACK_FINANC_1]                            │ │
│ │                                                         │ │
│ │ Financ. 2: [PARC_2]x R$ [VALOR_2] = R$ [TOTAL_2]      │ │
│ │ Payback: [PAYBACK_FINANC_2]                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Especificações CSS:**
```css
.economic-analysis {
  padding: 40px;
}

.summary-card {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 32px;
  text-align: center;
}

.summary-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.summary-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.summary-metric {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
}

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.indicator-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-top: 4px solid #10b981;
  transition: transform 0.2s;
}

.indicator-card:hover {
  transform: translateY(-4px);
}

.indicator-value {
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 8px;
}

.indicator-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.indicator-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.payment-options {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.payment-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 24px;
  text-transform: uppercase;
}

.payment-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.payment-details {
  font-weight: 500;
  color: #374151;
}

.payment-payback {
  font-weight: 600;
  color: #10b981;
}

/* Responsive */
@media (max-width: 768px) {
  .indicators-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .summary-metrics {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎨 Sistema de Cores e Tipografia

### Paleta Principal
```css
:root {
  /* Cores Primárias */
  --solar-gold: #f59e0b;        /* Dourado solar */
  --solar-blue: #0ea5e9;        /* Azul céu */
  --solar-green: #10b981;       /* Verde sustentável */
  
  /* Cores Secundárias */
  --deep-blue: #1e40af;         /* Azul profundo */
  --warm-orange: #f97316;       /* Laranja quente */
  --forest-green: #059669;      /* Verde floresta */
  
  /* Gradientes */
  --gradient-primary: linear-gradient(135deg, #f59e0b, #f97316);
  --gradient-secondary: linear-gradient(135deg, #0ea5e9, #1e40af);
  --gradient-success: linear-gradient(135deg, #10b981, #059669);
  
  /* Neutros */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### Tipografia
```css
/* Importar fontes */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Hierarquia tipográfica */
.text-display {
  font-size: 3.75rem;    /* 60px */
  font-weight: 800;
  line-height: 1;
}

.text-h1 {
  font-size: 2.25rem;    /* 36px */
  font-weight: 700;
  line-height: 1.2;
}

.text-h2 {
  font-size: 1.875rem;   /* 30px */
  font-weight: 600;
  line-height: 1.3;
}

.text-h3 {
  font-size: 1.5rem;     /* 24px */
  font-weight: 600;
  line-height: 1.4;
}

.text-h4 {
  font-size: 1.25rem;    /* 20px */
  font-weight: 600;
  line-height: 1.4;
}

.text-body-lg {
  font-size: 1.125rem;   /* 18px */
  font-weight: 400;
  line-height: 1.6;
}

.text-body {
  font-size: 1rem;       /* 16px */
  font-weight: 400;
  line-height: 1.6;
}

.text-body-sm {
  font-size: 0.875rem;   /* 14px */
  font-weight: 400;
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;    /* 12px */
  font-weight: 500;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

---

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Layouts Responsivos */
.responsive-grid {
  display: grid;
  gap: 1rem;
  
  /* Mobile: 1 coluna */
  grid-template-columns: 1fr;
  
  /* Tablet: 2 colunas */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  /* Desktop: 4 colunas */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}

/* Texto responsivo */
.responsive-text {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
}

/* Espaçamento responsivo */
.responsive-padding {
  padding: clamp(1rem, 4vw, 2.5rem);
}
```

---

## 🎯 Componentes Reutilizáveis

### Card Base
```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.card-header {
  padding: 1.5rem 1.5rem 0;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 0 1.5rem 1.5rem;
}
```

### Botões
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

.btn-secondary:hover {
  background: var(--gray-200);
}
```

### Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.badge-info {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}
```

---

## 📊 Especificações de Gráficos

### Gráfico de Geração Mensal
```typescript
const chartConfig = {
  colors: {
    consumption: '#ef4444',    // Vermelho para consumo
    generation: '#10b981',     // Verde para geração
    economy: '#f59e0b',        // Dourado para economia
  },
  
  responsive: true,
  
  layout: {
    padding: {
      top: 20,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'Inter',
          size: 12,
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#e5e7eb',
      },
      ticks: {
        font: {
          family: 'Inter',
          size: 12,
        },
        callback: function(value) {
          return value + ' kWh';
        },
      },
    },
  },
  
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: 'Inter',
          size: 14,
          weight: '500',
        },
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        family: 'Inter',
        size: 14,
        weight: '600',
      },
      bodyFont: {
        family: 'Inter',
        size: 13,
      },
      cornerRadius: 8,
      displayColors: true,
    },
  },
};
```

---

## 🖨️ Especificações para PDF

### Configurações de Página
```typescript
const pdfConfig = {
  format: 'A4',
  orientation: 'portrait',
  margins: {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40,
  },
  
  fonts: {
    Inter: {
      normal: 'Inter-Regular.ttf',
      bold: 'Inter-Bold.ttf',
      italics: 'Inter-Italic.ttf',
      bolditalics: 'Inter-BoldItalic.ttf',
    },
  },
  
  defaultStyle: {
    font: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
  },
  
  styles: {
    header: {
      fontSize: 18,
      bold: true,
      alignment: 'center',
      margin: [0, 0, 0, 20],
    },
    subheader: {
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 5],
    },
    tableHeader: {
      bold: true,
      fontSize: 11,
      color: 'white',
      fillColor: '#374151',
    },
  },
};
```

---

**Documento criado em**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Especificação Completa  
**Próximo passo**: Implementação dos layouts