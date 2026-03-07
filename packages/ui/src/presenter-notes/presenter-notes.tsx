import type { Handle, Props, RemixNode } from "@remix-run/component";

export function PresenterNotes(_handle: Handle) {
  return (props: Props<"aside"> & { children?: RemixNode }) => (
    <aside {...props} data-presenter-notes="">
      {props.children}
    </aside>
  );
}
