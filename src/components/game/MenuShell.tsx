import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { CabinetShell } from "@/components/game/CabinetShell";

/**
 * Shared chrome for every front-end screen: cabinet frame, CRT ground, a fixed
 * header with the breadcrumb trail and a back affordance, then the page body.
 * Every menu route uses this so navigation always looks and behaves the same.
 */
export function MenuShell({
  title,
  crumb,
  aside,
  backTo = "/",
  children,
}: {
  title: string;
  /** short line under the title explaining what the screen is for */
  crumb?: string;
  /** right-aligned header slot, usually a resource readout */
  aside?: ReactNode;
  backTo?: string;
  children: ReactNode;
}) {
  return (
    <CabinetShell>
      <div className="scanlines relative min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b-2 border-primary/30 bg-background/95 px-4 pt-4 pb-3 backdrop-blur-[1px]">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <Link
              to={backTo}
              aria-label="Back"
              className="text-pixel shrink-0 border-2 border-border bg-card px-2.5 py-2 text-[8px] text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              ◀
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-pixel truncate text-[11px] text-primary">{title}</h1>
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
        </header>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="mx-auto w-full max-w-md px-4 pt-4 pb-10"
        >
          {children}
        </motion.main>
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
  tone?: "default" | "primary" | "accent";
}) {
  const color =
    tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className="border-2 border-border bg-card px-2 py-2">
      <div className={`text-pixel text-[11px] ${color}`}>{value}</div>
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
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-center gap-2 first:mt-0">
      <span className="text-pixel text-[8px] tracking-wider text-muted-foreground uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
