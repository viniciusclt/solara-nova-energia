import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Palette, 
  Clock, 
  Repeat,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useAnimationSystem } from './AnimationSystem';
import {
  AnimationType,
  EasingType,
  AnimationConfig,
  AnimationPreset,
  AnimationControlsState
} from '../../types/animations';

interface AnimationControlsProps {
  selectedElementId?: string;
  onAnimationChange?: (config: AnimationConfig) => void;
  onPresetSelect?: (preset: AnimationPreset) => void;
  className?: string;
}

const animationTypes: { value: AnimationType; label: string; category: string }[] = [
  { value: 'fadeIn', label: 'Fade In', category: 'Entrance' },
  { value: 'fadeOut', label: 'Fade Out', category: 'Exit' },
  { value: 'slideInLeft', label: 'Slide In Left', category: 'Entrance' },
  { value: 'slideInRight', label: 'Slide In Right', category: 'Entrance' },
  { value: 'slideInUp', label: 'Slide In Up', category: 'Entrance' },
  { value: 'slideInDown', label: 'Slide In Down', category: 'Entrance' },
  { value: 'slideOutLeft', label: 'Slide Out Left', category: 'Exit' },
  { value: 'slideOutRight', label: 'Slide Out Right', category: 'Exit' },
  { value: 'slideOutUp', label: 'Slide Out Up', category: 'Exit' },
  { value: 'slideOutDown', label: 'Slide Out Down', category: 'Exit' },
  { value: 'scaleIn', label: 'Scale In', category: 'Entrance' },
  { value: 'scaleOut', label: 'Scale Out', category: 'Exit' },
  { value: 'rotateIn', label: 'Rotate In', category: 'Entrance' },
  { value: 'rotateOut', label: 'Rotate Out', category: 'Exit' },
  { value: 'bounce', label: 'Bounce', category: 'Emphasis' },
  { value: 'pulse', label: 'Pulse', category: 'Emphasis' },
  { value: 'shake', label: 'Shake', category: 'Emphasis' },
  { value: 'flip', label: 'Flip', category: 'Transition' },
  { value: 'zoom', label: 'Zoom', category: 'Transition' },
  { value: 'elastic', label: 'Elastic', category: 'Transition' }
];

const easingTypes: { value: EasingType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In Out' },
  { value: 'circIn', label: 'Circular In' },
  { value: 'circOut', label: 'Circular Out' },
  { value: 'circInOut', label: 'Circular In Out' },
  { value: 'backIn', label: 'Back In' },
  { value: 'backOut', label: 'Back Out' },
  { value: 'backInOut', label: 'Back In Out' },
  { value: 'anticipate', label: 'Anticipate' },
  { value: 'bounceIn', label: 'Bounce In' },
  { value: 'bounceOut', label: 'Bounce Out' },
  { value: 'bounceInOut', label: 'Bounce In Out' }
];

const PresetCard: React.FC<{
  preset: AnimationPreset;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ preset, isSelected, onSelect }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'entrance': return 'bg-green-100 text-green-800';
      case 'exit': return 'bg-red-100 text-red-800';
      case 'emphasis': return 'bg-yellow-100 text-yellow-800';
      case 'transition': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{preset.name}</h4>
        <Badge className={`text-xs ${getCategoryColor(preset.category)}`}>
          {preset.category}
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">
        {preset.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{preset.config.duration}s</span>
        <span>{preset.config.easing}</span>
      </div>
    </motion.div>
  );
};

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  selectedElementId,
  onAnimationChange,
  onPresetSelect,
  className
}) => {
  const { config, library, updateConfig } = useAnimationSystem();
  const [currentConfig, setCurrentConfig] = useState<AnimationConfig>({
    type: 'fadeIn',
    duration: 0.5,
    delay: 0,
    easing: 'easeOut'
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleConfigChange = useCallback((updates: Partial<AnimationConfig>) => {
    const newConfig = { ...currentConfig, ...updates };
    setCurrentConfig(newConfig);
    onAnimationChange?.(newConfig);
  }, [currentConfig, onAnimationChange]);

  const handlePresetSelect = useCallback((preset: AnimationPreset) => {
    setSelectedPreset(preset.id);
    setCurrentConfig(preset.config);
    onPresetSelect?.(preset);
    onAnimationChange?.(preset.config);
  }, [onPresetSelect, onAnimationChange]);

  const handleGlobalConfigChange = useCallback((key: string, value: unknown) => {
    updateConfig({ [key]: value });
  }, [updateConfig]);

  const groupedPresets = library.presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, AnimationPreset[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Animation Controls</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="presets" className="space-y-4">
            {Object.entries(groupedPresets).map(([category, presets]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-sm capitalize">{category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {presets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPreset === preset.id}
                      onSelect={() => handlePresetSelect(preset)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Animation Type</Label>
                <Select
                  value={currentConfig.type}
                  onValueChange={(value: AnimationType) => 
                    handleConfigChange({ type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {animationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Duration: {currentConfig.duration}s</Label>
                <Slider
                  value={[currentConfig.duration]}
                  onValueChange={([value]) => handleConfigChange({ duration: value })}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Delay: {currentConfig.delay || 0}s</Label>
                <Slider
                  value={[currentConfig.delay || 0]}
                  onValueChange={([value]) => handleConfigChange({ delay: value })}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Easing</Label>
                <Select
                  value={currentConfig.easing}
                  onValueChange={(value: EasingType) => 
                    handleConfigChange({ easing: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {easingTypes.map((easing) => (
                      <SelectItem key={easing.value} value={easing.value}>
                        {easing.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select
                  value={currentConfig.repeat?.toString() || 'none'}
                  onValueChange={(value) => {
                    const repeat = value === 'none' ? undefined : 
                                 value === 'infinite' ? 'infinite' : parseInt(value);
                    handleConfigChange({ repeat });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1">1 time</SelectItem>
                    <SelectItem value="2">2 times</SelectItem>
                    <SelectItem value="3">3 times</SelectItem>
                    <SelectItem value="infinite">Infinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduced Motion</Label>
                  <p className="text-xs text-muted-foreground">
                    Respect user's motion preferences
                  </p>
                </div>
                <Switch
                  checked={config.reducedMotion}
                  onCheckedChange={(checked) => 
                    handleGlobalConfigChange('reducedMotion', checked)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Show animation events in console
                  </p>
                </div>
                <Switch
                  checked={config.debugMode}
                  onCheckedChange={(checked) => 
                    handleGlobalConfigChange('debugMode', checked)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Global Duration: {config.globalDuration}s</Label>
                <Slider
                  value={[config.globalDuration || 0.5]}
                  onValueChange={([value]) => 
                    handleGlobalConfigChange('globalDuration', value)
                  }
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Global Easing</Label>
                <Select
                  value={config.globalEasing}
                  onValueChange={(value: EasingType) => 
                    handleGlobalConfigChange('globalEasing', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {easingTypes.map((easing) => (
                      <SelectItem key={easing.value} value={easing.value}>
                        {easing.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AnimationControls;