# 🪨 rocky-pet

A tiny **transparent, always-on-top desktop pet** that floats in the corner of
your screen, reacts to you, and reacts to your Claude Code sessions — it hops
when a session finishes, nags you when one is waiting for input, and points you
back at the right terminal tab.

This one is Rocky, an Eridian engineer riding a geodesic sphere. **Yours can be
anything** — three GIFs and a handful of constants is the whole costume. This
README is written for that: cloning it and making it your own.

| Trigger | Reaction |
|---|---|
| idle | frozen pose, gentle breathing |
| hover | live GIF + a rotating catchphrase bubble |
| double-click | "yay", or a short stroll (50/50) |
| drag | walks along while you carry him, ball rolling; position is remembered |
| session finished / needs input | a hop, a bubble, and a pill that focuses that terminal tab |
| permission prompt | the same, plus a one-time "switch to auto mode" nudge |
| every 5–10 min | wanders horizontally to check things out |
| 18:30 → 06:00, every 10 min | bounces and tells you to go home |

Requires **macOS** (see [Porting](#porting)) and Node 18+.

## Quick start

```sh
git clone https://github.com/pitahorn/claude-rocky-pet.git rocky-pet
cd rocky-pet
npm install
npm start
```

A pet appears in the bottom-right corner. Drag it where you want it; the spot is
remembered. Hover to reveal the **×** that quits it.

### Run it at login (macOS)

```sh
sed "s|__PET_DIR__|$PWD|g" install/com.rocky-pet.plist.template \
  > ~/Library/LaunchAgents/com.rocky-pet.plist
launchctl load -w ~/Library/LaunchAgents/com.rocky-pet.plist
```

`RunAtLoad` with no `KeepAlive`, so the **×** really quits for the session and
the pet comes back at the next login. Logs land in `/tmp/rocky-pet.{out,err}.log`.

```sh
launchctl kickstart -k gui/$(id -u)/com.rocky-pet   # restart after editing code
launchctl unload ~/Library/LaunchAgents/com.rocky-pet.plist   # disable
```

> Once launchd owns the process, restart with `kickstart` — `npm start` spawns a
> second, unmanaged pet.

## Poke it

```sh
bin/rocky jump|done|yay|dance|walk|nag|greet|idle|ball|hat [name]
```

The CLI writes `~/.rocky-pet/signal.json`; the app watches that file. Anything
that can write a JSON file can drive the pet — a cron job, a CI script, a git
hook.

## Wire it to Claude Code

Add to `~/.claude/settings.json` (adjust the path):

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command",
      "command": "$HOME/rocky-pet/hooks/rocky-ping.sh done" }] }],
    "Notification": [{ "hooks": [{ "type": "command",
      "command": "$HOME/rocky-pet/hooks/rocky-ping.sh jump" }] }],
    "SessionStart": [{ "matcher": "startup", "hooks": [{ "type": "command",
      "command": "$HOME/rocky-pet/hooks/rocky-ping.sh greet" }] }]
  }
}
```

`rocky-ping.sh` backgrounds itself and always exits 0, so it can never block or
fail a Claude turn. It also walks up the process tree to find the `claude`
process's tty, which is what lets a pill focus the exact terminal tab that
pinged. Hooks load on the next Claude Code session.

> The hook appends raw `Notification` payloads to `~/.rocky-pet/hook-debug.log`
> to confirm the `permission_prompt` field in the wild. Delete the
> "truth-capture" block in `hooks/rocky-ping.sh` if you don't want that.

## Make it your own

**Swap the character.** Replace `assets/*.gif` with your own three poses (idle/
base, a celebration, a bigger celebration). Sizes don't have to match: at boot
the app measures each GIF's actual character box off a canvas and scales every
pose so the character is `TARGET_CONTENT_PX` tall, bottom-aligned on a shared
baseline. Change the filenames in `GIF` + `NATIVE_SIZE` (`renderer/pet.js`) and
`ASSET_FILE` (`main.js`).

**Change the voice.** `renderer/pet.js` holds every string the pet can say:
`CATCHPHRASES` (hover), `BUBBLE_TEXT` (per action), `GREETINGS`, `NAGS`. They
address the owner by name — that name is yours to replace.

**Change the rhythm.** All timing is named constants at the top of `pet.js`:
`PHRASE_SHOW_MS` / `PHRASE_GAP_MS`, `WALK_MIN_MS` / `WALK_MAX_MS` /
`WALK_SPEED_PX_PER_S`, `HAT_ROTATE_MS`, `WORK_END_MIN` / `NIGHT_END_MIN` /
`NAG_INTERVAL_MS`, `SESSION_TTL_MS`.

**Add an action.** Four edits: the `VALID` set in `bin/rocky`, a `case` in
`handleAction()`, an entry in `BUBBLE_TEXT`, and — if it plays a new GIF — one
in `GIF` / `NATIVE_SIZE` / `TRANSIENT_MS` / `ASSET_FILE`.

**Drop the sphere.** `bin/rocky ball` toggles it at runtime; to remove it
entirely, delete `renderer/ball.js` + `renderer/hats.js`, their `<script>` tags,
and the `renderBall()` / `rollBall()` calls. Everything else is independent.

## How it works

```
CLI / Claude hook ──writes──▶ ~/.rocky-pet/signal.json {action, ts}
                                     │ fs.watch (+ 1s poll safety net)
                                     ▼
                        Electron main (main.js) ──IPC──▶ renderer
                                     ▼
                    transparent frameless window plays the reaction
```

| File | Owns |
|---|---|
| `main.js` | the window, the signal watcher, position + growth, prefs, terminal focus |
| `preload.js` | the only main↔renderer bridge (`contextIsolation: true`) |
| `renderer/pet.js` | behaviour: poses, bubbles, drag, walk, nag, session pills |
| `renderer/pet.css` | layout, the hop and the breathing |
| `renderer/ball.js` | the geodesic sphere (`window.RockyBall`) |
| `renderer/hats.js` | six hats and their accessories (`window.RockyHats`) |
| `bin/rocky` | the CLI that writes the signal file |
| `hooks/rocky-ping.sh` | Claude Code hook → CLI, plus tty/session detection |
| `CLAUDE.md` | the pet's voice + house rules, for a coding agent working in here |

State lives in `~/.rocky-pet/`: `signal.json` (the inbox), `position.json`
(where you dragged it), `prefs.json` (ball + hat).

## Invariants that will bite you

These are the ones that cost real debugging time. Break them and the symptom is
never obviously connected to the cause.

1. **Never resize the window under the pointer.** Growing it to fit a speech
   bubble makes the content re-anchor a frame late — the pet visibly jumps —
   and leaves Chromium hit-testing a stale pointer position, so `mouseenter` /
   `mouseleave` flicker in a self-sustaining loop. Reserve the tallest bubble
   permanently (`MAX_BUBBLE_PX`) and let the height stay constant. Width may
   grow rightward: that keeps the top-left fixed, so nothing shifts.
2. **Positions are base-rect coordinates, never window coordinates.** The window
   grows left and up for pills and nudges, so `getBasePosition()` /
   `setBasePosition()` in `main.js` translate every read and write. Talk to the
   window directly and a resize mid-drag desyncs the drag.
3. **The three renderer scripts share one global scope.** `ball.js` and
   `hats.js` are IIFE-wrapped and export a single `window.*` object each. A name
   collision is a fatal compile error that renders as a *silently blank window*.
4. **macOS reports neither event for a bottom-anchored resize.** Its window
   origin is bottom-left, so growing upward emits no `move`; programmatic
   `setBounds` on a non-resizable window emits no `resize` either. Log inside
   the reserve handler instead, and read live geometry from outside with:
   `osascript -e 'tell application "System Events" to tell process "Electron" to get {position, size} of window 1'`
5. **`ts` in the signal file must strictly increase** (`Date.now()`), and the app
   records the last `ts` at boot — otherwise every restart replays whatever
   action was last sent.
6. **Canvas pixel reads need the GIF as a `data:` URL.** A `file://` image taints
   the canvas and blocks `getImageData()`, which is how poses are measured — so
   `main.js` hands the bytes over IPC.
7. **A GIF `<img>` only replays from frame 0 if its `src` changes**, hence the
   cache-busting query string on one-shot poses.
8. **Elements inside a `-webkit-app-region: drag` region get no mouse events.**
   The pet's body is `.no-drag` on purpose: that is what lets the JS drag handler
   run, roll the ball and save the position.

## Porting

The Electron side is cross-platform; four things are macOS-specific:

- **launchd** autostart → systemd user unit / Startup folder shortcut.
- **`focusTerminalByTty()`** in `main.js` uses AppleScript against Apple Terminal
  — replace with your platform's window activation, or drop it (the pills still
  work as dismissable reminders).
- **`setVisibleOnAllWorkspaces`** behaves differently per platform.
- The **bottom-left window origin** noted in invariant 4 is a macOS trait.

## License

MIT — see [LICENSE](LICENSE). The GIF assets are the author's own artwork; bring
your own character if you fork this.
