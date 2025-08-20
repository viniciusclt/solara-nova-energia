import { supabase } from '../integrations/supabase/client';
import type {
  ProposalElement,
  CreateElementRequest,
  UpdateElementRequest,
  ElementType,
  Position,
  ValidationResult,
  ValidationError
} from '../types/proposal-editor';

export class ProposalElementService {
  /**
   * Buscar todos os elementos de um template
   */
  static async getElementsByTemplateId(templateId: string): Promise<ProposalElement[]> {
    try {
      const { data, error } = await supabase
        .from('proposal_elements')
        .select('*')
        .eq('template_id', templateId)
        .order('z_index', { ascending: true });

      if (error) {
        console.error('Erro ao buscar elementos:', error);
        throw new Error('Falha ao carregar elementos do template');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no ProposalElementService.getElementsByTemplateId:', error);
      throw error;
    }
  }

  /**
   * Buscar elemento por ID
   */
  static async getElementById(id: string): Promise<ProposalElement | null> {
    try {
      const { data, error } = await supabase
        .from('proposal_elements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Elemento não encontrado
        }
        console.error('Erro ao buscar elemento:', error);
        throw new Error('Falha ao carregar elemento');
      }

      return data;
    } catch (error) {
      console.error('Erro no ProposalElementService.getElementById:', error);
      throw error;
    }
  }

  /**
   * Criar novo elemento
   */
  static async createElement(elementData: CreateElementRequest): Promise<ProposalElement> {
    try {
      // Validar dados do elemento
      const validation = this.validateElement(elementData);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Se z_index não foi fornecido, calcular o próximo disponível
      let zIndex = elementData.z_index;
      if (zIndex === undefined) {
        const { data: maxZIndex } = await supabase
          .from('proposal_elements')
          .select('z_index')
          .eq('template_id', elementData.template_id)
          .order('z_index', { ascending: false })
          .limit(1)
          .single();

        zIndex = (maxZIndex?.z_index || 0) + 1;
      }

      const { data, error } = await supabase
        .from('proposal_elements')
        .insert({
          ...elementData,
          z_index: zIndex
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar elemento:', error);
        throw new Error('Falha ao criar elemento');
      }

      return data;
    } catch (error) {
      console.error('Erro no ProposalElementService.createElement:', error);
      throw error;
    }
  }

  /**
   * Atualizar elemento existente
   */
  static async updateElement(
    id: string,
    updates: UpdateElementRequest
  ): Promise<ProposalElement> {
    try {
      const { data, error } = await supabase
        .from('proposal_elements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar elemento:', error);
        throw new Error('Falha ao atualizar elemento');
      }

      return data;
    } catch (error) {
      console.error('Erro no ProposalElementService.updateElement:', error);
      throw error;
    }
  }

  /**
   * Deletar elemento
   */
  static async deleteElement(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('proposal_elements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar elemento:', error);
        throw new Error('Falha ao deletar elemento');
      }
    } catch (error) {
      console.error('Erro no ProposalElementService.deleteElement:', error);
      throw error;
    }
  }

  /**
   * Atualizar posição de um elemento
   */
  static async updateElementPosition(
    id: string,
    position: Partial<Position>
  ): Promise<ProposalElement> {
    try {
      return await this.updateElement(id, { position });
    } catch (error) {
      console.error('Erro no ProposalElementService.updateElementPosition:', error);
      throw error;
    }
  }

  /**
   * Atualizar z-index de um elemento
   */
  static async updateElementZIndex(
    id: string,
    zIndex: number
  ): Promise<ProposalElement> {
    try {
      return await this.updateElement(id, { z_index: zIndex });
    } catch (error) {
      console.error('Erro no ProposalElementService.updateElementZIndex:', error);
      throw error;
    }
  }

  /**
   * Duplicar elemento
   */
  static async duplicateElement(
    id: string,
    offset?: { x: number; y: number }
  ): Promise<ProposalElement> {
    try {
      const originalElement = await this.getElementById(id);
      if (!originalElement) {
        throw new Error('Elemento não encontrado');
      }

      // Calcular nova posição
      const newPosition = {
        ...originalElement.position,
        x: originalElement.position.x + (offset?.x || 20),
        y: originalElement.position.y + (offset?.y || 20)
      };

      // Criar elemento duplicado
      const duplicatedElement = await this.createElement({
        template_id: originalElement.template_id,
        element_type: originalElement.element_type,
        properties: originalElement.properties,
        position: newPosition
      });

      return duplicatedElement;
    } catch (error) {
      console.error('Erro no ProposalElementService.duplicateElement:', error);
      throw error;
    }
  }

  /**
   * Reordenar elementos (atualizar z-index em lote)
   */
  static async reorderElements(
    elements: { id: string; z_index: number }[]
  ): Promise<void> {
    try {
      const updates = elements.map(element => 
        supabase
          .from('proposal_elements')
          .update({ z_index: element.z_index })
          .eq('id', element.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Erro no ProposalElementService.reorderElements:', error);
      throw error;
    }
  }

  /**
   * Mover elemento para frente
   */
  static async bringToFront(id: string): Promise<ProposalElement> {
    try {
      const element = await this.getElementById(id);
      if (!element) {
        throw new Error('Elemento não encontrado');
      }

      // Buscar maior z-index do template
      const { data: maxZIndex } = await supabase
        .from('proposal_elements')
        .select('z_index')
        .eq('template_id', element.template_id)
        .order('z_index', { ascending: false })
        .limit(1)
        .single();

      const newZIndex = (maxZIndex?.z_index || 0) + 1;
      return await this.updateElementZIndex(id, newZIndex);
    } catch (error) {
      console.error('Erro no ProposalElementService.bringToFront:', error);
      throw error;
    }
  }

  /**
   * Mover elemento para trás
   */
  static async sendToBack(id: string): Promise<ProposalElement> {
    try {
      const element = await this.getElementById(id);
      if (!element) {
        throw new Error('Elemento não encontrado');
      }

      // Buscar menor z-index do template
      const { data: minZIndex } = await supabase
        .from('proposal_elements')
        .select('z_index')
        .eq('template_id', element.template_id)
        .order('z_index', { ascending: true })
        .limit(1)
        .single();

      const newZIndex = Math.min((minZIndex?.z_index || 0) - 1, 0);
      return await this.updateElementZIndex(id, newZIndex);
    } catch (error) {
      console.error('Erro no ProposalElementService.sendToBack:', error);
      throw error;
    }
  }

  /**
   * Buscar elementos por tipo
   */
  static async getElementsByType(
    templateId: string,
    elementType: ElementType
  ): Promise<ProposalElement[]> {
    try {
      const { data, error } = await supabase
        .from('proposal_elements')
        .select('*')
        .eq('template_id', templateId)
        .eq('element_type', elementType)
        .order('z_index', { ascending: true });

      if (error) {
        console.error('Erro ao buscar elementos por tipo:', error);
        throw new Error('Falha ao carregar elementos');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no ProposalElementService.getElementsByType:', error);
      throw error;
    }
  }

  /**
   * Validar dados do elemento
   */
  static validateElement(elementData: CreateElementRequest): ValidationResult {
    const errors: ValidationError[] = [];

    // Validar template_id
    if (!elementData.template_id) {
      errors.push({
        field: 'template_id',
        message: 'ID do template é obrigatório',
        severity: 'error'
      });
    }

    // Validar element_type
    if (!Object.values(ElementType).includes(elementData.element_type)) {
      errors.push({
        field: 'element_type',
        message: 'Tipo de elemento inválido',
        severity: 'error'
      });
    }

    // Validar position
    if (!elementData.position) {
      errors.push({
        field: 'position',
        message: 'Posição do elemento é obrigatória',
        severity: 'error'
      });
    } else {
      const { x, y, width, height } = elementData.position;
      
      if (typeof x !== 'number' || x < 0) {
        errors.push({
          field: 'position.x',
          message: 'Posição X deve ser um número não negativo',
          severity: 'error'
        });
      }

      if (typeof y !== 'number' || y < 0) {
        errors.push({
          field: 'position.y',
          message: 'Posição Y deve ser um número não negativo',
          severity: 'error'
        });
      }

      if (typeof width !== 'number' || width <= 0) {
        errors.push({
          field: 'position.width',
          message: 'Largura deve ser um número positivo',
          severity: 'error'
        });
      }

      if (typeof height !== 'number' || height <= 0) {
        errors.push({
          field: 'position.height',
          message: 'Altura deve ser um número positivo',
          severity: 'error'
        });
      }
    }

    // Validar properties baseado no tipo
    if (!elementData.properties) {
      errors.push({
        field: 'properties',
        message: 'Propriedades do elemento são obrigatórias',
        severity: 'error'
      });
    } else {
      // Validações específicas por tipo de elemento
      switch (elementData.element_type) {
        case ElementType.TEXT:
          if (!elementData.properties.content) {
            errors.push({
              field: 'properties.content',
              message: 'Conteúdo do texto é obrigatório',
              severity: 'error'
            });
          }
          break;

        case ElementType.IMAGE:
          if (!elementData.properties.src) {
            errors.push({
              field: 'properties.src',
              message: 'URL da imagem é obrigatória',
              severity: 'error'
            });
          }
          break;

        case ElementType.CHART:
          if (!elementData.properties.type || !elementData.properties.data) {
            errors.push({
              field: 'properties',
              message: 'Tipo e dados do gráfico são obrigatórios',
              severity: 'error'
            });
          }
          break;

        case ElementType.TABLE:
          if (!elementData.properties.headers || !elementData.properties.rows) {
            errors.push({
              field: 'properties',
              message: 'Cabeçalhos e linhas da tabela são obrigatórios',
              severity: 'error'
            });
          }
          break;

        case ElementType.SHAPE:
          if (!elementData.properties.type) {
            errors.push({
              field: 'properties.type',
              message: 'Tipo da forma é obrigatório',
              severity: 'error'
            });
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verificar colisão entre elementos
   */
  static checkCollision(element1: Position, element2: Position): boolean {
    return !(
      element1.x + element1.width < element2.x ||
      element2.x + element2.width < element1.x ||
      element1.y + element1.height < element2.y ||
      element2.y + element2.height < element1.y
    );
  }

  /**
   * Alinhar elementos
   */
  static async alignElements(
    elementIds: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): Promise<ProposalElement[]> {
    try {
      if (elementIds.length < 2) {
        throw new Error('Pelo menos 2 elementos são necessários para alinhamento');
      }

      // Buscar elementos
      const elements = await Promise.all(
        elementIds.map(id => this.getElementById(id))
      );

      const validElements = elements.filter(Boolean) as ProposalElement[];
      
      if (validElements.length < 2) {
        throw new Error('Elementos não encontrados');
      }

      // Calcular posições de alinhamento
      const positions = validElements.map(el => el.position);
      let referenceValue: number;

      switch (alignment) {
        case 'left':
          referenceValue = Math.min(...positions.map(p => p.x));
          break;
        case 'center':
          const centerX = positions.map(p => p.x + p.width / 2);
          referenceValue = centerX.reduce((a, b) => a + b) / centerX.length;
          break;
        case 'right':
          referenceValue = Math.max(...positions.map(p => p.x + p.width));
          break;
        case 'top':
          referenceValue = Math.min(...positions.map(p => p.y));
          break;
        case 'middle':
          const centerY = positions.map(p => p.y + p.height / 2);
          referenceValue = centerY.reduce((a, b) => a + b) / centerY.length;
          break;
        case 'bottom':
          referenceValue = Math.max(...positions.map(p => p.y + p.height));
          break;
        default:
          throw new Error('Tipo de alinhamento inválido');
      }

      // Atualizar posições
      const updatedElements = await Promise.all(
        validElements.map(element => {
          const newPosition = { ...element.position };

          switch (alignment) {
            case 'left':
              newPosition.x = referenceValue;
              break;
            case 'center':
              newPosition.x = referenceValue - newPosition.width / 2;
              break;
            case 'right':
              newPosition.x = referenceValue - newPosition.width;
              break;
            case 'top':
              newPosition.y = referenceValue;
              break;
            case 'middle':
              newPosition.y = referenceValue - newPosition.height / 2;
              break;
            case 'bottom':
              newPosition.y = referenceValue - newPosition.height;
              break;
          }

          return this.updateElementPosition(element.id, newPosition);
        })
      );

      return updatedElements;
    } catch (error) {
      console.error('Erro no ProposalElementService.alignElements:', error);
      throw error;
    }
  }
}