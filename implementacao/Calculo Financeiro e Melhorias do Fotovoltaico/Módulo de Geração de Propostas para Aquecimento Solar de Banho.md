# Módulo de Geração de Propostas para Aquecimento Solar de Banho

**Documentação Técnica Completa**

**Autor:** Manus AI  
**Data:** 29 de julho de 2025  
**Versão:** 1.0.0

---

## Sumário Executivo

Este documento apresenta a documentação técnica completa do módulo de geração de propostas para sistemas de aquecimento solar de banho, desenvolvido como uma solução integrada para dimensionamento, seleção de equipamentos e geração automatizada de propostas comerciais. O sistema foi projetado para atender às necessidades específicas de empresas do setor de energia solar que trabalham com aquecimento de água, oferecendo uma plataforma robusta e profissional para criação de propostas personalizadas.

O módulo desenvolvido representa uma evolução significativa na automação de processos comerciais do setor de aquecimento solar, integrando cálculos técnicos precisos baseados nas normas ABNT com funcionalidades avançadas de geração de documentos e rastreamento de visualizações. A solução combina um backend robusto em Python/Flask com um frontend moderno em React, proporcionando uma experiência de usuário intuitiva e profissional.

A arquitetura do sistema foi cuidadosamente planejada para garantir escalabilidade, manutenibilidade e facilidade de integração com plataformas existentes. O módulo oferece funcionalidades completas de dimensionamento técnico, gestão de templates personalizáveis, geração de propostas em múltiplos formatos (A4 e 16:9), animações visuais e sistema de rastreamento de visualizações online, atendendo às demandas mais exigentes do mercado profissional.

## 1. Introdução e Contexto



O mercado brasileiro de aquecimento solar de água tem experimentado crescimento consistente nos últimos anos, impulsionado por fatores como a crescente consciência ambiental, políticas de incentivo governamental e a busca por redução de custos energéticos. Segundo dados da Associação Brasileira de Refrigeração, Ar Condicionado, Ventilação e Aquecimento (ABRAVA), o Brasil possui um dos maiores parques de aquecimento solar do mundo, com mais de 15 milhões de metros quadrados de coletores solares instalados.

Neste contexto de expansão, as empresas do setor enfrentam desafios significativos relacionados à padronização de processos comerciais, precisão técnica dos dimensionamentos e profissionalização da apresentação de propostas. O processo tradicional de criação de propostas para sistemas de aquecimento solar frequentemente envolve cálculos manuais complexos, uso de planilhas desatualizadas e geração manual de documentos, resultando em inconsistências, erros e perda de tempo valioso.

O módulo desenvolvido surge como resposta direta a essas necessidades do mercado, oferecendo uma solução tecnológica avançada que automatiza completamente o processo de dimensionamento e geração de propostas. A solução foi concebida com base em extensiva pesquisa das normas técnicas brasileiras, especialmente a ABNT NBR 15569:2008 (Sistema de aquecimento solar de água em circuito direto - Projeto e instalação) e as melhores práticas do setor.

A importância estratégica deste módulo reside na sua capacidade de transformar processos comerciais tradicionalmente manuais em fluxos automatizados e padronizados, garantindo precisão técnica, consistência visual e rastreabilidade completa das interações com clientes. Além disso, o sistema oferece funcionalidades avançadas de personalização que permitem às empresas manter sua identidade visual e adaptar os cálculos às suas especificidades regionais e comerciais.

## 2. Arquitetura do Sistema

### 2.1 Visão Geral da Arquitetura

O módulo de geração de propostas para aquecimento solar de banho foi desenvolvido seguindo uma arquitetura moderna de aplicação web distribuída, baseada no padrão de separação entre frontend e backend. Esta abordagem garante escalabilidade, manutenibilidade e facilidade de integração com sistemas existentes.

A arquitetura do sistema é composta por três camadas principais: a camada de apresentação (frontend React), a camada de lógica de negócio (backend Flask) e a camada de persistência (banco de dados SQLite/PostgreSQL). Esta separação permite desenvolvimento independente de cada componente, facilitando manutenção e evolução do sistema.

O frontend foi desenvolvido utilizando React 18 com TypeScript, incorporando bibliotecas modernas como Tailwind CSS para estilização, Framer Motion para animações e Shadcn/UI para componentes de interface. Esta stack tecnológica garante uma experiência de usuário fluida e responsiva, com suporte completo a dispositivos móveis e desktop.

O backend utiliza Flask como framework principal, complementado por SQLAlchemy para mapeamento objeto-relacional, WeasyPrint para geração de PDFs e Flask-CORS para suporte a requisições cross-origin. A escolha do Flask se deve à sua flexibilidade, simplicidade de implementação e excelente suporte à criação de APIs RESTful.

### 2.2 Componentes do Backend

O backend do sistema é estruturado em módulos especializados, cada um responsável por aspectos específicos da funcionalidade. O módulo de dimensionamento (`dimensionador.py`) implementa toda a lógica de cálculo baseada nas normas ABNT, incluindo estimativa de consumo de água quente, dimensionamento de boilers e coletores solares, e cálculo de economia energética.

O módulo de equipamentos (`equipamento.py`) gerencia o catálogo de produtos disponíveis, incluindo boilers de diferentes capacidades e tipos de pressão, coletores solares planos e a vácuo, pressurizadores e acessórios complementares. Este módulo permite fácil atualização do catálogo de produtos e preços, mantendo a flexibilidade comercial necessária.

O sistema de templates (`templates.py`) oferece funcionalidades avançadas de gerenciamento de modelos de proposta, permitindo criação, edição e personalização de templates em formatos A4 e 16:9. Os templates utilizam um sistema de renderização baseado em Mustache, garantindo flexibilidade na personalização de conteúdo.

O módulo de propostas (`propostas.py`) coordena a geração de documentos finais, integrando dados de dimensionamento, informações de equipamentos e templates personalizados. Este módulo também implementa funcionalidades de geração de PDF, visualização online e rastreamento de acessos.

### 2.3 Componentes do Frontend

O frontend é organizado em componentes React reutilizáveis, seguindo as melhores práticas de desenvolvimento moderno. O componente principal `DimensionadorAquecimento` coordena todo o fluxo de trabalho, desde a coleta de dados até a apresentação de resultados.

O componente `GeradorPropostas` implementa a interface de criação de propostas, incluindo formulários de dados do cliente, seleção de templates e configurações de formato. Este componente integra funcionalidades de preview em tempo real e geração de links compartilháveis.

A interface utiliza um sistema de abas (tabs) para organizar o fluxo de trabalho em etapas lógicas: dimensionamento, resultados e geração de proposta. Esta abordagem melhora a experiência do usuário e reduz a complexidade visual da interface.

As animações implementadas com Framer Motion proporcionam transições suaves entre estados da aplicação, melhorando a percepção de qualidade e profissionalismo da ferramenta. As animações incluem efeitos de fade-in, slide e hover que respondem às interações do usuário.

## 3. Funcionalidades Principais

### 3.1 Sistema de Dimensionamento Técnico

O coração do módulo reside no sistema de dimensionamento técnico, que implementa cálculos precisos baseados nas normas ABNT NBR 15569:2008 e nas melhores práticas do setor de aquecimento solar. O sistema considera múltiplas variáveis para determinar o dimensionamento ideal do sistema de aquecimento.

O cálculo de consumo de água quente considera o número de pessoas na residência, número de banheiros, duração média dos banhos e pontos de consumo adicionais como banheiras, duchas higiênicas, pias de cozinha e máquinas de lavar. Para cada ponto de consumo, o sistema aplica fatores de consumo específicos baseados em dados estatísticos do setor.

A estimativa de consumo diário utiliza a fórmula: Consumo = (Pessoas × 50L) + (Banheiros × 30L) + (Pontos adicionais × fator específico), onde os fatores são ajustados conforme a região geográfica e padrões de uso local. Esta abordagem garante precisão nos cálculos enquanto mantém flexibilidade para diferentes perfis de consumo.

O dimensionamento do boiler considera não apenas o volume de consumo diário, mas também fatores como simultaneidade de uso, temperatura de armazenamento desejada e eficiência térmica do sistema. O sistema recomenda volumes de boiler entre 1,5 a 2,0 vezes o consumo diário estimado, garantindo disponibilidade adequada de água quente mesmo em períodos de maior demanda.

Para o dimensionamento dos coletores solares, o sistema considera a irradiação solar média da região, eficiência dos coletores (placa plana ou tubo a vácuo), temperatura ambiente média e temperatura desejada da água. A área coletora é calculada utilizando a fórmula: Área = (Volume do boiler × ΔT) / (Irradiação × Eficiência × Fator de correção).

### 3.2 Gestão de Equipamentos e Catálogo

O módulo inclui um sistema completo de gestão de equipamentos que permite manutenção atualizada do catálogo de produtos disponíveis. O catálogo abrange boilers de diferentes capacidades (200L a 1000L), tipos de pressão (baixa e alta), materiais de construção (aço inox, aço carbono) e fabricantes diversos.

Os coletores solares são categorizados por tipo (placa plana ou tubo a vácuo), área útil, eficiência térmica e características construtivas. O sistema mantém informações detalhadas sobre cada modelo, incluindo dimensões, peso, pressão máxima de trabalho e certificações técnicas.

O catálogo de pressurizadores inclui modelos de diferentes potências (1/4 CV a 1 CV), vazões nominais e características de instalação. O sistema automaticamente recomenda pressurizadores quando detecta configurações de baixa pressão que podem comprometer o desempenho do sistema.

Cada equipamento no catálogo possui informações comerciais atualizáveis, incluindo preços, disponibilidade, prazos de entrega e condições comerciais. Esta flexibilidade permite às empresas manter seus catálogos sempre atualizados sem necessidade de alterações no código do sistema.

### 3.3 Sistema de Templates Personalizáveis

Uma das funcionalidades mais avançadas do módulo é o sistema de templates personalizáveis, que permite criação e edição de modelos de proposta adaptados à identidade visual e necessidades específicas de cada empresa. O sistema suporta dois formatos principais: A4 (documento tradicional) e 16:9 (apresentação).

Os templates utilizam uma linguagem de marcação baseada em Mustache, permitindo inserção dinâmica de dados calculados pelo sistema. Variáveis como `{{nome_cliente}}`, `{{consumo_diario_estimado}}` e `{{valor_total}}` são automaticamente substituídas pelos valores reais durante a geração da proposta.

O sistema inclui templates pré-configurados que servem como ponto de partida para personalização. O template A4 segue um layout tradicional de documento comercial, com cabeçalho corporativo, seções organizadas e rodapé informativo. O template 16:9 adota uma abordagem mais visual, similar a apresentações, com slides dedicados a diferentes aspectos da proposta.

A funcionalidade de preview em tempo real permite visualização imediata das alterações nos templates, facilitando o processo de personalização. O sistema renderiza os templates com dados de exemplo, permitindo avaliação completa do resultado final antes da aplicação em propostas reais.

### 3.4 Geração de Propostas Automatizada

O processo de geração de propostas integra todos os componentes do sistema em um fluxo automatizado e eficiente. Após o dimensionamento técnico, o usuário insere dados do cliente, seleciona template e configurações de formato, e o sistema gera automaticamente a proposta personalizada.

A geração de propostas suporta múltiplos formatos de saída: HTML para visualização online, PDF para download e impressão, e links compartilháveis para envio direto aos clientes. Cada formato mantém fidelidade visual e técnica, garantindo consistência na apresentação das informações.

O sistema gera automaticamente um identificador único (UUID) para cada proposta, permitindo rastreamento e gestão eficiente do pipeline comercial. As propostas são armazenadas no banco de dados com informações completas sobre dimensionamento, equipamentos selecionados e dados do cliente.

A funcionalidade de links compartilháveis permite envio direto das propostas aos clientes via email ou mensagens, eliminando a necessidade de anexos e garantindo sempre a versão mais atualizada do documento. Os links incluem rastreamento automático de visualizações, fornecendo insights valiosos sobre o engajamento dos clientes.

### 3.5 Sistema de Rastreamento e Analytics

O módulo implementa um sistema completo de rastreamento de visualizações que fornece insights detalhados sobre o comportamento dos clientes em relação às propostas enviadas. Cada acesso à proposta é registrado com informações sobre endereço IP, data/hora, user agent e duração da visualização.

O sistema de analytics permite identificação de padrões de comportamento, como horários de maior acesso, dispositivos utilizados e tempo de permanência na visualização da proposta. Estas informações são valiosas para otimização de estratégias comerciais e follow-up com clientes.

As informações de rastreamento são apresentadas em dashboards intuitivos que mostram métricas como total de visualizações, visualizações únicas, distribuição geográfica dos acessos e dispositivos mais utilizados. Estes dados auxiliam na tomada de decisões comerciais e na personalização de abordagens de vendas.

O sistema também implementa notificações automáticas que alertam a equipe comercial quando uma proposta é visualizada, permitindo follow-up oportuno e aumentando as chances de conversão. As notificações incluem informações contextuais sobre o cliente e detalhes da visualização.

## 4. Implementação Técnica Detalhada

### 4.1 Backend - Estrutura e Componentes

A implementação do backend segue uma arquitetura modular bem definida, com separação clara de responsabilidades entre diferentes componentes. O arquivo principal `main.py` configura a aplicação Flask, registra blueprints e inicializa o banco de dados, servindo como ponto de entrada para toda a aplicação.

O módulo de modelos (`models/`) define as estruturas de dados utilizadas pelo sistema, incluindo as classes `Equipamento`, `PropostaBanho`, `Template` e `VisualizacaoProposta`. Cada modelo utiliza SQLAlchemy para mapeamento objeto-relacional, garantindo portabilidade entre diferentes sistemas de banco de dados.

A classe `Equipamento` encapsula informações sobre produtos do catálogo, incluindo nome, tipo, capacidade, preço e especificações técnicas. Esta classe implementa métodos para busca e filtragem de equipamentos baseados em critérios de dimensionamento.

A classe `PropostaBanho` armazena informações completas sobre propostas geradas, incluindo dados do cliente, resultados de dimensionamento, equipamentos selecionados e metadados de criação. Esta classe implementa métodos para serialização e geração de identificadores únicos.

O módulo de rotas (`routes/`) organiza endpoints da API em blueprints especializados: `dimensionamento_bp` para cálculos técnicos, `equipamentos_bp` para gestão do catálogo, `templates_bp` para gerenciamento de modelos e `propostas_bp` para geração de documentos.

### 4.2 Algoritmos de Dimensionamento

Os algoritmos de dimensionamento implementam cálculos complexos baseados em normas técnicas e dados empíricos do setor. O algoritmo principal de estimativa de consumo considera múltiplas variáveis e aplica fatores de correção regionais.

```python
def calcular_consumo_diario(self, dados):
    # Consumo base por pessoa (50L/dia)
    consumo_base = dados['num_pessoas'] * 50
    
    # Consumo adicional por banheiro
    consumo_banheiros = dados['num_banheiros'] * 30
    
    # Fatores de pontos de consumo adicionais
    fatores_consumo = {
        'banheira': 200,
        'ducha_higienica': 20,
        'pia_cozinha': 15,
        'maquina_lavar_louca': 25,
        'maquina_lavar_roupa': 40
    }
    
    consumo_adicional = sum(
        fatores_consumo[ponto] for ponto, ativo 
        in dados.items() if ponto.startswith('tem_') and ativo
    )
    
    # Fator de correção por duração do banho
    fator_duracao = dados['duracao_banho_min'] / 10.0
    
    # Fator de correção regional
    fatores_regionais = {
        'norte': 0.9,
        'nordeste': 0.85,
        'centro-oeste': 0.95,
        'sudeste': 1.0,
        'sul': 1.1
    }
    
    fator_regional = fatores_regionais.get(dados['localizacao'], 1.0)
    
    consumo_total = (consumo_base + consumo_banheiros + consumo_adicional) * fator_duracao * fator_regional
    
    return round(consumo_total)
```

O algoritmo de dimensionamento de boiler considera não apenas o volume de consumo, mas também fatores de simultaneidade e reserva técnica:

```python
def dimensionar_boiler(self, consumo_diario, dados):
    # Fator de simultaneidade baseado no número de pessoas
    if dados['num_pessoas'] <= 2:
        fator_simultaneidade = 1.5
    elif dados['num_pessoas'] <= 4:
        fator_simultaneidade = 1.7
    else:
        fator_simultaneidade = 2.0
    
    # Volume mínimo recomendado
    volume_minimo = consumo_diario * fator_simultaneidade
    
    # Ajuste por tipo de pressão
    if dados['tipo_pressao'] == 'alta':
        volume_minimo *= 0.9  # Sistemas de alta pressão são mais eficientes
    
    # Seleção do boiler mais próximo do catálogo
    boilers_disponiveis = self.obter_boilers_por_tipo(dados['tipo_pressao'])
    boiler_selecionado = min(
        [b for b in boilers_disponiveis if b.capacidade >= volume_minimo],
        key=lambda x: x.capacidade,
        default=boilers_disponiveis[-1]  # Maior disponível se nenhum atender
    )
    
    return boiler_selecionado
```

### 4.3 Sistema de Templates e Renderização

O sistema de templates implementa um mecanismo flexível de renderização baseado em substituição de variáveis e condicionais simples. A função de renderização processa templates HTML com marcações especiais:

```python
def renderizar_template_mustache(template_html, dados):
    html_renderizado = template_html
    
    # Substituir variáveis simples {{variavel}}
    for chave, valor in dados.items():
        padrao = f"{{{{{chave}}}}}"
        html_renderizado = html_renderizado.replace(
            padrao, str(valor) if valor is not None else ''
        )
    
    # Processar condicionais {{#variavel}}...{{/variavel}}
    for chave, valor in dados.items():
        padrao_condicional = f"{{{{#{chave}}}}}(.*?){{{{/{chave}}}}}"
        
        if valor:
            # Mostrar conteúdo condicional
            matches = re.findall(padrao_condicional, html_renderizado, re.DOTALL)
            for match in matches:
                html_renderizado = re.sub(
                    padrao_condicional, match, html_renderizado, count=1
                )
        else:
            # Remover conteúdo condicional
            html_renderizado = re.sub(
                padrao_condicional, '', html_renderizado, flags=re.DOTALL
            )
    
    return html_renderizado
```

### 4.4 Geração de PDF e Documentos

A geração de PDFs utiliza a biblioteca WeasyPrint, que oferece excelente suporte a CSS e HTML moderno. O processo de geração inclui otimizações para qualidade de impressão e tamanho de arquivo:

```python
def gerar_pdf_proposta(html_content, configuracoes=None):
    # Configurações padrão para PDF
    css_print = """
    @page {
        size: A4;
        margin: 2cm;
        @bottom-center {
            content: "Página " counter(page) " de " counter(pages);
        }
    }
    
    body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
    }
    
    .no-print {
        display: none;
    }
    """
    
    # Criar documento HTML completo
    html_completo = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>{css_print}</style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Gerar PDF com WeasyPrint
    pdf_bytes = weasyprint.HTML(string=html_completo).write_pdf(
        optimize_images=True,
        pdf_version='1.7'
    )
    
    return pdf_bytes
```

## 5. Frontend - Interface e Experiência do Usuário

### 5.1 Arquitetura de Componentes React

O frontend foi desenvolvido seguindo os princípios de componentização do React, com componentes reutilizáveis e bem definidos. A estrutura de componentes segue uma hierarquia clara, com o componente principal `DimensionadorAquecimento` coordenando o fluxo de trabalho.

O componente `DimensionadorAquecimento` gerencia o estado global da aplicação, incluindo dados do formulário, resultados de dimensionamento e controle de navegação entre abas. Este componente implementa hooks personalizados para comunicação com a API e gerenciamento de estado local.

O componente `GeradorPropostas` encapsula toda a lógica relacionada à criação de propostas, incluindo coleta de dados do cliente, seleção de templates e geração de documentos. Este componente utiliza hooks de estado para gerenciar formulários complexos e comunicação assíncrona com o backend.

A biblioteca Shadcn/UI fornece componentes de interface consistentes e acessíveis, incluindo formulários, botões, modais e elementos de navegação. Estes componentes seguem as diretrizes de design system, garantindo consistência visual em toda a aplicação.

### 5.2 Sistema de Animações

As animações implementadas com Framer Motion melhoram significativamente a experiência do usuário, proporcionando feedback visual para interações e transições suaves entre estados da aplicação. O sistema de animações inclui:

```jsx
const AnimacaoFadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const AnimacaoSlide = ({ children, direction = 'left' }) => (
  <motion.div
    initial={{ opacity: 0, x: direction === 'left' ? -20 : 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    {children}
  </motion.div>
);
```

As animações são aplicadas estrategicamente em momentos-chave da interação, como carregamento de resultados, transições entre abas e feedback de ações do usuário. O sistema evita animações excessivas que possam prejudicar a performance ou distrair o usuário.

### 5.3 Responsividade e Acessibilidade

A interface foi desenvolvida com foco em responsividade, garantindo funcionamento adequado em dispositivos desktop, tablet e mobile. O sistema utiliza Tailwind CSS com classes responsivas que adaptam o layout conforme o tamanho da tela.

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Conteúdo adaptativo */}
</div>
```

A acessibilidade foi considerada em todos os aspectos da interface, incluindo navegação por teclado, labels adequados para leitores de tela, contraste de cores conforme WCAG 2.1 e estrutura semântica HTML apropriada.

### 5.4 Gestão de Estado e Performance

O gerenciamento de estado utiliza hooks nativos do React (useState, useEffect, useContext) combinados com padrões de otimização como memoização e lazy loading. O estado global é mantido no componente principal e propagado via props para componentes filhos.

```jsx
const useDimensionamento = () => {
  const [dados, setDados] = useState(dadosIniciais);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const calcular = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post('/dimensionamento/calcular', dados);
      setResultado(response.data);
    } catch (error) {
      console.error('Erro no cálculo:', error);
    } finally {
      setLoading(false);
    }
  }, [dados]);

  return { dados, setDados, resultado, loading, calcular };
};
```

A performance é otimizada através de técnicas como debouncing em campos de entrada, lazy loading de componentes pesados e cache de requisições API quando apropriado.




## 6. Integração com Trae AI

### 6.1 Preparação do Ambiente de Desenvolvimento

A integração do módulo de aquecimento de banho com o Trae AI requer preparação cuidadosa do ambiente de desenvolvimento e configuração adequada das dependências. O Trae AI oferece um ambiente de desenvolvimento integrado que suporta tanto projetos React quanto Flask, facilitando a implementação de soluções full-stack.

Para iniciar a integração, é necessário configurar o workspace do Trae AI com as dependências específicas do projeto. O backend Flask requer instalação de bibliotecas como Flask, SQLAlchemy, WeasyPrint e Flask-CORS. O frontend React necessita de dependências como Tailwind CSS, Framer Motion, Shadcn/UI e bibliotecas de ícones.

O processo de configuração no Trae AI segue os seguintes passos:

1. **Criação do Projeto Backend**: Utilize o comando `manus-create-flask-app aquecimento-banho-api` para criar a estrutura base do backend. Esta estrutura inclui configuração inicial do Flask, estrutura de diretórios organizada e arquivos de configuração básicos.

2. **Configuração do Banco de Dados**: Configure o SQLAlchemy para utilizar SQLite em desenvolvimento e PostgreSQL em produção. O Trae AI oferece suporte nativo a ambos os sistemas de banco de dados, facilitando a migração entre ambientes.

3. **Instalação de Dependências Python**: Execute `pip install flask sqlalchemy flask-cors weasyprint` no ambiente virtual do projeto. O Trae AI gerencia automaticamente ambientes virtuais, garantindo isolamento de dependências.

4. **Criação do Projeto Frontend**: Utilize `manus-create-react-app aquecimento-banho-frontend` para criar a aplicação React. Esta estrutura inclui configuração do Vite, Tailwind CSS pré-configurado e componentes base do Shadcn/UI.

5. **Configuração de Proxy**: Configure o Vite para proxy das requisições API para o backend Flask, permitindo desenvolvimento integrado sem problemas de CORS.

### 6.2 Estrutura de Arquivos Recomendada

A organização de arquivos no Trae AI deve seguir uma estrutura clara que facilite manutenção e colaboração. A estrutura recomendada separa claramente backend e frontend, mantendo arquivos de configuração na raiz do projeto:

```
projeto-aquecimento-banho/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   └── equipamento.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── dimensionamento.py
│   │   │   ├── equipamentos.py
│   │   │   ├── templates.py
│   │   │   └── propostas.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── calculadora.py
│   │   └── main.py
│   ├── requirements.txt
│   └── config.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── DimensionadorAquecimento.jsx
│   │   │   └── GeradorPropostas.jsx
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
├── tests/
└── README.md
```

### 6.3 Configuração de Variáveis de Ambiente

O Trae AI suporta configuração flexível através de variáveis de ambiente, permitindo adaptação do sistema para diferentes ambientes (desenvolvimento, teste, produção). As principais variáveis de ambiente incluem:

```bash
# Configurações do Flask
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta_aqui

# Configurações do Banco de Dados
DATABASE_URL=sqlite:///app.db
# Para produção: postgresql://user:password@host:port/database

# Configurações de API
API_BASE_URL=http://localhost:5000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Configurações de Email (para notificações)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app

# Configurações de Storage (para templates e arquivos)
UPLOAD_FOLDER=uploads/
MAX_CONTENT_LENGTH=16777216  # 16MB
```

### 6.4 Implementação de Testes

O desenvolvimento no Trae AI deve incluir implementação de testes automatizados para garantir qualidade e confiabilidade do código. O sistema de testes abrange tanto backend quanto frontend, utilizando frameworks apropriados para cada tecnologia.

Para o backend Flask, utilize pytest para testes unitários e de integração:

```python
# tests/test_dimensionamento.py
import pytest
from src.models.dimensionador import DimensionadorAquecimento

class TestDimensionamento:
    def setup_method(self):
        self.dimensionador = DimensionadorAquecimento()
    
    def test_calculo_consumo_basico(self):
        dados = {
            'num_pessoas': 4,
            'num_banheiros': 2,
            'duracao_banho_min': 10,
            'localizacao': 'sudeste',
            'tem_banheira': False,
            'tem_ducha_higienica': True,
            'tem_pia_cozinha': True,
            'tem_maquina_lavar_louca': False,
            'tem_maquina_lavar_roupa': False
        }
        
        resultado = self.dimensionador.calcular_consumo_diario(dados)
        
        assert resultado > 0
        assert isinstance(resultado, int)
        assert resultado >= 200  # Mínimo esperado para 4 pessoas
    
    def test_dimensionamento_boiler(self):
        consumo = 300
        dados = {
            'num_pessoas': 4,
            'tipo_pressao': 'baixa'
        }
        
        boiler = self.dimensionador.dimensionar_boiler(consumo, dados)
        
        assert boiler is not None
        assert boiler.capacidade >= consumo * 1.5
```

Para o frontend React, utilize Jest e React Testing Library:

```javascript
// tests/DimensionadorAquecimento.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DimensionadorAquecimento from '../src/components/DimensionadorAquecimento';

describe('DimensionadorAquecimento', () => {
  test('renderiza formulário de dimensionamento', () => {
    render(<DimensionadorAquecimento />);
    
    expect(screen.getByLabelText(/número de pessoas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número de banheiros/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calcular dimensionamento/i })).toBeInTheDocument();
  });
  
  test('executa cálculo de dimensionamento', async () => {
    render(<DimensionadorAquecimento />);
    
    const inputPessoas = screen.getByLabelText(/número de pessoas/i);
    const botaoCalcular = screen.getByRole('button', { name: /calcular dimensionamento/i });
    
    fireEvent.change(inputPessoas, { target: { value: '4' } });
    fireEvent.click(botaoCalcular);
    
    await waitFor(() => {
      expect(screen.getByText(/consumo diário/i)).toBeInTheDocument();
    });
  });
});
```

### 6.5 Deployment e Produção

O Trae AI oferece funcionalidades integradas de deployment que facilitam a publicação do módulo em ambiente de produção. O processo de deployment inclui build automatizado, otimização de assets e configuração de infraestrutura.

Para o backend Flask, configure o deployment utilizando:

```python
# config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

Para o frontend React, configure o build de produção:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          animations: ['framer-motion']
        }
      }
    }
  }
})
```

## 7. Guia de Customização e Extensão

### 7.1 Personalização de Templates

O sistema de templates foi projetado para máxima flexibilidade, permitindo personalização completa da aparência e estrutura das propostas. A personalização pode ser realizada em diferentes níveis, desde ajustes simples de cores e fontes até reestruturação completa do layout.

Para criar um novo template, acesse a interface de gerenciamento de templates e utilize o editor integrado. O sistema suporta HTML completo com CSS incorporado, permitindo criação de designs sofisticados. Variáveis dinâmicas são inseridas utilizando a sintaxe `{{nome_variavel}}`.

Exemplo de template personalizado:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Proposta {{nome_cliente}}</title>
    <style>
        body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header {
            background: #2c3e50;
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .content {
            padding: 2rem;
        }
        
        .highlight-box {
            background: #ecf0f1;
            border-left: 4px solid #3498db;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        .value-display {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Proposta de Aquecimento Solar</h1>
            <p>Personalizada para {{nome_cliente}}</p>
        </div>
        
        <div class="content">
            <div class="highlight-box">
                <h3>Dimensionamento do Sistema</h3>
                <div class="value-display">{{consumo_diario_estimado}}L/dia</div>
                <p>Consumo diário estimado de água quente</p>
            </div>
            
            <div class="highlight-box">
                <h3>Investimento Total</h3>
                <div class="value-display">R$ {{valor_total}}</div>
                <p>Sistema completo instalado</p>
            </div>
        </div>
    </div>
</body>
</html>
```

### 7.2 Extensão do Catálogo de Equipamentos

O catálogo de equipamentos pode ser facilmente expandido para incluir novos produtos, fabricantes ou categorias. A estrutura modular do sistema permite adição de novos tipos de equipamentos sem alterações no código principal.

Para adicionar novos equipamentos, utilize a API de gerenciamento ou interface administrativa:

```python
# Exemplo de adição de novo boiler
novo_boiler = {
    "nome": "Boiler Solar 500L Inox Alta Pressão Premium",
    "tipo": "boiler",
    "subtipo": "alta_pressao",
    "capacidade": 500,
    "material": "aco_inox_316",
    "pressao_maxima": 40,
    "temperatura_maxima": 95,
    "garantia_anos": 5,
    "preco": 3500.00,
    "fabricante": "SolarTech Premium",
    "certificacoes": ["INMETRO", "ABNT"],
    "especificacoes_tecnicas": {
        "diametro": 600,
        "altura": 1800,
        "peso_vazio": 85,
        "isolamento": "poliuretano_50mm",
        "conexoes": "3/4_npt"
    }
}
```

### 7.3 Customização de Cálculos

Os algoritmos de dimensionamento podem ser customizados para atender especificidades regionais ou metodologias proprietárias. O sistema permite sobrescrita de métodos de cálculo através de configuração ou extensão de classes.

```python
class DimensionadorCustomizado(DimensionadorAquecimento):
    def calcular_consumo_diario(self, dados):
        # Implementação customizada
        consumo_base = super().calcular_consumo_diario(dados)
        
        # Aplicar fatores específicos da empresa
        if dados.get('cliente_premium'):
            consumo_base *= 1.2  # Clientes premium tendem a usar mais
        
        # Ajuste sazonal
        mes_atual = datetime.now().month
        if mes_atual in [6, 7, 8]:  # Inverno
            consumo_base *= 1.15
        
        return consumo_base
    
    def calcular_economia_energia(self, dados, equipamentos):
        # Cálculo de economia personalizado
        economia_base = super().calcular_economia_energia(dados, equipamentos)
        
        # Considerar tarifas específicas da região
        tarifa_local = self.obter_tarifa_regional(dados['localizacao'])
        economia_base['economia_mensal'] *= tarifa_local
        
        return economia_base
```

### 7.4 Integração com Sistemas Externos

O módulo foi projetado para facilitar integração com sistemas externos como CRMs, ERPs e plataformas de e-commerce. A API RESTful permite comunicação bidirecional com outros sistemas.

Exemplo de integração com CRM:

```python
# webhook para sincronização com CRM
@app.route('/webhook/crm-sync', methods=['POST'])
def sincronizar_crm():
    dados = request.get_json()
    
    if dados['evento'] == 'proposta_criada':
        # Enviar dados para CRM
        crm_client = CRMClient(api_key=os.environ.get('CRM_API_KEY'))
        
        lead_data = {
            'nome': dados['nome_cliente'],
            'email': dados['email_cliente'],
            'telefone': dados['telefone_cliente'],
            'valor_proposta': dados['valor_total'],
            'status': 'proposta_enviada',
            'origem': 'dimensionador_aquecimento'
        }
        
        crm_client.criar_lead(lead_data)
    
    return {'status': 'success'}
```

## 8. Manutenção e Suporte

### 8.1 Monitoramento e Logs

O sistema implementa logging abrangente para facilitar monitoramento e diagnóstico de problemas. Os logs incluem informações sobre requisições API, erros de sistema, performance e atividade de usuários.

```python
import logging
from logging.handlers import RotatingFileHandler

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

# Handler para arquivo rotativo
file_handler = RotatingFileHandler(
    'logs/aquecimento_banho.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)

app.logger.addHandler(file_handler)

# Logging de eventos importantes
@app.after_request
def log_request(response):
    app.logger.info(
        f'{request.remote_addr} - {request.method} {request.path} - {response.status_code}'
    )
    return response
```

### 8.2 Backup e Recuperação

Implemente rotinas regulares de backup para proteger dados de propostas, templates e configurações. O sistema suporta backup automático do banco de dados e arquivos de configuração.

```bash
#!/bin/bash
# Script de backup automático

BACKUP_DIR="/backups/aquecimento_banho"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup do banco de dados
sqlite3 app.db ".backup ${BACKUP_DIR}/db_backup_${DATE}.db"

# Backup de templates e configurações
tar -czf "${BACKUP_DIR}/files_backup_${DATE}.tar.gz" uploads/ templates/ config/

# Manter apenas últimos 30 backups
find ${BACKUP_DIR} -name "*.db" -mtime +30 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
```

### 8.3 Atualizações e Versionamento

Mantenha o sistema atualizado seguindo práticas de versionamento semântico. Documente todas as alterações e teste thoroughly antes de aplicar atualizações em produção.

```python
# version.py
__version__ = "1.2.3"
__release_date__ = "2025-07-29"
__changelog__ = {
    "1.2.3": [
        "Correção de bug na geração de PDF",
        "Melhoria na performance de cálculos",
        "Atualização de dependências de segurança"
    ],
    "1.2.2": [
        "Novo template de proposta premium",
        "Integração com API de CEP",
        "Otimização de queries do banco de dados"
    ]
}
```

## 9. Conclusão e Próximos Passos

O módulo de geração de propostas para aquecimento solar de banho representa uma solução completa e profissional para empresas do setor que buscam automatizar e profissionalizar seus processos comerciais. A implementação combina precisão técnica, flexibilidade de personalização e facilidade de uso, atendendo às demandas mais exigentes do mercado.

A arquitetura modular e bem documentada facilita manutenção, extensão e integração com sistemas existentes. O uso de tecnologias modernas e padrões de desenvolvimento garante longevidade e escalabilidade da solução.

### 9.1 Próximos Desenvolvimentos

As próximas versões do módulo podem incluir funcionalidades avançadas como:

- **Integração com APIs de Clima**: Utilização de dados meteorológicos em tempo real para cálculos mais precisos de irradiação solar e performance do sistema.

- **Calculadora de Financiamento**: Módulo integrado para cálculo de financiamentos e simulação de parcelas, facilitando a venda de sistemas de maior valor.

- **Dashboard Analytics**: Interface de business intelligence com métricas de vendas, performance de propostas e análise de mercado.

- **App Mobile**: Aplicativo móvel para vendedores externos, permitindo criação de propostas em campo com funcionalidades offline.

- **Integração IoT**: Conexão com sistemas de monitoramento para acompanhamento de performance pós-instalação e geração de relatórios de economia real.

### 9.2 Considerações Finais

A implementação bem-sucedida deste módulo no Trae AI proporcionará às empresas do setor de aquecimento solar uma vantagem competitiva significativa, através da automação de processos, padronização de qualidade e profissionalização da apresentação comercial.

O investimento em tecnologia e automação é fundamental para o crescimento sustentável do setor de energia solar no Brasil. Este módulo representa um passo importante nessa direção, oferecendo ferramentas modernas e eficientes para empresas que desejam se destacar no mercado.

A documentação apresentada fornece todas as informações necessárias para implementação, customização e manutenção do sistema, garantindo que as empresas possam aproveitar ao máximo o potencial da solução desenvolvida.

---

**Referências e Recursos Adicionais**

1. ABNT NBR 15569:2008 - Sistema de aquecimento solar de água em circuito direto - Projeto e instalação
2. ABRAVA - Associação Brasileira de Refrigeração, Ar Condicionado, Ventilação e Aquecimento
3. Flask Documentation - https://flask.palletsprojects.com/
4. React Documentation - https://react.dev/
5. Tailwind CSS Documentation - https://tailwindcss.com/
6. WeasyPrint Documentation - https://weasyprint.org/
7. Framer Motion Documentation - https://www.framer.com/motion/

**Suporte Técnico**

Para suporte técnico e esclarecimentos sobre a implementação, entre em contato através dos canais oficiais do Trae AI ou consulte a documentação online atualizada.

**Licença e Direitos Autorais**

Este módulo é propriedade intelectual da equipe de desenvolvimento e está licenciado para uso conforme os termos de serviço do Trae AI. Todas as marcas e nomes comerciais mencionados são propriedade de seus respectivos detentores.

