import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold text-xs leading-none rounded-md",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary-hover shadow-xs",
        ].join(" "),
        secondary: [
          "bg-primary-light text-primary border border-primary/20",
          "hover:bg-primary/15 hover:border-primary/30 dark:bg-primary/20",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive-hover shadow-xs",
        ].join(" "),
        outline: [
          "border border-border bg-surface-elevated text-foreground",
          "hover:bg-surface-subtle hover:border-border-strong",
          "shadow-xs",
        ].join(" "),
        ghost: [
          "text-muted-foreground",
          "hover:bg-surface-subtle hover:text-foreground",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        default: "h-9 px-3.5 text-xs rounded-md",
        lg: "h-10 px-4 text-sm rounded-md",
        xl: "h-11 px-5 text-sm rounded-md",
        icon: "h-9 w-9 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
