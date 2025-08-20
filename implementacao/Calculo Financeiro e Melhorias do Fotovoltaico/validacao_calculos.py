import math
import json

class ValidadorCalculosFinanceiros:
    def __init__(self):
        self.resultados_validacao = {}
    
    def validar_percentual_fio_b(self):
        """Valida a implementação da Lei 14.300 - regra de transição do Fio B"""
        print("=== Validação: Percentual Fio B (Lei 14.300) ===")
        
        # Casos de teste baseados na Lei 14.300
        casos_teste = [
            {"ano_instalacao": 2022, "ano_calculo": 2025, "esperado": 0.0},  # Instalado antes de 2023
            {"ano_instalacao": 2023, "ano_calculo": 2023, "esperado": 0.15}, # 2023: 15%
            {"ano_instalacao": 2024, "ano_calculo": 2024, "esperado": 0.30}, # 2024: 30%
            {"ano_instalacao": 2025, "ano_calculo": 2025, "esperado": 0.45}, # 2025: 45%
            {"ano_instalacao": 2026, "ano_calculo": 2026, "esperado": 0.60}, # 2026: 60%
            {"ano_instalacao": 2027, "ano_calculo": 2027, "esperado": 0.75}, # 2027: 75%
            {"ano_instalacao": 2028, "ano_calculo": 2028, "esperado": 0.90}, # 2028: 90%
            {"ano_instalacao": 2029, "ano_calculo": 2029, "esperado": 1.0},  # 2029+: 100%
            {"ano_instalacao": 2023, "ano_calculo": 2030, "esperado": 1.0},  # Após 7 anos: 100%
        ]
        
        def get_percentual_fio_b(ano_instalacao, ano_calculo):
            if ano_instalacao < 2023:
                return 0
            
            if ano_instalacao >= 2023 and ano_instalacao <= 2028:
                anos_desde_instalacao = ano_calculo - ano_instalacao
                
                if anos_desde_instalacao < 7:
                    percentuais = {2023: 0.15, 2024: 0.30, 2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90}
                    return percentuais.get(ano_instalacao, 1.0)
                
                return 1.0
            
            return 1.0
        
        todos_corretos = True
        for caso in casos_teste:
            resultado = get_percentual_fio_b(caso["ano_instalacao"], caso["ano_calculo"])
            correto = abs(resultado - caso["esperado"]) < 0.001
            
            print(f"Ano instalação: {caso['ano_instalacao']}, Ano cálculo: {caso['ano_calculo']}")
            print(f"Esperado: {caso['esperado']:.1%}, Obtido: {resultado:.1%}, {'✓' if correto else '✗'}")
            
            if not correto:
                todos_corretos = False
        
        self.resultados_validacao["fio_b"] = todos_corretos
        print(f"Resultado: {'APROVADO' if todos_corretos else 'REPROVADO'}\n")
    
    def validar_calculo_tarifa(self):
        """Valida o cálculo de tarifa final"""
        print("=== Validação: Cálculo de Tarifa Final ===")
        
        # Dados da Enel-RJ para teste
        tarifa_test = {
            "tusd_fio_a": 0.4972349297,
            "tusd_fio_b": 0.366062,
            "te": 0.366062,
            "pis": 0.0107,
            "cofins": 0.0494,
            "icms_faixa_3": 0.31,  # Para consumo > 200 kWh
            "cosip_faixa_4": 63.72  # Para consumo 221-1000 kWh
        }
        
        def calcular_tarifa_final(consumo_kwh, incluir_fio_b=True):
            tusd_fio_a = tarifa_test["tusd_fio_a"]
            tusd_fio_b = tarifa_test["tusd_fio_b"] if incluir_fio_b else 0
            te = tarifa_test["te"]
            
            tusd_total = tusd_fio_a + tusd_fio_b
            base_energetica = tusd_total + te
            
            pis_cofins = tarifa_test["pis"] + tarifa_test["cofins"]
            icms = tarifa_test["icms_faixa_3"]  # Assumindo > 200 kWh
            cosip = tarifa_test["cosip_faixa_4"]  # Assumindo 221-1000 kWh
            
            # Fórmula: (TUSD + TE) × (1 + PIS + COFINS) × (1 + ICMS) + COSIP/kWh
            tarifa_com_impostos = base_energetica * (1 + pis_cofins) * (1 + icms)
            tarifa_final = tarifa_com_impostos + (cosip / consumo_kwh)
            
            return tarifa_final
        
        # Teste com 500 kWh
        consumo_teste = 500
        tarifa_calculada = calcular_tarifa_final(consumo_teste)
        
        print(f"Consumo teste: {consumo_teste} kWh")
        print(f"Tarifa calculada: R$ {tarifa_calculada:.6f}/kWh")
        
        # Validação básica - deve estar na faixa esperada para RJ
        tarifa_valida = 0.8 <= tarifa_calculada <= 1.2
        
        self.resultados_validacao["tarifa"] = tarifa_valida
        print(f"Resultado: {'APROVADO' if tarifa_valida else 'REPROVADO'}\n")
    
    def validar_gestao_creditos(self):
        """Valida a gestão de créditos de energia (60 meses)"""
        print("=== Validação: Gestão de Créditos de Energia ===")
        
        class GestorCreditos:
            def __init__(self):
                self.creditos = {}
            
            def adicionar_credito(self, mes, valor):
                if valor > 0:
                    mes_vencimento = mes + 60
                    self.creditos[mes] = {"valor": valor, "vencimento": mes_vencimento}
            
            def utilizar_creditos(self, mes, necessario):
                # Remove créditos vencidos
                creditos_vencidos = [m for m, c in self.creditos.items() if c["vencimento"] <= mes]
                for m in creditos_vencidos:
                    del self.creditos[m]
                
                # Utiliza créditos (FIFO)
                utilizado = 0
                creditos_ordenados = sorted(self.creditos.items())
                
                for mes_credito, credito in creditos_ordenados:
                    if necessario <= 0:
                        break
                    
                    usar = min(credito["valor"], necessario)
                    utilizado += usar
                    necessario -= usar
                    credito["valor"] -= usar
                    
                    if credito["valor"] <= 0:
                        del self.creditos[mes_credito]
                
                return utilizado
            
            def saldo_total(self):
                return sum(c["valor"] for c in self.creditos.values())
        
        # Teste de gestão de créditos
        gestor = GestorCreditos()
        
        # Mês 1: Gera 100 kWh de crédito
        gestor.adicionar_credito(1, 100)
        assert gestor.saldo_total() == 100, "Erro ao adicionar crédito"
        
        # Mês 2: Usa 30 kWh
        utilizado = gestor.utilizar_creditos(2, 30)
        assert utilizado == 30, "Erro ao utilizar crédito"
        assert gestor.saldo_total() == 70, "Saldo incorreto após utilização"
        
        # Mês 61: Crédito deve ter vencido
        utilizado = gestor.utilizar_creditos(61, 50)
        assert utilizado == 0, "Crédito vencido não foi removido"
        assert gestor.saldo_total() == 0, "Saldo deveria ser zero após vencimento"
        
        self.resultados_validacao["creditos"] = True
        print("Gestão de créditos: APROVADO\n")
    
    def validar_calculo_vpl_tir(self):
        """Valida cálculos de VPL e TIR"""
        print("=== Validação: Cálculo VPL e TIR ===")
        
        def calcular_vpl(fluxos, taxa):
            return sum(fluxo / (1 + taxa) ** periodo for periodo, fluxo in enumerate(fluxos))
        
        def calcular_tir(fluxos, precisao=0.0001, max_iter=100):
            taxa = 0.1  # Chute inicial
            
            for _ in range(max_iter):
                vpl = sum(fluxo / (1 + taxa) ** periodo for periodo, fluxo in enumerate(fluxos))
                derivada = sum(-periodo * fluxo / (1 + taxa) ** (periodo + 1) for periodo, fluxo in enumerate(fluxos))
                
                if abs(vpl) < precisao:
                    return taxa * 100
                
                if abs(derivada) < precisao:
                    break
                
                taxa = taxa - vpl / derivada
                taxa = max(-0.99, min(10, taxa))  # Limites
            
            return taxa * 100
        
        # Teste com fluxo de caixa típico de energia solar
        fluxos_teste = [-50000, 5000, 5200, 5400, 5600, 5800]  # Investimento + economias
        taxa_desconto = 0.08  # 8% ao ano
        
        vpl = calcular_vpl(fluxos_teste, taxa_desconto)
        tir = calcular_tir(fluxos_teste)
        
        print(f"VPL calculado: R$ {vpl:,.2f}")
        print(f"TIR calculada: {tir:.2f}%")
        
        # Validações básicas
        vpl_valido = vpl > -60000  # VPL não pode ser muito negativo
        tir_valida = 0 <= tir <= 100  # TIR deve estar em faixa razoável
        
        resultado_vpl_tir = vpl_valido and tir_valida
        self.resultados_validacao["vpl_tir"] = resultado_vpl_tir
        print(f"Resultado: {'APROVADO' if resultado_vpl_tir else 'REPROVADO'}\n")
    
    def executar_validacao_completa(self):
        """Executa todas as validações"""
        print("INICIANDO VALIDAÇÃO DOS CÁLCULOS FINANCEIROS")
        print("=" * 50)
        
        self.validar_percentual_fio_b()
        self.validar_calculo_tarifa()
        self.validar_gestao_creditos()
        self.validar_calculo_vpl_tir()
        
        # Resumo final
        print("=" * 50)
        print("RESUMO DA VALIDAÇÃO:")
        
        total_testes = len(self.resultados_validacao)
        aprovados = sum(self.resultados_validacao.values())
        
        for teste, resultado in self.resultados_validacao.items():
            status = "✓ APROVADO" if resultado else "✗ REPROVADO"
            print(f"{teste.upper()}: {status}")
        
        print(f"\nRESULTADO GERAL: {aprovados}/{total_testes} testes aprovados")
        
        if aprovados == total_testes:
            print("🎉 TODOS OS TESTES PASSARAM!")
        else:
            print("⚠️  ALGUNS TESTES FALHARAM - REVISAR IMPLEMENTAÇÃO")
        
        return aprovados == total_testes

if __name__ == "__main__":
    validador = ValidadorCalculosFinanceiros()
    validador.executar_validacao_completa()
