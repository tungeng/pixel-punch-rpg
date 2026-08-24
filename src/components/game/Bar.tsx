import { useEffect, useState } from "react";

export function Bar({
  value,
  max,
  color,
  label,
  height = 18,
}: {
  value: number;
  max: number;
  color: string;
  label?: string;
  height?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.max(0, Math.min(1, value / Math.max(1, max)))), 30);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div
      className="relative w-full overflow-hidden pix-border"
      style={{ height, background: "oklch(0.1 0.02 265)" }}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{ width: `${w * 100}%`, background: color }}
      />
      {label && (
        <div
          className="text-pixel absolute inset-0 flex items-center justify-center text-[9px] text-white"
          style={{
            textShadow:
              "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000, 0 0 4px #000",
          }}
        >
          {label}
        </div>
      )}

    </div>
  );
}
