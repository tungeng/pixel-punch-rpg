import type { ReactNode } from "react";

/**
 * Desktop-only presentation shell: on wide screens the portrait game sits inside
 * a glowing arcade-cabinet bezel over an ambient rift backdrop. Below 900px this
 * renders as a plain pass-through so the mobile layout is untouched.
 */
export function CabinetShell({ children }: { children: ReactNode }) {
  return (
    <div className="cabinet-stage">
      <span className="cabinet-side cabinet-side-l text-pixel hidden text-[11px]" aria-hidden="true">
        TUNG · TUNG · TUNG
      </span>
      <div className="cabinet-frame">{children}</div>
      <span className="cabinet-side cabinet-side-r text-pixel hidden text-[11px]" aria-hidden="true">
        OVERTUNG · ARCADE
      </span>
    </div>
  );
}
