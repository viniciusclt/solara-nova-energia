import { cn } from "@/lib/utils";

interface ResponsiveTextProps {
  text: string;
  maxWidth?: number;
  breakLines?: boolean;
  hideOnSmall?: boolean;
  className?: string;
}

export function ResponsiveText({ 
  text, 
  maxWidth = 120, 
  breakLines = true, 
  hideOnSmall = false,
  className 
}: ResponsiveTextProps) {
  if (hideOnSmall) {
    return (
      <div className={cn("hidden sm:block", className)}>
        {breakLines ? (
          <div 
            className="text-xs text-muted-foreground leading-tight"
            style={{ maxWidth: `${maxWidth}px` }}
          >
            {text}
          </div>
        ) : (
          <div 
            className="text-xs text-muted-foreground truncate"
            style={{ maxWidth: `${maxWidth}px` }}
          >
            {text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {breakLines ? (
        <div 
          className="text-xs text-muted-foreground leading-tight"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {text}
        </div>
      ) : (
        <div 
          className="text-xs text-muted-foreground truncate"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {text}
        </div>
      )}
    </div>
  );
}