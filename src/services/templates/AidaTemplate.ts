import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export class AidaTemplate extends BaseTemplate {
  id = 'aida';
  name = 'AIDA Minimalista';
  description = 'Template baseado na metodologia AIDA (Atenção, Interesse, Desejo, Ação) com design clean';
  category = 'minimal' as const;

  generatePDF(data: ProposalData) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    // AIDA Structure
    this.addAttentionSection(data);
    this.addInterestSection(data);
    this.addDesireSection(data);
    this.addActionSection(data);
    
    this.addPageNumber();
    
    return this.doc;
  }

  // ATTENTION - Capture attention with a strong headline
  private addAttentionSection(data: ProposalData) {
    // Clean header with focus on savings
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Main headline - Attention grabber
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 53, 69); // Red for attention
    
    const monthlySavings = Math.round(data.simulation.economia / 12);
    this.doc.text(`ECONOMIZE R$ ${this.formatNumber(monthlySavings)}`, this.pageWidth / 2, 50, { align: 'center' });
    
    this.doc.setFontSize(24);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('POR MÊS COM ENERGIA SOLAR', this.pageWidth / 2, 70, { align: 'center' });
    
    // Subheadline
    this.doc.setFontSize(14);
    this.doc.setTextColor(108, 117, 125);
    this.doc.text(`Olá ${data.lead.name}, esta é sua proposta personalizada`, this.pageWidth / 2, 90, { align: 'center' });
    
    // Simple line separator
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 110, this.pageWidth - this.margin, 110);
  }

  // INTEREST - Build interest with relevant information
  private addInterestSection(data: ProposalData) {
    let yPos = 130;
    
    // Section title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 123, 255); // Blue for trust
    this.doc.text('POR QUE ENERGIA SOLAR É PERFEITA PARA VOCÊ?', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 25;
    
    // Interest points in clean layout
    const interestPoints = [
      {
        title: 'Seu Perfil de Consumo',
        content: `Consumo médio: ${data.lead.consumoMedio || 'N/A'} kWh/mês\nEconomia estimada: ${this.formatCurrency(data.simulation.economia / 12)}/mês`
      },
      {
        title: 'Sistema Dimensionado',
        content: `Potência: ${this.formatNumber(data.simulation.potencia, 2)} kWp\nGeração anual: ${this.formatNumber(data.simulation.geracaoAnual)} kWh`
      },
      {
        title: 'Retorno Garantido',
        content: `Payback: ${this.formatNumber(data.simulation.payback, 1)} anos\nTIR: ${this.formatNumber(data.simulation.tir, 1)}%`
      }
    ];
    
    const boxWidth = (this.pageWidth - (this.margin * 2) - 20) / 3;
    
    interestPoints.forEach((point, index) => {
      const xPos = this.margin + (index * (boxWidth + 10));
      
      // Clean box design
      this.doc.setFillColor(248, 249, 250);
      this.doc.rect(xPos, yPos - 5, boxWidth, 50, 'F');
      
      this.doc.setDrawColor(220, 220, 220);
      this.doc.rect(xPos, yPos - 5, boxWidth, 50);
      
      // Title
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(point.title, xPos + 5, yPos + 8);
      
      // Content
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(73, 80, 87);
      const lines = point.content.split('\\n');
      lines.forEach((line, lineIndex) => {
        this.doc.text(line, xPos + 5, yPos + 20 + (lineIndex * 8));
      });
    });
  }

  // DESIRE - Create desire with benefits and social proof
  private addDesireSection(data: ProposalData) {
    this.doc.addPage();
    let yPos = 40;
    
    // Section title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(40, 167, 69); // Green for growth/money
    this.doc.text('IMAGINE SUA VIDA SEM CONTA DE LUZ ALTA', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 30;
    
    // Desire-building content
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const desireText = [
      'Com seu sistema de energia solar, você terá:',
      '',
      '• Liberdade financeira: Sem mais surpresas na conta de luz',
      '• Tranquilidade: Energia limpa e sustentável para sua família',
      '• Valorização: Seu imóvel vale mais com energia solar',
      '• Independência: Menos dependência das concessionárias',
      '• Orgulho: Contribuindo para um planeta melhor'
    ];
    
    desireText.forEach((line, index) => {
      if (line.startsWith('•')) {
        this.doc.setTextColor(40, 167, 69);
        this.doc.setFont('helvetica', 'bold');
      } else {
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFont('helvetica', 'normal');
      }
      this.doc.text(line, this.margin + 10, yPos + (index * 12));
    });
    
    yPos += desireText.length * 12 + 20;
    
    // Financial projection - the desire amplifier
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 53, 69);
    this.doc.text('PROJEÇÃO DE ECONOMIA EM 25 ANOS', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    
    // Simple but impactful numbers
    const projectionData = [
      ['5 anos', this.formatCurrency(data.financial.economiaAnual * 5 * 1.31)],
      ['10 anos', this.formatCurrency(data.financial.economiaAnual * 10 * 1.82)],
      ['25 anos', this.formatCurrency(data.financial.economia25Anos)]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Período', 'Economia Total']],
      body: projectionData,
      theme: 'plain',
      headStyles: {
        fillColor: [40, 167, 69],
        textColor: 255,
        fontSize: 14,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 16,
        cellPadding: 12,
        halign: 'center',
        fontStyle: 'bold'
      },
      columnStyles: {
        1: { textColor: [40, 167, 69] }
      },
      margin: { left: this.margin + 20, right: this.margin + 20 }
    });
  }

  // ACTION - Clear call to action
  private addActionSection(data: ProposalData) {
    let yPos = (this.doc as any).lastAutoTable.finalY + 40;
    
    yPos = this.checkPageBreak(yPos, 150);
    
    // Action section with urgency
    this.doc.setFillColor(220, 53, 69);
    this.doc.rect(this.margin, yPos - 10, this.pageWidth - (this.margin * 2), 80, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('GARANTE JÁ SUA ECONOMIA!', this.pageWidth / 2, yPos + 15, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Esta proposta é válida por apenas 30 dias', this.pageWidth / 2, yPos + 35, { align: 'center' });
    
    // Investment details
    yPos += 60;
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 60, 'F');
    
    this.doc.setDrawColor(220, 220, 220);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 60);
    
    yPos += 20;
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('INVESTIMENTO TOTAL', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    this.doc.setFontSize(24);
    this.doc.setTextColor(40, 167, 69);
    this.doc.text(this.formatCurrency(data.financial.valorFinal), this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    this.doc.setFontSize(12);
    this.doc.setTextColor(108, 117, 125);
    this.doc.text('Parcelamento disponível | Financiamento próprio', this.pageWidth / 2, yPos, { align: 'center' });
    
    // Contact info
    yPos += 30;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 123, 255);
    this.doc.text('ENTRE EM CONTATO AGORA:', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('📞 (11) 99999-9999 | 📧 contato@solarcalcpro.com', this.pageWidth / 2, yPos, { align: 'center' });
    
    // Footer
    const footerY = this.pageHeight - 20;
    this.doc.setFontSize(8);
    this.doc.setTextColor(108, 117, 125);
    this.doc.text('SolarCalc Pro - Transformando energia em economia', this.pageWidth / 2, footerY, { align: 'center' });
  }
}