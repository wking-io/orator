import { TitleSlide } from "./slides/01-title";
import { IntroSlide } from "./slides/02-intro";
import { CodeDemoSlide } from "./slides/03-code-demo";
import { ClosingSlide } from "./slides/04-closing";

export const deck = {
  meta: {
    title: "Building Presentations with Orator",
    author: "Speaker Name",
    event: "Example Conference 2026",
  },
  slides: [TitleSlide, IntroSlide, CodeDemoSlide, ClosingSlide],
};
