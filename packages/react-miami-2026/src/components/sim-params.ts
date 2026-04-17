import type { DialConfig } from "dialkit/store";

export interface SimParams {
  networkingCount: number;
  gravityMultiplier: number;
  noteworthy: number;
  noteworthyPull: number;
  speed: number;
  fogOfWar: boolean;
  fogDistance: number;
  networkingPullBoost: number;
  networkFogMultiplier: number;
  noteworthyCurve: number;
  dotGridSpacing: number;
}

export const defaults: SimParams = {
  networkingCount: 0,
  gravityMultiplier: 1.3,
  noteworthy: 0.5,
  noteworthyPull: 0.25,
  speed: 0.4,
  fogOfWar: false,
  fogDistance: 15,
  networkingPullBoost: 1.1,
  networkFogMultiplier: 1.5,
  noteworthyCurve: 4.4,
  dotGridSpacing: 8,
};

export const PANEL_ID = "sim-params";

export function buildDialConfig(): DialConfig {
  return {
    simulation: {
      networkingCount: [defaults.networkingCount, 0, 30, 1],
      gravityMultiplier: [defaults.gravityMultiplier, 0, 5, 0.1],
      noteworthy: [defaults.noteworthy, 0.5, 1.5, 0.01],
      noteworthyPull: [defaults.noteworthyPull, 0, 1, 0.05],
      speed: [defaults.speed, 0.1, 3, 0.1],
      fogOfWar: defaults.fogOfWar,
      fogDistance: [defaults.fogDistance, 0, 500, 10],
      networkingPullBoost: [defaults.networkingPullBoost, 1, 5, 0.1],
      networkFogMultiplier: [defaults.networkFogMultiplier, 1, 5, 0.1],
      noteworthyCurve: [defaults.noteworthyCurve, 0.5, 50, 0.1],
      dotGridSpacing: [defaults.dotGridSpacing, 2, 30, 1],
    },
  };
}

const pathToKey: Record<string, keyof SimParams> = {
  "simulation.networkingCount": "networkingCount",
  "simulation.gravityMultiplier": "gravityMultiplier",
  "simulation.noteworthy": "noteworthy",
  "simulation.noteworthyPull": "noteworthyPull",
  "simulation.speed": "speed",
  "simulation.fogOfWar": "fogOfWar",
  "simulation.fogDistance": "fogDistance",
  "simulation.networkingPullBoost": "networkingPullBoost",
  "simulation.networkFogMultiplier": "networkFogMultiplier",
  "simulation.noteworthyCurve": "noteworthyCurve",
  "simulation.dotGridSpacing": "dotGridSpacing",
};

export function paramsFromStore(values: Record<string, unknown>): SimParams {
  const g = (path: string, fallback: number) => {
    const v = values[path];
    return typeof v === "number" ? v : fallback;
  };
  const b = (path: string, fallback: boolean) => {
    const v = values[path];
    return typeof v === "boolean" ? v : fallback;
  };
  return {
    networkingCount: Math.round(g("simulation.networkingCount", defaults.networkingCount)),
    gravityMultiplier: g("simulation.gravityMultiplier", defaults.gravityMultiplier),
    noteworthy: g("simulation.noteworthy", defaults.noteworthy),
    noteworthyPull: g("simulation.noteworthyPull", defaults.noteworthyPull),
    speed: g("simulation.speed", defaults.speed),
    fogOfWar: b("simulation.fogOfWar", defaults.fogOfWar),
    fogDistance: g("simulation.fogDistance", defaults.fogDistance),
    networkingPullBoost: g("simulation.networkingPullBoost", defaults.networkingPullBoost),
    networkFogMultiplier: g("simulation.networkFogMultiplier", defaults.networkFogMultiplier),
    noteworthyCurve: g("simulation.noteworthyCurve", defaults.noteworthyCurve),
    dotGridSpacing: g("simulation.dotGridSpacing", defaults.dotGridSpacing),
  };
}

export function dirtyPaths(values: Record<string, unknown>): Set<string> {
  const dirty = new Set<string>();
  for (const [path, key] of Object.entries(pathToKey)) {
    const v = values[path];
    if (typeof v === "number" && v !== defaults[key]) {
      dirty.add(path);
    }
  }
  return dirty;
}
