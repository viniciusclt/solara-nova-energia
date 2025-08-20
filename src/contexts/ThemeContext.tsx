import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ColorScheme = 'blue' | 'green' | 'orange' | 'purple' | 'red';
type FontSize = 'small' | 'medium' | 'large';
type Density = 'compact' | 'comfortable' | 'spacious';

interface ThemeSettings {
  theme: Theme;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  density: Density;
  reducedMotion: boolean;
  highContrast: boolean;
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateTheme: (theme: Theme) => void;
  updateColorScheme: (scheme: ColorScheme) => void;
  updateFontSize: (size: FontSize) => void;
  updateDensity: (density: Density) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  updateCustomColors: (colors: Partial<ThemeSettings['customColors']>) => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => boolean;
  isDarkMode: boolean;
  effectiveTheme: 'light' | 'dark';
}

const defaultSettings: ThemeSettings = {
  theme: 'auto',
  colorScheme: 'blue',
  fontSize: 'medium',
  density: 'comfortable',
  reducedMotion: false,
  highContrast: false
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('theme-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (error) {
        console.warn('Erro ao carregar configurações de tema:', error);
      }
    }
    return defaultSettings;
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Detectar mudanças na preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calcular tema efetivo
  const effectiveTheme: 'light' | 'dark' = 
    settings.theme === 'auto' 
      ? (systemPrefersDark ? 'dark' : 'light')
      : settings.theme;

  const isDarkMode = effectiveTheme === 'dark';

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('theme-settings', JSON.stringify(settings));
  }, [settings]);

  // Aplicar classes CSS no documento
  useEffect(() => {
    const root = document.documentElement;
    
    // Tema
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    
    // Esquema de cores
    root.classList.remove('scheme-blue', 'scheme-green', 'scheme-orange', 'scheme-purple', 'scheme-red');
    root.classList.add(`scheme-${settings.colorScheme}`);
    
    // Tamanho da fonte
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${settings.fontSize}`);
    
    // Densidade
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    root.classList.add(`density-${settings.density}`);
    
    // Movimento reduzido
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Alto contraste
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Cores customizadas
    if (settings.customColors) {
      const style = root.style;
      if (settings.customColors.primary) {
        style.setProperty('--color-primary-custom', settings.customColors.primary);
      }
      if (settings.customColors.secondary) {
        style.setProperty('--color-secondary-custom', settings.customColors.secondary);
      }
      if (settings.customColors.accent) {
        style.setProperty('--color-accent-custom', settings.customColors.accent);
      }
    }
  }, [settings, effectiveTheme]);

  const updateTheme = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const updateColorScheme = (colorScheme: ColorScheme) => {
    setSettings(prev => ({ ...prev, colorScheme }));
  };

  const updateFontSize = (fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const updateDensity = (density: Density) => {
    setSettings(prev => ({ ...prev, density }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const updateCustomColors = (colors: Partial<ThemeSettings['customColors']>) => {
    setSettings(prev => ({
      ...prev,
      customColors: { ...prev.customColors, ...colors }
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('theme-settings');
  };

  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string): boolean => {
    try {
      const imported = JSON.parse(settingsJson);
      const validatedSettings = { ...defaultSettings, ...imported };
      setSettings(validatedSettings);
      return true;
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      return false;
    }
  };

  const value: ThemeContextType = {
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
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}

// Hook para detectar preferências do sistema
export function useSystemPreferences() {
  const [preferences, setPreferences] = useState(() => ({
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches
  }));

  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const updatePreferences = () => {
      setPreferences({
        prefersDark: darkQuery.matches,
        prefersReducedMotion: motionQuery.matches,
        prefersHighContrast: contrastQuery.matches
      });
    };

    darkQuery.addEventListener('change', updatePreferences);
    motionQuery.addEventListener('change', updatePreferences);
    contrastQuery.addEventListener('change', updatePreferences);

    return () => {
      darkQuery.removeEventListener('change', updatePreferences);
      motionQuery.removeEventListener('change', updatePreferences);
      contrastQuery.removeEventListener('change', updatePreferences);
    };
  }, []);

  return preferences;
}

// Hook para aplicar configurações de acessibilidade automaticamente
export function useAccessibilitySync() {
  const { settings, toggleReducedMotion, toggleHighContrast } = useTheme();
  const systemPrefs = useSystemPreferences();

  useEffect(() => {
    // Sincronizar movimento reduzido com preferência do sistema
    if (systemPrefs.prefersReducedMotion && !settings.reducedMotion) {
      toggleReducedMotion();
    }
  }, [systemPrefs.prefersReducedMotion, settings.reducedMotion, toggleReducedMotion]);

  useEffect(() => {
    // Sincronizar alto contraste com preferência do sistema
    if (systemPrefs.prefersHighContrast && !settings.highContrast) {
      toggleHighContrast();
    }
  }, [systemPrefs.prefersHighContrast, settings.highContrast, toggleHighContrast]);
}