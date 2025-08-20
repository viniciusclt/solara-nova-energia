from flask import Blueprint, request, jsonify, render_template_string, make_response
from src.models.equipamento import PropostaBanho, Template, VisualizacaoProposta, db
import uuid
import re
from datetime import datetime
import os

propostas_bp = Blueprint('propostas', __name__)

@propostas_bp.route('/gerar', methods=['POST'])
def gerar_proposta():
    """
    Endpoint para gerar uma proposta em HTML/PDF
    
    Payload esperado:
    {
        "proposta_id": 1,
        "template_id": 1,
        "formato_saida": "html" // ou "pdf"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        proposta_id = data.get('proposta_id')
        template_id = data.get('template_id')
        formato_saida = data.get('formato_saida', 'html')
        
        if not proposta_id or not template_id:
            return jsonify({
                'success': False,
                'error': 'proposta_id e template_id são obrigatórios'
            }), 400
        
        # Buscar proposta
        proposta = PropostaBanho.query.get(proposta_id)
        if not proposta:
            return jsonify({
                'success': False,
                'error': 'Proposta não encontrada'
            }), 404
        
        # Buscar template
        template = Template.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado'
            }), 404
        
        # Preparar dados para o template
        dados_template = {
            'nome_cliente': proposta.nome_cliente,
            'email_cliente': proposta.email_cliente or '',
            'telefone_cliente': proposta.telefone_cliente or '',
            'num_pessoas': proposta.num_pessoas,
            'num_banheiros': proposta.num_banheiros,
            'localizacao': proposta.localizacao.title() if proposta.localizacao else '',
            'consumo_diario_estimado': proposta.consumo_diario_estimado,
            'volume_boiler_sugerido': proposta.volume_boiler_sugerido,
            'area_coletora_sugerida': proposta.area_coletora_sugerida,
            'valor_total': f"{proposta.valor_total:,.2f}".replace(',', '.').replace('.', ',', 1) if proposta.valor_total else '0,00',
            'data_proposta': proposta.created_at.strftime('%d/%m/%Y') if proposta.created_at else datetime.now().strftime('%d/%m/%Y'),
            'boiler_nome': proposta.boiler.nome if proposta.boiler else 'Não especificado',
            'boiler_capacidade': proposta.boiler.capacidade if proposta.boiler else 0,
            'coletor_nome': proposta.coletor.nome if proposta.coletor else 'Não especificado',
            'coletor_capacidade': proposta.coletor.capacidade if proposta.coletor else 0,
            'pressurizador_nome': proposta.pressurizador.nome if proposta.pressurizador else None
        }
        
        # Renderizar template
        html_renderizado = renderizar_template_mustache(template.conteudo_html, dados_template)
        
        if formato_saida == 'pdf':
            # Gerar PDF - Funcionalidade temporariamente desabilitada
            return jsonify({
                'success': False,
                'error': 'Geração de PDF temporariamente indisponível. Use formato HTML.'
            }), 501
        
        else:
            # Retornar HTML
            return jsonify({
                'success': True,
                'data': {
                    'html': html_renderizado,
                    'proposta_uuid': proposta.uuid
                }
            })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@propostas_bp.route('/visualizar/<proposta_uuid>', methods=['GET'])
def visualizar_proposta(proposta_uuid):
    """
    Endpoint para visualizar uma proposta online (com rastreamento)
    """
    try:
        # Buscar proposta
        proposta = PropostaBanho.query.filter_by(uuid=proposta_uuid, ativo=True).first()
        
        if not proposta:
            return jsonify({
                'success': False,
                'error': 'Proposta não encontrada'
            }), 404
        
        # Registrar visualização
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', '')
        
        visualizacao = VisualizacaoProposta(
            proposta_id=proposta.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.add(visualizacao)
        db.session.commit()
        
        # Buscar template padrão ou usar o template da proposta
        template = None
        if proposta.template_usado:
            template = Template.query.filter_by(nome=proposta.template_usado, ativo=True).first()
        
        if not template:
            # Usar template padrão baseado no formato
            formato = proposta.formato_proposta or 'A4'
            template = Template.query.filter_by(formato=formato, ativo=True).first()
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado'
            }), 404
        
        # Preparar dados para o template
        dados_template = {
            'nome_cliente': proposta.nome_cliente,
            'email_cliente': proposta.email_cliente or '',
            'telefone_cliente': proposta.telefone_cliente or '',
            'num_pessoas': proposta.num_pessoas,
            'num_banheiros': proposta.num_banheiros,
            'localizacao': proposta.localizacao.title() if proposta.localizacao else '',
            'consumo_diario_estimado': proposta.consumo_diario_estimado,
            'volume_boiler_sugerido': proposta.volume_boiler_sugerido,
            'area_coletora_sugerida': proposta.area_coletora_sugerida,
            'valor_total': f"{proposta.valor_total:,.2f}".replace(',', '.').replace('.', ',', 1) if proposta.valor_total else '0,00',
            'data_proposta': proposta.created_at.strftime('%d/%m/%Y') if proposta.created_at else datetime.now().strftime('%d/%m/%Y'),
            'boiler_nome': proposta.boiler.nome if proposta.boiler else 'Não especificado',
            'boiler_capacidade': proposta.boiler.capacidade if proposta.boiler else 0,
            'coletor_nome': proposta.coletor.nome if proposta.coletor else 'Não especificado',
            'coletor_capacidade': proposta.coletor.capacidade if proposta.coletor else 0,
            'pressurizador_nome': proposta.pressurizador.nome if proposta.pressurizador else None
        }
        
        # Renderizar template
        html_renderizado = renderizar_template_mustache(template.conteudo_html, dados_template)
        
        # Retornar HTML renderizado
        return html_renderizado
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@propostas_bp.route('/visualizacoes/<proposta_uuid>', methods=['GET'])
def obter_visualizacoes(proposta_uuid):
    """
    Endpoint para obter as visualizações de uma proposta
    """
    try:
        # Buscar proposta
        proposta = PropostaBanho.query.filter_by(uuid=proposta_uuid, ativo=True).first()
        
        if not proposta:
            return jsonify({
                'success': False,
                'error': 'Proposta não encontrada'
            }), 404
        
        # Buscar visualizações
        visualizacoes = VisualizacaoProposta.query.filter_by(proposta_id=proposta.id)\
                                                  .order_by(VisualizacaoProposta.data_visualizacao.desc())\
                                                  .all()
        
        return jsonify({
            'success': True,
            'data': {
                'proposta_uuid': proposta_uuid,
                'total_visualizacoes': len(visualizacoes),
                'visualizacoes': [v.to_dict() for v in visualizacoes]
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

def renderizar_template_mustache(template_html, dados):
    """
    Função simples para renderizar templates estilo Mustache
    Substitui {{variavel}} pelos valores dos dados
    """
    html_renderizado = template_html
    
    for chave, valor in dados.items():
        # Substituir variáveis simples {{variavel}}
        padrao = f"{{{{{chave}}}}}"
        html_renderizado = html_renderizado.replace(padrao, str(valor) if valor is not None else '')
        
        # Tratar condicionais simples {{#variavel}}...{{/variavel}}
        if valor:
            # Mostrar conteúdo condicional
            padrao_condicional = f"{{{{#{chave}}}}}(.*?){{{{/{chave}}}}}"
            matches = re.findall(padrao_condicional, html_renderizado, re.DOTALL)
            for match in matches:
                html_renderizado = re.sub(padrao_condicional, match, html_renderizado, count=1)
        else:
            # Remover conteúdo condicional
            padrao_condicional = f"{{{{#{chave}}}}}.*?{{{{/{chave}}}}}"
            html_renderizado = re.sub(padrao_condicional, '', html_renderizado, flags=re.DOTALL)
    
    return html_renderizado

@propostas_bp.route('/preview-template', methods=['POST'])
def preview_template():
    """
    Endpoint para preview de template com dados de exemplo
    
    Payload esperado:
    {
        "template_id": 1,
        "dados_exemplo": { ... dados opcionais para preview ... }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        template_id = data.get('template_id')
        
        if not template_id:
            return jsonify({
                'success': False,
                'error': 'template_id é obrigatório'
            }), 400
        
        # Buscar template
        template = Template.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado'
            }), 404
        
        # Dados de exemplo para preview
        dados_exemplo = data.get('dados_exemplo', {})
        dados_padrao = {
            'nome_cliente': 'João Silva',
            'email_cliente': 'joao@email.com',
            'telefone_cliente': '(11) 99999-9999',
            'num_pessoas': 4,
            'num_banheiros': 2,
            'localizacao': 'Sudeste',
            'consumo_diario_estimado': 380,
            'volume_boiler_sugerido': 600,
            'area_coletora_sugerida': 4.0,
            'valor_total': '15.500,00',
            'data_proposta': datetime.now().strftime('%d/%m/%Y'),
            'boiler_nome': 'Boiler 600L Alta Pressão',
            'boiler_capacidade': 600,
            'coletor_nome': 'Coletor Placa Plana 4,0m²',
            'coletor_capacidade': 4.0,
            'pressurizador_nome': 'Pressurizador 1/2 CV'
        }
        
        # Mesclar dados de exemplo com dados padrão
        dados_template = {**dados_padrao, **dados_exemplo}
        
        # Renderizar template
        html_renderizado = renderizar_template_mustache(template.conteudo_html, dados_template)
        
        return jsonify({
            'success': True,
            'data': {
                'html': html_renderizado,
                'template_nome': template.nome,
                'template_formato': template.formato
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

