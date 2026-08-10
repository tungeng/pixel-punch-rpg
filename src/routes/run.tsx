import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGame } from "@/game/store";
import { Hud } from "@/components/game/MetaScreens";
import { MapView } from "@/components/game/MapView";
import { CombatScreen } from "@/components/game/CombatScreen";
import {
  RewardScreen,
  RestScreen,
  ShopScreen,
  TreasureScreen,
  DeathScreen,
  VictoryScreen,
} from "@/components/game/MetaScreens";

export const Route = createFileRoute("/run")({
  component: RunRoute,
});

function RunRoute() {
  const inRun = useGame((s) => s.inRun);
  const phase = useGame((s) => s.phase);
  const navigate = useNavigate();

  if (!inRun) {
    return <RedirectHome />;
  }

  return (
    <div className="flex h-screen flex-col bg-background" style={{ maxWidth: 480, margin: "0 auto" }}>
      <Hud />
      <div className="relative flex-1 overflow-hidden">
        {phase === "map" && <MapView />}
        {phase === "combat" && <CombatScreen />}
        {phase === "reward" && <RewardScreen />}
        {phase === "rest" && <RestScreen />}
        {phase === "shop" && <ShopScreen />}
        {phase === "treasure" && <TreasureScreen />}
        {phase === "dead" && <DeathScreen />}
        {phase === "victory" && <VictoryScreen />}
      </div>
    </div>
  );
}

function RedirectHome() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);
  return null;
}
