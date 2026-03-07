import { Schema } from "effect";

export class Slide extends Schema.Class<Slide>("Slide")({
  id: Schema.String,
  title: Schema.optionalWith(Schema.String, { default: () => "" }),
  notes: Schema.optionalWith(Schema.String, { default: () => "" }),
}) {}
