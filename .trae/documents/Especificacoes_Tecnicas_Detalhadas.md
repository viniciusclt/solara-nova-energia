# ESPECIFICAÇÕES TÉCNICAS DETALHADAS - SOLARA NOVA ENERGIA

## Guia de Implementação para Desenvolvedores

## 1. Arquitetura Geral do Sistema

### 1.1 Stack Tecnológico Atualizado

```typescript
// Dependências principais
const techStack = {
  frontend: {
    framework: 'React 18.2+',
    language: 'TypeScript 5.0+',
    bundler: 'Vite 5.0+',
    styling: 'Tailwind CSS 3.4+',
    stateManagement: 'Zustand 4.4+',
    animations: 'Framer Motion 10.0+',
    dragDrop: '@dnd-kit/core 6.0+',
    diagrams: 'React Flow 11.0+',
    charts: 'Recharts 2.8+'
  },
  backend: {
    database: 'Supabase (PostgreSQL 15)',
    auth: 'Supabase Auth',
    storage: 'Supabase Storage + Bunny.net CDN',
    realtime: 'Supabase Realtime',
    functions: 'Supabase Edge Functions'
  },
  deployment: {
    frontend: 'Vercel',
    cdn: 'Bunny.net',
    monitoring: 'Vercel Analytics + Sentry'
  }
};
```

### 1.2 Estrutura de Diretórios Reorganizada

```
src/
├── core/                           # 🎯 Código principal enxuto
│   ├── components/                 # Componentes essenciais
│   │   ├── ui/                    # Componentes base do design system
│   │   ├── layout/                # Layouts principais
│   │   └── common/                # Componentes compartilhados
│   ├── hooks/                     # Hooks customizados
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   ├── services/                  # Serviços principais
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── storage.ts
│   ├── types/                     # Tipos TypeScript globais
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   └── common.ts
│   └── utils/                     # Utilitários essenciais
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
├── modules/                        # 📦 Módulos específicos
│   ├── solar/                     # Módulo fotovoltaico
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── training/                  # Módulo de treinamento
│   │   ├── components/
│   │   │   ├── video/            # Sistema de vídeos
│   │   │   ├── playbook/         # Editor de playbooks
│   │   │   ├── diagram/          # Editor de diagramas
│   │   │   └── assessment/       # Sistema de avaliações
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── proposals/                 # Sistema de propostas
│       ├── components/
│       │   ├── editor/           # Editor drag-and-drop
│       │   ├── templates/        # Sistema de templates
│       │   └── animations/       # Sistema de animações
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
├── shared/                        # 🔄 Recursos compartilhados
│   ├── ui/                       # Design system
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── layouts/                  # Layouts base
│   └── constants/                # Constantes globais
└── docs/                         # 📚 Documentação e anotações
    ├── api/                      # Documentação de APIs
    ├── components/               # Documentação de componentes
    ├── guides/                   # Guias de desenvolvimento
    └── architecture/             # Documentação de arquitetura
```

## 2. MÓDULO DE TREINAMENTO - Especificações Técnicas

### 2.1 Sistema de Upload de Vídeos - VPS Própria

#### 2.1.1 Arquitetura de Upload Seguro

**Especificação**: Sistema de hospedagem própria na VPS com proteção avançada contra download direto e estrutura de streaming seguro.

**Características de Segurança**:

* Upload direto para VPS própria (sem custos externos)

* Autenticação por token para acesso aos vídeos

* Player customizado com proteção contra download

* Watermark dinâmico e controle de domínio

* Compressão automática em múltiplas qualidades

* Logs de acesso e controle de visualizações

```typescript
// types/video.ts
interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number;
  size: number;
  format: VideoFormat;
  resolution: VideoResolution;
  thumbnails: string[];
  chapters?: VideoChapter[];
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: VideoStatus;
}

type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi';
type VideoResolution = '360p' | '720p' | '1080p' | '4k';
type VideoStatus = 'uploading' | 'processing' | 'ready' | 'error';

interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}
```

#### 2.1.2 Serviço de Upload VPS Seguro

```typescript
// services/secureVideoUploadService.ts
class SecureVideoUploadService {
  private readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  private readonly SUPPORTED_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
  private readonly VPS_ENDPOINT = process.env.VPS_VIDEO_ENDPOINT;
  private readonly SECURITY_TOKEN = process.env.VPS_SECURITY_TOKEN;
  
  // Configurações de segurança VPS
  private readonly COMPRESSION_QUALITIES = ['480p', '720p', '1080p'];
  private readonly WATERMARK_CONFIG = {
    text: 'Solara Nova Energia - Treinamento Corporativo',
    position: 'bottom-right',
    opacity: 0.7
  };
  
  async uploadVideo(
    file: File,
    metadata: Partial<VideoMetadata>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoMetadata> {
    // Validação do arquivo
    this.validateFile(file);
    
    // Geração de thumbnails locais
    const thumbnails = await this.generateThumbnails(file);
    
    // Upload em chunks para melhor performance
    const uploadResult = await this.uploadInChunks(file, onProgress);
    
    // Processamento no servidor
    const processedVideo = await this.processVideo(uploadResult.url, {
      ...metadata,
      thumbnails,
      size: file.size,
      format: this.getFileFormat(file),
      uploadedAt: new Date(),
      status: 'processing'
    });
    
    return processedVideo;
  }
  
  private validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);
    }
    
    const format = this.getFileFormat(file);
    if (!this.SUPPORTED_FORMATS.includes(format)) {
      throw new Error(`Formato não suportado. Formatos aceitos: ${this.SUPPORTED_FORMATS.join(', ')}`);
    }
  }
  
  private async uploadInChunks(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; key: string }> {
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
    const uploadId = await this.initializeMultipartUpload(file);
    const parts: { ETag: string; PartNumber: number }[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const part = await this.uploadChunk(uploadId, chunk, i + 1);
      parts.push(part);
      
      // Callback de progresso
      if (onProgress) {
        const loaded = end;
        const percentage = (loaded / file.size) * 100;
        onProgress({
          loaded,
          total: file.size,
          percentage,
          speed: this.calculateSpeed(loaded, Date.now()),
          timeRemaining: this.calculateTimeRemaining(loaded, file.size)
        });
      }
    }
    
    return await this.completeMultipartUpload(uploadId, parts);
  }
  
  private async generateThumbnails(file: File): Promise<string[]> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const thumbnails: string[] = [];
      
      video.onloadedmetadata = () => {
        canvas.width = 320;
        canvas.height = (video.videoHeight / video.videoWidth) * 320;
        
        const duration = video.duration;
        const intervals = [0.1, 0.3, 0.5, 0.7, 0.9]; // 10%, 30%, 50%, 70%, 90%
        
        let processed = 0;
        intervals.forEach((interval) => {
          video.currentTime = duration * interval;
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
            processed++;
            
            if (processed === intervals.length) {
              resolve(thumbnails);
            }
          };
        });
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
}
```

#### 2.1.3 Player de Vídeo Avançado

```typescript
// components/video/AdvancedVideoPlayer.tsx
interface VideoPlayerProps {
  videoId: string;
  userId: string;
  autoPlay?: boolean;
  showControls?: boolean;
  watermark?: WatermarkConfig;
  onProgress?: (progress: VideoProgress) => void;
  onComplete?: () => void;
}

interface VideoProgress {
  currentTime: number;
  duration: number;
  percentage: number;
  watchedSegments: TimeRange[];
}

interface WatermarkConfig {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize: number;
}

const AdvancedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  userId,
  autoPlay = false,
  showControls = true,
  watermark,
  onProgress,
  onComplete
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState<VideoQuality>('auto');
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [watchedSegments, setWatchedSegments] = useState<TimeRange[]>([]);
  
  // Hook para tracking de progresso
  const { trackProgress } = useVideoTracking(videoId, userId);
  
  // Configuração de qualidades disponíveis
  const qualities = {
    auto: 'Auto',
    '1080p': '1080p HD',
    '720p': '720p HD',
    '480p': '480p',
    '360p': '360p'
  };
  
  // Velocidades de reprodução
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    
    setCurrentTime(current);
    
    // Tracking de segmentos assistidos
    const newSegment: TimeRange = {
      start: Math.floor(current),
      end: Math.floor(current) + 1
    };
    
    setWatchedSegments(prev => mergeTimeRanges([...prev, newSegment]));
    
    // Callback de progresso
    if (onProgress) {
      onProgress({
        currentTime: current,
        duration: total,
        percentage: (current / total) * 100,
        watchedSegments
      });
    }
    
    // Tracking no backend
    trackProgress(current, total);
  }, [onProgress, trackProgress, watchedSegments]);
  
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onComplete?.();
  }, [onComplete]);
  
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };
  
  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Vídeo principal */}
      <video
        ref={videoRef}
        className="w-full h-auto"
        autoPlay={autoPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        disablePictureInPicture
        controlsList="nodownload"
      >
        <source src={getVideoUrl(videoId, quality)} type="video/mp4" />
        Seu navegador não suporta vídeo HTML5.
      </video>
      
      {/* Watermark */}
      {watermark && (
        <div
          className={`absolute ${getWatermarkPosition(watermark.position)} pointer-events-none`}
          style={{
            opacity: watermark.opacity,
            fontSize: watermark.fontSize
          }}
        >
          <span className="text-white font-semibold drop-shadow-lg">
            {watermark.text}
          </span>
        </div>
      )}
      
      {/* Controles customizados */}
      {showControls && (
        <VideoControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          quality={quality}
          volume={volume}
          isFullscreen={isFullscreen}
          qualities={qualities}
          playbackRates={playbackRates}
          watchedSegments={watchedSegments}
          onPlay={togglePlay}
          onSeek={handleSeek}
          onPlaybackRateChange={changePlaybackRate}
          onQualityChange={setQuality}
          onVolumeChange={setVolume}
          onFullscreenToggle={toggleFullscreen}
        />
      )}
      
      {/* Indicador de carregamento */}
      <LoadingOverlay isVisible={!duration} />
    </div>
  );
};
```

### 2.2 Editor de Playbooks Estilo Notion

#### 2.2.1 Sistema de Blocos

```typescript
// types/playbook.ts
interface PlaybookBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
  position: number;
  parentId?: string;
  children?: string[];
  metadata: BlockMetadata;
  styling: BlockStyling;
}

type BlockType = 
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'quote'
  | 'code'
  | 'image'
  | 'video'
  | 'table'
  | 'divider'
  | 'callout'
  | 'toggle'
  | 'column'
  | 'embed'
  | 'file';

interface BlockContent {
  text?: string;
  url?: string;
  caption?: string;
  alt?: string;
  language?: string; // para blocos de código
  rows?: TableRow[]; // para tabelas
  columns?: number; // para layouts de coluna
  embedType?: 'youtube' | 'vimeo' | 'figma' | 'miro';
  calloutType?: 'info' | 'warning' | 'error' | 'success';
}

interface BlockMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
}

interface BlockStyling {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'normal' | 'large';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'strikethrough';
}
```

#### 2.2.2 Editor Principal

```typescript
// components/playbook/PlaybookEditor.tsx
interface PlaybookEditorProps {
  playbookId: string;
  initialBlocks?: PlaybookBlock[];
  readOnly?: boolean;
  onSave?: (blocks: PlaybookBlock[]) => void;
  onExport?: (format: ExportFormat) => void;
}

type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown';

const PlaybookEditor: React.FC<PlaybookEditorProps> = ({
  playbookId,
  initialBlocks = [],
  readOnly = false,
  onSave,
  onExport
}) => {
  const [blocks, setBlocks] = useState<PlaybookBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  
  // Hooks para funcionalidades avançadas
  const { undo, redo, canUndo, canRedo } = useUndoRedo(blocks, setBlocks);
  const { saveToCloud, autoSave } = useCloudSync(playbookId, blocks);
  const { comments, addComment } = useComments(playbookId);
  const { suggestions, addSuggestion } = useSuggestions(playbookId);
  
  // Auto-save a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!readOnly) {
        autoSave();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoSave, readOnly]);
  
  const addBlock = useCallback((type: BlockType, position?: number) => {
    const newBlock: PlaybookBlock = {
      id: generateId(),
      type,
      content: getDefaultContent(type),
      position: position ?? blocks.length,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: getCurrentUser().id,
        updatedBy: getCurrentUser().id,
        version: 1
      },
      styling: getDefaultStyling(type)
    };
    
    const newBlocks = insertBlockAtPosition(blocks, newBlock, position);
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  }, [blocks]);
  
  const updateBlock = useCallback((blockId: string, updates: Partial<PlaybookBlock>) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId
          ? {
              ...block,
              ...updates,
              metadata: {
                ...block.metadata,
                updatedAt: new Date(),
                updatedBy: getCurrentUser().id,
                version: block.metadata.version + 1
              }
            }
          : block
      )
    );
  }, []);
  
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);
  
  const moveBlock = useCallback((blockId: string, newPosition: number) => {
    setBlocks(prevBlocks => {
      const blockIndex = prevBlocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prevBlocks;
      
      const block = prevBlocks[blockIndex];
      const newBlocks = [...prevBlocks];
      newBlocks.splice(blockIndex, 1);
      newBlocks.splice(newPosition, 0, { ...block, position: newPosition });
      
      // Reordenar posições
      return newBlocks.map((b, index) => ({ ...b, position: index }));
    });
  }, []);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (readOnly) return;
    
    // Atalhos de teclado
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 's':
          e.preventDefault();
          onSave?.(blocks);
          break;
        case 'b':
          e.preventDefault();
          // Toggle bold
          break;
        case 'i':
          e.preventDefault();
          // Toggle italic
          break;
      }
    }
  }, [blocks, canUndo, canRedo, undo, redo, onSave, readOnly]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <div className="playbook-editor max-w-4xl mx-auto p-6">
      {/* Toolbar */}
      <EditorToolbar
        onAddBlock={addBlock}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={() => onSave?.(blocks)}
        onExport={onExport}
        readOnly={readOnly}
        collaborators={collaborators}
      />
      
      {/* Editor de blocos */}
      <DndProvider backend={HTML5Backend}>
        <div className="blocks-container space-y-2">
          {blocks.map((block, index) => (
            <BlockRenderer
              key={block.id}
              block={block}
              index={index}
              isSelected={selectedBlockId === block.id}
              readOnly={readOnly}
              onSelect={setSelectedBlockId}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onMove={moveBlock}
              comments={comments.filter(c => c.blockId === block.id)}
              onAddComment={addComment}
            />
          ))}
        </div>
      </DndProvider>
      
      {/* Painel de propriedades */}
      {selectedBlockId && (
        <BlockPropertiesPanel
          block={blocks.find(b => b.id === selectedBlockId)!}
          onUpdate={updateBlock}
        />
      )}
      
      {/* Indicador de colaboração */}
      {isCollaborating && (
        <CollaborationIndicator
          collaborators={collaborators}
          isOnline={true}
        />
      )}
    </div>
  );
};
```

### 2.3 Editor de Fluxogramas/Mind Maps

#### 2.3.1 Tipos de Nós e Conexões

```typescript
// types/diagram.ts
interface DiagramNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  style?: NodeStyle;
  draggable?: boolean;
  selectable?: boolean;
  deletable?: boolean;
}

type NodeType = 
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'document'
  | 'database'
  | 'connector'
  | 'annotation'
  | 'subprocess'
  | 'manual'
  | 'preparation';

interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
}

interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  width?: number;
  height?: number;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: EdgeType;
  label?: string;
  style?: EdgeStyle;
  animated?: boolean;
  data?: EdgeData;
}

type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';

interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

interface EdgeData {
  condition?: string;
  probability?: number;
  metadata?: Record<string, any>;
}
```

#### 2.3.2 Editor Principal de Diagramas

```typescript
// components/diagram/DiagramEditor.tsx
interface DiagramEditorProps {
  diagramId: string;
  initialNodes?: DiagramNode[];
  initialEdges?: DiagramEdge[];
  readOnly?: boolean;
  onSave?: (nodes: DiagramNode[], edges: DiagramEdge[]) => void;
  onExport?: (format: DiagramExportFormat) => void;
}

type DiagramExportFormat = 'png' | 'svg' | 'pdf' | 'json';

const DiagramEditor: React.FC<DiagramEditorProps> = ({
  diagramId,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
  onSave,
  onExport
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTool, setSelectedTool] = useState<DiagramTool>('select');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  
  // Hooks para funcionalidades avançadas
  const { undo, redo, canUndo, canRedo } = useUndoRedo(
    { nodes, edges },
    ({ nodes: newNodes, edges: newEdges }) => {
      setNodes(newNodes);
      setEdges(newEdges);
    }
  );
  
  const { alignElements, distributeElements } = useAlignment();
  const { groupElements, ungroupElements } = useGrouping();
  const { copyElements, pasteElements } = useClipboard();
  
  // Tipos de nós customizados
  const nodeTypes = useMemo(() => ({
    start: StartNode,
    end: EndNode,
    process: ProcessNode,
    decision: DecisionNode,
    document: DocumentNode,
    database: DatabaseNode,
    connector: ConnectorNode,
    annotation: AnnotationNode,
    subprocess: SubprocessNode,
    manual: ManualNode,
    preparation: PreparationNode
  }), []);
  
  // Tipos de conexões customizadas
  const edgeTypes = useMemo(() => ({
    default: DefaultEdge,
    animated: AnimatedEdge,
    conditional: ConditionalEdge,
    bidirectional: BidirectionalEdge
  }), []);
  
  const onConnect = useCallback((params: Connection) => {
    const newEdge: DiagramEdge = {
      id: `edge-${params.source}-${params.target}`,
      source: params.source!,
      target: params.target!,
      type: 'default',
      animated: false
    };
    
    setEdges(eds => addEdge(newEdge, eds));
  }, [setEdges]);
  
  const addNode = useCallback((type: NodeType, position: Position) => {
    const newNode: DiagramNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: {
        label: getDefaultLabel(type),
        color: getDefaultColor(type)
      },
      style: getDefaultStyle(type),
      draggable: !readOnly,
      selectable: !readOnly,
      deletable: !readOnly
    };
    
    setNodes(nds => [...nds, newNode]);
  }, [setNodes, readOnly]);
  
  const deleteSelectedElements = useCallback(() => {
    if (readOnly) return;
    
    setNodes(nds => nds.filter(node => !selectedElements.includes(node.id)));
    setEdges(eds => eds.filter(edge => 
      !selectedElements.includes(edge.id) &&
      !selectedElements.includes(edge.source) &&
      !selectedElements.includes(edge.target)
    ));
    setSelectedElements([]);
  }, [selectedElements, readOnly, setNodes, setEdges]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (readOnly) return;
    
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        deleteSelectedElements();
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          copyElements(selectedElements);
        }
        break;
      case 'v':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          pasteElements();
        }
        break;
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setSelectedElements([...nodes.map(n => n.id), ...edges.map(e => e.id)]);
        }
        break;
    }
  }, [readOnly, deleteSelectedElements, undo, redo, copyElements, pasteElements, selectedElements, nodes, edges]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const exportDiagram = useCallback(async (format: DiagramExportFormat) => {
    const reactFlowInstance = getReactFlowInstance();
    if (!reactFlowInstance) return;
    
    switch (format) {
      case 'png':
        const imageData = await reactFlowInstance.toObject();
        // Converter para PNG
        break;
      case 'svg':
        // Exportar como SVG
        break;
      case 'pdf':
        // Exportar como PDF
        break;
      case 'json':
        const jsonData = {
          nodes,
          edges,
          viewport: reactFlowInstance.getViewport()
        };
        downloadJSON(jsonData, `diagram-${diagramId}.json`);
        break;
    }
  }, [nodes, edges, diagramId]);
  
  return (
    <div className="diagram-editor h-full flex flex-col">
      {/* Toolbar */}
      <DiagramToolbar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        onAddNode={addNode}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={() => onSave?.(nodes, edges)}
        onExport={exportDiagram}
        onAlign={alignElements}
        onDistribute={distributeElements}
        onGroup={groupElements}
        onUngroup={ungroupElements}
        snapToGrid={snapToGrid}
        onSnapToGridChange={setSnapToGrid}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
        readOnly={readOnly}
      />
      
      {/* Canvas principal */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid={snapToGrid}
          snapGrid={[20, 20]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          attributionPosition="bottom-left"
          onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
            setSelectedElements([
              ...selectedNodes.map(n => n.id),
              ...selectedEdges.map(e => e.id)
            ]);
          }}
        >
          {showGrid && <Background color="#aaa" gap={20} />}
          <Controls />
          <MiniMap
            nodeColor={(node) => node.data.color || '#ff0072'}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
        
        {/* Painel de propriedades */}
        {selectedElements.length > 0 && (
          <PropertiesPanel
            selectedElements={selectedElements}
            nodes={nodes}
            edges={edges}
            onUpdateNode={(nodeId, updates) => {
              setNodes(nds => nds.map(node => 
                node.id === nodeId ? { ...node, ...updates } : node
              ));
            }}
            onUpdateEdge={(edgeId, updates) => {
              setEdges(eds => eds.map(edge => 
                edge.id === edgeId ? { ...edge, ...updates } : edge
              ));
            }}
          />
        )}
      </div>
    </div>
  );
};
```

## 3. SISTEMA DE PROPOSTAS - Especificações Técnicas

### 3.1 Editor Drag-and-Drop

#### 3.1.1 Tipos de Elementos

```typescript
// types/proposal.ts
interface ProposalElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  content: ElementContent;
  style: ElementStyle;
  animation?: ElementAnimation;
  locked?: boolean;
  visible?: boolean;
  zIndex: number;
}

type ElementType = 
  | 'text'
  | 'image'
  | 'table'
  | 'chart'
  | 'shape'
  | 'logo'
  | 'signature'
  | 'qrcode'
  | 'barcode'
  | 'video'
  | 'audio'
  | 'embed';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface ElementContent {
  text?: string;
  html?: string;
  url?: string;
  data?: any;
  alt?: string;
  caption?: string;
}

interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  boxShadow?: string;
  filter?: string;
}

interface ElementAnimation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

type AnimationType = 
  | 'fadeIn'
  | 'fadeOut'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'zoomIn'
  | 'zoomOut'
  | 'bounceIn'
  | 'bounceOut'
  | 'rotateIn'
  | 'rotateOut'
  | 'pulse'
  | 'shake';
```

#### 3.1.2 Editor Principal

```typescript
// components/proposals/ProposalEditor.tsx
interface ProposalEditorProps {
  proposalId: string;
  format: DocumentFormat;
  initialElements?: ProposalElement[];
  template?: ProposalTemplate;
  readOnly?: boolean;
  onSave?: (elements: ProposalElement[]) => void;
  onExport?: (format: ExportFormat) => void;
}

type DocumentFormat = 'A4' | '16:9' | 'A3' | 'Letter' | 'Custom';
type ExportFormat = 'pdf' | 'pptx' | 'docx' | 'html' | 'png' | 'jpg';

const ProposalEditor: React.FC<ProposalEditorProps> = ({
  proposalId,
  format,
  initialElements = [],
  template,
  readOnly = false,
  onSave,
  onExport
}) => {
  const [elements, setElements] = useState<ProposalElement[]>(initialElements);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<ProposalElement[]>([]);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dimensões do documento baseadas no formato
  const documentDimensions = useMemo(() => {
    switch (format) {
      case 'A4':
        return { width: 794, height: 1123 }; // 210x297mm em pixels (96 DPI)
      case '16:9':
        return { width: 1920, height: 1080 };
      case 'A3':
        return { width: 1123, height: 1587 };
      case 'Letter':
        return { width: 816, height: 1056 };
      default:
        return { width: 800, height: 600 };
    }
  }, [format]);
  
  // Hooks para funcionalidades avançadas
  const { undo, redo, canUndo, canRedo } = useUndoRedo(elements, setElements);
  const { alignElements, distributeElements } = useAlignment();
  const { groupElements, ungroupElements } = useGrouping();
  const { duplicateElements } = useDuplication();
  
  // DnD para elementos da toolbar
  const [{ isOver }, drop] = useDrop({
    accept: 'ELEMENT',
    drop: (item: { type: ElementType }, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      
      const position = {
        x: (offset.x - canvasRect.left) / (zoom / 100),
        y: (offset.y - canvasRect.top) / (zoom / 100)
      };
      
      addElement(item.type, position);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const addElement = useCallback((type: ElementType, position: Position) => {
    const newElement: ProposalElement = {
      id: generateId(),
      type,
      position: snapToGrid ? snapPositionToGrid(position) : position,
      size: getDefaultSize(type),
      content: getDefaultContent(type),
      style: getDefaultStyle(type),
      zIndex: Math.max(...elements.map(e => e.zIndex), 0) + 1,
      visible: true,
      locked: false
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElements([newElement.id]);
  }, [elements, snapToGrid]);
  
  const updateElement = useCallback((elementId: string, updates: Partial<ProposalElement>) => {
    setElements(prev => prev.map(element => 
      element.id === elementId ? { ...element, ...updates } : element
    ));
  }, []);
  
  const deleteElements = useCallback((elementIds: string[]) => {
    setElements(prev => prev.filter(element => !elementIds.includes(element.id)));
    setSelectedElements([]);
  }, []);
  
  const moveElements = useCallback((elementIds: string[], delta: Position) => {
    setElements(prev => prev.map(element => {
      if (!elementIds.includes(element.id)) return element;
      
      const newPosition = {
        x: element.position.x + delta.x,
        y: element.position.y + delta.y
      };
      
      return {
        ...element,
        position: snapToGrid ? snapPositionToGrid(newPosition) : newPosition
      };
    }));
  }, [snapToGrid]);
  
  const resizeElement = useCallback((elementId: string, newSize: Size, newPosition?: Position) => {
    setElements(prev => prev.map(element => 
      element.id === elementId
        ? {
            ...element,
            size: newSize,
            ...(newPosition && { position: newPosition })
          }
        : element
    ));
  }, []);
  
  const copyElements = useCallback(() => {
    const elementsToCopy = elements.filter(e => selectedElements.includes(e.id));
    setClipboard(elementsToCopy);
  }, [elements, selectedElements]);
  
  const pasteElements = useCallback(() => {
    if (clipboard.length === 0) return;
    
    const newElements = clipboard.map(element => ({
      ...element,
      id: generateId(),
      position: {
        x: element.position.x + 20,
        y: element.position.y + 20
      },
      zIndex: Math.max(...elements.map(e => e.zIndex), 0) + 1
    }));
    
    setElements(prev => [...prev, ...newElements]);
    setSelectedElements(newElements.map(e => e.id));
  }, [clipboard, elements]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (readOnly) return;
    
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        deleteElements(selectedElements);
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          copyElements();
        }
        break;
      case 'v':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          pasteElements();
        }
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          duplicateElements(selectedElements);
        }
        break;
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setSelectedElements(elements.map(e => e.id));
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (selectedElements.length > 0) {
          e.preventDefault();
          const delta = {
            x: e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0,
            y: e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
          };
          
          if (e.shiftKey) {
            delta.x *= 10;
            delta.y *= 10;
          }
          
          moveElements(selectedElements, delta);
        }
        break;
    }
  }, [readOnly, selectedElements, deleteElements, undo, redo, copyElements, pasteElements, duplicateElements, elements, moveElements]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <div className="proposal-editor h-full flex flex-col bg-gray-100">
      {/* Toolbar principal */}
      <EditorToolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={() => onSave?.(elements)}
        onExport={onExport}
        zoom={zoom}
        onZoomChange={setZoom}
        format={format}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        readOnly={readOnly}
      />
      
      <div className="flex-1 flex">
        {/* Painel de elementos */}
        <ElementsPanel
          onDragStart={(type: ElementType) => ({ type })}
          readOnly={readOnly}
        />
        
        {/* Canvas principal */}
        <div className="flex-1 flex flex-col">
          {/* Réguas */}
          {showRulers && (
            <>
              <HorizontalRuler
                width={documentDimensions.width}
                zoom={zoom}
                offset={0}
              />
              <VerticalRuler
                height={documentDimensions.height}
                zoom={zoom}
                offset={0}
              />
            </>
          )}
          
          {/* Área de trabalho */}
          <div
            ref={drop}
            className="flex-1 overflow-auto bg-gray-200 p-8"
            style={{
              backgroundImage: showGrid ? 'radial-gradient(circle, #ccc 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px` : 'auto'
            }}
          >
            <div
              ref={canvasRef}
              className="bg-white shadow-lg mx-auto relative"
              style={{
                width: documentDimensions.width * (zoom / 100),
                height: documentDimensions.height * (zoom / 100),
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left'
              }}
            >
              {/* Elementos do documento */}
              {elements.map(element => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElements.includes(element.id)}
                  readOnly={readOnly}
                  onSelect={(id, multiSelect) => {
                    if (multiSelect) {
                      setSelectedElements(prev => 
                        prev.includes(id)
                          ? prev.filter(eid => eid !== id)
                          : [...prev, id]
                      );
                    } else {
                      setSelectedElements([id]);
                    }
                  }}
                  onUpdate={updateElement}
                  onMove={(id, delta) => moveElements([id], delta)}
                  onResize={resizeElement}
                />
              ))}
              
              {/* Indicador de drop */}
              {isOver && (
                <div className="absolute inset-0 bg-blue-200 bg-opacity-30 border-2 border-blue-400 border-dashed" />
              )}
            </div>
          </div>
        </div>
        
        {/* Painel de propriedades */}
        <PropertiesPanel
          selectedElements={selectedElements}
          elements={elements}
          onUpdate={updateElement}
          onAlign={alignElements}
          onDistribute={distributeElements}
          onGroup={groupElements}
          onUngroup={ungroupElements}
        />
      </div>
      
      {/* Barra de status */}
      <StatusBar
        selectedCount={selectedElements.length}
        totalElements={elements.length}
        zoom={zoom}
        format={format}
        documentDimensions={documentDimensions}
      />
    </div>
  );
};
```

## 4. Sistema de Animações

### 4.1 Engine de Animações

```typescript
// services/animationEngine.ts
class AnimationEngine {
  private animations: Map<string, Animation> = new Map();
  private timeline: AnimationTimeline;
  
  constructor() {
    this.timeline = new AnimationTimeline();
  }
  
  createAnimation(elementId: string, config: AnimationConfig): Animation {
    const animation = new Animation(elementId, config);
    this.animations.set(elementId, animation);
    return animation;
  }
  
  playAnimation(elementId: string): void {
    const animation = this.animations.get(elementId);
    if (animation) {
      animation.play();
    }
  }
  
  pauseAnimation(elementId: string): void {
    const animation = this.animations.get(elementId);
    if (animation) {
      animation.pause();
    }
  }
  
  stopAnimation(elementId: string): void {
    const animation = this.animations.get(elementId);
    if (animation) {
      animation.stop();
    }
  }
  
  playTimeline(): void {
    this.timeline.play();
  }
  
  pauseTimeline(): void {
    this.timeline.pause();
  }
  
  addToTimeline(animation: Animation, startTime: number): void {
    this.timeline.addAnimation(animation, startTime);
  }
}

interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  keyframes?: Keyframe[];
}

interface Keyframe {
  offset: number; // 0 to 1
  properties: Record<string, any>;
  easing?: string;
}
```

## 5. Níveis de Acesso e Permissões

### 5.1 Sistema de Roles

```typescript
// types/auth.ts
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  permissions: Permission[];
  trainingCategories: TrainingCategory[];
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

type UserRole = 'admin' | 'manager' | 'engineer' | 'sales' | 'installer' | 'viewer';

type Department = 'administration' | 'engineering' | 'sales' | 'installation' | 'support';

interface Permission {
  resource: Resource;
  actions: Action[];
  conditions?: PermissionCondition[];
}

type Resource = 
  | 'training_modules'
  | 'training_content'
  | 'proposals'
  | 'templates'
  | 'users'
  | 'reports'
  | 'settings';

type Action = 'create' | 'read' | 'update' | 'delete' | 'share' | 'export';

interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: any;
}

interface TrainingCategory {
  id: string;
  name: string;
  description: string;
  requiredCertifications: string[];
  accessLevel: AccessLevel;
}

type AccessLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';
```

### 5.2 Middleware de Autorização

```typescript
// middleware/authMiddleware.ts
class AuthorizationMiddleware {
  static checkPermission(
    user: User,
    resource: Resource,
    action: Action,
    context?: any
  ): boolean {
    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return false;
    }
    
    // Admin tem acesso total
    if (user.role === 'admin') {
      return true;
    }
    
    // Verificar permissões específicas
    const permission = user.permissions.find(p => p.resource === resource);
    if (!permission) {
      return false;
    }
    
    // Verificar se a ação é permitida
    if (!permission.actions.includes(action)) {
      return false;
    }
    
    // Verificar condições específicas
    if (permission.conditions && context) {
      return this.evaluateConditions(permission.conditions, context, user);
    }
    
    return true;
  }
  
  static checkTrainingAccess(
    user: User,
    trainingCategory: TrainingCategory
  ): boolean {
    // Verificar se o usuário tem acesso à categoria
    const hasCategory = user.trainingCategories.some(c => c.id === trainingCategory.id);
    if (!hasCategory) {
      return false;
    }
    
    // Verificar certificações necessárias
    if (trainingCategory.requiredCertifications.length > 0) {
      // Implementar verificação de certificações
      return true; // Placeholder
    }
    
    return true;
  }
  
  private static evaluateConditions(
    conditions: PermissionCondition[],
    context: any,
    user: User
  ): boolean {
    return conditions.every(condition => {
      const contextValue = context[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'not_equals':
          return contextValue !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        default:
          return false;
      }
    });
  }
}

// Hook para verificação de permissões
const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = useCallback(
    (resource: Resource, action: Action, context?: any) => {
      if (!user) return false;
      return AuthorizationMiddleware.checkPermission(user, resource, action, context);
    },
    [user]
  );
  
  const hasTrainingAccess = useCallback(
    (category: TrainingCategory) => {
      if (!user) return false;
      return AuthorizationMiddleware.checkTrainingAccess(user, category);
    },
    [user]
  );
  
  return {
    hasPermission,
    hasTrainingAccess,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager'
  };
};
```

## 6. Performance e Otimizações

### 6.1 Code Splitting e Lazy Loading

```typescript
// router/AppRouter.tsx
const SolarModule = lazy(() => import('../modules/solar/SolarModule'));
const TrainingModule = lazy(() => import('../modules/training/TrainingModule'));
const ProposalModule = lazy(() => import('../modules/proposals/ProposalModule'));
const AdminPanel = lazy(() => import('../modules/admin/AdminPanel'));

const AppRouter = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/solar/*" element={<SolarModule />} />
          <Route path="/training/*" element={<TrainingModule />} />
          <Route path="/proposals/*" element={<ProposalModule />} />
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

### 6.2 Otimização de Imagens

```typescript
// components/ui/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  loading = 'lazy',
  className
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  const optimizedSrc = useMemo(() => {
    // Gerar URLs otimizadas baseadas no CDN
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    params.append('f', 'webp');
    
    return `${src}?${params.toString()}`;
  }, [src, width, height, quality]);
  
  return (
    <picture className={className}>
      <source srcSet={optimizedSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${error ? 'bg-gray-200' : ''}`}
      />
    </picture>
  );
};
```

### 6.3 Cache Strategy

```typescript
// services/cacheService.ts
class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos
  
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.TTL);
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(e => now > e.expiresAt).length,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: this.calculateHitRate()
    };
  }
  
  private estimateMemoryUsage(): number {
    return JSON.stringify(Array.from(this.cache.entries())).length;
  }
  
  private calculateHitRate(): number {
    // Implementar cálculo de hit rate
    return 0.85; // Placeholder
  }
}

interface CacheEntry {
  value: any;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  memoryUsage: number;
  hitRate: number;
}
```

## 7. Testes e Qualidade

### 7.1 Configuração de Testes

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configurar testing library
configure({ testIdAttribute: 'data-testid' });

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock de APIs
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));
```

### 7.2 Testes de Componentes

```typescript
// tests/components/VideoPlayer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedVideoPlayer } from '../../src/components/video/AdvancedVideoPlayer';

describe('AdvancedVideoPlayer', () => {
  const mockProps = {
    videoId: 'test-video-1',
    userId: 'test-user-1',
    onProgress: jest.fn(),
    onComplete: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render video player with controls', () => {
    render(<AdvancedVideoPlayer {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /progress/i })).toBeInTheDocument();
  });
  
  it('should track video progress', async () => {
    render(<AdvancedVideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    
    // Simular progresso do vídeo
    fireEvent.timeUpdate(video, { target: { currentTime: 30, duration: 100 } });
    
    await waitFor(() => {
      expect(mockProps.onProgress).toHaveBeenCalledWith({
        currentTime: 30,
        duration: 100,
        percentage: 30,
        watchedSegments: expect.any(Array)
      });
    });
  });
  
  it('should handle playback rate changes', () => {
    render(<AdvancedVideoPlayer {...mockProps} />);
    
    const rateButton = screen.getByRole('button', { name: /speed/i });
    fireEvent.click(rateButton);
    
    const rate2x = screen.getByRole('button', { name: /2x/i });
    fireEvent.click(rate2x);
    
    const video = screen.getByRole('video') as HTMLVideoElement;
    expect(video.playbackRate).toBe(2);
  });
});
```

## 8. Deploy e Monitoramento

### 8.1 Configuração do Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_BUNNY_CDN_URL": "@bunny_cdn_url"
  }
}
```

### 8.2 Monitoramento e Analytics

```typescript
// services/analyticsService.ts
class AnalyticsService {
  private static instance: AnalyticsService;
  
  static getInstance(): AnalyticsService {
    if (!this.instance) {
      this.instance = new AnalyticsService();
    }
    return this.instance;
  }
  
  trackEvent(event: AnalyticsEvent): void {
    // Enviar para múltiplos provedores
    this.sendToVercelAnalytics(event);
    this.sendToSupabase(event);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }
  
  trackPageView(page: string, userId?: string): void {
    this.trackEvent({
      type: 'page_view',
      properties: {
        page,
        userId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }
    });
  }
  
  trackVideoProgress(videoId: string, progress: number, userId: string): void {
    this.trackEvent({
      type: 'video_progress',
      properties: {
        videoId,
        progress,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  trackProposalCreated(proposalId: string, userId: string): void {
    this.trackEvent({
      type: 'proposal_created',
      properties: {
        proposalId,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  private sendToVercelAnalytics(event: AnalyticsEvent): void {
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', event.type, event.properties);
    }
  }
  
  private async sendToSupabase(event: AnalyticsEvent): Promise<void> {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: event.type,
          properties: event.properties,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to send analytics to Supabase:', error);
    }
  }
}

interface AnalyticsEvent {
  type: string;
  properties: Record<string, any>;
}
```

***

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Fase 1 - Limpeza e Otimização (Concluída)

* [x] Análise do código atual

* [x] Identificação de arquivos obsoletos

* [x] Reorganização da estrutura de pastas

* [x] Implementação de code splitting

* [x] Otimização de bundle size

### ⌛ Fase 2 - Módulo de Treinamento (Em Desenvolvimento)

* [ ] Sistema de upload de vídeos

* [ ] Player de vídeo avançado

* [ ] Editor de playbooks estilo Notion

* [ ] Editor de fluxogramas/mind maps

* [ ] Sistema de avaliações

* [ ] Gamificação avançada

### ⌛ Fase 3 - Sistema de Propostas (Pendente)

* [ ] Editor drag-and-drop

* [ ] Upload de modelos

* [ ] Sistema de animações

* [ ] Formatos A4 e 16:9

* [ ] Export para múltiplos formatos

### ⌛ Fase 4 - UX/UI e Finalização (Pendente)

* [ ] Design system completo

* [ ] Micro-interações

* [ ] Responsividade mobile

* [ ] Temas claro/escuro

* [ ] Testes automatizados

* [ ] Deploy e monitoramento

**Status Geral: 85% → Meta: 100%**
**Prazo: 14 semanas**
**Investimento: R$ 204.556**

```
```

