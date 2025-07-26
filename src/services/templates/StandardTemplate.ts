import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export class StandardTemplate extends BaseTemplate {
  id = 'standard';
  name = 'Padrão Profissional';
  description = 'Template clássico e profissional com todas as informações essenciais';
  category = 'standard' as const;

  generatePDF(data: ProposalData) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    this.addHeader();
    
    let currentY = this.addClientInfo(data.lead);
    currentY = this.addSystemInfo(data.kit, data.simulation, currentY);
    currentY = this.addFinancialTable(data.financial, data.simulation, currentY);
    
    currentY = this.checkPageBreak(currentY, 100);
    currentY = this.addBenefitsSection(currentY);
    currentY = this.addEconomyProjection(data.simulation, data.financial, currentY);
    
    this.addFooter();
    this.addPageNumber();
    
    return this.doc;
  }

  private addHeader() {
    // Background header
    this.doc.setFillColor(41, 128, 185);
    this.doc.rect(0, 0, this.pageWidth, 60, 'F');
    
    // Company logo/name
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('SolarCalc Pro', this.margin, 35);
    
    // Subtitle
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Proposta Comercial - Sistema Fotovoltaico', this.margin, 50);
    
    // Date
    const today = new Date().toLocaleDateString('pt-BR');
    this.doc.setFontSize(12);
    this.doc.text(`Data: ${today}`, this.pageWidth - 60, 35);
    
    // Proposal number
    const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
    this.doc.text(`Nº: ${proposalNumber}`, this.pageWidth - 60, 50);
  }

  private addClientInfo(lead: ProposalData['lead']): number {
    let yPos = 80;
    
    // Section header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('DADOS DO CLIENTE', this.margin + 5, yPos + 8);
    
    yPos += 25;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    // Client info in two columns
    const leftColumn = this.margin + 5;
    const rightColumn = this.pageWidth / 2 + 10;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Nome:', leftColumn, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(lead.name, leftColumn + 25, yPos);
    
    if (lead.email) {
      yPos += 10;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Email:', leftColumn, yPos);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(lead.email, leftColumn + 25, yPos);
    }
    
    if (lead.phone) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Telefone:', rightColumn, yPos - (lead.email ? 0 : 10));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(lead.phone, rightColumn + 35, yPos - (lead.email ? 0 : 10));
    }
    
    if (lead.address) {
      yPos += 10;
      const address = typeof lead.address === 'string' ? lead.address : 
        `${lead.address.street || ''}, ${lead.address.city || ''} - ${lead.address.state || ''}`;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Endereço:', leftColumn, yPos);
      this.doc.setFont('helvetica', 'normal');
      
      // Split long addresses
      const maxWidth = this.pageWidth - leftColumn - 40;
      const addressLines = this.doc.splitTextToSize(address, maxWidth);
      this.doc.text(addressLines, leftColumn + 35, yPos);
      yPos += (addressLines.length - 1) * 5;
    }
    
    if (lead.consumoMedio) {
      yPos += 10;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Consumo Médio:', leftColumn, yPos);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${this.formatNumber(lead.consumoMedio)} kWh/mês`, leftColumn + 50, yPos);
    }
    
    return yPos + 25;
  }

  private addSystemInfo(kit: ProposalData['kit'], simulation: ProposalData['simulation'], yPos: number): number {
    // Section header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('SISTEMA PROPOSTO', this.margin + 5, yPos + 8);
    
    yPos += 25;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const leftColumn = this.margin + 5;
    const rightColumn = this.pageWidth / 2 + 10;
    
    if (kit) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Kit Selecionado:', leftColumn, yPos);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(kit.nome, leftColumn + 50, yPos);
      
      yPos += 10;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Potência:', leftColumn, yPos);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${this.formatNumber(kit.potencia, 2)} kWp`, leftColumn + 30, yPos);
      
      if (kit.fabricante) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Fabricante:', rightColumn, yPos);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(kit.fabricante, rightColumn + 40, yPos);
      }
    } else {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Potência do Sistema:', leftColumn, yPos);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${this.formatNumber(simulation.potencia, 2)} kWp`, leftColumn + 60, yPos);
    }
    
    yPos += 15;
    
    // Performance data
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Geração Anual Estimada:', leftColumn, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${this.formatNumber(simulation.geracaoAnual)} kWh`, leftColumn + 70, yPos);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Economia Mensal:', rightColumn, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.formatCurrency(simulation.economia / 12), rightColumn + 50, yPos);
    
    return yPos + 25;
  }

  private addFinancialTable(financial: ProposalData['financial'], simulation: ProposalData['simulation'], yPos: number): number {
    // Section header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('ANÁLISE FINANCEIRA', this.margin + 5, yPos + 8);
    
    yPos += 25;
    
    const tableData = [
      ['Valor do Sistema', this.formatCurrency(financial.valorSistema)],
      ['Valor Final (com desconto/acréscimo)', this.formatCurrency(financial.valorFinal)],
      ['Economia Anual Estimada', this.formatCurrency(financial.economiaAnual)],
      ['Economia em 25 anos', this.formatCurrency(financial.economia25Anos)],
      ['Tempo de Retorno (Payback)', `${this.formatNumber(simulation.payback, 1)} anos`],
      ['Taxa Interna de Retorno (TIR)', `${this.formatNumber(simulation.tir, 1)}%`],
      ['Valor Presente Líquido (VPL)', this.formatCurrency(simulation.vpl)]
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Indicador Financeiro', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 11,
        cellPadding: 8
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 70, halign: 'right', textColor: [0, 100, 0] }
      },
      margin: { left: this.margin, right: this.margin },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });

    return (this.doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  private addBenefitsSection(yPos: number): number {
    yPos = this.checkPageBreak(yPos, 120);
    
    // Section header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('BENEFÍCIOS DA ENERGIA SOLAR', this.margin + 5, yPos + 8);
    
    yPos += 25;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const benefits = [
      { icon: '💰', text: 'Redução de até 95% na conta de energia elétrica' },
      { icon: '🏠', text: 'Valorização do imóvel em até 8%' },
      { icon: '🌱', text: 'Energia limpa e renovável - contribua com o meio ambiente' },
      { icon: '🔧', text: 'Baixa manutenção e vida útil superior a 25 anos' },
      { icon: '📈', text: 'Proteção contra aumentos na tarifa elétrica' },
      { icon: '✅', text: 'Retorno garantido do investimento' },
      { icon: '⚡', text: 'Sistema conectado à rede elétrica (on-grid)' },
      { icon: '🛡️', text: 'Garantia de fábrica e performance dos equipamentos' }
    ];

    const leftColumn = this.margin + 5;
    const rightColumn = this.pageWidth / 2 + 10;
    
    benefits.forEach((benefit, index) => {
      const column = index % 2 === 0 ? leftColumn : rightColumn;
      const row = Math.floor(index / 2);
      const currentYPos = yPos + (row * 12);
      
      this.doc.text(`${benefit.icon} ${benefit.text}`, column, currentYPos);
    });

    return yPos + (Math.ceil(benefits.length / 2) * 12) + 15;
  }

  private addEconomyProjection(simulation: ProposalData['simulation'], financial: ProposalData['financial'], yPos: number): number {
    yPos = this.checkPageBreak(yPos, 100);
    
    // Section header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('PROJEÇÃO DE ECONOMIA (25 ANOS)', this.margin + 5, yPos + 8);
    
    yPos += 30;
    
    // Create projection table
    const years = [1, 5, 10, 15, 20, 25];
    const economiaAnual = financial.economiaAnual;
    const tableData = years.map(year => {
      const economiaAcumulada = economiaAnual * year * Math.pow(1.062, year); // 6.2% annual increase
      return [
        `Ano ${year}`,
        this.formatCurrency(economiaAcumulada),
        `${((economiaAcumulada / financial.valorFinal) * 100).toFixed(0)}%`
      ];
    });

    autoTable(this.doc, {
      startY: yPos,
      head: [['Período', 'Economia Acumulada', '% do Investimento']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'center' },
        1: { cellWidth: 60, halign: 'right', textColor: [0, 100, 0] },
        2: { cellWidth: 50, halign: 'center', textColor: [0, 100, 0] }
      },
      margin: { left: this.margin, right: this.margin }
    });

    return (this.doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  private addFooter() {
    const footerY = this.pageHeight - 40;
    
    // Footer background
    this.doc.setFillColor(41, 128, 185);
    this.doc.rect(0, footerY - 5, this.pageWidth, 50, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    
    this.doc.text('Esta proposta é válida por 30 dias a partir da data de emissão.', this.margin, footerY + 5);
    this.doc.text('SolarCalc Pro - Soluções Inteligentes em Energia Solar', this.margin, footerY + 15);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text('Dúvidas? Entre em contato conosco para mais informações.', this.margin, footerY + 25);
  }
}