from flask import Blueprint, request, jsonify
from src.models.dimensionador import DimensionadorAquecimentoBanho
from src.models.equipamento import Equipamento, PropostaBanho, db
import uuid
from datetime import datetime

dimensionamento_bp = Blueprint('dimensionamento', __name__)

@dimensionamento_bp.route('/calcular', methods=['POST'])
def calcular_dimensionamento():
    """
    Endpoint para calcular o dimensionamento do sistema de aquecimento de banho
    
    Payload esperado:
    {
        "num_pessoas": 4,
        "num_banheiros": 2,
        "duracao_banho_min": 15,
        "tem_banheira": false,
        "tem_ducha_higienica": true,
        "tem_pia_cozinha": true,
        "tem_maquina_lavar_louca": false,
        "tem_maquina_lavar_roupa": true,
        "temperatura_desejada": 40,
        "localizacao": "sudeste",
        "tipo_coletor": "placa_plana",
        "tipo_pressao": "alta",
        "tipo_energia_atual": "eletrica"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Validar parâmetros
        dimensionador = DimensionadorAquecimentoBanho()
        erros = dimensionador.validar_parametros(data)
        
        if erros:
            return jsonify({
                'success': False,
                'error': 'Parâmetros inválidos',
                'detalhes': erros
            }), 400
        
        # Realizar dimensionamento
        resultado = dimensionador.dimensionar_sistema_completo(data)
        
        return jsonify({
            'success': True,
            'data': resultado
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@dimensionamento_bp.route('/equipamentos/<tipo>', methods=['GET'])
def listar_equipamentos_por_tipo(tipo):
    """
    Endpoint para listar equipamentos por tipo
    
    Tipos válidos: coletor_placa_plana, coletor_vacuo, boiler_baixa, boiler_alta, pressurizador
    """
    try:
        tipos_validos = ['coletor_placa_plana', 'coletor_vacuo', 'boiler_baixa', 'boiler_alta', 'pressurizador']
        
        if tipo not in tipos_validos:
            return jsonify({
                'success': False,
                'error': f'Tipo inválido. Tipos válidos: {", ".join(tipos_validos)}'
            }), 400
        
        equipamentos = Equipamento.get_equipamentos_por_tipo(tipo)
        
        return jsonify({
            'success': True,
            'data': [eq.to_dict() for eq in equipamentos]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@dimensionamento_bp.route('/equipamentos/sugestoes', methods=['POST'])
def sugerir_equipamentos():
    """
    Endpoint para sugerir equipamentos baseado no dimensionamento
    
    Payload esperado:
    {
        "volume_boiler_sugerido": 400,
        "area_coletora_sugerida": 3.0,
        "tipo_boiler_sugerido": "boiler_alta",
        "tipo_coletor_sugerido": "coletor_placa_plana",
        "precisa_pressurizador": true
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        sugestoes = {}
        
        # Sugerir boiler
        volume_boiler = data.get('volume_boiler_sugerido')
        tipo_boiler = data.get('tipo_boiler_sugerido')
        if volume_boiler and tipo_boiler:
            boiler = Equipamento.query.filter(
                Equipamento.tipo == tipo_boiler,
                Equipamento.capacidade >= volume_boiler,
                Equipamento.ativo == True
            ).order_by(Equipamento.capacidade.asc()).first()
            
            if boiler:
                sugestoes['boiler'] = boiler.to_dict()
        
        # Sugerir coletor
        area_coletor = data.get('area_coletora_sugerida')
        tipo_coletor = data.get('tipo_coletor_sugerido')
        if area_coletor and tipo_coletor:
            coletor = Equipamento.query.filter(
                Equipamento.tipo == tipo_coletor,
                Equipamento.capacidade >= area_coletor,
                Equipamento.ativo == True
            ).order_by(Equipamento.capacidade.asc()).first()
            
            if coletor:
                sugestoes['coletor'] = coletor.to_dict()
        
        # Sugerir pressurizador (se necessário)
        if data.get('precisa_pressurizador'):
            pressurizador = Equipamento.query.filter(
                Equipamento.tipo == 'pressurizador',
                Equipamento.ativo == True
            ).first()
            
            if pressurizador:
                sugestoes['pressurizador'] = pressurizador.to_dict()
        
        return jsonify({
            'success': True,
            'data': sugestoes
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@dimensionamento_bp.route('/proposta', methods=['POST'])
def criar_proposta():
    """
    Endpoint para criar uma nova proposta
    
    Payload esperado:
    {
        "nome_cliente": "João Silva",
        "email_cliente": "joao@email.com",
        "telefone_cliente": "(11) 99999-9999",
        "dimensionamento": { ... dados do dimensionamento ... },
        "equipamentos_selecionados": {
            "boiler_id": 1,
            "coletor_id": 2,
            "pressurizador_id": 3
        },
        "observacoes": "Observações adicionais",
        "template_usado": "template_moderno",
        "formato_proposta": "A4"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Validar dados obrigatórios
        if not data.get('nome_cliente'):
            return jsonify({
                'success': False,
                'error': 'Nome do cliente é obrigatório'
            }), 400
        
        if not data.get('dimensionamento'):
            return jsonify({
                'success': False,
                'error': 'Dados do dimensionamento são obrigatórios'
            }), 400
        
        # Extrair dados do dimensionamento
        dim_data = data['dimensionamento']
        equipamentos = data.get('equipamentos_selecionados', {})
        
        # Criar nova proposta
        proposta = PropostaBanho(
            uuid=str(uuid.uuid4()),
            nome_cliente=data['nome_cliente'],
            email_cliente=data.get('email_cliente'),
            telefone_cliente=data.get('telefone_cliente'),
            
            # Dados do dimensionamento
            num_pessoas=dim_data.get('num_pessoas'),
            num_banheiros=dim_data.get('num_banheiros', 1),
            duracao_banho_min=dim_data.get('duracao_banho_min', 10),
            tem_banheira=dim_data.get('tem_banheira', False),
            tem_ducha_higienica=dim_data.get('tem_ducha_higienica', False),
            tem_pia_cozinha=dim_data.get('tem_pia_cozinha', False),
            tem_maquina_lavar_louca=dim_data.get('tem_maquina_lavar_louca', False),
            tem_maquina_lavar_roupa=dim_data.get('tem_maquina_lavar_roupa', False),
            temperatura_desejada=dim_data.get('temperatura_desejada', 40.0),
            localizacao=dim_data.get('localizacao'),
            tipo_coletor=dim_data.get('tipo_coletor', 'placa_plana'),
            tipo_pressao=dim_data.get('tipo_pressao', 'baixa'),
            
            # Resultados do dimensionamento
            consumo_diario_estimado=dim_data.get('consumo_diario_estimado'),
            volume_boiler_sugerido=dim_data.get('volume_boiler_sugerido'),
            area_coletora_sugerida=dim_data.get('area_coletora_sugerida'),
            
            # Equipamentos selecionados
            boiler_id=equipamentos.get('boiler_id'),
            coletor_id=equipamentos.get('coletor_id'),
            pressurizador_id=equipamentos.get('pressurizador_id'),
            
            # Dados da proposta
            observacoes=data.get('observacoes'),
            template_usado=data.get('template_usado', 'default'),
            formato_proposta=data.get('formato_proposta', 'A4')
        )
        
        # Calcular valor total (se equipamentos foram selecionados)
        valor_total = 0
        if proposta.boiler_id:
            boiler = Equipamento.query.get(proposta.boiler_id)
            if boiler:
                valor_total += boiler.preco_venda or 0
        
        if proposta.coletor_id:
            coletor = Equipamento.query.get(proposta.coletor_id)
            if coletor:
                valor_total += coletor.preco_venda or 0
        
        if proposta.pressurizador_id:
            pressurizador = Equipamento.query.get(proposta.pressurizador_id)
            if pressurizador:
                valor_total += pressurizador.preco_venda or 0
        
        proposta.valor_total = valor_total
        
        # Salvar no banco
        db.session.add(proposta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': proposta.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@dimensionamento_bp.route('/proposta/<proposta_uuid>', methods=['GET'])
def obter_proposta(proposta_uuid):
    """
    Endpoint para obter uma proposta pelo UUID
    """
    try:
        proposta = PropostaBanho.query.filter_by(uuid=proposta_uuid, ativo=True).first()
        
        if not proposta:
            return jsonify({
                'success': False,
                'error': 'Proposta não encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': proposta.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@dimensionamento_bp.route('/propostas', methods=['GET'])
def listar_propostas():
    """
    Endpoint para listar todas as propostas ativas
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        propostas = PropostaBanho.query.filter_by(ativo=True)\
                                      .order_by(PropostaBanho.created_at.desc())\
                                      .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'data': {
                'propostas': [p.to_dict() for p in propostas.items],
                'total': propostas.total,
                'pages': propostas.pages,
                'current_page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@dimensionamento_bp.route('/simulacao-rapida', methods=['POST'])
def simulacao_rapida():
    """
    Endpoint para simulação rápida com parâmetros básicos
    
    Payload esperado:
    {
        "num_pessoas": 4,
        "localizacao": "sudeste",
        "duracao_banho_min": 10
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Parâmetros padrão para simulação rápida
        parametros_padrao = {
            'num_pessoas': data.get('num_pessoas', 4),
            'num_banheiros': 1,
            'duracao_banho_min': data.get('duracao_banho_min', 10),
            'tem_banheira': False,
            'tem_ducha_higienica': False,
            'tem_pia_cozinha': True,
            'tem_maquina_lavar_louca': False,
            'tem_maquina_lavar_roupa': False,
            'temperatura_desejada': 40.0,
            'localizacao': data.get('localizacao', 'sudeste'),
            'tipo_coletor': 'placa_plana',
            'tipo_pressao': 'baixa',
            'tipo_energia_atual': 'eletrica'
        }
        
        # Realizar dimensionamento
        dimensionador = DimensionadorAquecimentoBanho()
        resultado = dimensionador.dimensionar_sistema_completo(parametros_padrao)
        
        # Retornar apenas resumo para simulação rápida
        return jsonify({
            'success': True,
            'data': {
                'consumo_diario_estimado': resultado['consumo_diario_estimado'],
                'volume_boiler_sugerido': resultado['volume_boiler_sugerido'],
                'area_coletora_sugerida': resultado['area_coletora_sugerida'],
                'economia_mensal': resultado['economia']['economia_mensal'],
                'economia_anual': resultado['economia']['economia_anual'],
                'precisa_pressurizador': resultado['precisa_pressurizador']
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

