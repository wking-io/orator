import type { Handle } from "@remix-run/component";
import { SlideRoot as Slide } from "@orator/ui/slide";
import { Slider } from "../components/slider";
import { Simulation } from "../components/simulation";
import { defaults } from "../components/sim-params";
import { Switch } from "../components/switch";

export function NoteworthySlide(handle: Handle) {
  let noteworthy = defaults.noteworthy;
  let fogOfWar = defaults.fogOfWar;

  return () => (
    <Slide notes="The main character attracts opportunities; networking amplifies reach.">
      <div class="absolute inset-0">
        <Simulation
          networkingCount={defaults.networkingCount}
          gravityMultiplier={defaults.gravityMultiplier}
          noteworthy={noteworthy}
          noteworthyPull={defaults.noteworthyPull}
          speed={defaults.speed}
          fogOfWar={!!fogOfWar}
          fogDistance={defaults.fogDistance}
          networkingPullBoost={defaults.networkingPullBoost}
          networkFogMultiplier={defaults.networkFogMultiplier}
          noteworthyCurve={defaults.noteworthyCurve}
          dotGridSpacing={defaults.dotGridSpacing}
        />
      </div>
      <div class="absolute bottom-0 left-0 px-8 pb-6 flex gap-4">
        <Slider
          value={noteworthy}
          min={0.5}
          max={1.5}
          step={0.01}
          onValueChange={(value: number) => {
            noteworthy = value;
            handle.update();
          }}
        />
        <Switch
          checked={fogOfWar}
          onCheckedChange={(value: boolean) => {
            fogOfWar = value;
            handle.update();
          }}
        />
      </div>
    </Slide>
  );
}
