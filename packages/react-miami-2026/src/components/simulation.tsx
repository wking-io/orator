import type { Handle, Props } from "@remix-run/component";

// ── Constants ──────────────────────────────────────────────

const MAIN_RADIUS = 18;
const NETWORKING_RADIUS = 10;
const OPPORTUNITY_RADIUS = 5;

const NETWORKING_GRAVITY_MIN = 0.4;
const NETWORKING_GRAVITY_MAX = 1.2;

const BASE_MAIN_GRAVITY = 800;
const GRAVITY_RADIUS_NETWORKING = NETWORKING_RADIUS * 6;
const ABSORB_DISTANCE = 24;

const MAX_SPEED = 220;
const MIN_SPEED = 30;
const WANDER_JITTER = 40;
const DAMPING = 0.98;
const DT_CAP = 0.032; // clamp to ~30fps minimum
const EPSILON = 20; // softening factor for gravity denominator

const FALLBACK_BG_COLOR = "#e2d4c5";
const FALLBACK_MAIN_COLOR = "#241348";
const DOT_GRID_SPACING = 14;
const FALLBACK_OPPORTUNITY_COLOR = "#E70E77";
const FALLBACK_NETWORKING_COLOR = "#130FF0";

const FOG_COLOR_R = 0xcf;
const FOG_COLOR_G = 0xc1;
const FOG_COLOR_B = 0xb3;
const FOG_TRANSITION_WIDTH = 30;

// prettier-ignore
const BAYER_4X4 = new Float32Array([
	 0/16,  8/16,  2/16, 10/16,
	12/16,  4/16, 14/16,  6/16,
	 3/16, 11/16,  1/16,  9/16,
	15/16,  7/16, 13/16,  5/16,
]);

// ── Types ──────────────────────────────────────────────────

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface MainChar extends Entity {
  kind: "main";
}

interface NetworkingChar extends Entity {
  kind: "networking";
  gravity: number;
  orbitTheta: number;
  orbitSpeed: number;
}

interface Opportunity extends Entity {
  kind: "opportunity";
  orbitTarget: "none" | "main";
  orbitTheta: number;
  orbitSpeed: number;
  currentOrbitRadius: number; // lerps toward target for smooth capture
}

export interface SimState {
  width: number;
  height: number;
  main: MainChar;
  networking: NetworkingChar[];
  opportunities: Opportunity[];
  mainGravity: number;
  noteworthy: number;
  noteworthyTarget: number;
  noteworthyPull: number;
  speed: number;
  networkingOrbitSpeed: number;
  opportunityOrbitSpeed: number;
  fogOfWar: boolean;
  fogDistance: number;
}

// ── Helpers ────────────────────────────────────────────────

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function distance(a: Entity, b: Entity) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function clampSpeed(entity: Entity) {
  let speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
  if (speed > MAX_SPEED) {
    let scale = MAX_SPEED / speed;
    entity.vx *= scale;
    entity.vy *= scale;
  } else if (speed < MIN_SPEED && speed > 0.01) {
    let scale = MIN_SPEED / speed;
    entity.vx *= scale;
    entity.vy *= scale;
  } else if (speed <= 0.01) {
    let angle = Math.random() * Math.PI * 2;
    entity.vx = MIN_SPEED * Math.cos(angle);
    entity.vy = MIN_SPEED * Math.sin(angle);
  }
}

function bounce(entity: Entity, w: number, h: number) {
  if (entity.x - entity.radius < 0) {
    entity.x = entity.radius;
    entity.vx = Math.abs(entity.vx);
  } else if (entity.x + entity.radius > w) {
    entity.x = w - entity.radius;
    entity.vx = -Math.abs(entity.vx);
  }
  if (entity.y - entity.radius < 0) {
    entity.y = entity.radius;
    entity.vy = Math.abs(entity.vy);
  } else if (entity.y + entity.radius > h) {
    entity.y = h - entity.radius;
    entity.vy = -Math.abs(entity.vy);
  }
}

function spawnAtRandomEdge(
  w: number,
  h: number,
  radius: number,
): { x: number; y: number; vx: number; vy: number } {
  let side = Math.floor(Math.random() * 4);
  let x: number, y: number, vx: number, vy: number;
  let speed = rand(40, 100);
  switch (side) {
    case 0: // top
      x = rand(radius, w - radius);
      y = radius;
      vx = rand(-speed, speed);
      vy = speed;
      break;
    case 1: // right
      x = w - radius;
      y = rand(radius, h - radius);
      vx = -speed;
      vy = rand(-speed, speed);
      break;
    case 2: // bottom
      x = rand(radius, w - radius);
      y = h - radius;
      vx = rand(-speed, speed);
      vy = -speed;
      break;
    default: // left
      x = radius;
      y = rand(radius, h - radius);
      vx = speed;
      vy = rand(-speed, speed);
      break;
  }
  return { x, y, vx, vy };
}

// ── State init / reconcile ─────────────────────────────────

export function createMain(w: number, h: number): MainChar {
  return {
    kind: "main",
    x: w / 2,
    y: h / 2,
    vx: rand(-30, 30),
    vy: rand(-30, 30),
    radius: MAIN_RADIUS,
  };
}

export function createNetworking(_w: number, _h: number): NetworkingChar {
  return {
    kind: "networking",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: NETWORKING_RADIUS,
    gravity: rand(NETWORKING_GRAVITY_MIN, NETWORKING_GRAVITY_MAX),
    orbitTheta: rand(0, Math.PI * 2),
    orbitSpeed: rand(0.8, 2.0),
  };
}

export function createOpportunity(w: number, h: number): Opportunity {
  return {
    kind: "opportunity",
    x: rand(OPPORTUNITY_RADIUS, w - OPPORTUNITY_RADIUS),
    y: rand(OPPORTUNITY_RADIUS, h - OPPORTUNITY_RADIUS),
    vx: rand(-20, 20),
    vy: rand(-20, 20),
    radius: OPPORTUNITY_RADIUS,
    orbitTarget: "none",
    orbitTheta: rand(0, Math.PI * 2),
    orbitSpeed: rand(1.5, 3.5),
    currentOrbitRadius: 0,
  };
}

export function initState(
  w: number,
  h: number,
  mainGravity: number,
  networkingCount: number,
  opportunityCount: number,
  noteworthy = 1,
  noteworthyPull = 0,
  speed = 1,
  networkingOrbitSpeed = 1,
  opportunityOrbitSpeed = 1,
  fogOfWar = false,
  fogDistance = 50,
): SimState {
  let networking: NetworkingChar[] = [];
  for (let i = 0; i < networkingCount; i++) networking.push(createNetworking(w, h));

  let opportunities: Opportunity[] = [];
  for (let i = 0; i < opportunityCount; i++) opportunities.push(createOpportunity(w, h));

  return {
    width: w,
    height: h,
    main: createMain(w, h),
    networking,
    opportunities,
    mainGravity,
    noteworthy,
    noteworthyTarget: noteworthy,
    noteworthyPull,
    speed,
    networkingOrbitSpeed,
    opportunityOrbitSpeed,
    fogOfWar,
    fogDistance,
  };
}

export function reconcileState(
  state: SimState,
  networkingCount: number,
  opportunityCount: number,
  mainGravity: number,
  noteworthy = 1,
  noteworthyPull = 0,
  speed = 1,
  networkingOrbitSpeed = 1,
  opportunityOrbitSpeed = 1,
  fogOfWar = false,
  fogDistance = 50,
) {
  state.mainGravity = mainGravity;
  state.noteworthyTarget = noteworthy;
  state.noteworthyPull = noteworthyPull;
  state.speed = speed;
  state.networkingOrbitSpeed = networkingOrbitSpeed;
  state.opportunityOrbitSpeed = opportunityOrbitSpeed;
  state.fogOfWar = fogOfWar;
  state.fogDistance = fogDistance;

  while (state.networking.length < networkingCount) {
    state.networking.push(createNetworking(state.width, state.height));
  }
  while (state.networking.length > networkingCount) {
    state.networking.pop();
  }

  while (state.opportunities.length < opportunityCount) {
    state.opportunities.push(createOpportunity(state.width, state.height));
  }
  while (state.opportunities.length > opportunityCount) {
    state.opportunities.pop();
  }
}

// ── Physics step ───────────────────────────────────────────

function applyGravity(target: Entity, source: Entity, strength: number, gravityRadius: number) {
  let dx = source.x - target.x;
  let dy = source.y - target.y;
  let distSq = dx * dx + dy * dy;
  let dist = Math.sqrt(distSq);

  if (dist > gravityRadius || dist < 1) return;

  let force = strength / (dist + EPSILON);
  target.vx += (dx / dist) * force;
  target.vy += (dy / dist) * force;
}

export function step(state: SimState, dt: number) {
  if (dt <= 0) return;
  if (dt > DT_CAP) dt = DT_CAP;

  // Smoothly lerp noteworthy toward its target
  let lerpRate = 1 - Math.exp(-3 * dt);
  state.noteworthy += (state.noteworthyTarget - state.noteworthy) * lerpRate;

  let {
    main,
    networking,
    opportunities,
    width: w,
    height: h,
    mainGravity,
    noteworthy,
    noteworthyPull,
    speed,
    networkingOrbitSpeed,
    opportunityOrbitSpeed,
  } = state;
  let sdt = dt * speed;
  let nw = noteworthy * noteworthy; // exponential: slow at low end, fast at high end
  let mainStrength = BASE_MAIN_GRAVITY * mainGravity * nw;
  let mainGravRadius = MAIN_RADIUS * 4 * Math.sqrt(mainGravity) * nw;

  // Noteworthy pull: subtle canvas-wide gravity toward main, scales with character size
  // Uses a large radius (diagonal of canvas) so it reaches everywhere, but force
  // falls off with distance squared and is much weaker than inner gravity.
  let ambientPullStrength = noteworthyPull * 60 * nw;
  let ambientPullRadius = Math.sqrt(w * w + h * h);

  // Main character: wander + bounce
  main.vx += rand(-WANDER_JITTER, WANDER_JITTER) * sdt;
  main.vy += rand(-WANDER_JITTER, WANDER_JITTER) * sdt;
  main.vx *= DAMPING;
  main.vy *= DAMPING;
  clampSpeed(main);
  main.x += main.vx * sdt;
  main.y += main.vy * sdt;
  bounce(main, w, h);

  // Networking characters always orbit on the gravity field border
  let ncOrbitR = mainGravRadius;
  for (let nc of networking) {
    nc.orbitTheta += nc.orbitSpeed * networkingOrbitSpeed * sdt;
    nc.x = main.x + ncOrbitR * Math.cos(nc.orbitTheta);
    nc.y = main.y + ncOrbitR * Math.sin(nc.orbitTheta);
    nc.vx = main.vx;
    nc.vy = main.vy;
  }

  // Opportunity orbit radii — half the gravity area radius
  let oppOrbitMain = mainGravRadius * 0.5;
  let ncCaptureRadius = GRAVITY_RADIUS_NETWORKING;

  // Opportunities
  for (let opp of opportunities) {
    if (opp.orbitTarget === "none") {
      // Free mode: wander + gravity pull
      opp.vx += rand(-WANDER_JITTER * 0.5, WANDER_JITTER * 0.5) * sdt;
      opp.vy += rand(-WANDER_JITTER * 0.5, WANDER_JITTER * 0.5) * sdt;

      // Gravity from main character
      applyGravity(opp, main, mainStrength, mainGravRadius);

      // Ambient noteworthy pull
      if (ambientPullStrength > 0) {
        applyGravity(opp, main, ambientPullStrength, ambientPullRadius);
      }

      // Gravity from networking characters
      for (let nc of networking) {
        let ncStrength = 200 * nc.gravity;
        applyGravity(opp, nc, ncStrength, ncCaptureRadius);
      }

      opp.vx *= DAMPING;
      opp.vy *= DAMPING;
      clampSpeed(opp);
      opp.x += opp.vx * sdt;
      opp.y += opp.vy * sdt;
      bounce(opp, w, h);

      // Check capture by main character — capture at orbit radius so there's no snap
      let distToMain = distance(opp, main);
      if (distToMain <= oppOrbitMain) {
        opp.orbitTarget = "main";
        opp.orbitTheta = Math.atan2(opp.y - main.y, opp.x - main.x);
        opp.currentOrbitRadius = distToMain;
        continue;
      }

      // Check capture by a networking character — send straight to main orbit
      for (let ni = 0; ni < networking.length; ni++) {
        let nc = networking[ni]!;
        if (distance(opp, nc) <= NETWORKING_RADIUS * 2) {
          opp.orbitTarget = "main";
          opp.orbitTheta = Math.atan2(opp.y - main.y, opp.x - main.x);
          opp.currentOrbitRadius = distance(opp, main);
          break;
        }
      }
    } else if (opp.orbitTarget === "main") {
      // Smoothly lerp radius toward target orbit distance
      let lerpRate = 1 - Math.pow(0.05, sdt); // smooth exponential ease
      opp.currentOrbitRadius += (oppOrbitMain - opp.currentOrbitRadius) * lerpRate;

      opp.orbitTheta += opp.orbitSpeed * opportunityOrbitSpeed * sdt;
      opp.x = main.x + opp.currentOrbitRadius * Math.cos(opp.orbitTheta);
      opp.y = main.y + opp.currentOrbitRadius * Math.sin(opp.orbitTheta);
      opp.vx = main.vx;
      opp.vy = main.vy;
    }
  }
}

// ── Draw ───────────────────────────────────────────────────

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    // Point-up: start at -90 degrees
    let angle = ((Math.PI * 2) / sides) * i - Math.PI / 2;
    let px = x + radius * Math.cos(angle);
    let py = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawGravityField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gravRadius: number,
  color: string,
) {
  ctx.save();

  // Clip to circle so dots don't bleed outside
  ctx.beginPath();
  ctx.arc(x, y, gravRadius, 0, Math.PI * 2);
  ctx.clip();

  // Dot grid
  ctx.fillStyle = color;
  let left = x - gravRadius;
  let top = y - gravRadius;
  let right = x + gravRadius;
  let bottom = y + gravRadius;
  let rSq = gravRadius * gravRadius;

  for (let gx = left - (left % DOT_GRID_SPACING); gx <= right; gx += DOT_GRID_SPACING) {
    for (let gy = top - (top % DOT_GRID_SPACING); gy <= bottom; gy += DOT_GRID_SPACING) {
      let dx = gx - x;
      let dy = gy - y;
      if (dx * dx + dy * dy <= rSq) {
        ctx.beginPath();
        ctx.arc(gx, gy, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();

  // Dashed circle border
  ctx.beginPath();
  ctx.arc(x, y, gravRadius, 0, Math.PI * 2);
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius); // top
  ctx.lineTo(x + radius, y); // right
  ctx.lineTo(x, y + radius); // bottom
  ctx.lineTo(x - radius, y); // left
  ctx.closePath();
}

// ── Fog of war ────────────────────────────────────────────

let fogCanvas: HTMLCanvasElement | null = null;
let fogCtx: CanvasRenderingContext2D | null = null;
let fogImageData: ImageData | null = null;

function drawFog(ctx: CanvasRenderingContext2D, state: SimState) {
  if (!state.fogOfWar) return;

  let w = state.width;
  let h = state.height;

  // Ensure offscreen canvas exists at correct size
  if (!fogCanvas || fogCanvas.width !== w || fogCanvas.height !== h) {
    if (!fogCanvas) fogCanvas = document.createElement("canvas");
    fogCanvas.width = w;
    fogCanvas.height = h;
    fogCtx = fogCanvas.getContext("2d")!;
    fogImageData = fogCtx.createImageData(w, h);
  }

  let data = fogImageData!.data;

  // Compute visible areas
  let nwFog = state.noteworthy * state.noteworthy;
  let mainGravRadius = MAIN_RADIUS * 4 * Math.sqrt(state.mainGravity) * nwFog;
  let mainVisR = mainGravRadius + state.fogDistance;
  let ncGravRadius = NETWORKING_RADIUS * 4;

  // Build circles: main + networking nodes
  let cxs = [state.main.x];
  let cys = [state.main.y];
  let crs = [mainVisR];
  for (let nc of state.networking) {
    cxs.push(nc.x);
    cys.push(nc.y);
    crs.push(ncGravRadius);
  }
  let cLen = cxs.length;

  let tw = FOG_TRANSITION_WIDTH;
  let ds = 2;

  for (let py = 0; py < h; py++) {
    let bayerRow = (Math.floor(py / ds) % 4) * 4;
    for (let px = 0; px < w; px++) {
      let visible = false;
      let inTransition = false;
      let minTransDist = tw;

      for (let i = 0; i < cLen; i++) {
        let dx = px - cxs[i]!;
        let dy = py - cys[i]!;
        let distSq = dx * dx + dy * dy;
        let r = crs[i]!;

        if (distSq <= r * r) {
          visible = true;
          break;
        }

        let outerR = r + tw;
        if (distSq <= outerR * outerR) {
          inTransition = true;
          let dist = Math.sqrt(distSq) - r;
          if (dist < minTransDist) minTransDist = dist;
        }
      }

      let idx = (py * w + px) * 4;

      if (visible) {
        data[idx + 3] = 0;
      } else if (inTransition) {
        let fogAmount = minTransDist / tw;
        let threshold = BAYER_4X4[bayerRow + (Math.floor(px / ds) % 4)]!;
        if (fogAmount > threshold) {
          data[idx] = FOG_COLOR_R;
          data[idx + 1] = FOG_COLOR_G;
          data[idx + 2] = FOG_COLOR_B;
          data[idx + 3] = 255;
        } else {
          data[idx + 3] = 0;
        }
      } else {
        data[idx] = FOG_COLOR_R;
        data[idx + 1] = FOG_COLOR_G;
        data[idx + 2] = FOG_COLOR_B;
        data[idx + 3] = 255;
      }
    }
  }

  fogCtx!.putImageData(fogImageData!, 0, 0);

  // Draw fog overlay — disable smoothing so bayer pattern stays crisp
  let prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(fogCanvas!, 0, 0, w, h);
  ctx.imageSmoothingEnabled = prevSmoothing;
}

function draw(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  colors: { bg: string; main: string; opportunity: string; networking: string },
) {
  ctx.clearRect(0, 0, state.width, state.height);
  let nw = state.noteworthy * state.noteworthy;

  // Main gravity field (behind everything)
  let mainGravRadius = MAIN_RADIUS * 4 * Math.sqrt(state.mainGravity) * nw;
  drawGravityField(ctx, state.main.x, state.main.y, mainGravRadius, colors.main);

  // Networking gravity fields — clip out the main gravity area so only the
  // non-intersecting portion is visible
  let ncGravRadius = NETWORKING_RADIUS * 4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, state.width, state.height);
  // Cut out the main gravity circle (counter-clockwise makes it a hole)
  ctx.arc(state.main.x, state.main.y, mainGravRadius, 0, Math.PI * 2, true);
  ctx.clip("evenodd");
  for (let nc of state.networking) {
    drawGravityField(ctx, nc.x, nc.y, ncGravRadius, colors.networking);
  }
  ctx.restore();

  // Opportunities — diamond (rotated square) with bg fill, opportunity stroke, and lines
  for (let opp of state.opportunities) {
    let r = opp.radius;
    drawDiamond(ctx, opp.x, opp.y, r);
    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.strokeStyle = colors.opportunity;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Horizontal lines clipped to the diamond
    ctx.save();
    drawDiamond(ctx, opp.x, opp.y, r);
    ctx.clip();
    ctx.beginPath();
    let spacing = r * 0.5 - 0.5;
    for (let ly = opp.y - r + spacing; ly < opp.y + r; ly += spacing) {
      ctx.moveTo(opp.x - r, ly);
      ctx.lineTo(opp.x + r, ly);
    }
    ctx.strokeStyle = colors.opportunity;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  // Networking pentagons (on top of their gravity fields)
  for (let nc of state.networking) {
    drawPolygon(ctx, nc.x, nc.y, NETWORKING_RADIUS, 5);
    ctx.fillStyle = colors.networking;
    ctx.fill();
  }

  // Main character hexagon (on top)
  drawPolygon(ctx, state.main.x, state.main.y, MAIN_RADIUS * nw, 6);
  ctx.fillStyle = colors.main;
  ctx.fill();

  // Fog of war overlay (topmost layer)
  drawFog(ctx, state);
}

// ── Remix Component ────────────────────────────────────────

export function Simulation(handle: Handle) {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId: number | null = null;
  let observer: ResizeObserver | null = null;
  let state: SimState | null = null;
  let lastTime = 0;

  let currentProps = {
    opportunityCount: 40,
    networkingCount: 6,
    mainGravity: 1,
    noteworthy: 1,
    noteworthyPull: 0,
    speed: 1,
    networkingOrbitSpeed: 1,
    opportunityOrbitSpeed: 1,
    fogOfWar: false,
    fogDistance: 50,
  };

  let colors = {
    bg: FALLBACK_BG_COLOR,
    main: FALLBACK_MAIN_COLOR,
    opportunity: FALLBACK_OPPORTUNITY_COLOR,
    networking: FALLBACK_NETWORKING_COLOR,
  };

  function readColors(el: HTMLElement) {
    let style = getComputedStyle(el);
    colors.bg = style.getPropertyValue("--color-slide-bg").trim() || FALLBACK_BG_COLOR;
    colors.main = style.getPropertyValue("--sim-main").trim() || FALLBACK_MAIN_COLOR;
    colors.opportunity =
      style.getPropertyValue("--sim-opportunity").trim() || FALLBACK_OPPORTUNITY_COLOR;
    colors.networking =
      style.getPropertyValue("--sim-networking").trim() || FALLBACK_NETWORKING_COLOR;
  }

  function resizeCanvas(el: HTMLCanvasElement) {
    let dpr = window.devicePixelRatio || 1;
    let parent = el.parentElement;
    let w = parent ? parent.clientWidth : el.clientWidth;
    let h = parent ? parent.clientHeight : el.clientHeight;
    if (w === 0 || h === 0) return;

    let oldW = state?.width ?? w;
    let oldH = state?.height ?? h;

    el.width = w * dpr;
    el.height = h * dpr;
    el.style.width = w + "px";
    el.style.height = h + "px";

    let context = el.getContext("2d");
    if (context) {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx = context;
    }

    if (state && (oldW !== w || oldH !== h)) {
      let sx = w / oldW;
      let sy = h / oldH;
      state.width = w;
      state.height = h;
      state.main.x *= sx;
      state.main.y *= sy;
      for (let nc of state.networking) {
        nc.x *= sx;
        nc.y *= sy;
      }
      for (let opp of state.opportunities) {
        opp.x *= sx;
        opp.y *= sy;
      }
    }
  }

  function loop(t: number) {
    if (!state || !ctx) return;
    let dt = lastTime ? (t - lastTime) / 1000 : 0.016;
    lastTime = t;
    step(state, dt);
    draw(ctx, state, colors);
    rafId = requestAnimationFrame(loop);
  }

  handle.signal.addEventListener("abort", () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    observer?.disconnect();
    observer = null;
    state = null;
    ctx = null;
    canvas = null;
  });

  return (
    props: Props<"canvas"> & {
      opportunityCount?: number;
      networkingCount?: number;
      mainGravity?: number;
      noteworthy?: number;
      noteworthyPull?: number;
      speed?: number;
      networkingOrbitSpeed?: number;
      opportunityOrbitSpeed?: number;
      fogOfWar?: boolean;
      fogDistance?: number;
      onStateInit?: (state: SimState) => void;
    },
  ) => {
    let {
      opportunityCount,
      networkingCount,
      mainGravity,
      noteworthy,
      noteworthyPull,
      speed,
      networkingOrbitSpeed,
      opportunityOrbitSpeed,
      fogOfWar,
      fogDistance,
      onStateInit,
      ...rest
    } = props;
    currentProps.opportunityCount = opportunityCount ?? 40;
    currentProps.networkingCount = networkingCount ?? 6;
    currentProps.mainGravity = mainGravity ?? 1;
    currentProps.noteworthy = noteworthy ?? 1;
    currentProps.noteworthyPull = noteworthyPull ?? 0;
    currentProps.speed = speed ?? 1;
    currentProps.networkingOrbitSpeed = networkingOrbitSpeed ?? 1;
    currentProps.opportunityOrbitSpeed = opportunityOrbitSpeed ?? 1;
    currentProps.fogOfWar = fogOfWar ?? false;
    currentProps.fogDistance = fogDistance ?? 50;

    if (state) {
      reconcileState(
        state,
        currentProps.networkingCount,
        currentProps.opportunityCount,
        currentProps.mainGravity,
        currentProps.noteworthy,
        currentProps.noteworthyPull,
        currentProps.speed,
        currentProps.networkingOrbitSpeed,
        currentProps.opportunityOrbitSpeed,
        currentProps.fogOfWar,
        currentProps.fogDistance,
      );
    }

    return (
      <canvas
        {...rest}
        style="display:block;width:100%;height:100%"
        connect={(el: HTMLCanvasElement) => {
          canvas = el;
          readColors(el);
          resizeCanvas(el);
          let parent = el.parentElement;
          let w = parent ? parent.clientWidth : el.clientWidth;
          let h = parent ? parent.clientHeight : el.clientHeight;
          state = initState(
            w || 800,
            h || 600,
            currentProps.mainGravity,
            currentProps.networkingCount,
            currentProps.opportunityCount,
            currentProps.noteworthy,
            currentProps.noteworthyPull,
            currentProps.speed,
            currentProps.networkingOrbitSpeed,
            currentProps.opportunityOrbitSpeed,
            currentProps.fogOfWar,
            currentProps.fogDistance,
          );
          onStateInit?.(state);
          observer?.disconnect();
          observer = new ResizeObserver(() => {
            if (canvas) {
              resizeCanvas(canvas);
              readColors(canvas);
            }
          });
          // Observe parent to avoid feedback loop from canvas's own size
          observer.observe(parent ?? el);
          lastTime = 0;
          if (rafId == null) rafId = requestAnimationFrame(loop);
        }}
      />
    );
  };
}
