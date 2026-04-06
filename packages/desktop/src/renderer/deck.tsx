import type { Handle, RemixNode } from "@remix-run/component";
import { DeckRoot } from "@orator/ui/deck";
import { Transition } from "@orator/ui/transition";
import type { TransitionType } from "@orator/core/domain/transition";
import {
  type NavigationState,
  next,
  prev,
  goTo,
  initialNavigation,
} from "@orator/core/lib/navigation";

export type SlideComponent = (handle: Handle<any>, setup: any) => (props: any) => RemixNode;

const STORAGE_KEY = "orator:slide";

export function Deck(handle: Handle) {
  let nav: NavigationState = initialNavigation(0);

  function setNav(next: NavigationState) {
    nav = next;
    sessionStorage.setItem(STORAGE_KEY, String(nav.current));
    handle.update();
  }

  handle.on(document, {
    keydown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === " ") {
        setNav(next(nav));
      }
      if (event.key === "ArrowLeft") {
        setNav(prev(nav));
      }
      if (event.key >= "1" && event.key <= "9") {
        setNav(goTo(nav, Number(event.key) - 1));
      }
    },
  });

  return (props: { slides: ReadonlyArray<SlideComponent>; transition?: TransitionType }) => {
    if (nav.total !== props.slides.length) {
      let saved = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0);
      nav = goTo(initialNavigation(props.slides.length), saved);
    }

    const CurrentSlide = props.slides[nav.current];
    if (!CurrentSlide) return <DeckRoot />;

    return (
      <DeckRoot>
        <Transition type={props.transition ?? "none"} active>
          <CurrentSlide />
        </Transition>
      </DeckRoot>
    );
  };
}
