import type { Handle, RemixNode } from "@remix-run/component";
import { DeckRoot } from "@orator/ui/deck";
import { Transition } from "@orator/ui/transition";
import type { TransitionType } from "@orator/core/domain/transition";
import { type NavigationState, next, prev, goTo, initialNavigation } from "@orator/core/lib/navigation";

export type SlideComponent = (handle: Handle<any>, setup: any) => (props: any) => RemixNode;

export function Deck(handle: Handle) {
  let nav: NavigationState = initialNavigation(0);

  handle.on(document, {
    keydown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === " ") {
        nav = next(nav);
        handle.update();
      }
      if (event.key === "ArrowLeft") {
        nav = prev(nav);
        handle.update();
      }
      if (event.key >= "1" && event.key <= "9") {
        nav = goTo(nav, Number(event.key) - 1);
        handle.update();
      }
    },
  });

  return (props: { slides: ReadonlyArray<SlideComponent>; transition?: TransitionType }) => {
    if (nav.total !== props.slides.length) {
      nav = initialNavigation(props.slides.length);
    }

    const CurrentSlide = props.slides[nav.current];
    if (!CurrentSlide) return <DeckRoot />;

    return (
      <DeckRoot>
        <Transition type={props.transition ?? "none"} active>
          <CurrentSlide />
        </Transition>
        <div class="fixed bottom-4 right-4 text-muted text-sm font-mono">
          {nav.current + 1} / {nav.total}
        </div>
      </DeckRoot>
    );
  };
}
