import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResponsiveTextProps {
  text: string;
  maxWidth?: number;
  breakLines?: boolean;
  hideOnSmall?: boolean;
  className?: string;
  showTooltipOnTruncate?: boolean;
  responsiveStrategy?: 'truncate' | 'wrap' | 'hide';
}

export function ResponsiveText({ 
  text, 
  maxWidth = 120, 
  breakLines = true, 
  hideOnSmall = false,
  className,
  showTooltipOnTruncate = true,
  responsiveStrategy = 'truncate'
}: ResponsiveTextProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const element = textRef.current;
        setIsTruncated(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text]);

  const getResponsiveClasses = () => {
    const baseClasses = "text-xs text-muted-foreground";
    
    switch (responsiveStrategy) {
      case 'wrap':
        return cn(baseClasses, "leading-tight break-words");
      case 'hide':
        return cn(baseClasses, "hidden sm:block truncate");
      case 'truncate':
      default:
        return cn(baseClasses, "truncate sm:break-words sm:whitespace-normal");
    }
  };

  const renderText = () => {
    const textElement = (
      <div 
        ref={textRef}
        className={getResponsiveClasses()}
        style={{ maxWidth: `${maxWidth}px` }}
        title={isTruncated && !showTooltipOnTruncate ? text : undefined}
      >
        {text}
      </div>
    );

    if (showTooltipOnTruncate && isTruncated) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {textElement}
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs break-words">{text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return textElement;
  };

  if (hideOnSmall) {
    return (
      <div className={cn("hidden sm:block", className)}>
        {renderText()}
      </div>
    );
  }

  return (
    <div className={className}>
      {renderText()}
    </div>
  );
}