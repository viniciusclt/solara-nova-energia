// ============================================================================
// TemplateGalleryModal Component - Modal da galeria de templates
// ============================================================================
// Modal em tela cheia para exibir a galeria de templates de diagramas
// Usa o hook useTemplates para gerenciamento de estado
// ============================================================================

import React, { useState, useCallback } from 'react';
import { X, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemplateGallery } from './TemplateGallery';
import { DiagramTemplate } from '../services/DiagramTemplateService';
import { DiagramType } from '../types';
import { useTemplates } from '../hooks/useTemplates';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: DiagramTemplate) => void;
  selectedType?: DiagramType;
  title?: string;
  description?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  selectedType,
  title = 'Galeria de Templates',
  description = 'Escolha um template para começar rapidamente'
}) => {
  // ============================================================================
  // HOOKS
  // ============================================================================
  
  const { createFromTemplate } = useTemplates({ defaultType: selectedType });
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleTemplateSelect = useCallback((template: DiagramTemplate) => {
    // Criar diagrama a partir do template
    const diagram = createFromTemplate(template.id);
    
    if (diagram) {
      onTemplateSelect(template);
      onClose();
    }
  }, [onTemplateSelect, onClose, createFromTemplate]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Template className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-xl">{title}</DialogTitle>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <TemplateGallery
            onTemplateSelect={handleTemplateSelect}
            selectedType={selectedType}
            showHeader={false}
            showFilters={true}
            layout="grid"
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateGalleryModal;