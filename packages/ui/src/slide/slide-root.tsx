import type { Handle, Props, RemixNode } from "@remix-run/component";

export function SlideRoot(_handle: Handle) {
  return (props: Props<"section"> & { notes?: string; children?: RemixNode }) => (
    <section
      {...props}
      data-slide=""
      data-notes={props.notes}
    >
      {props.children}
    </section>
  );
}
