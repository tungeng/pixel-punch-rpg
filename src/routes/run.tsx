import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/game/store";
import { MapView } from "@/components/game/MapView";
import { CombatScreen } from "@/components/game/CombatScreen";
import {
  Hud,
  RewardScreen,
  RestScreen,
  ShopScreen,
  TreasureScreen,
  DeathScreen,
  VictoryScreen,
} from "@/components/game/MetaScreens";

export const Route = createFileRoute("/run")({
  head: () => ({
    meta: [
      { title: "Run in progress — Overtung" },
      {
        name: "description",
        content: "TUNGVERWATCH",
      },
      { property: "og:title", content: "Run in progress — Overtung" },
      {
        property: "og:description",
        content: "TUNGVERWATCH",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RunRoute,
});

function RunRoute() {
  const inRun = useGame((s) => s.inRun);
  const phase = useGame((s) => s.phase);
  const navigate = useNavigate();

  useEffect(() => {
    if (!inRun) navigate({ to: "/" });
  }, [inRun, navigate]);

  if (!inRun) return null;

  return (
    <div
      className="flex h-screen flex-col bg-background"
      style={{ maxWidth: 480, margin: "0 auto" }}
    >
      <Hud />
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {phase === "map" && <MapView />}
            {phase === "combat" && <CombatScreen />}
            {phase === "reward" && <RewardScreen />}
            {phase === "rest" && <RestScreen />}
            {phase === "shop" && <ShopScreen />}
            {phase === "treasure" && <TreasureScreen />}
            {phase === "dead" && <DeathScreen />}
            {phase === "victory" && <VictoryScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
