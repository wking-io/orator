import type { Handle, Props } from "@remix-run/component";
import { DialStore } from "dialkit/store";
import {
  PANEL_ID,
  buildDialConfig,
  defaults,
  initDefaults,
  dirtyPaths,
  paramsFromStore,
  saveWarpJson,
  type WarpParams,
} from "../shaders/warp-params";
import type { SceneData } from "@orator/ui/unicorn-studio";

export function DialPanel(_handle: Handle) {
  let unsub: (() => void) | null = null;
  let onChange: ((params: WarpParams) => void) | null = null;
  let warpOriginal: SceneData | null = null;

  let registered = false;

  _handle.signal.addEventListener("abort", () => {
    unsub?.();
    unsub = null;
    if (registered) DialStore.unregisterPanel(PANEL_ID);
  });

  return (
    props: Props<"div"> & {
      onParamsChange?: (params: WarpParams) => void;
      originalData?: SceneData;
    },
  ) => {
    onChange = props.onParamsChange ?? null;
    warpOriginal = props.originalData ?? null;
    const { onParamsChange: _, originalData: _d, ...rest } = props;

    return (
      <div
        {...rest}
        connect={(el: HTMLDivElement) => {
          if (warpOriginal) {
            initDefaults(warpOriginal);
          }
          const config = buildDialConfig();
          if (registered) {
            DialStore.updatePanel(PANEL_ID, "Warp Shader", config);
          } else {
            DialStore.registerPanel(PANEL_ID, "Warp Shader", config);
            registered = true;
          }
          renderRoot(el, warpOriginal);

          unsub?.();
          unsub = DialStore.subscribe(PANEL_ID, () => {
            const values = DialStore.getValues(PANEL_ID);
            syncSliders(el, values);
            onChange?.(paramsFromStore(values));
          });
        }}
      />
    );
  };
}

/* ------------------------------------------------------------------ */
/*  Imperative DOM rendering using DialKit class names                */
/* ------------------------------------------------------------------ */

const PANEL_ICON_SVG = `<svg class="dialkit-panel-icon" viewBox="0 0 16 16" fill="none"><path opacity="0.5" d="M6.84766 11.75C6.78583 11.9899 6.75 12.2408 6.75 12.5C6.75 12.7592 6.78583 13.0101 6.84766 13.25H2C1.58579 13.25 1.25 12.9142 1.25 12.5C1.25 12.0858 1.58579 11.75 2 11.75H6.84766ZM14 11.75C14.4142 11.75 14.75 12.0858 14.75 12.5C14.75 12.9142 14.4142 13.25 14 13.25H12.6523C12.7142 13.0101 12.75 12.7592 12.75 12.5C12.75 12.2408 12.7142 11.9899 12.6523 11.75H14ZM3.09766 7.25C3.03583 7.48994 3 7.74075 3 8C3 8.25925 3.03583 8.51006 3.09766 8.75H2C1.58579 8.75 1.25 8.41421 1.25 8C1.25 7.58579 1.58579 7.25 2 7.25H3.09766ZM14 7.25C14.4142 7.25 14.75 7.58579 14.75 8C14.75 8.41421 14.4142 8.75 14 8.75H8.90234C8.96417 8.51006 9 8.25925 9 8C9 7.74075 8.96417 7.48994 8.90234 7.25H14ZM7.59766 2.75C7.53583 2.98994 7.5 3.24075 7.5 3.5C7.5 3.75925 7.53583 4.01006 7.59766 4.25H2C1.58579 4.25 1.25 3.91421 1.25 3.5C1.25 3.08579 1.58579 2.75 2 2.75H7.59766ZM14 2.75C14.4142 2.75 14.75 3.08579 14.75 3.5C14.75 3.91421 14.4142 4.25 14 4.25H13.4023C13.4642 4.01006 13.5 3.75925 13.5 3.5C13.5 3.24075 13.4642 2.98994 13.4023 2.75H14Z" fill="currentColor"/><circle cx="6" cy="8" r="0.998596" fill="currentColor" stroke="currentColor" stroke-width="1.25"/><circle cx="10.4999" cy="3.5" r="0.998657" fill="currentColor" stroke="currentColor" stroke-width="1.25"/><circle cx="9.75015" cy="12.5" r="0.997986" fill="currentColor" stroke="currentColor" stroke-width="1.25"/></svg>`;

const CARET_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SAVE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

interface SliderDef {
  folder: string;
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

function flattenSliders(): SliderDef[] {
  const panel = DialStore.getPanel(PANEL_ID);
  if (!panel) return [];

  const out: SliderDef[] = [];
  for (const ctrl of panel.controls) {
    if (ctrl.type === "folder" && ctrl.children) {
      for (const child of ctrl.children) {
        if (child.type === "slider") {
          out.push({
            folder: ctrl.label,
            path: child.path,
            label: child.label,
            min: child.min ?? 0,
            max: child.max ?? 1,
            step: child.step ?? 0.01,
            value: (panel.values[child.path] as number) ?? 0,
          });
        }
      }
    }
  }
  return out;
}

function setCollapsed(inner: HTMLElement, collapsed: boolean) {
  inner.dataset.collapsed = String(collapsed);
  if (collapsed) {
    Object.assign(inner.style, {
      width: "42px",
      height: "42px",
      borderRadius: "21px",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
      overflow: "hidden",
      cursor: "pointer",
    });
  } else {
    Object.assign(inner.style, {
      width: "",
      height: "",
      borderRadius: "",
      boxShadow: "",
      overflow: "",
      cursor: "",
    });
  }
}

function renderRoot(root: HTMLElement, warpOriginal: SceneData | null) {
  root.innerHTML = "";
  root.classList.add("dialkit-root");

  const panel = document.createElement("div");
  panel.className = "dialkit-panel";
  panel.dataset.position = "top-right";

  const wrapper = document.createElement("div");
  wrapper.className = "dialkit-panel-wrapper";

  const inner = document.createElement("div");
  inner.className = "dialkit-panel-inner";

  let isOpen = true;
  setCollapsed(inner, !isOpen);

  const toggle = () => {
    isOpen = !isOpen;
    setCollapsed(inner, !isOpen);
    content.style.display = isOpen ? "" : "none";
    titleRow.style.display = isOpen ? "" : "none";
    saveBtn.style.display = isOpen ? "" : "none";
    collapseBtn.style.display = isOpen ? "" : "none";
    panelIcon.style.display = isOpen ? "none" : "";
    headerTop.style.justifyContent = isOpen ? "" : "center";
    headerTop.style.padding = isOpen ? "" : "0";
    header.style.paddingBottom = isOpen ? "" : "0";
    header.style.marginBottom = isOpen ? "" : "0";
    header.style.borderBottom = isOpen ? "" : "none";
  };

  // Header with title + collapse button + save button
  const header = document.createElement("div");
  header.className = "dialkit-panel-header";

  const headerTop = document.createElement("div");
  headerTop.className = "dialkit-folder-header-top";

  const titleRow = document.createElement("div");
  titleRow.className = "dialkit-folder-title-row";
  const title = document.createElement("span");
  title.className = "dialkit-folder-title dialkit-folder-title-root";
  title.textContent = "Warp Shader";
  titleRow.appendChild(title);

  // Panel icon (only visible when collapsed — acts as expand button)
  const panelIcon = document.createElement("div");
  panelIcon.innerHTML = PANEL_ICON_SVG;
  panelIcon.style.cssText =
    "width:16px;height:16px;color:#fff;flex-shrink:0;display:none;cursor:pointer;";
  panelIcon.addEventListener("click", toggle);

  // Collapse button (only visible when expanded)
  const collapseBtn = document.createElement("button");
  collapseBtn.className = "dialkit-folder-copy";
  collapseBtn.title = "Collapse panel";
  collapseBtn.innerHTML = PANEL_ICON_SVG;
  collapseBtn.addEventListener("click", toggle);

  const saveBtn = document.createElement("button");
  saveBtn.className = "dialkit-folder-copy";
  saveBtn.title = "Save to warp.json";
  saveBtn.innerHTML = SAVE_SVG;
  saveBtn.addEventListener("click", async () => {
    if (!warpOriginal) return;
    const params = paramsFromStore(DialStore.getValues(PANEL_ID));
    try {
      await saveWarpJson(warpOriginal, params);
      saveBtn.style.color = "#4ade80";
      setTimeout(() => {
        saveBtn.style.color = "";
      }, 1000);
    } catch (e) {
      saveBtn.style.color = "#f87171";
      setTimeout(() => {
        saveBtn.style.color = "";
      }, 1000);
      console.error("Failed to save warp.json", e);
    }
  });

  // Button group to keep collapse + save side by side
  const btnGroup = document.createElement("div");
  btnGroup.style.cssText = "display:flex;align-items:center;gap:4px;";
  btnGroup.appendChild(saveBtn);
  btnGroup.appendChild(collapseBtn);

  headerTop.appendChild(titleRow);
  headerTop.appendChild(panelIcon);
  headerTop.appendChild(btnGroup);
  header.appendChild(headerTop);
  inner.appendChild(header);

  // Content container (hidden when collapsed)
  const content = document.createElement("div");
  content.className = "dialkit-panel-content";

  // Folders + sliders
  const sliders = flattenSliders();
  let currentFolder = "";
  let folderInner: HTMLElement | null = null;

  for (const s of sliders) {
    if (s.folder !== currentFolder) {
      currentFolder = s.folder;
      const folder = buildFolder(s.folder);
      content.appendChild(folder.el);
      folderInner = folder.inner;
    }
    folderInner?.appendChild(buildSlider(s));
  }

  inner.appendChild(content);

  // Expand when clicking the collapsed circle
  inner.addEventListener("click", (e) => {
    if (!isOpen && (e.target === inner || e.target === header || e.target === headerTop)) {
      toggle();
    }
  });

  wrapper.appendChild(inner);
  panel.appendChild(wrapper);
  root.appendChild(panel);

  // Initial dirty state
  syncSliders(root, DialStore.getValues(PANEL_ID));
}

function buildFolder(name: string) {
  const folder = document.createElement("div");
  folder.className = "dialkit-folder";

  const folderHeader = document.createElement("div");
  folderHeader.className = "dialkit-folder-header";

  const headerTop = document.createElement("div");
  headerTop.className = "dialkit-folder-header-top";

  const icon = document.createElement("div");
  icon.className = "dialkit-folder-icon";
  icon.innerHTML = CARET_SVG;
  icon.style.transition = "transform 0.2s";
  icon.style.transform = "rotate(90deg)";

  const titleRow = document.createElement("div");
  titleRow.className = "dialkit-folder-title-row";
  const title = document.createElement("span");
  title.className = "dialkit-folder-title";
  title.textContent = name;
  titleRow.appendChild(title);

  headerTop.appendChild(icon);
  headerTop.appendChild(titleRow);
  folderHeader.appendChild(headerTop);

  const content = document.createElement("div");
  content.className = "dialkit-folder-content";

  const inner = document.createElement("div");
  inner.className = "dialkit-folder-inner";

  content.appendChild(inner);
  folder.appendChild(folderHeader);
  folder.appendChild(content);

  let open = true;
  folderHeader.addEventListener("click", () => {
    open = !open;
    content.style.display = open ? "" : "none";
    icon.style.transform = open ? "rotate(90deg)" : "rotate(0deg)";
  });

  return { el: folder, inner };
}

function buildSlider(s: SliderDef): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "dialkit-slider-wrapper";

  const slider = document.createElement("div");
  slider.className = "dialkit-slider";
  slider.dataset.path = s.path;

  const fill = document.createElement("div");
  fill.className = "dialkit-slider-fill";

  const handle = document.createElement("div");
  handle.className = "dialkit-slider-handle";

  // Dirty dot — hidden by default, shown when value ≠ default
  const dot = document.createElement("span");
  dot.className = "dialkit-dirty-dot";
  dot.title = "Double-click to reset";

  const label = document.createElement("span");
  label.className = "dialkit-slider-label";
  label.textContent = s.label;

  const value = document.createElement("span");
  value.className = "dialkit-slider-value";

  const frac = (s.value - s.min) / (s.max - s.min);
  fill.style.width = `${frac * 100}%`;
  fill.style.background = "rgba(255, 255, 255, 0.08)";
  handle.style.left = `${frac * 100}%`;
  handle.style.transform = "translate(-50%, -50%)";
  handle.style.background = "rgba(255, 255, 255, 0.5)";
  value.textContent = formatValue(s.value, s.step);

  slider.appendChild(fill);
  slider.appendChild(handle);
  slider.appendChild(dot);
  slider.appendChild(label);
  slider.appendChild(value);
  wrapper.appendChild(slider);

  // Drag interaction
  const update = (clientX: number) => {
    const rect = slider.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    let v = s.min + pct * (s.max - s.min);
    v = Math.round(v / s.step) * s.step;
    v = Math.max(s.min, Math.min(s.max, v));

    const newFrac = (v - s.min) / (s.max - s.min);
    fill.style.width = `${newFrac * 100}%`;
    handle.style.left = `${newFrac * 100}%`;
    value.textContent = formatValue(v, s.step);
    DialStore.updateValue(PANEL_ID, s.path, v);
  };

  const onMove = (e: PointerEvent) => update(e.clientX);
  const onUp = () => {
    slider.classList.remove("dialkit-slider-active");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  slider.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    slider.classList.add("dialkit-slider-active");
    update(e.clientX);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  // Double-click to reset to default
  slider.addEventListener("dblclick", (e) => {
    e.preventDefault();
    const panel = DialStore.getPanel(PANEL_ID);
    if (!panel) return;

    // Find the default value from dialConfig
    for (const ctrl of panel.controls) {
      if (ctrl.type === "folder" && ctrl.children) {
        for (const child of ctrl.children) {
          if (child.path === s.path) {
            // The default is the first element of the config tuple
            const defaultVal = getDefault(s.path);
            if (defaultVal != null) {
              DialStore.updateValue(PANEL_ID, s.path, defaultVal);
            }
            return;
          }
        }
      }
    }
  });

  return wrapper;
}

/** Path-to-key map matching the one in warp-params. */
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

function getDefault(path: string): number | undefined {
  const key = pathToKey[path];
  return key ? defaults[key] : undefined;
}

function syncSliders(root: HTMLElement, values: Record<string, unknown>) {
  const panel = DialStore.getPanel(PANEL_ID);
  if (!panel) return;

  const dirty = dirtyPaths(values);

  const sliderEls = Array.from(
    root.querySelectorAll(".dialkit-slider[data-path]"),
  ) as HTMLElement[];

  for (const slider of sliderEls) {
    const path = slider.dataset.path!;
    const v = values[path];
    if (typeof v !== "number") continue;

    // Find min/max/step
    let min = 0,
      max = 1,
      step = 0.01;
    for (const ctrl of panel.controls) {
      if (ctrl.type === "folder" && ctrl.children) {
        for (const child of ctrl.children) {
          if (child.path === path) {
            min = child.min ?? 0;
            max = child.max ?? 1;
            step = child.step ?? 0.01;
          }
        }
      }
    }

    const frac = (v - min) / (max - min);
    const fill = slider.querySelector(".dialkit-slider-fill") as HTMLElement | null;
    const handle = slider.querySelector(".dialkit-slider-handle") as HTMLElement | null;
    const valueEl = slider.querySelector(".dialkit-slider-value") as HTMLElement | null;
    const dot = slider.querySelector(".dialkit-dirty-dot") as HTMLElement | null;

    if (fill) fill.style.width = `${frac * 100}%`;
    if (handle) handle.style.left = `${frac * 100}%`;
    if (valueEl) valueEl.textContent = formatValue(v, step);
    if (dot) dot.style.display = dirty.has(path) ? "" : "none";
  }
}

function formatValue(v: number, step: number): string {
  const decimals = step < 0.01 ? 4 : step < 0.1 ? 2 : 1;
  return v.toFixed(decimals);
}
