import type { Handle, RemixNode } from "@remix-run/component";
import { Split as HeadlessSplit, Centered as HeadlessCentered, FullBleed as HeadlessFullBleed } from "@orator/ui/layout";

export function Split(_handle: Handle) {
  return (props: { children?: RemixNode }) => (
    <HeadlessSplit>{props.children}</HeadlessSplit>
  );
}

export function Centered(_handle: Handle) {
  return (props: { children?: RemixNode }) => (
    <HeadlessCentered>{props.children}</HeadlessCentered>
  );
}

export function FullBleed(_handle: Handle) {
  return (props: { children?: RemixNode }) => (
    <HeadlessFullBleed>{props.children}</HeadlessFullBleed>
  );
}
