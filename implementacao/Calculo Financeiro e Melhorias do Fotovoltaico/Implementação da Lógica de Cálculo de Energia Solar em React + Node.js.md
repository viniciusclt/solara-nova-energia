# Implementação da Lógica de Cálculo de Energia Solar em React + Node.js

## Estrutura Geral da Aplicação

A aplicação será dividida em duas partes principais:

1. **Backend (Node.js/Express)**: API responsável pelos cálculos financeiros e gerenciamento de dados tarifários
2. **Frontend (React)**: Interface para entrada de dados e visualização dos resultados

## Backend - Node.js/Express

### 1. Estrutura de Dados para Tarifas

```javascript
// models/Tarifa.js
class Tarifa {
  constructor(concessionaria, ano, dados) {
    this.concessionaria = concessionaria; // 'light', 'enel-rj', 'ceral'
    this.ano = ano;
    this.tarifaBase = dados.tarifaBase;
    this.tusd = dados.tusd;
    this.te = dados.te;
    this.fioB = dados.fioB;
    this.percentualFioB = dados.percentualFioB;
    this.pis = dados.pis;
    this.cofins = dados.cofins;
    this.icms = dados.icms; // Pode variar por faixa de consumo
    this.cosip = dados.cosip; // Pode variar por faixa de consumo
  }

  calcularTarifaFinal(consumoKwh) {
    // Lógica para calcular tarifa final considerando faixas de consumo
    const icmsAplicavel = this.getIcmsPorFaixa(consumoKwh);
    const cosipAplicavel = this.getCosipPorFaixa(consumoKwh);
    
    return (this.tarifaBase + this.tusd + this.te) * 
           (1 + this.pis + this.cofins) * 
           (1 + icmsAplicavel) + cosipAplicavel;
  }

  getIcmsPorFaixa(consumoKwh) {
    // Implementar lógica de faixas de ICMS conforme RJ
    if (consumoKwh <= 50) return 0;
    if (consumoKwh <= 299) return 0.18;
    if (consumoKwh <= 450) return 0.18;
    return 0.18;
  }

  getCosipPorFaixa(consumoKwh) {
    // Implementar lógica de faixas de COSIP
    // Valores baseados na planilha original
    if (consumoKwh <= 50) return 0;
    if (consumoKwh <= 100) return 6.22;
    if (consumoKwh <= 140) return 8.86;
    // ... continuar com todas as faixas
    return 31.86; // Valor padrão para faixas maiores
  }
}
```

### 2. Classe Principal de Cálculo

```javascript
// services/CalculadoraSolar.js
class CalculadoraSolar {
  constructor(parametros) {
    this.custoSistema = parametros.custoSistema;
    this.custoDisponibilidadeKwh = parametros.custoDisponibilidadeKwh;
    this.fatorSimultaneidade = parametros.fatorSimultaneidade || 0.3;
    this.inflacaoAnual = parametros.inflacaoAnual || 0.1;
    this.taxaDesconto = parametros.taxaDesconto || 0.02;
    this.depreciacaoAnualFv = parametros.depreciacaoAnualFv || 0.007;
    this.custoOmAnual = parametros.custoOmAnual || 0;
    this.anoInstalacao = parametros.anoInstalacao;
  }

  calcularEconomiaFluxoCaixa(consumoMensalInicial, geracaoMensalInicial, tarifa, anosProjecao = 25) {
    let fluxoCaixaAcumulado = -this.custoSistema;
    const resultados = [];
    let creditosAcumulados = 0;

    let consumoMensalAtual = consumoMensalInicial;
    let geracaoMensalAtual = geracaoMensalInicial;

    for (let ano = 1; ano <= anosProjecao; ano++) {
      let economiaAnual = 0;
      const resultadosMensais = [];

      for (let mes = 1; mes <= 12; mes++) {
        // 1. Calcular autoconsumo e injeção
        const autoconsumoKwh = Math.min(
          consumoMensalAtual * this.fatorSimultaneidade, 
          geracaoMensalAtual
        );
        const consumidoDaRedeKwh = Math.max(0, consumoMensalAtual - autoconsumoKwh);
        const injetadoNaRedeKwh = Math.max(0, geracaoMensalAtual - autoconsumoKwh);

        // 2. Gerenciar créditos
        creditosAcumulados += injetadoNaRedeKwh;
        const creditosUtilizados = Math.min(creditosAcumulados, consumidoDaRedeKwh);
        creditosAcumulados -= creditosUtilizados;
        const energiaCompradaDaRede = Math.max(0, consumidoDaRedeKwh - creditosUtilizados);

        // 3. Aplicar regra de transição Lei 14.300 (Fio B)
        const percentualFioB = this.getPercentualFioB(this.anoInstalacao, this.anoInstalacao + ano - 1);
        const custoFioBCompensado = injetadoNaRedeKwh * tarifa.fioB * percentualFioB;

        // 4. Calcular custos
        const custoSemFv = consumoMensalAtual * tarifa.calcularTarifaFinal(consumoMensalAtual);
        
        const custoComFv = (energiaCompradaDaRede * tarifa.calcularTarifaFinal(energiaCompradaDaRede)) + 
                          custoFioBCompensado + 
                          (this.custoDisponibilidadeKwh * tarifa.tarifaBase);

        // 5. Calcular economia mensal
        const economiaMensal = custoSemFv - custoComFv;
        economiaAnual += economiaMensal;

        resultadosMensais.push({
          mes,
          consumoKwh: consumoMensalAtual,
          geracaoKwh: geracaoMensalAtual,
          autoconsumoKwh,
          injetadoNaRedeKwh,
          creditosAcumulados,
          custoSemFv,
          custoComFv,
          economiaMensal
        });

        // Atualizar para próximo mês
        consumoMensalAtual *= (1 + this.inflacaoAnual / 12);
        geracaoMensalAtual *= (1 - this.depreciacaoAnualFv / 12);
      }

      fluxoCaixaAcumulado += economiaAnual - this.custoOmAnual;

      resultados.push({
        ano,
        economiaAnual,
        fluxoCaixaAcumulado,
        resultadosMensais
      });
    }

    return {
      resultados,
      payback: this.calcularPayback(resultados),
      vpl: this.calcularVPL(resultados),
      tir: this.calcularTIR(resultados)
    };
  }

  getPercentualFioB(anoInstalacao, anoAtual) {
    if (anoInstalacao <= 2022) return 0; // Regra de transição
    
    const anosPassados = anoAtual - 2023;
    const percentuais = [0.15, 0.30, 0.45, 0.60, 0.75, 0.90];
    
    if (anosPassados < 0) return 0;
    if (anosPassados >= 6) return 1.0;
    
    return percentuais[anosPassados] || 0;
  }

  calcularPayback(resultados) {
    for (let i = 0; i < resultados.length; i++) {
      if (resultados[i].fluxoCaixaAcumulado >= 0) {
        return i + 1; // Retorna o ano do payback
      }
    }
    return null; // Payback não alcançado no período
  }

  calcularVPL(resultados) {
    return resultados.reduce((vpl, resultado, index) => {
      return vpl + (resultado.economiaAnual / Math.pow(1 + this.taxaDesconto, index + 1));
    }, -this.custoSistema);
  }

  calcularTIR(resultados) {
    // Implementação simplificada da TIR usando método iterativo
    // Para uma implementação mais robusta, considere usar bibliotecas como 'financial'
    let taxa = 0.1; // Taxa inicial
    const maxIteracoes = 100;
    const precisao = 0.0001;

    for (let i = 0; i < maxIteracoes; i++) {
      let vpl = -this.custoSistema;
      let derivada = 0;

      resultados.forEach((resultado, index) => {
        const ano = index + 1;
        const fator = Math.pow(1 + taxa, ano);
        vpl += resultado.economiaAnual / fator;
        derivada -= (ano * resultado.economiaAnual) / Math.pow(1 + taxa, ano + 1);
      });

      if (Math.abs(vpl) < precisao) return taxa;
      
      taxa = taxa - vpl / derivada;
    }

    return taxa;
  }
}
```

### 3. API Endpoints

```javascript
// routes/calculadora.js
const express = require('express');
const router = express.Router();
const CalculadoraSolar = require('../services/CalculadoraSolar');
const Tarifa = require('../models/Tarifa');

// Endpoint para cálculo de viabilidade
router.post('/calcular-viabilidade', async (req, res) => {
  try {
    const {
      custoSistema,
      consumoMensalKwh,
      geracaoMensalKwh,
      concessionaria,
      tipoConexao, // monofasico, bifasico, trifasico
      anoInstalacao,
      parametrosAvancados
    } = req.body;

    // Validações
    if (!custoSistema || !consumoMensalKwh || !geracaoMensalKwh || !concessionaria) {
      return res.status(400).json({ 
        error: 'Parâmetros obrigatórios não fornecidos' 
      });
    }

    // Carregar tarifa da concessionária
    const tarifa = await carregarTarifa(concessionaria);
    
    // Definir custo de disponibilidade baseado no tipo de conexão
    const custosDisponibilidade = {
      'monofasico': 30,
      'bifasico': 50,
      'trifasico': 100
    };

    const parametros = {
      custoSistema,
      custoDisponibilidadeKwh: custosDisponibilidade[tipoConexao] || 100,
      anoInstalacao,
      ...parametrosAvancados
    };

    const calculadora = new CalculadoraSolar(parametros);
    const resultado = calculadora.calcularEconomiaFluxoCaixa(
      consumoMensalKwh,
      geracaoMensalKwh,
      tarifa
    );

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Erro no cálculo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Endpoint para obter tarifas disponíveis
router.get('/tarifas/:concessionaria', async (req, res) => {
  try {
    const { concessionaria } = req.params;
    const tarifa = await carregarTarifa(concessionaria);
    
    res.json({
      success: true,
      data: {
        concessionaria,
        tarifa: {
          tarifaBase: tarifa.tarifaBase,
          tusd: tarifa.tusd,
          te: tarifa.te,
          fioB: tarifa.fioB
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao carregar tarifas',
      details: error.message 
    });
  }
});

async function carregarTarifa(concessionaria) {
  // Aqui você carregaria as tarifas de uma base de dados
  // Por enquanto, valores de exemplo baseados na planilha
  const tarifas = {
    'light': new Tarifa('light', 2025, {
      tarifaBase: 0.863297,
      tusd: 0.4972349297,
      te: 0.366062,
      fioB: 0.19705238,
      percentualFioB: 0.22825560612396428,
      pis: 0.0107,
      cofins: 0.0494,
      icms: 0.18, // Simplificado
      cosip: 31.86 // Simplificado
    }),
    'enel-rj': new Tarifa('enel-rj', 2025, {
      tarifaBase: 0.970251,
      tusd: 0.6392627,
      te: 0.330988,
      fioB: 0.335748,
      percentualFioB: 0.3460424158284815,
      pis: 0.0107,
      cofins: 0.0494,
      icms: 0.18,
      cosip: 83.3
    }),
    'ceral': new Tarifa('ceral', 2025, {
      tarifaBase: 0.863297,
      tusd: 0.4972349297,
      te: 0.366062,
      fioB: 0.19705238,
      percentualFioB: 0.22825560612396428,
      pis: 0.0107,
      cofins: 0.0494,
      icms: 0.18,
      cosip: 31.86
    })
  };

  const tarifa = tarifas[concessionaria.toLowerCase()];
  if (!tarifa) {
    throw new Error(`Concessionária ${concessionaria} não encontrada`);
  }

  return tarifa;
}

module.exports = router;
```

### 4. Servidor Principal

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const calculadoraRoutes = require('./routes/calculadora');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/calculadora', calculadoraRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

## Frontend - React

### 1. Componente Principal de Cálculo

```jsx
// components/CalculadoraSolar.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CalculadoraSolar = () => {
  const [formData, setFormData] = useState({
    custoSistema: '',
    consumoMensalKwh: '',
    geracaoMensalKwh: '',
    concessionaria: '',
    tipoConexao: '',
    anoInstalacao: new Date().getFullYear()
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calcularViabilidade = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculadora/calcular-viabilidade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setResultado(data.data);
      } else {
        alert('Erro no cálculo: ' + data.error);
      }
    } catch (error) {
      alert('Erro na comunicação com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de Viabilidade - Energia Solar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Custo do Sistema (R$)
              </label>
              <Input
                type="number"
                value={formData.custoSistema}
                onChange={(e) => handleInputChange('custoSistema', parseFloat(e.target.value))}
                placeholder="Ex: 25000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Consumo Mensal (kWh)
              </label>
              <Input
                type="number"
                value={formData.consumoMensalKwh}
                onChange={(e) => handleInputChange('consumoMensalKwh', parseFloat(e.target.value))}
                placeholder="Ex: 800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Geração Mensal Estimada (kWh)
              </label>
              <Input
                type="number"
                value={formData.geracaoMensalKwh}
                onChange={(e) => handleInputChange('geracaoMensalKwh', parseFloat(e.target.value))}
                placeholder="Ex: 750"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Concessionária
              </label>
              <Select onValueChange={(value) => handleInputChange('concessionaria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a concessionária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light (RJ)</SelectItem>
                  <SelectItem value="enel-rj">Enel (RJ)</SelectItem>
                  <SelectItem value="ceral">Ceral Araruama</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Conexão
              </label>
              <Select onValueChange={(value) => handleInputChange('tipoConexao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conexão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monofasico">Monofásico (30 kWh)</SelectItem>
                  <SelectItem value="bifasico">Bifásico (50 kWh)</SelectItem>
                  <SelectItem value="trifasico">Trifásico (100 kWh)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Ano de Instalação
              </label>
              <Input
                type="number"
                value={formData.anoInstalacao}
                onChange={(e) => handleInputChange('anoInstalacao', parseInt(e.target.value))}
                min="2022"
                max="2030"
              />
            </div>
          </div>

          <Button 
            onClick={calcularViabilidade} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Calculando...' : 'Calcular Viabilidade'}
          </Button>
        </CardContent>
      </Card>

      {resultado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumo dos Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {resultado.payback || 'N/A'} anos
                  </div>
                  <div className="text-sm text-gray-600">Payback</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatarMoeda(resultado.vpl || 0)}
                  </div>
                  <div className="text-sm text-gray-600">VPL (25 anos)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {((resultado.tir || 0) * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">TIR</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa Acumulado</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <Line 
                    type="monotone" 
                    dataKey="economiaAnual" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Economia Anual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CalculadoraSolar;
```

### 2. Componente de Tabela de Resultados

```jsx
// components/TabelaResultados.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TabelaResultados = ({ resultados }) => {
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento Anual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Ano</th>
                <th className="border border-gray-300 p-2">Economia Anual</th>
                <th className="border border-gray-300 p-2">Fluxo de Caixa Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((resultado) => (
                <tr key={resultado.ano}>
                  <td className="border border-gray-300 p-2 text-center">
                    {resultado.ano}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatarMoeda(resultado.economiaAnual)}
                  </td>
                  <td className={`border border-gray-300 p-2 text-right ${
                    resultado.fluxoCaixaAcumulado >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarMoeda(resultado.fluxoCaixaAcumulado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TabelaResultados;
```

### 3. App Principal

```jsx
// App.jsx
import React from 'react';
import CalculadoraSolar from './components/CalculadoraSolar';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold text-center">
          Gerador de Propostas - Energia Solar
        </h1>
      </header>
      <main>
        <CalculadoraSolar />
      </main>
    </div>
  );
}

export default App;
```

## Instruções de Implementação

### 1. Configuração do Backend

```bash
# Criar diretório do projeto
mkdir energia-solar-backend
cd energia-solar-backend

# Inicializar projeto Node.js
npm init -y

# Instalar dependências
npm install express cors dotenv

# Criar estrutura de pastas
mkdir routes services models

# Criar arquivos conforme os códigos acima
```

### 2. Configuração do Frontend

```bash
# Usar o utilitário manus-create-react-app
manus-create-react-app energia-solar-frontend

# Navegar para o diretório
cd energia-solar-frontend

# Instalar dependências adicionais
npm install recharts

# Substituir os arquivos conforme os códigos acima
```

### 3. Integração e Testes

1. **Iniciar o backend**: `node server.js` (porta 3001)
2. **Iniciar o frontend**: `npm start` (porta 3000)
3. **Testar a integração** através do navegador

### 4. Melhorias Futuras

1. **Base de dados**: Implementar PostgreSQL ou MongoDB para armazenar tarifas
2. **Autenticação**: Adicionar sistema de login para salvar propostas
3. **Relatórios**: Gerar PDFs das propostas calculadas
4. **Cache**: Implementar cache Redis para otimizar performance
5. **Validações**: Adicionar validações mais robustas nos inputs
6. **Testes**: Implementar testes unitários e de integração

