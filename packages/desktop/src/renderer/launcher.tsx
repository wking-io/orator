import type { Handle } from "@remix-run/component";
import { Deck, type SlideComponent } from "@orator/app";

interface TalkEntry {
  readonly name: string;
  readonly loader: () => Promise<{ deck: { slides: ReadonlyArray<SlideComponent> } }>;
}

const talks: ReadonlyArray<TalkEntry> = [
  {
    name: "@orator/example-talk",
    loader: () => import("@orator/example-talk") as unknown as Promise<{ deck: { slides: ReadonlyArray<SlideComponent> } }>,
  },
];

export function Launcher(handle: Handle) {
  let selected: TalkEntry | null = null;
  let slides: ReadonlyArray<SlideComponent> = [];
  let loading = false;

  async function loadTalk(talk: TalkEntry, signal: AbortSignal) {
    loading = true;
    handle.update();

    const mod = await talk.loader();
    if (signal.aborted) return;

    slides = mod.deck.slides;
    selected = talk;
    loading = false;
    handle.update();
  }

  return () => {
    if (selected) {
      return <Deck slides={slides} transition="fade" />;
    }

    return (
      <div class="flex flex-col items-center justify-center h-full gap-8 bg-neutral-950 text-white">
        <h1 class="text-4xl font-bold">Orator</h1>
        <p class="text-neutral-400">Select a talk to present</p>
        {loading && <p class="text-neutral-500">Loading...</p>}
        <div class="flex flex-col gap-3">
          {talks.map((talk) => (
            <button
              key={talk.name}
              class="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-left transition-colors"
              type="button"
              on={{
                click(_event: Event, signal: AbortSignal) {
                  loadTalk(talk, signal);
                },
              }}
            >
              {talk.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
}
