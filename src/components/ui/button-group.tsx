import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonGroupVariants = cva(
  "inline-flex items-center",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
      spacing: {
        none: "gap-0",
        sm: "gap-1",
        default: "gap-2",
        md: "gap-3",
        lg: "gap-4",
      },
      alignment: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      },
      wrap: {
        true: "flex-wrap",
        false: "flex-nowrap",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      spacing: "default",
      alignment: "start",
      wrap: false,
      fullWidth: false,
    },
  }
);

export interface ButtonGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {
  children: React.ReactNode;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation, spacing, alignment, wrap, fullWidth, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          buttonGroupVariants({ orientation, spacing, alignment, wrap, fullWidth }),
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

// Componente para grupos de botões conectados (sem espaçamento)
const ConnectedButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    
    return (
      <div
        className={cn(
          "inline-flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          className
        )}
        ref={ref}
        {...props}
      >
        {childrenArray.map((child, index) => {
          if (React.isValidElement(child)) {
            const isFirst = index === 0;
            const isLast = index === childrenArray.length - 1;
            const isMiddle = !isFirst && !isLast;
            
            let additionalClasses = "";
            
            if (orientation === "horizontal") {
              if (isFirst) {
                additionalClasses = "rounded-r-none border-r-0";
              } else if (isLast) {
                additionalClasses = "rounded-l-none";
              } else if (isMiddle) {
                additionalClasses = "rounded-none border-r-0";
              }
            } else {
              if (isFirst) {
                additionalClasses = "rounded-b-none border-b-0";
              } else if (isLast) {
                additionalClasses = "rounded-t-none";
              } else if (isMiddle) {
                additionalClasses = "rounded-none border-b-0";
              }
            }
            
            return React.cloneElement(child, {
              className: cn(child.props.className, additionalClasses),
              key: index,
            });
          }
          return child;
        })}
      </div>
    );
  }
);
ConnectedButtonGroup.displayName = "ConnectedButtonGroup";

export { ButtonGroup, ConnectedButtonGroup, buttonGroupVariants };