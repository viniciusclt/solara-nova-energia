// ============================================================================
// Theme Customizer - Personalizador de temas para diagramas
// Componente de customização visual inspirado no MindMeister
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Palette,
  Brush,
  Type,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Grid,
  Sun,
  Moon,
  Monitor,
  Contrast,
  Droplet,
  Sparkles,
  Wand2,
  Download,
  Upload,
  RotateCcw,
  Save,
  Share,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  Settings,
  Layers,
  Image,
  Gradient,
  Paintbrush,
  Pipette,
  Eraser,
  Ruler,
  Move,
  RotateCw,
  Maximize,
  Minimize
} from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'light';
  padding: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: { x: number; y: number };
}

export interface EdgeStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray: string;
  markerEnd: string;
  markerStart: string;
  animated: boolean;
  curvature: number;
}

export interface GridStyle {
  visible: boolean;
  color: string;
  size: number;
  opacity: number;
  pattern: 'dots' | 'lines' | 'cross';
}

export interface DiagramTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  nodeStyles: {
    default: NodeStyle;
    selected: NodeStyle;
    hover: NodeStyle;
    [key: string]: NodeStyle;
  };
  edgeStyles: {
    default: EdgeStyle;
    selected: EdgeStyle;
    hover: EdgeStyle;
    [key: string]: EdgeStyle;
  };
  gridStyle: GridStyle;
  backgroundImage?: string;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: string;
  };
}

export interface ThemeCustomizerProps {
  currentTheme: DiagramTheme;
  onThemeChange: (theme: DiagramTheme) => void;
  onSaveTheme: (theme: DiagramTheme) => void;
  onLoadTheme: (themeId: string) => void;
  availableThemes: DiagramTheme[];
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface ColorPaletteProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onCustomColor: (color: string) => void;
  className?: string;
}

export interface StylePresetProps {
  presets: NodeStyle[];
  selectedPreset: NodeStyle;
  onPresetSelect: (preset: NodeStyle) => void;
  onCreatePreset: (preset: NodeStyle) => void;
  className?: string;
}

// ============================================================================
// PALETAS DE CORES PREDEFINIDAS
// ============================================================================

const COLOR_PALETTES = {
  basic: [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ],
  material: [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B'
  ],
  solar: [
    '#FDB462', '#FB8500', '#FFB700', '#FFDD00', '#FFEE32',
    '#8ECAE6', '#219EBC', '#023047', '#126782', '#1A535C',
    '#4ECDC4', '#44A08D', '#093637', '#2E8B57', '#228B22'
  ],
  pastel: [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#E6E6FA', '#F0E68C', '#DDA0DD', '#98FB98', '#F5DEB3'
  ],
  dark: [
    '#1A1A1A', '#2D2D2D', '#404040', '#595959', '#737373',
    '#8C8C8C', '#A6A6A6', '#BFBFBF', '#D9D9D9', '#F2F2F2'
  ]
};

// ============================================================================
// TEMAS PREDEFINIDOS
// ============================================================================

const DEFAULT_THEMES: DiagramTheme[] = [
  {
    id: 'light',
    name: 'Claro',
    description: 'Tema claro e limpo para uso geral',
    colors: {
      primary: '#2196F3',
      secondary: '#FFC107',
      accent: '#4CAF50',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      border: '#E0E0E0',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3'
    },
    nodeStyles: {
      default: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        textColor: '#212121',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 12,
        shadow: true,
        shadowColor: '#00000020',
        shadowBlur: 4,
        shadowOffset: { x: 0, y: 2 }
      },
      selected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
        borderWidth: 2,
        borderRadius: 8,
        textColor: '#1976D2',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 12,
        shadow: true,
        shadowColor: '#2196F340',
        shadowBlur: 8,
        shadowOffset: { x: 0, y: 4 }
      },
      hover: {
        backgroundColor: '#F5F5F5',
        borderColor: '#BDBDBD',
        borderWidth: 1,
        borderRadius: 8,
        textColor: '#212121',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 12,
        shadow: true,
        shadowColor: '#00000030',
        shadowBlur: 6,
        shadowOffset: { x: 0, y: 3 }
      }
    },
    edgeStyles: {
      default: {
        strokeColor: '#9E9E9E',
        strokeWidth: 2,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: false,
        curvature: 0.25
      },
      selected: {
        strokeColor: '#2196F3',
        strokeWidth: 3,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: true,
        curvature: 0.25
      },
      hover: {
        strokeColor: '#757575',
        strokeWidth: 2,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: false,
        curvature: 0.25
      }
    },
    gridStyle: {
      visible: true,
      color: '#E0E0E0',
      size: 20,
      opacity: 0.5,
      pattern: 'dots'
    }
  },
  {
    id: 'dark',
    name: 'Escuro',
    description: 'Tema escuro para reduzir fadiga visual',
    colors: {
      primary: '#64B5F6',
      secondary: '#FFB74D',
      accent: '#81C784',
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      border: '#333333',
      success: '#81C784',
      warning: '#FFB74D',
      error: '#E57373',
      info: '#64B5F6'
    },
    nodeStyles: {
      default: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333333',
        borderWidth: 1,
        borderRadius: 8,
        textColor: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 12,
        shadow: true,
        shadowColor: '#00000040',
        shadowBlur: 4,
        shadowOffset: { x: 0, y: 2 }
      },
      selected: {
        backgroundColor: '#0D47A1',
        borderColor: '#64B5F6',
        borderWidth: 2,
        borderRadius: 8,
        textColor: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 12,
        shadow: true,
        shadowColor: '#64B5F640',
        shadowBlur: 8,
        shadowOffset: { x: 0, y: 4 }
      },
      hover: {
        backgroundColor: '#2A2A2A',
        borderColor: '#555555',
        borderWidth: 1,
        borderRadius: 8,
        textColor: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 12,
        shadow: true,
        shadowColor: '#00000050',
        shadowBlur: 6,
        shadowOffset: { x: 0, y: 3 }
      }
    },
    edgeStyles: {
      default: {
        strokeColor: '#666666',
        strokeWidth: 2,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: false,
        curvature: 0.25
      },
      selected: {
        strokeColor: '#64B5F6',
        strokeWidth: 3,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: true,
        curvature: 0.25
      },
      hover: {
        strokeColor: '#888888',
        strokeWidth: 2,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: false,
        curvature: 0.25
      }
    },
    gridStyle: {
      visible: true,
      color: '#333333',
      size: 20,
      opacity: 0.3,
      pattern: 'dots'
    }
  },
  {
    id: 'solar',
    name: 'Solar',
    description: 'Tema inspirado em energia solar',
    colors: {
      primary: '#FB8500',
      secondary: '#FFB700',
      accent: '#8ECAE6',
      background: '#FFFCF2',
      surface: '#FFF8E7',
      text: '#023047',
      textSecondary: '#126782',
      border: '#FFD60A',
      success: '#4ECDC4',
      warning: '#FFB700',
      error: '#FF6B6B',
      info: '#219EBC'
    },
    nodeStyles: {
      default: {
        backgroundColor: '#FFF8E7',
        borderColor: '#FFD60A',
        borderWidth: 2,
        borderRadius: 12,
        textColor: '#023047',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 16,
        shadow: true,
        shadowColor: '#FB850020',
        shadowBlur: 6,
        shadowOffset: { x: 0, y: 3 }
      },
      selected: {
        backgroundColor: '#FFE8CC',
        borderColor: '#FB8500',
        borderWidth: 3,
        borderRadius: 12,
        textColor: '#023047',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        padding: 16,
        shadow: true,
        shadowColor: '#FB850040',
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 5 }
      },
      hover: {
        backgroundColor: '#FFF3D6',
        borderColor: '#FFB700',
        borderWidth: 2,
        borderRadius: 12,
        textColor: '#023047',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        padding: 16,
        shadow: true,
        shadowColor: '#FFB70030',
        shadowBlur: 8,
        shadowOffset: { x: 0, y: 4 }
      }
    },
    edgeStyles: {
      default: {
        strokeColor: '#126782',
        strokeWidth: 2,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: false,
        curvature: 0.3
      },
      selected: {
        strokeColor: '#FB8500',
        strokeWidth: 4,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: true,
        curvature: 0.3
      },
      hover: {
        strokeColor: '#219EBC',
        strokeWidth: 3,
        strokeDasharray: '',
        markerEnd: 'arrowclosed',
        markerStart: '',
        animated: false,
        curvature: 0.3
      }
    },
    gridStyle: {
      visible: true,
      color: '#FFD60A',
      size: 25,
      opacity: 0.2,
      pattern: 'lines'
    },
    backgroundGradient: {
      type: 'linear',
      colors: ['#FFFCF2', '#FFF8E7'],
      direction: '45deg'
    }
  }
];

// ============================================================================
// COLOR PALETTE - Paleta de cores
// ============================================================================

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  onCustomColor,
  className
}) => {
  const [customColor, setCustomColor] = useState('#000000');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "w-8 h-8 rounded border-2 transition-all hover:scale-110",
                    selectedColor === color ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorSelect(color)}
                />
              </TooltipTrigger>
              <TooltipContent>
                <span>{color}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="flex-1"
        >
          <Pipette className="w-4 h-4 mr-2" />
          Cor personalizada
        </Button>
      </div>
      
      {showCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-8 p-0 border-0"
          />
          <Input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#000000"
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => onCustomColor(customColor)}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// THEME CUSTOMIZER - Personalizador principal
// ============================================================================

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  currentTheme,
  onThemeChange,
  onSaveTheme,
  onLoadTheme,
  availableThemes,
  className,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [workingTheme, setWorkingTheme] = useState<DiagramTheme>(currentTheme);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof COLOR_PALETTES>('material');

  // Atualizar tema de trabalho quando o tema atual mudar
  useEffect(() => {
    setWorkingTheme(currentTheme);
    setHasChanges(false);
  }, [currentTheme]);

  // Detectar mudanças
  useEffect(() => {
    const changed = JSON.stringify(workingTheme) !== JSON.stringify(currentTheme);
    setHasChanges(changed);
  }, [workingTheme, currentTheme]);

  const updateTheme = useCallback((updates: Partial<DiagramTheme>) => {
    setWorkingTheme(prev => ({ ...prev, ...updates }));
  }, []);

  const updateColors = useCallback((updates: Partial<ThemeColors>) => {
    setWorkingTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, ...updates }
    }));
  }, []);

  const updateNodeStyle = useCallback((styleKey: string, updates: Partial<NodeStyle>) => {
    setWorkingTheme(prev => ({
      ...prev,
      nodeStyles: {
        ...prev.nodeStyles,
        [styleKey]: { ...prev.nodeStyles[styleKey], ...updates }
      }
    }));
  }, []);

  const updateEdgeStyle = useCallback((styleKey: string, updates: Partial<EdgeStyle>) => {
    setWorkingTheme(prev => ({
      ...prev,
      edgeStyles: {
        ...prev.edgeStyles,
        [styleKey]: { ...prev.edgeStyles[styleKey], ...updates }
      }
    }));
  }, []);

  const updateGridStyle = useCallback((updates: Partial<GridStyle>) => {
    setWorkingTheme(prev => ({
      ...prev,
      gridStyle: { ...prev.gridStyle, ...updates }
    }));
  }, []);

  const applyChanges = () => {
    onThemeChange(workingTheme);
    setHasChanges(false);
  };

  const resetChanges = () => {
    setWorkingTheme(currentTheme);
    setHasChanges(false);
  };

  const saveTheme = () => {
    onSaveTheme(workingTheme);
    setHasChanges(false);
  };

  if (!isOpen) return null;

  return (
    <Card className={cn("fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-96 max-h-[80vh]", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalizar Tema
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Alterações pendentes
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[60vh]">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="nodes">Nós</TabsTrigger>
                <TabsTrigger value="edges">Conexões</TabsTrigger>
                <TabsTrigger value="grid">Grade</TabsTrigger>
              </TabsList>
              
              {/* Aba Geral */}
              <TabsContent value="general" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Tema Base</Label>
                  <Select value={workingTheme.id} onValueChange={(value) => {
                    const theme = [...DEFAULT_THEMES, ...availableThemes].find(t => t.id === value);
                    if (theme) setWorkingTheme(theme);
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_THEMES.map(theme => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                      {availableThemes.map(theme => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name} (Personalizado)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Paleta de Cores</Label>
                  <Select value={selectedPalette} onValueChange={(value: keyof typeof COLOR_PALETTES) => setSelectedPalette(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básica</SelectItem>
                      <SelectItem value="material">Material Design</SelectItem>
                      <SelectItem value="solar">Solar</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                      <SelectItem value="dark">Escura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Cores do Tema</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(workingTheme.colors).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-200 cursor-pointer"
                            style={{ backgroundColor: value }}
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'color';
                              input.value = value;
                              input.onchange = (e) => {
                                updateColors({ [key]: (e.target as HTMLInputElement).value });
                              };
                              input.click();
                            }}
                          />
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateColors({ [key]: e.target.value })}
                            className="text-xs h-6"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <ColorPalette
                  colors={COLOR_PALETTES[selectedPalette]}
                  selectedColor={workingTheme.colors.primary}
                  onColorSelect={(color) => updateColors({ primary: color })}
                  onCustomColor={(color) => updateColors({ primary: color })}
                />
              </TabsContent>
              
              {/* Aba Nós */}
              <TabsContent value="nodes" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Estilo dos Nós</Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="selected">Selecionado</SelectItem>
                      <SelectItem value="hover">Hover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Cor de Fundo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        style={{ backgroundColor: workingTheme.nodeStyles.default.backgroundColor }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = workingTheme.nodeStyles.default.backgroundColor;
                          input.onchange = (e) => {
                            updateNodeStyle('default', { backgroundColor: (e.target as HTMLInputElement).value });
                          };
                          input.click();
                        }}
                      />
                      <Input
                        type="text"
                        value={workingTheme.nodeStyles.default.backgroundColor}
                        onChange={(e) => updateNodeStyle('default', { backgroundColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Cor da Borda</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        style={{ backgroundColor: workingTheme.nodeStyles.default.borderColor }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = workingTheme.nodeStyles.default.borderColor;
                          input.onchange = (e) => {
                            updateNodeStyle('default', { borderColor: (e.target as HTMLInputElement).value });
                          };
                          input.click();
                        }}
                      />
                      <Input
                        type="text"
                        value={workingTheme.nodeStyles.default.borderColor}
                        onChange={(e) => updateNodeStyle('default', { borderColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Largura da Borda: {workingTheme.nodeStyles.default.borderWidth}px</Label>
                    <Slider
                      value={[workingTheme.nodeStyles.default.borderWidth]}
                      onValueChange={([value]) => updateNodeStyle('default', { borderWidth: value })}
                      min={0}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Raio da Borda: {workingTheme.nodeStyles.default.borderRadius}px</Label>
                    <Slider
                      value={[workingTheme.nodeStyles.default.borderRadius]}
                      onValueChange={([value]) => updateNodeStyle('default', { borderRadius: value })}
                      min={0}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Tamanho da Fonte: {workingTheme.nodeStyles.default.fontSize}px</Label>
                    <Slider
                      value={[workingTheme.nodeStyles.default.fontSize]}
                      onValueChange={([value]) => updateNodeStyle('default', { fontSize: value })}
                      min={8}
                      max={32}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="node-shadow"
                      checked={workingTheme.nodeStyles.default.shadow}
                      onCheckedChange={(checked) => updateNodeStyle('default', { shadow: checked })}
                    />
                    <Label htmlFor="node-shadow" className="text-sm">Sombra</Label>
                  </div>
                </div>
              </TabsContent>
              
              {/* Aba Conexões */}
              <TabsContent value="edges" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Cor da Linha</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        style={{ backgroundColor: workingTheme.edgeStyles.default.strokeColor }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = workingTheme.edgeStyles.default.strokeColor;
                          input.onchange = (e) => {
                            updateEdgeStyle('default', { strokeColor: (e.target as HTMLInputElement).value });
                          };
                          input.click();
                        }}
                      />
                      <Input
                        type="text"
                        value={workingTheme.edgeStyles.default.strokeColor}
                        onChange={(e) => updateEdgeStyle('default', { strokeColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Largura da Linha: {workingTheme.edgeStyles.default.strokeWidth}px</Label>
                    <Slider
                      value={[workingTheme.edgeStyles.default.strokeWidth]}
                      onValueChange={([value]) => updateEdgeStyle('default', { strokeWidth: value })}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Curvatura: {workingTheme.edgeStyles.default.curvature}</Label>
                    <Slider
                      value={[workingTheme.edgeStyles.default.curvature]}
                      onValueChange={([value]) => updateEdgeStyle('default', { curvature: value })}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edge-animated"
                      checked={workingTheme.edgeStyles.default.animated}
                      onCheckedChange={(checked) => updateEdgeStyle('default', { animated: checked })}
                    />
                    <Label htmlFor="edge-animated" className="text-sm">Animação</Label>
                  </div>
                </div>
              </TabsContent>
              
              {/* Aba Grade */}
              <TabsContent value="grid" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="grid-visible"
                      checked={workingTheme.gridStyle.visible}
                      onCheckedChange={(checked) => updateGridStyle({ visible: checked })}
                    />
                    <Label htmlFor="grid-visible" className="text-sm">Mostrar Grade</Label>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Padrão da Grade</Label>
                    <Select 
                      value={workingTheme.gridStyle.pattern} 
                      onValueChange={(value: 'dots' | 'lines' | 'cross') => updateGridStyle({ pattern: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dots">Pontos</SelectItem>
                        <SelectItem value="lines">Linhas</SelectItem>
                        <SelectItem value="cross">Cruz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Cor da Grade</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        style={{ backgroundColor: workingTheme.gridStyle.color }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = workingTheme.gridStyle.color;
                          input.onchange = (e) => {
                            updateGridStyle({ color: (e.target as HTMLInputElement).value });
                          };
                          input.click();
                        }}
                      />
                      <Input
                        type="text"
                        value={workingTheme.gridStyle.color}
                        onChange={(e) => updateGridStyle({ color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Tamanho da Grade: {workingTheme.gridStyle.size}px</Label>
                    <Slider
                      value={[workingTheme.gridStyle.size]}
                      onValueChange={([value]) => updateGridStyle({ size: value })}
                      min={10}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Opacidade: {Math.round(workingTheme.gridStyle.opacity * 100)}%</Label>
                    <Slider
                      value={[workingTheme.gridStyle.opacity]}
                      onValueChange={([value]) => updateGridStyle({ opacity: value })}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        
        {/* Ações */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetChanges}
                disabled={!hasChanges}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveTheme}
                disabled={!hasChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button
                size="sm"
                onClick={applyChanges}
                disabled={!hasChanges}
              >
                <Check className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ThemeCustomizer,
  ColorPalette,
  DEFAULT_THEMES,
  COLOR_PALETTES
};