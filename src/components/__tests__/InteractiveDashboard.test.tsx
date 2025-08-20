/**
 * Testes unitários para InteractiveDashboard
 * 
 * Testa visualizações de dados, interações do usuário,
 * exportação de dados e responsividade
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractiveDashboard } from '../InteractiveDashboard';
import { CalculadoraSolarService } from '../../services/CalculadoraSolarService';
import { useNotifications } from '../../hooks/useNotifications';

// Mocks
jest.mock('../../services/CalculadoraSolarService');
jest.mock('../../hooks/useNotifications');
interface MockChartProps {
  children?: React.ReactNode;
}

jest.mock('recharts', () => ({
  LineChart: ({ children }: MockChartProps) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: MockChartProps) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: MockChartProps) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: MockChartProps) => <div data-testid="responsive-container">{children}</div>
}));

const mockCalculadoraService = CalculadoraSolarService as jest.Mocked<typeof CalculadoraSolarService>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('InteractiveDashboard', () => {
  let mockCalculadoraInstance: jest.Mocked<CalculadoraSolarService>;
  let mockNotifications: {
    addNotification: jest.Mock;
    notifications: unknown[];
    markAsRead: jest.Mock;
    clearAll: jest.Mock;
  };

  const mockResultadoFinanceiro = {
    vpl: 15000,
    tir: 0.15,
    payback_simples_anos: 8.5,
    payback_descontado_anos: 10.2,
    economia_anual: 6000,
    fluxo_caixa: [-50000, 6000, 6240, 6489, 6749, 7020, 7301, 7593, 7897, 8213],
    economia_mensal: [500, 520, 541, 562, 585, 608, 632, 657, 683, 710],
    geracao_mensal: [1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450],
    consumo_mensal: [800, 800, 800, 800, 800, 800, 800, 800, 800, 800]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do CalculadoraSolarService
    mockCalculadoraInstance = {
      calcularEconomiaFluxoCaixa: jest.fn().mockResolvedValue(mockResultadoFinanceiro)
    } as jest.Mocked<CalculadoraSolarService>;
    
    mockCalculadoraService.getInstance = jest.fn().mockReturnValue(mockCalculadoraInstance);

    // Mock do useNotifications
    mockNotifications = {
      addNotification: jest.fn(),
      notifications: [],
      markAsRead: jest.fn(),
      clearAll: jest.fn()
    };
    
    mockUseNotifications.mockReturnValue(mockNotifications);

    // Mock do window.URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock do document.createElement para download
    const mockAnchor: Partial<HTMLAnchorElement> = {
      href: '',
      download: '',
      click: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as HTMLAnchorElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Renderização Inicial', () => {
    test('deve renderizar componente principal', () => {
      render(<InteractiveDashboard />);
      
      expect(screen.getByText('Dashboard Interativo')).toBeInTheDocument();
      expect(screen.getByText('Análise Financeira do Sistema Fotovoltaico')).toBeInTheDocument();
    });

    test('deve renderizar métricas financeiras', () => {
      render(<InteractiveDashboard />);
      
      expect(screen.getByText('VPL (Valor Presente Líquido)')).toBeInTheDocument();
      expect(screen.getByText('TIR (Taxa Interna de Retorno)')).toBeInTheDocument();
      expect(screen.getByText('Payback Simples')).toBeInTheDocument();
      expect(screen.getByText('Economia Anual')).toBeInTheDocument();
    });

    test('deve renderizar controles de período', () => {
      render(<InteractiveDashboard />);
      
      expect(screen.getByText('Período de Análise')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Anos padrão
    });

    test('deve renderizar seletor de tipo de gráfico', () => {
      render(<InteractiveDashboard />);
      
      expect(screen.getByText('Tipo de Visualização')).toBeInTheDocument();
    });

    test('deve renderizar botões de ação', () => {
      render(<InteractiveDashboard />);
      
      expect(screen.getByText('Exportar Dados')).toBeInTheDocument();
      expect(screen.getByText('Atualizar Projeções')).toBeInTheDocument();
    });
  });

  describe('Métricas Financeiras', () => {
    test('deve exibir valores formatados corretamente', async () => {
      render(<InteractiveDashboard />);
      
      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.getByText('R$ 15.000')).toBeInTheDocument(); // VPL
        expect(screen.getByText('15,00%')).toBeInTheDocument(); // TIR
        expect(screen.getByText('8,5 anos')).toBeInTheDocument(); // Payback
        expect(screen.getByText('R$ 6.000')).toBeInTheDocument(); // Economia anual
      });
    });

    test('deve exibir indicadores visuais para métricas', async () => {
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        // VPL positivo deve ter indicador verde
        const vplCard = screen.getByText('R$ 15.000').closest('[data-testid="metric-card"]');
        expect(vplCard).toHaveClass('border-green-200');
        
        // TIR deve ter indicador de performance
        const tirCard = screen.getByText('15,00%').closest('[data-testid="metric-card"]');
        expect(tirCard).toHaveClass('border-blue-200');
      });
    });

    test('deve lidar com valores negativos', async () => {
      const resultadoNegativo = {
        ...mockResultadoFinanceiro,
        vpl: -5000,
        tir: 0.05
      };
      
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa.mockResolvedValue(resultadoNegativo);
      
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('-R$ 5.000')).toBeInTheDocument();
        
        // VPL negativo deve ter indicador vermelho
        const vplCard = screen.getByText('-R$ 5.000').closest('[data-testid="metric-card"]');
        expect(vplCard).toHaveClass('border-red-200');
      });
    });
  });

  describe('Controles de Período', () => {
    test('deve alterar período de análise', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const periodoInput = screen.getByDisplayValue('10');
      
      await user.clear(periodoInput);
      await user.type(periodoInput, '15');
      
      expect(periodoInput).toHaveValue(15);
    });

    test('deve validar período mínimo e máximo', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const periodoInput = screen.getByDisplayValue('10');
      
      // Testar valor muito baixo
      await user.clear(periodoInput);
      await user.type(periodoInput, '0');
      
      expect(periodoInput).toHaveValue(1); // Deve ser ajustado para mínimo
      
      // Testar valor muito alto
      await user.clear(periodoInput);
      await user.type(periodoInput, '50');
      
      expect(periodoInput).toHaveValue(30); // Deve ser ajustado para máximo
    });

    test('deve recalcular projeções ao alterar período', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const periodoInput = screen.getByDisplayValue('10');
      
      await user.clear(periodoInput);
      await user.type(periodoInput, '20');
      
      // Deve triggerar novo cálculo
      await waitFor(() => {
        expect(mockCalculadoraInstance.calcularEconomiaFluxoCaixa).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Visualizações de Gráficos', () => {
    test('deve renderizar gráfico de fluxo de caixa por padrão', async () => {
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByText('Fluxo de Caixa Projetado')).toBeInTheDocument();
      });
    });

    test('deve alternar entre tipos de gráfico', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      // Selecionar gráfico de barras
      const tipoSelect = screen.getByRole('combobox');
      await user.selectOptions(tipoSelect, 'distribuicao');
      
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByText('Distribuição de Energia')).toBeInTheDocument();
      });
    });

    test('deve renderizar gráfico de comparação mensal', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const tipoSelect = screen.getByRole('combobox');
      await user.selectOptions(tipoSelect, 'comparacao');
      
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByText('Geração vs. Consumo Mensal')).toBeInTheDocument();
      });
    });

    test('deve incluir componentes de gráfico necessários', async () => {
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        expect(screen.getByTestId('y-axis')).toBeInTheDocument();
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('legend')).toBeInTheDocument();
      });
    });
  });

  describe('Exportação de Dados', () => {
    test('deve exportar dados em formato CSV', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const exportButton = screen.getByText('Exportar Dados');
      await user.click(exportButton);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    test('deve incluir dados financeiros na exportação', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const exportButton = screen.getByText('Exportar Dados');
      await user.click(exportButton);
      
      // Verificar se Blob foi criado com dados corretos
      const blobCall = (global.URL.createObjectURL as jest.Mock).mock.calls[0][0];
      expect(blobCall.type).toBe('text/csv');
    });

    test('deve gerar nome de arquivo com timestamp', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const exportButton = screen.getByText('Exportar Dados');
      await user.click(exportButton);
      
      const mockAnchor = (document.createElement as jest.Mock).mock.results[0].value;
      expect(mockAnchor.download).toMatch(/dashboard_financeiro_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/);
    });

    test('deve limpar URL do blob após download', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const exportButton = screen.getByText('Exportar Dados');
      await user.click(exportButton);
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });
  });

  describe('Atualização de Projeções', () => {
    test('deve recalcular projeções ao clicar em atualizar', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const updateButton = screen.getByText('Atualizar Projeções');
      await user.click(updateButton);
      
      expect(mockCalculadoraInstance.calcularEconomiaFluxoCaixa).toHaveBeenCalledTimes(2);
    });

    test('deve exibir indicador de carregamento durante atualização', async () => {
      const user = userEvent.setup();
      
      // Mock para simular delay
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResultadoFinanceiro), 100))
      );
      
      render(<InteractiveDashboard />);
      
      const updateButton = screen.getByText('Atualizar Projeções');
      await user.click(updateButton);
      
      expect(screen.getByText('Atualizando...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Atualizando...')).not.toBeInTheDocument();
      });
    });

    test('deve notificar sucesso após atualização', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      const updateButton = screen.getByText('Atualizar Projeções');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockNotifications.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Projeções Atualizadas',
            message: 'Os dados financeiros foram recalculados com sucesso.'
          })
        );
      });
    });
  });

  describe('Tratamento de Erros', () => {
    test('deve lidar com erro no cálculo financeiro', async () => {
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa.mockRejectedValue(
        new Error('Erro no cálculo')
      );
      
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(mockNotifications.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Erro no Cálculo',
            message: expect.stringContaining('Erro no cálculo')
          })
        );
      });
    });

    test('deve exibir valores padrão quando há erro', async () => {
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa.mockRejectedValue(
        new Error('Erro no cálculo')
      );
      
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('R$ 0')).toBeInTheDocument(); // VPL padrão
        expect(screen.getByText('0,00%')).toBeInTheDocument(); // TIR padrão
      });
    });

    test('deve lidar com dados incompletos', async () => {
      const dadosIncompletos = {
        vpl: 15000,
        tir: 0.15
        // Faltando outros campos
      };
      
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa.mockResolvedValue(dadosIncompletos);
      
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('R$ 15.000')).toBeInTheDocument();
        expect(screen.getByText('15,00%')).toBeInTheDocument();
        // Campos faltantes devem ter valores padrão
        expect(screen.getByText('0 anos')).toBeInTheDocument();
      });
    });
  });

  describe('Responsividade', () => {
    test('deve adaptar layout para telas pequenas', () => {
      // Mock de tela pequena
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      render(<InteractiveDashboard />);
      
      // Verificar que o layout se adapta
      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    test('deve manter funcionalidade em dispositivos móveis', async () => {
      const user = userEvent.setup();
      
      // Simular dispositivo móvel
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      render(<InteractiveDashboard />);
      
      // Funcionalidades devem continuar funcionando
      const exportButton = screen.getByText('Exportar Dados');
      await user.click(exportButton);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Acessibilidade', () => {
    test('deve ter labels apropriados para controles', () => {
      render(<InteractiveDashboard />);
      
      expect(screen.getByLabelText('Período de análise em anos')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de visualização')).toBeInTheDocument();
    });

    test('deve ter estrutura semântica correta', () => {
      render(<InteractiveDashboard />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(2); // Exportar e Atualizar
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Seletor de gráfico
    });

    test('deve ter texto alternativo para gráficos', async () => {
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        const chart = screen.getByTestId('line-chart');
        expect(chart).toHaveAttribute('aria-label', 'Gráfico de fluxo de caixa projetado');
      });
    });

    test('deve ser navegável por teclado', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      // Testar navegação por Tab
      await user.tab();
      expect(screen.getByDisplayValue('10')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('combobox')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Exportar Dados')).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('deve renderizar rapidamente', () => {
      const startTime = performance.now();
      render(<InteractiveDashboard />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Menos de 100ms
    });

    test('deve evitar re-renderizações desnecessárias', async () => {
      const user = userEvent.setup();
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <InteractiveDashboard />;
      };
      
      render(<TestComponent />);
      
      // Interação que não deve causar re-render completo
      const periodoInput = screen.getByDisplayValue('10');
      await user.type(periodoInput, '5');
      
      // Deve ter renderizado apenas uma vez inicialmente
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    test('deve lidar com grandes volumes de dados', async () => {
      const dadosGrandes = {
        ...mockResultadoFinanceiro,
        fluxo_caixa: Array.from({ length: 300 }, (_, i) => i * 1000),
        economia_mensal: Array.from({ length: 300 }, (_, i) => i * 100),
        geracao_mensal: Array.from({ length: 300 }, (_, i) => i * 150)
      };
      
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa.mockResolvedValue(dadosGrandes);
      
      const startTime = performance.now();
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
    });
  });

  describe('Integração', () => {
    test('deve integrar corretamente com CalculadoraSolarService', async () => {
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(mockCalculadoraService.getInstance).toHaveBeenCalled();
        expect(mockCalculadoraInstance.calcularEconomiaFluxoCaixa).toHaveBeenCalled();
      });
    });

    test('deve integrar corretamente com sistema de notificações', async () => {
      render(<InteractiveDashboard />);
      
      await waitFor(() => {
        expect(mockUseNotifications).toHaveBeenCalled();
      });
    });

    test('deve manter estado consistente entre componentes', async () => {
      const user = userEvent.setup();
      render(<InteractiveDashboard />);
      
      // Alterar período
      const periodoInput = screen.getByDisplayValue('10');
      await user.clear(periodoInput);
      await user.type(periodoInput, '15');
      
      // Atualizar projeções
      const updateButton = screen.getByText('Atualizar Projeções');
      await user.click(updateButton);
      
      // Estado deve ser consistente
      expect(periodoInput).toHaveValue(15);
      await waitFor(() => {
        expect(mockCalculadoraInstance.calcularEconomiaFluxoCaixa).toHaveBeenCalledWith(
          expect.objectContaining({
            periodo_analise_anos: 15
          })
        );
      });
    });
  });
});