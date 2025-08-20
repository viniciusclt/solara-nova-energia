import math
from typing import Dict, List, Any, Optional

class DimensionadorAquecimentoBanho:
    """Classe principal para dimensionamento de sistemas de aquecimento solar de água"""
    
    # Constantes baseadas na ABNT NBR 15.569
    CONSUMO_CHUVEIRO_LITROS_MIN = 7  # Litros por minuto
    CONSUMO_LAVATORIO_PESSOA_DIA = 20  # Litros por pessoa por dia
    CONSUMO_COZINHA_PESSOA_DIA = 25  # Litros por pessoa por dia
    CONSUMO_BANHEIRA_INDIVIDUAL = 150  # Litros por uso
    CONSUMO_BANHEIRA_DUPLA = 300  # Litros por uso
    CONSUMO_DUCHA_HIGIENICA_DIA = 10  # Litros por dia
    CONSUMO_MAQUINA_LAVAR_LOUCA_CICLO = 30  # Litros por ciclo
    CONSUMO_MAQUINA_LAVAR_ROUPA_CICLO = 50  # Litros por ciclo
    
    # Fatores de insolação por região (m²/litro de boiler)
    FATORES_INSOLACAO = {
        'norte': 0.04,
        'nordeste': 0.04,
        'centro-oeste': 0.045,
        'sudeste': 0.05,
        'sul': 0.06
    }
    
    # Volumes comerciais de boilers disponíveis (litros)
    VOLUMES_BOILER_COMERCIAIS = [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000]
    
    # Áreas comerciais de coletores disponíveis (m²)
    AREAS_COLETOR_COMERCIAIS = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0]

    def __init__(self):
        pass

    def calcular_consumo_diario(self, parametros: Dict[str, Any]) -> float:
        """
        Calcula o consumo diário de água quente baseado nos parâmetros de entrada
        
        Args:
            parametros: Dicionário com os parâmetros do sistema
            
        Returns:
            Consumo diário em litros
        """
        num_pessoas = parametros.get('num_pessoas', 1)
        duracao_banho_min = parametros.get('duracao_banho_min', 10)
        tem_banheira = parametros.get('tem_banheira', False)
        tem_ducha_higienica = parametros.get('tem_ducha_higienica', False)
        tem_pia_cozinha = parametros.get('tem_pia_cozinha', False)
        tem_maquina_lavar_louca = parametros.get('tem_maquina_lavar_louca', False)
        tem_maquina_lavar_roupa = parametros.get('tem_maquina_lavar_roupa', False)
        ciclos_lavar_louca = parametros.get('ciclos_lavar_louca', 1)
        ciclos_lavar_roupa = parametros.get('ciclos_lavar_roupa', 1)
        tipo_banheira = parametros.get('tipo_banheira', 'individual')  # 'individual' ou 'dupla'
        
        # Consumo básico: chuveiros
        consumo_chuveiro = num_pessoas * duracao_banho_min * self.CONSUMO_CHUVEIRO_LITROS_MIN
        
        # Consumo lavatórios (se habilitado)
        consumo_lavatorio = 0
        if parametros.get('tem_lavatorio', True):  # Por padrão, considera lavatórios
            consumo_lavatorio = num_pessoas * self.CONSUMO_LAVATORIO_PESSOA_DIA
        
        # Consumo cozinha
        consumo_cozinha = 0
        if tem_pia_cozinha:
            consumo_cozinha = num_pessoas * self.CONSUMO_COZINHA_PESSOA_DIA
        
        # Consumo banheira
        consumo_banheira = 0
        if tem_banheira:
            if tipo_banheira == 'dupla':
                consumo_banheira = self.CONSUMO_BANHEIRA_DUPLA
            else:
                consumo_banheira = self.CONSUMO_BANHEIRA_INDIVIDUAL
        
        # Consumo ducha higiênica
        consumo_ducha = 0
        if tem_ducha_higienica:
            consumo_ducha = self.CONSUMO_DUCHA_HIGIENICA_DIA
        
        # Consumo máquina lavar louça
        consumo_lavar_louca = 0
        if tem_maquina_lavar_louca:
            consumo_lavar_louca = ciclos_lavar_louca * self.CONSUMO_MAQUINA_LAVAR_LOUCA_CICLO
        
        # Consumo máquina lavar roupa
        consumo_lavar_roupa = 0
        if tem_maquina_lavar_roupa:
            consumo_lavar_roupa = ciclos_lavar_roupa * self.CONSUMO_MAQUINA_LAVAR_ROUPA_CICLO
        
        # Consumo total diário
        consumo_total = (
            consumo_chuveiro + 
            consumo_lavatorio + 
            consumo_cozinha + 
            consumo_banheira + 
            consumo_ducha + 
            consumo_lavar_louca + 
            consumo_lavar_roupa
        )
        
        return consumo_total

    def dimensionar_boiler(self, consumo_diario: float, autonomia_dias: float = 1.5) -> int:
        """
        Dimensiona o volume do boiler baseado no consumo diário
        
        Args:
            consumo_diario: Consumo diário em litros
            autonomia_dias: Dias de autonomia desejados
            
        Returns:
            Volume do boiler em litros
        """
        volume_necessario = consumo_diario * autonomia_dias
        
        # Encontra o volume comercial mais próximo (igual ou superior)
        for volume in self.VOLUMES_BOILER_COMERCIAIS:
            if volume >= volume_necessario:
                return volume
        
        # Se não encontrou, retorna o maior volume disponível
        return self.VOLUMES_BOILER_COMERCIAIS[-1]

    def dimensionar_coletores(self, volume_boiler: int, localizacao: str, tipo_coletor: str = 'placa_plana') -> float:
        """
        Dimensiona a área dos coletores solares
        
        Args:
            volume_boiler: Volume do boiler em litros
            localizacao: Região geográfica
            tipo_coletor: Tipo do coletor ('placa_plana' ou 'vacuo')
            
        Returns:
            Área dos coletores em m²
        """
        # Obtém o fator de insolação da região
        fator_insolacao = self.FATORES_INSOLACAO.get(localizacao.lower(), 0.05)
        
        # Coletores a vácuo são mais eficientes (reduz área necessária em 20%)
        if tipo_coletor == 'vacuo':
            fator_insolacao *= 0.8
        
        # Calcula área necessária
        area_necessaria = volume_boiler * fator_insolacao
        
        # Encontra a área comercial mais próxima (igual ou superior)
        for area in self.AREAS_COLETOR_COMERCIAIS:
            if area >= area_necessaria:
                return area
        
        # Se não encontrou, retorna a maior área disponível
        return self.AREAS_COLETOR_COMERCIAIS[-1]

    def verificar_necessidade_pressurizador(self, parametros: Dict[str, Any]) -> bool:
        """
        Verifica se é necessário pressurizador baseado nos parâmetros
        
        Args:
            parametros: Dicionário com os parâmetros do sistema
            
        Returns:
            True se necessário pressurizador, False caso contrário
        """
        tipo_pressao = parametros.get('tipo_pressao', 'baixa')
        num_banheiros = parametros.get('num_banheiros', 1)
        tem_banheira = parametros.get('tem_banheira', False)
        tem_ducha_alta_vazao = parametros.get('tem_ducha_alta_vazao', False)
        
        # Necessário se:
        # - Sistema de baixa pressão OU
        # - Mais de 2 banheiros OU
        # - Tem banheira OU
        # - Tem ducha de alta vazão
        return (
            tipo_pressao == 'baixa' or 
            num_banheiros > 2 or 
            tem_banheira or 
            tem_ducha_alta_vazao
        )

    def calcular_economia_energia(self, consumo_diario: float, tipo_energia_atual: str = 'eletrica') -> Dict[str, float]:
        """
        Calcula a economia de energia com o sistema solar
        
        Args:
            consumo_diario: Consumo diário de água quente em litros
            tipo_energia_atual: Tipo de energia atual ('eletrica' ou 'gas')
            
        Returns:
            Dicionário com dados de economia
        """
        # Energia necessária para aquecer a água (considerando ΔT = 25°C)
        # Q = m × c × ΔT (onde c = 4186 J/kg°C para água)
        energia_diaria_joules = consumo_diario * 4186 * 25  # Joules
        energia_diaria_kwh = energia_diaria_joules / 3600000  # kWh
        energia_mensal_kwh = energia_diaria_kwh * 30
        energia_anual_kwh = energia_diaria_kwh * 365
        
        # Custos por tipo de energia (valores médios Brasil 2024)
        custos_energia = {
            'eletrica': 0.85,  # R$/kWh
            'gas': 0.45       # R$/kWh equivalente
        }
        
        custo_kwh = custos_energia.get(tipo_energia_atual, 0.85)
        
        # Economia considerando eficiência do sistema solar (80%)
        eficiencia_solar = 0.8
        economia_mensal = energia_mensal_kwh * custo_kwh * eficiencia_solar
        economia_anual = energia_anual_kwh * custo_kwh * eficiencia_solar
        
        return {
            'energia_diaria_kwh': round(energia_diaria_kwh, 2),
            'energia_mensal_kwh': round(energia_mensal_kwh, 2),
            'energia_anual_kwh': round(energia_anual_kwh, 2),
            'economia_mensal': round(economia_mensal, 2),
            'economia_anual': round(economia_anual, 2),
            'custo_kwh_usado': custo_kwh
        }

    def dimensionar_sistema_completo(self, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """
        Realiza o dimensionamento completo do sistema
        
        Args:
            parametros: Dicionário com todos os parâmetros de entrada
            
        Returns:
            Dicionário com todos os resultados do dimensionamento
        """
        # Validar parâmetros obrigatórios
        required_params = ['num_pessoas', 'localizacao']
        for param in required_params:
            if param not in parametros:
                raise ValueError(f"Parâmetro obrigatório não fornecido: {param}")
        
        # 1. Calcular consumo diário
        consumo_diario = self.calcular_consumo_diario(parametros)
        
        # 2. Dimensionar boiler
        autonomia_dias = parametros.get('autonomia_dias', 1.5)
        volume_boiler = self.dimensionar_boiler(consumo_diario, autonomia_dias)
        
        # 3. Dimensionar coletores
        localizacao = parametros.get('localizacao', 'sudeste')
        tipo_coletor = parametros.get('tipo_coletor', 'placa_plana')
        area_coletores = self.dimensionar_coletores(volume_boiler, localizacao, tipo_coletor)
        
        # 4. Verificar necessidade de pressurizador
        precisa_pressurizador = self.verificar_necessidade_pressurizador(parametros)
        
        # 5. Calcular economia de energia
        tipo_energia_atual = parametros.get('tipo_energia_atual', 'eletrica')
        economia = self.calcular_economia_energia(consumo_diario, tipo_energia_atual)
        
        # 6. Determinar tipo de boiler baseado na pressão
        tipo_pressao = parametros.get('tipo_pressao', 'baixa')
        tipo_boiler_sugerido = 'boiler_alta' if tipo_pressao == 'alta' or precisa_pressurizador else 'boiler_baixa'
        
        # 7. Determinar tipo de coletor
        tipo_coletor_sugerido = f"coletor_{tipo_coletor.replace('_', '_')}"
        
        return {
            'consumo_diario_estimado': round(consumo_diario, 2),
            'volume_boiler_sugerido': volume_boiler,
            'area_coletora_sugerida': area_coletores,
            'tipo_boiler_sugerido': tipo_boiler_sugerido,
            'tipo_coletor_sugerido': tipo_coletor_sugerido,
            'precisa_pressurizador': precisa_pressurizador,
            'economia': economia,
            'parametros_utilizados': {
                'autonomia_dias': autonomia_dias,
                'localizacao': localizacao,
                'tipo_coletor': tipo_coletor,
                'tipo_energia_atual': tipo_energia_atual
            },
            'detalhamento_consumo': self._detalhar_consumo(parametros)
        }

    def _detalhar_consumo(self, parametros: Dict[str, Any]) -> Dict[str, float]:
        """
        Detalha o consumo por tipo de uso
        
        Args:
            parametros: Dicionário com os parâmetros do sistema
            
        Returns:
            Dicionário com detalhamento do consumo
        """
        num_pessoas = parametros.get('num_pessoas', 1)
        duracao_banho_min = parametros.get('duracao_banho_min', 10)
        
        detalhamento = {
            'chuveiro': num_pessoas * duracao_banho_min * self.CONSUMO_CHUVEIRO_LITROS_MIN,
            'lavatorio': num_pessoas * self.CONSUMO_LAVATORIO_PESSOA_DIA if parametros.get('tem_lavatorio', True) else 0,
            'cozinha': num_pessoas * self.CONSUMO_COZINHA_PESSOA_DIA if parametros.get('tem_pia_cozinha', False) else 0,
            'banheira': 0,
            'ducha_higienica': self.CONSUMO_DUCHA_HIGIENICA_DIA if parametros.get('tem_ducha_higienica', False) else 0,
            'maquina_lavar_louca': 0,
            'maquina_lavar_roupa': 0
        }
        
        # Banheira
        if parametros.get('tem_banheira', False):
            tipo_banheira = parametros.get('tipo_banheira', 'individual')
            detalhamento['banheira'] = self.CONSUMO_BANHEIRA_DUPLA if tipo_banheira == 'dupla' else self.CONSUMO_BANHEIRA_INDIVIDUAL
        
        # Máquinas
        if parametros.get('tem_maquina_lavar_louca', False):
            ciclos = parametros.get('ciclos_lavar_louca', 1)
            detalhamento['maquina_lavar_louca'] = ciclos * self.CONSUMO_MAQUINA_LAVAR_LOUCA_CICLO
        
        if parametros.get('tem_maquina_lavar_roupa', False):
            ciclos = parametros.get('ciclos_lavar_roupa', 1)
            detalhamento['maquina_lavar_roupa'] = ciclos * self.CONSUMO_MAQUINA_LAVAR_ROUPA_CICLO
        
        return detalhamento

    @staticmethod
    def validar_parametros(parametros: Dict[str, Any]) -> List[str]:
        """
        Valida os parâmetros de entrada
        
        Args:
            parametros: Dicionário com os parâmetros
            
        Returns:
            Lista de erros encontrados (vazia se tudo OK)
        """
        erros = []
        
        # Validações obrigatórias
        if not parametros.get('num_pessoas') or parametros['num_pessoas'] < 1:
            erros.append("Número de pessoas deve ser maior que zero")
        
        if not parametros.get('localizacao'):
            erros.append("Localização é obrigatória")
        
        # Validações de range
        if parametros.get('duracao_banho_min', 0) < 1 or parametros.get('duracao_banho_min', 0) > 60:
            erros.append("Duração do banho deve estar entre 1 e 60 minutos")
        
        if parametros.get('temperatura_desejada', 0) < 30 or parametros.get('temperatura_desejada', 0) > 60:
            erros.append("Temperatura desejada deve estar entre 30°C e 60°C")
        
        # Validações de valores válidos
        localizacoes_validas = list(DimensionadorAquecimentoBanho.FATORES_INSOLACAO.keys())
        if parametros.get('localizacao') and parametros['localizacao'].lower() not in localizacoes_validas:
            erros.append(f"Localização deve ser uma das opções: {', '.join(localizacoes_validas)}")
        
        tipos_coletor_validos = ['placa_plana', 'vacuo']
        if parametros.get('tipo_coletor') and parametros['tipo_coletor'] not in tipos_coletor_validos:
            erros.append(f"Tipo de coletor deve ser: {' ou '.join(tipos_coletor_validos)}")
        
        return erros

