from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Tarifa:
    """Classe para representar tarifas de energia elétrica por concessionária"""
    
    def __init__(self, concessionaria, ano, dados):
        self.concessionaria = concessionaria  # 'light', 'enel-rj', 'ceral'
        self.ano = ano
        self.tarifa_base = dados.get('tarifa_base', 0)
        self.tusd = dados.get('tusd', 0)
        self.te = dados.get('te', 0)
        self.fio_b = dados.get('fio_b', 0)
        self.percentual_fio_b = dados.get('percentual_fio_b', 0)
        self.pis = dados.get('pis', 0.0107)
        self.cofins = dados.get('cofins', 0.0494)
        self.icms_faixas = dados.get('icms_faixas', {})
        self.cosip_faixas = dados.get('cosip_faixas', {})

    def calcular_tarifa_final(self, consumo_kwh):
        """Calcula a tarifa final considerando impostos e taxas"""
        icms_aplicavel = self.get_icms_por_faixa(consumo_kwh)
        cosip_aplicavel = self.get_cosip_por_faixa(consumo_kwh)
        
        # Fórmula: (Tarifa_base + TUSD + TE) × (1 + PIS + COFINS) × (1 + ICMS) + COSIP
        tarifa_sem_impostos = self.tarifa_base + self.tusd + self.te
        tarifa_com_pis_cofins = tarifa_sem_impostos * (1 + self.pis + self.cofins)
        tarifa_com_icms = tarifa_com_pis_cofins * (1 + icms_aplicavel)
        tarifa_final = tarifa_com_icms + cosip_aplicavel
        
        return tarifa_final

    def get_icms_por_faixa(self, consumo_kwh):
        """Retorna a alíquota de ICMS baseada na faixa de consumo (RJ)"""
        if consumo_kwh <= 50:
            return 0  # Isento
        elif consumo_kwh <= 299:
            return 0.18  # 18%
        elif consumo_kwh <= 450:
            return 0.18  # 18%
        else:
            return 0.18  # 18%

    def get_cosip_por_faixa(self, consumo_kwh):
        """Retorna o valor de COSIP baseado na faixa de consumo"""
        # Valores baseados na planilha original (Light)
        if consumo_kwh <= 50:
            return 0
        elif consumo_kwh <= 100:
            return 6.22
        elif consumo_kwh <= 140:
            return 8.86
        elif consumo_kwh <= 200:
            return 13.02
        elif consumo_kwh <= 300:
            return 18.24
        elif consumo_kwh <= 400:
            return 23.45
        elif consumo_kwh <= 500:
            return 28.65
        else:
            return 31.86  # Valor para faixas maiores

    @staticmethod
    def get_tarifas_2025():
        """Retorna as tarifas atualizadas para 2025 das concessionárias do RJ"""
        return {
            'light': Tarifa('light', 2025, {
                'tarifa_base': 0.863297,
                'tusd': 0.4972349297,
                'te': 0.366062,
                'fio_b': 0.19705238,
                'percentual_fio_b': 0.22825560612396428,
                'pis': 0.0107,
                'cofins': 0.0494
            }),
            'enel-rj': Tarifa('enel-rj', 2025, {
                'tarifa_base': 0.970251,
                'tusd': 0.6392627,
                'te': 0.330988,
                'fio_b': 0.335748,
                'percentual_fio_b': 0.3460424158284815,
                'pis': 0.0107,
                'cofins': 0.0494
            }),
            'ceral': Tarifa('ceral', 2025, {
                'tarifa_base': 0.863297,
                'tusd': 0.4972349297,
                'te': 0.366062,
                'fio_b': 0.19705238,
                'percentual_fio_b': 0.22825560612396428,
                'pis': 0.0107,
                'cofins': 0.0494
            })
        }

