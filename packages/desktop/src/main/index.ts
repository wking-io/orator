process.title = "orator:desktop:main";

import { app, BrowserWindow, ipcMain, Menu, type MenuItemConstructorOptions } from "electron";
import { writeFile } from "node:fs/promises";
import { createWindow, getMainWindow } from "./window-manager";

function toggleFullScreen(): void {
  const win = BrowserWindow.getFocusedWindow() ?? getMainWindow();
  if (win) win.setFullScreen(!win.isFullScreen());
}

function buildMenu(): Menu {
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" } as MenuItemConstructorOptions] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        {
          label: "Present",
          accelerator: "F",
          click: () => toggleFullScreen(),
        },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
      ],
    },
    { role: "windowMenu" },
  ];
  return Menu.buildFromTemplate(template);
}

ipcMain.handle("write-file", async (_event, filePath: string, content: string) => {
  await writeFile(filePath, content, "utf-8");
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(buildMenu());
    createWindow();

    app.on("activate", () => {
      if (!getMainWindow()) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
