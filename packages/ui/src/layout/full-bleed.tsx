import type { Handle, Props, RemixNode } from "@remix-run/component";

export function FullBleed(_handle: Handle) {
  return (props: Props<"div"> & { children?: RemixNode }) => (
    <div {...props} data-layout="full-bleed">
      {props.children}
    </div>
  );
}
