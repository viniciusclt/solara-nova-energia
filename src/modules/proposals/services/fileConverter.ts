import { 
  SupportedFileFormat, 
  DocumentStructure, 
  Template, 
  ConversionOptions, 
  ConversionResult,
  FileValidationResult,
  UploadProgress,
  TemplateMetadata
} from '../types/template';
import { ProposalElement } from '../../../types/proposal';
import { supabase } from '../../../lib/supabase';
import { logInfo, logError } from '../../../core/utils/logger';

class FileConverterService {
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly supportedFormats: SupportedFileFormat[] = ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'];

  /**
   * Valida se o arquivo pode ser processado
   */
  validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar tamanho do arquivo
    if (file.size > this.maxFileSize) {
      errors.push(`Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Verificar formato
    const format = this.detectFormat(file);
    if (!format) {
      errors.push('Formato de arquivo não suportado');
    }

    // Verificar se o arquivo não está corrompido
    if (file.size === 0) {
      errors.push('Arquivo vazio ou corrompido');
    }

    // Avisos para formatos específicos
    if (format === 'pdf') {
      warnings.push('PDFs podem ter limitações na extração de elementos editáveis');
    }

    if (format === 'doc') {
      warnings.push('Formato DOC legado pode ter compatibilidade limitada. Recomendamos DOCX');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        format: format || 'unknown' as SupportedFileFormat
      }
    };
  }

  /**
   * Detecta o formato do arquivo baseado na extensão e MIME type
   */
  private detectFormat(file: File): SupportedFileFormat | null {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Mapeamento de extensões
    const extensionMap: Record<string, SupportedFileFormat> = {
      'doc': 'doc',
      'docx': 'docx',
      'pdf': 'pdf',
      'ppt': 'ppt',
      'pptx': 'pptx',
      'xls': 'xls',
      'xlsx': 'xlsx'
    };

    // Mapeamento de MIME types
    const mimeMap: Record<string, SupportedFileFormat> = {
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/pdf': 'pdf',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
    };

    // Priorizar MIME type, depois extensão
    return mimeMap[mimeType] || (extension ? extensionMap[extension] : null) || null;
  }

  /**
   * Faz upload do arquivo para o storage
   */
  async uploadFile(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; path: string }> {
    try {
      logInfo('Iniciando upload de arquivo', 'FileConverter', { fileName: file.name, size: file.size });

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = `templates/uploads/${fileName}`;

      // Simular progresso de upload
      if (onProgress) {
        onProgress({
          loaded: 0,
          total: file.size,
          percentage: 0,
          stage: 'uploading',
          message: 'Iniciando upload...'
        });
      }

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
          stage: 'uploading',
          message: 'Upload concluído'
        });
      }

      logInfo('Upload concluído com sucesso', 'FileConverter', { filePath, url: publicUrl });

      return {
        url: publicUrl,
        path: filePath
      };
    } catch (error) {
      logError('Erro no upload do arquivo', 'FileConverter', error);
      throw error;
    }
  }

  /**
   * Converte documento para estrutura de template
   */
  async convertToTemplate(
    fileUrl: string,
    metadata: Partial<TemplateMetadata>,
    options: ConversionOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    
    try {
      logInfo('Iniciando conversão de documento', 'FileConverter', { fileUrl, options });

      if (onProgress) {
        onProgress({
          loaded: 0,
          total: 100,
          percentage: 0,
          stage: 'processing',
          message: 'Analisando documento...'
        });
      }

      // Simular análise do documento
      await this.delay(1000);
      
      if (onProgress) {
        onProgress({
          loaded: 25,
          total: 100,
          percentage: 25,
          stage: 'converting',
          message: 'Extraindo conteúdo...'
        });
      }

      // Extrair estrutura do documento (simulado)
      const structure = await this.extractDocumentStructure(fileUrl, options);
      
      if (onProgress) {
        onProgress({
          loaded: 60,
          total: 100,
          percentage: 60,
          stage: 'converting',
          message: 'Convertendo elementos...'
        });
      }

      // Converter para elementos de proposta
      const proposalElements = await this.convertToProposalElements(structure, options);
      
      if (onProgress) {
        onProgress({
          loaded: 85,
          total: 100,
          percentage: 85,
          stage: 'finalizing',
          message: 'Finalizando template...'
        });
      }

      // Criar template final
      const template: Template = {
        id: crypto.randomUUID(),
        metadata: {
          id: crypto.randomUUID(),
          name: metadata.name || 'Template Importado',
          description: metadata.description,
          category: metadata.category || 'custom',
          originalFormat: metadata.originalFormat || 'docx',
          fileSize: 0,
          uploadedAt: new Date(),
          uploadedBy: metadata.uploadedBy || 'unknown',
          tags: metadata.tags || [],
          usageCount: 0,
          isPublic: metadata.isPublic || false
        },
        structure,
        proposalElements,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (onProgress) {
        onProgress({
          loaded: 100,
          total: 100,
          percentage: 100,
          stage: 'finalizing',
          message: 'Conversão concluída'
        });
      }

      const processingTime = Date.now() - startTime;
      
      logInfo('Conversão concluída com sucesso', 'FileConverter', { 
        templateId: template.id, 
        processingTime 
      });

      return {
        success: true,
        template,
        warnings: [],
        processingTime,
        extractedElements: {
          textBlocks: structure.pages.reduce((acc, page) => 
            acc + page.content.filter(el => el.type === 'text').length, 0),
          images: structure.images.length,
          tables: structure.tables.length,
          charts: structure.pages.reduce((acc, page) => 
            acc + page.content.filter(el => el.type === 'chart').length, 0)
        }
      };
    } catch (error) {
      logError('Erro na conversão do documento', 'FileConverter', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na conversão',
        warnings: [],
        processingTime: Date.now() - startTime,
        extractedElements: {
          textBlocks: 0,
          images: 0,
          tables: 0,
          charts: 0
        }
      };
    }
  }

  /**
   * Extrai estrutura do documento (simulado)
   */
  private async extractDocumentStructure(
    fileUrl: string, 
    options: ConversionOptions
  ): Promise<DocumentStructure> {
    // Simular processamento
    await this.delay(2000);

    // Retornar estrutura simulada
    return {
      pages: [
        {
          pageNumber: 1,
          content: [
            {
              id: crypto.randomUUID(),
              type: 'text',
              position: { x: 50, y: 100, width: 500, height: 50 },
              content: 'Título do Documento',
              style: {
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            {
              id: crypto.randomUUID(),
              type: 'text',
              position: { x: 50, y: 200, width: 500, height: 200 },
              content: 'Conteúdo do documento extraído automaticamente...',
              style: {
                fontSize: 12,
                textAlign: 'left'
              }
            }
          ],
          dimensions: { width: 595, height: 842 } // A4
        }
      ],
      metadata: {
        title: 'Documento Importado',
        pageCount: 1,
        hasImages: false,
        hasTables: false,
        hasCharts: false
      },
      styles: [],
      images: [],
      tables: []
    };
  }

  /**
   * Converte estrutura para elementos de proposta
   */
  private async convertToProposalElements(
    structure: DocumentStructure,
    options: ConversionOptions
  ): Promise<ProposalElement[]> {
    const elements: ProposalElement[] = [];

    // Converter cada página
    structure.pages.forEach((page, pageIndex) => {
      page.content.forEach((element, elementIndex) => {
        const proposalElement: ProposalElement = {
          id: element.id,
          type: this.mapElementType(element.type),
          position: element.position,
          content: element.content,
          style: {
            fontSize: element.style.fontSize || 12,
            fontFamily: element.style.fontFamily || 'Arial',
            color: element.style.color || '#000000',
            backgroundColor: element.style.backgroundColor || 'transparent',
            textAlign: element.style.textAlign || 'left',
            fontWeight: element.style.fontWeight || 'normal',
            fontStyle: element.style.fontStyle || 'normal'
          },
          zIndex: elementIndex,
          locked: false,
          visible: true
        };

        elements.push(proposalElement);
      });
    });

    return elements;
  }

  /**
   * Mapeia tipos de elementos do documento para tipos de proposta
   */
  private mapElementType(documentType: string): ProposalElement['type'] {
    const typeMap: Record<string, ProposalElement['type']> = {
      'text': 'text',
      'image': 'image',
      'table': 'table',
      'chart': 'chart',
      'shape': 'shape',
      'line': 'line'
    };

    return typeMap[documentType] || 'text';
  }

  /**
   * Utilitário para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpa arquivos temporários
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      logInfo('Arquivo temporário removido', 'FileConverter', { filePath });
    } catch (error) {
      logError('Erro ao remover arquivo temporário', 'FileConverter', error);
    }
  }
}

export const fileConverter = new FileConverterService();
export default fileConverter;