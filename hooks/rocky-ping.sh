#!/bin/bash
# Claude Code hook -> pokes the floating Rocky pet.
# Usage: rocky-ping.sh [jump|yay|dance|idle]   (defaults to jump)
#
# Designed to NEVER block or fail Claude Code: runs in the background and
# always exits 0, even if node isn't found.
#
# Also captures WHICH terminal this Claude session lives in, so the pet can
# show a "jump to that tab" button. Claude runs hooks detached (no controlling
# tty), but the parent `claude` process IS attached to the Terminal tab's tty —
# so we walk up the process tree to find it. The cwd (+ git branch) becomes a
# human label. Both are best-effort; missing them just means no button.

ACTION="${1:-jump}"
ROCKY_BIN="$HOME/rocky-pet/bin/rocky"

# --- session title: CLAUDE_SESSION_TITLE, else the project folder name --------
# The pet pairs this with a status ("Done" / "Needs input") to label the pill,
# e.g. "auth screen: Needs input". Set CLAUDE_SESSION_TITLE when launching the
# session for a meaningful title; otherwise it falls back to the repo name.
PAYLOAD=$(cat 2>/dev/null)
CWD=""
SESSION_ID=""
NOTIF_TYPE=""
MESSAGE=""
if command -v jq >/dev/null 2>&1; then
  CWD=$(printf '%s' "$PAYLOAD" | jq -r '.cwd // empty' 2>/dev/null)
  SESSION_ID=$(printf '%s' "$PAYLOAD" | jq -r '.session_id // empty' 2>/dev/null)
  NOTIF_TYPE=$(printf '%s' "$PAYLOAD" | jq -r '.notification_type // empty' 2>/dev/null)
  MESSAGE=$(printf '%s' "$PAYLOAD" | jq -r '.message // empty' 2>/dev/null)
fi
CWD="${CWD:-$PWD}"
LABEL="${CLAUDE_SESSION_TITLE:-$(basename "$CWD")}"

# --- truth-capture (temporary) -----------------------------------------------
# The Notification payload's exact field names weren't documented, so log the
# raw JSON of Notification events to confirm `notification_type` / `session_id`
# (and the precise `permission_prompt` string) against reality. Gated to
# notification events to stay quiet. Remove this block once a real
# permission_prompt is confirmed in ~/.rocky-pet/hook-debug.log.
if [ -n "$NOTIF_TYPE" ] || [ -n "$MESSAGE" ]; then
  mkdir -p "$HOME/.rocky-pet" 2>/dev/null
  printf '%s\n' "$PAYLOAD" >> "$HOME/.rocky-pet/hook-debug.log" 2>/dev/null
fi

# --- "forgot auto-mode?" nudge -----------------------------------------------
# A session in auto mode never asks for permission, so a permission_prompt
# notification means it's in a mode that stops to ask. Upgrade the ping to
# `permreq` so the pet shows a one-time, dismissable "switch to auto mode"
# nudge (additive: it still hops + drops the usual right-side pill). Prefer the
# structured notification_type; fall back to the message text if it's absent.
if [ "$NOTIF_TYPE" = "permission_prompt" ] || printf '%s' "$MESSAGE" | grep -qi "permission"; then
  ACTION="permreq"
fi

# --- session tty: walk up to the `claude` ancestor, read its tty --------------
ROCKY_TTY=""
pid=$PPID
for _ in $(seq 1 15); do
  line=$(ps -o ppid=,tty=,comm= -p "$pid" 2>/dev/null) || break
  [ -z "$line" ] && break
  read -r ppid tty comm <<< "$line"
  case "$comm" in
    *claude*)
      # Only attach a real Terminal device (ttysNNN). Headless / forked /
      # by-product claude processes have tty "??" — skip them so they never
      # produce a phantom "jump to terminal" button.
      case "$tty" in
        ttys[0-9]*) ROCKY_TTY="$tty" ;;
      esac
      break
      ;;
  esac
  pid="$ppid"
  { [ "$pid" = "1" ] || [ -z "$pid" ]; } && break
done

NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ]; then
  # nvm installs don't export node onto the hook's PATH — grab the newest.
  NODE_BIN="$(ls -t "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | head -1)"
fi

if [ -n "$NODE_BIN" ] && [ -f "$ROCKY_BIN" ]; then
  ROCKY_TTY="$ROCKY_TTY" ROCKY_LABEL="$LABEL" ROCKY_SESSION="$SESSION_ID" "$NODE_BIN" "$ROCKY_BIN" "$ACTION" >/dev/null 2>&1 &
fi

exit 0
