import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export abstract class ProfessionalA4Template extends BaseTemplate {
  id = 'professional-a4';
  name = 'Profissional A4';
  description = 'Template profissional otimizado para formato A4 com design moderno e limpo';
  category = 'premium' as const;

  private primaryColor = '#2563eb'; // Blue-600
  private secondaryColor = '#1e40af'; // Blue-700
  private accentColor = '#f59e0b'; // Amber-500
  private textColor = '#1f2937'; // Gray-800
  private lightGray = '#f3f4f6'; // Gray-100

  generatePDF(data: ProposalData) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;

    // Página 1: Capa
    this.addCoverPage(data);
    
    // Página 2: Benefícios e Funcionamento
    this.doc.addPage();
    this.addBenefitsPage();
    
    // Página 3: Sobre a Empresa
    this.doc.addPage();
    this.addCompanyPage();
    
    // Página 4: Análise de Consumo
    this.doc.addPage();
    this.addConsumptionAnalysisPage(data);
    
    // Página 5: Análise Econômica
    this.doc.addPage();
    this.addEconomicAnalysisPage(data);
    
    // Adicionar numeração de páginas
    this.addPageNumbers();
    
    return this.doc;
  }

  private addCoverPage(data: ProposalData) {
    // Background gradient effect
    this.doc.setFillColor(37, 99, 235); // Blue-600
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    
    // Gradient effect simulation
    this.doc.setFillColor(30, 64, 175); // Blue-700
    this.doc.rect(0, 60, this.pageWidth, 20, 'F');

    // Logo placeholder (top-left)
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(this.margin, 15, 40, 20, 'F');
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('LOGO', this.margin + 18, 27);

    // Main title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('PRÉ-PROPOSTA COMERCIAL', this.pageWidth / 2, 100, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('SISTEMA FOTOVOLTAICO CONECTADO À REDE', this.pageWidth / 2, 115, { align: 'center' });

    // Decorative line
    this.doc.setDrawColor(245, 158, 11); // Amber-500
    this.doc.setLineWidth(2);
    this.doc.line(this.pageWidth / 2 - 40, 125, this.pageWidth / 2 + 40, 125);

    // Client information box
    this.doc.setFillColor(248, 250, 252); // Gray-50
    this.doc.rect(this.margin, 150, 80, 80, 'F');
    this.doc.setDrawColor(226, 232, 240); // Gray-300
    this.doc.rect(this.margin, 150, 80, 80, 'S');

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('DADOS DO CLIENTE', this.margin + 5, 165);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    
    let yPos = 175;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Cliente:', this.margin + 5, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.lead.name, this.margin + 5, yPos + 5);
    
    yPos += 15;
    if (data.lead.address) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Endereço:', this.margin + 5, yPos);
      this.doc.setFont('helvetica', 'normal');
      const address = typeof data.lead.address === 'string' ? data.lead.address : 
        `${data.lead.address.street || ''}, ${data.lead.address.city || ''}`;
      const addressLines = this.doc.splitTextToSize(address, 70);
      this.doc.text(addressLines, this.margin + 5, yPos + 5);
      yPos += 5 + (addressLines.length * 4);
    }
    
    if (data.lead.phone) {
      yPos += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Telefone:', this.margin + 5, yPos);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(data.lead.phone, this.margin + 5, yPos + 5);
    }

    // Proposal information box
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.pageWidth - this.margin - 80, 150, 80, 80, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(this.pageWidth - this.margin - 80, 150, 80, 80, 'S');

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('PROPOSTA', this.pageWidth - this.margin - 75, 165);

    this.doc.setFontSize(10);
    this.doc.setTextColor(31, 41, 55);
    
    yPos = 175;
    const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Número:', this.pageWidth - this.margin - 75, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(proposalNumber, this.pageWidth - this.margin - 75, yPos + 5);
    
    yPos += 15;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Data:', this.pageWidth - this.margin - 75, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(new Date().toLocaleDateString('pt-BR'), this.pageWidth - this.margin - 75, yPos + 5);
    
    yPos += 15;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Validade:', this.pageWidth - this.margin - 75, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('30 dias', this.pageWidth - this.margin - 75, yPos + 5);

    // Footer with company info
    this.doc.setFillColor(31, 41, 55); // Gray-800
    this.doc.rect(0, this.pageHeight - 30, this.pageWidth, 30, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('SolarCalc Pro - Soluções em Energia Solar', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
    this.doc.text('contato@solarcalcpro.com.br | (11) 9999-9999 | www.solarcalcpro.com.br', this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
  }

  private addBenefitsPage() {
    this.addPageHeader('BENEFÍCIOS DA ENERGIA SOLAR');
    
    let yPos = 60;
    
    // Por que ter Energia Solar?
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Por que ter Energia Solar?', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    
    const benefits = [
      'Redução significativa na fatura de energia',
      'Mais conforto e qualidade de vida',
      'Possibilidade de reinvestir na empresa',
      'Proteção contra a inflação energética',
      'Investimento com excelente custo/benefício',
      'Baixíssima manutenção',
      'Valorização do imóvel',
      'Energia limpa - redução de CO₂',
      'Independência energética',
      'Tecnologia comprovada e durável'
    ];
    
    benefits.forEach((benefit, index) => {
      this.doc.setFillColor(37, 99, 235);
      this.doc.circle(this.margin + 3, yPos - 2, 2, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text((index + 1).toString(), this.margin + 3, yPos, { align: 'center' });
      
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(benefit, this.margin + 10, yPos);
      yPos += 12;
    });
    
    // Como Funciona?
    yPos += 10;
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Como Funciona?', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    
    const howItWorks = [
      'Na Geração Distribuída (GD), a energia gerada pelo Sistema',
      'Fotovoltaico pode ser consumida instantaneamente pelos',
      'equipamentos da Unidade Consumidora e seu excedente',
      'injetado na rede da concessionária local.',
      '',
      '• A rede funciona como uma "grande bateria"',
      '• Excedente vira créditos válidos por 60 meses',
      '• Sistema funciona mesmo em dias nublados',
      '• Monitoramento em tempo real via aplicativo'
    ];
    
    howItWorks.forEach(line => {
      if (line.trim()) {
        this.doc.text(line, this.margin, yPos);
      }
      yPos += 6;
    });
  }

  private addCompanyPage() {
    this.doc.addPage();
    this.addPageHeader('SOBRE A EMPRESA');
    
    const yPos = 60;   
    // 4 Pilares da empresa
    const pillars = [
      {
        title: 'EXPERIÊNCIA',
        description: 'Mais de 5 anos no mercado de energia solar com centenas de projetos executados'
      },
      {
        title: 'QUALIDADE',
        description: 'Equipamentos de primeira linha com certificações internacionais e garantia estendida'
      },
      {
        title: 'SUPORTE',
        description: 'Acompanhamento completo desde o projeto até a instalação e pós-venda'
      },
      {
        title: 'INOVAÇÃO',
        description: 'Tecnologia de ponta e soluções personalizadas para cada necessidade'
      }
    ];
    
    pillars.forEach((pillar, index) => {
      const xPos = this.margin + (index % 2) * 85;
      const yOffset = Math.floor(index / 2) * 60;
      
      // Pillar box
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(xPos, yPos + yOffset, 80, 50, 'F');
      this.doc.setDrawColor(37, 99, 235);
      this.doc.setLineWidth(2);
      this.doc.rect(xPos, yPos + yOffset, 80, 50, 'S');
      
      // Title
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(37, 99, 235);
      this.doc.text(pillar.title, xPos + 40, yPos + yOffset + 15, { align: 'center' });
      
      // Description
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);
      const descLines = this.doc.splitTextToSize(pillar.description, 70);
      this.doc.text(descLines, xPos + 40, yPos + yOffset + 25, { align: 'center' });
    });
  }

  private addConsumptionAnalysisPage(data: ProposalData) {
    this.addPageHeader('ANÁLISE DE CONSUMO');
    
    let yPos = 60;
    
    // Dados técnicos do sistema
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Dados Técnicos do Sistema', this.margin, yPos);
    
    yPos += 20;
    
    const technicalData = [
      ['Consumo Médio Mensal', `${this.formatNumber(data.lead.consumoMedio || 780)} kWh`],
      ['Potência do Sistema', `${this.formatNumber(data.simulation.potencia, 2)} kWp`],
      ['Geração Mensal Estimada', `${this.formatNumber(data.simulation.geracaoAnual / 12)} kWh`],
      ['Geração Anual Estimada', `${this.formatNumber(data.simulation.geracaoAnual)} kWh`],
      ['Área Aproximada Necessária', '45 m²'],
      ['Número de Módulos', '20 unidades']
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Especificação', 'Valor']],
      body: technicalData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [31, 41, 55]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: this.margin, right: this.margin }
    });
  }

  private addEconomicAnalysisPage(data: ProposalData) {
    this.addPageHeader('ANÁLISE ECONÔMICA');
    
    let yPos = 60;
    
    // Resumo financeiro
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Resumo do Investimento', this.margin, yPos);
    
    yPos += 20;
    
    const financialData = [
      ['Valor do Investimento', this.formatCurrency(data.financial.valorSistema)],
      ['Economia Mensal Estimada', this.formatCurrency(data.simulation.economia / 12)],
      ['Economia Anual Estimada', this.formatCurrency(data.simulation.economia)],
      ['Payback Simples', `${data.simulation.payback} anos`],
      ['TIR (Taxa Interna de Retorno)', `${data.simulation.tir}% a.a.`],
      ['VPL (Valor Presente Líquido)', this.formatCurrency(data.simulation.vpl)]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Indicador', 'Valor']],
      body: financialData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [31, 41, 55]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    // Benefícios ambientais
    yPos = ((this.doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(34, 197, 94); // Green-500
    this.doc.text('Benefícios Ambientais', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    
    const environmentalBenefits = [
      `• CO₂ evitado por ano: ${this.formatNumber(data.simulation.geracaoAnual * 0.0817)} kg`,
      `• Equivalente a plantar ${Math.round(data.simulation.geracaoAnual * 0.0817 / 22)} árvores por ano`,
      `• Redução de ${this.formatNumber(data.simulation.geracaoAnual * 0.0817 * 25 / 1000, 1)} toneladas de CO₂ em 25 anos`
    ];
    
    environmentalBenefits.forEach(benefit => {
      this.doc.text(benefit, this.margin, yPos);
      yPos += 8;
    });
  }

  private addPageHeader(title: string) {
    // Header background
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(title, this.pageWidth / 2, 25, { align: 'center' });
    
    // Decorative line
    this.doc.setDrawColor(245, 158, 11);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 45, this.pageWidth - this.margin, 45);
  }

  private addPageNumbers() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 10, { align: 'right' });
    }
  }

  private formatNumber(value: number, decimals: number = 0): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}