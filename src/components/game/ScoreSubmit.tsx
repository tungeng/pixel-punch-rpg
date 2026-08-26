import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { PixelButton } from "./PixelButton";
import { randomAgentName, submitRunScore } from "@/game/leaderboard";

/**
 * Shown on the death / victory screens: displays the final score and pushes it
 * to the global leaderboard. Asks for a display name once, ever.
 */
export function ScoreSubmit() {
  const run = useGame((s) => s.lastRun);
  const submitted = useGame((s) => s.scoreSubmitted);
  const meta = useGame((s) => s.meta);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const markSubmitted = useGame((s) => s.markScoreSubmitted);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const sending = useRef(false);

  const send = async (playerName: string) => {
    if (sending.current || !run) return;
    sending.current = true;
    setStatus("sending");
    const ok = await submitRunScore(playerName, run);
    setStatus(ok ? "ok" : "fail");
    markSubmitted();
  };

  // With a name already on file we submit silently the moment the run ends.
  useEffect(() => {
    if (run && !submitted && meta.playerName) void send(meta.playerName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, submitted, meta.playerName]);

  if (!run) return null;

  const needsName = !meta.playerName && !submitted;

  return (
    <div className="mb-5 w-full max-w-[320px] border-2 border-border bg-card/80 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-pixel text-[9px] text-accent">FINAL SCORE</span>
        <span className="text-pixel text-[14px] text-primary">{run.score}</span>
      </div>
      <div
        className="mt-1 text-[12px] text-muted-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        {run.floorsCleared} floors × 100 · act {run.act + 1} bonus · {run.fullClear ? "FULL CLEAR +1000" : "no full clear"}
      </div>

      {needsName ? (
        <div className="mt-3">
          <div
            className="mb-1 text-[12px] text-foreground/80"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            Name for the global leaderboard:
          </div>
          <input
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder={randomAgentName()}
            className="w-full border-2 border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          />
          <div className="mt-2 flex gap-2">
            <PixelButton
              color="primary"
              className="flex-1"
              onClick={() => {
                const chosen = name.trim() || randomAgentName();
                setPlayerName(chosen);
                void send(chosen);
              }}
            >
              SUBMIT
            </PixelButton>
            <PixelButton
              color="secondary"
              className="flex-1"
              onClick={() => {
                const chosen = randomAgentName();
                setPlayerName(chosen);
                void send(chosen);
              }}
            >
              SKIP
            </PixelButton>
          </div>
        </div>
      ) : (
        <div
          className="mt-2 text-[12px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          {status === "sending" && "Uploading run…"}
          {status === "ok" && `Logged as ${meta.playerName}.`}
          {status === "fail" && "Leaderboard unreachable — score kept locally."}
          {status === "idle" && submitted && `Logged as ${meta.playerName}.`}
        </div>
      )}
    </div>
  );
}
