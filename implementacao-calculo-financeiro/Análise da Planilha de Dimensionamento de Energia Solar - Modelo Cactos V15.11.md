# Análise da Planilha de Dimensionamento de Energia Solar - Modelo Cactos V15.11

## Estrutura da Planilha

A planilha contém uma lógica complexa de cálculo financeiro para análise de retorno de investimento em sistemas de energia solar fotovoltaica. Principais componentes identificados:

### 1. Parâmetros de Entrada
- **Custo do sistema**: R$ 23.440,00
- **Custo de Disponibilidade (kWh)**: 100 kWh
- **Fator de Simultaneidade**: 0,3 (30%)
- **Inflação anual considerada**: 10%
- **Taxa de Desconto**: 2%
- **Depreciação do sistema FV/ano**: 0,7%
- **Custo de O&M/ano**: R$ 0,00

### 2. Cálculo de Geração Mensal
A planilha utiliza fatores de degradação (FDG) mensais considerando:
- Orientação
- Linha do Horizonte
- Temperatura
- Dias no mês

**Exemplo de cálculo mensal:**
- Janeiro: FDG = 0.7711, Geração = 1092.48 kWh
- Fevereiro: FDG = 0.7416, Geração = 1060.37 kWh
- Março: FDG = 0.6940, Geração = 923.26 kWh

### 3. Estrutura Tarifária
A planilha considera as seguintes concessionárias do RJ:
- **Enel**: Tarifa base B1 = R$ 0,970251
- **Light**: Tarifa base B1 = R$ 0,863297
- **Ceral**: Tarifa base B1 = R$ 0,863297

**Componentes tarifários:**
- TUSD (Tarifa de Uso do Sistema de Distribuição)
- TE (Tarifa de Energia)
- FioB (Fio B)
- PIS/COFINS
- ICMS (estadual RJ)
- COSIP

### 4. Lógica de Cálculo Financeiro

#### Autoconsumo e Injeção
- **AutoConsumo**: Menor valor entre consumo e geração
- **Consumido da rede**: Consumo - AutoConsumo
- **Injetado na rede**: Geração - AutoConsumo

#### Sistema de Créditos
- Créditos gerados pela energia injetada
- Controle de saldo de créditos acumulados
- Aplicação da regra de transição da Lei 14.300

#### Cálculo de Economia
- **Tarifa sem FV**: Valor da conta sem sistema fotovoltaico
- **Tarifa com FV**: Valor da conta com sistema fotovoltaico
- **Economia**: Diferença entre as duas tarifas

### 5. Regra de Transição (Lei 14.300)
A planilha implementa a regra de transição com percentuais progressivos:
- 2023: 15%
- 2024: 30%
- 2025: 45%
- 2026: 60%
- 2027: 75%
- 2028: 90%
- 2029: 100%

### 6. Análise de Fluxo de Caixa
- Investimento inicial: R$ -23.440,00
- Economia mensal calculada
- Fluxo de caixa acumulado
- Período de payback

## Principais Fórmulas Identificadas

### Cálculo de Geração
```
Geração = Potência_Sistema × FDG_mensal × Dias_mês × HSP
```

### Cálculo de Tarifa Final
```
Tarifa_Final = (Tarifa_base + TUSD + TE) × (1 + PIS + COFINS) × (1 + ICMS) + COSIP
```

### Cálculo de Economia
```
Economia = Tarifa_sem_FV - Tarifa_com_FV
```

### Fluxo de Caixa
```
Fluxo_Caixa_Acumulado = Investimento_Inicial + Σ(Economia_Mensal)
```

## Observações Importantes

1. A planilha considera ajustes para autoconsumo limitado ao menor entre consumo e geração
2. Implementa limitação de injeção ao Custo de Disponibilidade (CDD)
3. Aplica a regra de transição da Lei 14.300 progressivamente
4. Considera depreciação anual do sistema
5. Inclui inflação nas projeções futuras

## Próximos Passos

1. Verificar conformidade com normas atuais
2. Atualizar tarifas das concessionárias
3. Implementar em JavaScript/TypeScript
4. Criar interface para React
5. Desenvolver API em Node.js



## Análise da Lei 14.300 (Marco Legal da Microgeração e Minigeração Distribuída)

A Lei nº 14.300/2022, sancionada em 6 de janeiro de 2022, institui o marco legal da microgeração e minigeração distribuída no Brasil, estabelecendo regras claras para o Sistema de Compensação de Energia Elétrica (SCEE). As principais mudanças e impactos para os cálculos de retorno de investimento em energia solar são:

### 1. Taxação sobre a Geração Distribuída (Fio B)

Antes da Lei 14.300, os consumidores que injetavam energia na rede recebiam créditos equivalentes ao valor total da tarifa (TUSD + TE). Com a nova lei, a partir de 7 de julho de 2023, a energia injetada na rede passa a ter uma taxação gradual sobre a componente da Tarifa de Uso do Sistema de Distribuição (TUSD Fio B). A planilha já considera essa taxação progressiva, o que é um ponto positivo.

### 2. Regra de Transição

A lei estabelece uma regra de transição para os consumidores que protocolaram suas solicitações de acesso até 6 de janeiro de 2023. Esses consumidores mantêm as regras anteriores (sem a taxação do Fio B) até 31 de dezembro de 2045. Para os novos projetos, a taxação do Fio B é implementada gradualmente, conforme os percentuais já identificados na planilha:

- **2023**: 15% do Fio B
- **2024**: 30% do Fio B
- **2025**: 45% do Fio B
- **2026**: 60% do Fio B
- **2027**: 75% do Fio B
- **2028**: 90% do Fio B
- **A partir de 2029**: 100% do Fio B

A planilha já incorpora essa regra de transição, o que é fundamental para a precisão dos cálculos de economia e payback.

### 3. Custo de Disponibilidade

O custo de disponibilidade (tarifa mínima) continua sendo cobrado, independentemente da geração do sistema fotovoltaico. A planilha considera um custo de disponibilidade de 100 kWh, o que é um valor comum para sistemas monofásicos (30 kWh), bifásicos (50 kWh) e trifásicos (100 kWh). É importante que a plataforma permita a configuração desse valor de acordo com o tipo de conexão do cliente.

### 4. Prazos e Validade dos Créditos

Os créditos de energia gerados continuam tendo validade de 60 meses (5 anos). A planilha parece gerenciar corretamente o acúmulo e consumo desses créditos.

## Tarifas Atualizadas das Concessionárias do Rio de Janeiro (2025)

As tarifas de energia elétrica são reajustadas anualmente pela ANEEL. É crucial que a plataforma utilize as tarifas mais recentes para garantir a precisão dos cálculos. Com base na pesquisa, as seguintes informações são relevantes para 2025:

### Light (RJ)
- ANEEL aprovou redução de 1,67% na tarifa da Light em 2025, com queda de 2,52% para baixa tensão a partir de julho de 2025.
- A Resolução Homologatória nº 3.435, de 11 de março de 2025, da ANEEL, homologa o reajuste tarifário anual de 2025, incluindo as Tarifas de Energia (TE) e as Tarifas de Uso do Sistema de Distribuição (TUSD).

### Enel-RJ
- Reajuste tarifário da Enel RJ aprovado em 11 de março de 2025, com aumento médio de 0,27% para o consumidor.
- A Resolução Homologatória nº 3.435, de 11 de março de 2025, da ANEEL, também abrange as tarifas da Enel-RJ.

### Ceral (Ceral Araruama)
- A Resolução Homologatória nº 3.446, de 29 de abril de 2025, da ANEEL, homologa o reajuste tarifário anual de 2025 para a Ceral, com uma redução de 7,89% na média para baixa tensão.

**Recomendação:** Para a implementação na plataforma, será necessário obter as tabelas detalhadas de TUSD, TE, PIS, COFINS, ICMS e COSIP para cada concessionária, considerando as diferentes faixas de consumo e tipos de conexão (monofásico, bifásico, trifásico). A planilha atual já possui uma estrutura para essas tarifas, mas é fundamental que os valores sejam atualizados e mantidos de forma dinâmica na plataforma, talvez através de uma base de dados ou API que consuma dados da ANEEL ou das próprias concessionárias.

## Melhorias e Considerações para a Lógica de Cálculo

A lógica de cálculo da planilha é robusta e já incorpora aspectos importantes da Lei 14.300. Para aprimorar a implementação na plataforma, sugiro as seguintes considerações:

1.  **Modularização do Cálculo**: Dividir o cálculo em funções menores e mais gerenciáveis (ex: `calcularGeracaoMensal`, `calcularTarifaSemFV`, `calcularTarifaComFV`, `calcularEconomia`, `calcularFluxoDeCaixa`). Isso facilitará a manutenção e a testabilidade do código.
2.  **Parâmetros Configuráveis**: Todos os parâmetros de entrada (custo do sistema, custo de disponibilidade, inflação, taxa de desconto, depreciação, custo de O&M, e principalmente as tarifas das concessionárias) devem ser facilmente configuráveis na plataforma, permitindo que o usuário ajuste esses valores conforme a necessidade.
3.  **Base de Dados de Tarifas**: Em vez de codificar as tarifas diretamente, criar uma base de dados (ou consumir uma API) para armazenar as tarifas de TUSD, TE, PIS, COFINS, ICMS e COSIP por concessionária e por tipo de consumidor/faixa de consumo. Isso garantirá que os cálculos estejam sempre atualizados.
4.  **Tratamento de Exceções/Casos Específicos**: Considerar casos especiais, como consumidores que se enquadram em programas sociais (Tarifa Social de Energia Elétrica), ou diferentes modalidades tarifárias (horo-sazonal, branca, etc.), se aplicável ao escopo da plataforma.
5.  **Validação de Entradas**: Implementar validações robustas para os dados de entrada fornecidos pelo usuário, garantindo que os cálculos sejam feitos com informações válidas.
6.  **Projeção de Inflação e Reajustes**: A planilha já considera a inflação anual. É importante que a plataforma permita a projeção de reajustes tarifários futuros, que podem ser baseados na inflação ou em índices específicos do setor elétrico.
7.  **Visualização dos Resultados**: Além dos números, a plataforma deve apresentar os resultados de forma clara e visualmente atraente (gráficos de economia, payback, fluxo de caixa), como a planilha já sugere com o 



## Comparação e Melhoria da Lógica de Cálculo

A lógica de cálculo presente na planilha `Modelo-Cactos-DimensionamentoV15.11.xlsx` é um bom ponto de partida, pois já incorpora conceitos importantes da geração distribuída e a regra de transição da Lei 14.300. No entanto, para garantir a precisão e a conformidade com as regulamentações mais recentes, especialmente as tarifas de 2025, algumas melhorias e validações são necessárias.

### Lógica de Cálculo Original da Planilha

A planilha calcula a economia e o fluxo de caixa mensalmente, projetando-os ao longo de vários anos. Os principais componentes da lógica são:

1.  **Geração Mensal**: Baseada em fatores de degradação (FDG) e dias do mês, resultando em `Geração N1` (kWh gerados).
2.  **Consumo Previsto**: Consumo mensal em kWh, que pode ser ajustado por um incremento anual.
3.  **Autoconsumo**: A parcela da energia gerada que é consumida instantaneamente, calculada como o mínimo entre a geração e o consumo, ajustado por um `Fator de Simultaneidade`.
4.  **Energia Consumida da Rede**: A energia que o consumidor ainda precisa comprar da distribuidora após o autoconsumo.
5.  **Energia Injetada na Rede**: A energia gerada que excede o autoconsumo e é enviada para a rede da distribuidora.
6.  **Créditos de Energia**: Acumulados a partir da energia injetada e utilizados para abater o consumo futuro. A planilha gerencia o saldo de créditos.
7.  **Tarifas**: Utiliza valores de TUSD, TE, PIS, COFINS, ICMS e COSIP para calcular o custo da energia sem e com o sistema fotovoltaico.
8.  **Lei 14.300 (Fio B)**: Aplica a taxação progressiva sobre o Fio B para a energia injetada, conforme a regra de transição.
9.  **Custo de Disponibilidade**: Mantém uma cobrança mínima em kWh, independentemente da geração.
10. **Economia Mensal**: Calculada como a diferença entre o custo da energia sem o sistema e com o sistema.
11. **Fluxo de Caixa**: Acumula a economia mensal, subtraindo o custo inicial do sistema.

### Melhorias Propostas e Validação com a Lei 14.300 e Tarifas 2025

Para aprimorar a lógica e garantir sua aplicabilidade na plataforma, as seguintes considerações são cruciais:

#### 1. Atualização das Tarifas

As tarifas da planilha são de um período anterior. É imperativo que a plataforma utilize as tarifas mais recentes divulgadas pela ANEEL para Light, Enel-RJ e Ceral. As pesquisas indicaram que as tarifas de 2025 já foram homologadas, com reajustes específicos para cada concessionária. A estrutura de cálculo de tarifa final (`Tarifa_Final = (Tarifa_base + TUSD + TE) × (1 + PIS + COFINS) × (1 + ICMS) + COSIP`) é conceitualmente correta, mas os valores de TUSD, TE, PIS, COFINS, ICMS e COSIP devem ser os de 2025.

**Ação**: A plataforma deve ter um mecanismo para carregar e atualizar essas tarifas dinamicamente. Idealmente, isso seria feito através de uma base de dados ou, se disponível, uma API que forneça dados tarifários da ANEEL ou das próprias concessionárias.

#### 2. Cálculo do Fio B e Regra de Transição

A planilha já implementa a regra de transição do Fio B, o que é excelente. A lógica de aplicar um percentual crescente sobre o Fio B da TUSD para a energia injetada está correta. A plataforma deve replicar essa lógica fielmente, garantindo que o ano de referência para o cálculo do percentual do Fio B seja configurável.

**Fórmula para o custo do Fio B compensado (Lei 14.300)**:

`Custo_FioB_Compensado = Energia_Injetada × TUSD_FioB × Percentual_FioB_Lei14300`

Onde `Percentual_FioB_Lei14300` varia conforme o ano de entrada do sistema e a regra de transição (15% em 2023, 30% em 2024, 45% em 2025, etc.).

#### 3. Custo de Disponibilidade (Tarifa Mínima)

O custo de disponibilidade é um valor fixo em kWh que o consumidor paga à distribuidora, mesmo que gere toda a sua energia. A planilha usa 100 kWh. A plataforma deve permitir que o usuário selecione o tipo de conexão (monofásico, bifásico, trifásico) para aplicar o custo de disponibilidade correto (30 kWh, 50 kWh ou 100 kWh, respectivamente).

#### 4. Inflação e Depreciação

A planilha considera inflação anual no consumo e depreciação anual na geração do sistema FV. Essa é uma prática recomendada para projeções de longo prazo e deve ser mantida na plataforma. A inflação afeta o custo da energia comprada da rede, e a depreciação reduz a capacidade de geração do sistema ao longo do tempo.

#### 5. Fator de Simultaneidade

O fator de simultaneidade (0.3 na planilha) é crucial para determinar o autoconsumo. Ele representa a porcentagem da energia gerada que é consumida instantaneamente, sem passar pela rede. A plataforma deve permitir a configuração desse fator, pois ele pode variar dependendo do perfil de consumo do cliente.

#### 6. Cenários e Sensibilidade

Para uma ferramenta de propostas, seria interessante adicionar a capacidade de simular diferentes cenários (ex: aumento do consumo, variação da inflação, mudanças nas tarifas) para que o cliente possa visualizar a robustez do investimento em diferentes condições.

### Exemplo de Lógica de Cálculo Otimizada (Pseudocódigo/Python)

Para ilustrar a lógica de cálculo aprimorada, apresento um pseudocódigo que pode ser adaptado para Python e, posteriormente, para JavaScript/TypeScript.

```python
class SistemaSolar:
    def __init__(self, custo_sistema, custo_disponibilidade_kWh, fator_simultaneidade, inflacao_anual, taxa_desconto, depreciacao_anual_fv, custo_om_anual):
        self.custo_sistema = custo_sistema
        self.custo_disponibilidade_kWh = custo_disponibilidade_kWh
        self.fator_simultaneidade = fator_simultaneidade
        self.inflacao_anual = inflacao_anual
        self.taxa_desconto = taxa_desconto
        self.depreciacao_anual_fv = depreciacao_anual_fv
        self.custo_om_anual = custo_om_anual

    def calcular_economia_e_fluxo_caixa(self, consumo_mensal_inicial, geracao_mensal_inicial, tarifas_concessionaria, anos_projecao, ano_instalacao):
        fluxo_caixa_acumulado = -self.custo_sistema
        resultados_anuais = []

        consumo_mensal_atual = consumo_mensal_inicial
        geracao_mensal_atual = geracao_mensal_inicial

        for ano in range(1, anos_projecao + 1):
            economia_anual = 0
            custo_sem_fv_anual = 0
            custo_com_fv_anual = 0

            for mes in range(1, 13):
                # 1. Calcular Autoconsumo e Injeção
                autoconsumo_kWh = min(consumo_mensal_atual * self.fator_simultaneidade, geracao_mensal_atual)
                consumido_da_rede_kWh = consumo_mensal_atual - autoconsumo_kWh
                injetado_na_rede_kWh = geracao_mensal_atual - autoconsumo_kWh

                # 2. Aplicar Regra de Transição Lei 14.300 (Fio B)
                percentual_fio_b = self._get_percentual_fio_b(ano_instalacao, ano)
                custo_fio_b_compensado = injetado_na_rede_kWh * tarifas_concessionaria['TUSD_FioB'] * percentual_fio_b

                # 3. Calcular Custo de Disponibilidade
                custo_disponibilidade = self.custo_disponibilidade_kWh * tarifas_concessionaria['Tarifa_base'] # Simplificado, pode ser mais complexo

                # 4. Calcular Custo da Energia sem FV
                custo_sem_fv = consumo_mensal_atual * tarifas_concessionaria['Tarifa_Final_Sem_FV'] # Necessita de uma tarifa final completa

                # 5. Calcular Custo da Energia com FV
                # Esta é a parte mais complexa e precisa ser detalhada com base na planilha
                # Envolve: energia consumida da rede, custo do Fio B compensado, custo de disponibilidade, etc.
                custo_com_fv = (consumido_da_rede_kWh * tarifas_concessionaria['Tarifa_Final_Com_FV']) + custo_fio_b_compensado + custo_disponibilidade

                # 6. Calcular Economia Mensal
                economia_mensal = custo_sem_fv - custo_com_fv
                economia_anual += economia_mensal
                custo_sem_fv_anual += custo_sem_fv
                custo_com_fv_anual += custo_com_fv

                # Atualizar consumo e geração para o próximo mês (inflação e depreciação)
                consumo_mensal_atual *= (1 + (self.inflacao_anual / 12)) # Inflação mensal
                geracao_mensal_atual *= (1 - (self.depreciacao_anual_fv / 12)) # Depreciação mensal

            # Atualizar fluxo de caixa acumulado
            fluxo_caixa_acumulado += economia_anual - self.custo_om_anual # Custo de O&M anual

            resultados_anuais.append({
                'Ano': ano,
                'Economia Anual': economia_anual,
                'Fluxo de Caixa Acumulado': fluxo_caixa_acumulado
            })

        return resultados_anuais

    def _get_percentual_fio_b(self, ano_instalacao, ano_atual):
        # Lógica da regra de transição da Lei 14.300
        # Implementar conforme a tabela de percentuais da Lei
        # Exemplo simplificado:
        if ano_instalacao <= 2022: # Projetos antigos
            return 0 # Não paga Fio B
        else:
            anos_passados = ano_atual - ano_instalacao
            if anos_passados == 0: return 0.15 # 2023
            if anos_passados == 1: return 0.30 # 2024
            if anos_passados == 2: return 0.45 # 2025
            if anos_passados == 3: return 0.60 # 2026
            if anos_passados == 4: return 0.75 # 2027
            if anos_passados == 5: return 0.90 # 2028
            if anos_passados >= 6: return 1.00 # A partir de 2029
        return 0

# Exemplo de uso (valores fictícios para demonstração)
tarifas_light = {
    'Tarifa_base': 0.863297,
    'TUSD': 0.4972349297,
    'TE': 0.366062,
    'TUSD_FioB': 0.19705238, # Exemplo, precisa ser o valor correto do Fio B
    'PIS': 0.0107,
    'COFINS': 0.0494,
    'ICMS': 0.31, # Exemplo, varia por faixa de consumo
    'COSIP': 31.86, # Exemplo, varia por faixa de consumo
    'Tarifa_Final_Sem_FV': 0.863297 * (1 + 0.0107 + 0.0494) * (1 + 0.31) + 31.86, # Simplificado
    'Tarifa_Final_Com_FV': 0.4972349297 + 0.366062 # Simplificado, apenas TUSD+TE para energia consumida da rede
}

sistema = SistemaSolar(
    custo_sistema=23440,
    custo_disponibilidade_kWh=100,
    fator_simultaneidade=0.3,
    inflacao_anual=0.1,
    taxa_desconto=0.02,
    depreciacao_anual_fv=0.007,
    custo_om_anual=0
)

resultados = sistema.calcular_economia_e_fluxo_caixa(
    consumo_mensal_inicial=800, # Exemplo
    geracao_mensal_inicial=750, # Exemplo
    tarifas_concessionaria=tarifas_light,
    anos_projecao=25,
    ano_instalacao=2024 # Ano de instalação do sistema
)

for res in resultados:
    print(f"Ano: {res['Ano']}, Economia Anual: {res['Economia Anual']:.2f}, Fluxo de Caixa Acumulado: {res['Fluxo de Caixa Acumulado']:.2f}")

```

**Observações sobre o pseudocódigo:**

-   **`tarifas_concessionaria`**: Este dicionário precisa ser populado com os valores reais e atualizados das tarifas (TUSD, TE, PIS, COFINS, ICMS, COSIP, e o valor específico do Fio B da TUSD) para cada concessionária e para cada tipo de consumidor. A forma como a planilha calcula a `Tarifa Final` é complexa e envolve diferentes componentes que variam com o consumo e a concessionária. A plataforma precisará de uma base de dados robusta para gerenciar isso.
-   **`_get_percentual_fio_b`**: A lógica para obter o percentual do Fio B da Lei 14.300 deve ser precisa e baseada no ano de instalação do sistema e no ano de projeção.
-   **Cálculo de `Tarifa_Final_Sem_FV` e `Tarifa_Final_Com_FV`**: No pseudocódigo, esses valores foram simplificados. Na implementação real, eles precisarão refletir a complexidade da estrutura tarifária (bandeiras tarifárias, faixas de consumo, impostos, etc.). A planilha original já faz isso de forma detalhada, e essa lógica deve ser transposta cuidadosamente.
-   **Créditos de Energia**: A gestão dos créditos de energia (acumulação, consumo e validade de 60 meses) é um ponto crítico que precisa ser implementado com precisão. O pseudocódigo atual não detalha essa parte, mas é fundamental para o cálculo do fluxo de caixa.

### Conclusão da Comparação

A planilha fornece uma base sólida para a lógica de cálculo. As principais melhorias na transição para a plataforma serão a **atualização e gerenciamento dinâmico das tarifas**, a **modularização do código** para facilitar a manutenção e a **implementação precisa da gestão de créditos de energia** e do **custo de disponibilidade** para diferentes tipos de conexão. A Lei 14.300 já está bem representada na lógica de transição do Fio B da planilha, o que simplifica essa parte da implementação.

