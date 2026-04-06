import type { SceneData } from "@orator/ui/unicorn-studio";
import type { DialConfig } from "dialkit/store";

interface ElectronAPI {
  repoRoot: string;
  writeFile(path: string, content: string): Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const WARP_JSON_RELATIVE = "packages/react-miami-2026/src/shaders/warp.json";

export interface WarpParams {
  // Shape
  shapePositionX: number;
  shapePositionY: number;
  shapeWidth: number;
  shapeHeight: number;
  shapeRotation: number;
  // Liquify
  liquifySpeed: number;
  liquifyAmplitude: number;
  liquifyFrequency: number;
  liquifySkew: number;
  liquifyDrift: number;
  liquifyAngle: number;
  liquifySize: number;
  liquifyStrength: number;
  liquifyChromaticAberration: number;
  // Halftone
  halftoneScale: number;
  halftoneSmooth: number;
  halftoneRotation: number;
  // Gradient map
  gradientIntensity: number;
}

/* ------------------------------------------------------------------ */
/*  Extract defaults from the live warp.json data                     */
/* ------------------------------------------------------------------ */

function shader(data: SceneData, layerIndex: number): string {
  return data.history[layerIndex]?.compiledFragmentShaders?.[0] ?? "";
}

function rx(src: string, pattern: RegExp, fallback: number): number {
  const m = src.match(pattern);
  return m ? parseFloat(m[1]!) : fallback;
}

/** Read current parameter values directly from the scene data. */
export function extractDefaults(data: SceneData): WarpParams {
  const shape = data.history[1]!;
  const shapeSrc = shader(data, 1);
  const liqLayer = data.history[3]!;
  const liqSrc = shader(data, 3);
  const halfSrc = shader(data, 4);
  const gmapSrc = shader(data, 2);

  return {
    // Shape — JSON props + shader
    shapePositionX: (shape.left as number) ?? 0.5,
    shapePositionY: (shape.top as number) ?? 0.5,
    shapeWidth: (shape.width as number) ?? 1080,
    shapeHeight: (shape.height as number) ?? 1080,
    shapeRotation: rx(shapeSrc, /elementSizePx, ([\d.]+)\)/, 0),

    // Liquify — layer prop + shader
    liquifySpeed: (liqLayer.speed as number) ?? 0,
    liquifyAmplitude: rx(liqSrc, /([\d.]+) \* mix\(0\.2,/, 0),
    liquifyFrequency: rx(liqSrc, /5\.0 \* \(([\d.]+) \+ 0\.1\)/, 0),
    liquifySkew: rx(liqSrc, /vec2\(1, 0\), ([\d.]+)\)/, 0),
    liquifyDrift: rx(liqSrc, /([\d.]+) \* uTime \* 0\.0125/, 0),
    liquifyAngle: rx(liqSrc, /([\d.]+) \* -2\. \* PI\)/, 0),
    liquifySize: rx(liqSrc, /1\. - ([\d.]+)\)\)/, 0),
    liquifyStrength: rx(liqSrc, /liquifiedUV, ([\d.]+)\)/, 0),
    liquifyChromaticAberration: rx(liqSrc, /([\d.]+) \* 0\.5;/, 0),

    // Halftone
    halftoneScale: rx(halfSrc, /([\d.]+)\*200\./, 0),
    halftoneSmooth: rx(halfSrc, /aastep\(([-\d.]+),/, 0),
    halftoneRotation: rx(halfSrc, /angle - ([\d.]+)\*360\./, 0),

    // Gradient map
    gradientIntensity: rx(gmapSrc, /\* \(([\d.]+) \* 2\.\)/, 0),
  };
}

/* ------------------------------------------------------------------ */
/*  Mutable defaults — set once from warp.json at init time           */
/* ------------------------------------------------------------------ */

/** Populated by `initDefaults()`. */
export let defaults: WarpParams = null!;

/** Call once at startup with the imported warp.json data. */
export function initDefaults(data: SceneData) {
  defaults = extractDefaults(data);
}

export function buildDialConfig(): DialConfig {
  return {
    shape: {
      positionX: [defaults.shapePositionX, 0, 1, 0.001],
      positionY: [defaults.shapePositionY, 0, 1, 0.001],
      width: [defaults.shapeWidth, 100, 3000, 1],
      height: [defaults.shapeHeight, 100, 3000, 1],
      rotation: [defaults.shapeRotation, 0, 1, 0.001],
    },
    liquify: {
      speed: [defaults.liquifySpeed, 0, 1, 0.01],
      amplitude: [defaults.liquifyAmplitude, 0, 1, 0.01],
      frequency: [defaults.liquifyFrequency, 0, 1, 0.01],
      skew: [defaults.liquifySkew, 0, 1, 0.01],
      drift: [defaults.liquifyDrift, 0, 1, 0.01],
      angle: [defaults.liquifyAngle, 0, 1, 0.001],
      size: [defaults.liquifySize, 0, 1, 0.01],
      strength: [defaults.liquifyStrength, 0, 1, 0.01],
      chromaticAberration: [defaults.liquifyChromaticAberration, 0, 2, 0.01],
    },
    halftone: {
      scale: [defaults.halftoneScale, 0.1, 1, 0.01],
      smooth: [defaults.halftoneSmooth, -1, 1, 0.01],
      rotation: [defaults.halftoneRotation, 0, 1, 0.001],
    },
    gradientMap: {
      intensity: [defaults.gradientIntensity, 0, 1, 0.01],
    },
  };
}

export const PANEL_ID = "warp-shader";

/** Read flat DialStore values back into a WarpParams struct. */
export function paramsFromStore(values: Record<string, unknown>): WarpParams {
  const g = (path: string, fallback: number) => {
    const v = values[path];
    return typeof v === "number" ? v : fallback;
  };
  return {
    shapePositionX: g("shape.positionX", defaults.shapePositionX),
    shapePositionY: g("shape.positionY", defaults.shapePositionY),
    shapeWidth: g("shape.width", defaults.shapeWidth),
    shapeHeight: g("shape.height", defaults.shapeHeight),
    shapeRotation: g("shape.rotation", defaults.shapeRotation),
    liquifySpeed: g("liquify.speed", defaults.liquifySpeed),
    liquifyAmplitude: g("liquify.amplitude", defaults.liquifyAmplitude),
    liquifyFrequency: g("liquify.frequency", defaults.liquifyFrequency),
    liquifySkew: g("liquify.skew", defaults.liquifySkew),
    liquifyDrift: g("liquify.drift", defaults.liquifyDrift),
    liquifyAngle: g("liquify.angle", defaults.liquifyAngle),
    liquifySize: g("liquify.size", defaults.liquifySize),
    liquifyStrength: g("liquify.strength", defaults.liquifyStrength),
    liquifyChromaticAberration: g(
      "liquify.chromaticAberration",
      defaults.liquifyChromaticAberration,
    ),
    halftoneScale: g("halftone.scale", defaults.halftoneScale),
    halftoneSmooth: g("halftone.smooth", defaults.halftoneSmooth),
    halftoneRotation: g("halftone.rotation", defaults.halftoneRotation),
    gradientIntensity: g("gradientMap.intensity", defaults.gradientIntensity),
  };
}

/**
 * Patch a warp scene with new parameter values.
 *
 * Replaces the current defaults (as found in the shader source) with the
 * requested values. Always operates on a deep clone of `original`.
 */
export function patchScene(original: SceneData, params: WarpParams): SceneData {
  const data: SceneData = JSON.parse(JSON.stringify(original));
  const layers = data.history;

  // Layer 1 — shape
  const shape = layers[1]!;

  shape.left = params.shapePositionX;
  shape.top = params.shapePositionY;
  patchShader(shape, [
    [
      `vec2(${fmt(defaults.shapePositionX)}, ${fmt(defaults.shapePositionY)})`,
      `vec2(${fmt(params.shapePositionX)}, ${fmt(params.shapePositionY)})`,
    ],
  ]);

  shape.width = params.shapeWidth;
  shape.height = params.shapeHeight;
  patchShader(shape, [
    [fmtPx(defaults.shapeWidth), fmtPx(params.shapeWidth)],
    [fmtPx(defaults.shapeHeight), fmtPx(params.shapeHeight)],
  ]);

  patchShader(shape, [[fmt(defaults.shapeRotation), fmt(params.shapeRotation)]]);

  // Layer 2 — gradient map
  patchShader(layers[2]!, [[fmt(defaults.gradientIntensity), fmt(params.gradientIntensity)]]);

  // Layer 3 — liquify
  const liq = layers[3]!;
  liq.speed = params.liquifySpeed;
  patchShader(liq, [
    [fmt(defaults.liquifyAmplitude), fmt(params.liquifyAmplitude)],
    [fmt(defaults.liquifyFrequency), fmt(params.liquifyFrequency)],
    [fmt(defaults.liquifySkew), fmt(params.liquifySkew)],
    [fmt(defaults.liquifyDrift), fmt(params.liquifyDrift)],
    [fmt(defaults.liquifyAngle), fmt(params.liquifyAngle)],
    [fmt(defaults.liquifySize), fmt(params.liquifySize)],
    [fmt(defaults.liquifyStrength), fmt(params.liquifyStrength)],
    [
      `${fmt(defaults.liquifyChromaticAberration)} * 0.5`,
      `${fmt(params.liquifyChromaticAberration)} * 0.5`,
    ],
  ]);

  // Layer 4 — halftone
  patchShader(layers[4]!, [
    [fmt(defaults.halftoneScale), fmt(params.halftoneScale)],
    [fmt(defaults.halftoneSmooth), fmt(params.halftoneSmooth)],
    [fmt(defaults.halftoneRotation), fmt(params.halftoneRotation)],
  ]);

  return data;
}

function patchShader(layer: SceneData["history"][number], replacements: [string, string][]) {
  if (!layer.compiledFragmentShaders) return;
  layer.compiledFragmentShaders = layer.compiledFragmentShaders.map((src: string) => {
    for (const [from, to] of replacements) {
      if (from !== to) src = src.replaceAll(from, to);
    }
    return src;
  });
}

function fmt(v: number): string {
  return v.toFixed(4);
}

function fmtPx(v: number): string {
  return v.toFixed(4);
}

/* ------------------------------------------------------------------ */
/*  Dirty tracking & persistence                                      */
/* ------------------------------------------------------------------ */

const pathToKey: Record<string, keyof WarpParams> = {
  "shape.positionX": "shapePositionX",
  "shape.positionY": "shapePositionY",
  "shape.width": "shapeWidth",
  "shape.height": "shapeHeight",
  "shape.rotation": "shapeRotation",
  "liquify.speed": "liquifySpeed",
  "liquify.amplitude": "liquifyAmplitude",
  "liquify.frequency": "liquifyFrequency",
  "liquify.skew": "liquifySkew",
  "liquify.drift": "liquifyDrift",
  "liquify.angle": "liquifyAngle",
  "liquify.size": "liquifySize",
  "liquify.strength": "liquifyStrength",
  "liquify.chromaticAberration": "liquifyChromaticAberration",
  "halftone.scale": "halftoneScale",
  "halftone.smooth": "halftoneSmooth",
  "halftone.rotation": "halftoneRotation",
  "gradientMap.intensity": "gradientIntensity",
};

/** Returns the set of DialStore paths whose current value differs from the default. */
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

/** Save the patched scene data back to the source warp.json file via Electron IPC. */
export async function saveWarpJson(original: SceneData, params: WarpParams) {
  const api = window.electronAPI;
  if (!api) throw new Error("electronAPI not available");
  const filePath = `${api.repoRoot}/${WARP_JSON_RELATIVE}`;
  const patched = patchScene(original, params);
  const json = JSON.stringify(patched, null, 2) + "\n";
  await api.writeFile(filePath, json);

  // The file now contains these values — update defaults so the next
  // patchScene (or hot-reload) uses the right find strings.
  defaults = { ...params };
}
