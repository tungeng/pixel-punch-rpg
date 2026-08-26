import { it } from "vitest";
import { HEROES } from "/dev-server/src/game/heroes";
import { simulateRun } from "/dev-server/src/game/sim";
it("control", () => {
  HEROES["bastion"]!.startingDeck = [...HEROES["genji"]!.startingDeck];
  HEROES["bastion"]!.cardPool = [...HEROES["genji"]!.cardPool];
  let w=0; const N=200;
  for (let i=0;i<N;i++) { const r = simulateRun("bastion", `ctl-${i}`, { policy: "balanced" }); if (r.won) w++; }
  console.log("CONTROL winrate", w/N);
});
