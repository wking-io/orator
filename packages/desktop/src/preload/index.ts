import { contextBridge, ipcRenderer } from "electron";
import { resolve } from "node:path";

// packages/desktop/dist/preload/ → repo root
const repoRoot = resolve(__dirname, "../../../..");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  arch: process.arch,
  repoRoot,
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("write-file", filePath, content),
});
