export interface SceneData {
  history: SceneLayer[];
  options: Record<string, unknown>;
  version: string;
  id: string;
}

interface SceneLayer {
  layerType: string;
  width?: number;
  height?: number;
  compiledFragmentShaders?: string[];
  data?: {
    uniforms?: Record<string, { name: string; type: string; value: unknown } | undefined>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Scale a UnicornStudio scene to a target width.
 *
 * Adjusts shape-layer pixel dimensions and the matching hardcoded values
 * inside compiled fragment shaders so the scene renders proportionally
 * at any size.
 */
export function scaleScene(data: SceneData, width: number): SceneData {
  let originalWidth = 1080;

  for (const layer of data.history) {
    const res = layer.data?.uniforms?.artboardResolution;
    if (res?.value && typeof res.value === "object" && "_x" in res.value) {
      originalWidth = (res.value as { _x: number })._x;
      break;
    }
  }

  const scale = width / originalWidth;
  if (Math.abs(scale - 1) < 0.001) return data;

  const scaled: SceneData = JSON.parse(JSON.stringify(data));

  for (const layer of scaled.history) {
    if (layer.layerType === "shape") {
      scaleShapeLayer(layer, scale);
    }

    const res = layer.data?.uniforms?.artboardResolution;
    if (res?.value && typeof res.value === "object" && "_x" in res.value) {
      const v = res.value as { _x: number; _y: number };
      v._x = Math.round(v._x * scale);
      v._y = Math.round(v._y * scale);
    }
  }

  return scaled;
}

function scaleShapeLayer(layer: SceneLayer, scale: number) {
  if (layer.width != null) {
    const oldW = layer.width;
    const newW = oldW * scale;
    layer.width = newW;
    replaceInShaders(layer, formatPx(oldW), formatPx(newW), "absWidth");
  }

  if (layer.height != null) {
    const oldH = layer.height;
    const newH = oldH * scale;
    layer.height = newH;
    replaceInShaders(layer, formatPx(oldH), formatPx(newH), "absHeight");
  }
}

function replaceInShaders(layer: SceneLayer, oldVal: string, newVal: string, varName: string) {
  if (!layer.compiledFragmentShaders) return;
  layer.compiledFragmentShaders = layer.compiledFragmentShaders.map((s) =>
    s.replace(`float ${varName} = ${oldVal};`, `float ${varName} = ${newVal};`),
  );
}

function formatPx(v: number): string {
  return v.toFixed(4);
}
