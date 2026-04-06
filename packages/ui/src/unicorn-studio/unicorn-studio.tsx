import type { Handle, Props } from "@remix-run/component";
// @ts-expect-error — no types shipped with the SDK
import * as UnicornStudioSDK from "unicornstudio/dist/unicornStudio.umd.js";
import type { SceneData } from "./scale-scene";

interface UnicornScene {
  destroy(): void;
  resize(): void;
  paused: boolean;
}

export function UnicornStudio(handle: Handle) {
  let scene: UnicornScene | null = null;
  let observer: ResizeObserver | null = null;
  let scriptEl: HTMLScriptElement | null = null;

  handle.signal.addEventListener("abort", () => {
    observer?.disconnect();
    observer = null;
    scene?.destroy();
    scene = null;
    scriptEl?.remove();
    scriptEl = null;
  });

  return (
    props: Props<"div"> & {
      filePath?: string;
      data?: SceneData;
      scale?: number;
      dpi?: number;
      fps?: number;
    },
  ) => {
    let { filePath, data, scale, dpi, fps, ...rest } = props;

    return (
      <div
        {...rest}
        connect={(el: HTMLDivElement) => {
          if (!el.id) {
            el.id = `us-${handle.id}`;
          }

          scene?.destroy();

          let resolvedPath = filePath;

          if (data && !filePath) {
            const scriptId = `us-data-${handle.id}`;
            scriptEl?.remove();
            const script = document.createElement("script");
            script.id = scriptId;
            script.type = "application/json";
            script.textContent = JSON.stringify(data);
            document.body.appendChild(script);
            scriptEl = script;
            resolvedPath = scriptId;
          }

          UnicornStudioSDK.addScene({
            elementId: el.id,
            filePath: resolvedPath,
            scale: scale ?? 1,
            dpi: dpi ?? 1,
            fps: fps ?? 60,
            production: true,
          }).then((s: UnicornScene) => {
            scene = s;

            observer?.disconnect();
            observer = new ResizeObserver(() => {
              scene?.resize();
            });
            observer.observe(el);
          });
        }}
      />
    );
  };
}
