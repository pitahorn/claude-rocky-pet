"use strict";

// --- Asset map ---------------------------------------------------------------
const GIF = {
  amaze: "../assets/rocky-amaze.gif",
  yay: "../assets/rocky-yay.gif",
  dance: "../assets/rocky-dance-yay.gif",
};

// Native pixel size of each gif (fallback before calibration runs).
const NATIVE_SIZE = { amaze: 93, yay: 80, dance: 80 };
const RENDER_SCALE = 1.29;

// The gifs frame Rocky at different sizes/heights inside their canvases, so a
// global scale can't line them up. Instead we measure each gif's actual
// character box (non-background pixels) at boot, then scale every pose so the
// character is TARGET_CONTENT_PX tall and bottom-align it to a shared baseline.
const TARGET_CONTENT_PX = 104; // on-screen character height across all poses
const ALPHA_THRESHOLD = 16; // pixel counts as "Rocky" above this alpha
const calibration = {}; // name -> { scale, bottom, dx }

// How long each transient animation plays before Rocky settles back to base.
const TRANSIENT_MS = {
  yay: 1700,
  dance: 3200,
};

const BUBBLE_TEXT = {
  yay: "yay!",
  dance: "FIXED!",
  jump: "Rocky need Pita input",
  done: "Rocky done!",
  ballOn: "Rocky in ball!",
  ballOff: "Rocky free!",
};
const BUBBLE_MS = 1500;
// Room kept above Rocky for the tallest bubble a message can wrap to. Reserved
// permanently: resizing the window under the pointer is what made him jump.
const MAX_BUBBLE_PX = 56;

// Rocky catchphrases — rotate through these while Pita hovers.
const CATCHPHRASES = [
  "AMAZE AMAZE AMAZE",
  "thumbs up, baby 👎🏼",
  "it is time go",
  "Rocky fix easy.",
  "Rocky build strong.",
  "plan good.",
  "fast fast fast",
  "happy happy happy",
  "Rocky ready.",
  "no die, Pita",
  "Pita Rocky save codebase!",
  "fist my bump 🤜🏼🤛🏼",
  "why you not commit, question?",
  "words of encouragement",
];
const PHRASE_SHOW_MS = 2600; // how long one catchphrase stays visible (+ animates)
const PHRASE_GAP_MS = 3800; // quiet, still pause before the next one
const PHRASE_FIRST_MS = 500; // small beat before the first chat on hover

// Every so often Rocky strolls horizontally to "check things out".
const WALK_MIN_MS = 5 * 60 * 1000; // earliest next wander
const WALK_MAX_MS = 10 * 60 * 1000; // latest next wander
const WALK_MIN_PX = 90; // shortest stroll distance
const WALK_MAX_PX = 240; // longest stroll distance
const WALK_SPEED_PX_PER_S = 55; // leisurely pace
const WALK_EDGE_MARGIN = 8; // keep this far from the screen edge

const HOP_MS = 620; // must match the .jump animation duration in pet.css

// After working hours, Rocky nags Pita to log off — 5 bounces every 10 minutes.
const WORK_END_MIN = 18 * 60 + 30; // 18:30
const NIGHT_END_MIN = 6 * 60; // 06:00 — after-hours runs 18:30 → 06:00
const NAG_INTERVAL_MS = 10 * 60 * 1000;
const NAG_BOUNCES = 5;
const NAGS = [
  "How long since last sleep, question?",
  "Time for Pita Rocky go home",
  "Pita need sleep. Rocky watch. Human brain stupid when no sleep",
];

// Shown with a hop when a new Claude session starts.
const GREETINGS = [
  "Rocky here!",
  "Pita back! Happy happy.",
  "Rocky ready, statement!",
  "it is time go",
  "Hello Pita! Rocky wait for you",
  "Rocky miss Pita",
  "Pita Rocky make code, baby 👎🏼",
];
const GREET_BUBBLE_MS = 2400;

// --- Elements ----------------------------------------------------------------
const rockyEl = document.getElementById("rocky");
const stillEl = document.getElementById("still");
const animEl = document.getElementById("anim");
const bubbleEl = document.getElementById("bubble");
const quitEl = document.getElementById("quit");
const sessionsEl = document.getElementById("sessions");
const autoNudgeEl = document.getElementById("autoNudge");
const autoNudgeBodyEl = document.getElementById("autoNudgeBody");
const autoNudgeCloseEl = document.getElementById("autoNudgeClose");

// --- State -------------------------------------------------------------------
let isHovering = false;
let transientTimer = null;
let bubbleTimer = null;
let hoverPhraseTimer = null;
let lastPhrase = null;
let facing = 1; // 1 = faces right, -1 = faces left (flips toward walk direction)
let lastGifName = "amaze";
let isWalking = false;
let walkTimer = null;

// --- Freeze trick ------------------------------------------------------------
// A GIF auto-plays. To show a *still* idle pose we paint frame 0 of the amaze
// gif onto a canvas once, then show that canvas when idle and swap to the live
// <img> gif on hover.
// Size + position a layer from its measured calibration (falls back to the
// global scale until calibration has run).
function sizeLayer(el, name) {
  const cal = calibration[name];
  const scale = cal ? cal.scale : RENDER_SCALE;
  const px = Math.round(NATIVE_SIZE[name] * scale);
  el.style.width = `${px}px`;
  el.style.height = `${px}px`;
  // bodyLift floats him off the ground into the middle of the ball; it is 0
  // whenever he's walking on his own feet.
  el.style.bottom = `${(cal ? cal.bottom : 0) + bodyLift}px`;
  el.style.transform = `translateX(calc(-50% + ${cal ? cal.dx : 0}px)) scaleX(${facing})`;
}

function reapplyLayerTransforms() {
  sizeLayer(stillEl, "amaze");
  sizeLayer(animEl, lastGifName);
}

function setFacing(direction) {
  if (facing === direction) return;
  facing = direction;
  reapplyLayerTransforms();
}

// Measure one gif's character box off an offscreen canvas. Returns the scale
// (so the character is TARGET_CONTENT_PX tall), the bottom offset (so the
// character's feet sit on the baseline), and a horizontal nudge (so the
// character is centered by its body, not its frame).
const measureCanvas = document.createElement("canvas");

async function measurePose(name) {
  const dataUrl = await window.rocky.getAssetData(name);
  if (!dataUrl) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      measureCanvas.width = w;
      measureCanvas.height = h;
      const ctx = measureCanvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, w, h);

      // Transparent bg → use alpha; opaque bg → key against the corner color.
      const transparentBg = data[3] < 200;
      const bg = [data[0], data[1], data[2]];
      let minX = w;
      let minY = h;
      let maxX = 0;
      let maxY = 0;
      let found = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          let isRocky;
          if (transparentBg) {
            isRocky = data[i + 3] > ALPHA_THRESHOLD;
          } else {
            const dr = data[i] - bg[0];
            const dg = data[i + 1] - bg[1];
            const db = data[i + 2] - bg[2];
            isRocky = dr * dr + dg * dg + db * db > 1200;
          }
          if (isRocky) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (!found) {
        resolve({ scale: RENDER_SCALE, bottom: 0, dx: 0, width: 0, height: 0 });
        return;
      }
      const contentHeight = maxY - minY + 1;
      const scale = TARGET_CONTENT_PX / contentHeight;
      const padBelow = h - 1 - maxY; // native px below the feet
      const contentCenterX = (minX + maxX) / 2;
      resolve({
        scale,
        bottom: -Math.round(padBelow * scale), // drop feet to the baseline
        dx: Math.round((w / 2 - contentCenterX) * scale), // center by body
        // On-screen size of the character itself — the ball seats him by this.
        width: (maxX - minX + 1) * scale,
        height: contentHeight * scale,
      });
    };
    img.src = dataUrl;
  });
}

async function calibrate() {
  for (const name of ["amaze", "yay", "dance"]) {
    const cal = await measurePose(name);
    if (cal) calibration[name] = cal;
  }
  // Re-apply now that the real measurements exist.
  sizeLayer(stillEl, "amaze");
  settleToBase();
}

function paintFrozenFrame() {
  const ctx = stillEl.getContext("2d");
  const frame = new Image();
  frame.onload = () => {
    stillEl.width = frame.naturalWidth;
    stillEl.height = frame.naturalHeight;
    ctx.clearRect(0, 0, stillEl.width, stillEl.height);
    ctx.drawImage(frame, 0, 0);
  };
  frame.src = GIF.amaze;
  sizeLayer(stillEl, "amaze");
}

// --- Display helpers ---------------------------------------------------------
function showFrozen() {
  animEl.classList.add("hidden");
  stillEl.classList.remove("hidden");
  rockyEl.classList.add("breathing");
}

function showGif(name, { restart = false } = {}) {
  const base = GIF[name];
  lastGifName = name;
  sizeLayer(animEl, name);
  // Cache-bust to restart one-shot gifs (yay/dance) from frame 0 each time.
  animEl.src = restart ? `${base}?t=${Date.now()}` : base;
  stillEl.classList.add("hidden");
  animEl.classList.remove("hidden");
  rockyEl.classList.remove("breathing");
}

// Rocky's resting visual is always the still frame now — the gif only animates
// during a transient action or while a hover catchphrase is on screen.
function settleToBase() {
  showFrozen();
}

// Something is driving Rocky — an action, a walk, Pita's hand, or a sentence he
// is halfway through. Only a Rocky with nothing to do goes still.
function settleIfIdle() {
  if (transientTimer || isWalking || isDragging) return;
  if (bubbleEl.classList.contains("show")) return;
  showFrozen();
}

// The window already holds MAX_BUBBLE_PX of room, so showing or hiding a bubble
// never resizes it — Rocky stays put and his hover state stays honest.
function setBubble(text) {
  bubbleEl.textContent = text;
  bubbleEl.classList.add("show");
}

function hideBubble() {
  bubbleEl.classList.remove("show");
}

// A transient bubble (click/ping/dance/nag) that auto-hides after a beat.
function showBubble(text, duration = BUBBLE_MS) {
  if (!text) return;
  clearTimeout(bubbleTimer);
  setBubble(text);
  bubbleTimer = setTimeout(hideBubble, duration);
}

function pickPhrase() {
  let phrase;
  do {
    phrase = CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)];
  } while (phrase === lastPhrase && CATCHPHRASES.length > 1);
  lastPhrase = phrase;
  return phrase;
}

// While hovering, show a catchphrase, hide it, pause, then show the next —
// a calm show/rest rhythm rather than a constant ticker.
function startHoverPhrases() {
  clearTimeout(bubbleTimer);
  scheduleNextPhrase(PHRASE_FIRST_MS);
}

function scheduleNextPhrase(delay) {
  clearTimeout(hoverPhraseTimer);
  hoverPhraseTimer = setTimeout(() => {
    if (!isHovering) return;
    if (transientTimer || isWalking) {
      scheduleNextPhrase(PHRASE_GAP_MS); // let yay/dance/ping/walk finish first
      return;
    }
    // Talk: pop the bubble AND animate the gif together...
    setBubble(pickPhrase());
    showGif("amaze");
    hoverPhraseTimer = setTimeout(() => {
      hideBubble();
      settleIfIdle(); // a walk/drag/transient may have taken over mid-phrase
      scheduleNextPhrase(PHRASE_GAP_MS);
    }, PHRASE_SHOW_MS);
  }, delay);
}

function stopHoverPhrases() {
  clearTimeout(hoverPhraseTimer);
  hoverPhraseTimer = null;
  hideBubble();
}

// --- Actions -----------------------------------------------------------------
function playTransientGif(name, durationMs) {
  clearTimeout(transientTimer);
  showGif(name, { restart: true });
  transientTimer = setTimeout(() => {
    transientTimer = null;
    settleToBase();
  }, durationMs);
}

function doJump() {
  // Keep the amaze base, just pop it.
  if (!transientTimer) settleToBase();
  // The idle "breathing" animation out-specifies the hop in CSS, so it must be
  // removed for the duration of the hop or it swallows it.
  rockyEl.classList.remove("breathing", "jump");
  void rockyEl.offsetWidth; // force reflow so the animation restarts
  rockyEl.classList.add("jump");
  rockyEl.addEventListener(
    "animationend",
    () => {
      rockyEl.classList.remove("jump");
      if (!transientTimer) settleToBase(); // re-arm breathing if idle
    },
    { once: true },
  );
}

function handleAction(action, arg) {
  switch (action) {
    case "yay":
      showBubble(BUBBLE_TEXT.yay);
      playTransientGif("yay", TRANSIENT_MS.yay);
      break;
    case "dance":
      showBubble(BUBBLE_TEXT.dance);
      playTransientGif("dance", TRANSIENT_MS.dance);
      break;
    case "jump":
    case "ping":
      showBubble(BUBBLE_TEXT.jump);
      doJump();
      break;
    case "done":
      showBubble(BUBBLE_TEXT.done);
      doJump();
      break;
    case "greet":
      showBubble(GREETINGS[Math.floor(Math.random() * GREETINGS.length)], GREET_BUBBLE_MS);
      doJump();
      break;
    case "walk":
      startWalk(true); // explicit request — walk even if hovering
      break;
    case "nag":
      doNag();
      break;
    case "ball":
      setBall(!ballOn);
      showBubble(ballOn ? BUBBLE_TEXT.ballOn : BUBBLE_TEXT.ballOff);
      break;
    case "hat":
      if (!ballOn) setBall(true);
      wearHat(arg || pickAnotherHat());
      break;
    case "idle":
      settleToBase();
      break;
    default:
      break;
  }
}

// --- Session "jump to terminal" buttons --------------------------------------
// When a Claude session pings (done / needs-input), drop a button that focuses
// that session's Terminal tab. Buttons self-expire and stack above Rocky; the
// window grows upward (bottom-anchored) to fit them.
const SESSION_TTL_MS = 2 * 60 * 1000;
const SESSION_ACTIONS = new Set(["done", "jump", "ping"]);
const PROMPT_GLYPH = ">_";
// Pill status text per action — mirrors Rocky's bubble vibe ("Done!" / needs
// input), so a pill reads like "auth screen: Needs input".
const SESSION_STATUS = {
  done: "Done",
  jump: "Needs input",
  ping: "Needs input",
};
const sessions = new Map(); // tty -> { el, labelEl, timer }

function sessionText(title, action) {
  const status = SESSION_STATUS[action] || "";
  if (title && status) return `${title}: ${status}`;
  return title || status || "session";
}

// The stack lives to Rocky's RIGHT and grows upward. These must match the
// CSS anchors (.sessions left/bottom) so the reserve math lines up.
const SESSIONS_LEFT_PX = 220; // pills start clear of Rocky's body
const SESSIONS_BOTTOM_PX = 30; // lowest pill sits beside Rocky's lower body
const BASE_WIDTH = 300;
const BASE_HEIGHT = 220;
const RESERVE_MARGIN = 10;

// Single source of truth for how much room the window needs past its base: the
// session stack grows it right + up, the auto-mode nudge grows it left. Also
// drives --shift-x so the base content stays pinned through leftward growth.
// (0, 0, 0) collapses the window back to base size.
function updateReserve() {
  let right = 0;
  let top = 0;
  if (sessions.size) {
    right = Math.max(0, SESSIONS_LEFT_PX + sessionsEl.offsetWidth + RESERVE_MARGIN - BASE_WIDTH);
    top = Math.max(0, SESSIONS_BOTTOM_PX + sessionsEl.offsetHeight + RESERVE_MARGIN - BASE_HEIGHT);
  }
  // A hat stands a good half-diameter above the sphere and the bubble sits above
  // the hat, both overshooting the base window — grow upward to fit them.
  top = Math.max(top, headroomAboveRocky() + RESERVE_MARGIN - BASE_HEIGHT);
  top = Math.max(0, top);
  const left = autoNudgeLeftReserve;
  document.documentElement.style.setProperty("--shift-x", `${left}px`);
  window.rocky.reserve(right, top, left);
}

function removeSession(tty) {
  const entry = sessions.get(tty);
  if (!entry) return;
  clearTimeout(entry.timer);
  entry.el.remove();
  sessions.delete(tty);
  updateReserve();
}

function addSession(tty, label, action) {
  const text = sessionText(label || tty, action);
  let entry = sessions.get(tty);
  if (entry) {
    // Same tab pinged again — refresh the status, reset the timer, float to the
    // bottom of the stack (nearest Rocky, where the freshest one belongs).
    clearTimeout(entry.timer);
    entry.labelEl.textContent = text;
    sessionsEl.appendChild(entry.el);
  } else {
    const el = document.createElement("button");
    el.className = "session no-drag";
    el.title = "jump to this terminal";

    const icon = document.createElement("span");
    icon.className = "session-icon";
    icon.textContent = PROMPT_GLYPH;

    const labelEl = document.createElement("span");
    labelEl.className = "session-label";
    labelEl.textContent = text;

    el.append(icon, labelEl);
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      window.rocky.focusTerminal(tty);
      removeSession(tty);
    });
    sessionsEl.appendChild(el);

    entry = { el, labelEl, timer: null };
    sessions.set(tty, entry);
  }
  entry.timer = setTimeout(() => removeSession(tty), SESSION_TTL_MS);
  updateReserve();
}

// --- "Forgot auto-mode?" nudge -----------------------------------------------
// A permission_prompt notification means the session stopped to ask — i.e. it
// is NOT in auto mode. Surface a warm, dismissable nudge to Rocky's left, once
// per session. There is no way to flip a running session's mode from outside,
// so the click just focuses that terminal tab (Pita hits Shift+Tab there).
const AUTO_NUDGE_TTL_MS = 30 * 1000; // lingers a bit, then fades on its own
const ROCKY_BOX_LEFT = 90; // .rocky left edge in base-window coords (see pet.css)
const AUTO_NUDGE_GAP = 12; // space between the nudge's right edge and Rocky
const AUTO_NUDGE_MARGIN = 10; // keep the nudge clear of the window's left edge

const autoNudgeShownSessions = new Set(); // never nudge the same session twice
let autoNudgeVisible = false;
let autoNudgeLeftReserve = 0; // px the window grows left to fit the nudge
let autoNudgeTty = null; // terminal to focus when the nudge is clicked
let autoNudgeTimer = null;

// Place the nudge just left of Rocky and reserve exactly the leftward growth it
// needs (0 if it already fits in the gutter left of Rocky's body).
function positionAutoNudge() {
  const width = autoNudgeEl.offsetWidth;
  const left = Math.max(0, width + AUTO_NUDGE_GAP + AUTO_NUDGE_MARGIN - ROCKY_BOX_LEFT);
  autoNudgeLeftReserve = left;
  // Right edge sits AUTO_NUDGE_GAP left of Rocky's (shifted) body box.
  autoNudgeEl.style.left = `${ROCKY_BOX_LEFT + left - AUTO_NUDGE_GAP - width}px`;
  updateReserve();
}

function showAutoNudge(sessionId, tty) {
  if (!sessionId || autoNudgeShownSessions.has(sessionId)) return;
  autoNudgeShownSessions.add(sessionId);
  autoNudgeTty = tty || null;
  autoNudgeVisible = true;
  autoNudgeEl.classList.remove("hidden");
  // Measure after layout so the width is real, then position + reserve.
  requestAnimationFrame(positionAutoNudge);
  clearTimeout(autoNudgeTimer);
  autoNudgeTimer = setTimeout(hideAutoNudge, AUTO_NUDGE_TTL_MS);
}

function hideAutoNudge() {
  clearTimeout(autoNudgeTimer);
  if (!autoNudgeVisible) return;
  autoNudgeVisible = false;
  autoNudgeTty = null;
  autoNudgeLeftReserve = 0;
  autoNudgeEl.classList.add("hidden");
  updateReserve();
}

// --- The ball ----------------------------------------------------------------
// Rocky's Eridian sphere. It rides inside .rocky, so it inherits his breathing,
// his hop and his walk for free; only the roll has to be driven by hand.
const BALL_DIAMETER_PX = 164;
const BALL_FREQUENCY = 1; // plain icosahedron — 30 struts read cleanest at this size
const ROCKY_BOTTOM_PX = 14; // must match .rocky bottom in pet.css
const BUBBLE_GAP_PX = 8; // clearance between the tallest hat and the speech bubble
const BUBBLE_IDLE_TOP_PX = 6; // .bubble top when there is no ball to clear

// Rocky changes hat on his own every few hours, so the ball never gets stale.
// Checked against the wall clock rather than counted down, so a pet restart or a
// closed laptop lid can't quietly reset the wait — same reason startNagWatch polls.
const HAT_ROTATE_MS = 3 * 60 * 60 * 1000;
const HAT_CHECK_MS = 5 * 60 * 1000;

let ball = null;
let ballOn = true;
let hatName = "tophat";
let hatSince = Date.now(); // when the current hat went on, for the rotation clock
let bodyLift = 0; // px Rocky floats above the baseline to sit inside the sphere
let ballTopPx = 0; // tallest point of ball + hat, measured from Rocky's baseline
let ballParts = [];
let hatTimer = null;

function clearBall() {
  for (const el of ballParts) el.remove();
  ballParts = [];
  ball = null;
  bodyLift = 0;
  ballTopPx = 0;
}

// Where the speech bubble has to sit to clear whatever Rocky is wearing. Anchored
// from the bottom so it stays glued to him when the window grows upward.
function positionBubble() {
  if (!ballTopPx) {
    bubbleEl.style.top = `${BUBBLE_IDLE_TOP_PX}px`;
    bubbleEl.style.bottom = "auto";
    return;
  }
  bubbleEl.style.top = "auto";
  bubbleEl.style.bottom = `${ROCKY_BOTTOM_PX + ballTopPx + BUBBLE_GAP_PX}px`;
}

function layerTop(el) {
  return parseFloat(el.style.bottom || 0) + Number(el.getAttribute("height"));
}

// Tallest point the window has to cover, measured from its bottom edge: ball,
// hat, and the room a bubble may need. Constant on purpose — a height that
// tracked the visible bubble resized the window under the pointer.
function headroomAboveRocky() {
  if (!ballTopPx) return 0; // no ball: the bubble fits inside the base window
  return ROCKY_BOTTOM_PX + ballTopPx + BUBBLE_GAP_PX + MAX_BUBBLE_PX;
}

function renderBall() {
  clearBall();
  if (!ballOn || !calibration.amaze) {
    reapplyLayerTransforms();
    positionBubble();
    updateReserve();
    return;
  }

  ball = window.RockyBall.createBall({
    diameter: BALL_DIAMETER_PX,
    frequency: BALL_FREQUENCY,
  });
  for (const half of [ball.back, ball.front]) {
    half.style.bottom = `${-ball.pad}px`;
    half.style.marginLeft = `${-ball.size / 2}px`;
    ballParts.push(half);
  }
  for (const worn of [
    window.RockyHats.createHat(hatName, { diameter: BALL_DIAMETER_PX }),
    window.RockyHats.createAccessory(hatName, { diameter: BALL_DIAMETER_PX }),
  ]) {
    if (worn) ballParts.push(worn);
  }
  for (const el of ballParts) rockyEl.appendChild(el);

  bodyLift = ball.radius - calibration.amaze.height / 2;
  ballTopPx = Math.max(...ballParts.map(layerTop));
  reapplyLayerTransforms();
  positionBubble();
  updateReserve();
}

function rollBall(px) {
  if (ball) ball.rollByPixels(px);
}

function savePrefs() {
  window.rocky.savePrefs({ ballOn, hat: hatName, hatSince });
}

function setBall(on) {
  ballOn = on;
  renderBall();
  savePrefs();
}

function wearHat(name) {
  if (!window.RockyHats.HAT_NAMES.includes(name)) return;
  hatName = name;
  hatSince = Date.now();
  renderBall();
  savePrefs();
}

function pickAnotherHat() {
  const others = window.RockyHats.HAT_NAMES.filter((name) => name !== hatName);
  return others[Math.floor(Math.random() * others.length)];
}

function rotateHatIfDue() {
  if (ballOn && Date.now() - hatSince >= HAT_ROTATE_MS) wearHat(pickAnotherHat());
}

function startHatRotation() {
  clearInterval(hatTimer);
  rotateHatIfDue(); // an overnight sleep may already have earned a new hat
  hatTimer = setInterval(rotateHatIfDue, HAT_CHECK_MS);
}

// --- Wandering ---------------------------------------------------------------
function isBusy() {
  return pointerDown || isHovering || transientTimer !== null || isWalking;
}

function scheduleWalk() {
  clearTimeout(walkTimer);
  const delay = WALK_MIN_MS + Math.random() * (WALK_MAX_MS - WALK_MIN_MS);
  walkTimer = setTimeout(startWalk, delay);
}

// forced = explicit request (double-click / CLI); ignores the hover guard, since
// Pita is necessarily hovering when double-clicking. Auto-walks still defer.
async function startWalk(forced = false) {
  if (isWalking || transientTimer) {
    if (!forced) scheduleWalk();
    return;
  }
  if (!forced && (pointerDown || isHovering)) {
    scheduleWalk(); // Pita's interacting — try again later
    return;
  }
  // Base coords: the window's own width includes growth Rocky doesn't stand in.
  const [x, y] = await window.rocky.getWindowPos();
  const availLeft = window.screen.availLeft || 0;
  const minX = availLeft + WALK_EDGE_MARGIN;
  const maxX = availLeft + window.screen.availWidth - BASE_WIDTH - WALK_EDGE_MARGIN;

  // Pick a direction (away from a nearby edge) and a distance.
  let direction;
  if (x <= minX + 20) direction = 1;
  else if (x >= maxX - 20) direction = -1;
  else direction = Math.random() < 0.5 ? -1 : 1;
  const distance = WALK_MIN_PX + Math.random() * (WALK_MAX_PX - WALK_MIN_PX);
  const targetX = Math.max(minX, Math.min(maxX, x + direction * distance));

  const realDistance = Math.abs(targetX - x);
  if (realDistance < 12) {
    scheduleWalk(); // nowhere to go — penned in against an edge
    return;
  }

  isWalking = true;
  setFacing(targetX < x ? -1 : 1);
  const duration = (realDistance / WALK_SPEED_PX_PER_S) * 1000;
  const startX = x;

  function beginMotion() {
    const startTime = performance.now();
    let lastX = startX;
    function step(now) {
      if (!isWalking) return;
      if (pointerDown || transientTimer || (!forced && isHovering)) {
        finishWalk(); // human (or a ping) took over — stop gracefully
        return;
      }
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
      const nextX = Math.round(startX + (targetX - startX) * eased);
      rollBall(nextX - lastX); // the cage turns by the ground it actually covered
      lastX = nextX;
      window.rocky.moveWindow(nextX, y);
      if (t < 1) requestAnimationFrame(step);
      else finishWalk();
    }
    requestAnimationFrame(step);
  }

  // Restart the gif from frame 0 so its loop plays for the whole walk (re-showing
  // the same src would freeze on the last frame), and start the slide only once
  // that first frame has painted — so the animation and the movement begin
  // together instead of Rocky sliding ahead of a not-yet-shown gif.
  let motionStarted = false;
  const startOnce = () => {
    if (motionStarted) return;
    motionStarted = true;
    beginMotion();
  };
  animEl.addEventListener("load", startOnce, { once: true });
  showGif("amaze", { restart: true });
  setTimeout(startOnce, 120); // fallback if the load event is missed (cached)
}

function finishWalk() {
  isWalking = false;
  setFacing(1);
  if (!transientTimer && !isHovering) showFrozen();
  window.rocky.savePosition(); // remember where he wandered to
  scheduleWalk();
}

// --- After-hours nag ---------------------------------------------------------
function isAfterHours() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= WORK_END_MIN || minutes < NIGHT_END_MIN;
}

function bounceTimes(count) {
  let done = 0;
  function one() {
    if (done >= count) return;
    done += 1;
    doJump();
    setTimeout(one, HOP_MS);
  }
  one();
}

function doNag() {
  if (isBusy()) return false; // don't nag over the human or an action
  const text = NAGS[Math.floor(Math.random() * NAGS.length)];
  showBubble(text, NAG_BOUNCES * HOP_MS + 800);
  bounceTimes(NAG_BOUNCES);
  return true;
}

let wasAfterHours = false;
let lastNagTs = 0;

// 1-minute watchdog: nag right at the 18:30 edge, then every 10 min after.
// Polling beats a setTimeout-to-18:30 because it self-heals if the laptop
// slept through the boundary — on wake it sees the edge and nags.
function startNagWatch() {
  wasAfterHours = isAfterHours();
  setInterval(() => {
    const after = isAfterHours();
    const now = Date.now();
    const crossedInto = after && !wasAfterHours; // just hit 18:30
    const dueAgain = after && now - lastNagTs >= NAG_INTERVAL_MS;
    if ((crossedInto || dueAgain) && doNag()) lastNagTs = now;
    wasAfterHours = after;
  }, 60 * 1000);
}

// --- Wiring ------------------------------------------------------------------
rockyEl.addEventListener("mouseenter", () => {
  isHovering = true;
  startHoverPhrases(); // stays still; the gif only animates when a bubble pops
});

rockyEl.addEventListener("mouseleave", () => {
  isHovering = false;
  stopHoverPhrases();
  // A walk or a fast drag slides Rocky out from under the cursor, firing
  // mouseleave mid-motion — don't freeze the gif then.
  settleIfIdle();
});

// Drag to reposition, double-click to play "yay" — kept as separate gestures so
// a drag never accidentally triggers "yay" and vice versa. The small threshold
// keeps a jittery double-click from registering as a 1px drag.
const DRAG_THRESHOLD_PX = 4;
let pointerDown = false;
let isDragging = false;
let startScreenX = 0;
let startScreenY = 0;
let windowStart = null;
let lastDragX = 0;

rockyEl.addEventListener("mousedown", async (event) => {
  if (event.button !== 0) return; // left button only
  pointerDown = true;
  isDragging = false;
  startScreenX = event.screenX;
  startScreenY = event.screenY;
  windowStart = await window.rocky.getWindowPos();
  lastDragX = windowStart[0];
});

window.addEventListener("mousemove", (event) => {
  if (!pointerDown || !windowStart) return;
  const dx = event.screenX - startScreenX;
  const dy = event.screenY - startScreenY;
  if (!isDragging && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
    isDragging = true;
    rockyEl.classList.add("dragging");
    // Legs move for the whole ride, not only while a catchphrase happens to be
    // up. Restart so the loop plays from frame 0 like a walk does.
    if (!transientTimer) showGif("amaze", { restart: true });
  }
  if (!isDragging) return;
  const nextX = windowStart[0] + dx;
  rollBall(nextX - lastDragX); // dragged across the desk, so the ball rolls too
  lastDragX = nextX;
  window.rocky.moveWindow(nextX, windowStart[1] + dy);
});

window.addEventListener("mouseup", () => {
  if (!pointerDown) return;
  pointerDown = false;
  rockyEl.classList.remove("dragging");
  if (isDragging) window.rocky.savePosition(); // remember the new spot
  isDragging = false;
  windowStart = null;
  settleIfIdle(); // feet back on the ground
});

// Double-click: 50/50 between a "yay" and a little stroll.
rockyEl.addEventListener("dblclick", () => {
  handleAction(Math.random() < 0.5 ? "yay" : "walk");
});

// Final guard against the OS starting a native image drag-and-drop.
window.addEventListener("dragstart", (event) => event.preventDefault());

quitEl.addEventListener("click", () => window.rocky.quit());

// Click the nudge → jump to that session's terminal (Pita flips the mode there).
autoNudgeBodyEl.addEventListener("click", (event) => {
  event.stopPropagation();
  if (autoNudgeTty) window.rocky.focusTerminal(autoNudgeTty);
  hideAutoNudge();
});

// × → dismiss without jumping. Once-per-session is already guaranteed by the
// shown-sessions set, so no extra bookkeeping needed here.
autoNudgeCloseEl.addEventListener("click", (event) => {
  event.stopPropagation();
  hideAutoNudge();
});

// External pings from the CLI / Claude Code hooks.
window.rocky.onAction(({ action, arg, tty, label, sessionId }) => {
  // A permission prompt keeps its usual hop + right-side pill (treated as a
  // "needs input" ping) AND raises the one-time "switch to auto mode" nudge.
  if (action === "permreq") {
    handleAction("jump");
    if (tty) addSession(tty, label, "jump");
    showAutoNudge(sessionId, tty);
    return;
  }
  handleAction(action, arg);
  if (tty && SESSION_ACTIONS.has(action)) addSession(tty, label, action);
});

// --- Boot --------------------------------------------------------------------
async function boot() {
  const prefs = await window.rocky.getPrefs();
  if (typeof prefs.ballOn === "boolean") ballOn = prefs.ballOn;
  if (window.RockyHats.HAT_NAMES.includes(prefs.hat)) hatName = prefs.hat;
  if (typeof prefs.hatSince === "number") hatSince = prefs.hatSince;

  paintFrozenFrame();
  showFrozen();
  await calibrate(); // measures Rocky's body, which the ball is sized against
  renderBall();
  startHatRotation();
  scheduleWalk();
  startNagWatch();
}

boot();
