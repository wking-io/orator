import { Schema } from "effect";

export class DeckMeta extends Schema.Class<DeckMeta>("DeckMeta")({
  title: Schema.String,
  author: Schema.String,
  date: Schema.optionalWith(Schema.String, { default: () => "" }),
  event: Schema.optionalWith(Schema.String, { default: () => "" }),
}) {}

export interface DeckDefinition {
  readonly meta: DeckMeta;
  readonly slides: ReadonlyArray<Function>;
  readonly theme?: Record<string, string>;
}
