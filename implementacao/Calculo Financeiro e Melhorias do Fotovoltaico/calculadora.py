from flask import Blueprint, request, jsonify
from src.models.calculadora_solar import CalculadoraSolar
from src.models.tarifa import Tarifa

calculadora_bp = Blueprint('calculadora', __name__)

@calculadora_bp.route('/calcular-viabilidade', methods=['POST'])
def calcular_viabilidade():
    """
    Endpoint para calcular a viabilidade econômica de um sistema solar
    
    Payload esperado:
    {
        "custo_sistema": 25000,
        "consumo_mensal_kwh": 800,
        "geracao_mensal_kwh": 750,
        "concessionaria": "light",
        "tipo_conexao": "trifasico",
        "ano_instalacao": 2024,
        "parametros_avancados": {
            "fator_simultaneidade": 0.3,
            "inflacao_anual": 0.1,
            "taxa_desconto": 0.02,
            "depreciacao_anual_fv": 0.007,
            "custo_om_anual": 0
        }
    }
    """
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['custo_sistema', 'consumo_mensal_kwh', 'geracao_mensal_kwh', 'concessionaria']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório não fornecido: {field}'
                }), 400

        # Extrair dados do payload
        custo_sistema = float(data['custo_sistema'])
        consumo_mensal_kwh = float(data['consumo_mensal_kwh'])
        geracao_mensal_kwh = float(data['geracao_mensal_kwh'])
        concessionaria = data['concessionaria'].lower()
        tipo_conexao = data.get('tipo_conexao', 'trifasico')
        ano_instalacao = data.get('ano_instalacao', 2024)
        parametros_avancados = data.get('parametros_avancados', {})

        # Validar concessionária
        tarifas_disponiveis = Tarifa.get_tarifas_2025()
        if concessionaria not in tarifas_disponiveis:
            return jsonify({
                'success': False,
                'error': f'Concessionária não suportada: {concessionaria}. Disponíveis: {list(tarifas_disponiveis.keys())}'
            }), 400

        # Carregar tarifa da concessionária
        tarifa = tarifas_disponiveis[concessionaria]

        # Configurar parâmetros da calculadora
        custo_disponibilidade = CalculadoraSolar.get_custo_disponibilidade(tipo_conexao)
        
        parametros = {
            'custo_sistema': custo_sistema,
            'custo_disponibilidade_kwh': custo_disponibilidade,
            'ano_instalacao': ano_instalacao,
            **parametros_avancados
        }

        # Criar calculadora e executar cálculo
        calculadora = CalculadoraSolar(parametros)
        resultado = calculadora.calcular_economia_fluxo_caixa(
            consumo_mensal_kwh,
            geracao_mensal_kwh,
            tarifa
        )

        return jsonify({
            'success': True,
            'data': resultado,
            'parametros_utilizados': {
                'concessionaria': concessionaria,
                'tipo_conexao': tipo_conexao,
                'custo_disponibilidade_kwh': custo_disponibilidade,
                'tarifa_base': tarifa.tarifa_base,
                'fio_b': tarifa.fio_b
            }
        })

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Erro de validação: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@calculadora_bp.route('/tarifas/<concessionaria>', methods=['GET'])
def obter_tarifas(concessionaria):
    """
    Endpoint para obter informações de tarifas de uma concessionária
    """
    try:
        concessionaria = concessionaria.lower()
        tarifas_disponiveis = Tarifa.get_tarifas_2025()
        
        if concessionaria not in tarifas_disponiveis:
            return jsonify({
                'success': False,
                'error': f'Concessionária não encontrada: {concessionaria}'
            }), 404

        tarifa = tarifas_disponiveis[concessionaria]
        
        return jsonify({
            'success': True,
            'data': {
                'concessionaria': concessionaria,
                'ano': tarifa.ano,
                'tarifa_base': tarifa.tarifa_base,
                'tusd': tarifa.tusd,
                'te': tarifa.te,
                'fio_b': tarifa.fio_b,
                'pis': tarifa.pis,
                'cofins': tarifa.cofins,
                'exemplo_tarifa_final_300kwh': tarifa.calcular_tarifa_final(300)
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@calculadora_bp.route('/concessionarias', methods=['GET'])
def listar_concessionarias():
    """
    Endpoint para listar todas as concessionárias disponíveis
    """
    try:
        tarifas_disponiveis = Tarifa.get_tarifas_2025()
        
        concessionarias = []
        for nome, tarifa in tarifas_disponiveis.items():
            concessionarias.append({
                'codigo': nome,
                'nome_completo': {
                    'light': 'Light Serviços de Eletricidade S.A.',
                    'enel-rj': 'Enel Distribuição Rio',
                    'ceral': 'Ceral Araruama - Cooperativa de Eletrificação Rural'
                }.get(nome, nome.upper()),
                'tarifa_base': tarifa.tarifa_base,
                'ano': tarifa.ano
            })
        
        return jsonify({
            'success': True,
            'data': concessionarias
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@calculadora_bp.route('/simulacao-rapida', methods=['POST'])
def simulacao_rapida():
    """
    Endpoint para simulação rápida com parâmetros simplificados
    
    Payload esperado:
    {
        "custo_sistema": 25000,
        "consumo_mensal_kwh": 800,
        "concessionaria": "light"
    }
    """
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['custo_sistema', 'consumo_mensal_kwh', 'concessionaria']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório não fornecido: {field}'
                }), 400

        custo_sistema = float(data['custo_sistema'])
        consumo_mensal_kwh = float(data['consumo_mensal_kwh'])
        concessionaria = data['concessionaria'].lower()

        # Estimar geração baseada no consumo (regra prática: 85% do consumo)
        geracao_mensal_kwh = consumo_mensal_kwh * 0.85

        # Parâmetros padrão para simulação rápida
        parametros = {
            'custo_sistema': custo_sistema,
            'custo_disponibilidade_kwh': 100,  # Assume trifásico
            'ano_instalacao': 2024,
            'fator_simultaneidade': 0.3,
            'inflacao_anual': 0.1,
            'taxa_desconto': 0.02,
            'depreciacao_anual_fv': 0.007,
            'custo_om_anual': 0
        }

        # Carregar tarifa
        tarifas_disponiveis = Tarifa.get_tarifas_2025()
        if concessionaria not in tarifas_disponiveis:
            return jsonify({
                'success': False,
                'error': f'Concessionária não suportada: {concessionaria}'
            }), 400

        tarifa = tarifas_disponiveis[concessionaria]

        # Executar cálculo
        calculadora = CalculadoraSolar(parametros)
        resultado = calculadora.calcular_economia_fluxo_caixa(
            consumo_mensal_kwh,
            geracao_mensal_kwh,
            tarifa,
            anos_projecao=10  # Simulação rápida com 10 anos
        )

        # Retornar apenas resumo para simulação rápida
        return jsonify({
            'success': True,
            'data': {
                'payback': resultado['payback'],
                'vpl_10_anos': resultado['vpl'],
                'economia_anual_media': resultado['resumo']['economia_media_anual'],
                'economia_mensal_media': resultado['resumo']['economia_media_anual'] / 12,
                'geracao_estimada_kwh': geracao_mensal_kwh,
                'concessionaria': concessionaria
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

