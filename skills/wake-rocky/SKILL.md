---
name: wake-rocky
description: Wake up the floating Rocky desktop pet after it was quit (e.g. the user clicked the × button). Restarts the launchd-managed pet at ~/rocky-pet so it reappears in the screen corner. Triggers: "wake rocky", "bring rocky back", "rocky gone", "restart the pet", "/wake-rocky".
---

# Wake Rocky

The floating pet (`~/rocky-pet`) is managed by the launchd agent `com.rocky-pet`
(no `KeepAlive`, so the × button quits it for the session). This skill brings it
back without a reboot.

## Steps

1. Kickstart the agent (restarts a running one too):

   ```sh
   launchctl kickstart -k gui/$(id -u)/com.rocky-pet
   ```

2. If that errors with "No such process", the agent isn't loaded — load it, which
   also starts it:

   ```sh
   launchctl load -w ~/Library/LaunchAgents/com.rocky-pet.plist
   ```

3. Verify it's alive, then tell the user to check the corner:

   ```sh
   sleep 4 && pgrep -fl "rocky-pet/node_modules/electron" | head -1
   ```

   - A process prints → the pet is awake. Confirm in its voice.
   - Nothing prints → read `/tmp/rocky-pet.err.log` and report the failure.

## Notes

- Do **not** wake it with `npm start` — launchd owns the process, and a manual
  start spawns an unmanaged duplicate (two pets).
- Optional flourish: once it's up, fire `node ~/rocky-pet/bin/rocky done` so the
  user sees it react.
