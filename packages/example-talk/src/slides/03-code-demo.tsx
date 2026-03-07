import type { Handle } from "@remix-run/component";
import { Slide, Split, StyledCodeBlock } from "@orator/app";

export function CodeDemoSlide(_handle: Handle) {
  return () => (
    <Slide notes="Walk through the code example.">
      <Split>
        <div>
          <h2 class="text-3xl font-bold mb-6">Slide as TSX</h2>
          <StyledCodeBlock lang="tsx">{`export function MySlide(handle: Handle) {
  return () => (
    <Slide notes="Speaker notes here.">
      <Centered>
        <h1>Hello, Orator!</h1>
      </Centered>
    </Slide>
  )
}`}</StyledCodeBlock>
        </div>
        <div class="flex items-center justify-center">
          <p class="text-2xl text-neutral-400">
            Each slide is a Remix Component with full type safety.
          </p>
        </div>
      </Split>
    </Slide>
  );
}
