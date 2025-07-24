import { BaseTemplate, ProposalData } from '../proposalTemplates';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export class Presentation16x9Template extends BaseTemplate {
  id = 'presentation-16x9';
  name = 'Apresentação 16:9';
  description = 'Template otimizado para apresentações em formato 16:9 (landscape)';
  category = 'premium' as const;

  private primaryColor = '#1e40af'; // Blue-700
  private secondaryColor = '#3b82f6'; // Blue-500
  private accentColor = '#f59e0b'; // Amber-500
  private darkColor = '#1f2937'; // Gray-800
  private lightColor = '#f8fafc'; // Slate-50

  generatePDF(data: ProposalData) {
    // Formato 16:9 landscape (297mm x 167mm)
    this.doc = new jsPDF('l', 'mm', [297, 167]);
    this.pageWidth = 297;
    this.pageHeight = 167;
    this.margin = 15;

    // Slide 1: Capa
    this.addCoverSlide(data);
    
    // Slide 2: Benefícios
    this.doc.addPage();
    this.addBenefitsSlide();
    
    // Slide 3: Sistema Proposto
    this.doc.addPage();
    this.addSystemSlide(data);
    
    // Slide 4: Análise Financeira
    this.doc.addPage();
    this.addFinancialSlide(data);
    
    // Slide 5: Cronograma e Próximos Passos
    this.doc.addPage();
    this.addTimelineSlide();
    
    // Adicionar numeração
    this.addSlideNumbers();
    
    return this.doc;
  }

  private addCoverSlide(data: ProposalData) {
    // Background gradient
    this.doc.setFillColor(30, 64, 175); // Blue-700
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Gradient overlay
    this.doc.setFillColor(59, 130, 246); // Blue-500
    this.doc.rect(0, 0, this.pageWidth, 60, 'F');
    
    // Logo area (top-left)
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(this.margin, this.margin, 60, 30, 'F');
    this.doc.setFontSize(12);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('LOGO EMPRESA', this.margin + 30, this.margin + 18, { align: 'center' });

    // Main title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('PROPOSTA COMERCIAL', this.pageWidth / 2, 70, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Sistema Fotovoltaico', this.pageWidth / 2, 85, { align: 'center' });

    // Client name highlight
    this.doc.setFillColor(245, 158, 11); // Amber-500
    this.doc.rect(this.pageWidth / 2 - 80, 95, 160, 25, 'F');
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(data.lead.name.toUpperCase(), this.pageWidth / 2, 110, { align: 'center' });

    // Key metrics boxes
    const metrics = [
      { label: 'Potência', value: `${this.formatNumber(data.simulation.potencia, 1)} kWp` },
      { label: 'Economia/Ano', value: this.formatCurrency(data.simulation.economia) },
      { label: 'Payback', value: `${data.simulation.payback} anos` }
    ];

    metrics.forEach((metric, index) => {
      const xPos = 40 + (index * 80);
      const yPos = 130;
      
      // Metric box
      this.doc.setFillColor(248, 250, 252); // Slate-50
      this.doc.rect(xPos, yPos, 70, 25, 'F');
      this.doc.setDrawColor(226, 232, 240);
      this.doc.rect(xPos, yPos, 70, 25, 'S');
      
      // Label
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(metric.label, xPos + 35, yPos + 8, { align: 'center' });
      
      // Value
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(metric.value, xPos + 35, yPos + 18, { align: 'center' });
    });

    // Date and proposal number (bottom-right)
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(255, 255, 255);
    const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;
    this.doc.text(`${proposalNumber} | ${new Date().toLocaleDateString('pt-BR')}`, 
      this.pageWidth - this.margin, this.pageHeight - 10, { align: 'right' });
  }

  private addBenefitsSlide() {
    this.addSlideHeader('POR QUE ENERGIA SOLAR?');
    
    // Two-column layout
    const leftColumn = this.margin;
    const rightColumn = this.pageWidth / 2 + 10;
    const columnWidth = (this.pageWidth / 2) - 25;
    
    let yPos = 60;
    
    // Left column benefits
    const leftBenefits = [
      { icon: '💰', title: 'Economia Imediata', desc: 'Redução de até 95% na conta de luz' },
      { icon: '📈', title: 'Valorização do Imóvel', desc: 'Aumento de até 8% no valor do imóvel' },
      { icon: '🌱', title: 'Sustentabilidade', desc: 'Energia 100% limpa e renovável' },
      { icon: '🔒', title: 'Proteção Inflação', desc: 'Blindagem contra aumentos da energia' }
    ];
    
    leftBenefits.forEach((benefit, index) => {
      const itemY = yPos + (index * 22);
      
      // Icon background
      this.doc.setFillColor(59, 130, 246);
      this.doc.circle(leftColumn + 8, itemY + 5, 6, 'F');
      
      // Icon (simplified as text)
      this.doc.setFontSize(12);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(benefit.icon, leftColumn + 8, itemY + 7, { align: 'center' });
      
      // Title
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(benefit.title, leftColumn + 20, itemY + 3);
      
      // Description
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(75, 85, 99);
      this.doc.text(benefit.desc, leftColumn + 20, itemY + 10);
    });
    
    // Right column - How it works
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 64, 175);
    this.doc.text('COMO FUNCIONA?', rightColumn, yPos);
    
    yPos += 20;
    
    // Process steps
    const steps = [
      '1. Painéis captam energia solar',
      '2. Inversor converte para energia elétrica',
      '3. Energia alimenta sua casa/empresa',
      '4. Excesso vai para a rede elétrica',
      '5. Você ganha créditos na concessionária'
    ];
    
    steps.forEach((step, index) => {
      const stepY = yPos + (index * 15);
      
      // Step number
      this.doc.setFillColor(245, 158, 11);
      this.doc.circle(rightColumn + 8, stepY + 3, 6, 'F');
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text((index + 1).toString(), rightColumn + 8, stepY + 5, { align: 'center' });
      
      // Step text
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(step.substring(3), rightColumn + 20, stepY + 5);
    });
  }

  private addSystemSlide(data: ProposalData) {
    this.addSlideHeader('SISTEMA PROPOSTO');
    
    let yPos = 60;
    
    // System overview box
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 40, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 40, 'S');
    
    // System specs in grid
    const specs = [
      { label: 'Potência Total', value: `${this.formatNumber(data.simulation.potencia, 1)} kWp` },
      { label: 'Geração Mensal', value: `${this.formatNumber(data.simulation.geracaoAnual / 12)} kWh` },
      { label: 'Geração Anual', value: `${this.formatNumber(data.simulation.geracaoAnual)} kWh` },
      { label: 'Área Necessária', value: '45 m²' },
      { label: 'Módulos', value: '20 unidades' },
      { label: 'Inversor', value: '1 unidade' }
    ];
    
    specs.forEach((spec, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const xPos = this.margin + 20 + (col * 80);
      const specY = yPos + 10 + (row * 20);
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(spec.label + ':', xPos, specY);
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(spec.value, xPos, specY + 8);
    });
    
    yPos += 60;
    
    // Equipment details
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 64, 175);
    this.doc.text('EQUIPAMENTOS INCLUSOS', this.margin, yPos);
    
    yPos += 20;
    
    const equipment = [
      '✓ 20 Módulos Fotovoltaicos 360W - Tier 1',
      '✓ 1 Inversor String 7kW - Garantia 10 anos',
      '✓ Estrutura de Fixação em Alumínio',
      '✓ Cabeamento CC e CA Certificado',
      '✓ String Box e Dispositivos de Proteção',
      '✓ Sistema de Monitoramento Online'
    ];
    
    const leftEquip = equipment.slice(0, 3);
    const rightEquip = equipment.slice(3);
    
    leftEquip.forEach((item, index) => {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(item, this.margin, yPos + (index * 8));
    });
    
    rightEquip.forEach((item, index) => {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(item, this.pageWidth / 2 + 10, yPos + (index * 8));
    });
  }

  private addFinancialSlide(data: ProposalData) {
    this.addSlideHeader('ANÁLISE FINANCEIRA');
    
    let yPos = 60;
    
    // Investment summary
    this.doc.setFillColor(30, 64, 175);
    this.doc.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 30, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('RESUMO DO INVESTIMENTO', this.pageWidth / 2, yPos + 12, { align: 'center' });
    
    this.doc.setFontSize(24);
    this.doc.text(this.formatCurrency(data.financial.valorSistema), this.pageWidth / 2, yPos + 25, { align: 'center' });
    
    yPos += 50;
    
    // Financial metrics in cards
    const metrics = [
      { 
        title: 'ECONOMIA MENSAL', 
        value: this.formatCurrency(data.simulation.economia / 12),
        subtitle: 'A partir do 1º mês'
      },
      { 
        title: 'PAYBACK', 
        value: `${data.simulation.payback} anos`,
        subtitle: 'Retorno do investimento'
      },
      { 
        title: 'TIR', 
        value: `${data.simulation.tir}%`,
        subtitle: 'Taxa interna de retorno'
      },
      { 
        title: 'ECONOMIA 25 ANOS', 
        value: this.formatCurrency(data.simulation.economia * 25),
        subtitle: 'Vida útil do sistema'
      }
    ];
    
    metrics.forEach((metric, index) => {
      const cardWidth = 60;
      const cardHeight = 35;
      const xPos = this.margin + (index * 65);
      
      // Card background
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(xPos, yPos, cardWidth, cardHeight, 'F');
      this.doc.setDrawColor(59, 130, 246);
      this.doc.setLineWidth(2);
      this.doc.rect(xPos, yPos, cardWidth, cardHeight, 'S');
      
      // Title
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(metric.title, xPos + cardWidth/2, yPos + 8, { align: 'center' });
      
      // Value
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(metric.value, xPos + cardWidth/2, yPos + 18, { align: 'center' });
      
      // Subtitle
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(metric.subtitle, xPos + cardWidth/2, yPos + 28, { align: 'center' });
    });
    
    // Environmental impact
    yPos += 50;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(34, 197, 94); // Green
    this.doc.text('IMPACTO AMBIENTAL POSITIVO', this.margin, yPos);
    
    yPos += 15;
    
    const co2Avoided = data.simulation.geracaoAnual * 0.0817;
    const treesEquivalent = Math.round(co2Avoided / 22);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text(`🌱 ${this.formatNumber(co2Avoided)} kg de CO₂ evitados por ano`, this.margin, yPos);
    this.doc.text(`🌳 Equivale a plantar ${treesEquivalent} árvores anualmente`, this.margin, yPos + 8);
  }

  private addTimelineSlide() {
    this.addSlideHeader('CRONOGRAMA E PRÓXIMOS PASSOS');
    
    const yPos = 60;
    
    // Timeline steps
    const timelineSteps = [
      { step: '1', title: 'Aprovação da Proposta', duration: '1 dia', description: 'Assinatura do contrato' },
      { step: '2', title: 'Projeto Executivo', duration: '5-7 dias', description: 'Elaboração do projeto técnico' },
      { step: '3', title: 'Aprovação Concessionária', duration: '15-30 dias', description: 'Análise e aprovação pela distribuidora' },
      { step: '4', title: 'Instalação', duration: '1-2 dias', description: 'Montagem e comissionamento' },
      { step: '5', title: 'Vistoria e Conexão', duration: '15-30 dias', description: 'Vistoria final e ativação do sistema' }
    ];
    
    timelineSteps.forEach((item, index) => {
      const stepY = yPos + (index * 18);
      
      // Step circle
      this.doc.setFillColor(59, 130, 246);
      this.doc.circle(this.margin + 10, stepY + 5, 8, 'F');
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(item.step, this.margin + 10, stepY + 7, { align: 'center' });
      
      // Connecting line (except for last item)
      if (index < timelineSteps.length - 1) {
        this.doc.setDrawColor(226, 232, 240);
        this.doc.setLineWidth(2);
        this.doc.line(this.margin + 10, stepY + 13, this.margin + 10, stepY + 23);
      }
      
      // Step content
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(item.title, this.margin + 25, stepY + 3);
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(`Prazo: ${item.duration}`, this.margin + 25, stepY + 9);
      
      this.doc.setFontSize(9);
      this.doc.setTextColor(75, 85, 99);
      this.doc.text(item.description, this.margin + 25, stepY + 15);
    });
    
    // Call to action
    const ctaY = yPos + (timelineSteps.length * 18) + 10;
    
    this.doc.setFillColor(245, 158, 11); // Amber
    this.doc.rect(this.pageWidth / 2 + 20, ctaY, 120, 25, 'F');
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('VAMOS COMEÇAR SEU PROJETO?', this.pageWidth / 2 + 80, ctaY + 10, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.text('Entre em contato conosco hoje mesmo!', this.pageWidth / 2 + 80, ctaY + 18, { align: 'center' });
  }

  private addSlideHeader(title: string) {
    // Header background
    this.doc.setFillColor(30, 64, 175);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(title, this.pageWidth / 2, 22, { align: 'center' });
    
    // Accent line
    this.doc.setDrawColor(245, 158, 11);
    this.doc.setLineWidth(3);
    this.doc.line(0, 35, this.pageWidth, 35);
  }

  private addSlideNumbers() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Slide number background
      this.doc.setFillColor(30, 64, 175);
      this.doc.circle(this.pageWidth - 20, this.pageHeight - 15, 8, 'F');
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(i.toString(), this.pageWidth - 20, this.pageHeight - 12, { align: 'center' });
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