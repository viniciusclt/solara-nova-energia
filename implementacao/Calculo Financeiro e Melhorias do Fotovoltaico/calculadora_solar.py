import math
from typing import Dict, List, Any

class CalculadoraSolar:
    """Classe principal para cálculos de viabilidade de sistemas de energia solar"""
    
    def __init__(self, parametros: Dict[str, Any]):
        self.custo_sistema = parametros.get('custo_sistema', 0)
        self.custo_disponibilidade_kwh = parametros.get('custo_disponibilidade_kwh', 100)
        self.fator_simultaneidade = parametros.get('fator_simultaneidade', 0.3)
        self.inflacao_anual = parametros.get('inflacao_anual', 0.1)
        self.taxa_desconto = parametros.get('taxa_desconto', 0.02)
        self.depreciacao_anual_fv = parametros.get('depreciacao_anual_fv', 0.007)
        self.custo_om_anual = parametros.get('custo_om_anual', 0)
        self.ano_instalacao = parametros.get('ano_instalacao', 2024)

    def calcular_economia_fluxo_caixa(self, consumo_mensal_inicial: float, 
                                    geracao_mensal_inicial: float, 
                                    tarifa, 
                                    anos_projecao: int = 25) -> Dict[str, Any]:
        """
        Calcula a economia e fluxo de caixa do sistema solar
        
        Args:
            consumo_mensal_inicial: Consumo mensal em kWh
            geracao_mensal_inicial: Geração mensal estimada em kWh
            tarifa: Objeto Tarifa da concessionária
            anos_projecao: Número de anos para projeção
            
        Returns:
            Dicionário com resultados detalhados
        """
        fluxo_caixa_acumulado = -self.custo_sistema
        resultados = []
        creditos_acumulados = 0

        consumo_mensal_atual = consumo_mensal_inicial
        geracao_mensal_atual = geracao_mensal_inicial

        for ano in range(1, anos_projecao + 1):
            economia_anual = 0
            resultados_mensais = []

            for mes in range(1, 13):
                # 1. Calcular autoconsumo e injeção
                autoconsumo_kwh = min(
                    consumo_mensal_atual * self.fator_simultaneidade,
                    geracao_mensal_atual
                )
                consumido_da_rede_kwh = max(0, consumo_mensal_atual - autoconsumo_kwh)
                injetado_na_rede_kwh = max(0, geracao_mensal_atual - autoconsumo_kwh)

                # 2. Gerenciar créditos de energia
                creditos_acumulados += injetado_na_rede_kwh
                creditos_utilizados = min(creditos_acumulados, consumido_da_rede_kwh)
                creditos_acumulados -= creditos_utilizados
                energia_comprada_da_rede = max(0, consumido_da_rede_kwh - creditos_utilizados)

                # 3. Aplicar regra de transição Lei 14.300 (Fio B)
                percentual_fio_b = self.get_percentual_fio_b(
                    self.ano_instalacao, 
                    self.ano_instalacao + ano - 1
                )
                custo_fio_b_compensado = injetado_na_rede_kwh * tarifa.fio_b * percentual_fio_b

                # 4. Calcular custos
                custo_sem_fv = consumo_mensal_atual * tarifa.calcular_tarifa_final(consumo_mensal_atual)
                
                # Custo com FV: energia comprada + Fio B + custo de disponibilidade
                custo_energia_comprada = energia_comprada_da_rede * tarifa.calcular_tarifa_final(energia_comprada_da_rede) if energia_comprada_da_rede > 0 else 0
                custo_disponibilidade = self.custo_disponibilidade_kwh * tarifa.tarifa_base
                custo_com_fv = custo_energia_comprada + custo_fio_b_compensado + custo_disponibilidade

                # 5. Calcular economia mensal
                economia_mensal = custo_sem_fv - custo_com_fv
                economia_anual += economia_mensal

                resultados_mensais.append({
                    'mes': mes,
                    'consumo_kwh': round(consumo_mensal_atual, 2),
                    'geracao_kwh': round(geracao_mensal_atual, 2),
                    'autoconsumo_kwh': round(autoconsumo_kwh, 2),
                    'injetado_na_rede_kwh': round(injetado_na_rede_kwh, 2),
                    'creditos_acumulados': round(creditos_acumulados, 2),
                    'custo_sem_fv': round(custo_sem_fv, 2),
                    'custo_com_fv': round(custo_com_fv, 2),
                    'economia_mensal': round(economia_mensal, 2),
                    'percentual_fio_b': percentual_fio_b
                })

                # Atualizar para próximo mês (inflação e depreciação)
                consumo_mensal_atual *= (1 + self.inflacao_anual / 12)
                geracao_mensal_atual *= (1 - self.depreciacao_anual_fv / 12)

            # Atualizar fluxo de caixa anual
            fluxo_caixa_acumulado += economia_anual - self.custo_om_anual

            resultados.append({
                'ano': ano,
                'economia_anual': round(economia_anual, 2),
                'fluxo_caixa_acumulado': round(fluxo_caixa_acumulado, 2),
                'resultados_mensais': resultados_mensais
            })

        # Calcular indicadores financeiros
        payback = self.calcular_payback(resultados)
        vpl = self.calcular_vpl(resultados)
        tir = self.calcular_tir(resultados)

        return {
            'resultados': resultados,
            'payback': payback,
            'vpl': round(vpl, 2),
            'tir': round(tir, 4),
            'resumo': {
                'investimento_inicial': self.custo_sistema,
                'economia_total_25_anos': sum(r['economia_anual'] for r in resultados),
                'economia_media_anual': sum(r['economia_anual'] for r in resultados) / len(resultados)
            }
        }

    def get_percentual_fio_b(self, ano_instalacao: int, ano_atual: int) -> float:
        """
        Calcula o percentual do Fio B conforme a regra de transição da Lei 14.300
        
        Args:
            ano_instalacao: Ano de instalação do sistema
            ano_atual: Ano atual da projeção
            
        Returns:
            Percentual do Fio B a ser aplicado (0.0 a 1.0)
        """
        if ano_instalacao <= 2022:
            return 0.0  # Regra de transição - sistemas antigos não pagam
        
        anos_passados = ano_atual - 2023
        percentuais = [0.15, 0.30, 0.45, 0.60, 0.75, 0.90]
        
        if anos_passados < 0:
            return 0.0
        elif anos_passados >= 6:
            return 1.0
        else:
            return percentuais[anos_passados]

    def calcular_payback(self, resultados: List[Dict]) -> int:
        """Calcula o período de payback em anos"""
        for i, resultado in enumerate(resultados):
            if resultado['fluxo_caixa_acumulado'] >= 0:
                return i + 1
        return None  # Payback não alcançado no período

    def calcular_vpl(self, resultados: List[Dict]) -> float:
        """Calcula o Valor Presente Líquido (VPL)"""
        vpl = -self.custo_sistema
        for i, resultado in enumerate(resultados):
            vpl += resultado['economia_anual'] / math.pow(1 + self.taxa_desconto, i + 1)
        return vpl

    def calcular_tir(self, resultados: List[Dict]) -> float:
        """
        Calcula a Taxa Interna de Retorno (TIR) usando método iterativo
        Implementação simplificada - para uso em produção, considere bibliotecas especializadas
        """
        taxa = 0.1  # Taxa inicial
        max_iteracoes = 100
        precisao = 0.0001

        for _ in range(max_iteracoes):
            vpl = -self.custo_sistema
            derivada = 0

            for i, resultado in enumerate(resultados):
                ano = i + 1
                fator = math.pow(1 + taxa, ano)
                vpl += resultado['economia_anual'] / fator
                derivada -= (ano * resultado['economia_anual']) / math.pow(1 + taxa, ano + 1)

            if abs(vpl) < precisao:
                return taxa

            if derivada == 0:
                break

            taxa = taxa - vpl / derivada

            # Evitar valores negativos ou muito altos
            if taxa < 0:
                taxa = 0.01
            elif taxa > 1:
                taxa = 0.99

        return taxa

    @staticmethod
    def get_custo_disponibilidade(tipo_conexao: str) -> int:
        """
        Retorna o custo de disponibilidade em kWh baseado no tipo de conexão
        
        Args:
            tipo_conexao: 'monofasico', 'bifasico' ou 'trifasico'
            
        Returns:
            Custo de disponibilidade em kWh
        """
        custos = {
            'monofasico': 30,
            'bifasico': 50,
            'trifasico': 100
        }
        return custos.get(tipo_conexao.lower(), 100)

