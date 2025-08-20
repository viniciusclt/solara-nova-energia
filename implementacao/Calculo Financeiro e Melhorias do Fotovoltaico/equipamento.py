from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Equipamento(db.Model):
    """Modelo para representar equipamentos do sistema de aquecimento solar"""
    
    __tablename__ = 'equipamentos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    fabricante = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # 'coletor_placa_plana', 'coletor_vacuo', 'boiler_baixa', 'boiler_alta', 'pressurizador'
    capacidade = db.Column(db.Float)  # Volume em litros para boilers, área em m² para coletores
    especificacoes = db.Column(db.Text)  # JSON com especificações técnicas
    preco_custo = db.Column(db.Float)
    preco_venda = db.Column(db.Float)
    imagem_url = db.Column(db.String(500))
    ficha_tecnica_url = db.Column(db.String(500))
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Equipamento {self.nome}>'

    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'nome': self.nome,
            'fabricante': self.fabricante,
            'tipo': self.tipo,
            'capacidade': self.capacidade,
            'especificacoes': json.loads(self.especificacoes) if self.especificacoes else {},
            'preco_custo': self.preco_custo,
            'preco_venda': self.preco_venda,
            'imagem_url': self.imagem_url,
            'ficha_tecnica_url': self.ficha_tecnica_url,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def get_equipamentos_por_tipo(tipo):
        """Retorna equipamentos filtrados por tipo"""
        return Equipamento.query.filter_by(tipo=tipo, ativo=True).all()

    @staticmethod
    def buscar_boiler_por_volume(volume_minimo):
        """Busca boiler com volume igual ou superior ao especificado"""
        return Equipamento.query.filter(
            Equipamento.tipo.in_(['boiler_baixa', 'boiler_alta']),
            Equipamento.capacidade >= volume_minimo,
            Equipamento.ativo == True
        ).order_by(Equipamento.capacidade.asc()).first()

    @staticmethod
    def buscar_coletor_por_area(area_minima, tipo_coletor='coletor_placa_plana'):
        """Busca coletor com área igual ou superior ao especificado"""
        return Equipamento.query.filter(
            Equipamento.tipo == tipo_coletor,
            Equipamento.capacidade >= area_minima,
            Equipamento.ativo == True
        ).order_by(Equipamento.capacidade.asc()).first()

class PropostaBanho(db.Model):
    """Modelo para armazenar propostas de aquecimento de banho"""
    
    __tablename__ = 'propostas_banho'
    
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False)  # UUID para link público
    nome_cliente = db.Column(db.String(200), nullable=False)
    email_cliente = db.Column(db.String(200))
    telefone_cliente = db.Column(db.String(50))
    
    # Dados do dimensionamento
    num_pessoas = db.Column(db.Integer, nullable=False)
    num_banheiros = db.Column(db.Integer, default=1)
    duracao_banho_min = db.Column(db.Integer, default=10)
    tem_banheira = db.Column(db.Boolean, default=False)
    tem_ducha_higienica = db.Column(db.Boolean, default=False)
    tem_pia_cozinha = db.Column(db.Boolean, default=False)
    tem_maquina_lavar_louca = db.Column(db.Boolean, default=False)
    tem_maquina_lavar_roupa = db.Column(db.Boolean, default=False)
    temperatura_desejada = db.Column(db.Float, default=40.0)
    localizacao = db.Column(db.String(100))
    tipo_coletor = db.Column(db.String(50), default='coletor_placa_plana')
    tipo_pressao = db.Column(db.String(20), default='baixa')
    
    # Resultados do dimensionamento
    consumo_diario_estimado = db.Column(db.Float)
    volume_boiler_sugerido = db.Column(db.Float)
    area_coletora_sugerida = db.Column(db.Float)
    
    # Equipamentos selecionados (IDs)
    boiler_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'))
    coletor_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'))
    pressurizador_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'))
    
    # Relacionamentos
    boiler = db.relationship('Equipamento', foreign_keys=[boiler_id])
    coletor = db.relationship('Equipamento', foreign_keys=[coletor_id])
    pressurizador = db.relationship('Equipamento', foreign_keys=[pressurizador_id])
    
    # Dados da proposta
    valor_total = db.Column(db.Float)
    observacoes = db.Column(db.Text)
    template_usado = db.Column(db.String(100))
    formato_proposta = db.Column(db.String(10), default='A4')  # 'A4' ou '16:9'
    
    # Controle
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<PropostaBanho {self.nome_cliente}>'

    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'uuid': self.uuid,
            'nome_cliente': self.nome_cliente,
            'email_cliente': self.email_cliente,
            'telefone_cliente': self.telefone_cliente,
            'num_pessoas': self.num_pessoas,
            'num_banheiros': self.num_banheiros,
            'duracao_banho_min': self.duracao_banho_min,
            'tem_banheira': self.tem_banheira,
            'tem_ducha_higienica': self.tem_ducha_higienica,
            'tem_pia_cozinha': self.tem_pia_cozinha,
            'tem_maquina_lavar_louca': self.tem_maquina_lavar_louca,
            'tem_maquina_lavar_roupa': self.tem_maquina_lavar_roupa,
            'temperatura_desejada': self.temperatura_desejada,
            'localizacao': self.localizacao,
            'tipo_coletor': self.tipo_coletor,
            'tipo_pressao': self.tipo_pressao,
            'consumo_diario_estimado': self.consumo_diario_estimado,
            'volume_boiler_sugerido': self.volume_boiler_sugerido,
            'area_coletora_sugerida': self.area_coletora_sugerida,
            'boiler': self.boiler.to_dict() if self.boiler else None,
            'coletor': self.coletor.to_dict() if self.coletor else None,
            'pressurizador': self.pressurizador.to_dict() if self.pressurizador else None,
            'valor_total': self.valor_total,
            'observacoes': self.observacoes,
            'template_usado': self.template_usado,
            'formato_proposta': self.formato_proposta,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class VisualizacaoProposta(db.Model):
    """Modelo para rastrear visualizações das propostas"""
    
    __tablename__ = 'visualizacoes_proposta'
    
    id = db.Column(db.Integer, primary_key=True)
    proposta_id = db.Column(db.Integer, db.ForeignKey('propostas_banho.id'), nullable=False)
    ip_address = db.Column(db.String(45))  # IPv4 ou IPv6
    user_agent = db.Column(db.String(500))
    data_visualizacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento
    proposta = db.relationship('PropostaBanho', backref='visualizacoes')

    def __repr__(self):
        return f'<VisualizacaoProposta {self.proposta_id} - {self.ip_address}>'

    def to_dict(self):
        return {
            'id': self.id,
            'proposta_id': self.proposta_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'data_visualizacao': self.data_visualizacao.isoformat() if self.data_visualizacao else None
        }

class Template(db.Model):
    """Modelo para armazenar templates de propostas"""
    
    __tablename__ = 'templates'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    formato = db.Column(db.String(10), nullable=False)  # 'A4' ou '16:9'
    conteudo_html = db.Column(db.Text)  # HTML do template
    conteudo_css = db.Column(db.Text)   # CSS do template
    preview_url = db.Column(db.String(500))  # URL da imagem de preview
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Template {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'formato': self.formato,
            'conteudo_html': self.conteudo_html,
            'conteudo_css': self.conteudo_css,
            'preview_url': self.preview_url,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

