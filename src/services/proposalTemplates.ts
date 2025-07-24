import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ProposalData {
  lead: {
    name: string;
    email?: string;
    phone?: string;
    address?: any;
    consumoMedio?: number;
  };
  simulation: {
    potencia: number;
    geracaoAnual: number;
    economia: number;
    payback: number;
    tir: number;
    vpl: number;
  };
  financial: {
    valorSistema: number;
    valorFinal: number;
    margem: number;
    economiaAnual: number;
    economia25Anos: number;
  };
  kit?: {
    nome: string;
    potencia: number;
    preco: number;
    fabricante?: string;
    categoria?: string;
  };
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'premium' | 'corporate' | 'minimal' | 'data-focused' | 'professional' | 'presentation';
  generatePDF(data: ProposalData): jsPDF;
}

export abstract class BaseTemplate implements ProposalTemplate {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract category: 'standard' | 'premium' | 'corporate' | 'minimal' | 'data-focused' | 'professional' | 'presentation';

  protected doc: jsPDF;
  protected pageWidth: number;
  protected pageHeight: number;
  protected margin: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  abstract generatePDF(data: ProposalData): jsPDF;

  protected formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  protected formatNumber(value: number, decimals: number = 0): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  protected addPageNumber() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - 25, this.pageHeight - 10);
    }
  }

  protected checkPageBreak(currentY: number, requiredSpace: number = 50): number {
    if (currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      return 30;
    }
    return currentY;
  }
}