import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import {
  Code,
  Copy,
  Download,
  Play,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Settings,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface CodeMetadata {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  showLineNumbers: boolean;
  showCopyButton: boolean;
  allowDownload: boolean;
  executable: boolean;
  filename?: string;
  description?: string;
  highlightLines?: number[];
  foldable: boolean;
  maxHeight?: number;
}

interface CodeBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string, metadata?: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'sql', label: 'SQL' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'dart', label: 'Dart' },
  { value: 'plaintext', label: 'Texto Simples' },
];

export const CodeBlock: React.FC<CodeBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [content, setContent] = useState(block.content || '');
  const [metadata, setMetadata] = useState<CodeMetadata>(() => ({
    language: block.metadata?.language || 'javascript',
    theme: block.metadata?.theme || 'auto',
    showLineNumbers: block.metadata?.showLineNumbers ?? true,
    showCopyButton: block.metadata?.showCopyButton ?? true,
    allowDownload: block.metadata?.allowDownload ?? false,
    executable: block.metadata?.executable ?? false,
    filename: block.metadata?.filename || '',
    description: block.metadata?.description || '',
    highlightLines: block.metadata?.highlightLines || [],
    foldable: block.metadata?.foldable ?? false,
    maxHeight: block.metadata?.maxHeight,
  }));
  
  const [showSettings, setShowSettings] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    onUpdate(newContent, metadata);
  }, [metadata, onUpdate]);

  const updateMetadata = useCallback((updates: Partial<CodeMetadata>) => {
    const newMetadata = { ...metadata, ...updates };
    setMetadata(newMetadata);
    onUpdate(content, newMetadata);
  }, [content, metadata, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      updateContent(newContent);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onStopEdit();
    }

    // Handle formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          onStopEdit();
          break;
        case 'Enter':
          e.preventDefault();
          if (metadata.executable) {
            executeCode();
          }
          break;
      }
    }

    onKeyDown?.(e);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar código:', error);
    }
  };

  const downloadCode = () => {
    const filename = metadata.filename || `code.${getFileExtension(metadata.language)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const executeCode = async () => {
    if (!metadata.executable) return;
    
    setIsExecuting(true);
    setExecutionResult('');
    
    try {
      // Simular execução de código - em produção, isso seria uma chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (metadata.language === 'javascript') {
        // Simular execução de JavaScript
        try {
          const result = eval(content);
          setExecutionResult(String(result));
        } catch (error) {
          setExecutionResult(`Erro: ${error}`);
        }
      } else {
        setExecutionResult('Execução simulada - resultado seria exibido aqui');
      }
    } catch (error) {
      setExecutionResult(`Erro na execução: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      cpp: 'cpp',
      c: 'c',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      markdown: 'md',
      bash: 'sh',
      powershell: 'ps1',
      sql: 'sql',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      dart: 'dart',
    };
    return extensions[language] || 'txt';
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      typescript: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      python: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      java: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      csharp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      html: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      css: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      json: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[language] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const shouldShowExpanded = metadata.maxHeight && content.split('\n').length > 20;

  return (
    <div className="relative group">
      {/* Controls */}
      {isSelected && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1">
          {/* Language selector */}
          <Select value={metadata.language} onValueChange={(value) => updateMetadata({ language: value })}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Theme selector */}
          <Select value={metadata.theme} onValueChange={(value) => updateMetadata({ theme: value as CodeMetadata['theme'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Line numbers toggle */}
          <Button
            variant={metadata.showLineNumbers ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ showLineNumbers: !metadata.showLineNumbers })}
            className="h-8 px-2 text-xs"
          >
            Linhas
          </Button>
          
          {/* Executable toggle */}
          <Button
            variant={metadata.executable ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ executable: !metadata.executable })}
            className="h-8 w-8 p-0"
          >
            <Play className="h-3 w-3" />
          </Button>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Settings */}
          <Button
            variant={showSettings ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && isSelected && (
        <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-3 w-80">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nome do arquivo"
                value={metadata.filename}
                onChange={(e) => updateMetadata({ filename: e.target.value })}
                className="text-xs"
              />
              <Input
                placeholder="Altura máxima (px)"
                type="number"
                value={metadata.maxHeight || ''}
                onChange={(e) => updateMetadata({ maxHeight: e.target.value ? parseInt(e.target.value) : undefined })}
                className="text-xs"
              />
            </div>
            
            <Input
              placeholder="Descrição do código"
              value={metadata.description}
              onChange={(e) => updateMetadata({ description: e.target.value })}
              className="text-xs"
            />
            
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={metadata.showCopyButton}
                  onChange={(e) => updateMetadata({ showCopyButton: e.target.checked })}
                  className="rounded"
                />
                Botão copiar
              </label>
              
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={metadata.allowDownload}
                  onChange={(e) => updateMetadata({ allowDownload: e.target.checked })}
                  className="rounded"
                />
                Download
              </label>
              
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={metadata.foldable}
                  onChange={(e) => updateMetadata({ foldable: e.target.checked })}
                  className="rounded"
                />
                Dobrável
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative rounded-lg border transition-all duration-200',
          'hover:border-primary/30',
          isSelected && 'ring-2 ring-primary/20 border-primary/30',
          !isEditing && 'cursor-pointer'
        )}
        onClick={!isEditing ? onStartEdit : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn('px-2 py-1 rounded text-xs font-medium', getLanguageColor(metadata.language))}>
              {SUPPORTED_LANGUAGES.find(l => l.value === metadata.language)?.label || metadata.language}
            </div>
            
            {metadata.filename && (
              <span className="text-xs text-muted-foreground">
                {metadata.filename}
              </span>
            )}
            
            {metadata.description && (
              <span className="text-xs text-muted-foreground">
                — {metadata.description}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {metadata.executable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  executeCode();
                }}
                disabled={isExecuting}
                className="h-6 w-6 p-0"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            
            {shouldShowExpanded && metadata.foldable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            )}
            
            {metadata.showCopyButton && content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
                className="h-6 w-6 p-0"
              >
                {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            )}
            
            {metadata.allowDownload && content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadCode();
                }}
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Code content */}
        <div className="relative">
          {isEditing ? (
            <div className="p-3">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Digite seu código ${metadata.language} aqui...`}
                className="w-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed"
                rows={Math.max(5, content.split('\n').length + 1)}
                autoFocus
                spellCheck={false}
              />
            </div>
          ) : (
            <pre
              ref={codeRef}
              className={cn(
                'p-3 overflow-auto font-mono text-sm leading-relaxed',
                metadata.maxHeight && !isExpanded && `max-h-[${metadata.maxHeight}px]`,
                metadata.theme === 'dark' && 'bg-gray-900 text-gray-100',
                metadata.theme === 'light' && 'bg-gray-50 text-gray-900'
              )}
            >
              {content ? (
                <code className={`language-${metadata.language}`}>
                  {metadata.showLineNumbers ? (
                    content.split('\n').map((line, index) => (
                      <div key={index} className="flex">
                        <span className="select-none text-muted-foreground mr-4 text-right w-8">
                          {index + 1}
                        </span>
                        <span className={cn(
                          metadata.highlightLines?.includes(index + 1) && 'bg-yellow-200 dark:bg-yellow-800/30'
                        )}>
                          {line || ' '}
                        </span>
                      </div>
                    ))
                  ) : (
                    content
                  )}
                </code>
              ) : (
                <span className="text-muted-foreground italic">
                  Clique para adicionar código...
                </span>
              )}
            </pre>
          )}
        </div>
        
        {/* Execution result */}
        {metadata.executable && (executionResult || isExecuting) && (
          <div className="border-t bg-muted/20">
            <div className="px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">Resultado:</div>
              {isExecuting ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
                  Executando...
                </div>
              ) : (
                <pre className="text-sm font-mono bg-background p-2 rounded border">
                  {executionResult}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Code info indicator */}
      {!isEditing && content && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
            <Code className="h-3 w-3" />
            <span>{content.split('\n').length} linhas</span>
            {metadata.executable && <span>• executável</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeBlock;