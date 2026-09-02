import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-md",
    "px-2 py-0.5 text-[11px] font-medium leading-tight tracking-tight",
    "transition-colors duration-150 shrink-0 select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border border-primary/25 dark:bg-primary/15 dark:text-primary dark:border-primary/35 shadow-2xs",
        secondary:
          "bg-surface-subtle text-muted-foreground border border-border/80",
        destructive:
          "bg-destructive-light text-destructive border border-destructive/25 dark:bg-destructive/15 dark:text-destructive dark:border-destructive/35",
        success:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/30",
        warning:
          "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/30",
        outline:
          "border border-border/80 text-foreground bg-surface-subtle/50",
        gray:
          "bg-surface-subtle text-muted-foreground border border-border/80",
        info:
          "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/30",
        purple:
          "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-200/80 dark:border-purple-500/30",
        orange:
          "bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400 border border-orange-200/80 dark:border-orange-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
