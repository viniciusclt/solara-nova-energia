import React, { useState } from 'react';
import { useTheme, useSystemPreferences } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Type, 
  Layout, 
  Accessibility, 
  Download, 
  Upload,
  RotateCcw,
  Check,
  Eye
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface ThemeCustomizerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ThemeCustomizer({ isOpen = true, onClose }: ThemeCustomizerProps) {
  const {
    settings,
    updateTheme,
    updateColorScheme,
    updateFontSize,
    updateDensity,
    toggleReducedMotion,
    toggleHighContrast,
    updateCustomColors,
    resetToDefaults,
    exportSettings,
    importSettings,
    isDarkMode,
    effectiveTheme
  } = useTheme();

  const systemPrefs = useSystemPreferences();
  const [customColorInputs, setCustomColorInputs] = useState({
    primary: settings.customColors?.primary || '#3b82f6',
    secondary: settings.customColors?.secondary || '#64748b',
    accent: settings.customColors?.accent || '#f59e0b'
  });
  const [importText, setImportText] = useState('');

  const colorSchemes = [
    { value: 'blue', label: 'Azul', color: '#3b82f6' },
    { value: 'green', label: 'Verde', color: '#10b981' },
    { value: 'orange', label: 'Laranja', color: '#f59e0b' },
    { value: 'purple', label: 'Roxo', color: '#8b5cf6' },
    { value: 'red', label: 'Vermelho', color: '#ef4444' }
  ];

  const handleCustomColorChange = (type: 'primary' | 'secondary' | 'accent', color: string) => {
    setCustomColorInputs(prev => ({ ...prev, [type]: color }));
    updateCustomColors({ [type]: color });
  };

  const handleExport = () => {
    const settings = exportSettings();
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Configurações exportadas',
      description: 'Arquivo de configurações baixado com sucesso.'
    });
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, cole as configurações no campo de texto.',
        variant: 'destructive'
      });
      return;
    }

    const success = importSettings(importText);
    if (success) {
      setImportText('');
      toast({
        title: 'Configurações importadas',
        description: 'Tema atualizado com sucesso.'
      });
    } else {
      toast({
        title: 'Erro na importação',
        description: 'Formato de configurações inválido.',
        variant: 'destructive'
      });
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setCustomColorInputs({
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b'
    });
    toast({
      title: 'Configurações resetadas',
      description: 'Tema restaurado para os padrões.'
    });
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalização de Tema
            </CardTitle>
            <CardDescription>
              Customize a aparência e acessibilidade da plataforma
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="accessibility">Acessibilidade</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6">
            {/* Tema */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Tema
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={settings.theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateTheme('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Claro
                </Button>
                <Button
                  variant={settings.theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateTheme('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Escuro
                </Button>
                <Button
                  variant={settings.theme === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateTheme('auto')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Auto
                </Button>
              </div>
              {settings.theme === 'auto' && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Detectado: {effectiveTheme === 'dark' ? 'Escuro' : 'Claro'}
                  {systemPrefs.prefersDark && <Badge variant="secondary" className="text-xs">Sistema</Badge>}
                </div>
              )}
            </div>

            <Separator />

            {/* Esquema de Cores */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Esquema de Cores</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorSchemes.map((scheme) => (
                  <Button
                    key={scheme.value}
                    variant={settings.colorScheme === scheme.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateColorScheme(scheme.value as 'blue' | 'green' | 'purple' | 'orange' | 'red')}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: scheme.color }}
                    />
                    <span className="text-xs">{scheme.label}</span>
                    {settings.colorScheme === scheme.value && (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Cores Customizadas */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Cores Personalizadas</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customColorInputs.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={customColorInputs.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customColorInputs.secondary}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={customColorInputs.secondary}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#64748b"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customColorInputs.accent}
                      onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={customColorInputs.accent}
                      onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            {/* Tamanho da Fonte */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Type className="h-4 w-4" />
                Tamanho da Fonte
              </Label>
              <Select value={settings.fontSize} onValueChange={updateFontSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequena</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Densidade */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Densidade da Interface
              </Label>
              <Select value={settings.density} onValueChange={updateDensity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacta</SelectItem>
                  <SelectItem value="comfortable">Confortável</SelectItem>
                  <SelectItem value="spacious">Espaçosa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                Configurações de Acessibilidade
              </Label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Movimento Reduzido</Label>
                    <p className="text-xs text-muted-foreground">
                      Reduz animações e transições
                    </p>
                    {systemPrefs.prefersReducedMotion && (
                      <Badge variant="secondary" className="text-xs">Detectado pelo sistema</Badge>
                    )}
                  </div>
                  <Switch
                    checked={settings.reducedMotion}
                    onCheckedChange={toggleReducedMotion}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Alto Contraste</Label>
                    <p className="text-xs text-muted-foreground">
                      Aumenta o contraste para melhor legibilidade
                    </p>
                    {systemPrefs.prefersHighContrast && (
                      <Badge variant="secondary" className="text-xs">Detectado pelo sistema</Badge>
                    )}
                  </div>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={toggleHighContrast}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {/* Exportar/Importar */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Backup e Restauração</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetar
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Importar Configurações</Label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole aqui o JSON das configurações..."
                  className="w-full h-24 p-2 text-xs border rounded resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Preview das Configurações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Configurações Atuais</Label>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}