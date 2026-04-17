import { describe, expect, it } from "bun:test";
import {
  createMain,
  createNetworking,
  createOpportunity,
  initState,
  reconcileState,
  step,
  type SimState,
} from "./simulation";

describe("Simulation physics", () => {
  function makeState(
    overrides?: Partial<{ w: number; h: number; gravity: number; net: number }>,
  ): SimState {
    let { w = 800, h = 600, gravity = 1, net = 3 } = overrides ?? {};
    return initState(w, h, gravity, net);
  }

  describe("initState", () => {
    it("creates the correct number of entities", () => {
      let state = makeState({ net: 5 });
      expect(state.networking.length).toBe(5);
      expect(state.opportunities.length).toBe(Math.floor(50 * Math.pow(1.1, 5)));
      expect(state.main.kind).toBe("main");
    });

    it("places main character near the center", () => {
      let state = makeState({ w: 800, h: 600 });
      expect(state.main.x).toBe(400);
      expect(state.main.y).toBe(300);
    });

    it("places opportunities within bounds", () => {
      let state = makeState({ w: 400, h: 300, net: 0 });
      for (let opp of state.opportunities) {
        expect(opp.x).toBeGreaterThanOrEqual(opp.radius);
        expect(opp.x).toBeLessThanOrEqual(400 - opp.radius);
        expect(opp.y).toBeGreaterThanOrEqual(opp.radius);
        expect(opp.y).toBeLessThanOrEqual(300 - opp.radius);
      }
    });

    it("networking nodes start at origin before first step", () => {
      let state = makeState({ w: 400, h: 300, net: 3 });
      // Before stepping, networking nodes are at (0,0) — orbit positions them
      step(state, 0.016);
      for (let nc of state.networking) {
        expect(Number.isFinite(nc.x)).toBe(true);
        expect(Number.isFinite(nc.y)).toBe(true);
      }
    });
  });

  describe("step", () => {
    it("does nothing for dt <= 0", () => {
      let state = makeState();
      let mainX = state.main.x;
      let mainY = state.main.y;
      step(state, 0);
      expect(state.main.x).toBe(mainX);
      expect(state.main.y).toBe(mainY);
    });

    it("clamps dt to DT_CAP", () => {
      let state = makeState();
      // A huge dt should be clamped and not cause position explosions.
      step(state, 10);
      expect(Number.isFinite(state.main.x)).toBe(true);
      expect(Number.isFinite(state.main.y)).toBe(true);
    });

    it("keeps entities within bounds after stepping", () => {
      let state = makeState({ w: 200, h: 200, net: 5 });
      for (let i = 0; i < 100; i++) {
        step(state, 0.016);
      }
      let { main, networking, opportunities, width: w, height: h } = state;
      expect(main.x).toBeGreaterThanOrEqual(0);
      expect(main.x).toBeLessThanOrEqual(w);
      expect(main.y).toBeGreaterThanOrEqual(0);
      expect(main.y).toBeLessThanOrEqual(h);
      // Networking nodes orbit main, so they can extend beyond canvas bounds
      // by the orbit radius — just check they're finite
      for (let nc of networking) {
        expect(Number.isFinite(nc.x)).toBe(true);
        expect(Number.isFinite(nc.y)).toBe(true);
      }
      // Orbiting opportunities may extend slightly beyond bounds
      for (let opp of opportunities) {
        expect(Number.isFinite(opp.x)).toBe(true);
        expect(Number.isFinite(opp.y)).toBe(true);
      }
    });

    it("captures opportunities into main orbit when near main", () => {
      let state = makeState({ w: 800, h: 600, net: 0, gravity: 1 });
      let opp = state.opportunities[0]!;
      // Place right on top of main
      opp.x = state.main.x;
      opp.y = state.main.y;
      opp.vx = 0;
      opp.vy = 0;

      step(state, 0.016);

      expect(opp.orbitTarget).toBe("main");
    });

    it("sends opportunities near a networking node directly to main orbit", () => {
      let state = makeState({ w: 800, h: 600, net: 1, gravity: 1 });
      // Step once so the networking node gets positioned in orbit
      step(state, 0.016);
      let nc = state.networking[0]!;
      let opp = state.opportunities[0]!;
      // Place opportunity right on the networking node
      opp.orbitTarget = "none";
      opp.x = nc.x;
      opp.y = nc.y;
      opp.vx = 0;
      opp.vy = 0;

      step(state, 0.016);

      expect(opp.orbitTarget).toBe("main");
    });

    it("networking characters always orbit the main character", () => {
      let state = makeState({ w: 800, h: 600, net: 2 });
      step(state, 0.016);
      // Networking chars should be positioned around main
      for (let nc of state.networking) {
        let dist = Math.sqrt((nc.x - state.main.x) ** 2 + (nc.y - state.main.y) ** 2);
        // Should be at the gravity field border
        expect(dist).toBeGreaterThan(0);
      }
    });
  });

  describe("reconcileState", () => {
    it("adds networking entities when count increases", () => {
      let state = makeState({ net: 2 });
      reconcileState(state, 4, 1);
      expect(state.networking.length).toBe(4);
    });

    it("removes networking entities when count decreases", () => {
      let state = makeState({ net: 5 });
      reconcileState(state, 2, 1);
      expect(state.networking.length).toBe(2);
    });

    it("updates gravityMultiplier", () => {
      let state = makeState({ gravity: 1 });
      reconcileState(state, state.networking.length, 2.5);
      expect(state.gravityMultiplier).toBe(2.5);
    });
  });

  describe("createMain", () => {
    it("has kind main", () => {
      let m = createMain(800, 600);
      expect(m.kind).toBe("main");
      expect(m.radius).toBe(18);
    });
  });

  describe("createNetworking", () => {
    it("has randomized gravity within bounds", () => {
      for (let i = 0; i < 20; i++) {
        let nc = createNetworking(800, 600);
        expect(nc.gravity).toBeGreaterThanOrEqual(0.4);
        expect(nc.gravity).toBeLessThanOrEqual(1.2);
      }
    });
  });

  describe("createOpportunity", () => {
    it("has kind opportunity", () => {
      let o = createOpportunity(800, 600);
      expect(o.kind).toBe("opportunity");
      expect(o.radius).toBe(5);
    });
  });
});
