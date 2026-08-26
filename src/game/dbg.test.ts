import { it } from "vitest";
import { useGame } from "@/game/store";
import { ALL_RELIC_IDS } from "@/game/relics";
import { STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
it("dbg", () => {
  const g = () => useGame.getState();
  useGame.setState({ meta: { unlockedHeroes: [...STARTER_HEROES, ...UNLOCKABLE_HEROES], unlockedRelics: [...ALL_RELIC_IDS], credits: 0, bestFloor: 0, playerName: "sim", totalRuns: 0, upgrades: {} } });
  g().startRun("mercy", "sim-113");
  let steps = 0;
  while (steps++ < 8200) {
    const s = g();
    if (!s.inRun || s.phase === "dead" || s.phase === "victory") break;
    if (steps > 8100) {
      const c = s.combat;
      console.log(steps, s.phase, c && { turn: c.turn, hp: c.hp, energy: c.energy, hand: c.hand.map(h=>h.id+":"+h.cost), ult: c.ultCharge, ultUsed: c.ultUsedThisCombat, frac: c.fracturePending, enemies: c.enemies.map(e=>e.name+e.hp) }, s.relics.join(","));
    }
    switch (s.phase) {
      case "map": { const cur = s.map.find(n=>n.id===s.currentNodeId) ?? null; const opts = cur ? s.map.filter(n=>cur.next.includes(n.id)) : s.map.filter(n=>n.col===0); s.enterNode(opts[0]!.id); break; }
      case "combat": { const c = s.combat!;
        if (c.fracturePending) { s.chooseFracture("damage"); break; }
        if (c.targetingCardUid) { const a = c.enemies.filter(e=>!e.isDead); a.length ? s.selectTarget(a[0]!.uid) : s.cancelTarget(); break; }
        if (c.ultCharge >= 100 && !c.ultUsedThisCombat) { s.useUltimate(); break; }
        const p = c.hand.filter(x=>x.cost<=c.energy && x.type!==c.hackedType);
        if (p.length) s.playCard(p[0]!.uid); else s.endTurn();
        break; }
      case "reward": { s.rewardChoices.length ? s.pickRewardCard(s.rewardChoices[0]!.id) : s.skipReward(); break; }
      case "rest": s.restHeal(); break;
      case "shop": s.leaveShop(); break;
      case "treasure": s.takeTreasure(); break;
      default: s.toMap();
    }
  }
  console.log("end", steps, g().phase);
});
