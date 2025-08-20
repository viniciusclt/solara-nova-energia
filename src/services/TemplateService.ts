import { supabase } from '../integrations/supabase/client';
import type {
  ProposalTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateFormat,
  TemplateLibrary
} from '../types/proposal-editor';

export class TemplateService {
  /**
   * Buscar todos os templates disponíveis
   */
  static async getTemplates(options?: {
    format?: TemplateFormat;
    isPublic?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<TemplateLibrary> {
    try {
      let query = supabase
        .from('proposal_templates')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (options?.format) {
        query = query.eq('format', options.format);
      }

      if (options?.isPublic !== undefined) {
        query = query.eq('is_public', options.isPublic);
      }

      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      // Paginação
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar templates:', error);
        throw new Error('Falha ao carregar templates');
      }

      return {
        templates: data || [],
        categories: [], // TODO: Implementar categorias
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro no TemplateService.getTemplates:', error);
      throw error;
    }
  }

  /**
   * Buscar template por ID
   */
  static async getTemplateById(id: string): Promise<ProposalTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Template não encontrado
        }
        console.error('Erro ao buscar template:', error);
        throw new Error('Falha ao carregar template');
      }

      return data;
    } catch (error) {
      console.error('Erro no TemplateService.getTemplateById:', error);
      throw error;
    }
  }

  /**
   * Criar novo template
   */
  static async createTemplate(templateData: CreateTemplateRequest): Promise<ProposalTemplate> {
    try {
      // Obter dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar perfil do usuário para obter company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('proposal_templates')
        .insert({
          ...templateData,
          company_id: profile?.company_id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar template:', error);
        throw new Error('Falha ao criar template');
      }

      return data;
    } catch (error) {
      console.error('Erro no TemplateService.createTemplate:', error);
      throw error;
    }
  }

  /**
   * Atualizar template existente
   */
  static async updateTemplate(
    id: string,
    updates: UpdateTemplateRequest
  ): Promise<ProposalTemplate> {
    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar template:', error);
        throw new Error('Falha ao atualizar template');
      }

      return data;
    } catch (error) {
      console.error('Erro no TemplateService.updateTemplate:', error);
      throw error;
    }
  }

  /**
   * Deletar template
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('proposal_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar template:', error);
        throw new Error('Falha ao deletar template');
      }
    } catch (error) {
      console.error('Erro no TemplateService.deleteTemplate:', error);
      throw error;
    }
  }

  /**
   * Duplicar template
   */
  static async duplicateTemplate(
    id: string,
    newName?: string
  ): Promise<ProposalTemplate> {
    try {
      // Buscar template original
      const originalTemplate = await this.getTemplateById(id);
      if (!originalTemplate) {
        throw new Error('Template não encontrado');
      }

      // Buscar elementos do template original
      const { data: elements } = await supabase
        .from('proposal_elements')
        .select('*')
        .eq('template_id', id);

      // Criar novo template
      const duplicatedTemplate = await this.createTemplate({
        name: newName || `${originalTemplate.name} (Cópia)`,
        format: originalTemplate.format,
        canvas_data: originalTemplate.canvas_data,
        is_public: false // Cópias são sempre privadas inicialmente
      });

      // Duplicar elementos se existirem
      if (elements && elements.length > 0) {
        const elementsToInsert = elements.map(element => ({
          template_id: duplicatedTemplate.id,
          element_type: element.element_type,
          properties: element.properties,
          position: element.position,
          z_index: element.z_index
        }));

        const { error: elementsError } = await supabase
          .from('proposal_elements')
          .insert(elementsToInsert);

        if (elementsError) {
          console.error('Erro ao duplicar elementos:', elementsError);
          // Não falhar completamente, apenas logar o erro
        }
      }

      return duplicatedTemplate;
    } catch (error) {
      console.error('Erro no TemplateService.duplicateTemplate:', error);
      throw error;
    }
  }

  /**
   * Buscar templates públicos (para galeria)
   */
  static async getPublicTemplates(options?: {
    format?: TemplateFormat;
    page?: number;
    limit?: number;
  }): Promise<TemplateLibrary> {
    return this.getTemplates({
      ...options,
      isPublic: true
    });
  }

  /**
   * Buscar templates da empresa do usuário
   */
  static async getCompanyTemplates(options?: {
    format?: TemplateFormat;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<TemplateLibrary> {
    return this.getTemplates({
      ...options,
      isPublic: false
    });
  }

  /**
   * Gerar thumbnail do template
   */
  static async generateThumbnail(
    templateId: string,
    thumbnailData: string
  ): Promise<string> {
    try {
      // Converter base64 para blob
      const response = await fetch(thumbnailData);
      const blob = await response.blob();

      // Upload para storage
      const fileName = `template-${templateId}-${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('proposal-thumbnails')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('Erro ao fazer upload do thumbnail:', error);
        throw new Error('Falha ao salvar thumbnail');
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('proposal-thumbnails')
        .getPublicUrl(data.path);

      // Atualizar template com URL do thumbnail
      await this.updateTemplate(templateId, {
        thumbnail_url: publicUrl
      });

      return publicUrl;
    } catch (error) {
      console.error('Erro no TemplateService.generateThumbnail:', error);
      throw error;
    }
  }

  /**
   * Validar dados do template
   */
  static validateTemplate(templateData: CreateTemplateRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Nome do template é obrigatório');
    }

    if (templateData.name && templateData.name.length > 255) {
      errors.push('Nome do template deve ter no máximo 255 caracteres');
    }

    if (!Object.values(TemplateFormat).includes(templateData.format)) {
      errors.push('Formato do template inválido');
    }

    if (!templateData.canvas_data) {
      errors.push('Dados do canvas são obrigatórios');
    }

    if (templateData.canvas_data) {
      if (!templateData.canvas_data.width || templateData.canvas_data.width <= 0) {
        errors.push('Largura do canvas deve ser maior que zero');
      }

      if (!templateData.canvas_data.height || templateData.canvas_data.height <= 0) {
        errors.push('Altura do canvas deve ser maior que zero');
      }

      if (!templateData.canvas_data.background) {
        errors.push('Cor de fundo do canvas é obrigatória');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}