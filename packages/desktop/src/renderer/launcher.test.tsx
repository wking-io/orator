import { describe, expect, it, beforeEach } from "bun:test";
import { createRoot } from "@remix-run/component";
import type { SlideComponent } from "./deck";
import { Launcher, type TalkEntry } from "./launcher";

function SlideA() {
  return () => <div data-slide="a">Slide A</div>;
}

function SlideB() {
  return () => <div data-slide="b">Slide B</div>;
}

const mockTalks: ReadonlyArray<TalkEntry> = [
  {
    name: "test-talk",
    loader: () =>
      Promise.resolve({ deck: { slides: [SlideA, SlideB] as ReadonlyArray<SlideComponent> } }),
  },
  {
    name: "other-talk",
    loader: () => Promise.resolve({ deck: { slides: [SlideA] as ReadonlyArray<SlideComponent> } }),
  },
];

beforeEach(() => {
  sessionStorage.clear();
});

describe("Launcher", () => {
  it("renders talk selector by default when no saved talk", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    root.render(<Launcher talks={mockTalks} />);
    root.flush();

    expect(container.querySelector("button")).not.toBeNull();
    expect(container.textContent).toContain("Orator");

    root.remove();
    container.remove();
  });

  it("auto-loads saved talk from sessionStorage on mount", async () => {
    sessionStorage.setItem("orator:talk", "test-talk");

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    root.render(<Launcher talks={mockTalks} />);
    root.flush();

    // Wait for the async loader to resolve
    await new Promise((r) => setTimeout(r, 50));
    root.flush();

    // Should render the deck, NOT the talk selector
    expect(container.querySelector("[data-deck]")).not.toBeNull();
    expect(container.querySelector("button")).toBeNull();

    root.remove();
    container.remove();
  });

  it("shows talk selector when saved talk name is unknown", async () => {
    sessionStorage.setItem("orator:talk", "nonexistent-talk");

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    root.render(<Launcher talks={mockTalks} />);
    root.flush();

    await new Promise((r) => setTimeout(r, 50));
    root.flush();

    // Should still show the selector since talk wasn't found
    expect(container.querySelector("button")).not.toBeNull();
    expect(container.querySelector("[data-deck]")).toBeNull();

    root.remove();
    container.remove();
  });

  it("survives a full remount and restores talk + slide", async () => {
    // First mount: manually set talk and simulate load
    sessionStorage.setItem("orator:talk", "test-talk");

    const container1 = document.createElement("div");
    document.body.appendChild(container1);
    const root1 = createRoot(container1);

    root1.render(<Launcher talks={mockTalks} />);
    root1.flush();
    await new Promise((r) => setTimeout(r, 50));
    root1.flush();

    expect(container1.querySelector("[data-deck]")).not.toBeNull();

    // Navigate to slide 1
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    root1.flush();
    expect(sessionStorage.getItem("orator:slide")).toBe("1");

    // Simulate full refresh
    root1.remove();
    container1.remove();

    const container2 = document.createElement("div");
    document.body.appendChild(container2);
    const root2 = createRoot(container2);

    root2.render(<Launcher talks={mockTalks} />);
    root2.flush();
    await new Promise((r) => setTimeout(r, 50));
    root2.flush();

    // Should restore the deck
    expect(container2.querySelector("[data-deck]")).not.toBeNull();
    // Should restore to slide B (index 1)
    expect(container2.querySelector("[data-slide='b']")).not.toBeNull();

    root2.remove();
    container2.remove();
  });
});
