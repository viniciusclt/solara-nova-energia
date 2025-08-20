from flask import Blueprint, request, jsonify
from src.models.equipamento import Equipamento, db
import json

equipamentos_bp = Blueprint('equipamentos', __name__)

@equipamentos_bp.route('/', methods=['GET'])
def listar_equipamentos():
    """
    Endpoint para listar todos os equipamentos
    
    Query parameters:
    - tipo: Filtrar por tipo de equipamento
    - ativo: Filtrar por status ativo (true/false)
    - page: Página (padrão: 1)
    - per_page: Itens por página (padrão: 20)
    """
    try:
        # Parâmetros de filtro
        tipo = request.args.get('tipo')
        ativo = request.args.get('ativo')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Construir query
        query = Equipamento.query
        
        if tipo:
            query = query.filter(Equipamento.tipo == tipo)
        
        if ativo is not None:
            ativo_bool = ativo.lower() == 'true'
            query = query.filter(Equipamento.ativo == ativo_bool)
        
        # Paginação
        equipamentos = query.order_by(Equipamento.nome.asc())\
                           .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'data': {
                'equipamentos': [eq.to_dict() for eq in equipamentos.items],
                'total': equipamentos.total,
                'pages': equipamentos.pages,
                'current_page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@equipamentos_bp.route('/<int:equipamento_id>', methods=['GET'])
def obter_equipamento(equipamento_id):
    """
    Endpoint para obter um equipamento específico
    """
    try:
        equipamento = Equipamento.query.get(equipamento_id)
        
        if not equipamento:
            return jsonify({
                'success': False,
                'error': 'Equipamento não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': equipamento.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@equipamentos_bp.route('/', methods=['POST'])
def criar_equipamento():
    """
    Endpoint para criar um novo equipamento
    
    Payload esperado:
    {
        "nome": "Boiler 400L Alta Pressão",
        "fabricante": "Soletrol",
        "tipo": "boiler_alta",
        "capacidade": 400,
        "especificacoes": {
            "material": "Aço inox",
            "isolamento": "Poliuretano",
            "pressao_maxima": "40 mca"
        },
        "preco_custo": 1200.00,
        "preco_venda": 1800.00,
        "imagem_url": "https://exemplo.com/imagem.jpg",
        "ficha_tecnica_url": "https://exemplo.com/ficha.pdf"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Validar campos obrigatórios
        required_fields = ['nome', 'fabricante', 'tipo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório não fornecido: {field}'
                }), 400
        
        # Validar tipo de equipamento
        tipos_validos = ['coletor_placa_plana', 'coletor_vacuo', 'boiler_baixa', 'boiler_alta', 'pressurizador']
        if data['tipo'] not in tipos_validos:
            return jsonify({
                'success': False,
                'error': f'Tipo inválido. Tipos válidos: {", ".join(tipos_validos)}'
            }), 400
        
        # Criar novo equipamento
        equipamento = Equipamento(
            nome=data['nome'],
            fabricante=data['fabricante'],
            tipo=data['tipo'],
            capacidade=data.get('capacidade'),
            especificacoes=json.dumps(data.get('especificacoes', {})),
            preco_custo=data.get('preco_custo'),
            preco_venda=data.get('preco_venda'),
            imagem_url=data.get('imagem_url'),
            ficha_tecnica_url=data.get('ficha_tecnica_url')
        )
        
        db.session.add(equipamento)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': equipamento.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@equipamentos_bp.route('/<int:equipamento_id>', methods=['PUT'])
def atualizar_equipamento(equipamento_id):
    """
    Endpoint para atualizar um equipamento existente
    """
    try:
        equipamento = Equipamento.query.get(equipamento_id)
        
        if not equipamento:
            return jsonify({
                'success': False,
                'error': 'Equipamento não encontrado'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Atualizar campos fornecidos
        if 'nome' in data:
            equipamento.nome = data['nome']
        if 'fabricante' in data:
            equipamento.fabricante = data['fabricante']
        if 'tipo' in data:
            tipos_validos = ['coletor_placa_plana', 'coletor_vacuo', 'boiler_baixa', 'boiler_alta', 'pressurizador']
            if data['tipo'] not in tipos_validos:
                return jsonify({
                    'success': False,
                    'error': f'Tipo inválido. Tipos válidos: {", ".join(tipos_validos)}'
                }), 400
            equipamento.tipo = data['tipo']
        if 'capacidade' in data:
            equipamento.capacidade = data['capacidade']
        if 'especificacoes' in data:
            equipamento.especificacoes = json.dumps(data['especificacoes'])
        if 'preco_custo' in data:
            equipamento.preco_custo = data['preco_custo']
        if 'preco_venda' in data:
            equipamento.preco_venda = data['preco_venda']
        if 'imagem_url' in data:
            equipamento.imagem_url = data['imagem_url']
        if 'ficha_tecnica_url' in data:
            equipamento.ficha_tecnica_url = data['ficha_tecnica_url']
        if 'ativo' in data:
            equipamento.ativo = data['ativo']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': equipamento.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@equipamentos_bp.route('/<int:equipamento_id>', methods=['DELETE'])
def deletar_equipamento(equipamento_id):
    """
    Endpoint para deletar (desativar) um equipamento
    """
    try:
        equipamento = Equipamento.query.get(equipamento_id)
        
        if not equipamento:
            return jsonify({
                'success': False,
                'error': 'Equipamento não encontrado'
            }), 404
        
        # Desativar ao invés de deletar fisicamente
        equipamento.ativo = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Equipamento desativado com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@equipamentos_bp.route('/tipos', methods=['GET'])
def listar_tipos_equipamentos():
    """
    Endpoint para listar os tipos de equipamentos disponíveis
    """
    try:
        tipos = [
            {
                'codigo': 'coletor_placa_plana',
                'nome': 'Coletor Placa Plana',
                'descricao': 'Coletor solar tradicional com placa absorvedora plana'
            },
            {
                'codigo': 'coletor_vacuo',
                'nome': 'Coletor Tubo a Vácuo',
                'descricao': 'Coletor solar com tubos a vácuo, maior eficiência'
            },
            {
                'codigo': 'boiler_baixa',
                'nome': 'Boiler Baixa Pressão',
                'descricao': 'Reservatório térmico para sistemas de baixa pressão'
            },
            {
                'codigo': 'boiler_alta',
                'nome': 'Boiler Alta Pressão',
                'descricao': 'Reservatório térmico para sistemas de alta pressão'
            },
            {
                'codigo': 'pressurizador',
                'nome': 'Pressurizador',
                'descricao': 'Bomba para pressurização do sistema'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': tipos
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@equipamentos_bp.route('/popular-dados-exemplo', methods=['POST'])
def popular_dados_exemplo():
    """
    Endpoint para popular o banco com dados de exemplo
    ATENÇÃO: Use apenas em desenvolvimento/testes
    """
    try:
        # Verificar se já existem equipamentos
        if Equipamento.query.count() > 0:
            return jsonify({
                'success': False,
                'error': 'Banco já possui equipamentos. Use este endpoint apenas em bancos vazios.'
            }), 400
        
        # Dados de exemplo
        equipamentos_exemplo = [
            # Boilers Baixa Pressão
            {
                'nome': 'Boiler 200L Baixa Pressão',
                'fabricante': 'Soletrol',
                'tipo': 'boiler_baixa',
                'capacidade': 200,
                'especificacoes': {'material': 'Aço inox', 'isolamento': 'Poliuretano'},
                'preco_custo': 800.00,
                'preco_venda': 1200.00
            },
            {
                'nome': 'Boiler 300L Baixa Pressão',
                'fabricante': 'Soletrol',
                'tipo': 'boiler_baixa',
                'capacidade': 300,
                'especificacoes': {'material': 'Aço inox', 'isolamento': 'Poliuretano'},
                'preco_custo': 1000.00,
                'preco_venda': 1500.00
            },
            {
                'nome': 'Boiler 400L Baixa Pressão',
                'fabricante': 'Soletrol',
                'tipo': 'boiler_baixa',
                'capacidade': 400,
                'especificacoes': {'material': 'Aço inox', 'isolamento': 'Poliuretano'},
                'preco_custo': 1200.00,
                'preco_venda': 1800.00
            },
            
            # Boilers Alta Pressão
            {
                'nome': 'Boiler 200L Alta Pressão',
                'fabricante': 'Soletrol',
                'tipo': 'boiler_alta',
                'capacidade': 200,
                'especificacoes': {'material': 'Aço inox', 'isolamento': 'Poliuretano', 'pressao_maxima': '40 mca'},
                'preco_custo': 1000.00,
                'preco_venda': 1500.00
            },
            {
                'nome': 'Boiler 300L Alta Pressão',
                'fabricante': 'Soletrol',
                'tipo': 'boiler_alta',
                'capacidade': 300,
                'especificacoes': {'material': 'Aço inox', 'isolamento': 'Poliuretano', 'pressao_maxima': '40 mca'},
                'preco_custo': 1300.00,
                'preco_venda': 1950.00
            },
            {
                'nome': 'Boiler 400L Alta Pressão',
                'fabricante': 'Soletrol',
                'tipo': 'boiler_alta',
                'capacidade': 400,
                'especificacoes': {'material': 'Aço inox', 'isolamento': 'Poliuretano', 'pressao_maxima': '40 mca'},
                'preco_custo': 1500.00,
                'preco_venda': 2250.00
            },
            
            # Coletores Placa Plana
            {
                'nome': 'Coletor Placa Plana 1,5m²',
                'fabricante': 'Soletrol',
                'tipo': 'coletor_placa_plana',
                'capacidade': 1.5,
                'especificacoes': {'material_absorvedor': 'Cobre', 'cobertura': 'Vidro temperado'},
                'preco_custo': 400.00,
                'preco_venda': 600.00
            },
            {
                'nome': 'Coletor Placa Plana 2,0m²',
                'fabricante': 'Soletrol',
                'tipo': 'coletor_placa_plana',
                'capacidade': 2.0,
                'especificacoes': {'material_absorvedor': 'Cobre', 'cobertura': 'Vidro temperado'},
                'preco_custo': 500.00,
                'preco_venda': 750.00
            },
            {
                'nome': 'Coletor Placa Plana 3,0m²',
                'fabricante': 'Soletrol',
                'tipo': 'coletor_placa_plana',
                'capacidade': 3.0,
                'especificacoes': {'material_absorvedor': 'Cobre', 'cobertura': 'Vidro temperado'},
                'preco_custo': 700.00,
                'preco_venda': 1050.00
            },
            
            # Coletores Tubo a Vácuo
            {
                'nome': 'Coletor Tubo Vácuo 1,5m²',
                'fabricante': 'Heliotek',
                'tipo': 'coletor_vacuo',
                'capacidade': 1.5,
                'especificacoes': {'num_tubos': 15, 'material_absorvedor': 'Cobre com seletiva'},
                'preco_custo': 800.00,
                'preco_venda': 1200.00
            },
            {
                'nome': 'Coletor Tubo Vácuo 2,0m²',
                'fabricante': 'Heliotek',
                'tipo': 'coletor_vacuo',
                'capacidade': 2.0,
                'especificacoes': {'num_tubos': 20, 'material_absorvedor': 'Cobre com seletiva'},
                'preco_custo': 1000.00,
                'preco_venda': 1500.00
            },
            
            # Pressurizadores
            {
                'nome': 'Pressurizador 1/2 CV',
                'fabricante': 'Dancor',
                'tipo': 'pressurizador',
                'capacidade': 0.5,
                'especificacoes': {'potencia': '1/2 CV', 'vazao_maxima': '2000 L/h', 'tipo': 'Com fluxostato'},
                'preco_custo': 300.00,
                'preco_venda': 450.00
            },
            {
                'nome': 'Pressurizador 3/4 CV',
                'fabricante': 'Dancor',
                'tipo': 'pressurizador',
                'capacidade': 0.75,
                'especificacoes': {'potencia': '3/4 CV', 'vazao_maxima': '3000 L/h', 'tipo': 'Com pressostato'},
                'preco_custo': 400.00,
                'preco_venda': 600.00
            }
        ]
        
        # Criar equipamentos
        for eq_data in equipamentos_exemplo:
            equipamento = Equipamento(
                nome=eq_data['nome'],
                fabricante=eq_data['fabricante'],
                tipo=eq_data['tipo'],
                capacidade=eq_data['capacidade'],
                especificacoes=json.dumps(eq_data['especificacoes']),
                preco_custo=eq_data['preco_custo'],
                preco_venda=eq_data['preco_venda']
            )
            db.session.add(equipamento)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(equipamentos_exemplo)} equipamentos de exemplo criados com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

