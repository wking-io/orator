import type { Handle } from "@remix-run/component";

type Color = "default" | "accent";
export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  width?: number;
  color?: Color;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function Slider(_handle: Handle) {
  return ({ value, onValueChange, min, max, step, width = 140 }: SliderProps) => {
    let safeValue = clamp(value, min, max);
    let thumbSize = 16;
    let ratio = max === min ? 0 : (safeValue - min) / (max - min);
    let progress = ratio * Math.max(0, width - thumbSize);

    return (
      <div class="flex touch-none items-center select-none">
        <p class="mr-2 text-xs text-slide-fg">[-]</p>
        <div class="relative flex h-4 w-full items-center">
          <div
            class="relative h-4 overflow-hidden rounded-[5px] bg-slide-fg/20 to-65% bg-no-repeat p-px shadow-[inset_0_1.5px_2px] shadow-slide-fg/40 outline-1 -outline-offset-1 outline-slide-fg/50"
            style={{ width: `${width}px` }}
          >
            <div class="absolute inset-0 bg-slide-fg" style={{ width: `${progress + 4}px` }} />
            <div
              class="aspect-square h-full rounded bg-slide-bg shadow-[0_0_1px_1px,0_1px_1px,1px_2px_4px_-1px] shadow-slide-fg/50  data-checked:translate-x-3"
              style={{ transform: `translateX(${progress}px)` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeValue}
            aria-label="Noteworthy"
            class="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            on={{
              input(event) {
                let next = Number((event.currentTarget as HTMLInputElement).value);
                onValueChange(Number.isNaN(next) ? min : clamp(next, min, max));
              },
            }}
          />
        </div>
        <p class="ml-2 text-xs text-slide-fg">[+]</p>
      </div>
    );
  };
}
