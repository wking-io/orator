import type { Handle } from "@remix-run/component";
import { Slide, Centered } from "@orator/app";

export function TitleSlide(_handle: Handle) {
  return () => (
    <Slide notes="Welcome the audience and introduce yourself.">
      <Centered>
        <h1 class="text-6xl font-bold mb-4">Building Presentations with Orator</h1>
        <p class="text-2xl text-neutral-400">Speaker Name</p>
        <p class="text-lg text-neutral-500 mt-2">Example Conference 2026</p>
      </Centered>
    </Slide>
  );
}
