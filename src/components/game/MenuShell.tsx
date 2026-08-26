import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { CabinetShell } from "@/components/game/CabinetShell";

/**
 * Shared chrome for every front-end screen. Each screen passes its own accent
 * so Heroes, Archive and Statistics read as distinct places while still
 * sharing one header, one back affordance and one page transition.
 */
export function MenuShell({
  title,
  crumb,
  glyph,
  accent = "var(--primary)",
  aside,
  backTo = "/",
  footer,
  children,
}: {
  title: string;
  /** short line under the title explaining what the screen is for */
  crumb?: string;
  /** single pixel glyph shown in the header badge */
  glyph?: string;
  /** screen identity colour, drives washes, rules and corner ticks */
  accent?: string;
  /** right-aligned header slot, usually a resource readout */
  aside?: ReactNode;
  backTo?: string;
  /** sticky bottom action bar, used for primary commitments like BREACH */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <CabinetShell>
      <div
        className="screen-wash scanlines relative min-h-screen bg-background"
        style={{ "--screen-accent": accent } as CSSProperties}
      >
        <div className="menu-drift pointer-events-none absolute inset-0 opacity-25" aria-hidden />

        <header className="sticky top-0 z-20 bg-background/92 backdrop-blur-[1px]">
          <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 pt-4 pb-3">
            <Link
              to={backTo}
              aria-label="Back"
              className="press text-pixel shrink-0 border-2 border-border bg-card px-2.5 py-2 text-[8px] text-foreground/75 hover:border-[var(--screen-accent)] hover:text-[var(--screen-accent)]"
            >
              ◀
            </Link>
            {glyph && (
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center border-2 text-[15px]"
                style={{
                  borderColor: accent,
                  color: accent,
                  background: `color-mix(in oklab, ${accent} 12%, transparent)`,
                }}
              >
                {glyph}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-pixel truncate text-[11px]" style={{ color: accent }}>
                {title}
              </h1>
              {crumb && (
                <p
                  className="truncate text-[13px] leading-[15px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {crumb}
                </p>
              )}
            </div>
            {aside && <div className="shrink-0 text-right">{aside}</div>}
          </div>
          <div className="accent-rule" />
        </header>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          className={`relative mx-auto w-full max-w-md px-4 pt-5 ${footer ? "pb-32" : "pb-12"}`}
        >
          {children}
        </motion.main>

        {footer && (
          <div className="sticky bottom-0 z-20 mx-auto w-full max-w-md px-4 pt-3 pb-4">
            <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
            <div className="relative">{footer}</div>
          </div>
        )}
      </div>
    </CabinetShell>
  );
}

/** Small labelled block used across Statistics and hero detail panels. */
export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "primary" | "accent" | "gold";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-accent"
        : tone === "gold"
          ? "text-gold"
          : "text-foreground";
  return (
    <div className="border-2 border-border bg-card px-2 py-2">
      <div className={`text-pixel value-land text-[11px] ${color}`}>{value}</div>
      <div
        className="mt-1 text-[12px] leading-[13px] text-muted-foreground uppercase"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        {label}
      </div>
    </div>
  );
}

/** Section heading with a hairline rule, keeps vertical rhythm consistent. */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-7 mb-2.5 flex items-center gap-2 first:mt-0">
      <span className="text-pixel text-[8px] tracking-[0.18em] text-muted-foreground uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
      {right && (
        <span
          className="text-[13px] leading-none text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          {right}
        </span>
      )}
    </div>
  );
}

/** Thin readout used in headers, e.g. the Chrono Core balance. */
export function Readout({ icon, value }: { icon: string; value: ReactNode }) {
  return (
    <span
      className="text-pixel inline-flex items-center gap-1 border-2 border-border bg-card px-2 py-1.5 text-[8px] text-foreground/85"
      style={{ letterSpacing: 0 }}
    >
      <span className="text-[var(--screen-accent)]" aria-hidden>
        {icon}
      </span>
      {value}
    </span>
  );
}

/** Horizontal fill bar. One primitive for mastery, progress and win rates. */
export function MeterBar({
  pct,
  color = "var(--primary)",
  height = 8,
}: {
  pct: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full border-2 border-border bg-background" style={{ height }}>
      <motion.div
        className="h-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        aria-hidden
      />
    </div>
  );
}
