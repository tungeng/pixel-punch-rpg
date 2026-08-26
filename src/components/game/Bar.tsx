import { useEffect, useRef, useState } from "react";

export function Bar({
  value,
  max,
  color,
  label,
  height = 18,
  /** shows a lagging "chip" trail so the player can read how big the last hit was */
  ghost = true,
}: {
  value: number;
  max: number;
  color: string;
  label?: string;
  height?: number;
  ghost?: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, value / Math.max(1, max)));
  // start already filled so a fresh bar never flashes its damage trail
  const [w, setW] = useState(ratio);
  const [trail, setTrail] = useState(ratio);
  const prev = useRef(ratio);


  useEffect(() => {
    const t = setTimeout(() => setW(ratio), 30);
    return () => clearTimeout(t);
  }, [ratio]);

  // the trail holds the old value for a beat, then drains down to the new one
  useEffect(() => {
    if (!ghost) return;
    if (ratio < prev.current) {
      const from = prev.current;
      setTrail(from);
      const t = setTimeout(() => setTrail(ratio), 260);
      prev.current = ratio;
      return () => clearTimeout(t);
    }
    prev.current = ratio;
    setTrail(ratio);
    return;
  }, [ratio, ghost]);

  return (
    <div
      className="relative w-full overflow-hidden pix-border"
      style={{ height, background: "oklch(0.1 0.02 265)" }}
    >
      {ghost && (
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
          style={{ width: `${trail * 100}%`, background: "#fff4d6", opacity: 0.85 }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-200 ease-out"
        style={{ width: `${w * 100}%`, background: color }}
      />
      {label && (
        <div
          className="text-pixel absolute inset-0 flex items-center justify-center text-[9px] text-white"
          style={{
            textShadow: "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000",
          }}
        >
          {label}
        </div>
      )}

    </div>
  );
}
