/**
 * Sistema de Breakpoints Responsivos - Design System
 * Gerencia responsividade para desktop, tablet e mobile
 */

import { tokens } from '../tokens';

// =====================================================================================
// BREAKPOINTS E MEDIA QUERIES
// =====================================================================================

export const breakpoints = {
  // Valores dos breakpoints
  values: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  
  // Media queries para CSS-in-JS
  up: {
    xs: '@media (min-width: 0px)',
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)'
  },
  
  down: {
    xs: '@media (max-width: 639px)',
    sm: '@media (max-width: 767px)',
    md: '@media (max-width: 1023px)',
    lg: '@media (max-width: 1279px)',
    xl: '@media (max-width: 1535px)',
    '2xl': '@media (max-width: 9999px)'
  },
  
  only: {
    xs: '@media (max-width: 639px)',
    sm: '@media (min-width: 640px) and (max-width: 767px)',
    md: '@media (min-width: 768px) and (max-width: 1023px)',
    lg: '@media (min-width: 1024px) and (max-width: 1279px)',
    xl: '@media (min-width: 1280px) and (max-width: 1535px)',
    '2xl': '@media (min-width: 1536px)'
  },
  
  between: {
    smMd: '@media (min-width: 640px) and (max-width: 1023px)',
    mdLg: '@media (min-width: 768px) and (max-width: 1279px)',
    lgXl: '@media (min-width: 1024px) and (max-width: 1535px)'
  }
};

// =====================================================================================
// DEVICE CATEGORIES
// =====================================================================================

export const deviceCategories = {
  mobile: {
    breakpoints: ['xs', 'sm'],
    maxWidth: 767,
    characteristics: {
      touch: true,
      orientation: 'portrait',
      density: 'high',
      viewport: 'small'
    }
  },
  
  tablet: {
    breakpoints: ['md'],
    minWidth: 768,
    maxWidth: 1023,
    characteristics: {
      touch: true,
      orientation: 'both',
      density: 'medium',
      viewport: 'medium'
    }
  },
  
  desktop: {
    breakpoints: ['lg', 'xl', '2xl'],
    minWidth: 1024,
    characteristics: {
      touch: false,
      orientation: 'landscape',
      density: 'standard',
      viewport: 'large'
    }
  }
};

// =====================================================================================
// CONTAINER SIZES
// =====================================================================================

export const containerSizes = {
  xs: '100%',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  
  // Containers específicos
  content: {
    xs: '100%',
    sm: '600px',
    md: '720px',
    lg: '960px',
    xl: '1200px',
    '2xl': '1400px'
  },
  
  narrow: {
    xs: '100%',
    sm: '480px',
    md: '560px',
    lg: '640px',
    xl: '720px',
    '2xl': '800px'
  },
  
  wide: {
    xs: '100%',
    sm: '100%',
    md: '100%',
    lg: '1200px',
    xl: '1400px',
    '2xl': '1600px'
  }
};

// =====================================================================================
// GRID SYSTEM
// =====================================================================================

export const gridSystem = {
  // Número de colunas por breakpoint
  columns: {
    xs: 4,
    sm: 8,
    md: 8,
    lg: 12,
    xl: 12,
    '2xl': 12
  },
  
  // Gutters (espaçamento entre colunas)
  gutters: {
    xs: tokens.spacing[2], // 8px
    sm: tokens.spacing[3], // 12px
    md: tokens.spacing[4], // 16px
    lg: tokens.spacing[6], // 24px
    xl: tokens.spacing[6], // 24px
    '2xl': tokens.spacing[8] // 32px
  },
  
  // Margens laterais
  margins: {
    xs: tokens.spacing[4], // 16px
    sm: tokens.spacing[6], // 24px
    md: tokens.spacing[8], // 32px
    lg: tokens.spacing[12], // 48px
    xl: tokens.spacing[16], // 64px
    '2xl': tokens.spacing[20] // 80px
  }
};

// =====================================================================================
// TYPOGRAPHY RESPONSIVE
// =====================================================================================

export const responsiveTypography = {
  // Escalas de tamanho por breakpoint
  scales: {
    xs: {
      h1: tokens.typography.fontSize['2xl'],
      h2: tokens.typography.fontSize.xl,
      h3: tokens.typography.fontSize.lg,
      h4: tokens.typography.fontSize.base,
      body: tokens.typography.fontSize.sm,
      caption: tokens.typography.fontSize.xs
    },
    sm: {
      h1: tokens.typography.fontSize['3xl'],
      h2: tokens.typography.fontSize['2xl'],
      h3: tokens.typography.fontSize.xl,
      h4: tokens.typography.fontSize.lg,
      body: tokens.typography.fontSize.base,
      caption: tokens.typography.fontSize.sm
    },
    md: {
      h1: tokens.typography.fontSize['4xl'],
      h2: tokens.typography.fontSize['3xl'],
      h3: tokens.typography.fontSize['2xl'],
      h4: tokens.typography.fontSize.xl,
      body: tokens.typography.fontSize.base,
      caption: tokens.typography.fontSize.sm
    },
    lg: {
      h1: tokens.typography.fontSize['5xl'],
      h2: tokens.typography.fontSize['4xl'],
      h3: tokens.typography.fontSize['3xl'],
      h4: tokens.typography.fontSize['2xl'],
      body: tokens.typography.fontSize.lg,
      caption: tokens.typography.fontSize.base
    },
    xl: {
      h1: tokens.typography.fontSize['6xl'],
      h2: tokens.typography.fontSize['5xl'],
      h3: tokens.typography.fontSize['4xl'],
      h4: tokens.typography.fontSize['3xl'],
      body: tokens.typography.fontSize.lg,
      caption: tokens.typography.fontSize.base
    }
  },
  
  // Line heights responsivos
  lineHeights: {
    xs: {
      tight: tokens.typography.lineHeight.tight,
      normal: tokens.typography.lineHeight.normal,
      relaxed: tokens.typography.lineHeight.relaxed
    },
    sm: {
      tight: tokens.typography.lineHeight.tight,
      normal: tokens.typography.lineHeight.normal,
      relaxed: tokens.typography.lineHeight.relaxed
    },
    md: {
      tight: tokens.typography.lineHeight.snug,
      normal: tokens.typography.lineHeight.normal,
      relaxed: tokens.typography.lineHeight.loose
    },
    lg: {
      tight: tokens.typography.lineHeight.snug,
      normal: tokens.typography.lineHeight.relaxed,
      relaxed: tokens.typography.lineHeight.loose
    }
  }
};

// =====================================================================================
// SPACING RESPONSIVE
// =====================================================================================

export const responsiveSpacing = {
  // Escalas de espaçamento por breakpoint
  scales: {
    xs: {
      xs: tokens.spacing[1],
      sm: tokens.spacing[2],
      md: tokens.spacing[3],
      lg: tokens.spacing[4],
      xl: tokens.spacing[6]
    },
    sm: {
      xs: tokens.spacing[1],
      sm: tokens.spacing[2],
      md: tokens.spacing[4],
      lg: tokens.spacing[6],
      xl: tokens.spacing[8]
    },
    md: {
      xs: tokens.spacing[2],
      sm: tokens.spacing[3],
      md: tokens.spacing[4],
      lg: tokens.spacing[6],
      xl: tokens.spacing[8]
    },
    lg: {
      xs: tokens.spacing[2],
      sm: tokens.spacing[4],
      md: tokens.spacing[6],
      lg: tokens.spacing[8],
      xl: tokens.spacing[12]
    },
    xl: {
      xs: tokens.spacing[3],
      sm: tokens.spacing[4],
      md: tokens.spacing[6],
      lg: tokens.spacing[10],
      xl: tokens.spacing[16]
    }
  },
  
  // Componentes específicos
  components: {
    button: {
      padding: {
        xs: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
        sm: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
        md: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
        lg: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
        xl: `${tokens.spacing[4]} ${tokens.spacing[6]}`
      },
      gap: {
        xs: tokens.spacing[1],
        sm: tokens.spacing[2],
        md: tokens.spacing[2],
        lg: tokens.spacing[3],
        xl: tokens.spacing[3]
      }
    },
    
    card: {
      padding: {
        xs: tokens.spacing[4],
        sm: tokens.spacing[4],
        md: tokens.spacing[6],
        lg: tokens.spacing[6],
        xl: tokens.spacing[8]
      },
      gap: {
        xs: tokens.spacing[3],
        sm: tokens.spacing[4],
        md: tokens.spacing[4],
        lg: tokens.spacing[6],
        xl: tokens.spacing[6]
      }
    },
    
    input: {
      padding: {
        xs: tokens.spacing[2],
        sm: tokens.spacing[3],
        md: tokens.spacing[3],
        lg: tokens.spacing[4],
        xl: tokens.spacing[4]
      },
      height: {
        xs: '36px',
        sm: '40px',
        md: '44px',
        lg: '48px',
        xl: '52px'
      }
    }
  }
};

// =====================================================================================
// LAYOUT PATTERNS
// =====================================================================================

export const layoutPatterns = {
  // Stack (vertical)
  stack: {
    gap: {
      xs: tokens.spacing[2],
      sm: tokens.spacing[3],
      md: tokens.spacing[4],
      lg: tokens.spacing[6],
      xl: tokens.spacing[8]
    }
  },
  
  // Inline (horizontal)
  inline: {
    gap: {
      xs: tokens.spacing[2],
      sm: tokens.spacing[3],
      md: tokens.spacing[4],
      lg: tokens.spacing[4],
      xl: tokens.spacing[6]
    }
  },
  
  // Grid layouts
  grid: {
    financial: {
      xs: 'grid-cols-1',
      sm: 'grid-cols-1',
      md: 'grid-cols-2',
      lg: 'grid-cols-3',
      xl: 'grid-cols-4'
    },
    
    video: {
      xs: 'grid-cols-1',
      sm: 'grid-cols-2',
      md: 'grid-cols-2',
      lg: 'grid-cols-3',
      xl: 'grid-cols-4'
    },
    
    proposal: {
      xs: 'grid-cols-1',
      sm: 'grid-cols-1',
      md: 'grid-cols-2',
      lg: 'grid-cols-2',
      xl: 'grid-cols-3'
    }
  }
};

// =====================================================================================
// UTILITIES
// =====================================================================================

export const responsiveUtilities = {
  // Classes de visibilidade
  visibility: {
    showOnMobile: 'block sm:hidden',
    hideOnMobile: 'hidden sm:block',
    showOnTablet: 'hidden md:block lg:hidden',
    hideOnTablet: 'block md:hidden lg:block',
    showOnDesktop: 'hidden lg:block',
    hideOnDesktop: 'block lg:hidden'
  },
  
  // Classes de orientação
  orientation: {
    portrait: '@media (orientation: portrait)',
    landscape: '@media (orientation: landscape)'
  },
  
  // Classes de densidade
  density: {
    highDPI: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
    lowDPI: '@media (-webkit-max-device-pixel-ratio: 1.5), (max-resolution: 144dpi)'
  },
  
  // Classes de preferências do usuário
  preferences: {
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
    darkMode: '@media (prefers-color-scheme: dark)',
    lightMode: '@media (prefers-color-scheme: light)',
    highContrast: '@media (prefers-contrast: high)'
  }
};

export default {
  breakpoints,
  deviceCategories,
  containerSizes,
  gridSystem,
  responsiveTypography,
  responsiveSpacing,
  layoutPatterns,
  responsiveUtilities
};