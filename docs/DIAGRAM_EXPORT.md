# Sistema de Exportação de Diagramas

## Visão Geral

O sistema de exportação permite aos usuários exportar seus diagramas em múltiplos formatos com configurações avançadas e presets personalizáveis.

## Formatos Suportados

### Imagens Raster
- **PNG**: Formato padrão com transparência
- **JPEG**: Formato comprimido para tamanhos menores
- **WebP**: Formato moderno com melhor compressão

### Imagens Vetoriais
- **SVG**: Formato vetorial escalável

### Documentos
- **PDF**: Documento portátil com múltiplas opções de layout

### Dados
- **JSON**: Exportação dos dados estruturados do diagrama

## Arquitetura

### Componentes Principais

#### DiagramExportService
- **Localização**: `src/services/DiagramExportService.ts`
- **Responsabilidade**: Lógica central de exportação
- **Funcionalidades**:
  - Exportação em todos os formatos suportados
  - Gerenciamento de presets
  - Validação de configurações
  - Geração de previews
  - Estimativa de tamanho de arquivo

#### ExportDialog
- **Localização**: `src/components/diagrams/ExportDialog.tsx`
- **Responsabilidade**: Interface de usuário para exportação
- **Funcionalidades**:
  - Configuração de formato e qualidade
  - Gerenciamento de presets
  - Preview em tempo real
  - Indicador de progresso

#### Tipos TypeScript
- **Localização**: `src/types/diagramExport.ts`
- **Responsabilidade**: Definições de tipos para exportação

## Configurações de Exportação

### Configurações de Imagem
```typescript
interface ImageExportConfig {
  quality: number;        // 0.1 - 1.0
  scale: number;         // 1 - 5
  backgroundColor: string;
  pixelRatio: number;    // 1 - 3
}
```

### Configurações de SVG
```typescript
interface SVGExportConfig {
  includeStyles: boolean;
  embedFonts: boolean;
  optimizeSize: boolean;
}
```

### Configurações de PDF
```typescript
interface PDFExportConfig {
  format: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margin: number;
  fitToPage: boolean;
  includeMetadata: boolean;
}
```

## Presets de Exportação

### Presets Padrão

#### Web Optimized
- **Formato**: PNG
- **Qualidade**: 0.8
- **Escala**: 1x
- **Uso**: Publicação web, redes sociais

#### Print Quality
- **Formato**: PDF
- **Resolução**: 300 DPI
- **Formato**: A4
- **Uso**: Impressão profissional

#### High Resolution
- **Formato**: PNG
- **Qualidade**: 1.0
- **Escala**: 3x
- **Uso**: Apresentações, materiais de marketing

#### Vector Graphics
- **Formato**: SVG
- **Estilos**: Incorporados
- **Fontes**: Incorporadas
- **Uso**: Edição posterior, escalabilidade

### Presets Personalizados

Os usuários podem criar e salvar seus próprios presets com configurações específicas.

## Integração no Editor

### Acesso via Toolbar
1. **Exportação Rápida**: Dropdown com formatos básicos
2. **Exportação Avançada**: Botão que abre o `ExportDialog`

### Fluxo de Exportação
1. Usuário seleciona "Exportação Avançada" na toolbar
2. `ExportDialog` é aberto com configurações padrão
3. Usuário configura formato, qualidade e outras opções
4. Preview é gerado automaticamente
5. Usuário confirma e inicia exportação
6. Arquivo é gerado e download iniciado

## Funcionalidades Avançadas

### Preview em Tempo Real
- Geração automática de preview ao alterar configurações
- Estimativa de tamanho de arquivo
- Indicação de qualidade visual

### Validação de Configurações
- Verificação de limites de qualidade e escala
- Validação de formatos de papel para PDF
- Alertas para configurações que podem causar problemas

### Otimização de Performance
- Debounce para geração de preview
- Cache de previews gerados
- Processamento assíncrono para arquivos grandes

### Tratamento de Erros
- Fallbacks para formatos não suportados
- Mensagens de erro específicas
- Retry automático para falhas temporárias

## Dependências

### Bibliotecas Principais
- **html-to-image**: Conversão de DOM para imagem
- **jspdf**: Geração de documentos PDF

### Componentes UI
- **@radix-ui/react-dialog**: Modal do ExportDialog
- **@radix-ui/react-tabs**: Abas de configuração
- **@radix-ui/react-select**: Seletores de formato
- **@radix-ui/react-slider**: Controles de qualidade

## Uso no Código

### Exportação Programática
```typescript
import { DiagramExportService } from '@/services/DiagramExportService';

const exportService = new DiagramExportService();

// Exportar como PNG
const result = await exportService.exportDiagram(
  diagramElement,
  {
    format: 'png',
    imageConfig: {
      quality: 0.9,
      scale: 2,
      backgroundColor: '#ffffff'
    }
  }
);
```

### Gerenciamento de Presets
```typescript
// Salvar preset personalizado
const preset: ExportPreset = {
  id: 'my-preset',
  name: 'Meu Preset',
  format: 'pdf',
  config: { /* configurações */ }
};

exportService.savePreset(preset);

// Usar preset
const result = await exportService.exportWithPreset(
  diagramElement,
  'my-preset'
);
```

## Extensibilidade

### Adicionando Novos Formatos
1. Estender o tipo `ExportFormat`
2. Adicionar configurações específicas
3. Implementar método de exportação no service
4. Atualizar interface do `ExportDialog`

### Personalizando Presets
- Presets são salvos no `localStorage`
- Estrutura extensível para novas propriedades
- Validação automática de configurações

## Considerações de Performance

### Otimizações Implementadas
- Geração assíncrona de previews
- Debounce para evitar processamento excessivo
- Cache de resultados quando possível
- Processamento em Web Workers (futuro)

### Limitações
- Diagramas muito grandes podem causar lentidão
- Exportação PDF com muitos elementos pode ser lenta
- Browsers têm limites de memória para imagens grandes

## Próximos Passos

### Melhorias Planejadas
1. **Exportação em Lote**: Múltiplos diagramas simultaneamente
2. **Watermarks**: Adição de marcas d'água personalizáveis
3. **Compressão Avançada**: Otimização automática de tamanho
4. **Exportação para Cloud**: Integração com serviços de armazenamento
5. **Templates de Exportação**: Layouts pré-definidos para diferentes usos
6. **Exportação Programada**: Agendamento de exportações automáticas

### Integrações Futuras
- **API de Impressão**: Envio direto para impressoras
- **Serviços de Email**: Anexo automático em emails
- **Plataformas de Colaboração**: Integração com Slack, Teams, etc.
- **Sistemas de Versionamento**: Controle de versões de exportações

## Troubleshooting

### Problemas Comuns

#### Exportação Falha
- Verificar se o diagrama está visível na tela
- Reduzir escala ou qualidade
- Tentar formato diferente

#### Preview Não Carrega
- Verificar console para erros JavaScript
- Limpar cache do navegador
- Recarregar página

#### Arquivo Muito Grande
- Reduzir escala de exportação
- Diminuir qualidade (para imagens)
- Usar formato mais eficiente (SVG para vetores)

#### Qualidade Ruim
- Aumentar escala de exportação
- Usar formato vetorial (SVG)
- Verificar configurações de qualidade