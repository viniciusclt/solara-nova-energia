import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export class StorytellingTemplate extends BaseTemplate {
  id = 'storytelling';
  name = 'Storytelling Visual';
  description = 'Template narrativo com foco em storytelling e elementos visuais';
  category = 'standard' as const;

  generatePDF(data: ProposalData) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    this.addCoverPage(data);
    this.addStoryIntroduction(data);
    this.addCurrentSituation(data);
    this.addSolutionStory(data);
    this.addTransformationJourney(data);
    this.addHappyEnding(data);
    
    this.addPageNumber();
    
    return this.doc;
  }

  private addCoverPage(data: ProposalData) {
    // Gradient-like background effect
    for (let i = 0; i < 50; i++) {
      const alpha = 1 - (i / 50);
      this.doc.setFillColor(135, 206, 235, alpha); // Sky blue gradient
      this.doc.rect(0, i * 4, this.pageWidth, 4, 'F');
    }
    
    // Sun icon (simple circle)
    this.doc.setFillColor(255, 215, 0);
    this.doc.circle(this.pageWidth - 40, 40, 20, 'F');
    
    // Main title with story approach
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('SUA JORNADA', this.pageWidth / 2, 80, { align: 'center' });
    
    this.doc.setFontSize(28);
    this.doc.text('PARA A', this.pageWidth / 2, 110, { align: 'center' });
    
    this.doc.setFontSize(36);
    this.doc.setTextColor(255, 215, 0);
    this.doc.text('INDEPENDÊNCIA', this.pageWidth / 2, 140, { align: 'center' });
    
    this.doc.setFontSize(28);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('ENERGÉTICA', this.pageWidth / 2, 170, { align: 'center' });
    
    // Personal touch
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Uma proposta especial para ${data.lead.name}`, this.pageWidth / 2, 200, { align: 'center' });
    
    // Date
    const today = new Date().toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    this.doc.setFontSize(12);
    this.doc.text(today, this.pageWidth / 2, 220, { align: 'center' });
    
    // Footer
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SolarCalc Pro', this.pageWidth / 2, this.pageHeight - 30, { align: 'center' });
  }

  private addStoryIntroduction(data: ProposalData) {
    this.doc.addPage();
    let yPos = 40;
    
    // Chapter header
    this.doc.setFillColor(255, 215, 0);
    this.doc.rect(0, yPos - 15, this.pageWidth, 30, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('CAPÍTULO 1: O ENCONTRO', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 40;
    
    // Story narrative
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const storyText = [
      `Olá ${data.lead.name},`,
      '',
      'Toda grande transformação começa com uma decisão. E você já deu o primeiro',
      'passo ao buscar uma solução para reduzir seus gastos com energia elétrica.',
      '',
      'Esta não é apenas uma proposta comercial. É o início de uma jornada que vai',
      'transformar sua relação com a energia, suas finanças e o meio ambiente.',
      '',
      'Vamos contar a história de como você pode se tornar independente',
      'energeticamente e ainda economizar milhares de reais nos próximos anos.'
    ];
    
    storyText.forEach((line, index) => {
      if (line.startsWith('Olá')) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
      } else {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(12);
      }
      this.doc.text(line, this.margin + 10, yPos + (index * 10));
    });
    
    yPos += storyText.length * 10 + 30;
    
    // Current situation box
    this.doc.setFillColor(255, 240, 240);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 60, 'F');
    
    this.doc.setDrawColor(220, 53, 69);
    this.doc.setLineWidth(2);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 60);
    
    yPos += 15;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 53, 69);
    this.doc.text('SUA SITUAÇÃO ATUAL', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const currentSituation = [
      `Consumo mensal: ${data.lead.consumoMedio || 'N/A'} kWh`,
      `Gasto estimado anual: ${this.formatCurrency((data.lead.consumoMedio || 0) * 0.65 * 12)}`,
      'Dependência total da concessionária de energia'
    ];
    
    currentSituation.forEach((item, index) => {
      this.doc.text(`• ${item}`, this.margin + 20, yPos + (index * 10));
    });
  }

  private addCurrentSituation(data: ProposalData) {
    this.doc.addPage();
    let yPos = 40;
    
    // Chapter header
    this.doc.setFillColor(220, 53, 69);
    this.doc.rect(0, yPos - 15, this.pageWidth, 30, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('CAPÍTULO 2: O PROBLEMA', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 40;
    
    // Problem narrative
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const problemText = [
      'Todos os meses, a mesma história se repete:',
      '',
      '📧 A conta de luz chega e você torce para não ter aumentado',
      '💸 Uma parte significativa da sua renda vai para a concessionária',
      '📈 Os reajustes anuais corroem seu poder de compra',
      '😰 A incerteza sobre os próximos aumentos gera ansiedade',
      '',
      'E se eu te dissesse que existe uma forma de quebrar esse ciclo?'
    ];
    
    problemText.forEach((line, index) => {
      if (line.includes('📧') || line.includes('💸') || line.includes('📈') || line.includes('😰')) {
        this.doc.setTextColor(220, 53, 69);
        this.doc.setFont('helvetica', 'bold');
      } else if (line.includes('E se eu te dissesse')) {
        this.doc.setTextColor(0, 123, 255);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
      } else {
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(12);
      }
      this.doc.text(line, this.margin + 10, yPos + (index * 12));
    });
    
    yPos += problemText.length * 12 + 30;
    
    // Impact visualization
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 53, 69);
    this.doc.text('O IMPACTO EM 25 ANOS', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    
    const consumoMensal = data.lead.consumoMedio || 500;
    const gastoMensal = consumoMensal * 0.65;
    const gasto25Anos = gastoMensal * 12 * 25 * Math.pow(1.062, 12.5); // Average over 25 years
    
    this.doc.setFillColor(255, 240, 240);
    this.doc.rect(this.margin + 20, yPos, this.pageWidth - (this.margin * 2) - 40, 50, 'F');
    
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 53, 69);
    this.doc.text(this.formatCurrency(gasto25Anos), this.pageWidth / 2, yPos + 20, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Valor total que você pagará em energia nos próximos 25 anos', this.pageWidth / 2, yPos + 35, { align: 'center' });
    this.doc.text('(considerando reajustes anuais de 6,2%)', this.pageWidth / 2, yPos + 45, { align: 'center' });
  }

  private addSolutionStory(data: ProposalData) {
    this.doc.addPage();
    let yPos = 40;
    
    // Chapter header
    this.doc.setFillColor(40, 167, 69);
    this.doc.rect(0, yPos - 15, this.pageWidth, 30, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('CAPÍTULO 3: A SOLUÇÃO', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 40;
    
    // Solution narrative
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const solutionText = [
      'Imagine acordar todos os dias sabendo que:',
      '',
      '☀️ O sol está trabalhando para você, gerando sua própria energia',
      '💚 Sua conta de luz é praticamente zero',
      '🏦 O dinheiro que sobra pode ser investido em seus sonhos',
      '🌍 Você está contribuindo para um planeta mais sustentável',
      '',
      'Essa realidade está mais próxima do que você imagina!'
    ];
    
    solutionText.forEach((line, index) => {
      if (line.includes('☀️') || line.includes('💚') || line.includes('🏦') || line.includes('🌍')) {
        this.doc.setTextColor(40, 167, 69);
        this.doc.setFont('helvetica', 'bold');
      } else if (line.includes('Essa realidade')) {
        this.doc.setTextColor(0, 123, 255);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
      } else {
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(12);
      }
      this.doc.text(line, this.margin + 10, yPos + (index * 12));
    });
    
    yPos += solutionText.length * 12 + 30;
    
    // System details
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(40, 167, 69);
    this.doc.text('SEU SISTEMA PERSONALIZADO', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    
    const systemDetails = [
      [`Potência instalada: ${this.formatNumber(data.simulation.potencia, 2)} kWp`],
      [`Geração anual: ${this.formatNumber(data.simulation.geracaoAnual)} kWh`],
      [`Economia mensal: ${this.formatCurrency(data.simulation.economia / 12)}`],
      [data.kit ? `Kit selecionado: ${data.kit.nome}` : 'Sistema customizado']
    ];
    
    systemDetails.forEach((detail, index) => {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`• ${detail[0]}`, this.margin + 20, yPos + (index * 15));
    });
  }

  private addTransformationJourney(data: ProposalData) {
    this.doc.addPage();
    let yPos = 40;
    
    // Chapter header
    this.doc.setFillColor(0, 123, 255);
    this.doc.rect(0, yPos - 15, this.pageWidth, 30, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('CAPÍTULO 4: A JORNADA', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 40;
    
    // Timeline visualization
    const timeline = [
      { phase: 'HOJE', description: 'Você toma a decisão', icon: '🎯' },
      { phase: 'SEMANA 1-2', description: 'Projeto e aprovações', icon: '📋' },
      { phase: 'SEMANA 3-4', description: 'Instalação do sistema', icon: '🔧' },
      { phase: 'MÊS 2', description: 'Primeira economia na conta', icon: '💰' },
      { phase: 'ANO 1', description: `Economia de ${this.formatCurrency(data.financial.economiaAnual)}`, icon: '📈' },
      { phase: `ANO ${Math.ceil(data.simulation.payback)}`, description: 'Sistema se paga completamente', icon: '🎉' }
    ];
    
    timeline.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const xPos = isEven ? this.margin + 20 : this.pageWidth - this.margin - 80;
      const currentY = yPos + (index * 25);
      
      // Timeline line
      if (index < timeline.length - 1) {
        this.doc.setDrawColor(0, 123, 255);
        this.doc.setLineWidth(2);
        this.doc.line(this.pageWidth / 2, currentY + 5, this.pageWidth / 2, currentY + 25);
      }
      
      // Timeline dot
      this.doc.setFillColor(0, 123, 255);
      this.doc.circle(this.pageWidth / 2, currentY + 5, 3, 'F');
      
      // Content box
      this.doc.setFillColor(240, 248, 255);
      this.doc.rect(xPos - 10, currentY - 5, 100, 20, 'F');
      
      this.doc.setDrawColor(0, 123, 255);
      this.doc.rect(xPos - 10, currentY - 5, 100, 20);
      
      // Phase and description
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 123, 255);
      this.doc.text(`${item.icon} ${item.phase}`, xPos - 5, currentY + 2);
      
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(item.description, xPos - 5, currentY + 10);
    });
  }

  private addHappyEnding(data: ProposalData) {
    this.doc.addPage();
    let yPos = 40;
    
    // Chapter header
    this.doc.setFillColor(255, 215, 0);
    this.doc.rect(0, yPos - 15, this.pageWidth, 30, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('CAPÍTULO 5: O FINAL FELIZ', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 40;
    
    // Happy ending narrative
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const happyEndingText = [
      'Daqui a 25 anos, você olhará para trás e se lembrará do dia em que',
      'tomou uma das melhores decisões da sua vida.',
      '',
      'Você terá economizado:'
    ];
    
    happyEndingText.forEach((line, index) => {
      this.doc.text(line, this.margin + 10, yPos + (index * 12));
    });
    
    yPos += happyEndingText.length * 12 + 20;
    
    // Final numbers - the happy ending
    this.doc.setFillColor(40, 167, 69);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 80, 'F');
    
    yPos += 20;
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(this.formatCurrency(data.financial.economia25Anos), this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('em 25 anos de economia', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    this.doc.setFontSize(12);
    this.doc.text('Dinheiro que ficará no seu bolso, não na conta de luz', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 40;
    
    // Call to action
    this.doc.setFillColor(220, 53, 69);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 60, 'F');
    
    yPos += 20;
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('COMECE SUA HISTÓRIA HOJE!', this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Investimento: ${this.formatCurrency(data.financial.valorFinal)}`, this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    this.doc.setFontSize(12);
    this.doc.text('Proposta válida por 30 dias', this.pageWidth / 2, yPos, { align: 'center' });
    
    // Contact footer
    yPos += 30;
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Entre em contato: (11) 99999-9999 | contato@solarcalcpro.com', this.pageWidth / 2, yPos, { align: 'center' });
  }
}