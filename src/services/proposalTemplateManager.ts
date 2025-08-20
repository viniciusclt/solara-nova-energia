import { ProposalTemplate, ProposalData } from './proposalTemplates';
import { StandardTemplate } from './templates/StandardTemplate';
import { AidaTemplate } from './templates/AidaTemplate';
import { DataFocusedTemplate } from './templates/DataFocusedTemplate';
import { StorytellingTemplate } from './templates/StorytellingTemplate';
import { PremiumCorporateTemplate } from './templates/PremiumCorporateTemplate';
import { PrototypeReplicaTemplate } from './templates/PrototypeReplicaTemplate';
import { ProfessionalA4Template } from './templates/ProfessionalA4Template';
import { Presentation16x9Template } from './templates/Presentation16x9Template';
import jsPDF from 'jspdf';
import { logError } from '../utils/secureLogger';
import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

export class ProposalTemplateManager {
  private static instance: ProposalTemplateManager;
  private templates: Map<string, ProposalTemplate>;

  private constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  public static getInstance(): ProposalTemplateManager {
    if (!ProposalTemplateManager.instance) {
      ProposalTemplateManager.instance = new ProposalTemplateManager();
    }
    return ProposalTemplateManager.instance;
  }

  private initializeTemplates() {
    const templateInstances = [
      new PrototypeReplicaTemplate(),
      new StandardTemplate(),
      new AidaTemplate(),
      new DataFocusedTemplate(),
      new StorytellingTemplate(),
      new PremiumCorporateTemplate(),
      new ProfessionalA4Template(),
      new Presentation16x9Template()
    ];

    templateInstances.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get all available templates
   */
  public getAvailableTemplates(): ProposalTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): ProposalTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: string): ProposalTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  /**
   * Generate PDF using specific template
   */
  public generatePDF(templateId: string, data: ProposalData): jsPDF | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      logError('Template não encontrado', 'ProposalTemplateManager', { templateId });
      return null;
    }

    try {
      return template.generatePDF(data);
    } catch (error) {
      logError('Erro ao gerar PDF com template', 'ProposalTemplateManager', { templateId, error: error instanceof Error ? error.message : 'Erro desconhecido' });
      return null;
    }
  }

  /**
   * Download PDF using specific template
   */
  public downloadPDF(templateId: string, data: ProposalData, filename?: string): boolean {
    const pdf = this.generatePDF(templateId, data);
    if (!pdf) return false;

    const fileName = filename || `Proposta_${data.lead.name.replace(/\s+/g, '_')}_${templateId}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    return true;
  }

  /**
   * Get PDF as blob using specific template
   */
  public getPDFBlob(templateId: string, data: ProposalData): Blob | null {
    const pdf = this.generatePDF(templateId, data);
    if (!pdf) return null;

    return pdf.output('blob');
  }

  /**
   * Get PDF as data URL using specific template
   */
  public getPDFDataURL(templateId: string, data: ProposalData): string | null {
    const pdf = this.generatePDF(templateId, data);
    if (!pdf) return null;

    return pdf.output('dataurlstring');
  }

  /**
   * Preview PDF using specific template
   */
  public async previewPDF(templateId: string, data: ProposalData): Promise<string | null> {
    const pdf = this.generatePDF(templateId, data);
    if (!pdf) return null;

    const blob = pdf.output('blob');
    return URL.createObjectURL(blob);
  }

  /**
   * Get template recommendations based on data
   */
  public getRecommendedTemplates(data: ProposalData): ProposalTemplate[] {
    const recommendations: ProposalTemplate[] = [];
    
    // Business logic for recommendations
    const roi = data.simulation.tir;
    const payback = data.simulation.payback;
    const investment = data.financial.valorFinal;
    
    // High ROI projects - recommend data-focused template
    if (roi > 20) {
      const dataTemplate = this.getTemplate('data-focused');
      if (dataTemplate) recommendations.push(dataTemplate);
    }
    
    // Quick payback - recommend AIDA for urgency
    if (payback < 5) {
      const aidaTemplate = this.getTemplate('aida');
      if (aidaTemplate) recommendations.push(aidaTemplate);
    }
    
    // High investment - recommend premium corporate
    if (investment > 50000) {
      const premiumTemplate = this.getTemplate('premium-corporate');
      if (premiumTemplate) recommendations.push(premiumTemplate);
    }
    
    // Always include standard as fallback
    const standardTemplate = this.getTemplate('standard');
    if (standardTemplate && !recommendations.find(t => t.id === 'standard')) {
      recommendations.push(standardTemplate);
    }
    
    // If no specific recommendations, return storytelling for engagement
    if (recommendations.length === 1) {
      const storytellingTemplate = this.getTemplate('storytelling');
      if (storytellingTemplate) recommendations.push(storytellingTemplate);
    }
    
    return recommendations;
  }

  /**
   * Validate template data
   */
  public validateData(data: ProposalData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.lead?.name) {
      errors.push('Nome do cliente é obrigatório');
    }
    
    if (!data.simulation?.potencia || data.simulation.potencia <= 0) {
      errors.push('Potência do sistema deve ser maior que zero');
    }
    
    if (!data.simulation?.geracaoAnual || data.simulation.geracaoAnual <= 0) {
      errors.push('Geração anual deve ser maior que zero');
    }
    
    if (!data.financial?.valorFinal || data.financial.valorFinal <= 0) {
      errors.push('Valor final do sistema deve ser maior que zero');
    }
    
    if (!data.simulation?.payback || data.simulation.payback <= 0) {
      errors.push('Payback deve ser maior que zero');
    }
    
    if (!data.simulation?.tir || data.simulation.tir <= 0) {
      errors.push('TIR deve ser maior que zero');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get template statistics
   */
  public getTemplateStats(): { [key: string]: unknown } {
    const templates = this.getAvailableTemplates();
    const categories = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return {
      totalTemplates: templates.length,
      categories,
      templateList: templates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description
      }))
    };
  }
}

// Export singleton instance
export const proposalTemplateManager = ProposalTemplateManager.getInstance();