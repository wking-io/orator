import type { Handle, Props, RemixNode } from "@remix-run/component";

export function PrevTrigger(_handle: Handle) {
  return (props: Props<"button"> & { children?: RemixNode }) => (
    <button {...props} data-nav="prev" type="button">
      {props.children}
    </button>
  );
}
