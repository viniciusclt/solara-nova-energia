import React from 'react';
import {
  Button,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
} from '@/components/ui';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Image,
  Video,
  Table,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Settings,
  Users,
  Eye,
  Edit,
  Palette,
  Type,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockType } from '../types/editor';

interface EditorToolbarProps {
  // Editor state
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  viewMode: 'edit' | 'preview';
  
  // Formatting state
  selectedText?: {
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isStrikethrough: boolean;
    isCode: boolean;
    alignment: 'left' | 'center' | 'right' | 'justify';
    fontSize: number;
    fontFamily: string;
  };
  
  // Collaboration
  collaborationUsers: Array<{
    id: string;
    name: string;
    avatar?: string;
    color: string;
  }>;
  isCollaborationEnabled: boolean;
  
  // Actions
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: (format: 'json' | 'markdown' | 'pdf') => void;
  onImport: () => void;
  onViewModeChange: (mode: 'edit' | 'preview') => void;
  onFormatText: (format: string, value?: string | number | boolean) => void;
  onInsertBlock: (type: BlockType) => void;
  onShowSettings: () => void;
  onShowCollaboration: () => void;
  
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  canUndo,
  canRedo,
  isSaving,
  hasUnsavedChanges,
  viewMode,
  selectedText,
  collaborationUsers,
  isCollaborationEnabled,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onImport,
  onViewModeChange,
  onFormatText,
  onInsertBlock,
  onShowSettings,
  onShowCollaboration,
  className,
}) => {
  const formatButtons = [
    {
      icon: Bold,
      label: 'Negrito',
      action: () => onFormatText('bold'),
      isActive: selectedText?.isBold,
      shortcut: 'Ctrl+B',
    },
    {
      icon: Italic,
      label: 'Itálico',
      action: () => onFormatText('italic'),
      isActive: selectedText?.isItalic,
      shortcut: 'Ctrl+I',
    },
    {
      icon: Underline,
      label: 'Sublinhado',
      action: () => onFormatText('underline'),
      isActive: selectedText?.isUnderline,
      shortcut: 'Ctrl+U',
    },
    {
      icon: Strikethrough,
      label: 'Riscado',
      action: () => onFormatText('strikethrough'),
      isActive: selectedText?.isStrikethrough,
    },
    {
      icon: Code,
      label: 'Código inline',
      action: () => onFormatText('code'),
      isActive: selectedText?.isCode,
      shortcut: 'Ctrl+`',
    },
  ];

  const alignmentButtons = [
    {
      icon: AlignLeft,
      label: 'Alinhar à esquerda',
      value: 'left',
    },
    {
      icon: AlignCenter,
      label: 'Centralizar',
      value: 'center',
    },
    {
      icon: AlignRight,
      label: 'Alinhar à direita',
      value: 'right',
    },
    {
      icon: AlignJustify,
      label: 'Justificar',
      value: 'justify',
    },
  ];

  const insertButtons = [
    {
      icon: List,
      label: 'Lista com marcadores',
      type: 'list' as BlockType,
    },
    {
      icon: ListOrdered,
      label: 'Lista numerada',
      type: 'list' as BlockType,
    },
    {
      icon: Quote,
      label: 'Citação',
      type: 'quote' as BlockType,
    },
    {
      icon: Image,
      label: 'Imagem',
      type: 'image' as BlockType,
    },
    {
      icon: Video,
      label: 'Vídeo',
      type: 'video' as BlockType,
    },
    {
      icon: Table,
      label: 'Tabela',
      type: 'table' as BlockType,
    },
  ];

  return (
    <div className={cn(
      'flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      {/* History Actions */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        {/* Font Family */}
        <Select
          value={selectedText?.fontFamily || 'Inter'}
          onValueChange={(value) => onFormatText('fontFamily', value)}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Inter">Inter</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Courier New">Courier</SelectItem>
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select
          value={selectedText?.fontSize?.toString() || '16'}
          onValueChange={(value) => onFormatText('fontSize', parseInt(value))}
        >
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="14">14</SelectItem>
            <SelectItem value="16">16</SelectItem>
            <SelectItem value="18">18</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="24">24</SelectItem>
            <SelectItem value="32">32</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Format Buttons */}
      <div className="flex items-center gap-1">
        {formatButtons.map((button) => {
          const Icon = button.icon;
          return (
            <Tooltip key={button.label}>
              <TooltipTrigger asChild>
                <Button
                  variant={button.isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={button.action}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {button.label}
                {button.shortcut && (
                  <span className="ml-2 text-xs opacity-60">
                    {button.shortcut}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment */}
      <div className="flex items-center gap-1">
        {alignmentButtons.map((button) => {
          const Icon = button.icon;
          return (
            <Tooltip key={button.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedText?.alignment === button.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFormatText('alignment', button.value)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{button.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Insert Elements */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Zap className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-1">
            {insertButtons.map((button) => {
              const Icon = button.icon;
              return (
                <Button
                  key={button.type}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onInsertBlock(button.type)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {button.label}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* View Mode */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('edit')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Modo de Edição</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('preview')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Modo de Visualização</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1" />

      {/* Collaboration */}
      {isCollaborationEnabled && (
        <>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowCollaboration}
            >
              <Users className="h-4 w-4" />
              {collaborationUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {collaborationUsers.length}
                </Badge>
              )}
            </Button>
            
            {/* User Avatars */}
            <div className="flex -space-x-2">
              {collaborationUsers.slice(0, 3).map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{user.name}</TooltipContent>
                </Tooltip>
              ))}
              {collaborationUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{collaborationUsers.length - 3}
                </div>
              )}
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* File Actions */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onImport}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Importar</TooltipContent>
        </Tooltip>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('json')}
              >
                Exportar JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('markdown')}
              >
                Exportar Markdown
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('pdf')}
              >
                Exportar PDF
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Settings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Configurações</TooltipContent>
      </Tooltip>

      {/* Save */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            size="sm"
            className="ml-2"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {hasUnsavedChanges && <span className="ml-2">•</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Salvar (Ctrl+S)
          {hasUnsavedChanges && (
            <span className="block text-xs opacity-60">
              Alterações não salvas
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default EditorToolbar;