import type { Handle } from "@remix-run/component";
import { Slide, Centered } from "@orator/app";

export function IntroSlide(_handle: Handle) {
  return () => (
    <Slide notes="Explain what Orator is and why it exists.">
      <Centered>
        <h2 class="text-4xl font-bold mb-8">What is Orator?</h2>
        <ul class="text-xl text-neutral-300 space-y-4 text-left">
          <li>Web-based slide presentations</li>
          <li>Built with Remix Components</li>
          <li>Each talk is a workspace package</li>
          <li>Full programmatic control over slides</li>
        </ul>
      </Centered>
    </Slide>
  );
}
