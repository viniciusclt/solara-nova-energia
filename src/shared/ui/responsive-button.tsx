import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";
import { ResponsiveText } from "./responsive-text";
import { LucideIcon } from "lucide-react";

interface ResponsiveButtonProps extends ButtonProps {
  subtitle?: string;
  subtitleBreakpoint?: 'sm' | 'md' | 'lg';
  hideSubtitleOnSmall?: boolean;
  icon?: LucideIcon;
  label: string;
  maxSubtitleWidth?: number;
}

export function ResponsiveButton({ 
  subtitle,
  subtitleBreakpoint = 'sm',
  hideSubtitleOnSmall = true,
  icon: Icon,
  label,
  maxSubtitleWidth = 120,
  className,
  children,
  ...props 
}: ResponsiveButtonProps) {
  const breakpointClass = {
    'sm': 'sm:block',
    'md': 'md:block', 
    'lg': 'lg:block'
  }[subtitleBreakpoint];

  return (
    <Button 
      className={cn(
        "flex flex-col items-center gap-2 py-3 px-2 h-auto",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <div className="text-center">
        <div className="font-medium text-sm">{label}</div>
        {subtitle && (
          <ResponsiveText
            text={subtitle}
            maxWidth={maxSubtitleWidth}
            hideOnSmall={hideSubtitleOnSmall}
            className={hideSubtitleOnSmall ? `hidden ${breakpointClass}` : ''}
          />
        )}
      </div>
      {children}
    </Button>
  );
}