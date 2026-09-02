"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "../lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-card shadow-2xl will-change-transform",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b sheet-content-top data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in",
        bottom:
          "inset-x-0 bottom-0 border-t sheet-content-bottom data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-xl sheet-content-left data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in",
        right:
          "inset-y-0 right-0 h-full w-full border-l sheet-content-right data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);


interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, onPointerDownOutside, onInteractOutside, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      data-slot="sheet-content"
      data-side={side}
      className={cn(sheetVariants({ side }), "flex flex-col p-0 bg-card border-border shadow-2xl overflow-hidden", className)}
      onPointerDownOutside={(e) => {
        if (
          typeof document !== "undefined" &&
          (document.body.classList.contains("media-lightbox-open") ||
            (e.target as HTMLElement | null)?.closest?.('[data-media-lightbox="true"]'))
        ) {
          e.preventDefault();
          return;
        }
        onPointerDownOutside?.(e);
      }}
      onInteractOutside={(e) => {
        if (
          typeof document !== "undefined" &&
          (document.body.classList.contains("media-lightbox-open") ||
            (e.target as HTMLElement | null)?.closest?.('[data-media-lightbox="true"]'))
        ) {
          e.preventDefault();
          return;
        }
        onInteractOutside?.(e);
      }}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-5 top-5 rounded-lg p-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-surface-subtle transition-colors focus:outline-none disabled:pointer-events-none cursor-pointer z-10">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-left p-6 pb-4 border-b border-border/80 bg-card",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 border-t border-border/80 bg-card/90 shrink-0",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-2xl font-bold font-display tracking-tight text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
