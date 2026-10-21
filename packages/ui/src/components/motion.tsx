"use client";

import * as React from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  type HTMLMotionProps,
  type Variants,
  type Transition,
} from "framer-motion";
import { cn } from "../lib/utils";

/**
 * Systematic Spring & Easing Tokens for Zsyio Suite
 * Designed for cohesive, buttery-smooth 60fps micro-interactions across all apps.
 */
export const transitions = {
  // Snappy: Tabs, tooltips, active indicators, small toggles
  snappy: { type: "spring" as const, stiffness: 500, damping: 35 },
  // Bouncy: Badges, avatar pop-ins, success checkmarks, tactile buttons
  bouncy: { type: "spring" as const, stiffness: 420, damping: 22 },
  // Smooth: Cards, modals, drawers, panels, list re-ordering
  smooth: { type: "spring" as const, stiffness: 320, damping: 28 },
  // Gentle: Large drawers, sidebar collapse/expand, page morphs
  gentle: { type: "spring" as const, stiffness: 220, damping: 26 },
  // Micro: Button press, icon wiggle, tiny feedback
  micro: { type: "spring" as const, stiffness: 600, damping: 35 },
  // Standard CSS-like curves
  easeStandard: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  easeFast: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
  easeSlow: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

export type MotionDirection = "up" | "down" | "left" | "right" | "scale" | "none";

interface FadeInProps extends HTMLMotionProps<"div"> {
  direction?: MotionDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * FadeIn - Clean entrance animation wrapper with directional slides
 */
export const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
  (
    {
      direction = "up",
      delay = 0,
      duration = 0.3,
      distance = 14,
      once = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const getInitial = () => {
      switch (direction) {
        case "up":
          return { opacity: 0, y: distance, x: 0 };
        case "down":
          return { opacity: 0, y: -distance, x: 0 };
        case "left":
          return { opacity: 0, x: distance, y: 0 };
        case "right":
          return { opacity: 0, x: -distance, y: 0 };
        case "scale":
          return { opacity: 0, scale: 0.95 };
        case "none":
        default:
          return { opacity: 0, x: 0, y: 0 };
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={getInitial()}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={getInitial()}
        viewport={{ once }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";

/**
 * Stagger Container & StaggerItem for cascading list/grid entrances
 */
const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  show: (staggerInterval = 0.04) => ({
    opacity: 1,
    transition: {
      staggerChildren: staggerInterval,
      delayChildren: 0.02,
    },
  }),
};

interface StaggerProps extends HTMLMotionProps<"div"> {
  staggerInterval?: number;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export const Stagger = React.forwardRef<HTMLDivElement, StaggerProps>(
  ({ staggerInterval = 0.04, delay = 0, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={staggerVariants}
        custom={staggerInterval}
        initial="hidden"
        animate="show"
        transition={{ delayChildren: delay }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Stagger.displayName = "Stagger";

const itemVariants: Variants = {
  hidden: (direction: MotionDirection = "up") => {
    const distance = 10;
    if (direction === "down") return { opacity: 0, y: -distance };
    if (direction === "left") return { opacity: 0, x: distance };
    if (direction === "right") return { opacity: 0, x: -distance };
    if (direction === "scale") return { opacity: 0, scale: 0.94 };
    if (direction === "none") return { opacity: 0 };
    return { opacity: 0, y: distance };
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: transitions.smooth,
  },
};

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  direction?: MotionDirection;
  className?: string;
  children?: React.ReactNode;
}

export const StaggerItem = React.forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ direction = "up", className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={itemVariants}
        custom={direction}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

/**
 * AnimatedCard - Hover lift, subtle scale & tap feedback for card components
 */
interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  hoverLift?: boolean;
  hoverScale?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ hoverLift = true, hoverScale = false, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          hoverLift || hoverScale
            ? {
                y: hoverLift ? -2 : 0,
                scale: hoverScale ? 1.006 : 1,
                transition: transitions.smooth,
              }
            : undefined
        }
        whileTap={{ scale: 0.995 }}
        className={cn("transition-colors will-change-transform", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

/**
 * AnimatedButton - Micro-interaction feedback for buttons and triggers
 */
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  scaleOnTap?: number;
  scaleOnHover?: number;
  className?: string;
  children?: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ scaleOnTap = 0.97, scaleOnHover = 1.02, className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: scaleOnTap }}
        whileHover={{ scale: scaleOnHover }}
        transition={transitions.bouncy}
        className={cn("will-change-transform", className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

/**
 * AnimatedScale - Pop-in scale effect for stat values, badges, and icons
 */
interface AnimatedScaleProps extends HTMLMotionProps<"div"> {
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export const AnimatedScale = React.forwardRef<HTMLDivElement, AnimatedScaleProps>(
  ({ delay = 0, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ delay, ...transitions.bouncy }}
        className={cn("will-change-transform", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedScale.displayName = "AnimatedScale";

/**
 * PulseDot - Live system/indicator dot with an expanding ripple aura
 */
export function PulseDot({
  color = "bg-primary",
  auraColor = "bg-primary/40",
  size = "w-2 h-2",
  className,
}: {
  color?: string;
  auraColor?: string;
  size?: string;
  className?: string;
}) {
  return (
    <span className={cn("relative flex items-center justify-center shrink-0", size, className)}>
      <span
        className={cn(
          "absolute inset-0 rounded-full  opacity-75",
          auraColor
        )}
      />
      <span className={cn("relative inline-flex rounded-full", size, color)} />
    </span>
  );
}

/**
 * AnimatedCounter - Smooth rolling/animated number display for KPIs and counters
 */
export function AnimatedNumber({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={transitions.snappy}
      className={cn("inline-block tabular-nums", className)}
    >
      {value}
    </motion.span>
  );
}

/**
 * PageTransition - Smooth route change transition with clean depth fade
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { motion, AnimatePresence, LayoutGroup };
