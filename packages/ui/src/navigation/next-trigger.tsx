import type { Handle, Props, RemixNode } from "@remix-run/component";

export function NextTrigger(_handle: Handle) {
  return (props: Props<"button"> & { children?: RemixNode }) => (
    <button {...props} data-nav="next" type="button">
      {props.children}
    </button>
  );
}
