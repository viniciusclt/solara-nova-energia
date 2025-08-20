// =====================================================
// EDITOR DE CONTEÚDO DE TREINAMENTO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  Video,
  Upload,
  Save,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Image,
  Link,
  Type,
  List,
  CheckSquare,
  AlertCircle,
  Clock,
  Settings,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form';
import { Progress } from '../../../components/ui/progress';
import { Separator } from '../../../components/ui/separator';
import { useModuleContent, useVideoUpload } from '../hooks/useTraining';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/use-toast';
import { logError } from '@/utils/secureLogger';
import type { ContentFormData, TrainingContent } from '../types';

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const contentSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  content_type: z.enum(['video', 'document', 'quiz', 'interactive']),
  content_order: z.number().min(1, 'Ordem deve ser maior que 0'),
  description: z.string().optional(),
  estimated_duration: z.number().min(1, 'Duração deve ser maior que 0').optional(),
  is_mandatory: z.boolean().default(true),
  content_data: z.record(z.unknown()).optional()
});

type ContentFormValues = z.infer<typeof contentSchema>;

// =====================================================
// INTERFACES
// =====================================================

interface ContentEditorProps {
  moduleId: string;
  contentId?: string;
  onSave?: (content: TrainingContent) => void;
  onCancel?: () => void;
  isOpen: boolean;
}

interface VideoUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  videoUrl?: string;
}

interface DocumentData {
  content: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

interface QuizData {
  questions: Array<{
    id: string;
    type: 'multiple_choice' | 'essay' | 'true_false';
    question: string;
    options?: string[];
    correct_answer?: string | number;
    points: number;
    explanation?: string;
  }>;
  time_limit?: number;
  shuffle_questions: boolean;
  show_results: boolean;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ContentEditor({ moduleId, contentId, onSave, onCancel, isOpen }: ContentEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [videoUpload, setVideoUpload] = useState<VideoUploadState>({
    file: null,
    progress: 0,
    status: 'idle'
  });
  const [documentData, setDocumentData] = useState<DocumentData>({
    content: '',
    attachments: []
  });
  const [quizData, setQuizData] = useState<QuizData>({
    questions: [],
    shuffle_questions: false,
    show_results: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createContent, updateContent, isCreating, isUpdating } = useModuleContent(moduleId);
  const { uploadVideo, uploadProgress } = useVideoUpload();
  
  // Form principal
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: '',
      content_type: 'video',
      content_order: 1,
      description: '',
      estimated_duration: 10,
      is_mandatory: true,
      content_data: {}
    }
  });
  
  const contentType = form.watch('content_type');
  
  // =====================================================
  // EFEITOS
  // =====================================================
  
  useEffect(() => {
    if (contentId) {
      // Carregar dados do conteúdo existente
      const loadContent = async () => {
        try {
          setIsLoading(true);
          // Implementação básica de carregamento de conteúdo
          // A funcionalidade completa será implementada quando necessário
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simular carregamento
          
          // Aqui seria feita a chamada real para carregar o conteúdo
          // const content = await trainingService.getContent(contentId);
          // form.reset(content);
          
        } catch (error) {
          logError('Erro ao carregar conteúdo', {
            service: 'ContentEditor',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            contentId,
            action: 'loadContent'
          });
          toast({
            title: "Erro",
            description: "Erro ao carregar conteúdo",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      loadContent();
    }
  }, [contentId]);
  
  // =====================================================
  // HANDLERS
  // =====================================================
  
  const handleSubmit = async (data: ContentFormValues) => {
    try {
      setIsSaving(true);
      let contentData = {};
      
      // Preparar dados específicos por tipo
      switch (data.content_type) {
        case 'video':
          contentData = {
            video_url: videoUpload.videoUrl,
            duration: data.estimated_duration,
            watermark: true,
            auto_play: false
          };
          break;
        case 'document':
          contentData = documentData;
          break;
        case 'quiz':
          contentData = quizData;
          break;
        case 'interactive':
          contentData = {
            type: 'interactive',
            config: {}
          };
          break;
      }
      
      const contentPayload = {
        ...data,
        content_data: contentData
      };
      
      if (contentId) {
        const updatedContent = await updateContent({ contentId, contentData: contentPayload });
        onSave?.(updatedContent);
        toast({
          title: "Sucesso",
          description: "Conteúdo atualizado com sucesso"
        });
      } else {
        const newContent = await createContent(contentPayload);
        onSave?.(newContent);
        toast({
          title: "Sucesso",
          description: "Conteúdo criado com sucesso"
        });
      }
    } catch (error) {
      logError('Erro ao salvar conteúdo', {
        service: 'ContentEditor',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        contentId,
        contentType: data.content_type,
        action: 'handleSubmit'
      });
      toast({
        title: "Erro",
        description: "Erro ao salvar conteúdo",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    if (file.type.startsWith('video/')) {
      setVideoUpload({
        file,
        progress: 0,
        status: 'uploading'
      });
      
      try {
        const result = await uploadVideo(file, {
          onProgress: (progress) => {
            setVideoUpload(prev => ({ ...prev, progress }));
          }
        });
        
        setVideoUpload({
          file,
          progress: 100,
          status: 'completed',
          videoUrl: result.url
        });
        
        // Estimar duração baseada no arquivo
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          form.setValue('estimated_duration', Math.ceil(video.duration / 60));
          URL.revokeObjectURL(video.src);
        };
        
      } catch (error) {
        setVideoUpload({
          file,
          progress: 0,
          status: 'error',
          error: 'Erro ao fazer upload do vídeo'
        });
      }
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded">
              {contentType === 'video' && <Video className="h-5 w-5 text-blue-600" />}
              {contentType === 'document' && <FileText className="h-5 w-5 text-blue-600" />}
              {contentType === 'quiz' && <CheckSquare className="h-5 w-5 text-blue-600" />}
              {contentType === 'interactive' && <Monitor className="h-5 w-5 text-blue-600" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {contentId ? 'Editar Conteúdo' : 'Novo Conteúdo'}
              </h2>
              <p className="text-sm text-gray-600">
                {contentType === 'video' ? 'Adicione um vídeo ao módulo' :
                 contentType === 'document' ? 'Crie um documento ou material de apoio' :
                 contentType === 'quiz' ? 'Configure uma avaliação' : 'Conteúdo interativo'}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6">
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="preview">Visualizar</TabsTrigger>
                </TabsList>
                
                {/* Aba: Informações Básicas */}
                <TabsContent value="basic" className="space-y-6">
                  <BasicContentTab form={form} />
                </TabsContent>
                
                {/* Aba: Conteúdo */}
                <TabsContent value="content" className="space-y-6">
                  {contentType === 'video' && (
                    <VideoContentTab 
                      videoUpload={videoUpload}
                      onFileUpload={handleFileUpload}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      fileInputRef={fileInputRef}
                    />
                  )}
                  
                  {contentType === 'document' && (
                    <DocumentContentTab 
                      documentData={documentData}
                      setDocumentData={setDocumentData}
                    />
                  )}
                  
                  {contentType === 'quiz' && (
                    <QuizContentTab 
                      quizData={quizData}
                      setQuizData={setQuizData}
                    />
                  )}
                  
                  {contentType === 'interactive' && (
                    <InteractiveContentTab />
                  )}
                </TabsContent>
                
                {/* Aba: Visualizar */}
                <TabsContent value="preview" className="space-y-6">
                  <PreviewContentTab form={form} contentType={contentType} />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span>Conteúdo será salvo no módulo atual</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isCreating || isUpdating || videoUpload.status === 'uploading'}
            >
              {isCreating || isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {contentId ? 'Atualizar' : 'Criar'} Conteúdo
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// ABA: INFORMAÇÕES BÁSICAS
// =====================================================

function BasicContentTab({ form }: { form: ReturnType<typeof useForm> }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Conteúdo</CardTitle>
          <CardDescription>
            Configure as informações básicas do conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Conteúdo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Introdução aos Painéis Solares" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conteúdo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4" />
                          <span>Vídeo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="document">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Documento</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="quiz">
                        <div className="flex items-center space-x-2">
                          <CheckSquare className="h-4 w-4" />
                          <span>Avaliação</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="interactive">
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4" />
                          <span>Interativo</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o conteúdo e o que será abordado..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="content_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem no Módulo</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="estimated_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (minutos)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Obrigatório</FormLabel>
                    <FormDescription className="text-xs">
                      Conteúdo obrigatório
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: CONTEÚDO DE VÍDEO
// =====================================================

function VideoContentTab({ 
  videoUpload, 
  onFileUpload, 
  onDrop, 
  onDragOver, 
  fileInputRef 
}: {
  videoUpload: VideoUploadState;
  onFileUpload: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload de Vídeo</CardTitle>
          <CardDescription>
            Faça upload do arquivo de vídeo para o módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {videoUpload.status === 'idle' && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arraste um vídeo aqui ou clique para selecionar
              </h3>
              <p className="text-gray-600 mb-4">
                Formatos suportados: MP4, WebM, MOV (máx. 500MB)
              </p>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileUpload(file);
                }}
              />
            </div>
          )}
          
          {videoUpload.status === 'uploading' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Video className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-medium">{videoUpload.file?.name}</h3>
                  <p className="text-sm text-gray-600">Fazendo upload...</p>
                </div>
              </div>
              
              <Progress value={videoUpload.progress} className="w-full" />
              
              <p className="text-sm text-gray-600 text-center">
                {videoUpload.progress}% concluído
              </p>
            </div>
          )}
          
          {videoUpload.status === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded">
                    <Video className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">{videoUpload.file?.name}</h3>
                    <p className="text-sm text-green-700">Upload concluído com sucesso</p>
                  </div>
                </div>
                
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Pronto
                </Badge>
              </div>
              
              {videoUpload.videoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={videoUpload.videoUrl} 
                    controls 
                    className="w-full h-full"
                    preload="metadata"
                  >
                    Seu navegador não suporta vídeos.
                  </video>
                </div>
              )}
            </div>
          )}
          
          {videoUpload.status === 'error' && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-900">Erro no Upload</h3>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {videoUpload.error || 'Ocorreu um erro ao fazer upload do vídeo'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Configurações do Vídeo */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Vídeo</CardTitle>
          <CardDescription>
            Configure as opções de reprodução e segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Watermark</Label>
                <p className="text-xs text-gray-600">Adicionar marca d'água no vídeo</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Reprodução Automática</Label>
                <p className="text-xs text-gray-600">Iniciar vídeo automaticamente</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Controle de Velocidade</Label>
                <p className="text-xs text-gray-600">Permitir alterar velocidade</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Download Bloqueado</Label>
                <p className="text-xs text-gray-600">Impedir download do vídeo</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: CONTEÚDO DE DOCUMENTO
// =====================================================

function DocumentContentTab({ 
  documentData, 
  setDocumentData 
}: {
  documentData: DocumentData;
  setDocumentData: (data: DocumentData) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor de Documento</CardTitle>
          <CardDescription>
            Crie o conteúdo do documento usando o editor visual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <div className="border-b p-3 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Type className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Image className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Textarea
              placeholder="Digite o conteúdo do documento aqui...\n\nVocê pode usar Markdown para formatação:\n- **negrito**\n- *itálico*\n- [links](url)\n- # Títulos\n- - Listas"
              className="min-h-[400px] border-0 resize-none focus:ring-0"
              value={documentData.content}
              onChange={(e) => setDocumentData({ ...documentData, content: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Anexos */}
      <Card>
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
          <CardDescription>
            Adicione arquivos complementares ao documento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-gray-500">
              PDF, DOC, XLS, PPT (máx. 10MB cada)
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Anexo
            </Button>
          </div>
          
          {documentData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {documentData.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{attachment.name}</p>
                      <p className="text-xs text-gray-600">
                        {attachment.type} • {(attachment.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: CONTEÚDO DE QUIZ
// =====================================================

function QuizContentTab({ 
  quizData, 
  setQuizData 
}: {
  quizData: QuizData;
  setQuizData: (data: QuizData) => void;
}) {
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: 'multiple_choice' as const,
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      points: 10,
      explanation: ''
    };
    
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, newQuestion]
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questões da Avaliação</CardTitle>
              <CardDescription>
                Configure as perguntas e respostas da avaliação
              </CardDescription>
            </div>
            <Button onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Questão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {quizData.questions.length > 0 ? (
            <div className="space-y-6">
              {quizData.questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline">Questão {index + 1}</Badge>
                    <div className="flex items-center space-x-2">
                      <Select defaultValue={question.type}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                          <SelectItem value="essay">Dissertativa</SelectItem>
                          <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Pergunta</Label>
                      <Textarea 
                        placeholder="Digite a pergunta aqui..."
                        value={question.question}
                        className="mt-1"
                      />
                    </div>
                    
                    {question.type === 'multiple_choice' && (
                      <div>
                        <Label className="text-sm font-medium">Opções de Resposta</Label>
                        <div className="space-y-2 mt-2">
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                name={`question-${question.id}`}
                                checked={question.correct_answer === optionIndex}
                                className="text-blue-600"
                              />
                              <Input 
                                placeholder={`Opção ${optionIndex + 1}`}
                                value={option}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Pontuação</Label>
                        <Input 
                          type="number" 
                          value={question.points}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Explicação (opcional)</Label>
                        <Input 
                          placeholder="Explicação da resposta correta"
                          value={question.explanation}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma questão adicionada
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando a primeira questão da avaliação
              </p>
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Questão
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Configurações do Quiz */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Avaliação</CardTitle>
          <CardDescription>
            Configure as opções da avaliação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Tempo Limite (minutos)</Label>
              <Input 
                type="number" 
                placeholder="30"
                value={quizData.time_limit || ''}
                className="mt-1"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Embaralhar Questões</Label>
                  <p className="text-xs text-gray-600">Questões em ordem aleatória</p>
                </div>
                <Switch 
                  checked={quizData.shuffle_questions}
                  onCheckedChange={(checked) => 
                    setQuizData({ ...quizData, shuffle_questions: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Mostrar Resultados</Label>
                  <p className="text-xs text-gray-600">Exibir nota após conclusão</p>
                </div>
                <Switch 
                  checked={quizData.show_results}
                  onCheckedChange={(checked) => 
                    setQuizData({ ...quizData, show_results: checked })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: CONTEÚDO INTERATIVO
// =====================================================

function InteractiveContentTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo Interativo</CardTitle>
          <CardDescription>
            Configure elementos interativos para o módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Em Desenvolvimento
            </h3>
            <p className="text-gray-600">
              Funcionalidade de conteúdo interativo será implementada em breve
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: VISUALIZAR
// =====================================================

function PreviewContentTab({ form, contentType }: { form: ReturnType<typeof useForm>; contentType: string }) {
  const formData = form.watch();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>Visualização do Conteúdo</span>
          </CardTitle>
          <CardDescription>
            Veja como o conteúdo aparecerá para os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formData.title || 'Título do Conteúdo'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {formData.description || 'Descrição do conteúdo'}
                  </p>
                </div>
                <Badge variant="outline">
                  #{formData.content_order || 1}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formData.estimated_duration || 0} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  {contentType === 'video' && <Video className="h-4 w-4" />}
                  {contentType === 'document' && <FileText className="h-4 w-4" />}
                  {contentType === 'quiz' && <CheckSquare className="h-4 w-4" />}
                  {contentType === 'interactive' && <Monitor className="h-4 w-4" />}
                  <span className="capitalize">
                    {contentType === 'video' ? 'Vídeo' :
                     contentType === 'document' ? 'Documento' :
                     contentType === 'quiz' ? 'Avaliação' : 'Interativo'}
                  </span>
                </div>
                {formData.is_mandatory && (
                  <Badge variant="destructive" className="text-xs">
                    Obrigatório
                  </Badge>
                )}
              </div>
              
              <div className="mt-6 p-4 bg-white rounded border">
                <h4 className="font-medium text-gray-900 mb-2">
                  Visualização em Dispositivos
                </h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Monitor className="h-4 w-4" />
                    <span>Desktop</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Tablet className="h-4 w-4" />
                    <span>Tablet</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContentEditor;