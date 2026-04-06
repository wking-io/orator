import { Schema } from "effect";

export const TransitionType = Schema.Literal(
  "none",
  "fade",
  "slide-left",
  "slide-right",
  "slide-up",
);
export type TransitionType = typeof TransitionType.Type;

export class Transition extends Schema.Class<Transition>("Transition")({
  type: Schema.optionalWith(TransitionType, { default: () => "none" as const }),
  duration: Schema.optionalWith(Schema.Number, { default: () => 300 }),
}) {}

export const defaultTransition = Schema.decodeSync(Transition)({});
