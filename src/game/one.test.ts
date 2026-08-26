import { it } from "vitest";
import { HEROES } from "/dev-server/src/game/heroes";
import { simulateRun } from "/dev-server/src/game/sim";
it("control2", () => {
  HEROES["bastion"]!.startingDeck = [...HEROES["genji"]!.startingDeck];
  HEROES["bastion"]!.cardPool = [...HEROES["genji"]!.cardPool];
  HEROES["bastion"]!.ultimate = { ...HEROES["genji"]!.ultimate };
  let w=0; const N=200; const nodes: Record<string, number> = {}; let f=0;
  for (let i=0;i<N;i++) { const r = simulateRun("bastion", `ctl-${i}`, { policy: "balanced" }); if (r.won) w++; f+=r.floors; nodes[r.deathNode ?? "none"]=(nodes[r.deathNode??"none"]??0)+1; }
  console.log("CTL2", w/N, f/N, JSON.stringify(nodes));
  let w2=0; let f2=0;
  for (let i=0;i<200;i++) { const r = simulateRun("genji", `ctl-${i}`, { policy: "balanced" }); if (r.won) w2++; f2+=r.floors; }
  console.log("GENJI", w2/200, f2/200);
});
