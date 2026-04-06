import type { Handle } from "@remix-run/component";
import { SlideRoot as Slide } from "@orator/ui/slide";
import { type SimState, reconcileState, Simulation } from "../components/simulation";
import { SimDialPanel } from "../components/sim-dial-panel";
import { defaults, type SimParams } from "../components/sim-params";

export function IntroSlide(_handle: Handle) {
  let simState: SimState | null = null;

  return () => (
    <Slide notes="The main character attracts opportunities; networking amplifies reach.">
      <div class="absolute inset-0">
        <Simulation
          opportunityCount={defaults.opportunityCount}
          networkingCount={defaults.networkingCount}
          mainGravity={defaults.mainGravity}
          noteworthy={defaults.noteworthy}
          noteworthyPull={defaults.noteworthyPull}
          speed={defaults.speed}
          networkingOrbitSpeed={defaults.networkingOrbitSpeed}
          opportunityOrbitSpeed={defaults.opportunityOrbitSpeed}
          fogOfWar={!!defaults.fogOfWar}
          fogDistance={defaults.fogDistance}
          networkingPullBoost={defaults.networkingPullBoost}
          onStateInit={(state: SimState) => {
            simState = state;
          }}
        />
      </div>
      <SimDialPanel
        onParamsChange={(params: SimParams) => {
          if (simState) {
            reconcileState(
              simState,
              params.networkingCount,
              params.opportunityCount,
              params.mainGravity,
              params.noteworthy,
              params.noteworthyPull,
              params.speed,
              params.networkingOrbitSpeed,
              params.opportunityOrbitSpeed,
              !!params.fogOfWar,
              params.fogDistance,
              params.networkingPullBoost,
              params.networkFogMultiplier,
              params.noteworthyCurve,
              params.dotGridSpacing,
            );
          }
        }}
      />
    </Slide>
  );
}
