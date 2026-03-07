import type { Handle, RemixNode } from "@remix-run/component";
import { CodeBlock as HeadlessCodeBlock } from "@orator/ui/code-block";

export function StyledCodeBlock(_handle: Handle) {
  return (props: { lang?: string; children?: RemixNode }) => (
    <HeadlessCodeBlock lang={props.lang}>
      {props.children}
    </HeadlessCodeBlock>
  );
}
