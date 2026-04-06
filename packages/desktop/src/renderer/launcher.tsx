import type { Handle } from "@remix-run/component";
import { Deck, type SlideComponent } from "./deck";

export interface TalkEntry {
  readonly name: string;
  readonly loader: () => Promise<{ deck: { slides: ReadonlyArray<SlideComponent> } }>;
}

export const defaultTalks: ReadonlyArray<TalkEntry> = [
  {
    name: "@orator/react-miami-2026",
    loader: () =>
      import("@orator/react-miami-2026") as unknown as Promise<{
        deck: { slides: ReadonlyArray<SlideComponent> };
      }>,
  },
];

const TALK_STORAGE_KEY = "orator:talk";

export function Launcher(handle: Handle) {
  let selected: TalkEntry | null = null;
  let slides: ReadonlyArray<SlideComponent> = [];
  let loading = false;

  function setLoading(talk: TalkEntry, loadedSlides: ReadonlyArray<SlideComponent>) {
    slides = loadedSlides;
    selected = talk;
    loading = false;
    sessionStorage.setItem(TALK_STORAGE_KEY, talk.name);
    handle.update();
  }

  async function loadTalk(talk: TalkEntry, signal: AbortSignal) {
    loading = true;
    handle.update();

    const mod = await talk.loader();
    if (signal.aborted) return;

    setLoading(talk, mod.deck.slides);
  }

  return (props: { talks?: ReadonlyArray<TalkEntry> }) => {
    const talkList = props.talks ?? defaultTalks;

    // Restore previously selected talk after refresh/HMR.
    // Must use queueMicrotask because handle.update() cannot be called during render.
    if (!selected && !loading) {
      const savedTalk = sessionStorage.getItem(TALK_STORAGE_KEY);
      if (savedTalk) {
        const talk = talkList.find((t) => t.name === savedTalk);
        if (talk) {
          loading = true;
          queueMicrotask(() => {
            if (!handle.signal.aborted) {
              loadTalk(talk, handle.signal);
            }
          });
        }
      }
    }

    if (selected) {
      return <Deck slides={slides} transition="fade" />;
    }

    return (
      <div class="flex flex-col items-center justify-center h-full gap-8 bg-neutral-950 text-white">
        <h1 class="text-4xl font-bold">Orator</h1>
        <p class="text-neutral-400">Select a talk to present</p>
        {loading && <p class="text-neutral-500">Loading...</p>}
        <div class="flex flex-col gap-3">
          {talkList.map((talk) => (
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
