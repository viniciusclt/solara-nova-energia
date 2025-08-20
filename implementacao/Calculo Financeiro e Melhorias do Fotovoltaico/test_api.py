#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.calculadora_solar import CalculadoraSolar
from src.models.tarifa import Tarifa

def test_calculadora():
    """Teste básico da calculadora solar"""
    print("=== Teste da Calculadora Solar ===")
    
    # Parâmetros de teste
    parametros = {
        'custo_sistema': 25000,
        'custo_disponibilidade_kwh': 100,
        'ano_instalacao': 2024,
        'fator_simultaneidade': 0.3,
        'inflacao_anual': 0.1,
        'taxa_desconto': 0.02,
        'depreciacao_anual_fv': 0.007,
        'custo_om_anual': 0
    }
    
    # Criar calculadora
    calculadora = CalculadoraSolar(parametros)
    
    # Carregar tarifa da Light
    tarifas = Tarifa.get_tarifas_2025()
    tarifa_light = tarifas['light']
    
    print(f"Tarifa Light - Base: R$ {tarifa_light.tarifa_base:.6f}")
    print(f"Tarifa Light - TUSD: R$ {tarifa_light.tusd:.6f}")
    print(f"Tarifa Light - TE: R$ {tarifa_light.te:.6f}")
    print(f"Tarifa Light - Fio B: R$ {tarifa_light.fio_b:.6f}")
    
    # Calcular viabilidade
    resultado = calculadora.calcular_economia_fluxo_caixa(
        consumo_mensal_inicial=800,
        geracao_mensal_inicial=680,  # 85% do consumo
        tarifa=tarifa_light,
        anos_projecao=10
    )
    
    print(f"\n=== Resultados ===")
    print(f"Payback: {resultado['payback']} anos")
    print(f"VPL (10 anos): R$ {resultado['vpl']:,.2f}")
    print(f"TIR: {resultado['tir']*100:.2f}%")
    print(f"Economia média anual: R$ {resultado['resumo']['economia_media_anual']:,.2f}")
    
    # Mostrar primeiros 3 anos
    print(f"\n=== Detalhamento (3 primeiros anos) ===")
    for i in range(min(3, len(resultado['resultados']))):
        ano_data = resultado['resultados'][i]
        print(f"Ano {ano_data['ano']}: Economia R$ {ano_data['economia_anual']:,.2f}, Fluxo Acumulado R$ {ano_data['fluxo_caixa_acumulado']:,.2f}")
    
    return resultado

def test_tarifa():
    """Teste das tarifas"""
    print("\n=== Teste das Tarifas ===")
    
    tarifas = Tarifa.get_tarifas_2025()
    
    for nome, tarifa in tarifas.items():
        print(f"\n{nome.upper()}:")
        print(f"  Tarifa Base: R$ {tarifa.tarifa_base:.6f}")
        print(f"  Tarifa Final (300 kWh): R$ {tarifa.calcular_tarifa_final(300):.6f}")
        print(f"  ICMS (300 kWh): {tarifa.get_icms_por_faixa(300)*100:.0f}%")
        print(f"  COSIP (300 kWh): R$ {tarifa.get_cosip_por_faixa(300):.2f}")

if __name__ == "__main__":
    try:
        test_tarifa()
        resultado = test_calculadora()
        print("\n✅ Todos os testes passaram!")
        
    except Exception as e:
        print(f"\n❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

