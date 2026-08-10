import { motion } from "motion/react";
import type { ReactNode } from "react";

export function PixelButton({
  children,
  onClick,
  disabled,
  color = "primary",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const bg =
    color === "primary"
      ? "bg-primary text-primary-foreground"
      : color === "danger"
        ? "bg-destructive text-destructive-foreground"
        : color === "ghost"
          ? "bg-transparent text-foreground border-2 border-foreground/30"
          : "bg-secondary text-secondary-foreground";
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      onClick={onClick}
      disabled={disabled}
      className={`text-pixel pix-border px-4 py-3 text-[10px] uppercase tracking-wider shadow-[3px_3px_0_0_oklch(0.1_0.02_265)] ${bg} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </motion.button>
  );
}
