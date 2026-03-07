import type { Handle, RemixNode } from "@remix-run/component";

export function Root(_handle: Handle) {
  return (props: { children?: RemixNode }) => (
    <div class="w-full h-full bg-slide-bg text-slide-fg">
      {props.children}
    </div>
  );
}
