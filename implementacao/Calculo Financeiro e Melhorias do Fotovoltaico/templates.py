from flask import Blueprint, request, jsonify, render_template_string
from src.models.equipamento import Template, db
import json
from datetime import datetime

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('/', methods=['GET'])
def listar_templates():
    """
    Endpoint para listar todos os templates ativos
    
    Query parameters:
    - formato: Filtrar por formato (A4 ou 16:9)
    """
    try:
        formato = request.args.get('formato')
        
        query = Template.query.filter_by(ativo=True)
        
        if formato:
            query = query.filter(Template.formato == formato)
        
        templates = query.order_by(Template.nome.asc()).all()
        
        return jsonify({
            'success': True,
            'data': [template.to_dict() for template in templates]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@templates_bp.route('/<int:template_id>', methods=['GET'])
def obter_template(template_id):
    """
    Endpoint para obter um template específico
    """
    try:
        template = Template.query.get(template_id)
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': template.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@templates_bp.route('/', methods=['POST'])
def criar_template():
    """
    Endpoint para criar um novo template
    
    Payload esperado:
    {
        "nome": "Template Moderno A4",
        "descricao": "Template moderno para propostas em formato A4",
        "formato": "A4",
        "conteudo_html": "<html>...</html>",
        "conteudo_css": "body { ... }"
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
        required_fields = ['nome', 'formato', 'conteudo_html']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório não fornecido: {field}'
                }), 400
        
        # Validar formato
        if data['formato'] not in ['A4', '16:9']:
            return jsonify({
                'success': False,
                'error': 'Formato deve ser A4 ou 16:9'
            }), 400
        
        # Criar novo template
        template = Template(
            nome=data['nome'],
            descricao=data.get('descricao'),
            formato=data['formato'],
            conteudo_html=data['conteudo_html'],
            conteudo_css=data.get('conteudo_css', ''),
            preview_url=data.get('preview_url')
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@templates_bp.route('/<int:template_id>', methods=['PUT'])
def atualizar_template(template_id):
    """
    Endpoint para atualizar um template existente
    """
    try:
        template = Template.query.get(template_id)
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Atualizar campos fornecidos
        if 'nome' in data:
            template.nome = data['nome']
        if 'descricao' in data:
            template.descricao = data['descricao']
        if 'formato' in data:
            if data['formato'] not in ['A4', '16:9']:
                return jsonify({
                    'success': False,
                    'error': 'Formato deve ser A4 ou 16:9'
                }), 400
            template.formato = data['formato']
        if 'conteudo_html' in data:
            template.conteudo_html = data['conteudo_html']
        if 'conteudo_css' in data:
            template.conteudo_css = data['conteudo_css']
        if 'preview_url' in data:
            template.preview_url = data['preview_url']
        if 'ativo' in data:
            template.ativo = data['ativo']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': template.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@templates_bp.route('/<int:template_id>', methods=['DELETE'])
def deletar_template(template_id):
    """
    Endpoint para deletar (desativar) um template
    """
    try:
        template = Template.query.get(template_id)
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado'
            }), 404
        
        # Desativar ao invés de deletar fisicamente
        template.ativo = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Template desativado com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@templates_bp.route('/popular-templates-exemplo', methods=['POST'])
def popular_templates_exemplo():
    """
    Endpoint para popular o banco com templates de exemplo
    ATENÇÃO: Use apenas em desenvolvimento/testes
    """
    try:
        # Verificar se já existem templates
        if Template.query.count() > 0:
            return jsonify({
                'success': False,
                'error': 'Banco já possui templates. Use este endpoint apenas em bancos vazios.'
            }), 400
        
        # Templates de exemplo
        templates_exemplo = [
            {
                'nome': 'Template Moderno A4',
                'descricao': 'Template moderno e profissional para propostas em formato A4',
                'formato': 'A4',
                'conteudo_html': '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta - Aquecimento Solar</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 2rem; text-align: center; margin-bottom: 2rem; }
        .header h1 { margin: 0; font-size: 2.5rem; }
        .header p { margin: 0.5rem 0 0 0; opacity: 0.9; }
        .section { margin-bottom: 2rem; }
        .section h2 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .card { background: #f8fafc; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #2563eb; }
        .highlight { background: #dbeafe; padding: 1rem; border-radius: 8px; text-align: center; }
        .highlight .value { font-size: 2rem; font-weight: bold; color: #2563eb; }
        .footer { text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Proposta de Aquecimento Solar</h1>
        <p>Sistema personalizado para {{nome_cliente}}</p>
    </div>
    
    <div class="section">
        <h2>Dados do Cliente</h2>
        <div class="grid">
            <div class="card">
                <strong>Nome:</strong> {{nome_cliente}}<br>
                <strong>Email:</strong> {{email_cliente}}<br>
                <strong>Telefone:</strong> {{telefone_cliente}}
            </div>
            <div class="card">
                <strong>Pessoas na residência:</strong> {{num_pessoas}}<br>
                <strong>Banheiros:</strong> {{num_banheiros}}<br>
                <strong>Localização:</strong> {{localizacao}}
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Dimensionamento do Sistema</h2>
        <div class="grid">
            <div class="highlight">
                <div class="value">{{consumo_diario_estimado}}L</div>
                <div>Consumo Diário</div>
            </div>
            <div class="highlight">
                <div class="value">{{volume_boiler_sugerido}}L</div>
                <div>Volume do Boiler</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Equipamentos Inclusos</h2>
        <div class="card">
            <p><strong>Boiler:</strong> {{boiler_nome}} - {{boiler_capacidade}}L</p>
            <p><strong>Coletor Solar:</strong> {{coletor_nome}} - {{coletor_capacidade}}m²</p>
            {{#pressurizador_nome}}
            <p><strong>Pressurizador:</strong> {{pressurizador_nome}}</p>
            {{/pressurizador_nome}}
        </div>
    </div>
    
    <div class="section">
        <h2>Investimento</h2>
        <div class="highlight">
            <div class="value">R$ {{valor_total}}</div>
            <div>Valor Total do Sistema</div>
        </div>
    </div>
    
    <div class="footer">
        <p>Proposta válida por 30 dias | Gerada em {{data_proposta}}</p>
    </div>
</body>
</html>
                ''',
                'conteudo_css': ''
            },
            {
                'nome': 'Template Apresentação 16:9',
                'descricao': 'Template estilo apresentação para propostas em formato 16:9',
                'formato': '16:9',
                'conteudo_html': '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apresentação - Aquecimento Solar</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            overflow-x: hidden;
        }
        .slide { 
            width: 100vw; 
            height: 100vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            padding: 2rem;
            box-sizing: border-box;
        }
        .slide h1 { font-size: 4rem; margin-bottom: 1rem; text-align: center; }
        .slide h2 { font-size: 3rem; margin-bottom: 2rem; text-align: center; }
        .slide p { font-size: 1.5rem; text-align: center; max-width: 800px; }
        .grid-slide { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; width: 100%; max-width: 1200px; }
        .card-slide { 
            background: rgba(255,255,255,0.1); 
            padding: 2rem; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            text-align: center;
        }
        .value-big { font-size: 4rem; font-weight: bold; margin-bottom: 1rem; }
        .fade-in { animation: fadeIn 1s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="slide fade-in">
        <h1>Aquecimento Solar</h1>
        <p>Proposta personalizada para {{nome_cliente}}</p>
        <p style="margin-top: 3rem; font-size: 1.2rem; opacity: 0.8;">Sistema dimensionado especialmente para sua residência</p>
    </div>
    
    <div class="slide fade-in">
        <h2>Seu Consumo</h2>
        <div class="grid-slide">
            <div class="card-slide">
                <div class="value-big">{{num_pessoas}}</div>
                <p>Pessoas na residência</p>
            </div>
            <div class="card-slide">
                <div class="value-big">{{consumo_diario_estimado}}L</div>
                <p>Consumo diário de água quente</p>
            </div>
        </div>
    </div>
    
    <div class="slide fade-in">
        <h2>Sistema Recomendado</h2>
        <div class="grid-slide">
            <div class="card-slide">
                <div class="value-big">{{volume_boiler_sugerido}}L</div>
                <p>Boiler para armazenamento</p>
            </div>
            <div class="card-slide">
                <div class="value-big">{{area_coletora_sugerida}}m²</div>
                <p>Área de coletores solares</p>
            </div>
        </div>
    </div>
    
    <div class="slide fade-in">
        <h2>Investimento</h2>
        <div class="card-slide" style="max-width: 600px;">
            <div class="value-big">R$ {{valor_total}}</div>
            <p>Valor total do sistema completo</p>
            <p style="margin-top: 2rem; opacity: 0.8;">Inclui todos os equipamentos e instalação</p>
        </div>
    </div>
</body>
</html>
                ''',
                'conteudo_css': ''
            }
        ]
        
        # Criar templates
        for template_data in templates_exemplo:
            template = Template(
                nome=template_data['nome'],
                descricao=template_data['descricao'],
                formato=template_data['formato'],
                conteudo_html=template_data['conteudo_html'],
                conteudo_css=template_data['conteudo_css']
            )
            db.session.add(template)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(templates_exemplo)} templates de exemplo criados com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

