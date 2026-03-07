import type { Handle } from "@remix-run/component";
import { Slide, Centered } from "@orator/app";

export function ClosingSlide(_handle: Handle) {
  return () => (
    <Slide notes="Thank the audience and take questions.">
      <Centered>
        <h2 class="text-5xl font-bold mb-6">Thank You!</h2>
        <p class="text-2xl text-neutral-400">Questions?</p>
      </Centered>
    </Slide>
  );
}
