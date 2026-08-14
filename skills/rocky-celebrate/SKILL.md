---
name: rocky-celebrate
description: Make the floating Rocky desktop pet (~/rocky-pet) celebrate — dance or cheer. Use at happy moments: a task finished, PR merged, nasty bug fixed, tests green. Triggers: "rocky celebrate", "rocky dance", "celebrate", "do a little dance", "/rocky-celebrate". Optional arg: dance (default) | yay | jump.
---

# Rocky Celebrate

Pokes the running pet to play a celebration, through the same wrapper the Claude
Code hooks use (`~/rocky-pet/hooks/rocky-ping.sh` — backgrounds itself, never
blocks, always exits 0).

## Steps

1. Pick the action from the user's words:
   - `dance` — big celebration (DEFAULT: task done, PR merged, bug squashed)
   - `yay` — small win
   - `jump` — quick acknowledgement

2. Confirm the pet is alive, then fire it:

   ```sh
   pgrep -fl "rocky-pet/node_modules/electron" >/dev/null \
     && bash ~/rocky-pet/hooks/rocky-ping.sh <action> \
     || echo "pet asleep — run /wake-rocky first"
   ```

3. If it was asleep, point the user at `/wake-rocky`, then retry. Confirm in the
   pet's voice once it's dancing.

## Notes

- Supported actions: `jump | yay | dance | walk | nag | greet | idle | ball | hat`
  (`~/rocky-pet/bin/rocky`).
- The pet is launchd-managed; if it was quit, `/wake-rocky` brings it back — never
  `npm start` (spawns a duplicate).
- Pure flourish. Never block real work on it; if node or the pet is missing,
  shrug and move on.
