import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export class DataFocusedTemplate extends BaseTemplate {
  id = 'data-focused';
  name = 'Foco em Dados e ROI';
  description = 'Template técnico com foco em dados, métricas e retorno sobre investimento';
  category = 'data-focused' as const;

  generatePDF(data: ProposalData) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    this.addHeader(data);
    
    let currentY = this.addExecutiveSummary(data);
    currentY = this.addTechnicalSpecs(data, currentY);
    currentY = this.addFinancialAnalysis(data, currentY);
    
    this.doc.addPage();
    currentY = 30;
    currentY = this.addROIAnalysis(data, currentY);
    currentY = this.addRiskAnalysis(data, currentY);
    currentY = this.addRecommendations(data, currentY);
    
    this.addPageNumber();
    
    return this.doc;
  }

  private addHeader(data: ProposalData) {
    // Technical header design
    this.doc.setFillColor(52, 58, 64);
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('ANÁLISE TÉCNICO-FINANCEIRA', this.margin, 25);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Sistema Fotovoltaico - Estudo de Viabilidade', this.margin, 40);
    
    // Client and date info
    const today = new Date().toLocaleDateString('pt-BR');
    this.doc.text(`Cliente: ${data.lead.name}`, this.pageWidth - 100, 25);
    this.doc.text(`Data: ${today}`, this.pageWidth - 100, 40);
  }

  private addExecutiveSummary(data: ProposalData): number {
    let yPos = 70;
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 58, 64);
    this.doc.text('RESUMO EXECUTIVO', this.margin, yPos);
    
    yPos += 15;
    
    // Key metrics in boxes
    const metrics = [
      { label: 'ROI', value: `${this.formatNumber(data.simulation.tir, 1)}%`, color: [40, 167, 69] },
      { label: 'Payback', value: `${this.formatNumber(data.simulation.payback, 1)} anos`, color: [0, 123, 255] },
      { label: 'VPL', value: this.formatCurrency(data.simulation.vpl), color: [220, 53, 69] },
      { label: 'Economia 25a', value: this.formatCurrency(data.financial.economia25Anos), color: [255, 193, 7] }
    ];
    
    const boxWidth = (this.pageWidth - (this.margin * 2) - 30) / 4;
    
    metrics.forEach((metric, index) => {
      const xPos = this.margin + (index * (boxWidth + 10));
      
      // Metric box
      this.doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      this.doc.rect(xPos, yPos, boxWidth, 35, 'F');
      
      // Label
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(metric.label, xPos + boxWidth/2, yPos + 12, { align: 'center' });
      
      // Value
      this.doc.setFontSize(12);
      this.doc.text(metric.value, xPos + boxWidth/2, yPos + 25, { align: 'center' });
    });
    
    return yPos + 50;
  }

  private addTechnicalSpecs(data: ProposalData, yPos: number): number {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 58, 64);
    this.doc.text('ESPECIFICAÇÕES TÉCNICAS', this.margin, yPos);
    
    yPos += 15;
    
    const techData = [
      ['Potência Instalada', `${this.formatNumber(data.simulation.potencia, 2)} kWp`],
      ['Geração Anual Estimada', `${this.formatNumber(data.simulation.geracaoAnual)} kWh`],
      ['Geração Mensal Média', `${this.formatNumber(data.simulation.geracaoAnual / 12)} kWh`],
      ['Fator de Capacidade', `${((data.simulation.geracaoAnual / (data.simulation.potencia * 8760)) * 100).toFixed(1)}%`],
      ['Produtividade Específica', `${(data.simulation.geracaoAnual / data.simulation.potencia).toFixed(0)} kWh/kWp/ano`],
      ['Área Estimada Necessária', `${(data.simulation.potencia * 6).toFixed(0)} m²`]
    ];
    
    if (data.kit) {
      techData.unshift(['Kit Selecionado', data.kit.nome]);
      if (data.kit.fabricante) {
        techData.push(['Fabricante', data.kit.fabricante]);
      }
    }
    
    autoTable(this.doc, {
      startY: yPos,
      body: techData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', fillColor: [248, 249, 250] },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addFinancialAnalysis(data: ProposalData, yPos: number): number {
    yPos = this.checkPageBreak(yPos, 100);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 58, 64);
    this.doc.text('ANÁLISE FINANCEIRA DETALHADA', this.margin, yPos);
    
    yPos += 15;
    
    const financialData = [
      ['Investimento Inicial', this.formatCurrency(data.financial.valorSistema), '100%'],
      ['Valor Final (c/ ajustes)', this.formatCurrency(data.financial.valorFinal), `${((data.financial.valorFinal / data.financial.valorSistema) * 100).toFixed(1)}%`],
      ['Margem Aplicada', `${this.formatNumber(data.financial.margem, 1)}%`, '-'],
      ['Economia Anual (Ano 1)', this.formatCurrency(data.financial.economiaAnual), `${((data.financial.economiaAnual / data.financial.valorFinal) * 100).toFixed(1)}%`],
      ['Economia Mensal Média', this.formatCurrency(data.financial.economiaAnual / 12), '-'],
      ['Fluxo de Caixa Líquido', this.formatCurrency(data.simulation.vpl), `${((data.simulation.vpl / data.financial.valorFinal) * 100).toFixed(0)}%`]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Indicador', 'Valor', '% do Investimento']],
      body: financialData,
      theme: 'striped',
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'right', textColor: [0, 100, 0] },
        2: { cellWidth: 40, halign: 'center' }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addROIAnalysis(data: ProposalData, yPos: number): number {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 58, 64);
    this.doc.text('ANÁLISE DE RETORNO SOBRE INVESTIMENTO', this.margin, yPos);
    
    yPos += 15;
    
    // ROI progression table
    const roiData = [];
    const economiaAnual = data.financial.economiaAnual;
    const investimento = data.financial.valorFinal;
    
    for (let year = 1; year <= 25; year += 2) {
      const economiaAcumulada = economiaAnual * year * Math.pow(1.062, year);
      const roi = ((economiaAcumulada - investimento) / investimento) * 100;
      const status = roi > 0 ? 'Positivo' : 'Negativo';
      
      roiData.push([
        `Ano ${year}`,
        this.formatCurrency(economiaAcumulada),
        `${roi.toFixed(0)}%`,
        status
      ]);
    }
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Período', 'Economia Acumulada', 'ROI', 'Status']],
      body: roiData,
      theme: 'grid',
      headStyles: {
        fillColor: [40, 167, 69],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 30, halign: 'center', textColor: [0, 100, 0] },
        3: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addRiskAnalysis(data: ProposalData, yPos: number): number {
    yPos = this.checkPageBreak(yPos, 80);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 58, 64);
    this.doc.text('ANÁLISE DE RISCOS E PREMISSAS', this.margin, yPos);
    
    yPos += 15;
    
    const riskData = [
      ['Degradação Anual dos Módulos', '0.7%', 'Baixo'],
      ['Variação na Irradiação Solar', '±5%', 'Baixo'],
      ['Aumento Tarifa Elétrica (anual)', '6.2%', 'Médio'],
      ['Falha de Equipamentos', '<2%', 'Baixo'],
      ['Mudanças Regulatórias', 'Variável', 'Médio'],
      ['Manutenção Não Planejada', '<1%', 'Baixo']
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Fator de Risco', 'Impacto Estimado', 'Probabilidade']],
      body: riskData,
      theme: 'striped',
      headStyles: {
        fillColor: [220, 53, 69],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addRecommendations(data: ProposalData, yPos: number): number {
    yPos = this.checkPageBreak(yPos, 100);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 58, 64);
    this.doc.text('RECOMENDAÇÕES TÉCNICAS', this.margin, yPos);
    
    yPos += 15;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const recommendations = [
      '1. VIABILIDADE: O projeto apresenta excelente viabilidade econômica com TIR superior a 15%.',
      '2. TIMING: Recomenda-se implementação imediata para maximizar benefícios fiscais.',
      '3. MANUTENÇÃO: Estabelecer rotina de limpeza semestral e inspeção anual.',
      '4. MONITORAMENTO: Instalar sistema de monitoramento para acompanhar performance.',
      '5. SEGURO: Considerar seguro específico para sistemas fotovoltaicos.',
      '6. EXPANSÃO: Sistema permite expansão futura conforme aumento de consumo.'
    ];
    
    recommendations.forEach((rec, index) => {
      const lines = this.doc.splitTextToSize(rec, this.pageWidth - (this.margin * 2) - 10);
      this.doc.text(lines, this.margin + 5, yPos + (index * 15));
    });
    
    yPos += recommendations.length * 15 + 20;
    
    // Conclusion box
    this.doc.setFillColor(40, 167, 69);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 40, 'F');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('CONCLUSÃO: PROJETO ALTAMENTE RECOMENDADO', this.pageWidth / 2, yPos + 15, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`ROI de ${this.formatNumber(data.simulation.tir, 1)}% e payback de ${this.formatNumber(data.simulation.payback, 1)} anos`, this.pageWidth / 2, yPos + 30, { align: 'center' });
    
    return yPos + 50;
  }
}