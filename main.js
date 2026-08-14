"use strict";

const { app, BrowserWindow, ipcMain, screen } = require("electron");

// Capture (and swallow, so no native error dialog) any main-process throw, with
// full stack, into the launchd stderr log (/tmp/rocky-pet.err.log).
process.on("uncaughtException", (err) => {
  process.stderr.write(`[main:uncaughtException] ${err && err.stack ? err.stack : err}\n`);
});
process.on("unhandledRejection", (reason) => {
  process.stderr.write(`[main:unhandledRejection] ${reason && reason.stack ? reason.stack : reason}\n`);
});
const { execFile } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Where the outside world (CLI + Claude Code hooks) drops pings for the pet.
const SIGNAL_DIR = path.join(os.homedir(), ".rocky-pet");
const SIGNAL_FILE = path.join(SIGNAL_DIR, "signal.json");
const POSITION_FILE = path.join(SIGNAL_DIR, "position.json");
const PREFS_FILE = path.join(SIGNAL_DIR, "prefs.json");

const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 220;
const SCREEN_MARGIN = 24;

/** @type {BrowserWindow | null} */
let petWindow = null;
let lastSignalTs = 0;
// Extra space (px) the renderer has reserved past the base window: right + up
// for the session-button stack, left for the "auto mode" nudge. Tracked so
// position saves stay base-relative — the base rect's left edge and the
// window's bottom edge are the fixed anchors regardless of how the window grew.
let currentRight = 0;
let currentTop = 0;
let currentLeft = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function ensureSignalFile() {
  fs.mkdirSync(SIGNAL_DIR, { recursive: true });
  if (!fs.existsSync(SIGNAL_FILE)) {
    fs.writeFileSync(SIGNAL_FILE, JSON.stringify({ action: "idle", ts: 0 }));
  }
}

function readSignal() {
  try {
    const raw = fs.readFileSync(SIGNAL_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function dispatchSignal() {
  const signal = readSignal();
  if (!signal || typeof signal.ts !== "number") return;
  if (signal.ts <= lastSignalTs) return; // already handled
  lastSignalTs = signal.ts;
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send("rocky-action", {
      action: signal.action,
      arg: signal.arg || null,
      tty: signal.tty || null,
      label: signal.label || null,
      sessionId: signal.sessionId || null,
    });
  }
}

// A restart must not re-fire whatever was last sent: lastSignalTs starts at 0, so
// without this the pet replays the previous action (a stale dance, walk or hat)
// every time it comes back up.
function ignoreSignalsFromBefore() {
  const signal = readSignal();
  if (signal && typeof signal.ts === "number") lastSignalTs = signal.ts;
}

function watchSignal() {
  // Watch the directory rather than the file: atomic replaces (write-temp +
  // rename) drop a direct file watch on some platforms.
  fs.watch(SIGNAL_DIR, (_event, filename) => {
    if (!filename || filename === "signal.json") dispatchSignal();
  });
  // Safety net for editors/platforms where fs.watch misses events.
  setInterval(dispatchSignal, 1000);
}

// Rocky's anchor is the BASE rect, not the window: the window grows left/up for
// bubbles, pills and the nudge, so only base coords survive a mid-drag resize.
function getBasePosition() {
  const [x, y] = petWindow.getPosition();
  return [x + currentLeft, y + currentTop];
}

function setBasePosition(x, y) {
  petWindow.setPosition(Math.round(x - currentLeft), Math.round(y - currentTop));
}

// Remember where Pita dragged Rocky, so the spot sticks across restarts.
function savePosition() {
  if (!petWindow || petWindow.isDestroyed()) return;
  const [x, y] = getBasePosition();
  try {
    fs.writeFileSync(POSITION_FILE, JSON.stringify({ x, y }));
  } catch {
    // not worth crashing the pet over a failed position write
  }
}

// Keep Rocky on a visible display even if the saved spot is now off-screen
// (e.g. an external monitor was unplugged).
function clampToVisible(x, y) {
  const display = screen.getDisplayNearestPoint({ x, y });
  const area = display.workArea;
  const clampedX = Math.min(Math.max(x, area.x), area.x + area.width - WINDOW_WIDTH);
  const clampedY = Math.min(Math.max(y, area.y), area.y + area.height - WINDOW_HEIGHT);
  return { x: clampedX, y: clampedY };
}

function startPosition() {
  try {
    const saved = JSON.parse(fs.readFileSync(POSITION_FILE, "utf8"));
    if (typeof saved.x === "number" && typeof saved.y === "number") {
      return clampToVisible(saved.x, saved.y);
    }
  } catch {
    // no saved position yet — fall through to the default corner
  }
  const workArea = screen.getPrimaryDisplay().workArea;
  return {
    x: workArea.x + workArea.width - WINDOW_WIDTH - SCREEN_MARGIN,
    y: workArea.y + workArea.height - WINDOW_HEIGHT - SCREEN_MARGIN,
  };
}

function createWindow() {
  const { x, y } = startPosition();

  petWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: true,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Log a renderer crash so a silent white-out still leaves a trace.
  petWindow.webContents.on("render-process-gone", (_e, details) => {
    process.stderr.write(`[render-process-gone] ${JSON.stringify(details)}\n`);
  });

  petWindow.setAlwaysOnTop(true, "floating");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  petWindow.on("closed", () => {
    petWindow = null;
  });
}

// Renderer asks to quit (× button).
ipcMain.on("rocky-quit", () => app.quit());

// Drag-to-reposition: renderer drives the position in base screen coords, so a
// bubble growing the window mid-drag can't desync it from what it grabbed.
ipcMain.handle("rocky-get-pos", () => {
  if (!petWindow || petWindow.isDestroyed()) return [0, 0];
  return getBasePosition();
});
ipcMain.on("rocky-set-pos", (_event, x, y) => {
  if (!petWindow || petWindow.isDestroyed()) return;
  // A non-finite coord (NaN/Infinity) makes setPosition throw in the main
  // process — the native "A JavaScript error occurred" dialog + a teleport.
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    process.stderr.write(`[rocky-set-pos] ignored non-finite coords x=${x} y=${y}\n`);
    return;
  }
  setBasePosition(x, y);
});
ipcMain.on("rocky-save-pos", () => savePosition());

// Grow the window to fit the session-button stack (right of + above Rocky) and
// the "auto mode" nudge (left of Rocky). The base rect's LEFT edge and the
// window's BOTTOM edge are the fixed anchors, so Rocky never moves on screen no
// matter which way the window grows. The renderer offsets the base content by
// `left` (via --shift-x) to keep it glued to the base rect. (0,0,0) collapses
// back to the base size.
ipcMain.on("rocky-reserve", (_event, { right = 0, top = 0, left = 0 } = {}) => {
  if (!petWindow || petWindow.isDestroyed()) return;
  const bounds = petWindow.getBounds();
  const baseLeft = bounds.x + currentLeft; // fixed screen x of the base rect's left edge
  const bottom = bounds.y + bounds.height; // fixed screen y of the base rect's bottom edge
  const workArea = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y }).workArea;
  // Near a display edge, cap how far the window may grow — sliding it back in
  // instead would carry Rocky with it, and a resize must never move him.
  const r = Math.max(0, Math.round(right));
  const t = clamp(Math.round(top), 0, bottom - WINDOW_HEIGHT - workArea.y);
  const l = clamp(Math.round(left), 0, baseLeft - workArea.x);
  if (r === currentRight && t === currentTop && l === currentLeft) return;
  petWindow.setBounds({
    x: baseLeft - l, // grow leftward of the base rect
    y: bottom - WINDOW_HEIGHT - t, // grow upward of it
    width: WINDOW_WIDTH + l + r,
    height: WINDOW_HEIGHT + t,
  });
  currentRight = r;
  currentTop = t;
  currentLeft = l;
});

// Bring the Terminal window+tab on the given tty to the front (Apple Terminal).
// macOS will prompt once to allow controlling Terminal (automation TCC grant).
function focusTerminalByTty(tty) {
  if (!tty) return;
  const dev = tty.startsWith("/dev/") ? tty : `/dev/${tty}`;
  const script = [
    "on run argv",
    "  set target to item 1 of argv",
    '  tell application "Terminal"',
    "    repeat with w in windows",
    "      repeat with t in tabs of w",
    "        if (tty of t) is target then",
    "          set index of w to 1",
    "          set selected of t to true",
    "          activate",
    "          return",
    "        end if",
    "      end repeat",
    "    end repeat",
    "  end tell",
    "end run",
  ].join("\n");
  execFile("osascript", ["-e", script, dev], () => {});
}
ipcMain.on("rocky-focus-terminal", (_event, tty) => focusTerminalByTty(tty));

// Hand the renderer raw gif bytes as a data URL so it can read pixels off a
// canvas (file:// images taint the canvas and block getImageData).
const ASSET_FILE = {
  amaze: "rocky-amaze.gif",
  yay: "rocky-yay.gif",
  dance: "rocky-dance-yay.gif",
};
// What Rocky is wearing. Missing or corrupt file just means "defaults".
ipcMain.handle("rocky-get-prefs", () => {
  try {
    return JSON.parse(fs.readFileSync(PREFS_FILE, "utf8"));
  } catch {
    return {};
  }
});
ipcMain.on("rocky-save-prefs", (_event, prefs) => {
  try {
    fs.writeFileSync(PREFS_FILE, JSON.stringify(prefs));
  } catch {
    // a lost hat is not worth crashing the pet over
  }
});

ipcMain.handle("rocky-asset-data", (_event, name) => {
  const file = ASSET_FILE[name];
  if (!file) return null;
  try {
    const buf = fs.readFileSync(path.join(__dirname, "assets", file));
    return `data:image/gif;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
});

app.whenReady().then(() => {
  ensureSignalFile();
  ignoreSignalsFromBefore();
  createWindow();
  watchSignal();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Keep running with no windows (it's a pet, not a document app) — but on macOS
// the dock isn't shown anyway. Quit only via the pet's own menu.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
