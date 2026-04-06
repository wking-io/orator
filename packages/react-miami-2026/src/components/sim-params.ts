import type { DialConfig } from "dialkit/store";

export interface SimParams {
  opportunityCount: number;
  networkingCount: number;
  mainGravity: number;
  noteworthy: number;
  noteworthyPull: number;
  speed: number;
  networkingOrbitSpeed: number;
  opportunityOrbitSpeed: number;
  fogOfWar: number;
  fogDistance: number;
  networkingPullBoost: number;
  networkFogMultiplier: number;
  noteworthyCurve: number;
  dotGridSpacing: number;
}

export const defaults: SimParams = {
  opportunityCount: 50,
  networkingCount: 0,
  mainGravity: 1.2,
  noteworthy: 0.5,
  noteworthyPull: 0,
  speed: 0.4,
  networkingOrbitSpeed: 0.6,
  opportunityOrbitSpeed: 0.3,
  fogOfWar: 0,
  fogDistance: 10,
  networkingPullBoost: 1.3,
  networkFogMultiplier: 1.3,
  noteworthyCurve: 2,
  dotGridSpacing: 8,
};

export const PANEL_ID = "sim-params";

export function buildDialConfig(): DialConfig {
  return {
    simulation: {
      opportunityCount: [defaults.opportunityCount, 1, 200, 1],
      networkingCount: [defaults.networkingCount, 0, 30, 1],
      mainGravity: [defaults.mainGravity, 0, 5, 0.1],
      noteworthy: [defaults.noteworthy, 0.5, 1.5, 0.01],
      noteworthyPull: [defaults.noteworthyPull, 0, 1, 0.05],
      speed: [defaults.speed, 0.1, 3, 0.1],
      networkingOrbitSpeed: [defaults.networkingOrbitSpeed, 0, 5, 0.1],
      opportunityOrbitSpeed: [defaults.opportunityOrbitSpeed, 0, 5, 0.1],
      fogOfWar: [defaults.fogOfWar, 0, 1, 1],
      fogDistance: [defaults.fogDistance, 0, 500, 10],
      networkingPullBoost: [defaults.networkingPullBoost, 1, 5, 0.1],
      networkFogMultiplier: [defaults.networkFogMultiplier, 1, 5, 0.1],
      noteworthyCurve: [defaults.noteworthyCurve, 0.5, 50, 0.1],
      dotGridSpacing: [defaults.dotGridSpacing, 2, 30, 1],
    },
  };
}

const pathToKey: Record<string, keyof SimParams> = {
  "simulation.opportunityCount": "opportunityCount",
  "simulation.networkingCount": "networkingCount",
  "simulation.mainGravity": "mainGravity",
  "simulation.noteworthy": "noteworthy",
  "simulation.noteworthyPull": "noteworthyPull",
  "simulation.speed": "speed",
  "simulation.networkingOrbitSpeed": "networkingOrbitSpeed",
  "simulation.opportunityOrbitSpeed": "opportunityOrbitSpeed",
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
  return {
    opportunityCount: Math.round(g("simulation.opportunityCount", defaults.opportunityCount)),
    networkingCount: Math.round(g("simulation.networkingCount", defaults.networkingCount)),
    mainGravity: g("simulation.mainGravity", defaults.mainGravity),
    noteworthy: g("simulation.noteworthy", defaults.noteworthy),
    noteworthyPull: g("simulation.noteworthyPull", defaults.noteworthyPull),
    speed: g("simulation.speed", defaults.speed),
    networkingOrbitSpeed: g("simulation.networkingOrbitSpeed", defaults.networkingOrbitSpeed),
    opportunityOrbitSpeed: g("simulation.opportunityOrbitSpeed", defaults.opportunityOrbitSpeed),
    fogOfWar: Math.round(g("simulation.fogOfWar", defaults.fogOfWar)),
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
