import { SlideRoot as Slide } from "@orator/ui/slide";
import type { Handle } from "@remix-run/component";

export function BeginSlide(_handle: Handle) {
  return () => (
    <Slide notes="The main character attracts opportunities; networking amplifies reach."></Slide>
  );
}
