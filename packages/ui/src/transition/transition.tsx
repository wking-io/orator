import type { Handle, Props, RemixNode } from "@remix-run/component";
import type { TransitionType } from "@orator/core/domain/transition";

export function Transition(_handle: Handle) {
  return (props: Props<"div"> & { type?: TransitionType; active?: boolean; children?: RemixNode }) => (
    <div
      {...props}
      data-transition={props.type ?? "none"}
      data-active={props.active ? "" : undefined}
    >
      {props.children}
    </div>
  );
}
