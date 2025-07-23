import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export class PremiumCorporateTemplate extends BaseTemplate {
  id = 'premium-corporate';
  name = 'Premium Corporativo';
  description = 'Template premium com design corporativo sofisticado e elegante';
  category = 'premium' as const;

  generatePDF(data: ProposalData) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    this.addCoverPage(data);
    this.addExecutiveSummary(data);
    this.addClientProfile(data);
    this.addTechnicalProposal(data);
    this.addFinancialAnalysis(data);
    this.addImplementationPlan(data);
    this.addCompanyCredentials();
    
    this.addPageNumber();
    
    return this.doc;
  }

  private addCoverPage(data: ProposalData) {
    // Premium gradient background
    const gradientSteps = 100;
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps;
      const r = Math.round(25 + (50 * ratio)); // Dark blue to lighter blue
      const g = Math.round(25 + (80 * ratio));
      const b = Math.round(112 + (60 * ratio));
      
      this.doc.setFillColor(r, g, b);
      this.doc.rect(0, i * (this.pageHeight / gradientSteps), this.pageWidth, this.pageHeight / gradientSteps + 1, 'F');
    }
    
    // Premium border
    this.doc.setDrawColor(255, 215, 0); // Gold
    this.doc.setLineWidth(3);
    this.doc.rect(15, 15, this.pageWidth - 30, this.pageHeight - 30);
    
    // Company logo area (placeholder)
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(30, 30, 60, 30, 'F');
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(30, 30, 60, 30);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('LOGO', 60, 50, { align: 'center' });
    
    // Main title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('PROPOSTA', this.pageWidth / 2, 120, { align: 'center' });
    
    this.doc.setFontSize(28);
    this.doc.setTextColor(255, 215, 0);
    this.doc.text('COMERCIAL', this.pageWidth / 2, 150, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Sistema Fotovoltaico de Alta Performance', this.pageWidth / 2, 175, { align: 'center' });
    
    // Client info box
    this.doc.setFillColor(255, 255, 255, 0.9);
    this.doc.rect(40, 200, this.pageWidth - 80, 50, 'F');
    
    this.doc.setDrawColor(255, 215, 0);
    this.doc.setLineWidth(2);
    this.doc.rect(40, 200, this.pageWidth - 80, 50);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('CLIENTE:', 50, 220);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.lead.name, 90, 220);
    
    const today = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DATA:', 50, 235);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(today, 90, 235);
    
    // Footer
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 215, 0);
    this.doc.text('SolarCalc Pro - Excellence in Solar Solutions', this.pageWidth / 2, this.pageHeight - 30, { align: 'center' });
  }

  private addExecutiveSummary(data: ProposalData) {
    this.doc.addPage();
    this.addPageHeader('SUMÁRIO EXECUTIVO');
    
    let yPos = 70;
    
    // Executive summary content
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const summaryText = [
      'A SolarCalc Pro tem o prazer de apresentar esta proposta técnico-comercial',
      'para implementação de um sistema fotovoltaico de alta performance, especialmente',
      'dimensionado para atender às necessidades energéticas do cliente.',
      '',
      'Nossa análise técnica indica excelente viabilidade econômica, com retorno',
      'garantido do investimento e significativa redução nos custos operacionais.'
    ];
    
    summaryText.forEach((line, index) => {
      this.doc.text(line, this.margin + 10, yPos + (index * 8));
    });
    
    yPos += summaryText.length * 8 + 20;
    
    // Key highlights
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('DESTAQUES DA PROPOSTA', this.margin, yPos);
    
    yPos += 15;
    
    const highlights = [
      { label: 'Retorno do Investimento (TIR)', value: `${this.formatNumber(data.simulation.tir, 1)}%`, color: [40, 167, 69] },
      { label: 'Tempo de Payback', value: `${this.formatNumber(data.simulation.payback, 1)} anos`, color: [0, 123, 255] },
      { label: 'Economia em 25 anos', value: this.formatCurrency(data.financial.economia25Anos), color: [255, 193, 7] },
      { label: 'Investimento Total', value: this.formatCurrency(data.financial.valorFinal), color: [108, 117, 125] }
    ];
    
    const boxWidth = (this.pageWidth - (this.margin * 2) - 30) / 2;
    const boxHeight = 40;
    
    highlights.forEach((highlight, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const xPos = this.margin + (col * (boxWidth + 10));
      const currentY = yPos + (row * (boxHeight + 10));
      
      // Highlight box
      this.doc.setFillColor(248, 249, 250);
      this.doc.rect(xPos, currentY, boxWidth, boxHeight, 'F');
      
      this.doc.setDrawColor(highlight.color[0], highlight.color[1], highlight.color[2]);
      this.doc.setLineWidth(2);
      this.doc.rect(xPos, currentY, boxWidth, boxHeight);
      
      // Label
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(highlight.label, xPos + 5, currentY + 12);
      
      // Value
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(highlight.color[0], highlight.color[1], highlight.color[2]);
      this.doc.text(highlight.value, xPos + 5, currentY + 28);
    });
  }

  private addClientProfile(data: ProposalData) {
    this.doc.addPage();
    this.addPageHeader('PERFIL DO CLIENTE');
    
    let yPos = 70;
    
    // Client information table
    const clientData = [
      ['Nome Completo', data.lead.name],
      ['Email', data.lead.email || 'Não informado'],
      ['Telefone', data.lead.phone || 'Não informado'],
      ['Endereço', this.formatAddress(data.lead.address)],
      ['Consumo Médio Mensal', data.lead.consumoMedio ? `${this.formatNumber(data.lead.consumoMedio)} kWh` : 'Não informado'],
      ['Perfil de Consumo', this.getConsumptionProfile(data.lead.consumoMedio || 0)]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      body: clientData,
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 8
      },
      columnStyles: {
        0: { 
          cellWidth: 60, 
          fontStyle: 'bold', 
          fillColor: [25, 25, 112],
          textColor: [255, 255, 255]
        },
        1: { cellWidth: 100 }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 30;
    
    // Consumption analysis
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('ANÁLISE DE CONSUMO', this.margin, yPos);
    
    yPos += 15;
    
    const consumoMensal = data.lead.consumoMedio || 500;
    const consumoAnual = consumoMensal * 12;
    const custoAtual = consumoMensal * 0.65; // Assuming R$ 0.65/kWh
    
    const consumptionAnalysis = [
      ['Consumo Mensal Médio', `${this.formatNumber(consumoMensal)} kWh`],
      ['Consumo Anual Estimado', `${this.formatNumber(consumoAnual)} kWh`],
      ['Custo Mensal Atual', this.formatCurrency(custoAtual)],
      ['Custo Anual Atual', this.formatCurrency(custoAtual * 12)],
      ['Projeção 25 anos (c/ reajustes)', this.formatCurrency(custoAtual * 12 * 25 * 1.8)]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      body: consumptionAnalysis,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 25, 112]
      },
      styles: {
        fontSize: 10,
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'right', textColor: [220, 53, 69] }
      },
      margin: { left: this.margin, right: this.margin }
    });
  }

  private addTechnicalProposal(data: ProposalData) {
    this.doc.addPage();
    this.addPageHeader('PROPOSTA TÉCNICA');
    
    let yPos = 70;
    
    // System specifications
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('ESPECIFICAÇÕES DO SISTEMA', this.margin, yPos);
    
    yPos += 15;
    
    const systemSpecs = [
      ['Potência Instalada', `${this.formatNumber(data.simulation.potencia, 2)} kWp`],
      ['Geração Anual Estimada', `${this.formatNumber(data.simulation.geracaoAnual)} kWh`],
      ['Geração Mensal Média', `${this.formatNumber(data.simulation.geracaoAnual / 12)} kWh`],
      ['Cobertura do Consumo', `${((data.simulation.geracaoAnual / ((data.lead.consumoMedio || 500) * 12)) * 100).toFixed(0)}%`],
      ['Área Estimada Necessária', `${(data.simulation.potencia * 6).toFixed(0)} m²`],
      ['Tipo de Sistema', 'On-Grid (Conectado à Rede)']
    ];
    
    if (data.kit) {
      systemSpecs.unshift(['Kit Selecionado', data.kit.nome]);
      if (data.kit.fabricante) {
        systemSpecs.push(['Fabricante Principal', data.kit.fabricante]);
      }
    }
    
    autoTable(this.doc, {
      startY: yPos,
      body: systemSpecs,
      theme: 'grid',
      headStyles: {
        fillColor: [25, 25, 112]
      },
      styles: {
        fontSize: 11,
        cellPadding: 8
      },
      columnStyles: {
        0: { 
          cellWidth: 80, 
          fontStyle: 'bold',
          fillColor: [240, 248, 255]
        },
        1: { 
          cellWidth: 70, 
          halign: 'right',
          textColor: [25, 25, 112],
          fontStyle: 'bold'
        }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 25;
    
    // Performance guarantees
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('GARANTIAS DE PERFORMANCE', this.margin, yPos);
    
    yPos += 15;
    
    const guarantees = [
      '✓ Garantia de fábrica: 12 anos para módulos fotovoltaicos',
      '✓ Garantia de performance: 25 anos com mínimo de 80% da potência',
      '✓ Garantia de inversores: 5 a 10 anos (conforme fabricante)',
      '✓ Garantia de instalação: 5 anos para mão de obra',
      '✓ Monitoramento remoto: Acompanhamento da performance 24/7',
      '✓ Suporte técnico: Atendimento especializado durante toda vida útil'
    ];
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    guarantees.forEach((guarantee, index) => {
      this.doc.setTextColor(40, 167, 69);
      this.doc.text('✓', this.margin + 5, yPos + (index * 10));
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(guarantee.substring(2), this.margin + 15, yPos + (index * 10));
    });
  }

  private addFinancialAnalysis(data: ProposalData) {
    this.doc.addPage();
    this.addPageHeader('ANÁLISE FINANCEIRA');
    
    let yPos = 70;
    
    // Investment summary
    this.doc.setFillColor(25, 25, 112);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 50, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('RESUMO DO INVESTIMENTO', this.pageWidth / 2, yPos + 20, { align: 'center' });
    
    this.doc.setFontSize(24);
    this.doc.setTextColor(255, 215, 0);
    this.doc.text(this.formatCurrency(data.financial.valorFinal), this.pageWidth / 2, yPos + 40, { align: 'center' });
    
    yPos += 65;
    
    // Financial metrics table
    const financialMetrics = [
      ['Valor Base do Sistema', this.formatCurrency(data.financial.valorSistema)],
      ['Ajustes/Descontos', this.formatCurrency(data.financial.valorFinal - data.financial.valorSistema)],
      ['Valor Final do Investimento', this.formatCurrency(data.financial.valorFinal)],
      ['Economia Anual (Ano 1)', this.formatCurrency(data.financial.economiaAnual)],
      ['Economia Mensal Média', this.formatCurrency(data.financial.economiaAnual / 12)],
      ['Tempo de Retorno (Payback)', `${this.formatNumber(data.simulation.payback, 1)} anos`],
      ['Taxa Interna de Retorno (TIR)', `${this.formatNumber(data.simulation.tir, 1)}%`],
      ['Valor Presente Líquido (VPL)', this.formatCurrency(data.simulation.vpl)],
      ['Economia Total (25 anos)', this.formatCurrency(data.financial.economia25Anos)]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      body: financialMetrics,
      theme: 'striped',
      styles: {
        fontSize: 11,
        cellPadding: 8
      },
      columnStyles: {
        0: { 
          cellWidth: 90, 
          fontStyle: 'bold',
          fillColor: [248, 249, 250]
        },
        1: { 
          cellWidth: 70, 
          halign: 'right',
          textColor: [40, 167, 69],
          fontStyle: 'bold'
        }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 20;
    
    // ROI visualization
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('PROJEÇÃO DE RETORNO (10 ANOS)', this.margin, yPos);
    
    yPos += 10;
    
    const roiProjection = [];
    const economiaAnual = data.financial.economiaAnual;
    
    for (let year = 1; year <= 10; year++) {
      const economiaAcumulada = economiaAnual * year * Math.pow(1.062, year);
      const roi = ((economiaAcumulada / data.financial.valorFinal) * 100);
      
      roiProjection.push([
        `Ano ${year}`,
        this.formatCurrency(economiaAcumulada),
        `${roi.toFixed(0)}%`
      ]);
    }
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Período', 'Economia Acumulada', 'ROI']],
      body: roiProjection,
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
        0: { cellWidth: 40, halign: 'center' },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 30, halign: 'center', textColor: [40, 167, 69] }
      },
      margin: { left: this.margin, right: this.margin }
    });
  }

  private addImplementationPlan(data: ProposalData) {
    this.doc.addPage();
    this.addPageHeader('PLANO DE IMPLEMENTAÇÃO');
    
    let yPos = 70;
    
    // Implementation timeline
    const timeline = [
      { phase: 'Fase 1', duration: '1-2 semanas', description: 'Projeto executivo e documentação técnica' },
      { phase: 'Fase 2', duration: '2-3 semanas', description: 'Aprovação junto à concessionária de energia' },
      { phase: 'Fase 3', duration: '1 semana', description: 'Aquisição e logística de equipamentos' },
      { phase: 'Fase 4', duration: '2-3 dias', description: 'Instalação e comissionamento do sistema' },
      { phase: 'Fase 5', duration: '1-2 semanas', description: 'Vistoria e conexão à rede elétrica' },
      { phase: 'Fase 6', duration: 'Contínuo', description: 'Monitoramento e suporte técnico' }
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Fase', 'Duração', 'Descrição']],
      body: timeline.map(item => [item.phase, item.duration, item.description]),
      theme: 'striped',
      headStyles: {
        fillColor: [25, 25, 112],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 90 }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 25;
    
    // Terms and conditions
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('CONDIÇÕES COMERCIAIS', this.margin, yPos);
    
    yPos += 15;
    
    const terms = [
      '• Proposta válida por 30 dias corridos a partir da data de emissão',
      '• Pagamento: Entrada + parcelas (condições a negociar)',
      '• Prazo de entrega: 45 a 60 dias após aprovação do projeto',
      '• Garantia total: 5 anos para instalação + garantias de fábrica',
      '• Incluso: Projeto, equipamentos, instalação e comissionamento',
      '• Não incluso: Adequações elétricas prediais (se necessárias)'
    ];
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    terms.forEach((term, index) => {
      this.doc.text(term, this.margin + 5, yPos + (index * 10));
    });
  }

  private addCompanyCredentials() {
    this.doc.addPage();
    this.addPageHeader('SOBRE A SOLARCALC PRO');
    
    let yPos = 70;
    
    // Company description
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const companyText = [
      'A SolarCalc Pro é uma empresa especializada em soluções de energia solar',
      'fotovoltaica, com foco em excelência técnica e atendimento personalizado.',
      '',
      'Nossa missão é democratizar o acesso à energia limpa e renovável,',
      'proporcionando economia e sustentabilidade para nossos clientes.'
    ];
    
    companyText.forEach((line, index) => {
      this.doc.text(line, this.margin + 10, yPos + (index * 8));
    });
    
    yPos += companyText.length * 8 + 25;
    
    // Credentials
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 25, 112);
    this.doc.text('NOSSOS DIFERENCIAIS', this.margin, yPos);
    
    yPos += 15;
    
    const credentials = [
      '🏆 Mais de 1000 sistemas instalados com sucesso',
      '⚡ Equipe técnica certificada e especializada',
      '🔧 Suporte técnico 24/7 durante toda vida útil',
      '📊 Monitoramento remoto em tempo real',
      '🌱 Compromisso com sustentabilidade e meio ambiente',
      '💼 Atendimento personalizado e consultivo'
    ];
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    credentials.forEach((credential, index) => {
      this.doc.text(credential, this.margin + 5, yPos + (index * 12));
    });
    
    yPos += credentials.length * 12 + 30;
    
    // Contact information
    this.doc.setFillColor(25, 25, 112);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 60, 'F');
    
    yPos += 20;
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('ENTRE EM CONTATO', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('📞 (11) 99999-9999', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    this.doc.text('📧 contato@solarcalcpro.com', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    this.doc.text('🌐 www.solarcalcpro.com', this.pageWidth / 2, yPos, { align: 'center' });
  }

  private addPageHeader(title: string) {
    // Header background
    this.doc.setFillColor(25, 25, 112);
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Gold accent line
    this.doc.setFillColor(255, 215, 0);
    this.doc.rect(0, 45, this.pageWidth, 5, 'F');
    
    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(title, this.margin, 30);
    
    // Company name
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('SolarCalc Pro', this.pageWidth - 60, 30);
  }

  private formatAddress(address: any): string {
    if (!address) return 'Não informado';
    if (typeof address === 'string') return address;
    return `${address.street || ''}, ${address.city || ''} - ${address.state || ''}`;
  }

  private getConsumptionProfile(consumption: number): string {
    if (consumption < 200) return 'Baixo consumo';
    if (consumption < 500) return 'Consumo médio';
    if (consumption < 1000) return 'Alto consumo';
    return 'Consumo muito alto';
  }
}