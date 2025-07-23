import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { proposalTemplateManager } from './proposalTemplateManager';
import { ProposalData } from './proposalTemplates';

export class ProposalPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private defaultTemplateId: string = 'standard';

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  /**
   * Set the default template to use
   */
  public setDefaultTemplate(templateId: string) {
    this.defaultTemplateId = templateId;
  }

  /**
   * Get available templates
   */
  public getAvailableTemplates() {
    return proposalTemplateManager.getAvailableTemplates();
  }

  /**
   * Get template recommendations based on data
   */
  public getRecommendedTemplates(data: ProposalData) {
    return proposalTemplateManager.getRecommendedTemplates(data);
  }

  /**
   * Generate PDF using specific template
   */
  public generatePDFWithTemplate(templateId: string, data: ProposalData): jsPDF | null {
    return proposalTemplateManager.generatePDF(templateId, data);
  }

  /**
   * Download PDF using specific template
   */
  public downloadPDFWithTemplate(templateId: string, data: ProposalData, filename?: string): boolean {
    return proposalTemplateManager.downloadPDF(templateId, data, filename);
  }

  /**
   * Get PDF blob using specific template
   */
  public getPDFBlobWithTemplate(templateId: string, data: ProposalData): Blob | null {
    return proposalTemplateManager.getPDFBlob(templateId, data);
  }

  /**
   * Preview PDF using specific template
   */
  public async previewPDFWithTemplate(templateId: string, data: ProposalData): Promise<string | null> {
    return proposalTemplateManager.previewPDF(templateId, data);
  }

  private addHeader() {
    // Logo/Company name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185); // Primary blue color
    this.doc.text('SolarCalc Pro', this.margin, 30);
    
    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Proposta Comercial - Sistema Fotovoltaico', this.margin, 40);
    
    // Date
    const today = new Date().toLocaleDateString('pt-BR');
    this.doc.text(`Data: ${today}`, this.pageWidth - 60, 30);
    
    // Line separator
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, 50, this.pageWidth - this.margin, 50);
  }

  private addClientInfo(lead: ProposalData['lead']) {
    let yPos = 70;
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Dados do Cliente', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Nome: ${lead.name}`, this.margin, yPos);
    yPos += 8;
    
    if (lead.email) {
      this.doc.text(`Email: ${lead.email}`, this.margin, yPos);
      yPos += 8;
    }
    
    if (lead.phone) {
      this.doc.text(`Telefone: ${lead.phone}`, this.margin, yPos);
      yPos += 8;
    }
    
    if (lead.address) {
      const address = typeof lead.address === 'string' ? lead.address : 
        `${lead.address.street || ''}, ${lead.address.city || ''} - ${lead.address.state || ''}`;
      this.doc.text(`Endereço: ${address}`, this.margin, yPos);
      yPos += 8;
    }
    
    if (lead.consumoMedio) {
      this.doc.text(`Consumo Médio: ${lead.consumoMedio} kWh/mês`, this.margin, yPos);
    }
    
    return yPos + 20;
  }

  private addSystemInfo(kit: ProposalData['kit'], simulation: ProposalData['simulation'], yPos: number) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Sistema Proposto', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    if (kit) {
      this.doc.text(`Kit: ${kit.nome}`, this.margin, yPos);
      yPos += 8;
      this.doc.text(`Potência: ${kit.potencia} kWp`, this.margin, yPos);
      yPos += 8;
      if (kit.fabricante) {
        this.doc.text(`Fabricante: ${kit.fabricante}`, this.margin, yPos);
        yPos += 8;
      }
    } else {
      this.doc.text(`Potência: ${simulation.potencia} kWp`, this.margin, yPos);
      yPos += 8;
    }
    
    this.doc.text(`Geração Anual Estimada: ${simulation.geracaoAnual.toLocaleString()} kWh`, this.margin, yPos);
    yPos += 8;
    this.doc.text(`Economia Mensal Estimada: R$ ${(simulation.economia / 12).toLocaleString()}`, this.margin, yPos);
    
    return yPos + 20;
  }

  private addFinancialTable(financial: ProposalData['financial'], simulation: ProposalData['simulation'], yPos: number) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Análise Financeira', this.margin, yPos);
    
    yPos += 10;
    
    const tableData = [
      ['Valor do Sistema', `R$ ${financial.valorSistema.toLocaleString()}`],
      ['Valor Final', `R$ ${financial.valorFinal.toLocaleString()}`],
      ['Margem', `${financial.margem.toFixed(1)}%`],
      ['Economia Anual', `R$ ${financial.economiaAnual.toLocaleString()}`],
      ['Economia em 25 anos', `R$ ${financial.economia25Anos.toLocaleString()}`],
      ['Payback', `${simulation.payback.toFixed(1)} anos`],
      ['TIR', `${simulation.tir.toFixed(1)}%`],
      ['VPL', `R$ ${simulation.vpl.toLocaleString()}`]
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Item', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 11
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: this.margin, right: this.margin }
    });

    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addBenefitsSection(yPos: number) {
    // Check if we need a new page
    if (yPos > this.pageHeight - 80) {
      this.doc.addPage();
      yPos = 30;
    }

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Benefícios da Energia Solar', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    const benefits = [
      '✓ Redução de até 95% na conta de energia elétrica',
      '✓ Valorização do imóvel em até 8%',
      '✓ Energia limpa e renovável',
      '✓ Baixa manutenção e vida útil de 25+ anos',
      '✓ Proteção contra aumentos na tarifa elétrica',
      '✓ Retorno garantido do investimento'
    ];

    benefits.forEach(benefit => {
      this.doc.text(benefit, this.margin + 5, yPos);
      yPos += 8;
    });

    return yPos + 15;
  }

  private addFooter() {
    const footerY = this.pageHeight - 30;
    
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    
    this.doc.text('Esta proposta é válida por 30 dias.', this.margin, footerY);
    this.doc.text('SolarCalc Pro - Soluções em Energia Solar', this.pageWidth - 80, footerY);
    
    // Page number
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.text(`Página ${i} de ${pageCount}`, this.pageWidth - 40, footerY + 10);
    }
  }

  private addChart(simulation: ProposalData['simulation'], financial: ProposalData['financial'], yPos: number) {
    // Simple text-based chart representation
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Projeção de Economia (25 anos)', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Create a simple bar representation
    const years = [1, 5, 10, 15, 20, 25];
    const economiaAnual = financial.economiaAnual;
    
    years.forEach((year, index) => {
      const economiaAcumulada = economiaAnual * year * Math.pow(1.062, year); // 6.2% annual increase
      const barWidth = (economiaAcumulada / financial.economia25Anos) * 100;
      
      this.doc.text(`Ano ${year}:`, this.margin, yPos + (index * 12));
      this.doc.text(`R$ ${economiaAcumulada.toLocaleString()}`, this.margin + 40, yPos + (index * 12));
      
      // Simple bar representation
      this.doc.setFillColor(41, 128, 185);
      this.doc.rect(this.margin + 100, yPos + (index * 12) - 3, barWidth, 6, 'F');
    });
    
    return yPos + 80;
  }

  public generatePDF(data: ProposalData): jsPDF {
    // Use default template for backward compatibility
    const pdf = this.generatePDFWithTemplate(this.defaultTemplateId, data);
    return pdf || this.generateLegacyPDF(data);
  }

  public downloadPDF(data: ProposalData, filename?: string) {
    return this.downloadPDFWithTemplate(this.defaultTemplateId, data, filename);
  }

  public getPDFBlob(data: ProposalData): Blob {
    const blob = this.getPDFBlobWithTemplate(this.defaultTemplateId, data);
    return blob || this.generateLegacyPDF(data).output('blob');
  }

  public getPDFDataURL(data: ProposalData): string {
    const pdf = this.generatePDFWithTemplate(this.defaultTemplateId, data);
    return pdf ? pdf.output('dataurlstring') : this.generateLegacyPDF(data).output('dataurlstring');
  }

  public async previewPDF(data: ProposalData): Promise<string> {
    const url = await this.previewPDFWithTemplate(this.defaultTemplateId, data);
    if (url) return url;
    
    // Fallback to legacy
    const pdf = this.generateLegacyPDF(data);
    const blob = pdf.output('blob');
    return URL.createObjectURL(blob);
  }

  /**
   * Legacy PDF generation method (fallback)
   */
  private generateLegacyPDF(data: ProposalData): jsPDF {
    // Reset document
    this.doc = new jsPDF();
    
    // Add content
    this.addHeader();
    
    let currentY = this.addClientInfo(data.lead);
    currentY = this.addSystemInfo(data.kit, data.simulation, currentY);
    currentY = this.addFinancialTable(data.financial, data.simulation, currentY);
    
    // Check if we need a new page for benefits
    if (currentY > this.pageHeight - 100) {
      this.doc.addPage();
      currentY = 30;
    }
    
    currentY = this.addBenefitsSection(currentY);
    currentY = this.addChart(data.simulation, data.financial, currentY);
    
    this.addFooter();
    
    return this.doc;
  }
}

// Export a singleton instance
export const proposalPDFGenerator = new ProposalPDFGenerator();