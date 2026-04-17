import "./style.css";
import { BeginSlide } from "./slides/00-begin";
import { NoteworthySlide } from "./slides/01-noteworthy";
import { NetworkSlide } from "./slides/02-network";

export const deck = {
  meta: {
    title: "The Network Effect",
    author: "Will King",
    event: "React Miami 2026",
  },
  slides: [BeginSlide, NoteworthySlide, NetworkSlide],
};
