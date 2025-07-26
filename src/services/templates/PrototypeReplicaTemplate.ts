import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export class PrototypeReplicaTemplate extends BaseTemplate {
  id = 'prototype-replica';
  name = 'Réplica do Protótipo';
  description = 'Reprodução fiel do design tradicional com layout corporativo e cores conservadoras';
  category = 'corporate' as const;

  generatePDF(data: ProposalData) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    this.addCorporateHeader();
    
    let currentY = this.addExecutiveSummary(data, 70);
    currentY = this.addClientSection(data.lead, currentY);
    currentY = this.addTechnicalSpecifications(data.kit, data.simulation, currentY);
    currentY = this.addFinancialAnalysis(data.financial, data.simulation, currentY);
    
    currentY = this.checkPageBreak(currentY, 100);
    currentY = this.addInvestmentJustification(data.simulation, data.financial, currentY);
    currentY = this.addTermsAndConditions(currentY);
    
    this.addCorporateFooter();
    this.addPageNumber();
    
    return this.doc;
  }

  private addCorporateHeader() {
    // Corporate blue header background
    this.doc.setFillColor(25, 55, 109); // Corporate dark blue
    this.doc.rect(0, 0, this.pageWidth, 55, 'F');
    
    // Company branding
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('ENERGIA SOLAR', this.margin, 25);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Soluções em Energia Renovável', this.margin, 35);
    
    // Proposal title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROPOSTA COMERCIAL', this.margin, 48);
    
    // Document info (right side)
    const rightX = this.pageWidth - 70;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('pt-BR');
    const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
    
    this.doc.text(`Data: ${today}`, rightX, 25);
    this.doc.text(`Proposta Nº: ${proposalNumber}`, rightX, 35);
    this.doc.text('Validade: 30 dias', rightX, 45);
  }

  private addExecutiveSummary(data: ProposalData, yPos: number): number {
    // Section divider
    this.doc.setDrawColor(25, 55, 109);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    
    yPos += 15;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 55, 109);
    this.doc.text('RESUMO EXECUTIVO', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const summaryText = [
      `Apresentamos uma solução completa em energia solar fotovoltaica para ${data.lead.name}.`,
      `O sistema proposto possui ${this.formatNumber(data.simulation.potencia, 2)} kWp de potência instalada,`,
      `com geração estimada de ${this.formatNumber(data.simulation.geracaoAnual)} kWh anuais.`,
      ``,
      `Investimento: ${this.formatCurrency(data.financial.valorFinal)}`,
      `Economia anual: ${this.formatCurrency(data.financial.economiaAnual)}`,
      `Retorno do investimento: ${this.formatNumber(data.simulation.payback, 1)} anos`
    ];
    
    summaryText.forEach(line => {
      if (line === '') {
        yPos += 5;
      } else {
        this.doc.text(line, this.margin, yPos);
        yPos += 12;
      }
    });
    
    return yPos + 10;
  }

  private addClientSection(lead: ProposalData['lead'], yPos: number): number {
    // Section divider
    this.doc.setDrawColor(25, 55, 109);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    
    yPos += 15;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 55, 109);
    this.doc.text('DADOS DO CLIENTE', this.margin, yPos);
    
    yPos += 15;
    
    // Client info table
    const clientData = [
      ['Cliente:', lead.name],
      ['Email:', lead.email || 'Não informado'],
      ['Telefone:', lead.phone || 'Não informado'],
      ['Consumo Médio:', lead.consumoMedio ? `${this.formatNumber(lead.consumoMedio)} kWh/mês` : 'Não informado']
    ];
    
    if (lead.address) {
      const address = typeof lead.address === 'string' ? lead.address : 
        `${lead.address.street || ''}, ${lead.address.city || ''} - ${lead.address.state || ''}`;
      clientData.push(['Endereço:', address]);
    }
    
    autoTable(this.doc, {
      startY: yPos,
      head: [],
      body: clientData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    return (this.doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  private addTechnicalSpecifications(kit: ProposalData['kit'], simulation: ProposalData['simulation'], yPos: number): number {
    yPos = this.checkPageBreak(yPos, 80);
    
    // Section divider
    this.doc.setDrawColor(25, 55, 109);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    
    yPos += 15;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 55, 109);
    this.doc.text('ESPECIFICAÇÕES TÉCNICAS', this.margin, yPos);
    
    yPos += 15;
    
    const technicalData = [
      ['Potência do Sistema:', `${this.formatNumber(simulation.potencia, 2)} kWp`],
      ['Geração Anual Estimada:', `${this.formatNumber(simulation.geracaoAnual)} kWh`],
      ['Geração Mensal Média:', `${this.formatNumber(simulation.geracaoAnual / 12)} kWh`],
      ['Área Aproximada Necessária:', `${this.formatNumber(simulation.potencia * 7, 0)} m²`],
      ['Redução de CO₂ (25 anos):', `${this.formatNumber(simulation.geracaoAnual * 25 * 0.0007, 1)} toneladas`]
    ];
    
    if (kit) {
      technicalData.unshift(
        ['Kit Selecionado:', kit.nome],
        ['Fabricante:', kit.fabricante || 'Não especificado']
      );
    }
    
    autoTable(this.doc, {
      startY: yPos,
      head: [],
      body: technicalData,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 55, 109],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    return (this.doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  private addFinancialAnalysis(financial: ProposalData['financial'], simulation: ProposalData['simulation'], yPos: number): number {
    yPos = this.checkPageBreak(yPos, 100);
    
    // Section divider
    this.doc.setDrawColor(25, 55, 109);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    
    yPos += 15;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 55, 109);
    this.doc.text('ANÁLISE FINANCEIRA', this.margin, yPos);
    
    yPos += 15;
    
    const financialData = [
      ['Valor do Sistema', this.formatCurrency(financial.valorSistema)],
      ['Valor Final da Proposta', this.formatCurrency(financial.valorFinal)],
      ['Economia Mensal Estimada', this.formatCurrency(financial.economiaAnual / 12)],
      ['Economia Anual Estimada', this.formatCurrency(financial.economiaAnual)],
      ['Economia em 25 anos', this.formatCurrency(financial.economia25Anos)],
      ['Payback Simples', `${this.formatNumber(simulation.payback, 1)} anos`],
      ['TIR (Taxa Interna de Retorno)', `${this.formatNumber(simulation.tir, 1)}%`],
      ['VPL (Valor Presente Líquido)', this.formatCurrency(simulation.vpl)]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Descrição', 'Valor']],
      body: financialData,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 55, 109],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 'auto', halign: 'right' }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    return (this.doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  private addInvestmentJustification(simulation: ProposalData['simulation'], financial: ProposalData['financial'], yPos: number): number {
    yPos = this.checkPageBreak(yPos, 80);
    
    // Section divider
    this.doc.setDrawColor(25, 55, 109);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    
    yPos += 15;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 55, 109);
    this.doc.text('JUSTIFICATIVA DO INVESTIMENTO', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const justificationText = [
      '• Energia limpa e renovável, contribuindo para a sustentabilidade ambiental',
      '• Redução significativa na conta de energia elétrica',
      '• Valorização do imóvel em até 8%',
      '• Proteção contra aumentos na tarifa de energia',
      '• Tecnologia comprovada com garantia de 25 anos',
      '• Retorno do investimento garantido em menos de 8 anos',
      '• Isenção de impostos federais (PIS/COFINS/ICMS em alguns estados)'
    ];
    
    justificationText.forEach(line => {
      this.doc.text(line, this.margin, yPos);
      yPos += 12;
    });
    
    return yPos + 10;
  }

  private addTermsAndConditions(yPos: number): number {
    yPos = this.checkPageBreak(yPos, 60);
    
    // Section divider
    this.doc.setDrawColor(25, 55, 109);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    
    yPos += 15;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 55, 109);
    this.doc.text('CONDIÇÕES COMERCIAIS', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const terms = [
      '• Proposta válida por 30 dias',
      '• Pagamento: 30% na assinatura do contrato, 40% na entrega dos equipamentos, 30% na finalização',
      '• Prazo de instalação: 30 a 45 dias após aprovação da concessionária',
      '• Garantia: 25 anos para módulos, 12 anos para inversores, 5 anos para instalação',
      '• Incluso: projeto, homologação, instalação e comissionamento',
      '• Não incluso: adequações elétricas extras e estruturas especiais'
    ];
    
    terms.forEach(term => {
      this.doc.text(term, this.margin, yPos);
      yPos += 10;
    });
    
    return yPos + 15;
  }

  private addCorporateFooter() {
    const footerY = this.pageHeight - 25;
    
    // Footer background
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(0, footerY - 5, this.pageWidth, 30, 'F');
    
    // Company contact info
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(25, 55, 109);
    
    const contactInfo = [
      'SolarCalc Pro - Soluções em Energia Solar',
      'Tel: (11) 9999-9999 | Email: contato@solarcalcpro.com.br',
      'www.solarcalcpro.com.br'
    ];
    
    let textY = footerY + 5;
    contactInfo.forEach(info => {
      const textWidth = this.doc.getTextWidth(info);
      this.doc.text(info, (this.pageWidth - textWidth) / 2, textY);
      textY += 8;
    });
  }
}