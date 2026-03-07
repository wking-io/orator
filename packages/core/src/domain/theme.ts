import { Schema } from "effect";

export class Theme extends Schema.Class<Theme>("Theme")({
  background: Schema.optionalWith(Schema.String, { default: () => "#0a0a0a" }),
  foreground: Schema.optionalWith(Schema.String, { default: () => "#fafafa" }),
  accent: Schema.optionalWith(Schema.String, { default: () => "#3b82f6" }),
  fontFamily: Schema.optionalWith(Schema.String, { default: () => "Inter, system-ui, sans-serif" }),
  codeFontFamily: Schema.optionalWith(Schema.String, { default: () => "'Fira Code', monospace" }),
}) {}

export const defaultTheme = Schema.decodeSync(Theme)({});
