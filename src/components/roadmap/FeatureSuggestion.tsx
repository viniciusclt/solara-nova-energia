/**
 * Componente de Sugestão de Funcionalidade
 * 
 * Permite que usuários sugiram novas funcionalidades para o roadmap,
 * incluindo formulário de criação e validação
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  Send, 
  X, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Plus,
  Minus
} from 'lucide-react';
import { useRoadmapData } from '@/hooks/useRoadmapData';
import { useNotifications } from '@/hooks/useNotifications';
import type {
  FeatureCategory,
  FeaturePriority,
  CreateFeatureRequest
} from '@/types/roadmap';
import { 
  FEATURE_CATEGORY_LABELS,
  FEATURE_PRIORITY_LABELS
} from '@/types/roadmap';

export interface FeatureSuggestionProps {
  onSuccess?: (featureId: string) => void;
  onCancel?: () => void;
  className?: string;
  isModal?: boolean;
}

interface FormData {
  title: string;
  description: string;
  category: FeatureCategory | '';
  priority: FeaturePriority | '';
  tags: string[];
  business_value: string;
  technical_requirements: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  business_value?: string;
  technical_requirements?: string;
}

const INITIAL_FORM_DATA: FormData = {
  title: '',
  description: '',
  category: '',
  priority: '',
  tags: [],
  business_value: '',
  technical_requirements: ''
};

export function FeatureSuggestion({ 
  onSuccess, 
  onCancel, 
  className, 
  isModal = false 
}: FeatureSuggestionProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createFeature } = useRoadmapData();
  const { addNotification } = useNotifications();
  
  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Título deve ter pelo menos 5 caracteres';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Título deve ter no máximo 100 caracteres';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Descrição deve ter pelo menos 20 caracteres';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Descrição deve ter no máximo 1000 caracteres';
    }
    
    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Prioridade é obrigatória';
    }
    
    if (!formData.business_value.trim()) {
      newErrors.business_value = 'Valor de negócio é obrigatório';
    } else if (formData.business_value.length < 10) {
      newErrors.business_value = 'Valor de negócio deve ter pelo menos 10 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Atualizar campo do formulário
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  // Adicionar tag
  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      updateField('tags', [...formData.tags, tag]);
      setNewTag('');
    }
  };
  
  // Remover tag
  const removeTag = (tagToRemove: string) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };
  
  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification({
        type: 'error',
        title: 'Erro de validação',
        message: 'Por favor, corrija os erros no formulário'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const request: CreateFeatureRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as FeatureCategory,
        priority: formData.priority as FeaturePriority,
        tags: formData.tags,
        metadata: {
          business_value: formData.business_value.trim(),
          technical_requirements: formData.technical_requirements.trim() || undefined
        }
      };
      
      const newFeature = await createFeature(request);
      
      addNotification({
        type: 'success',
        title: 'Funcionalidade criada!',
        message: 'Sua sugestão foi enviada e está aguardando análise'
      });
      
      // Reset form
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      
      onSuccess?.(newFeature.id);
      
    } catch (error) {
      console.error('Erro ao criar funcionalidade:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao criar funcionalidade',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancelar
  const handleCancel = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    onCancel?.();
  };
  
  const containerClass = isModal 
    ? `${className}` 
    : `max-w-2xl mx-auto ${className}`;
  
  return (
    <div className={containerClass}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              <div>
                <CardTitle className="text-xl">Sugerir Nova Funcionalidade</CardTitle>
                <CardDescription>
                  Compartilhe sua ideia para melhorar a plataforma
                </CardDescription>
              </div>
            </div>
            {isModal && onCancel && (
              <Button onClick={handleCancel} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Funcionalidade *</Label>
              <Input
                id="title"
                placeholder="Ex: Integração com WhatsApp Business"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
                maxLength={100}
              />
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.title}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 caracteres
              </p>
            </div>
            
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada *</Label>
              <Textarea
                id="description"
                placeholder="Descreva detalhadamente a funcionalidade que você gostaria de ver implementada..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
                maxLength={1000}
              />
              {errors.description && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.description}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 caracteres
              </p>
            </div>
            
            {/* Categoria e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => updateField('category', value as FeatureCategory)}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEATURE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.category}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => updateField('priority', value as FeaturePriority)}
                >
                  <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEATURE_PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.priority}</span>
                  </p>
                )}
              </div>
            </div>
            
            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (opcional)</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  disabled={formData.tags.length >= 5}
                />
                <Button 
                  type="button" 
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                  disabled={!newTag.trim() || formData.tags.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Máximo 5 tags. Use tags para categorizar melhor sua sugestão.
              </p>
            </div>
            
            <Separator />
            
            {/* Valor de Negócio */}
            <div className="space-y-2">
              <Label htmlFor="business_value">Valor de Negócio *</Label>
              <Textarea
                id="business_value"
                placeholder="Explique como esta funcionalidade agregaria valor ao negócio e aos usuários..."
                value={formData.business_value}
                onChange={(e) => updateField('business_value', e.target.value)}
                className={`min-h-[100px] ${errors.business_value ? 'border-red-500' : ''}`}
                maxLength={500}
              />
              {errors.business_value && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.business_value}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.business_value.length}/500 caracteres
              </p>
            </div>
            
            {/* Requisitos Técnicos */}
            <div className="space-y-2">
              <Label htmlFor="technical_requirements">Requisitos Técnicos (opcional)</Label>
              <Textarea
                id="technical_requirements"
                placeholder="Se você tem conhecimento técnico, descreva possíveis requisitos ou considerações técnicas..."
                value={formData.technical_requirements}
                onChange={(e) => updateField('technical_requirements', e.target.value)}
                className="min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.technical_requirements.length}/500 caracteres
              </p>
            </div>
            
            {/* Botões de ação */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Sugestão
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Dicas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Dicas para uma boa sugestão</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Seja específico e claro na descrição da funcionalidade</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Explique o problema que a funcionalidade resolve</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Descreva como isso beneficiaria outros usuários</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Use tags relevantes para facilitar a categorização</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>Seja realista quanto à prioridade da funcionalidade</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}