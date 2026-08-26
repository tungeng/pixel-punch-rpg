import { it } from "vitest";
import { simulateRun } from "/dev-server/src/game/sim";
import { useGame } from "/dev-server/src/game/store";
it("one", () => {
  const r = simulateRun("bastion", "dbg-1", { policy: "balanced" });
  const s = useGame.getState();
  console.log(JSON.stringify({ floors: r.floors, won: r.won, deathNode: r.deathNode, deck: s.deck.map(c=>c.id) }));
  console.log("stance", s.combat?.stance, "swaps", s.combat?.stanceSwaps, "hp", s.combat?.hp, s.combat?.maxHp);
});
