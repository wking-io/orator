import type { Handle, Props, RemixNode } from "@remix-run/component";

export function Split(_handle: Handle) {
  return (props: Props<"div"> & { children?: RemixNode }) => (
    <div {...props} data-layout="split">
      {props.children}
    </div>
  );
}
