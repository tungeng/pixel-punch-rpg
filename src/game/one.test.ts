import { it } from "vitest";
import { simulateRun } from "/dev-server/src/game/sim";
it("b", () => {
  let w=0,f=0; const N=300;
  for (let i=0;i<N;i++){const r=simulateRun("bastion",`t-${i}`,{policy:"balanced"}); if(r.won)w++; f+=r.floors;}
  console.log("BASTION", w/N, f/N);
});
