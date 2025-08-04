import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Palette, Type, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/secureLogger';

interface TemplateCustomization {
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  companySubtitle: string;
  logoUrl?: string;
  footerText: string;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

interface TemplateCustomizerProps {
  templateId: string;
  templateName: string;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onSave?: (customization: TemplateCustomization) => void;
  initialCustomization?: Partial<TemplateCustomization>;
}

const defaultCustomization: TemplateCustomization = {
  primaryColor: '#2980b9',
  secondaryColor: '#3498db',
  companyName: 'SolarCalc Pro',
  companySubtitle: 'Soluções em Energia Solar',
  footerText: 'SolarCalc Pro - Soluções em Energia Solar',
  contactInfo: {
    phone: '(11) 9999-9999',
    email: 'contato@solarcalcpro.com.br',
    website: 'www.solarcalcpro.com.br'
  }
};

const predefinedColors = [
  { name: 'Azul Corporativo', primary: '#2980b9', secondary: '#3498db' },
  { name: 'Verde Sustentável', primary: '#27ae60', secondary: '#2ecc71' },
  { name: 'Laranja Energia', primary: '#e67e22', secondary: '#f39c12' },
  { name: 'Roxo Premium', primary: '#8e44ad', secondary: '#9b59b6' },
  { name: 'Cinza Elegante', primary: '#34495e', secondary: '#95a5a6' },
  { name: 'Vermelho Dinâmico', primary: '#c0392b', secondary: '#e74c3c' }
];

export function TemplateCustomizer({
  templateId,
  templateName,
  onCustomizationChange,
  onSave,
  initialCustomization
}: TemplateCustomizerProps) {
  const { toast } = useToast();
  const [customization, setCustomization] = useState<TemplateCustomization>({
    ...defaultCustomization,
    ...initialCustomization
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCustomizationChange = (updates: Partial<TemplateCustomization>) => {
    const newCustomization = { ...customization, ...updates };
    setCustomization(newCustomization);
    onCustomizationChange?.(newCustomization);
  };

  const handleColorPresetSelect = (preset: typeof predefinedColors[0]) => {
    handleCustomizationChange({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro no upload',
        description: 'Por favor, selecione um arquivo de imagem válido',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 2MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setLogoFile(file);

    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        handleCustomizationChange({ logoUrl });
        setIsUploading(false);
        toast({
          title: 'Logo carregado',
          description: 'Logo carregado com sucesso'
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logError('Erro ao fazer upload do logo', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'TemplateCustomizer',
        templateId,
        templateName
      });
      setIsUploading(false);
      toast({
        title: 'Erro no upload',
        description: 'Ocorreu um erro ao carregar o logo',
        variant: 'destructive'
      });
    }
  };

  const handleSave = () => {
    onSave?.(customization);
    toast({
      title: 'Customização salva',
      description: 'As configurações do template foram salvas com sucesso'
    });
  };

  const handleReset = () => {
    setCustomization(defaultCustomization);
    setLogoFile(null);
    onCustomizationChange?.(defaultCustomization);
    toast({
      title: 'Configurações resetadas',
      description: 'As configurações foram restauradas para o padrão'
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Personalizar Template</h3>
        <p className="text-muted-foreground text-sm">
          Customize o template <Badge variant="outline">{templateName}</Badge> com suas cores e informações
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores do Template
            </CardTitle>
            <CardDescription>
              Escolha as cores principais do seu template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Presets */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Paletas Predefinidas</Label>
              <div className="grid grid-cols-2 gap-2">
                {predefinedColors.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleColorPresetSelect(preset)}
                    className="justify-start h-auto p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => handleCustomizationChange({ primaryColor: e.target.value })}
                    className="w-12 h-10 p-1 border rounded"
                    aria-label="Seletor de cor primária"
                  />
                  <Input
                    type="text"
                    value={customization.primaryColor}
                    onChange={(e) => handleCustomizationChange({ primaryColor: e.target.value })}
                    className="flex-1"
                    placeholder="#2980b9"
                    aria-label="Código hexadecimal da cor primária"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={customization.secondaryColor}
                    onChange={(e) => handleCustomizationChange({ secondaryColor: e.target.value })}
                    className="w-12 h-10 p-1 border rounded"
                    aria-label="Seletor de cor secundária"
                  />
                  <Input
                    type="text"
                    value={customization.secondaryColor}
                    onChange={(e) => handleCustomizationChange({ secondaryColor: e.target.value })}
                    className="flex-1"
                    placeholder="#3498db"
                    aria-label="Código hexadecimal da cor secundária"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Configure os textos e logo da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="mt-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="mb-2"
                  aria-label="Upload do logo da empresa"
                />
                {customization.logoUrl && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <img 
                      src={customization.logoUrl} 
                      alt="Preview do logo da empresa carregado" 
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-sm text-muted-foreground">Logo carregado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={customization.companyName}
                onChange={(e) => handleCustomizationChange({ companyName: e.target.value })}
                placeholder="SolarCalc Pro"
                aria-label="Nome da empresa"
              />
            </div>

            {/* Company Subtitle */}
            <div>
              <Label htmlFor="companySubtitle">Subtítulo</Label>
              <Input
                id="companySubtitle"
                value={customization.companySubtitle}
                onChange={(e) => handleCustomizationChange({ companySubtitle: e.target.value })}
                placeholder="Soluções em Energia Solar"
                aria-label="Subtítulo da empresa"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
          <CardDescription>
            Configure as informações de contato que aparecerão no rodapé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={customization.contactInfo.phone}
                onChange={(e) => handleCustomizationChange({
                  contactInfo: { ...customization.contactInfo, phone: e.target.value }
                })}
                placeholder="(11) 9999-9999"
                aria-label="Telefone de contato da empresa"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customization.contactInfo.email}
                onChange={(e) => handleCustomizationChange({
                  contactInfo: { ...customization.contactInfo, email: e.target.value }
                })}
                placeholder="contato@empresa.com.br"
                aria-label="Email de contato da empresa"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={customization.contactInfo.website}
                onChange={(e) => handleCustomizationChange({
                  contactInfo: { ...customization.contactInfo, website: e.target.value }
                })}
                placeholder="www.empresa.com.br"
                aria-label="Website da empresa"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="footerText">Texto do Rodapé</Label>
            <Textarea
              id="footerText"
              value={customization.footerText}
              onChange={(e) => handleCustomizationChange({ footerText: e.target.value })}
              placeholder="Texto que aparecerá no rodapé do template"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Customização
        </Button>
      </div>
    </div>
  );
}