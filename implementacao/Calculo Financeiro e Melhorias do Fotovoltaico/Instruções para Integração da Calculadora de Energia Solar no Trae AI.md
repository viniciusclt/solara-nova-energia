# Instruções para Integração da Calculadora de Energia Solar no Trae AI

## Visão Geral

Este documento fornece instruções completas para integrar a lógica de cálculo de viabilidade de energia solar desenvolvida em sua plataforma React + Node.js no ambiente Trae AI (IDE). A implementação foi baseada na análise detalhada da planilha `Modelo-Cactos-DimensionamentoV15.11.xlsx` e incorpora as mais recentes regulamentações da Lei 14.300 e tarifas das concessionárias do Rio de Janeiro para 2025.

## Arquitetura da Solução

A solução foi desenvolvida seguindo uma arquitetura de microserviços com separação clara entre frontend e backend:

### Backend (Python/Flask)
- **Framework**: Flask com Flask-CORS para suporte a requisições cross-origin
- **Estrutura**: Modular com blueprints para organização das rotas
- **Modelos**: Classes Python para representar tarifas e lógica de cálculo
- **API RESTful**: Endpoints bem definidos para diferentes tipos de cálculo

### Frontend (React)
- **Framework**: React com componentes funcionais e hooks
- **UI Components**: Shadcn/UI para interface moderna e responsiva
- **Gráficos**: Recharts para visualização de dados financeiros
- **Estado**: Gerenciamento local de estado com useState

## Estrutura de Arquivos Recomendada

Para uma integração eficiente no Trae AI, recomenda-se a seguinte estrutura de projeto:

```
energia-solar-platform/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── tarifa.py
│   │   │   ├── calculadora_solar.py
│   │   │   └── __init__.py
│   │   ├── routes/
│   │   │   ├── calculadora.py
│   │   │   └── __init__.py
│   │   ├── utils/
│   │   │   ├── validators.py
│   │   │   └── helpers.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_calculadora.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CalculadoraSolar.jsx
│   │   │   ├── TabelaResultados.jsx
│   │   │   ├── GraficoFluxoCaixa.jsx
│   │   │   └── FormularioProposta.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── README.md
└── docs/
    ├── api-documentation.md
    ├── user-guide.md
    └── deployment-guide.md
```

## Implementação Passo a Passo no Trae AI

### Etapa 1: Configuração do Ambiente Backend

No Trae AI, comece criando um novo projeto Python e configure o ambiente virtual:

```bash
# Criar diretório do projeto
mkdir energia-solar-backend
cd energia-solar-backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install flask flask-cors python-dotenv
```

Crie o arquivo `requirements.txt` com as dependências necessárias:

```
Flask==3.1.1
Flask-CORS==6.0.0
python-dotenv==1.0.0
```

### Etapa 2: Implementação dos Modelos de Dados

Crie o arquivo `src/models/tarifa.py` com a classe Tarifa que encapsula toda a lógica tarifária das concessionárias do Rio de Janeiro. Esta classe é fundamental pois centraliza o conhecimento sobre as estruturas tarifárias complexas que incluem TUSD, TE, impostos (PIS, COFINS, ICMS) e taxas (COSIP) que variam por faixa de consumo.

A implementação da classe Tarifa deve considerar as especificidades de cada concessionária. Para a Light, por exemplo, os valores de COSIP variam significativamente entre as faixas de consumo, começando em R$ 6,22 para consumos entre 51-100 kWh e chegando a R$ 31,86 para consumos acima de 500 kWh. Já para a Enel-RJ, os valores são diferentes, com COSIP de R$ 83,3 para faixas maiores, refletindo as diferenças regionais de cobrança.

O método `calcular_tarifa_final()` implementa a fórmula oficial de cálculo tarifário: `(Tarifa_base + TUSD + TE) × (1 + PIS + COFINS) × (1 + ICMS) + COSIP`. Esta fórmula é aplicada de forma escalonada, considerando que o ICMS no Rio de Janeiro tem alíquotas diferenciadas: isenção para consumos até 50 kWh, 18% para consumos entre 51-299 kWh, e mantém-se em 18% para faixas superiores, seguindo a legislação estadual.

### Etapa 3: Implementação da Lógica de Cálculo

O arquivo `src/models/calculadora_solar.py` contém a classe `CalculadoraSolar`, que é o coração da aplicação. Esta classe implementa toda a lógica financeira baseada na planilha original, mas com melhorias significativas para atender às normas atuais.

O método principal `calcular_economia_fluxo_caixa()` executa uma simulação mês a mês ao longo do período de projeção (tipicamente 25 anos). Para cada mês, o algoritmo:

1. **Calcula o autoconsumo**: Determina quanto da energia gerada é consumida instantaneamente, usando o fator de simultaneidade (tipicamente 30%). Este fator é crucial pois representa a sobreposição entre o perfil de geração solar e o perfil de consumo do cliente.

2. **Gerencia créditos de energia**: Implementa o sistema de compensação elétrica conforme a REN 482/2012 da ANEEL, onde a energia excedente injetada na rede gera créditos que podem ser utilizados em até 60 meses.

3. **Aplica a Lei 14.300**: Calcula a cobrança do Fio B sobre a energia injetada, seguindo a regra de transição que aumenta progressivamente de 15% em 2023 para 100% a partir de 2029.

4. **Considera inflação e depreciação**: Aplica inflação mensal no consumo (refletindo aumentos tarifários) e depreciação mensal na geração (refletindo a degradação natural dos painéis solares).

A implementação da regra de transição da Lei 14.300 é particularmente importante. O método `get_percentual_fio_b()` determina qual percentual do Fio B deve ser cobrado baseado no ano de instalação do sistema. Sistemas instalados até 6 de janeiro de 2023 mantêm as regras antigas (sem cobrança do Fio B) até 2045, enquanto sistemas novos seguem a progressão: 15% (2023), 30% (2024), 45% (2025), 60% (2026), 75% (2027), 90% (2028), e 100% a partir de 2029.

### Etapa 4: Desenvolvimento das APIs

O arquivo `src/routes/calculadora.py` define os endpoints da API RESTful. O endpoint principal `/calcular-viabilidade` aceita um payload JSON com todos os parâmetros necessários para o cálculo e retorna um objeto detalhado com os resultados financeiros.

O endpoint `/simulacao-rapida` oferece uma versão simplificada para casos onde o usuário fornece apenas informações básicas (custo do sistema, consumo mensal e concessionária). Neste caso, a API estima a geração como 85% do consumo (regra prática do mercado) e usa parâmetros padrão para os demais valores.

Para garantir a robustez da API, implemente validações rigorosas nos dados de entrada. Verifique se os valores numéricos estão dentro de faixas razoáveis (por exemplo, custo do sistema entre R$ 5.000 e R$ 500.000, consumo mensal entre 100 e 10.000 kWh) e se a concessionária informada está na lista de suportadas.

### Etapa 5: Configuração do Frontend React

No Trae AI, crie um novo projeto React usando Create React App ou Vite. A estrutura recomendada separa componentes por responsabilidade:

- `CalculadoraSolar.jsx`: Componente principal que gerencia o estado da aplicação
- `FormularioProposta.jsx`: Formulário para entrada de dados do cliente
- `TabelaResultados.jsx`: Exibição tabular dos resultados anuais
- `GraficoFluxoCaixa.jsx`: Visualização gráfica do fluxo de caixa

O componente `CalculadoraSolar` deve gerenciar o estado global da aplicação usando o hook `useState`. Mantenha separados os estados para dados de entrada (`formData`), resultados (`resultado`), estado de carregamento (`loading`) e mensagens de erro (`error`).

Para a comunicação com a API, crie um serviço dedicado em `src/services/api.js` que encapsule todas as chamadas HTTP. Use `fetch` ou `axios` para fazer as requisições, sempre implementando tratamento de erro adequado e feedback visual para o usuário.

### Etapa 6: Implementação da Interface de Usuário

A interface deve ser intuitiva e profissional, adequada para uso por vendedores de energia solar. Use componentes do Shadcn/UI para manter consistência visual:

```jsx
// Exemplo de formulário de entrada
<Card>
  <CardHeader>
    <CardTitle>Dados do Sistema Solar</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="custo-sistema">Custo do Sistema (R$)</Label>
        <Input
          id="custo-sistema"
          type="number"
          value={formData.custoSistema}
          onChange={(e) => handleInputChange('custoSistema', e.target.value)}
          placeholder="Ex: 25000"
        />
      </div>
      {/* Outros campos... */}
    </div>
  </CardContent>
</Card>
```

Para os gráficos, use a biblioteca Recharts que oferece componentes React nativos para visualização de dados. O gráfico de fluxo de caixa é essencial para demonstrar visualmente o retorno do investimento:

```jsx
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={resultado.resultados}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="ano" />
    <YAxis tickFormatter={(value) => formatarMoeda(value)} />
    <Tooltip formatter={(value) => formatarMoeda(value)} />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="fluxoCaixaAcumulado" 
      stroke="#8884d8" 
      strokeWidth={2}
      name="Fluxo de Caixa Acumulado"
    />
  </LineChart>
</ResponsiveContainer>
```

### Etapa 7: Integração e Testes

No ambiente Trae AI, configure scripts de desenvolvimento que permitam executar frontend e backend simultaneamente. Crie um arquivo `package.json` na raiz do projeto com scripts para facilitar o desenvolvimento:

```json
{
  "scripts": {
    "dev:backend": "cd backend && python src/main.py",
    "dev:frontend": "cd frontend && npm start",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "test:backend": "cd backend && python -m pytest tests/",
    "test:frontend": "cd frontend && npm test"
  }
}
```

Implemente testes unitários para as funções críticas de cálculo. Para o backend, use pytest para testar a lógica de cálculo com diferentes cenários. Para o frontend, use Jest e React Testing Library para testar os componentes.

### Etapa 8: Configuração de Produção

Para deploy em produção, configure variáveis de ambiente para diferentes ambientes (desenvolvimento, homologação, produção). Crie um arquivo `.env.example` com as variáveis necessárias:

```
FLASK_ENV=production
API_BASE_URL=https://api.energia-solar.com
CORS_ORIGINS=https://app.energia-solar.com
DATABASE_URL=sqlite:///app.db
```

Configure o build do frontend para produção, otimizando os assets e configurando o proxy para a API. No arquivo `package.json` do frontend, adicione:

```json
{
  "proxy": "http://localhost:5000",
  "homepage": "/app"
}
```

## Considerações Específicas para o Trae AI

### Gerenciamento de Dependências

O Trae AI oferece excelente suporte para gerenciamento de dependências Python e Node.js. Use o arquivo `requirements.txt` para Python e `package.json` para Node.js, mantendo as versões fixas para garantir reprodutibilidade:

```
# requirements.txt
Flask==3.1.1
Flask-CORS==6.0.0
python-dotenv==1.0.0
```

### Debugging e Desenvolvimento

Configure o debugger do Trae AI para trabalhar com Python e JavaScript simultaneamente. Use breakpoints estratégicos nos métodos de cálculo para verificar os valores intermediários durante o desenvolvimento.

Para o backend Python, configure o Flask em modo debug:

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

Para o frontend React, use as ferramentas de desenvolvimento do navegador e o React Developer Tools para inspecionar o estado dos componentes.

### Versionamento e Colaboração

Use Git de forma eficiente no Trae AI, criando branches para diferentes funcionalidades:

- `main`: Branch principal com código estável
- `develop`: Branch de desenvolvimento com últimas funcionalidades
- `feature/calculadora-avancada`: Branches para funcionalidades específicas
- `hotfix/correcao-tarifa-light`: Branches para correções urgentes

Mantenha commits pequenos e descritivos, facilitando o rastreamento de mudanças:

```bash
git commit -m "feat: implementa cálculo de VPL com taxa de desconto variável"
git commit -m "fix: corrige cálculo do COSIP para faixas de consumo da Enel-RJ"
git commit -m "docs: atualiza documentação da API com novos endpoints"
```

## Otimizações de Performance

### Backend

Para otimizar a performance do backend, implemente cache para as tarifas das concessionárias, que são dados relativamente estáticos:

```python
from functools import lru_cache

@lru_cache(maxsize=10)
def get_tarifa_cached(concessionaria, ano):
    return Tarifa.get_tarifas_2025()[concessionaria]
```

Para cálculos intensivos, considere usar NumPy para operações vetorizadas, especialmente quando processando múltiplos cenários simultaneamente.

### Frontend

No frontend, implemente lazy loading para componentes pesados e use React.memo para evitar re-renderizações desnecessárias:

```jsx
const GraficoFluxoCaixa = React.memo(({ dados }) => {
  // Componente só re-renderiza se os dados mudarem
  return <LineChart data={dados} />;
});
```

Use debouncing para inputs que disparam cálculos, evitando requisições excessivas à API:

```jsx
const debouncedCalcular = useCallback(
  debounce((dados) => {
    calcularViabilidade(dados);
  }, 500),
  []
);
```

## Segurança e Validação

### Validação de Dados

Implemente validação tanto no frontend quanto no backend. No frontend, use bibliotecas como Yup ou Zod para validação de schemas:

```javascript
const schemaValidacao = z.object({
  custoSistema: z.number().min(5000).max(500000),
  consumoMensalKwh: z.number().min(100).max(10000),
  concessionaria: z.enum(['light', 'enel-rj', 'ceral'])
});
```

No backend, valide todos os inputs antes de processar:

```python
def validar_dados_entrada(data):
    errors = []
    
    if not isinstance(data.get('custo_sistema'), (int, float)) or data['custo_sistema'] <= 0:
        errors.append("Custo do sistema deve ser um número positivo")
    
    if not isinstance(data.get('consumo_mensal_kwh'), (int, float)) or data['consumo_mensal_kwh'] <= 0:
        errors.append("Consumo mensal deve ser um número positivo")
    
    return errors
```

### Tratamento de Erros

Implemente tratamento de erro robusto em todos os níveis da aplicação. No backend, use try-catch para capturar exceções e retornar mensagens de erro apropriadas:

```python
@calculadora_bp.route('/calcular-viabilidade', methods=['POST'])
def calcular_viabilidade():
    try:
        # Lógica de cálculo
        resultado = calculadora.calcular_economia_fluxo_caixa(...)
        return jsonify({'success': True, 'data': resultado})
    except ValueError as e:
        return jsonify({'success': False, 'error': f'Dados inválidos: {str(e)}'}), 400
    except Exception as e:
        logger.error(f'Erro no cálculo: {str(e)}')
        return jsonify({'success': False, 'error': 'Erro interno do servidor'}), 500
```

No frontend, implemente feedback visual para diferentes estados (carregando, sucesso, erro):

```jsx
{loading && <Spinner />}
{error && <Alert variant="destructive">{error}</Alert>}
{resultado && <TabelaResultados dados={resultado} />}
```

## Documentação e Manutenção

### Documentação da API

Mantenha documentação atualizada da API usando ferramentas como Swagger/OpenAPI. Crie um arquivo `api-docs.yaml` descrevendo todos os endpoints:

```yaml
openapi: 3.0.0
info:
  title: API Calculadora Solar
  version: 1.0.0
paths:
  /api/calculadora/calcular-viabilidade:
    post:
      summary: Calcula viabilidade econômica de sistema solar
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                custo_sistema:
                  type: number
                  example: 25000
```

### Logs e Monitoramento

Implemente logging adequado para facilitar debugging em produção:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def calcular_economia_fluxo_caixa(self, ...):
    logger.info(f"Iniciando cálculo para sistema de R$ {self.custo_sistema}")
    # Lógica de cálculo
    logger.info(f"Cálculo concluído. Payback: {payback} anos")
```

### Testes Automatizados

Mantenha uma suíte de testes abrangente que cubra os cenários principais:

```python
def test_calculo_payback_cenario_otimista():
    calculadora = CalculadoraSolar({
        'custo_sistema': 20000,
        'custo_disponibilidade_kwh': 100
    })
    
    resultado = calculadora.calcular_economia_fluxo_caixa(
        consumo_mensal_inicial=800,
        geracao_mensal_inicial=850,
        tarifa=tarifa_light
    )
    
    assert resultado['payback'] <= 7  # Payback esperado
    assert resultado['vpl'] > 0  # VPL positivo
```

## Conclusão

A integração da calculadora de energia solar no Trae AI requer atenção cuidadosa aos detalhes técnicos e regulatórios. A implementação proposta oferece uma base sólida que pode ser expandida conforme necessário, mantendo sempre a precisão dos cálculos e a conformidade com as normas vigentes.

O sucesso da implementação dependerá da manutenção constante das tarifas atualizadas, do monitoramento das mudanças regulatórias e da coleta de feedback dos usuários para melhorias contínuas. Com esta base, você terá uma ferramenta poderosa para geração de propostas precisas e profissionais no mercado de energia solar.

