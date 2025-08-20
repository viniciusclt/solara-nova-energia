// =====================================================
// EDITOR DE MÓDULOS DE TREINAMENTO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  X,
  Upload,
  FileText,
  Video,
  Image,
  Link,
  Settings,
  Users,
  Clock,
  Target,
  Tag,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit3
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
import { Separator } from '../../../components/ui/separator';
import { useTrainingModules, useModuleContent, useVideoUpload } from '../hooks/useTraining';
import { useAuth } from '../../../contexts/AuthContext';
import type { ModuleFormData, ContentFormData, TrainingModule } from '../types';

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const moduleSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration: z.number().min(1, 'Duração deve ser maior que 0'),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  learning_objectives: z.array(z.string()).min(1, 'Pelo menos um objetivo é obrigatório'),
  target_roles: z.array(z.string()).optional(),
  is_mandatory: z.boolean().default(false),
  is_active: z.boolean().default(true),
  certificate_template: z.string().optional(),
  passing_score: z.number().min(0).max(100).default(70)
});

const contentSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  content_type: z.enum(['video', 'document', 'quiz', 'interactive']),
  content_order: z.number().min(1),
  description: z.string().optional(),
  content_data: z.record(z.unknown()).optional(),
  is_mandatory: z.boolean().default(true),
  estimated_duration: z.number().min(1).optional()
});

type ModuleFormValues = z.infer<typeof moduleSchema>;
type ContentFormValues = z.infer<typeof contentSchema>;

// =====================================================
// INTERFACES
// =====================================================

interface ModuleEditorProps {
  moduleId?: string;
  onSave?: (module: TrainingModule) => void;
  onCancel?: () => void;
  isOpen: boolean;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ModuleEditor({ moduleId, onSave, onCancel, isOpen }: ModuleEditorProps) {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('basic');
  const [tagInput, setTagInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');
  
  // Hooks para dados
  const { createModule, updateModule, isCreating, isUpdating } = useTrainingModules();
  const { module } = useTrainingModules();
  const { content, createContent, updateContent, deleteContent } = useModuleContent(moduleId || '');
  
  // Form principal
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      difficulty_level: 'beginner',
      estimated_duration: 60,
      tags: [],
      prerequisites: [],
      learning_objectives: [],
      target_roles: [],
      is_mandatory: false,
      is_active: true,
      passing_score: 70
    }
  });
  
  const { fields: objectives, append: addObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: 'learning_objectives'
  });
  
  const { fields: tags, append: addTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags'
  });
  
  const { fields: prerequisites, append: addPrerequisite, remove: removePrerequisite } = useFieldArray({
    control: form.control,
    name: 'prerequisites'
  });
  
  // =====================================================
  // EFEITOS
  // =====================================================
  
  useEffect(() => {
    if (moduleId && module) {
      form.reset({
        title: module.title,
        description: module.description,
        category: module.category,
        difficulty_level: module.difficulty_level,
        estimated_duration: module.estimated_duration,
        tags: module.tags || [],
        prerequisites: module.prerequisites || [],
        learning_objectives: module.learning_objectives || [],
        target_roles: module.target_roles || [],
        is_mandatory: module.is_mandatory,
        is_active: module.is_active,
        passing_score: module.passing_score
      });
    }
  }, [moduleId, module, form]);
  
  // =====================================================
  // HANDLERS
  // =====================================================
  
  const handleSubmit = async (data: ModuleFormValues) => {
    try {
      if (moduleId) {
        const updatedModule = await updateModule({ moduleId, moduleData: data });
        onSave?.(updatedModule);
      } else {
        const newModule = await createModule(data);
        onSave?.(newModule);
      }
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
    }
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !form.getValues('tags')?.includes(tagInput.trim())) {
      addTag(tagInput.trim());
      setTagInput('');
    }
  };
  
  const handleAddObjective = () => {
    if (objectiveInput.trim()) {
      addObjective(objectiveInput.trim());
      setObjectiveInput('');
    }
  };
  
  const handleAddPrerequisite = () => {
    if (prerequisiteInput.trim()) {
      addPrerequisite(prerequisiteInput.trim());
      setPrerequisiteInput('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {moduleId ? 'Editar Módulo' : 'Novo Módulo'}
              </h2>
              <p className="text-sm text-gray-600">
                {moduleId ? 'Atualize as informações do módulo' : 'Crie um novo módulo de treinamento'}
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="settings">Configurações</TabsTrigger>
                  <TabsTrigger value="preview">Visualizar</TabsTrigger>
                </TabsList>
                
                {/* Aba: Informações Básicas */}
                <TabsContent value="basic" className="space-y-6">
                  <BasicInfoTab form={form} />
                  
                  {/* Objetivos de Aprendizagem */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <span>Objetivos de Aprendizagem</span>
                      </CardTitle>
                      <CardDescription>
                        Defina o que os alunos irão aprender neste módulo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Digite um objetivo de aprendizagem..."
                          value={objectiveInput}
                          onChange={(e) => setObjectiveInput(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, handleAddObjective)}
                        />
                        <Button type="button" onClick={handleAddObjective}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {objectives.map((objective, index) => (
                          <div key={objective.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm">{objective.value || objective}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeObjective(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {form.formState.errors.learning_objectives && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.learning_objectives.message}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Tags e Pré-requisitos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tags */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Tag className="h-5 w-5 text-blue-600" />
                          <span>Tags</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Adicionar tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                          />
                          <Button type="button" onClick={handleAddTag}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <Badge key={tag.id} variant="secondary" className="flex items-center space-x-1">
                              <span>{tag.value || tag}</span>
                              <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Pré-requisitos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          <span>Pré-requisitos</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Adicionar pré-requisito..."
                            value={prerequisiteInput}
                            onChange={(e) => setPrerequisiteInput(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, handleAddPrerequisite)}
                          />
                          <Button type="button" onClick={handleAddPrerequisite}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {prerequisites.map((prerequisite, index) => (
                            <div key={prerequisite.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                              <span className="text-sm">{prerequisite.value || prerequisite}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePrerequisite(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Aba: Conteúdo */}
                <TabsContent value="content" className="space-y-6">
                  <ContentTab moduleId={moduleId} content={content} />
                </TabsContent>
                
                {/* Aba: Configurações */}
                <TabsContent value="settings" className="space-y-6">
                  <SettingsTab form={form} />
                </TabsContent>
                
                {/* Aba: Visualizar */}
                <TabsContent value="preview" className="space-y-6">
                  <PreviewTab form={form} />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span>Todas as alterações serão salvas automaticamente</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {moduleId ? 'Atualizar' : 'Criar'} Módulo
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

function BasicInfoTab({ form }: { form: ReturnType<typeof useForm> }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
          <CardDescription>
            Defina as informações básicas do módulo de treinamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Módulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fundamentos de Energia Solar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="safety">Segurança</SelectItem>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="management">Gestão</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="soft-skills">Soft Skills</SelectItem>
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
                    placeholder="Descreva o conteúdo e objetivos do módulo..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="difficulty_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Dificuldade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="estimated_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração Estimada (minutos)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="60"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
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
// ABA: CONTEÚDO
// =====================================================

interface ContentItem {
  id: string;
  title: string;
  content_type: 'video' | 'document' | 'quiz';
  estimated_duration?: number;
}

function ContentTab({ moduleId, content }: { moduleId?: string; content: ContentItem[] }) {
  const [showContentForm, setShowContentForm] = useState(false);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conteúdo do Módulo</CardTitle>
              <CardDescription>
                Adicione vídeos, documentos e avaliações ao módulo
              </CardDescription>
            </div>
            <Button onClick={() => setShowContentForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conteúdo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {content.length > 0 ? (
            <div className="space-y-3">
              {content.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded">
                      {item.content_type === 'video' && <Video className="h-4 w-4 text-blue-600" />}
                      {item.content_type === 'document' && <FileText className="h-4 w-4 text-blue-600" />}
                      {item.content_type === 'quiz' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">
                        {item.content_type === 'video' ? 'Vídeo' :
                         item.content_type === 'document' ? 'Documento' : 'Avaliação'}
                        {item.estimated_duration && ` • ${item.estimated_duration} min`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      #{index + 1}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum conteúdo adicionado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece adicionando vídeos, documentos ou avaliações
              </p>
              <Button onClick={() => setShowContentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Conteúdo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: CONFIGURAÇÕES
// =====================================================

function SettingsTab({ form }: { form: ReturnType<typeof useForm> }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Módulo</CardTitle>
          <CardDescription>
            Configure as opções avançadas do módulo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_mandatory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Treinamento Obrigatório</FormLabel>
                      <FormDescription>
                        Este módulo será obrigatório para todos os usuários
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
              
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Módulo Ativo</FormLabel>
                      <FormDescription>
                        Usuários podem acessar e iniciar este módulo
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
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="passing_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Mínima para Aprovação (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 70)}
                      />
                    </FormControl>
                    <FormDescription>
                      Nota mínima necessária para obter certificado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: VISUALIZAR
// =====================================================

function PreviewTab({ form }: { form: ReturnType<typeof useForm> }) {
  const formData = form.watch();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>Visualização do Módulo</span>
          </CardTitle>
          <CardDescription>
            Veja como o módulo aparecerá para os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {formData.title || 'Título do Módulo'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {formData.description || 'Descrição do módulo'}
                  </p>
                </div>
                <Badge 
                  variant={formData.difficulty_level === 'beginner' ? 'secondary' : 
                          formData.difficulty_level === 'intermediate' ? 'default' : 'destructive'}
                >
                  {formData.difficulty_level === 'beginner' ? 'Iniciante' :
                   formData.difficulty_level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formData.estimated_duration || 0} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{formData.category || 'Categoria'}</span>
                </div>
                {formData.is_mandatory && (
                  <Badge variant="destructive" className="text-xs">
                    Obrigatório
                  </Badge>
                )}
              </div>
              
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {formData.learning_objectives && formData.learning_objectives.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Objetivos de Aprendizagem:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {formData.learning_objectives.map((objective: string, index: number) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {formData.prerequisites && formData.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pré-requisitos:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {formData.prerequisites.map((prerequisite: string, index: number) => (
                      <li key={index}>{prerequisite}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ModuleEditor;