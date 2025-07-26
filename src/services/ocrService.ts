import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface OCRSettings {
  language: string;
  psm: number;
  oem: number;
}

export interface OCRProgress {
  status: string;
  progress: number;
  page?: number;
  totalPages?: number;
}

export interface ExtractedField {
  key: string;
  value: string;
  confidence: number;
  pattern: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  extractedFields: ExtractedField[];
  processingTime: number;
  pages: number;
}

export class OCRService {
  private static instance: OCRService;
  private workers: Map<string, unknown> = new Map();

  private constructor() {}

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Converte PDF em imagens para processamento OCR
   */
  public async convertPDFToImages(file: File, scale: number = 2.0): Promise<HTMLCanvasElement[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: HTMLCanvasElement[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      images.push(canvas);
    }

    return images;
  }

  /**
   * Processa OCR em uma única imagem
   */
  public async processImageOCR(
    image: HTMLCanvasElement,
    settings: OCRSettings,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<{ text: string; confidence: number }> {
    const workerId = Math.random().toString(36).substr(2, 9);
    
    const worker = await createWorker({
      logger: m => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress({
            status: 'recognizing',
            progress: Math.round(m.progress * 100)
          });
        }
      }
    });

    this.workers.set(workerId, worker);

    try {
      await worker.loadLanguage(settings.language);
      await worker.initialize(settings.language);
      await worker.setParameters({
        tessedit_pageseg_mode: settings.psm.toString(),
        tessedit_ocr_engine_mode: settings.oem.toString()
      });

      const { data } = await worker.recognize(image);
      
      return {
        text: data.text,
        confidence: data.confidence
      };
    } finally {
      await worker.terminate();
      this.workers.delete(workerId);
    }
  }

  /**
   * Processa OCR em múltiplas imagens (PDF completo)
   */
  public async processPDFOCR(
    file: File,
    settings: OCRSettings,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    if (onProgress) {
      onProgress({ status: 'converting', progress: 0 });
    }

    // Converter PDF para imagens
    const images = await this.convertPDFToImages(file);
    
    if (onProgress) {
      onProgress({ status: 'processing', progress: 0, totalPages: images.length });
    }

    let fullText = '';
    let totalConfidence = 0;
    const extractedFields: ExtractedField[] = [];

    // Processar cada página
    for (let i = 0; i < images.length; i++) {
      const pageProgress = (i / images.length) * 100;
      
      if (onProgress) {
        onProgress({
          status: 'processing',
          progress: pageProgress,
          page: i + 1,
          totalPages: images.length
        });
      }

      const result = await this.processImageOCR(images[i], settings);
      fullText += result.text + '\n';
      totalConfidence += result.confidence;
    }

    const avgConfidence = totalConfidence / images.length;
    const processingTime = Date.now() - startTime;

    if (onProgress) {
      onProgress({ status: 'completed', progress: 100 });
    }

    return {
      text: fullText,
      confidence: avgConfidence,
      extractedFields,
      processingTime,
      pages: images.length
    };
  }

  /**
   * Extrai dados estruturados do texto usando patterns
   */
  public extractStructuredData(
    text: string,
    patterns: Record<string, RegExp[]>,
    equipmentType: string
  ): Record<string, unknown> {
    const extractedData: Record<string, unknown> = {};
    const extractedFields: ExtractedField[] = [];
    let totalMatches = 0;
    let successfulMatches = 0;

    Object.entries(patterns).forEach(([key, regexArray]) => {
      for (const regex of regexArray) {
        totalMatches++;
        const matches = text.match(regex);
        
        if (matches && matches.length > 0) {
          successfulMatches++;
          
          if (key === 'dimensoes') {
            // Processar dimensões especialmente
            const dimensionMatch = text.match(/([0-9,.]+)\s*(?:x|×|*)\s*([0-9,.]+)\s*(?:x|×|*)\s*([0-9,.]+)/gi);
            if (dimensionMatch) {
              const parts = dimensionMatch[0].split(/(?:x|×|\*)/);
              extractedData.dimensoes = {
                comprimento: parts[0]?.trim(),
                largura: parts[1]?.trim(),
                espessura: parts[2]?.trim()
              };
              
              extractedFields.push({
                key,
                value: JSON.stringify(extractedData.dimensoes),
                confidence: 85,
                pattern: regex.source
              });
            }
          } else if (key === 'certificacoes') {
            extractedData[key] = matches;
            extractedFields.push({
              key,
              value: matches.join(', '),
              confidence: 90,
              pattern: regex.source
            });
          } else {
            // Extrair o primeiro grupo de captura ou o match completo
            const match = matches[0];
            const numberMatch = match.match(/([0-9,.]+)/);
            const value = numberMatch ? numberMatch[1] : match.trim();
            
            extractedData[key] = value;
            extractedFields.push({
              key,
              value,
              confidence: 80,
              pattern: regex.source
            });
          }
          break;
        }
      }
    });

    extractedData.confidence = totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0;
    extractedData.extractedFields = extractedFields;
    extractedData.processedAt = new Date();
    extractedData.rawText = text;

    return extractedData;
  }

  /**
   * Obtém patterns de reconhecimento para diferentes tipos de equipamentos
   */
  public getEquipmentPatterns(type: 'module' | 'inverter' | 'battery'): Record<string, RegExp[]> {
    const basePatterns = {
      nome: [
        /(?:model|modelo|type|tipo)\s*:?\s*([A-Z0-9][A-Z0-9\-\s]{2,30})/gi,
        /^([A-Z0-9][A-Z0-9\-\s]{2,30})(?:\s|$)/gm
      ],
      fabricante: [
        /(?:manufacturer|fabricante|marca|brand)\s*:?\s*([A-Za-z\s]{2,30})/gi,
        /(?:jinko|canadian solar|trina|ja solar|longi|risen|astronergy|seraphim|hanwha|rec|lg|panasonic|sunpower|first solar|yingli|sharp|kyocera|sanyo|mitsubishi|bp solar|shell|siemens|abb|sma|fronius|huawei|growatt|goodwe|solaredge|enphase|power one|schneider|delta|kaco|kostal|refusol|sungrow|ginlong|omnik|samil|zeversolar|chint|tbea|kehua|east group|saj|sofar|must|voltronic|victron|outback|magnum|xantrex|morningstar|midnite|schneider|studer|selectronic)\b/gi
      ],
      potencia: [
        /(?:power|potência|puissance|pmax|p-max|maximum power|rated power)\s*:?\s*([0-9,.]+)\s*(?:w|wp|watt|watts|kw|kwp)/gi,
        /([0-9,.]+)\s*(?:w|wp|watt|watts|kw|kwp)\s*(?:power|potência|puissance|pmax|p-max)/gi,
        /([0-9,.]+)\s*(?:w|wp)(?!\w)/gi
      ],
      tensaoVoc: [
        /(?:voc|v-oc|open circuit voltage|tensão circuito aberto|tension circuit ouvert)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi,
        /([0-9,.]+)\s*(?:v|volt|volts)\s*(?:voc|v-oc)/gi
      ],
      tensaoVmp: [
        /(?:vmp|v-mp|vmpp|voltage at maximum power|tensão potência máxima|tension puissance maximale)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi,
        /([0-9,.]+)\s*(?:v|volt|volts)\s*(?:vmp|v-mp|vmpp)/gi
      ],
      correnteIsc: [
        /(?:isc|i-sc|short circuit current|corrente curto circuito|courant court-circuit)\s*:?\s*([0-9,.]+)\s*(?:a|amp|ampere|amperes)/gi,
        /([0-9,.]+)\s*(?:a|amp|ampere|amperes)\s*(?:isc|i-sc)/gi
      ],
      correnteImp: [
        /(?:imp|i-mp|impp|current at maximum power|corrente potência máxima|courant puissance maximale)\s*:?\s*([0-9,.]+)\s*(?:a|amp|ampere|amperes)/gi,
        /([0-9,.]+)\s*(?:a|amp|ampere|amperes)\s*(?:imp|i-mp|impp)/gi
      ],
      eficiencia: [
        /(?:efficiency|eficiência|rendement|η)\s*:?\s*([0-9,.]+)\s*%/gi,
        /([0-9,.]+)\s*%\s*(?:efficiency|eficiência|rendement)/gi
      ],
      peso: [
        /(?:weight|peso|poids|mass|massa)\s*:?\s*([0-9,.]+)\s*(?:kg|kilogram|kilograms)/gi,
        /([0-9,.]+)\s*(?:kg|kilogram|kilograms)\s*(?:weight|peso|poids)/gi
      ],
      dimensoes: [
        /(?:dimensions|dimensões|taille|size)\s*:?\s*([0-9,.]+)\s*(?:x|×|*)\s*([0-9,.]+)\s*(?:x|×|*)\s*([0-9,.]+)\s*(?:mm|cm|m)/gi,
        /([0-9,.]+)\s*(?:mm|cm|m)\s*(?:x|×|*)\s*([0-9,.]+)\s*(?:mm|cm|m)\s*(?:x|×|*)\s*([0-9,.]+)\s*(?:mm|cm|m)/gi
      ],
      garantiasProduto: [
        /(?:product warranty|garantia produto|garantie produit)\s*:?\s*([0-9]+)\s*(?:years|anos|ans)/gi,
        /([0-9]+)\s*(?:years|anos|ans)\s*(?:product warranty|garantia produto|garantie produit)/gi
      ],
      garantiasPerformance: [
        /(?:performance warranty|garantia performance|garantie performance|linear warranty)\s*:?\s*([0-9]+)\s*(?:years|anos|ans)/gi,
        /([0-9]+)\s*(?:years|anos|ans)\s*(?:performance warranty|garantia performance|garantie performance)/gi
      ],
      certificacoes: [
        /(?:iec|ul|ce|inmetro|aneel|tuv|cec|csa|mcs|pvqt|esti|jis|cnca|cgc|bis|soncap|sabs|kc|psc|ncc|as\/nzs)\s*[0-9-\s]*/gi
      ],
      tecnologia: [
        /(?:monocrystalline|polycrystalline|mono|poly|crystalline|silicon|monocristalino|policristalino|amorfo|perc|topcon|hjt|heterojunction|bifacial)/gi
      ]
    };

    // Patterns específicos para inversores
    if (type === 'inverter') {
      return {
        ...basePatterns,
        potenciaDC: [
          /(?:dc power|potência dc|puissance dc|max dc power)\s*:?\s*([0-9,.]+)\s*(?:w|wp|kw|kwp)/gi
        ],
        potenciaAC: [
          /(?:ac power|potência ac|puissance ac|rated ac power)\s*:?\s*([0-9,.]+)\s*(?:w|wp|kw|kwp)/gi
        ],
        tensaoDC: [
          /(?:dc voltage|tensão dc|tension dc|max dc voltage|mppt range)\s*:?\s*([0-9,.-]+)\s*(?:v|volt|volts)/gi
        ],
        tensaoAC: [
          /(?:ac voltage|tensão ac|tension ac|nominal ac voltage)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi
        ],
        frequencia: [
          /(?:frequency|frequência|fréquence)\s*:?\s*([0-9,.]+)\s*(?:hz|hertz)/gi
        ],
        fases: [
          /(?:phases|fases|phase)\s*:?\s*([0-9]+)/gi,
          /(single phase|three phase|monofásico|bifásico|trifásico|1ph|3ph)/gi
        ]
      };
    }

    // Patterns específicos para baterias
    if (type === 'battery') {
      return {
        ...basePatterns,
        capacidade: [
          /(?:capacity|capacidade|capacité)\s*:?\s*([0-9,.]+)\s*(?:ah|kwh|wh)/gi
        ],
        tensaoNominal: [
          /(?:nominal voltage|tensão nominal|tension nominale)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi
        ],
        ciclosVida: [
          /(?:cycle life|ciclos vida|cycles de vie|life cycles)\s*:?\s*([0-9,.]+)/gi
        ],
        profundidadeDescarga: [
          /(?:dod|depth of discharge|profundidade descarga|profondeur décharge)\s*:?\s*([0-9,.]+)\s*%/gi
        ]
      };
    }

    return basePatterns;
  }

  /**
   * Processa um arquivo PDF completo com extração de dados estruturados
   */
  public async processEquipmentDatasheet(
    file: File,
    equipmentType: 'module' | 'inverter' | 'battery',
    settings: OCRSettings,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<{
    text: string;
    confidence: number;
    extractedData: Record<string, unknown>;
    processingTime: number;
    pages: number;
  }> {
    // Processar OCR
    const ocrResult = await this.processPDFOCR(file, settings, onProgress);
    
    // Extrair dados estruturados
    const patterns = this.getEquipmentPatterns(equipmentType);
    const extractedData = this.extractStructuredData(
      ocrResult.text,
      patterns,
      equipmentType
    );

    return {
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      extractedData,
      processingTime: ocrResult.processingTime,
      pages: ocrResult.pages
    };
  }

  /**
   * Termina todos os workers ativos
   */
  public async terminateAllWorkers(): Promise<void> {
    const promises = Array.from(this.workers.values()).map(worker => worker.terminate());
    await Promise.all(promises);
    this.workers.clear();
  }

  /**
   * Valida se um arquivo é um PDF válido
   */
  public async validatePDF(file: File): Promise<{ valid: boolean; error?: string; pages?: number }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      return {
        valid: true,
        pages: pdf.numPages
      };
    } catch (error: unknown) {
      return {
        valid: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Otimiza imagem para melhor reconhecimento OCR
   */
  public optimizeImageForOCR(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Converter para escala de cinza e aumentar contraste
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Aumentar contraste
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
      
      data[i] = newGray;     // R
      data[i + 1] = newGray; // G
      data[i + 2] = newGray; // B
      // Alpha permanece o mesmo
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}

// Exportar instância singleton
export const ocrService = OCRService.getInstance();