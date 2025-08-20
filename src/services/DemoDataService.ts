import { EnvironmentDetector } from '@/utils/EnvironmentDetector';
import { ILead as Lead, SolarModule, Inverter } from '@/types';

/**
 * Interface para dados de demonstração
 */
interface DemoData {
  leads: Lead[];
  modules: SolarModule[];
  inverters: Inverter[];
}

/**
 * Serviço de dados de demonstração para desenvolvimento local
 * Fornece dados realistas apenas em localhost
 */
export class DemoDataService {
  private static instance: DemoDataService;
  private demoData: DemoData;

  private constructor() {
    this.demoData = this.initializeDemoData();
  }

  static getInstance(): DemoDataService {
    if (!this.instance) {
      this.instance = new DemoDataService();
    }
    return this.instance;
  }

  /**
   * Retorna leads de demonstração se em localhost
   */
  getLeads(): Lead[] {
    if (EnvironmentDetector.shouldUseDemoData()) {
      return this.demoData.leads;
    }
    return [];
  }

  /**
   * Retorna módulos de demonstração se em localhost
   */
  getModules(): SolarModule[] {
    if (EnvironmentDetector.shouldUseDemoData()) {
      return this.demoData.modules;
    }
    return [];
  }

  /**
   * Retorna inversores de demonstração se em localhost
   */
  getInverters(): Inverter[] {
    if (EnvironmentDetector.shouldUseDemoData()) {
      return this.demoData.inverters;
    }
    return [];
  }

  /**
   * Alias para getModules() - compatibilidade com código existente
   */
  getSolarModules(): SolarModule[] {
    return this.getModules();
  }

  /**
   * Verifica se deve usar dados demo
   */
  shouldUseDemoData(): boolean {
    return EnvironmentDetector.shouldUseDemoData();
  }

  /**
   * Inicializa os dados de demonstração
   */
  private initializeDemoData(): DemoData {
    return {
      leads: this.createDemoLeads(),
      modules: this.createDemoModules(),
      inverters: this.createDemoInverters()
    };
  }

  /**
   * Cria 8 leads de demonstração incluindo leads do Google
   */
  private createDemoLeads(): Lead[] {
    return [
      {
        id: 'demo-lead-1',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-1111',
        cpf: '123.456.789-01',
        cep: '01310-100',
        address: 'Av. Paulista, 1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        concessionaria: 'Enel São Paulo',
        grupo: 'B',
        subgrupo: 'B1',
        consumoMedio: 450,
        consumoMensal: [420, 380, 410, 450, 480, 520, 550, 530, 490, 460, 440, 430],
        tarifaEnergia: 0.75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-lead-2',
        name: 'Maria Santos',
        email: 'maria.santos@empresa.com.br',
        phone: '(21) 98888-2222',
        cpf: '987.654.321-02',
        cep: '22071-900',
        address: 'Av. Atlântica, 500',
        neighborhood: 'Copacabana',
        city: 'Rio de Janeiro',
        state: 'RJ',
        concessionaria: 'Light',
        grupo: 'A',
        subgrupo: 'A4',
        consumoMedio: 680,
        consumoMensal: [650, 620, 640, 680, 720, 780, 820, 800, 740, 700, 660, 640],
        tarifaEnergia: 0.82,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-lead-3',
        name: 'Carlos Oliveira',
        email: 'carlos@residencial.com',
        phone: '(31) 97777-3333',
        cpf: '456.789.123-03',
        cep: '30112-000',
        address: 'Rua da Bahia, 1200',
        neighborhood: 'Centro',
        city: 'Belo Horizonte',
        state: 'MG',
        concessionaria: 'Cemig',
        grupo: 'B',
        subgrupo: 'B1',
        consumoMedio: 320,
        consumoMensal: [300, 280, 310, 320, 340, 360, 380, 370, 350, 330, 310, 290],
        tarifaEnergia: 0.68,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-lead-4',
        name: 'Ana Costa',
        email: 'ana.costa@comercial.com.br',
        phone: '(85) 96666-4444',
        cpf: '789.123.456-04',
        cep: '60160-230',
        address: 'Av. Beira Mar, 800',
        neighborhood: 'Meireles',
        city: 'Fortaleza',
        state: 'CE',
        concessionaria: 'Enel Ceará',
        grupo: 'A',
        subgrupo: 'A4',
        consumoMedio: 890,
        consumoMensal: [850, 820, 860, 890, 920, 980, 1020, 1000, 950, 910, 870, 840],
        tarifaEnergia: 0.71,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-lead-5',
        name: 'Roberto Ferreira',
        email: 'roberto.ferreira@industrial.com.br',
        phone: '(47) 95555-5555',
        cpf: '321.654.987-05',
        cep: '89010-100',
        address: 'Rua XV de Novembro, 300',
        neighborhood: 'Centro',
        city: 'Blumenau',
        state: 'SC',
        concessionaria: 'Celesc',
        grupo: 'A',
        subgrupo: 'A3',
        consumoMedio: 1250,
        consumoMensal: [1200, 1150, 1220, 1250, 1300, 1380, 1420, 1400, 1350, 1280, 1230, 1180],
        tarifaEnergia: 0.79,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Leads do Google Ads
      {
        id: 'google-lead-1',
        name: 'Pedro Google',
        email: 'pedro.google@gmail.com',
        phone: '(11) 94444-1111',
        cpf: '111.222.333-06',
        cep: '04038-001',
        address: 'Rua Vergueiro, 1500',
        neighborhood: 'Vila Mariana',
        city: 'São Paulo',
        state: 'SP',
        concessionaria: 'Enel São Paulo',
        grupo: 'B',
        subgrupo: 'B1',
        consumoMedio: 380,
        consumoMensal: [360, 340, 370, 380, 400, 420, 440, 430, 410, 390, 370, 350],
        tarifaEnergia: 0.75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'google-lead-2',
        name: 'Fernanda Ads',
        email: 'fernanda.ads@hotmail.com',
        phone: '(21) 93333-2222',
        cpf: '222.333.444-07',
        cep: '22250-040',
        address: 'Rua Barata Ribeiro, 200',
        neighborhood: 'Copacabana',
        city: 'Rio de Janeiro',
        state: 'RJ',
        concessionaria: 'Light',
        grupo: 'B',
        subgrupo: 'B1',
        consumoMedio: 520,
        consumoMensal: [500, 480, 510, 520, 540, 580, 600, 590, 560, 530, 510, 490],
        tarifaEnergia: 0.82,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'google-lead-3',
        name: 'Lucas Campaign',
        email: 'lucas.campaign@outlook.com',
        phone: '(31) 92222-3333',
        cpf: '333.444.555-08',
        cep: '30130-010',
        address: 'Av. Afonso Pena, 800',
        neighborhood: 'Centro',
        city: 'Belo Horizonte',
        state: 'MG',
        concessionaria: 'Cemig',
        grupo: 'A',
        subgrupo: 'A4',
        consumoMedio: 750,
        consumoMensal: [720, 700, 740, 750, 780, 820, 850, 840, 800, 770, 740, 710],
        tarifaEnergia: 0.68,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Cria 2 módulos de demonstração
   */
  private createDemoModules(): SolarModule[] {
    return [
      {
        id: 'demo-module-1',
        model: 'ASTRONERGY 600W DEMO',
        potencia: 600,
        eficiencia: 22.5,
        area: 2.6,
        tensao: 41.2,
        corrente: 14.56,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-module-2',
        model: 'JINKO 550W DEMO',
        power: 550,
        eficiencia: 21.8,
        area: 2.5,
        tensao: 38.9,
        corrente: 14.14,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Cria 2 inversores de demonstração
   */
  private createDemoInverters(): Inverter[] {
    return [
      {
        id: 'demo-inverter-1',
        model: 'QI-2500-E DEMO',
        potencia: 2500,
        eficiencia: 97.5,
        tensaoEntrada: '200-1000V',
        tensaoSaida: '220V',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-inverter-2',
        model: 'FRONIUS 5000W DEMO',
        potencia: 5000,
        eficiencia: 98.2,
        tensaoEntrada: '150-1000V',
        tensaoSaida: '220V',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}