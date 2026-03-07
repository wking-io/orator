import type { Handle, Props, RemixNode } from "@remix-run/component";

export function CodeBlock(_handle: Handle) {
  return (props: Props<"pre"> & { lang?: string; children?: RemixNode }) => (
    <pre {...props} data-code-block="" data-lang={props.lang}>
      <code>{props.children}</code>
    </pre>
  );
}
