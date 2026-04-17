import type { Handle, Props, RemixNode } from "@remix-run/component";
import { cn } from "@orator/utils/cn";

export function SlideRoot(_handle: Handle) {
  return ({
    class: classes,
    ...props
  }: Props<"section"> & { notes?: string; children?: RemixNode }) => (
    <section
      {...props}
      class={cn(classes, "bg-slide-bg text-slide-fg")}
      data-slide=""
      data-notes={props.notes}
    >
      {props.children}
    </section>
  );
}
