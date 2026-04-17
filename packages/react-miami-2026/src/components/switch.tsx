import type { Handle } from "@remix-run/component";
import { cn } from "@orator/utils/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  thumbClassName?: string;
}

export function Switch(_handle: Handle) {
  return ({ checked, onCheckedChange, className, thumbClassName }: SwitchProps) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-checked={checked ? "" : undefined}
      class={cn(
        "relative flex h-4 w-7 rounded-[5px] bg-slide-fg/20 to-65% bg-no-repeat p-px shadow-[inset_0_1.5px_2px] shadow-slide-fg/40 outline-1 -outline-offset-1 outline-slide-fg/50 transition-[background-position,box-shadow] duration-125 ease-[cubic-bezier(0.26,0.75,0.38,0.45)] before:absolute before:rounded-[5px] before:outline-offset-2 before:outline-orange focus-visible:before:inset-0 focus-visible:before:outline-2 data-checked:bg-slide-fg overflow-hidden",

        className,
      )}
      on={{
        click() {
          onCheckedChange(!checked);
        },
      }}
    >
      <span
        aria-hidden="true"
        data-checked={checked ? "" : undefined}
        class={cn(
          "aspect-square h-full rounded bg-slide-bg shadow-[0_0_1px_1px,0_1px_1px,1px_2px_4px_-1px] shadow-slide-fg/50 transition-transform duration-150 data-checked:translate-x-3",
          thumbClassName,
        )}
      />
    </button>
  );
}
