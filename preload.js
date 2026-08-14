"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rocky", {
  // Subscribe to external pings (CLI / Claude Code hooks). Returns an
  // unsubscribe function.
  onAction(callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("rocky-action", handler);
    return () => ipcRenderer.removeListener("rocky-action", handler);
  },
  quit() {
    ipcRenderer.send("rocky-quit");
  },
  // Drag-to-reposition bridge.
  getWindowPos() {
    return ipcRenderer.invoke("rocky-get-pos");
  },
  moveWindow(x, y) {
    ipcRenderer.send("rocky-set-pos", x, y);
  },
  savePosition() {
    ipcRenderer.send("rocky-save-pos");
  },
  getAssetData(name) {
    return ipcRenderer.invoke("rocky-asset-data", name);
  },
  // What Rocky is wearing, so the ball and hat survive a restart.
  getPrefs() {
    return ipcRenderer.invoke("rocky-get-prefs");
  },
  savePrefs(prefs) {
    ipcRenderer.send("rocky-save-prefs", prefs);
  },
  // Window growth: reserve space right + up (session stack) and left (auto-mode
  // nudge), plus jump to a terminal tab.
  reserve(right, top, left) {
    ipcRenderer.send("rocky-reserve", { right, top, left });
  },
  focusTerminal(tty) {
    ipcRenderer.send("rocky-focus-terminal", tty);
  },
});
