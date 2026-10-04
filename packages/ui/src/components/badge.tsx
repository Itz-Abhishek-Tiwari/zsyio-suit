import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-[3px]",
    "px-2 py-0.5 text-[11px] font-normal leading-tight tracking-tight",
    "transition-colors duration-150 shrink-0 select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-notion-blue text-notion-blue-fg border border-notion-blue/30 shadow-2xs",
        secondary:
          "bg-notion-gray text-notion-gray-fg border border-notion-gray/30",
        destructive:
          "bg-notion-red text-notion-red-fg border border-notion-red/30",
        success:
          "bg-notion-green text-notion-green-fg border border-notion-green/30",
        warning:
          "bg-notion-yellow text-notion-yellow-fg border border-notion-yellow/30",
        outline:
          "border border-border/80 text-foreground bg-transparent",
        gray:
          "bg-notion-gray text-notion-gray-fg border border-notion-gray/30",
        info:
          "bg-notion-blue text-notion-blue-fg border border-notion-blue/30",
        purple:
          "bg-notion-purple text-notion-purple-fg border border-notion-purple/30",
        orange:
          "bg-notion-orange text-notion-orange-fg border border-notion-orange/30",
        "notion-gray": "bg-notion-gray text-notion-gray-fg border border-notion-gray/30",
        "notion-brown": "bg-notion-brown text-notion-brown-fg border border-notion-brown/30",
        "notion-orange": "bg-notion-orange text-notion-orange-fg border border-notion-orange/30",
        "notion-yellow": "bg-notion-yellow text-notion-yellow-fg border border-notion-yellow/30",
        "notion-green": "bg-notion-green text-notion-green-fg border border-notion-green/30",
        "notion-blue": "bg-notion-blue text-notion-blue-fg border border-notion-blue/30",
        "notion-purple": "bg-notion-purple text-notion-purple-fg border border-notion-purple/30",
        "notion-pink": "bg-notion-pink text-notion-pink-fg border border-notion-pink/30",
        "notion-red": "bg-notion-red text-notion-red-fg border border-notion-red/30",
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
