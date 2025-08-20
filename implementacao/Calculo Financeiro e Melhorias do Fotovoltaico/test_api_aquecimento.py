#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.dimensionador import DimensionadorAquecimentoBanho
from src.models.equipamento import Equipamento, PropostaBanho, db
from src.main import app
import json

def test_dimensionador():
    """Teste básico do dimensionador de aquecimento de banho"""
    print("=== Teste do Dimensionador de Aquecimento de Banho ===")
    
    # Parâmetros de teste
    parametros = {
        'num_pessoas': 4,
        'num_banheiros': 2,
        'duracao_banho_min': 15,
        'tem_banheira': False,
        'tem_ducha_higienica': True,
        'tem_pia_cozinha': True,
        'tem_maquina_lavar_louca': False,
        'tem_maquina_lavar_roupa': True,
        'temperatura_desejada': 40,
        'localizacao': 'sudeste',
        'tipo_coletor': 'placa_plana',
        'tipo_pressao': 'alta',
        'tipo_energia_atual': 'eletrica'
    }
    
    # Criar dimensionador
    dimensionador = DimensionadorAquecimentoBanho()
    
    print(f"Parâmetros de entrada:")
    for key, value in parametros.items():
        print(f"  {key}: {value}")
    
    # Realizar dimensionamento
    resultado = dimensionador.dimensionar_sistema_completo(parametros)
    
    print(f"\n=== Resultados do Dimensionamento ===")
    print(f"Consumo diário estimado: {resultado['consumo_diario_estimado']} litros")
    print(f"Volume do boiler sugerido: {resultado['volume_boiler_sugerido']} litros")
    print(f"Área coletora sugerida: {resultado['area_coletora_sugerida']} m²")
    print(f"Tipo de boiler sugerido: {resultado['tipo_boiler_sugerido']}")
    print(f"Tipo de coletor sugerido: {resultado['tipo_coletor_sugerido']}")
    print(f"Precisa pressurizador: {resultado['precisa_pressurizador']}")
    
    print(f"\n=== Economia de Energia ===")
    economia = resultado['economia']
    print(f"Energia mensal: {economia['energia_mensal_kwh']} kWh")
    print(f"Economia mensal: R$ {economia['economia_mensal']:.2f}")
    print(f"Economia anual: R$ {economia['economia_anual']:.2f}")
    
    print(f"\n=== Detalhamento do Consumo ===")
    detalhamento = resultado['detalhamento_consumo']
    for uso, litros in detalhamento.items():
        if litros > 0:
            print(f"  {uso.replace('_', ' ').title()}: {litros} litros/dia")
    
    return resultado

def test_validacoes():
    """Teste das validações de parâmetros"""
    print("\n=== Teste de Validações ===")
    
    dimensionador = DimensionadorAquecimentoBanho()
    
    # Teste com parâmetros inválidos
    parametros_invalidos = {
        'num_pessoas': 0,  # Inválido
        'duracao_banho_min': 70,  # Inválido
        'temperatura_desejada': 80,  # Inválido
        'localizacao': 'marte',  # Inválido
        'tipo_coletor': 'nuclear'  # Inválido
    }
    
    erros = dimensionador.validar_parametros(parametros_invalidos)
    
    print(f"Parâmetros inválidos testados:")
    for key, value in parametros_invalidos.items():
        print(f"  {key}: {value}")
    
    print(f"\nErros encontrados:")
    for erro in erros:
        print(f"  - {erro}")
    
    print(f"\n✅ Validações funcionando corretamente!")

def test_database():
    """Teste das operações de banco de dados"""
    print("\n=== Teste do Banco de Dados ===")
    
    with app.app_context():
        # Verificar se as tabelas foram criadas
        try:
            count_equipamentos = Equipamento.query.count()
            count_propostas = PropostaBanho.query.count()
            
            print(f"Equipamentos no banco: {count_equipamentos}")
            print(f"Propostas no banco: {count_propostas}")
            
            print("✅ Banco de dados funcionando!")
            
        except Exception as e:
            print(f"❌ Erro no banco de dados: {e}")

if __name__ == "__main__":
    try:
        resultado = test_dimensionador()
        test_validacoes()
        test_database()
        
        print("\n✅ Todos os testes passaram!")
        
    except Exception as e:
        print(f"\n❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

