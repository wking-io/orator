import type { Handle, RemixNode } from "@remix-run/component";
import { SlideRoot } from "@orator/ui/slide";

export function Slide(_handle: Handle) {
  return (props: { notes?: string; children?: RemixNode }) => (
    <SlideRoot notes={props.notes}>
      {props.children}
    </SlideRoot>
  );
}
