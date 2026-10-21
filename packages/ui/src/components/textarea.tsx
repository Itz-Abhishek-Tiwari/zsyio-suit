import * as React from "react"

import { cn } from "../lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[90px] w-full rounded-md border border-input-border bg-input px-3.5 py-2.5 text-sm text-foreground shadow-xs placeholder:text-muted-foreground transition-all duration-150 hover:border-border-strong focus-visible:outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
