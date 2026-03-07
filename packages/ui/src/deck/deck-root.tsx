import type { Handle, Props, RemixNode } from "@remix-run/component";

export function DeckRoot(_handle: Handle) {
  return (props: Props<"div"> & { children?: RemixNode }) => (
    <div {...props} data-deck="">
      {props.children}
    </div>
  );
}
