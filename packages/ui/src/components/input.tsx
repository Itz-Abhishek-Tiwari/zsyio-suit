import * as React from "react"
import { cn } from "../lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full",
          "rounded-md border border-input-border bg-input",
          "px-3.5 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "shadow-xs transition-all duration-150",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
