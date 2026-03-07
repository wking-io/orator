import type { Handle, Props, RemixNode } from "@remix-run/component";

export function Centered(_handle: Handle) {
  return (props: Props<"div"> & { children?: RemixNode }) => (
    <div {...props} data-layout="centered">
      {props.children}
    </div>
  );
}
