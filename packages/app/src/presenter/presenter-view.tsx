import type { Handle } from "@remix-run/component";
import type { SlideComponent } from "../components/deck";
import { type NavigationState, next, prev, initialNavigation } from "@orator/core/lib/navigation";
import { type TimerState, initialTimer, start, stop, elapsed, formatElapsed } from "@orator/core/lib/timer";

export function PresenterView(handle: Handle) {
  let nav: NavigationState = initialNavigation(0);
  let timer: TimerState = initialTimer();

  const tick = setInterval(() => {
    if (timer.running) handle.update();
  }, 1000);
  handle.signal.addEventListener("abort", () => clearInterval(tick));

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
    },
  });

  return (props: { slides: ReadonlyArray<SlideComponent>; notes?: ReadonlyArray<string> }) => {
    if (nav.total !== props.slides.length) {
      nav = initialNavigation(props.slides.length);
      timer = start(initialTimer(), Date.now());
    }

    const CurrentSlide = props.slides[nav.current];
    const NextSlide = props.slides[nav.current + 1];
    const currentNotes = props.notes?.[nav.current] ?? "";
    const elapsedMs = elapsed(timer, Date.now());

    return (
      <div class="grid grid-cols-2 grid-rows-[1fr_auto] h-full gap-4 p-4 bg-neutral-950 text-white">
        <div class="border border-neutral-700 rounded overflow-hidden aspect-video">
          {CurrentSlide && <CurrentSlide />}
        </div>
        <div class="border border-neutral-800 rounded overflow-hidden aspect-video opacity-60">
          {NextSlide && <NextSlide />}
        </div>
        <div class="col-span-2 flex items-center justify-between px-4 py-2 bg-neutral-900 rounded">
          <div class="text-sm text-neutral-400">
            {currentNotes}
          </div>
          <div class="flex items-center gap-6 text-sm font-mono">
            <span>{nav.current + 1} / {nav.total}</span>
            <span>{formatElapsed(elapsedMs)}</span>
            <button
              class="px-2 py-1 bg-neutral-800 rounded text-xs"
              type="button"
              on={{
                click() {
                  timer = timer.running ? stop(timer, Date.now()) : start(timer, Date.now());
                  handle.update();
                },
              }}
            >
              {timer.running ? "Pause" : "Start"}
            </button>
          </div>
        </div>
      </div>
    );
  };
}
