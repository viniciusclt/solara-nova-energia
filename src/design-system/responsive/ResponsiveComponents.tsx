/**
 * Componentes Responsivos - Design System
 * Componentes que se adaptam automaticamente aos breakpoints
 */

import React, { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { useResponsive, useDevice, useBreakpoint } from './useResponsive';
import { responsiveSpacing, layoutPatterns } from './breakpoints';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

interface BaseResponsiveProps {
  children: ReactNode;
  className?: string;
}

interface ResponsiveContainerProps extends BaseResponsiveProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  type?: 'default' | 'content' | 'narrow' | 'wide';
  padding?: ResponsiveValue<string> | boolean;
  maxWidth?: ResponsiveValue<string>;
  centerContent?: boolean;
}

interface ResponsiveGridProps extends BaseResponsiveProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<string>;
  type?: 'financial' | 'video' | 'proposal' | 'custom';
  autoFit?: boolean;
  minItemWidth?: string;
}

interface ResponsiveStackProps extends BaseResponsiveProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  direction?: ResponsiveValue<'row' | 'column'>;
  gap?: ResponsiveValue<string>;
  align?: ResponsiveValue<'start' | 'center' | 'end' | 'stretch'>;
  justify?: ResponsiveValue<'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'>;
  wrap?: ResponsiveValue<boolean>;
}

interface ResponsiveTextProps extends BaseResponsiveProps, Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  size?: ResponsiveValue<'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'>;
  weight?: ResponsiveValue<'light' | 'normal' | 'medium' | 'semibold' | 'bold'>;
  align?: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>;
  lineHeight?: ResponsiveValue<'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'>;
}

interface ResponsiveShowHideProps extends BaseResponsiveProps {
  show?: ResponsiveValue<boolean>;
  hide?: ResponsiveValue<boolean>;
  showOn?: 'mobile' | 'tablet' | 'desktop' | 'touch' | 'hover';
  hideOn?: 'mobile' | 'tablet' | 'desktop' | 'touch' | 'hover';
}

// =====================================================================================
// RESPONSIVE CONTAINER
// =====================================================================================

export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>((
  {
    children,
    type = 'default',
    padding = true,
    maxWidth,
    centerContent = true,
    className = '',
    ...props
  },
  ref
) => {
  const { getContainerClasses, getResponsiveValue, getResponsiveClasses } = useResponsive();
  
  const baseClasses = getContainerClasses(type);
  
  const paddingClasses = typeof padding === 'boolean' 
    ? (padding ? 'px-4 sm:px-6 lg:px-8' : '')
    : getResponsiveClasses({
        xs: padding.xs ? `px-${padding.xs}` : undefined,
        sm: padding.sm ? `sm:px-${padding.sm}` : undefined,
        md: padding.md ? `md:px-${padding.md}` : undefined,
        lg: padding.lg ? `lg:px-${padding.lg}` : undefined,
        xl: padding.xl ? `xl:px-${padding.xl}` : undefined,
        '2xl': padding['2xl'] ? `2xl:px-${padding['2xl']}` : undefined
      });
  
  const maxWidthClasses = maxWidth ? getResponsiveClasses({
    xs: maxWidth.xs ? `max-w-${maxWidth.xs}` : undefined,
    sm: maxWidth.sm ? `sm:max-w-${maxWidth.sm}` : undefined,
    md: maxWidth.md ? `md:max-w-${maxWidth.md}` : undefined,
    lg: maxWidth.lg ? `lg:max-w-${maxWidth.lg}` : undefined,
    xl: maxWidth.xl ? `xl:max-w-${maxWidth.xl}` : undefined,
    '2xl': maxWidth['2xl'] ? `2xl:max-w-${maxWidth['2xl']}` : undefined
  }) : '';
  
  const centerClasses = centerContent ? 'mx-auto' : '';
  
  const finalClassName = [baseClasses, paddingClasses, maxWidthClasses, centerClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={finalClassName} {...props}>
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

// =====================================================================================
// RESPONSIVE GRID
// =====================================================================================

export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>((
  {
    children,
    columns,
    gap,
    type = 'custom',
    autoFit = false,
    minItemWidth = '250px',
    className = '',
    ...props
  },
  ref
) => {
  const { getGridClasses, getResponsiveClasses } = useResponsive();
  
  let gridClasses = '';
  
  if (type !== 'custom') {
    gridClasses = getGridClasses(type);
  } else if (columns) {
    gridClasses = getResponsiveClasses({
      xs: columns.xs ? `grid-cols-${columns.xs}` : undefined,
      sm: columns.sm ? `sm:grid-cols-${columns.sm}` : undefined,
      md: columns.md ? `md:grid-cols-${columns.md}` : undefined,
      lg: columns.lg ? `lg:grid-cols-${columns.lg}` : undefined,
      xl: columns.xl ? `xl:grid-cols-${columns.xl}` : undefined,
      '2xl': columns['2xl'] ? `2xl:grid-cols-${columns['2xl']}` : undefined
    });
  } else if (autoFit) {
    gridClasses = `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`;
  }
  
  const gapClasses = gap ? getResponsiveClasses({
    xs: gap.xs ? `gap-${gap.xs}` : undefined,
    sm: gap.sm ? `sm:gap-${gap.sm}` : undefined,
    md: gap.md ? `md:gap-${gap.md}` : undefined,
    lg: gap.lg ? `lg:gap-${gap.lg}` : undefined,
    xl: gap.xl ? `xl:gap-${gap.xl}` : undefined,
    '2xl': gap['2xl'] ? `2xl:gap-${gap['2xl']}` : undefined
  }) : 'gap-4';
  
  const finalClassName = ['grid', gridClasses, gapClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={finalClassName} {...props}>
      {children}
    </div>
  );
});

ResponsiveGrid.displayName = 'ResponsiveGrid';

// =====================================================================================
// RESPONSIVE STACK
// =====================================================================================

export const ResponsiveStack = forwardRef<HTMLDivElement, ResponsiveStackProps>((
  {
    children,
    direction = { xs: 'column', lg: 'row' },
    gap = { xs: '4', sm: '6' },
    align,
    justify,
    wrap,
    className = '',
    ...props
  },
  ref
) => {
  const { getResponsiveClasses } = useResponsive();
  
  const directionClasses = getResponsiveClasses({
    xs: direction.xs ? `flex-${direction.xs}` : undefined,
    sm: direction.sm ? `sm:flex-${direction.sm}` : undefined,
    md: direction.md ? `md:flex-${direction.md}` : undefined,
    lg: direction.lg ? `lg:flex-${direction.lg}` : undefined,
    xl: direction.xl ? `xl:flex-${direction.xl}` : undefined,
    '2xl': direction['2xl'] ? `2xl:flex-${direction['2xl']}` : undefined
  });
  
  const gapClasses = getResponsiveClasses({
    xs: gap.xs ? `gap-${gap.xs}` : undefined,
    sm: gap.sm ? `sm:gap-${gap.sm}` : undefined,
    md: gap.md ? `md:gap-${gap.md}` : undefined,
    lg: gap.lg ? `lg:gap-${gap.lg}` : undefined,
    xl: gap.xl ? `xl:gap-${gap.xl}` : undefined,
    '2xl': gap['2xl'] ? `2xl:gap-${gap['2xl']}` : undefined
  });
  
  const alignClasses = align ? getResponsiveClasses({
    xs: align.xs ? `items-${align.xs}` : undefined,
    sm: align.sm ? `sm:items-${align.sm}` : undefined,
    md: align.md ? `md:items-${align.md}` : undefined,
    lg: align.lg ? `lg:items-${align.lg}` : undefined,
    xl: align.xl ? `xl:items-${align.xl}` : undefined,
    '2xl': align['2xl'] ? `2xl:items-${align['2xl']}` : undefined
  }) : '';
  
  const justifyClasses = justify ? getResponsiveClasses({
    xs: justify.xs ? `justify-${justify.xs}` : undefined,
    sm: justify.sm ? `sm:justify-${justify.sm}` : undefined,
    md: justify.md ? `md:justify-${justify.md}` : undefined,
    lg: justify.lg ? `lg:justify-${justify.lg}` : undefined,
    xl: justify.xl ? `xl:justify-${justify.xl}` : undefined,
    '2xl': justify['2xl'] ? `2xl:justify-${justify['2xl']}` : undefined
  }) : '';
  
  const wrapClasses = wrap ? getResponsiveClasses({
    xs: wrap.xs ? 'flex-wrap' : 'flex-nowrap',
    sm: wrap.sm !== undefined ? (wrap.sm ? 'sm:flex-wrap' : 'sm:flex-nowrap') : undefined,
    md: wrap.md !== undefined ? (wrap.md ? 'md:flex-wrap' : 'md:flex-nowrap') : undefined,
    lg: wrap.lg !== undefined ? (wrap.lg ? 'lg:flex-wrap' : 'lg:flex-nowrap') : undefined,
    xl: wrap.xl !== undefined ? (wrap.xl ? 'xl:flex-wrap' : 'xl:flex-nowrap') : undefined,
    '2xl': wrap['2xl'] !== undefined ? (wrap['2xl'] ? '2xl:flex-wrap' : '2xl:flex-nowrap') : undefined
  }) : '';
  
  const finalClassName = ['flex', directionClasses, gapClasses, alignClasses, justifyClasses, wrapClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={finalClassName} {...props}>
      {children}
    </div>
  );
});

ResponsiveStack.displayName = 'ResponsiveStack';

// =====================================================================================
// RESPONSIVE TEXT
// =====================================================================================

export const ResponsiveText = forwardRef<HTMLElement, ResponsiveTextProps>((
  {
    children,
    as: Component = 'p',
    size,
    weight,
    align,
    lineHeight,
    className = '',
    ...props
  },
  ref
) => {
  const { getResponsiveClasses } = useResponsive();
  
  const sizeClasses = size ? getResponsiveClasses({
    xs: size.xs ? `text-${size.xs}` : undefined,
    sm: size.sm ? `sm:text-${size.sm}` : undefined,
    md: size.md ? `md:text-${size.md}` : undefined,
    lg: size.lg ? `lg:text-${size.lg}` : undefined,
    xl: size.xl ? `xl:text-${size.xl}` : undefined,
    '2xl': size['2xl'] ? `2xl:text-${size['2xl']}` : undefined
  }) : '';
  
  const weightClasses = weight ? getResponsiveClasses({
    xs: weight.xs ? `font-${weight.xs}` : undefined,
    sm: weight.sm ? `sm:font-${weight.sm}` : undefined,
    md: weight.md ? `md:font-${weight.md}` : undefined,
    lg: weight.lg ? `lg:font-${weight.lg}` : undefined,
    xl: weight.xl ? `xl:font-${weight.xl}` : undefined,
    '2xl': weight['2xl'] ? `2xl:font-${weight['2xl']}` : undefined
  }) : '';
  
  const alignClasses = align ? getResponsiveClasses({
    xs: align.xs ? `text-${align.xs}` : undefined,
    sm: align.sm ? `sm:text-${align.sm}` : undefined,
    md: align.md ? `md:text-${align.md}` : undefined,
    lg: align.lg ? `lg:text-${align.lg}` : undefined,
    xl: align.xl ? `xl:text-${align.xl}` : undefined,
    '2xl': align['2xl'] ? `2xl:text-${align['2xl']}` : undefined
  }) : '';
  
  const lineHeightClasses = lineHeight ? getResponsiveClasses({
    xs: lineHeight.xs ? `leading-${lineHeight.xs}` : undefined,
    sm: lineHeight.sm ? `sm:leading-${lineHeight.sm}` : undefined,
    md: lineHeight.md ? `md:leading-${lineHeight.md}` : undefined,
    lg: lineHeight.lg ? `lg:leading-${lineHeight.lg}` : undefined,
    xl: lineHeight.xl ? `xl:leading-${lineHeight.xl}` : undefined,
    '2xl': lineHeight['2xl'] ? `2xl:leading-${lineHeight['2xl']}` : undefined
  }) : '';
  
  const finalClassName = [sizeClasses, weightClasses, alignClasses, lineHeightClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component ref={ref as React.Ref<HTMLElement>} className={finalClassName} {...props}>
      {children}
    </Component>
  );
});

ResponsiveText.displayName = 'ResponsiveText';

// =====================================================================================
// RESPONSIVE SHOW/HIDE
// =====================================================================================

export const ResponsiveShowHide: React.FC<ResponsiveShowHideProps> = ({
  children,
  show,
  hide,
  showOn,
  hideOn,
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop, isTouch } = useDevice();
  const { getResponsiveClasses } = useResponsive();
  
  // Verificar condições de show/hide baseadas em device
  if (showOn) {
    const shouldShow = (
      (showOn === 'mobile' && isMobile) ||
      (showOn === 'tablet' && isTablet) ||
      (showOn === 'desktop' && isDesktop) ||
      (showOn === 'touch' && isTouch) ||
      (showOn === 'hover' && !isTouch)
    );
    if (!shouldShow) return null;
  }
  
  if (hideOn) {
    const shouldHide = (
      (hideOn === 'mobile' && isMobile) ||
      (hideOn === 'tablet' && isTablet) ||
      (hideOn === 'desktop' && isDesktop) ||
      (hideOn === 'touch' && isTouch) ||
      (hideOn === 'hover' && !isTouch)
    );
    if (shouldHide) return null;
  }
  
  // Classes baseadas em breakpoints
  let visibilityClasses = '';
  
  if (show) {
    visibilityClasses = getResponsiveClasses({
      xs: show.xs ? 'block' : 'hidden',
      sm: show.sm !== undefined ? (show.sm ? 'sm:block' : 'sm:hidden') : undefined,
      md: show.md !== undefined ? (show.md ? 'md:block' : 'md:hidden') : undefined,
      lg: show.lg !== undefined ? (show.lg ? 'lg:block' : 'lg:hidden') : undefined,
      xl: show.xl !== undefined ? (show.xl ? 'xl:block' : 'xl:hidden') : undefined,
      '2xl': show['2xl'] !== undefined ? (show['2xl'] ? '2xl:block' : '2xl:hidden') : undefined
    });
  } else if (hide) {
    visibilityClasses = getResponsiveClasses({
      xs: hide.xs ? 'hidden' : 'block',
      sm: hide.sm !== undefined ? (hide.sm ? 'sm:hidden' : 'sm:block') : undefined,
      md: hide.md !== undefined ? (hide.md ? 'md:hidden' : 'md:block') : undefined,
      lg: hide.lg !== undefined ? (hide.lg ? 'lg:hidden' : 'lg:block') : undefined,
      xl: hide.xl !== undefined ? (hide.xl ? 'xl:hidden' : 'xl:block') : undefined,
      '2xl': hide['2xl'] !== undefined ? (hide['2xl'] ? '2xl:hidden' : '2xl:block') : undefined
    });
  }
  
  const finalClassName = [visibilityClasses, className].filter(Boolean).join(' ');

  return (
    <div className={finalClassName}>
      {children}
    </div>
  );
};

// =====================================================================================
// RESPONSIVE ASPECT RATIO
// =====================================================================================

interface ResponsiveAspectRatioProps extends BaseResponsiveProps {
  ratio?: ResponsiveValue<string>;
  defaultRatio?: string;
}

export const ResponsiveAspectRatio: React.FC<ResponsiveAspectRatioProps> = ({
  children,
  ratio,
  defaultRatio = '16/9',
  className = ''
}) => {
  const { getResponsiveClasses } = useResponsive();
  
  const ratioClasses = ratio ? getResponsiveClasses({
    xs: ratio.xs ? `aspect-[${ratio.xs}]` : `aspect-[${defaultRatio}]`,
    sm: ratio.sm ? `sm:aspect-[${ratio.sm}]` : undefined,
    md: ratio.md ? `md:aspect-[${ratio.md}]` : undefined,
    lg: ratio.lg ? `lg:aspect-[${ratio.lg}]` : undefined,
    xl: ratio.xl ? `xl:aspect-[${ratio.xl}]` : undefined,
    '2xl': ratio['2xl'] ? `2xl:aspect-[${ratio['2xl']}]` : undefined
  }) : `aspect-[${defaultRatio}]`;
  
  const finalClassName = [ratioClasses, className].filter(Boolean).join(' ');

  return (
    <div className={finalClassName}>
      {children}
    </div>
  );
};

// =====================================================================================
// EXPORTS
// =====================================================================================

export default {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveShowHide,
  ResponsiveAspectRatio
};