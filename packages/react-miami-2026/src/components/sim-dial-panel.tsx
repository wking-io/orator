import type { Handle, Props } from "@remix-run/component";
import { DialStore } from "dialkit/store";
import {
  PANEL_ID,
  buildDialConfig,
  defaults,
  dirtyPaths,
  paramsFromStore,
  type SimParams,
} from "./sim-params";

export function SimDialPanel(_handle: Handle) {
  let unsub: (() => void) | null = null;
  let onChange: ((params: SimParams) => void) | null = null;
  let registered = false;

  _handle.signal.addEventListener("abort", () => {
    unsub?.();
    unsub = null;
    if (registered) DialStore.unregisterPanel(PANEL_ID);
  });

  return (
    props: Props<"div"> & {
      onParamsChange?: (params: SimParams) => void;
    },
  ) => {
    onChange = props.onParamsChange ?? null;
    const { onParamsChange: _, ...rest } = props;

    return (
      <div
        {...rest}
        connect={(el: HTMLDivElement) => {
          const config = buildDialConfig();
          if (registered) {
            DialStore.updatePanel(PANEL_ID, "Simulation", config);
          } else {
            DialStore.registerPanel(PANEL_ID, "Simulation", config);
            registered = true;
          }
          renderRoot(el);

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

function renderRoot(root: HTMLElement) {
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
    collapseBtn.style.display = isOpen ? "" : "none";
    panelIcon.style.display = isOpen ? "none" : "";
    headerTop.style.justifyContent = isOpen ? "" : "center";
    headerTop.style.padding = isOpen ? "" : "0";
    header.style.paddingBottom = isOpen ? "" : "0";
    header.style.marginBottom = isOpen ? "" : "0";
    header.style.borderBottom = isOpen ? "" : "none";
  };

  const header = document.createElement("div");
  header.className = "dialkit-panel-header";

  const headerTop = document.createElement("div");
  headerTop.className = "dialkit-folder-header-top";

  const titleRow = document.createElement("div");
  titleRow.className = "dialkit-folder-title-row";
  const title = document.createElement("span");
  title.className = "dialkit-folder-title dialkit-folder-title-root";
  title.textContent = "Simulation";
  titleRow.appendChild(title);

  const panelIcon = document.createElement("div");
  panelIcon.innerHTML = PANEL_ICON_SVG;
  panelIcon.style.cssText =
    "width:16px;height:16px;color:#fff;flex-shrink:0;display:none;cursor:pointer;";
  panelIcon.addEventListener("click", toggle);

  const collapseBtn = document.createElement("button");
  collapseBtn.className = "dialkit-folder-copy";
  collapseBtn.title = "Collapse panel";
  collapseBtn.innerHTML = PANEL_ICON_SVG;
  collapseBtn.addEventListener("click", toggle);

  headerTop.appendChild(titleRow);
  headerTop.appendChild(panelIcon);
  headerTop.appendChild(collapseBtn);
  header.appendChild(headerTop);
  inner.appendChild(header);

  const content = document.createElement("div");
  content.className = "dialkit-panel-content";

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
    let isToggle = s.min === 0 && s.max === 1 && s.step === 1;
    folderInner?.appendChild(isToggle ? buildToggle(s) : buildSlider(s));
  }

  content.appendChild(buildCurvePreview());

  inner.appendChild(content);

  inner.addEventListener("click", (e) => {
    if (!isOpen && (e.target === inner || e.target === header || e.target === headerTop)) {
      toggle();
    }
  });

  wrapper.appendChild(inner);
  panel.appendChild(wrapper);
  root.appendChild(panel);

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
  const titleEl = document.createElement("span");
  titleEl.className = "dialkit-folder-title";
  titleEl.textContent = name;
  titleRow.appendChild(titleEl);

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

  slider.addEventListener("dblclick", (e) => {
    e.preventDefault();
    const defaultVal = defaults[pathToKey[s.path]!];
    if (defaultVal != null) {
      DialStore.updateValue(PANEL_ID, s.path, defaultVal);
    }
  });

  return wrapper;
}

function buildToggle(s: SliderDef): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "dialkit-slider-wrapper";

  const row = document.createElement("div");
  row.className = "dialkit-slider";
  row.dataset.path = s.path;
  row.style.cssText =
    "display:flex;align-items:center;justify-content:space-between;cursor:pointer;";

  const label = document.createElement("span");
  label.className = "dialkit-slider-label";
  label.textContent = s.label;

  const dot = document.createElement("span");
  dot.className = "dialkit-dirty-dot";
  dot.title = "Double-click to reset";

  const track = document.createElement("div");
  track.style.cssText =
    "width:32px;height:16px;border-radius:8px;position:relative;transition:background 0.15s;flex-shrink:0;";
  track.style.background = s.value ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)";

  const thumb = document.createElement("div");
  thumb.style.cssText =
    "width:12px;height:12px;border-radius:6px;background:#fff;position:absolute;top:2px;transition:left 0.15s;";
  thumb.style.left = s.value ? "18px" : "2px";
  track.appendChild(thumb);

  const toggle = () => {
    const cur = DialStore.getValues(PANEL_ID)[s.path];
    const next = cur ? 0 : 1;
    DialStore.updateValue(PANEL_ID, s.path, next);
  };

  row.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  row.addEventListener("dblclick", (e) => {
    e.preventDefault();
    const defaultVal = defaults[pathToKey[s.path]!];
    if (defaultVal != null) {
      DialStore.updateValue(PANEL_ID, s.path, defaultVal);
    }
  });

  row.appendChild(dot);
  row.appendChild(label);
  row.appendChild(track);
  wrapper.appendChild(row);
  return wrapper;
}

// ── Curve preview SVG ─────────────────────────────────────

const CURVE_W = 200;
const CURVE_H = 80;
const CURVE_PAD = 16;
const CURVE_SAMPLES = 60;

// noteworthy range from dial config
const NW_MIN = 0.5;
const NW_MAX = 1.5;

function buildCurvePreview(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "dialkit-curve-preview";
  wrapper.style.cssText = "padding:8px 12px 4px;";

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${CURVE_W} ${CURVE_H}`);
  svg.setAttribute("width", String(CURVE_W));
  svg.setAttribute("height", String(CURVE_H));
  svg.style.cssText = "display:block;width:100%;height:auto;";

  // Axes
  const axes = document.createElementNS(ns, "polyline");
  axes.setAttribute(
    "points",
    `${CURVE_PAD},${CURVE_PAD} ${CURVE_PAD},${CURVE_H - CURVE_PAD} ${CURVE_W - CURVE_PAD},${CURVE_H - CURVE_PAD}`,
  );
  axes.setAttribute("fill", "none");
  axes.setAttribute("stroke", "rgba(255,255,255,0.2)");
  axes.setAttribute("stroke-width", "1");
  svg.appendChild(axes);

  // Curve path
  const curvePath = document.createElementNS(ns, "polyline");
  curvePath.setAttribute("fill", "none");
  curvePath.setAttribute("stroke", "rgba(255,255,255,0.7)");
  curvePath.setAttribute("stroke-width", "1.5");
  curvePath.setAttribute("stroke-linejoin", "round");
  curvePath.classList.add("curve-line");
  svg.appendChild(curvePath);

  // Current position dot
  const dot = document.createElementNS(ns, "circle");
  dot.setAttribute("r", "3");
  dot.setAttribute("fill", "#fff");
  dot.classList.add("curve-dot");
  svg.appendChild(dot);

  // Labels
  const labelCurve = document.createElementNS(ns, "text");
  labelCurve.setAttribute("x", String(CURVE_W - CURVE_PAD));
  labelCurve.setAttribute("y", String(CURVE_PAD - 4));
  labelCurve.setAttribute("text-anchor", "end");
  labelCurve.setAttribute("fill", "rgba(255,255,255,0.4)");
  labelCurve.setAttribute("font-size", "8");
  labelCurve.setAttribute("font-family", "system-ui, sans-serif");
  labelCurve.classList.add("curve-label");
  svg.appendChild(labelCurve);

  wrapper.appendChild(svg);
  return wrapper;
}

const DIA_MIN = 4;
const DIA_MAX = 56;

/** Same normalization as simulation.tsx computeNw — maps raw pow to 4..44px diameter */
function computeDia(noteworthy: number, curve: number): number {
  let rawMin = Math.pow(NW_MIN, curve);
  let rawMax = Math.pow(NW_MAX, curve);
  let raw = Math.pow(noteworthy, curve);
  let t = rawMax === rawMin ? 0 : (raw - rawMin) / (rawMax - rawMin);
  return DIA_MIN + t * (DIA_MAX - DIA_MIN);
}

function updateCurvePreview(root: HTMLElement, noteworthy: number, curve: number) {
  const svg = root.querySelector(".dialkit-curve-preview svg");
  if (!svg) return;

  const plotW = CURVE_W - CURVE_PAD * 2;
  const plotH = CURVE_H - CURVE_PAD * 2;

  // Build polyline points — Y axis is always 4..44px diameter
  let points = "";
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    let t = i / CURVE_SAMPLES;
    let nw = NW_MIN + t * (NW_MAX - NW_MIN);
    let dia = computeDia(nw, curve);
    let px = CURVE_PAD + t * plotW;
    let py = CURVE_H - CURVE_PAD - ((dia - DIA_MIN) / (DIA_MAX - DIA_MIN)) * plotH;
    points += `${px.toFixed(1)},${py.toFixed(1)} `;
  }

  let curveLine = svg.querySelector(".curve-line");
  if (curveLine) curveLine.setAttribute("points", points.trim());

  // Position dot at current noteworthy
  let tCurrent = (noteworthy - NW_MIN) / (NW_MAX - NW_MIN);
  tCurrent = Math.max(0, Math.min(1, tCurrent));
  let diaCurrent = computeDia(noteworthy, curve);
  let dotX = CURVE_PAD + tCurrent * plotW;
  let dotY = CURVE_H - CURVE_PAD - ((diaCurrent - DIA_MIN) / (DIA_MAX - DIA_MIN)) * plotH;
  let dot = svg.querySelector(".curve-dot");
  if (dot) {
    dot.setAttribute("cx", dotX.toFixed(1));
    dot.setAttribute("cy", dotY.toFixed(1));
  }

  // Update label
  let label = svg.querySelector(".curve-label");
  if (label) label.textContent = `${diaCurrent.toFixed(0)}px dia`;
}

const pathToKey: Record<string, keyof typeof defaults> = {
  "simulation.opportunityCount": "opportunityCount",
  "simulation.networkingCount": "networkingCount",
  "simulation.mainGravity": "mainGravity",
  "simulation.fogOfWar": "fogOfWar",
  "simulation.fogDistance": "fogDistance",
};

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
    const fillEl = slider.querySelector(".dialkit-slider-fill") as HTMLElement | null;
    const handleEl = slider.querySelector(".dialkit-slider-handle") as HTMLElement | null;
    const valueEl = slider.querySelector(".dialkit-slider-value") as HTMLElement | null;
    const dotEl = slider.querySelector(".dialkit-dirty-dot") as HTMLElement | null;

    if (fillEl) fillEl.style.width = `${frac * 100}%`;
    if (handleEl) handleEl.style.left = `${frac * 100}%`;
    if (valueEl) valueEl.textContent = formatValue(v, step);
    if (dotEl) dotEl.style.display = dirty.has(path) ? "" : "none";

    // Toggle sync
    let trackEl = slider.querySelector("div[style*='border-radius:8px']") as HTMLElement | null;
    if (trackEl) {
      let thumbEl = trackEl.firstElementChild as HTMLElement | null;
      trackEl.style.background = v ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)";
      if (thumbEl) thumbEl.style.left = v ? "18px" : "2px";
    }
  }

  // Update curve preview
  let nw = typeof values["simulation.noteworthy"] === "number" ? (values["simulation.noteworthy"] as number) : defaults.noteworthy;
  let curve = typeof values["simulation.noteworthyCurve"] === "number" ? (values["simulation.noteworthyCurve"] as number) : defaults.noteworthyCurve;
  updateCurvePreview(root, nw, curve);
}

function formatValue(v: number, step: number): string {
  const decimals = step < 0.01 ? 4 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return v.toFixed(decimals);
}
