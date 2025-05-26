import * as React from "react";
import { cn } from "../../lib/utils";

type SpinnerSize = "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-3",
  xl: "h-16 w-16 border-4"
};

export function LoadingSpinner({
  size = "md",
  color = "border-primary",
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-t-transparent",
        sizeClasses[size],
        color,
        className
      )}
      {...props}
    />
  );
} 
